// bingo_host.js
(function(){
    let ws = null;
    let lobbyCode = null;
    let board = null;
    let pkInfo = null;
    fetch('/pokemon_info.json').then(r => r.json()).then(d => pkInfo = d).catch(() => {});

    function esc(str) {
      return String(str ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    }
  
    function wsUrl(){
      const proto = location.protocol === "https:" ? "wss" : "ws";
      return `${proto}://${location.host}`;
    }
  
    function showToast({ name, pokemonCode, matched, matchedCell }){
      const el = document.getElementById("toast");
      const tag = document.getElementById("toastTag");
      const msg = document.getElementById("toastMsg");
  
      const stripped = pokemonCode.replace(/^[NS]/i, "").split("-");
      const dexEntry = pkInfo?.[stripped[0]];
      const varForm = stripped[1] ? dexEntry?.[stripped[1]] : null;
      const pokemonName = (varForm || dexEntry?.['0'])?.name || null;
  
      el.classList.remove("ok","no","show");
      el.classList.add(matched ? "ok" : "no");
      tag.textContent = matched ? "MATCH" : "FANGST";
      msg.textContent = pokemonName
        ? `${esc(name)} fanget ${esc(pokemonName)} (${esc(pokemonCode)})${matchedCell ? " → " + esc(matchedCell) : ""}`
        : `${esc(name)} fanget ${esc(pokemonCode)}${matchedCell ? " → " + esc(matchedCell) : ""}`;
  
      requestAnimationFrame(()=> el.classList.add("show"));
      setTimeout(()=> el.classList.remove("show"), 2600);
    }
  
    function renderBoard(b){
      board = b;
      const grid = document.getElementById("board");
      grid.innerHTML = "";
  
      grid.style.gridTemplateColumns = `repeat(${b.cols}, 1fr)`;
  
      for (const cell of b.cells) {
        const d = document.createElement("div");
        d.className = "cell";
        d.dataset.cellId = cell.cellId;
  
        d.innerHTML = `
          <div class="cellTop">
            <div class="cellId mono-code">${cell.cellId}</div>
            <div class="cellCode mono-code">${cell.displayCode}</div>
          </div>
          <div class="cellStatus">${cell.marked ? "✅" : ""}</div>
        `;
  
        if (cell.marked) d.classList.add("marked");
        grid.appendChild(d);
      }
    }
  
    function applyBoardUpdate(b){
      board = b;
      for (const cell of b.cells) {
        const el = document.querySelector(`.cell[data-cell-id="${cell.cellId}"]`);
        if (!el) continue;
        if (cell.marked) {
          el.classList.add("marked");
          const status = el.querySelector(".cellStatus");
          if (status) status.textContent = "✅";
        }
      }
    }
  
    function renderPlayers(players){
      const el = document.getElementById("players");
      el.innerHTML = "";
      for (const p of players) {
        const row = document.createElement("div");
        row.className = "prow";
        row.innerHTML = `
          <div>
            <div style="font-weight:700">${esc(p.name)}</div>
            <div class="small mono-code">${esc(p.uuid.slice(0,8))}…</div>
          </div>
          <div style="text-align:right">
            <div class="small">${p.connected ? "🟢 pålogget" : "⚪ frakoblet"}</div>
            <div class="small">nivå: <span class="mono-code">${esc(p.lastDifficulty || "-")}</span></div>
            <div class="small">sist: <span class="mono-code">${esc(p.lastCatch || "-")}</span></div>
          </div>
        `;
        el.appendChild(row);
      }
    }
  
    function renderEvents(events){
      const el = document.getElementById("events");
      el.innerHTML = "";
      for (const ev of events.slice(-30).reverse()) {
        const row = document.createElement("div");
        row.className = "erow";
        row.innerHTML = `
          <div class="small"><span style="font-weight:700">${esc(ev.name)}</span> – <span class="mono-code">${esc(ev.pokemonCode)}</span> – nivå <span class="mono-code">${esc(ev.difficulty || "-")}</span></div>
          <div class="small">${ev.matched ? "✅ match" : "• ikke match"} ${ev.matchedCell ? "→ " + esc(ev.matchedCell) : ""}</div>
        `;
        el.appendChild(row);
      }
    }
  
    function connectAsHostJoin(code, teacherSession){
      lobbyCode = code;
      ws = new WebSocket(wsUrl());
      ws.addEventListener("open", () => {
        ws.send(JSON.stringify({ type:"hostJoinLobby", code, teacherSession }));
      });
      ws.addEventListener("message", (ev) => {
        let msg;
        try { msg = JSON.parse(ev.data); } catch { return; }
  
        if (msg.type === "lobbyState") {
          document.getElementById("code").textContent = msg.code;
          renderBoard(msg.board);
          renderPlayers(msg.players || []);
          renderEvents(msg.events || []);
        }
        if (msg.type === "toastCatch") showToast(msg);
        if (msg.type === "boardUpdate") applyBoardUpdate(msg.board);
        if (msg.type === "playersUpdate") renderPlayers(msg.players || []);
        if (msg.type === "error") alert(msg.message || "Feil");
      });
    }
  
    function connectAsHostCreate(settings, teacherSession){
      ws = new WebSocket(wsUrl());
      ws.addEventListener("open", () => {
        ws.send(JSON.stringify({ type:"hostCreateLobby", teacherSession, settings }));
      });
      ws.addEventListener("message", (ev) => {
        let msg;
        try { msg = JSON.parse(ev.data); } catch { return; }
  
        if (msg.type === "lobbyCreated") {
          lobbyCode = msg.code;
          document.getElementById("code").textContent = msg.code;
          renderBoard(msg.board);
          renderPlayers(msg.players || []);
        }
        if (msg.type === "toastCatch") showToast(msg);
        if (msg.type === "boardUpdate") applyBoardUpdate(msg.board);
        if (msg.type === "playersUpdate") renderPlayers(msg.players || []);
        if (msg.type === "error") alert(msg.message || "Feil");
      });
    }
  
    // expose
    window.bingoHostCreate = connectAsHostCreate;
    window.bingoHostJoin = connectAsHostJoin;
  })();