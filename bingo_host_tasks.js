// bingo_host_tasks.js
(function () {
  function setStatus(t) {
    console.log("[BINGO HOST]", t);
  }

  const teacherSession = localStorage.getItem("teacherSession");
  if (!teacherSession) {
    alert("Du må logge inn som lærer først.");
    location.href = "/lærer/index.html";
    return;
  }

  const protocol = location.protocol === "https:" ? "wss:" : "ws:";
  const wsUrl = `${protocol}//${location.host}/ws`;

  const ws = new WebSocket(wsUrl);

  const settings = JSON.parse(sessionStorage.getItem("bingoSettings") || "{}");
  const table = document.getElementById("bingoCard");
  const codeEl = document.getElementById("code");
  const playersEl = document.getElementById("players");
  const eventsEl = document.getElementById("events");
  const toastEl = document.getElementById("toast");

  const toggleBtn = document.getElementById("toggleLog");
  const newGameBtn = document.getElementById("newGameBtn");

  const totalEl = document.getElementById("totalCatches");
  function setTotal(n) {
    const val = Number(n || 0);
    currentTotalCatches = val;
    if (totalEl) totalEl.textContent = `Totalt fanget: ${val}`;
    // Animate participation_coins pot
    if (settings.prizeType === "participation_coins" && !settings.prizeSecret) {
      const potEl = document.getElementById("participationPot");
      if (potEl) {
        const pot = 2000 * lastKnownPlayers.length + 50 * val;
        potEl.textContent = pot.toLocaleString("no-NO") + " mynter";
        potEl.style.transform = "scale(1.35)";
        potEl.style.color = "#fff";
        setTimeout(() => { potEl.style.transform = ""; potEl.style.color = "#ffe066"; }, 350);
      }
    }
    // Re-render player percentages if showing catches
    if (showCatches && lastKnownPlayers.length) renderPlayers(lastKnownPlayers);
  }

  // ---------------------------------------------------------------------------
  // Pokemon sprites + range cycling state
  // ---------------------------------------------------------------------------
  function localSprite(id) { return `/images/pokemon/normal/${Number(id)}.png`; }

  const rangeCyclers = new Map(); // cellId -> intervalId
  function stopRangeCycler(cellId) {
    if (rangeCyclers.has(cellId)) {
      clearInterval(rangeCyclers.get(cellId));
      rangeCyclers.delete(cellId);
    }
  }

  function startRangeCyclers(board) {
    rangeCyclers.forEach(id => clearInterval(id));
    rangeCyclers.clear();
    for (const cell of board.cells) {
      if (cell.free || cell.marked) continue;
      const rule = cell.task?.rule;
      if (rule?.kind !== "pokedexRange") continue;
      const start = Number(rule.start), end = Number(rule.end);
      if (isNaN(start) || isNaN(end) || end < start) continue;
      const count = Math.min(end - start + 1, 60);
      const ids = Array.from({ length: count }, (_, i) => start + i);
      let idx = 0;
      const cellId = cell.cellId;
      const intervalId = setInterval(() => {
        idx = (idx + 1) % ids.length;
        const td = table.querySelector(`td[data-cell-id="${cellId}"]`);
        if (!td) { stopRangeCycler(cellId); return; }
        if (td.classList.contains("toggled")) { stopRangeCycler(cellId); return; }
        const img = td.querySelector("img.range-sprite");
        if (img) img.src = localSprite(ids[idx]);
      }, 1500);
      rangeCyclers.set(cellId, intervalId);
    }
  }

  // ---------------------------------------------------------------------------
  // LOG toggle + buffer
  // ---------------------------------------------------------------------------
  let logVisible = true;
  const bufferedEvents = [];

  // cache extra info per catch, so lastEvent can be enriched
  // key: `${uuid}|${pokemonCode}|${ts}`
  const eventExtraCache = new Map();
  function makeEventKey(obj) {
    const ts = obj?.ts || obj?.timestamp || obj?.time || "";
    return `${obj?.uuid || ""}|${obj?.pokemonCode || ""}|${ts}`;
  }

  function fmtTime(ts) {
    try {
      return new Date(ts).toLocaleTimeString("no-NO", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return "";
    }
  }

  function fmtFlagsTrue(flags) {
    if (!flags || typeof flags !== "object") return [];
    return Object.entries(flags)
      .filter(([, v]) => v === true)
      .map(([k]) => k);
  }



  function buildLogHover(ev) {
    const uuid = ev.uuid || "-";
    const typings = Array.isArray(ev.types) && ev.types.length ? ev.types.join(", ") : "-";
    const trueFlags = fmtFlagsTrue(ev.flags);
    const checks = trueFlags.length ? trueFlags.join(", ") : "-";
    return `UUID: ${uuid}\nTypes: ${typings}\nTrue checks: ${checks}`;
  }

  function updateLogCount() {
    const el = document.getElementById("logCount");
    if (el) el.textContent = bufferedEvents.length;
  }

  function renderBufferedEvents() {
    eventsEl.innerHTML = "";
    const slice = bufferedEvents.slice(-60).reverse();
    for (const ev of slice) {
      const div = makeLogDiv(ev);
      eventsEl.appendChild(div);
    }
    updateLogCount();
  }

  if (toggleBtn) toggleBtn.textContent = "Skjul logg";

  toggleBtn?.addEventListener("click", () => {
    logVisible = !logVisible;
    eventsEl.style.display = logVisible ? "block" : "none";
    toggleBtn.textContent = logVisible ? "Skjul logg" : "Vis logg";
    if (logVisible) renderBufferedEvents();
  });

  function makeLogDiv(ev) {
    const div = document.createElement("div");
    div.className = "log-entry" + (ev.matched ? " log-match" : "");
    if (ev.belowLevel) div.style.cssText = "border-left-color:#f0c040;background:rgba(240,192,64,0.07);";
    div.title = buildLogHover(ev);

    const time = fmtTime(ev.ts);
    const playerName = ev.name || "Ash";
    const pid = ev.pokedexId ? `#${ev.pokedexId} ` : "";
    const pokeName = ev.pokemonName || ev.pokemonCode || "Pokémon";
    const stage = ev.difficulty || "";
    const matchPill = ev.matched
      ? `<span class="log-match-pill">MATCH</span>`
      : "";
    const belowPill = ev.belowLevel
      ? `<span style="display:inline-block;background:#f0c040;color:#5a3e00;font-weight:700;font-size:0.78em;border-radius:999px;padding:1px 7px;margin-left:4px;">nivå for lavt</span>`
      : "";

    div.innerHTML =
      `<span class="log-time">${time}</span> ` +
      `<b>${playerName}</b> – ${pid}<b>${pokeName}</b>` +
      (stage ? ` <span style="opacity:0.6">(${stage})</span>` : "") +
      matchPill + belowPill;

    return div;
  }

  function pushEventLine(ev) {
    bufferedEvents.push(ev);
    updateLogCount();
    if (!logVisible) return;
    eventsEl.prepend(makeLogDiv(ev));
  }

  // ---------------------------------------------------------------------------
  // Toasts + players
  // ---------------------------------------------------------------------------
  let knownPlayers = new Set();

  function showBanner(message, btnLabel, btnAction) {
    let banner = document.getElementById("host-banner");
    if (!banner) {
      banner = document.createElement("div");
      banner.id = "host-banner";
      banner.style.cssText = "position:fixed;top:70px;left:50%;transform:translateX(-50%);background:#fff;border:2px solid #cc1a1a;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.15);padding:14px 20px;z-index:9998;max-width:520px;width:90%;font-family:'Source Sans Pro',sans-serif;display:flex;align-items:center;gap:12px;";
      document.body.appendChild(banner);
    }
    const btnHtml = btnLabel
      ? `<button id="host-banner-btn" style="flex-shrink:0;background:#cc1a1a;color:#fff;border:none;border-radius:20px;padding:7px 16px;font-weight:700;cursor:pointer;font-family:inherit;">${btnLabel}</button>`
      : "";
    const closeHtml = `<button id="host-banner-close" style="flex-shrink:0;background:none;border:none;font-size:1.3em;cursor:pointer;color:#aaa;padding:0 4px;" title="Lukk">×</button>`;
    banner.innerHTML = `<span style="flex:1;">${message}</span>${btnHtml}${closeHtml}`;
    banner.style.display = "flex";
    if (btnLabel && btnAction) {
      document.getElementById("host-banner-btn")?.addEventListener("click", () => {
        banner.style.display = "none";
        btnAction();
      });
    }
    document.getElementById("host-banner-close")?.addEventListener("click", () => {
      banner.style.display = "none";
    });
  }

  // ---------------------------------------------------------------------------
  // Difficulty label + class name (Norwegian)
  // ---------------------------------------------------------------------------
  const DIFF_NO = { easy: "Enkel", medium: "Middels", hard: "Vanskelig", extreme: "Ekstrem", unik: "Unik" };
  const BINGO_COINS = { easy: 5000, medium: 10000, hard: 25000, extreme: 35000, unik: 50000 };
  let currentCode = "";
  const celebrated = new Set();

  // Player list state
  let playerSortMode = "joined";
  let showCatches = true;
  let currentTotalCatches = 0;
  let lastKnownPlayers = [];

  function setDifficultyLabel(diff) {
    const el = document.getElementById("difficultyLabel");
    if (el) el.textContent = DIFF_NO[diff] || diff || "";
  }

  function setClassNameLabel(name) {
    const el = document.getElementById("classNameLabel");
    if (el) el.textContent = name ? `Klasse: ${name}` : "";
  }

  // ---------------------------------------------------------------------------
  // Confetti
  // ---------------------------------------------------------------------------
  function launchConfetti(intensity) {
    const canvas = document.getElementById("confetti-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const COLORS = ["#cc1a1a","#2cbb63","#f7c325","#3498db","#ff6b35","#9b59b6","#fff"];
    const count = Math.floor(80 * intensity);
    const particles = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width, y: -20,
      vx: (Math.random() - 0.5) * 6, vy: Math.random() * 4 + 2,
      rot: Math.random() * 360, rs: (Math.random() - 0.5) * 10,
      w: Math.random() * 12 + 5, h: Math.random() * 6 + 3,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    }));
    const duration = 3500 + intensity * 800;
    const start = Date.now();
    let frame;
    function animate() {
      const elapsed = Date.now() - start;
      if (elapsed > duration) { ctx.clearRect(0, 0, canvas.width, canvas.height); return; }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.globalAlpha = Math.min(1, (duration - elapsed) / 600);
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy; p.rot += p.rs;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot * Math.PI / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      ctx.globalAlpha = 1;
      frame = requestAnimationFrame(animate);
    }
    cancelAnimationFrame(frame);
    animate();
  }

  // ---------------------------------------------------------------------------
  // Milestone detection
  // ---------------------------------------------------------------------------
  function checkNewMilestones(cells) {
    if (!Array.isArray(cells) || cells.length < 25) return [];
    const hit = i => cells[i] && (cells[i].free || cells[i].marked);
    const newly = [];

    for (let r = 0; r < 5; r++) {
      const key = `row${r}`;
      const indices = [0,1,2,3,4].map(c => r*5+c);
      if (!celebrated.has(key) && indices.every(hit)) {
        celebrated.add(key); newly.push({ type: "line", label: `Rad ${r+1} fullført!`, intensity: 1, indices });
      }
    }
    for (let c = 0; c < 5; c++) {
      const key = `col${c}`;
      const indices = [0,1,2,3,4].map(r => r*5+c);
      if (!celebrated.has(key) && indices.every(hit)) {
        celebrated.add(key); newly.push({ type: "line", label: `Kolonne ${c+1} fullført!`, intensity: 1, indices });
      }
    }
    const innerIdx = [6,7,8,11,12,13,16,17,18];
    if (!celebrated.has("inner") && innerIdx.every(hit)) {
      celebrated.add("inner"); newly.push({ type: "inner", label: "Indre brett fullført!", intensity: 2, indices: innerIdx });
    }
    const frameIdx = [0,1,2,3,4,5,9,10,14,15,19,20,21,22,23,24];
    if (!celebrated.has("frame") && frameIdx.every(hit)) {
      celebrated.add("frame"); newly.push({ type: "frame", label: "Ytre ramme fullført!", intensity: 2, indices: frameIdx });
    }
    const fullIdx = Array.from({ length: 25 }, (_, i) => i);
    if (!celebrated.has("full") && fullIdx.every(hit)) {
      celebrated.add("full"); newly.push({ type: "full", label: "FULLT BRETT! Bingo avsluttet!", intensity: 4, indices: fullIdx });
    }
    return newly;
  }

  function flashCells(cells, indices) {
    if (!Array.isArray(indices) || !cells) return;
    for (const idx of indices) {
      const cell = cells[idx];
      if (!cell) continue;
      const td = table.querySelector(`td[data-cell-id="${cell.cellId}"]`);
      if (!td) continue;
      td.classList.remove("bingo-flash");
      // Force reflow so re-adding the class restarts the animation
      void td.offsetWidth;
      td.classList.add("bingo-flash");
      setTimeout(() => td.classList.remove("bingo-flash"), 1200);
    }
  }

  function isMuted() { return localStorage.getItem("bingoMuted") === "1"; }

  function playSound(file) {
    if (isMuted()) return;
    try { new Audio("/audio/" + file).play(); } catch {}
  }

  function celebrateMilestones(milestones, cells) {
    for (const m of milestones) {
      launchConfetti(m.intensity);
      flashCells(cells, m.indices);
      pushEventLine({ ts: Date.now(), name: "🏆", pokemonName: m.label, matched: true });
      toast(`<b>${m.label}</b>`, true);
      if (m.type === "full") {
        playSound("caughtpkmn.ogg");
        setTimeout(() => {
          ws.send(JSON.stringify({ type: "hostLockLobby", teacherSession, code: currentCode }));
        }, 1500);
      } else {
        playSound("lvlup.ogg");
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Prize modal (shown on host when full board is locked)
  // ---------------------------------------------------------------------------
  function showPrizeModal(prize, eligibleCount) {
    let modal = document.getElementById("prizeModal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "prizeModal";
      modal.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,0.78);display:flex;align-items:center;justify-content:center;z-index:9999;";
      modal.addEventListener("click", e => { if (e.target === modal) modal.style.display = "none"; });
      document.body.appendChild(modal);
    }

    let visualHtml = "", title, sub;

    // prize may now be an array (shiny: 3 different pokémon) or a single object
    const prizeList = Array.isArray(prize) ? prize : [prize];
    const first = prizeList[0] || {};

    if (first.type === "coins") {
      visualHtml = `<div style="font-size:80px;margin-bottom:12px;">💰</div>`;
      title = "Premie: " + Number(first.amount).toLocaleString("no-NO") + " mynter";
      sub = eligibleCount + " deltakere som fanget minst én Pokémon får mynter!";
    } else if (first.type === "participation_coins") {
      visualHtml = `<div style="font-size:80px;margin-bottom:12px;">🏦</div>`;
      const pot = Number(first.pot || 0).toLocaleString("no-NO");
      title = "Deltakelses-premie: " + pot + " mynter i potten";
      sub = "Alle " + eligibleCount + " deltakere deler potten basert på hvor mye de deltok!";
    } else if (first.type === "pokemon") {
      const allShiny = prizeList.every(p => p.shiny || p.entry?.startsWith("S"));
      const isLeg = first.legendary;
      const spriteHtml = prizeList.map(p => {
        const folder = (p.shiny || p.entry?.startsWith("S")) ? "shiny" : "normal";
        return `<img src="/images/pokemon/${folder}/${p.pokedexId}.png" style="width:80px;height:80px;image-rendering:pixelated;margin:4px;">`;
      }).join("");
      visualHtml = `<div style="margin-bottom:12px;">${spriteHtml}</div>`;
      const label = allShiny ? `✨ ${prizeList.length} Shiny Pokémon` : (isLeg ? "⭐ Legendarisk Pokémon" : "🌟 Mytisk Pokémon");
      title = "Premie: " + label;
      sub = eligibleCount + " deltakere som fanget minst én Pokémon får " + (prizeList.length > 1 ? prizeList.length + " stk!" : "denne pokemonen!");
    } else {
      visualHtml = `<div style="font-size:80px;margin-bottom:12px;">🎁</div>`;
      title = "Premie!";
      sub = eligibleCount + " deltakere får premie!";
    }

    modal.innerHTML = `<div style="background:#fff;border-radius:20px;padding:40px;max-width:520px;width:90%;text-align:center;box-shadow:0 24px 64px rgba(0,0,0,0.5);">
      ${visualHtml}
      <h2 style="font-size:26px;color:#1f2a44;margin:0 0 10px;">🏆 Bingo fullført!</h2>
      <h3 style="font-size:20px;color:#2f80ed;margin:0 0 16px;">${title}</h3>
      <p style="color:#555;margin:0 0 28px;font-size:15px;">${sub}</p>
      <button onclick="document.getElementById('prizeModal').style.display='none'" style="background:#2f80ed;color:#fff;border:none;border-radius:12px;padding:12px 36px;font-size:16px;font-weight:700;cursor:pointer;">OK</button>
    </div>`;
    modal.style.display = "flex";
  }

  // ---------------------------------------------------------------------------
  // Admin popup (sent from pokemorten.html)
  // ---------------------------------------------------------------------------
  function showAdminPopup(message, duration, position) {
    const existing = document.getElementById("admin-popup");
    if (existing) existing.remove();
    if (!document.getElementById("admin-popup-style")) {
      const s = document.createElement("style");
      s.id = "admin-popup-style";
      s.textContent = "@keyframes adminPopIn{from{opacity:0;transform:scale(0.88)}to{opacity:1;transform:scale(1)}}";
      document.head.appendChild(s);
    }
    const POS = {
      "top-left":      "top:16px;left:16px;",
      "top-center":    "top:16px;left:50%;transform:translateX(-50%);",
      "top-right":     "top:16px;right:16px;",
      "center":        "top:50%;left:50%;transform:translate(-50%,-50%);",
      "bottom-left":   "bottom:16px;left:16px;",
      "bottom-center": "bottom:16px;left:50%;transform:translateX(-50%);",
      "bottom-right":  "bottom:16px;right:16px;",
    };
    const div = document.createElement("div");
    div.id = "admin-popup";
    div.style.cssText = `position:fixed;${POS[position] || POS["top-center"]}z-index:99999;background:#1f2a44;color:#fff;padding:16px 28px;border-radius:16px;font-size:1.15em;font-weight:700;box-shadow:0 8px 32px rgba(0,0,0,0.5);max-width:500px;text-align:center;animation:adminPopIn 0.25s ease;`;
    div.textContent = message;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), (duration || 5) * 1000);
  }

  // ---------------------------------------------------------------------------
  // Copy link + QR
  // ---------------------------------------------------------------------------
  function joinUrl(code) {
    return `${location.protocol}//${location.host}/bingo_join.html?code=${code}`;
  }

  // Sort + catches toggle buttons
  function setSortMode(mode) {
    playerSortMode = mode;
    document.getElementById("sortJoinBtn") .style.opacity = mode === "joined"  ? "1" : "0.5";
    document.getElementById("sortAlphaBtn").style.opacity = mode === "alpha"   ? "1" : "0.5";
    document.getElementById("sortCatchBtn").style.opacity = mode === "catches" ? "1" : "0.5";
    if (lastKnownPlayers.length) renderPlayers(lastKnownPlayers);
  }
  document.getElementById("sortJoinBtn") ?.addEventListener("click", () => setSortMode("joined"));
  document.getElementById("sortAlphaBtn")?.addEventListener("click", () => setSortMode("alpha"));
  document.getElementById("sortCatchBtn") ?.addEventListener("click", () => setSortMode("catches"));
  document.getElementById("toggleCatchesBtn")?.addEventListener("click", () => {
    showCatches = !showCatches;
    const btn = document.getElementById("toggleCatchesBtn");
    if (btn) btn.textContent = showCatches ? "👁 Skjul" : "👁 Vis";
    if (lastKnownPlayers.length) renderPlayers(lastKnownPlayers);
  });

  document.getElementById("copyLinkBtn")?.addEventListener("click", () => {
    const code = document.getElementById("code")?.textContent?.trim();
    if (!code || code === "------") return;
    navigator.clipboard.writeText(joinUrl(code)).then(() => {
      toast("Lenke kopiert!", false);
    }).catch(() => {
      prompt("Kopier lenken:", joinUrl(code));
    });
  });

  const qrModal = document.getElementById("qrModal");
  document.getElementById("showQrBtn")?.addEventListener("click", () => {
    const code = document.getElementById("code")?.textContent?.trim();
    if (!code || code === "------") return;
    qrModal.style.display = "flex";
    const img = document.getElementById("qrImage");
    const urlEl = document.getElementById("qrUrl");
    const url = joinUrl(code);
    img.src = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(url)}&size=260x260&margin=2`;
    urlEl.textContent = url;
  });
  document.getElementById("qrClose")?.addEventListener("click", () => {
    qrModal.style.display = "none";
  });
  qrModal?.addEventListener("click", e => { if (e.target === qrModal) qrModal.style.display = "none"; });

  // ---------------------------------------------------------------------------
  // Avslutt Bingo button
  // ---------------------------------------------------------------------------
  document.getElementById("endGameBtn")?.addEventListener("click", () => {
    if (!currentCode || !confirm("Avslutt bingo og disconnect alle elever?")) return;
    const codeToEnd = currentCode;
    currentCode = "";
    clearCurrentCode();
    celebrated.clear();
    ws.send(JSON.stringify({ type: "hostEndLobby", teacherSession, code: codeToEnd }));
  });

  document.getElementById("backToSettings")?.addEventListener("click", () => {
    if (!confirm("Gå tilbake til innstillinger?\n\nDette avslutter det nåværende bingo-brettet og disconnecter alle elever.")) return;
    if (currentCode) {
      const codeToEnd = currentCode;
      currentCode = "";
      clearCurrentCode();
      celebrated.clear();
      try { ws.send(JSON.stringify({ type: "hostEndLobby", teacherSession, code: codeToEnd })); } catch {}
    }
    location.href = "/lærer/bingo_settings.html";
  });

  function toast(text, matched) {
    toastEl.style.background = matched ? "#00C957" : "#ffffff";
    toastEl.style.color = matched ? "#ffffff" : "#111111";
    toastEl.style.display = "block";
    toastEl.style.border = matched ? "2px solid #00C957" : "2px solid #3498db";
    toastEl.innerHTML = text;
    clearTimeout(toastEl.__t);
    toastEl.__t = setTimeout(() => (toastEl.style.display = "none"), 3000);
  }

  function handlePlayersUpdate(players) {
    for (const p of players) {
      if (p.uuid && !knownPlayers.has(p.uuid) && p.connected) {
        toast(`<b>${p.name || "Ash"}</b> koblet til!`, false);
        knownPlayers.add(p.uuid);
      }
    }
    renderPlayers(players);
  }

  function sortedPlayers(players) {
    const arr = [...players];
    if (playerSortMode === "alpha")   arr.sort((a, b) => (a.name || "").localeCompare(b.name || "", "no"));
    if (playerSortMode === "catches") arr.sort((a, b) => (b.catchCount || 0) - (a.catchCount || 0));
    return arr;
  }

  function renderPlayers(players) {
    lastKnownPlayers = players;
    playersEl.innerHTML = "";
    const countEl = document.getElementById("playerCount");
    const connected = players.filter(p => p.connected).length;
    if (countEl) countEl.textContent = `${connected}/${players.length}`;

    sortedPlayers(players).forEach((p) => {
      const div = document.createElement("div");
      div.className = "player-row";
      const dotClass = p.connected ? "connected" : "disconnected";
      const iconHtml = p.icon
        ? `<img class="player-icon" src="/images/playericons/${p.icon}.png" alt="">`
        : `<span class="player-dot ${dotClass}"></span>`;
      let catchHtml = "";
      if (showCatches) {
        const pct = currentTotalCatches > 0
          ? Math.round((p.catchCount || 0) / currentTotalCatches * 100) : 0;
        catchHtml = `<span class="player-catches">${p.catchCount ?? 0}<span style="font-size:0.75em;opacity:0.6;margin-left:2px;">(${pct}%)</span></span>`;
      }
      div.innerHTML = iconHtml + `<span class="player-name">${p.name || "Ash"}</span>` + catchHtml;
      playersEl.appendChild(div);
    });
  }

  function prettyCatch(msg) {
    const name = msg.name || "Ash";
    const pokeName = msg.pokemonName || msg.pokemonCode || "Pokémon";
    const id = msg.pokedexId ? ` (#${msg.pokedexId})` : "";

    const parts = [];
    if (msg.flags?.shiny) parts.push("Shiny");
    if (msg.flags?.gmax) parts.push("Gigantamax");
    if (msg.flags?.mega) parts.push("Mega");
    if (msg.flags?.hisuian) parts.push("Hisuian");
    if (msg.flags?.alolan) parts.push("Alolan");
    if (msg.flags?.legendary) parts.push("Legendary");
    if (msg.flags?.mythic) parts.push("Mythic");

    const prefix = parts.length ? parts.join(" ") + " " : "";

    const typeText =
      Array.isArray(msg.types) && msg.types.length
        ? `<div style="margin-top:6px;opacity:0.95;">Type: <b>${msg.types.join(", ")}</b></div>`
        : "";

    const hitText =
      Array.isArray(msg.matchedCells) && msg.matchedCells.length
        ? `<div style="margin-top:6px;">Match: <b>${msg.matchedCells.join(", ")}</b></div>`
        : (msg.matchedCell ? `<div style="margin-top:6px;">Match: <b>${msg.matchedCell}</b></div>` : "");

    return `<b>${name}</b> fanget en ${prefix}<b>${pokeName}</b>!${id}${typeText}${hitText}`;
  }

  // ---------------------------------------------------------------------------
  // Board rendering (with hit badges)
  // ---------------------------------------------------------------------------
  function cellHtml(task, isFree, hits, marked) {
    const badge = `<div class="hit-badge">${hits || 0}</div>`;
    if (isFree) {
      let prizeHtml = "";
      const pt = settings.prizeType || "random";
      const secret = !!settings.prizeSecret;
      const s = `font-size:0.62em;margin-top:4px;line-height:1.3;`;
      if (secret) {
        prizeHtml = `<div style="${s}opacity:0.7;">🔒 Hemmelig premie</div>`;
      } else if (pt === "coins") {
        const amt = (BINGO_COINS[settings.difficulty] || 10000).toLocaleString("no-NO");
        prizeHtml = `<div style="${s}font-weight:700;">💰 ${amt} mynter</div>`;
      } else if (pt === "participation_coins") {
        const pot = (2000 * lastKnownPlayers.length + 50 * currentTotalCatches).toLocaleString("no-NO");
        prizeHtml = `<div style="${s}font-weight:700;color:#ffe066;transition:transform 0.25s,color 0.25s;" id="participationPot">${pot} mynter</div><div style="font-size:0.55em;opacity:0.65;">2 000/elev + 50/fangst</div>`;
      } else if (pt === "per_catch_coins") {
        prizeHtml = `<div style="${s}font-weight:700;">💰 50 mynter/fangst</div>`;
      } else if (pt === "legendary") {
        prizeHtml = `<div style="${s}opacity:0.8;">❓ Tilfeldig Legendarisk</div>`;
      } else if (pt === "mythic") {
        prizeHtml = `<div style="${s}opacity:0.8;">❓ Tilfeldig Mytisk</div>`;
      } else if (pt === "shiny") {
        prizeHtml = `<div style="${s}opacity:0.8;">✨ Ukjent Shiny Pokémon</div>`;
      } else if (pt === "stardust") {
        prizeHtml = `<div style="${s}opacity:0.8;">✨ Stardust ×1</div>`;
      } else {
        prizeHtml = `<div style="${s}opacity:0.8;">❓ Tilfeldig premie</div>`;
      }
      return `${badge}<img src="/images/compass.png" alt="Free Space"><br>FREE SPACE${prizeHtml}`;
    }

    let visual = "";
    const rule = task?.rule;
    if (rule?.kind === "pokedexExact") {
      // Show silhouette until solved
      const cls = marked ? "" : " silhouette";
      const src = task.image ? `/${String(task.image).replace(/^\//, "")}` : localSprite(rule.id);
      visual = `<img class="${cls.trim()}" src="${src}" alt="${task.name || ""}">`;
    } else if (rule?.kind === "pokedexRange") {
      // Cycling silhouette until solved, then green checkmark
      if (marked) {
        visual = `<span class="cell-range-solved">✓</span>`;
      } else {
        visual = `<img class="silhouette range-sprite" src="${localSprite(rule.start)}" alt="${task.name || ""}">`;
      }
    } else if (task?.image) {
      visual = `<img src="/${String(task.image).replace(/^\//, "")}" alt="${task.name || ""}">`;
    } else if (task?.text) {
      visual = `<span class="${task.textClass || ""}">${task.text}</span>`;
    }

    return `${badge}${visual}<br>${task?.name || ""}<br><span class="task-description">${task?.description || ""}</span>`;
  }

  function renderBoard(board) {
    table.innerHTML = "";
    for (let r = 0; r < 5; r++) {
      const tr = document.createElement("tr");
      for (let c = 0; c < 5; c++) {
        const idx = r * 5 + c;
        const cell = board.cells[idx];
        const td = document.createElement("td");
        td.dataset.cellId = cell.cellId;

        if (cell.free) td.classList.add("free-space");
        if (cell.marked && !cell.free) td.classList.add("toggled");

        td.innerHTML = cellHtml(cell.task, cell.free, cell.hits, cell.marked);

        if (!cell.free) {
          td.classList.add("host-cell");
          td.title = "Klikk for å godkjenne / fjerne godkjenning";
          td.addEventListener("click", () => {
            const alreadyMarked = td.classList.contains("toggled");
            if (alreadyMarked) {
              if (!confirm(`Fjerne godkjenning for "${cell.task?.name || cell.cellId}"?`)) return;
            }
            ws.send(JSON.stringify({
              type: "hostMarkCell",
              teacherSession,
              code: currentCode,
              cellId: cell.cellId,
              mark: !alreadyMarked,
            }));
          });
        }

        tr.appendChild(td);
      }
      table.appendChild(tr);
    }
    startRangeCyclers(board);
  }

  function applyBoardUpdate(board) {
    for (const cell of board.cells) {
      if (cell.free) continue;
      const td = table.querySelector(`td[data-cell-id="${cell.cellId}"]`);
      if (!td) continue;

      const wasMarked = td.classList.contains("toggled");
      if (cell.marked && !wasMarked) {
        td.classList.add("toggled");

        const rule = cell.task?.rule;
        if (rule?.kind === "pokedexRange") {
          // Stop cycler and swap image for checkmark
          stopRangeCycler(cell.cellId);
          const img = td.querySelector("img.range-sprite");
          if (img) {
            const span = document.createElement("span");
            span.className = "cell-range-solved";
            span.textContent = "✓";
            img.replaceWith(span);
          }
        }
        // pokedexExact: CSS td.toggled img.silhouette { filter: none } handles it automatically
      }

      const badge = td.querySelector(".hit-badge");
      if (badge) badge.textContent = String(cell.hits || 0);
      else td.innerHTML = cellHtml(cell.task, cell.free, cell.hits, cell.marked);
    }
  }

  // ---------------------------------------------------------------------------
  // Host lifecycle: reuse code on refresh unless "Nytt spill"
  // ---------------------------------------------------------------------------
  function saveCurrentCode(code) {
    localStorage.setItem("teacherBingoCode", code);
  }
  function clearCurrentCode() {
    localStorage.removeItem("teacherBingoCode");
  }

  function requestCreateLobby() {
    setStatus("Oppretter ny lobby…");
    knownPlayers = new Set();
    bufferedEvents.length = 0;
    if (logVisible) renderBufferedEvents();

    celebrated.clear();
    ws.send(JSON.stringify({
      type: "hostCreateLobby",
      teacherSession,
      settings: { difficulty: settings.difficulty || "easy", minLevel: settings.minLevel || "alle", className: settings.className || "", prizeType: settings.prizeType || "random" },
    }));
  }

  function requestJoinLobby(code) {
    setStatus("Gjenoppretter lobby " + code + " …");
    ws.send(JSON.stringify({ type: "hostJoinLobby", teacherSession, code }));
  }

  newGameBtn?.addEventListener("click", () => {
    const oldCode = localStorage.getItem("teacherBingoCode");
    clearCurrentCode();
    if (oldCode && ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify({ type: "hostEndLobby", teacherSession, code: oldCode }));
      } catch {}
    }
    requestCreateLobby();
  });

  // ---------------------------------------------------------------------------
  // WS events
  // ---------------------------------------------------------------------------
  ws.addEventListener("open", () => {
    const stored = (localStorage.getItem("teacherBingoCode") || "").toUpperCase().trim();
    if (stored && stored.length === 6) requestJoinLobby(stored);
    else requestCreateLobby();
  });

  ws.addEventListener("error", (e) => {
    setStatus("WebSocket ERROR – se Console.");
    console.error(e);
  });

  ws.addEventListener("close", (e) => {
    setStatus(`WebSocket lukket. code=${e.code} reason=${e.reason || "(ingen)"}`);
  });

  ws.addEventListener("message", (e) => {
    let msg;
    try { msg = JSON.parse(e.data); } catch { return; }

    if (msg.type === "lobbyPrize") {
      showPrizeModal(msg.prize, msg.eligibleCount || 0);
      return;
    }

    if (msg.type === "lobbyCreated") {
      setStatus("Lobby opprettet: " + msg.code);
      currentCode = msg.code;
      celebrated.clear();
      codeEl.textContent = msg.code;
      saveCurrentCode(msg.code);
      setDifficultyLabel(msg.board?.difficulty);
      setClassNameLabel(msg.className || "");
      renderBoard(msg.board);
      handlePlayersUpdate(msg.players || []);
      setTotal(msg.totalCatches || 0);
      return;
    }

    if (msg.type === "lobbyState" && !msg.restored) {
      setStatus("Lobby gjenopprettet: " + msg.code);
      currentCode = msg.code;
      codeEl.textContent = msg.code;
      saveCurrentCode(msg.code);
      setDifficultyLabel(msg.board?.difficulty);
      setClassNameLabel(msg.className || "");
      renderBoard(msg.board);
      handlePlayersUpdate(msg.players || []);
      setTotal(msg.totalCatches || 0);

      if (Array.isArray(msg.events)) {
        bufferedEvents.length = 0;
        for (const ev of msg.events) bufferedEvents.push(ev);
        if (logVisible) renderBufferedEvents();
      }
      return;
    }

    if (msg.type === "playersUpdate") {
      handlePlayersUpdate(msg.players || []);
      return;
    }

    if (msg.type === "boardUpdate") {
      applyBoardUpdate(msg.board);
      if (msg.totalCatches != null) setTotal(msg.totalCatches);

      if (msg.lastEvent) {
        const key = makeEventKey(msg.lastEvent);
        const extra = eventExtraCache.get(key);
        const ev = extra ? { ...msg.lastEvent, ...extra } : msg.lastEvent;
        pushEventLine(ev);
      }

      const newMilestones = checkNewMilestones(msg.board.cells);
      if (newMilestones.length) celebrateMilestones(newMilestones, msg.board.cells);
      return;
    }

    if (msg.type === "toastCatch") {
      // Update total immediately
      if (msg.totalCatches != null) setTotal(msg.totalCatches);

      if (msg.belowLevel) {
        // Below minimum level — log it visually but no board effect
        const ev = {
          ts: Date.now(),
          uuid: msg.uuid,
          name: msg.name,
          pokedexId: msg.pokedexId,
          pokemonName: msg.pokemonName,
          pokemonCode: msg.pokemonCode,
          types: msg.types,
          flags: msg.flags,
          difficulty: msg.difficulty,
          matched: false,
          belowLevel: true,
        };
        pushEventLine(ev);

        const name = msg.name || "Ash";
        const pokeName = msg.pokemonName || msg.pokemonCode || "Pokémon";
        const id = msg.pokedexId ? ` (#${msg.pokedexId})` : "";
        toastEl.style.background = "#fff8e1";
        toastEl.style.color = "#7a5a00";
        toastEl.style.border = "2px solid #f0c040";
        toastEl.style.display = "block";
        toastEl.innerHTML = `<b>${name}</b> fanget <b>${pokeName}</b>${id} <span style="opacity:0.75">(nivå for lavt)</span>`;
        clearTimeout(toastEl.__t);
        toastEl.__t = setTimeout(() => (toastEl.style.display = "none"), 3000);
        return;
      }

      // Normal catch — store extra data for later log enrichment via boardUpdate
      const hintKey = `${msg.uuid || ""}|${msg.pokemonCode || ""}|`; // ts unknown
      eventExtraCache.set(hintKey, {
        uuid: msg.uuid,
        pokedexId: msg.pokedexId,
        pokemonName: msg.pokemonName,
        types: msg.types,
        flags: msg.flags,
        difficulty: msg.difficulty,
        matchedCells: msg.matchedCells,
        matchedCell: msg.matchedCell
      });

      toast(prettyCatch(msg), !!msg.matched);
      return;
    }

    if (msg.type === "adminPopup") {
      showAdminPopup(msg.message, msg.duration, msg.position);
      return;
    }

    if (msg.type === "adminSound") {
      playSound(msg.file);
      return;
    }

    if (msg.type === "lobbyNotFound") {
      setStatus("Lobby ikke funnet.");
      clearCurrentCode();
      showBanner(
        `Lobbyen <b>${msg.code || ""}</b> ble ikke funnet - serveren ble sannsynligvis restartet.`,
        "Start ny lobby",
        () => requestCreateLobby()
      );
      return;
    }

    if (msg.type === "lobbyState" && msg.restored) {
      setStatus("Lobby gjenopprettet fra database: " + msg.code);
      currentCode = msg.code;
      codeEl.textContent = msg.code;
      saveCurrentCode(msg.code);
      setDifficultyLabel(msg.board?.difficulty);
      setClassNameLabel(msg.className || "");
      renderBoard(msg.board);
      handlePlayersUpdate(msg.players || []);
      setTotal(msg.totalCatches || 0);
      if (Array.isArray(msg.events)) {
        bufferedEvents.length = 0;
        for (const ev of msg.events) bufferedEvents.push(ev);
        if (logVisible) renderBufferedEvents();
      }
      showBanner("Lobbyen ble gjenopprettet etter serverrestart. Elever må koble til på nytt.", null, null);
      return;
    }

    if (msg.type === "error") {
      setStatus("SERVER ERROR: " + (msg.message || "Feil"));
      showBanner(msg.message || "Serverfeil", null, null);
      return;
    }
  });
})();