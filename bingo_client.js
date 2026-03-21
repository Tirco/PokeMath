// bingo_client.js
(function(){
    let ws = null;
  
    function wsUrl(){
      const proto = location.protocol === "https:" ? "wss" : "ws";
      return `${proto}://${location.host}`;
    }
  
    function getState(){
      try { return window.state || JSON.parse(localStorage.getItem("state") || "{}"); }
      catch { return {}; }
    }
  
    function getPlayerName(){
      const st = getState();
      return (st.username || st.playerName || "Elev").toString().slice(0, 32);
    }
  
    function getUUID(){
      const st = getState();
      return (st.uuid || st.user_uuid || st.playerUUID || "").toString();
    }
  
    function connectToLobby(code){
      if (!code) return;
      const upper = code.toUpperCase().trim();
  
      localStorage.setItem("bingoCode", upper);
  
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type:"joinLobby", code: upper, uuid: getUUID(), name: getPlayerName() }));
        return;
      }
  
      ws = new WebSocket(wsUrl());
      ws.addEventListener("open", () => {
        ws.send(JSON.stringify({ type:"joinLobby", code: upper, uuid: getUUID(), name: getPlayerName() }));
      });
      ws.addEventListener("message", (ev) => {
        let msg;
        try { msg = JSON.parse(ev.data); } catch { return; }
        if (msg.type === "joinResult") {
          window.dispatchEvent(new CustomEvent("bingoJoinResult", { detail: msg }));
        }
      });
      ws.addEventListener("close", () => {
        // silent
      });
    }
  
    function sendCatch(pokemonCode, difficulty){
      const code = (localStorage.getItem("bingoCode") || "").toUpperCase().trim();
      if (!code || !ws || ws.readyState !== WebSocket.OPEN) return;
  
      ws.send(JSON.stringify({
        type: "catchPokemon",
        code,
        uuid: getUUID(),
        name: getPlayerName(),
        difficulty: difficulty || null,
        pokemonCode
      }));
    }
  
    // expose API
    window.bingoConnect = connectToLobby;
    window.bingoSendCatch = sendCatch;
  
    // auto-connect if already joined earlier
    const stored = (localStorage.getItem("bingoCode") || "").toUpperCase().trim();
    if (stored) connectToLobby(stored);
  })();