// bingo_client_live.js
(function () {
  const TAG = "[BINGO]";
  const BINGO_CLIENT_VERSION = "2026-03-13-1";

  const protocol = location.protocol === "https:" ? "wss:" : "ws:";
  const WS_URL = `${protocol}//${location.host}/ws`;

  let ws = null;
  let joinedCode = null;
  let joinedOk = false;
  let connecting = false;
  let reconnectTimer = null;
  let cachedUUID = null;

  function log(...args) { console.log(TAG, ...args); }
  function warn(...args) { console.warn(TAG, ...args); }
  function err(...args) { console.error(TAG, ...args); }

  function safeUpper6(s) {
    return String(s || "").toUpperCase().replace(/[^0-9A-Z]/g, "").slice(0, 6);
  }

  function isUuidLike(value) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ""));
  }

  function getStoredCode() {
    const primary = safeUpper6(localStorage.getItem("bingoJoinedCode") || "");
    if (primary.length === 6) return primary;

    const legacy = safeUpper6(localStorage.getItem("bingoCode") || "");
    if (legacy.length === 6) {
      localStorage.setItem("bingoJoinedCode", legacy);
      return legacy;
    }

    return "";
  }

  function getPlayerName() {
    const n = (
      localStorage.getItem("username") ||
      localStorage.getItem("playerName") ||
      localStorage.getItem("name") ||
      ""
    ).trim();
    return n || "Ash";
  }

  function getPlayerIcon() {
    return (localStorage.getItem("playerIcon") || "").replace(/^"|"$/g, "").trim();
  }

  async function getUUIDSafe() {
    if (cachedUUID) return cachedUUID;

    try {
      if (typeof window.getOrCreateUUID === "function") {
        const maybe = window.getOrCreateUUID();

        if (typeof maybe === "string" && isUuidLike(maybe)) return (cachedUUID = maybe);

        if (maybe && typeof maybe.then === "function") {
          const resolved = await maybe;

          if (typeof resolved === "string" && isUuidLike(resolved)) return (cachedUUID = resolved);
          if (resolved && typeof resolved.uuid === "string" && isUuidLike(resolved.uuid)) return (cachedUUID = resolved.uuid);
        }

        if (maybe && typeof maybe === "object" && typeof maybe.uuid === "string" && isUuidLike(maybe.uuid)) {
          return (cachedUUID = maybe.uuid);
        }
      }

      const candidates = [
        localStorage.getItem("uuid"),
        localStorage.getItem("user_uuid"),
        localStorage.getItem("pokemath_uuid")
      ];

      for (const candidate of candidates) {
        if (typeof candidate === "string" && isUuidLike(candidate)) {
          localStorage.setItem("uuid", candidate);
          return (cachedUUID = candidate);
        }
      }

      if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        const nu = crypto.randomUUID();
        localStorage.setItem("uuid", nu);
        return (cachedUUID = nu);
      }
    } catch (e) {
      err("UUID fetch failed", e);
    }

    return null;
  }

  function wsSend(obj) {
    try {
      if (!ws || ws.readyState !== WebSocket.OPEN) return false;
      ws.send(JSON.stringify(obj));
      return true;
    } catch (e) {
      err("wsSend failed", e);
      return false;
    }
  }

  async function joinLobby(code) {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      warn("joinLobby called but WS not open");
      return false;
    }

    const uuid = await getUUIDSafe();
    const name = getPlayerName();

    if (!uuid || !isUuidLike(uuid)) {
      warn("Missing/invalid UUID, cannot join lobby.", uuid);
      return false;
    }

    const payload = {
      type: "joinLobby",
      code: safeUpper6(code),
      uuid: String(uuid),
      name: String(name || "Ash"),
      icon: getPlayerIcon()
    };

    log("Joining lobby:", payload.code, "as", payload.name, "uuid:", payload.uuid);
    return wsSend(payload);
  }

  function scheduleReconnect() {
    clearTimeout(reconnectTimer);
    reconnectTimer = setTimeout(connectWS, 1500);
  }

  function connectWS() {
    if (connecting) return;
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return;

    connecting = true;
    joinedOk = false;

    log("Connecting to", WS_URL, "clientVersion=", BINGO_CLIENT_VERSION);
    ws = new WebSocket(WS_URL);

    ws.addEventListener("open", async () => {
      connecting = false;
      log("WS open.");

      const code = getStoredCode();
      if (code && code.length === 6) {
        joinedCode = code;
        await joinLobby(code);
      } else {
        log("Not joined (no bingoJoinedCode / bingoCode).");
      }

      // Pick up any unclaimed prizes from finished bingo games
      claimBingoPrizes();
    });

    ws.addEventListener("close", (e) => {
      connecting = false;
      joinedOk = false;
      warn(`WS closed code=${e.code} reason=${e.reason || "(none)"}`);
      if (hasJoinableCode()) scheduleReconnect();
      else log("No bingo code, not reconnecting.");
    });

    ws.addEventListener("error", (e) => {
      connecting = false;
      err("WS error", e);
    });

    ws.addEventListener("message", (e) => {
      let msg;
      try {
        msg = JSON.parse(e.data);
      } catch {
        return;
      }

      if (msg.type === "joinResult") {
        if (msg.ok) {
          joinedOk = true;
        } else {
          localStorage.removeItem("bingoJoinedCode");
          localStorage.removeItem("bingoCode");
          joinedCode = null;
          joinedOk = false;
          try { ws.close(); } catch {}
        }
        return;
      }
      
      if (msg.type === "ended" || msg.type === "lobbyEnded") {
        localStorage.removeItem("bingoJoinedCode");
        localStorage.removeItem("bingoCode");
        joinedCode = null;
        joinedOk = false;
        try { if (typeof window.updateBingoIndicator === "function") window.updateBingoIndicator(); } catch {}
        try { ws.close(); } catch {}
        return;
      }

      if (msg.type === "bingoReward") {
        log("Bingo reward incoming, claiming…");
        // Small delay so the DB insert completes before we SELECT
        setTimeout(claimBingoPrizes, 300);
        return;
      }

      if (msg.type === "adminPopup") {
        showAdminPopup(msg.message, msg.duration, msg.position);
        return;
      }

      if (msg.type === "error") {
        warn("Server error:", msg.message || "unknown");
      }
    });
  }

  function showAdminPopup(message, duration, position) {
    var existing = document.getElementById("bingo-admin-popup");
    if (existing) existing.remove();

    if (!document.getElementById("bingo-admin-popup-style")) {
      var s = document.createElement("style");
      s.id = "bingo-admin-popup-style";
      s.textContent = "@keyframes baPopIn{from{opacity:0;transform:translateY(-12px) scale(0.92)}to{opacity:1;transform:translateY(0) scale(1)}}";
      document.head.appendChild(s);
    }

    var POS = {
      "top-left":      "top:16px;left:16px;",
      "top-center":    "top:16px;left:50%;transform:translateX(-50%);",
      "top-right":     "top:16px;right:16px;",
      "center":        "top:50%;left:50%;transform:translate(-50%,-50%);",
      "bottom-left":   "bottom:16px;left:16px;",
      "bottom-center": "bottom:16px;left:50%;transform:translateX(-50%);",
      "bottom-right":  "bottom:16px;right:16px;",
    };

    var div = document.createElement("div");
    div.id = "bingo-admin-popup";
    div.style.cssText = "position:fixed;" + (POS[position] || POS["top-center"]) +
      "z-index:99999;background:#1f2a44;color:#fff;padding:20px 32px;" +
      "border-radius:16px;font-size:1.6em;font-weight:700;" +
      "box-shadow:0 8px 36px rgba(0,0,0,0.55);max-width:600px;text-align:center;" +
      "animation:baPopIn 0.2s ease;pointer-events:none;";
    div.textContent = message;
    document.body.appendChild(div);
    setTimeout(function() { if (div.parentNode) div.remove(); }, (duration || 5) * 1000);
  }

  async function claimBingoPrizes() {
    const uuid = await getUUIDSafe();
    if (!uuid || typeof window.applyBingoPrize !== "function") return;
    try {
      const r = await fetch("/bingo/claim-prizes?uuid=" + encodeURIComponent(uuid));
      const d = await r.json();
      if (d.ok && Array.isArray(d.prizes) && d.prizes.length) {
        log("Applying", d.prizes.length, "bingo prize(s).");
        window.applyBingoPrize(d.prizes);
      }
    } catch (e) {
      err("claimBingoPrizes failed", e);
    }
  }

  async function sendCatchObject(catchInfo) {
    const code = getStoredCode();
    if (!code || code.length !== 6) {
      //log("Not joined, not sending catch.");
      return false;
    }

    if (!ws || ws.readyState !== WebSocket.OPEN) {
      warn("WS not open when catch happened. Reconnecting.");
      connectWS();
      return false;
    }

    if (code !== joinedCode || !joinedOk) {
      joinedCode = code;
      await joinLobby(code);
    }

    const uuid = await getUUIDSafe();
    if (!uuid || !isUuidLike(uuid)) {
      warn("Missing/invalid UUID, cannot send catch.", uuid);
      return false;
    }

    const name = getPlayerName();

    const payload = {
      type: "catchPokemon",
      code: String(code),
      uuid: String(uuid),
      name: String(name || "Ash"),
      difficulty: String(catchInfo?.difficulty || "stage3"),
      pokemonCode: String(catchInfo?.pokemonCode || ""),
      pokedexId: Number(catchInfo?.pokedexId || 0),
      pokemonName: catchInfo?.pokemonName ? String(catchInfo.pokemonName) : null,
      types: Array.isArray(catchInfo?.types) ? catchInfo.types.map(t => String(t)) : [],
      flags: catchInfo?.flags && typeof catchInfo.flags === "object" ? catchInfo.flags : {}
    };

    if (!payload.pokemonCode) {
      warn("Missing pokemonCode, not sending catch.", catchInfo);
      return false;
    }

    log("Sending catch:", payload);
    const ok = wsSend(payload);
    if (!ok) warn("WS not open, catch not sent.");
    return ok;
  }

  window.bingoReportCatch = async function (catchInfo) {
    return sendCatchObject(catchInfo);
  };

  // Backwards compatible API used by existing pokestuff.js
  window.bingoSendCatch = async function (entryOrInfo, difficulty, extra) {
    if (entryOrInfo && typeof entryOrInfo === "object" && !Array.isArray(entryOrInfo)) {
      return sendCatchObject(entryOrInfo);
    }

    const payload = {
      pokemonCode: String(entryOrInfo || ""),
      difficulty: difficulty || "stage3",
      pokedexId: Number(extra?.pokedexId || 0),
      pokemonName: extra?.pokemonName ? String(extra.pokemonName) : null,
      types: Array.isArray(extra?.types) ? extra.types : [],
      flags: extra?.flags && typeof extra.flags === "object" ? extra.flags : {}
    };

    return sendCatchObject(payload);
  };

  function hasJoinableCode() {
    const code = getStoredCode();
    return code && code.length === 6;
  }

  window.__bingoDebug = {
    version: BINGO_CLIENT_VERSION,
    getStoredCode,
    getUUIDSafe,
    get wsState() {
      return ws ? ws.readyState : -1;
    },
    get joinedCode() {
      return joinedCode;
    },
    get joinedOk() {
      return joinedOk;
    }
  };

  if (hasJoinableCode()) connectWS();
  else log("No stored bingo code on load, skipping initial WS connect.");
})();