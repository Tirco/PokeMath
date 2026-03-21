(function(){
    const $ = (id) => document.getElementById(id);
  
    const sessionBox = $("sessionBox");
    const loginBox = $("loginBox");
    const registerBox = $("registerBox");
    const forgotBox = $("forgotBox");
  
    const who = $("who");
    const whoEmail = $("whoEmail");
    const sessionHint = $("sessionHint");
  
    const loginEmail = $("loginEmail");
    const loginPassword = $("loginPassword");
    const loginBtn = $("loginBtn");
    const loginStatus = $("loginStatus");
  
    const logoutBtn = $("logoutBtn");

    const regName = $("regName");
    const regEmail = $("regEmail");
    const regPassword = $("regPassword");
    const regCounty = $("regCounty");
    const regMunicipality = $("regMunicipality");
    const regSchool = $("regSchool");
    const regHow = $("regHow");
    const registerBtn = $("registerBtn");
    const registerStatus = $("registerStatus");
  
    const forgotBtn = $("forgotBtn");
    const forgotEmail = $("forgotEmail");
    const forgotSendBtn = $("forgotSendBtn");
    const forgotCloseBtn = $("forgotCloseBtn");
    const forgotStatus = $("forgotStatus");
  
    function setStatus(el, msg, kind="info"){
      el.className = "status " + (kind === "good" ? "good" : kind === "bad" ? "bad" : "");
      el.textContent = msg || "";
    }
  
    function getTeacherSession(){
      return localStorage.getItem("teacherSession") || "";
    }
    function setTeacherSession(t){
      if (t) localStorage.setItem("teacherSession", t);
      else localStorage.removeItem("teacherSession");
    }
  
    async function apiJson(url, opts){
      const r = await fetch(url, opts);
      const text = await r.text();
      let data = null;
      try { data = JSON.parse(text); } catch {}
      if (!r.ok) {
        const msg = (data && data.message) ? data.message : (text || `${r.status} ${r.statusText}`);
        throw new Error(msg);
      }
      return data || {};
    }
  
    async function validateSession(){
      const token = getTeacherSession();
      if (!token) return null;
  
      try{
        const data = await apiJson("/teacher/session", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (!data.ok) return null;
        return data.teacher;
      }catch{
        return null;
      }
    }
  
    const teacherToolsSection = $("teacherToolsSection");

    function showLoggedOut(){
      sessionBox.style.display = "none";
      if (teacherToolsSection) teacherToolsSection.style.display = "none";
      loginBox.style.display = "block";
      registerBox.style.display = "block";
    }
  
    function showLoggedIn(t){
      loginBox.style.display = "none";
      registerBox.style.display = "none";
      forgotBox.style.display = "none";
      sessionBox.style.display = "block";

      who.textContent = `Du er logget inn som ${t.name || "Lærer"}.`;
      whoEmail.textContent = t.email || "";

      const exp = t.exp ? new Date(t.exp).toLocaleString("no-NO", { hour12:false }) : "";
      sessionHint.textContent = exp ? `Sesjon utløper: ${exp}` : "";

      const tc = document.getElementById("tokenCount");
      if (tc) tc.textContent = t.code_tokens ?? "?";

      if (teacherToolsSection) teacherToolsSection.style.display = "block";
    }
  
    // Initial: validate token against server
    (async () => {
      const t = await validateSession();
      if (t) showLoggedIn(t);
      else {
        setTeacherSession(""); // remove invalid token so UI isn't misleading
        showLoggedOut();
      }
    })();
  
    // Login
    loginBtn.addEventListener("click", async () => {
      setStatus(loginStatus, "Logger inn…");
      try{
        const email = (loginEmail.value || "").trim().toLowerCase();
        const password = (loginPassword.value || "");
        const data = await apiJson("/teacher/login", {
          method:"POST",
          headers:{ "Content-Type":"application/json" },
          body: JSON.stringify({ email, password })
        });
  
        if (!data.ok) throw new Error(data.message || "Kunne ikke logge inn.");
        setTeacherSession(data.teacherSession);
  
        const t = await validateSession();
        if (!t) throw new Error("Sesjonen var ikke gyldig etter innlogging.");
        setStatus(loginStatus, "", "info");
        showLoggedIn(t);
      }catch(e){
        setStatus(loginStatus, e.message, "bad");
      }
    });
  
    // Logout
    logoutBtn.addEventListener("click", () => {
      setTeacherSession("");
      showLoggedOut();
    });
  
    // Register
    registerBtn.addEventListener("click", async () => {
      setStatus(registerStatus, "Sender registrering…");
      try{
        const payload = {
          name: (regName.value || "").trim(),
          email: (regEmail.value || "").trim().toLowerCase(),
          password: (regPassword.value || ""),
          county: (regCounty.value || "").trim(),
          municipality: (regMunicipality.value || "").trim(),
          schoolName: (regSchool.value || "").trim(),
          howFound: (regHow.value || "").trim(),
        };
  
        const data = await apiJson("/teacher/register", {
          method:"POST",
          headers:{ "Content-Type":"application/json" },
          body: JSON.stringify(payload)
        });
  
        setStatus(registerStatus, data.message || "Registrert! Vent på godkjenning.", "good");
      }catch(e){
        setStatus(registerStatus, e.message, "bad");
      }
    });
  
    // Forgot password
    forgotBtn.addEventListener("click", () => {
      forgotBox.style.display = "flex";
      forgotEmail.value = (loginEmail.value || "").trim();
      setStatus(forgotStatus, "");
    });

    forgotBox.addEventListener("click", (e) => {
      if (e.target === forgotBox) {
        forgotBox.style.display = "none";
        setStatus(forgotStatus, "");
      }
    });

    forgotCloseBtn.addEventListener("click", () => {
      forgotBox.style.display = "none";
      setStatus(forgotStatus, "");
    });
  
    forgotSendBtn.addEventListener("click", async () => {
      setStatus(forgotStatus, "Sender forespørsel…");
      try{
        const email = (forgotEmail.value || "").trim().toLowerCase();
        const data = await apiJson("/teacher/forgot-password", {
          method:"POST",
          headers:{ "Content-Type":"application/json" },
          body: JSON.stringify({ email })
        });
        setStatus(forgotStatus, data.message || "Forespørsel registrert. Du vil snart motta en e-post.", "good");
      }catch(e){
        setStatus(forgotStatus, e.message, "bad");
      }
    });

    // Delete account
    const deleteAccountBtn = $("deleteAccountBtn");
    const deleteStatus = $("deleteStatus");
    if (deleteAccountBtn) {
      deleteAccountBtn.addEventListener("click", async () => {
        if (!confirm("Er du sikker på at du vil slette kontoen din permanent? Dette kan ikke angres.")) return;
        setStatus(deleteStatus, "Sletter konto…");
        deleteAccountBtn.disabled = true;
        try {
          const token = getTeacherSession();
          const data = await apiJson("/teacher/account", {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
          });
          if (!data.ok) throw new Error(data.message || "Noe gikk galt.");
          setTeacherSession("");
          setStatus(deleteStatus, "Konto slettet. Du vil motta en bekreftelse på e-post.", "good");
          setTimeout(() => showLoggedOut(), 2500);
        } catch(e) {
          setStatus(deleteStatus, e.message, "bad");
          deleteAccountBtn.disabled = false;
        }
      });
    }

    // Kodeoversikt
    const showCodesBtn = $("showCodesBtn");
    const codesPanel   = $("codesPanel");
    const codesList    = $("codesList");
    const PRIZE_LABELS = {
      coins: "Mynter", pokemon: "Pokémon", random_legendary: "Tilfeldig legendarisk",
      random_mythic: "Tilfeldig mytisk", random_shiny: "Tilfeldig shiny",
      random_shiny_mythic: "Tilfeldig shiny mytisk", message: "Melding", fireworks: "Fyrverkeri"
    };

    if (showCodesBtn) {
      showCodesBtn.addEventListener("click", async () => {
        const visible = codesPanel.style.display !== "none";
        if (visible) {
          codesPanel.style.display = "none";
          showCodesBtn.textContent = "🔑 Kodeoversikt";
          return;
        }
        codesPanel.style.display = "block";
        showCodesBtn.textContent = "🔑 Skjul koder";
        codesList.innerHTML = "Laster…";
        try {
          const token = getTeacherSession();
          const data = await apiJson("/teacher/codes", {
            headers: { "Authorization": `Bearer ${token}` }
          });
          if (!data.ok || !data.codes.length) {
            codesList.innerHTML = "<p class='muted'>Ingen synlige koder for øyeblikket.</p>";
            return;
          }
          codesList.innerHTML = data.codes.map(c => {
            const prizeLabel = PRIZE_LABELS[c.prize_type] || c.prize_type;
            const extra = c.prize_type === "coins" ? ` (${Number(c.prize_value).toLocaleString("no-NO")} kr)` :
                          c.prize_type === "pokemon" ? ` (${c.prize_value})` : "";
            const imgHtml = c.prize_image
              ? `<img src="/${c.prize_image.replace(/^\//, "")}" style="width:40px;height:40px;object-fit:contain;vertical-align:middle;margin-right:10px;image-rendering:pixelated;">`
              : "";
            return `<div style="display:flex;align-items:center;padding:10px 0;border-bottom:1px solid rgba(0,0,0,0.07);">
              ${imgHtml}
              <div>
                <div class="code-blur" style="font-weight:700;font-family:monospace;font-size:15px;">${esc(c.plaintext_code)}</div>
                <div style="font-size:13px;color:#555;">${esc(c.label)} · ${prizeLabel}${extra} · ${c.repeatable ? "Kan brukes flere ganger" : "Engangs"}</div>
              </div>
            </div>`;
          }).join("");
        } catch(e) {
          codesList.innerHTML = `<p class='muted bad'>Feil: ${e.message}</p>`;
        }
      });
    }

    function esc(s) {
      return String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
    }

    // Lag kode panel toggle
    const showCreateCodeBtn = $("showCreateCodeBtn");
    const createCodePanel   = $("createCodePanel");
    if (showCreateCodeBtn) {
      showCreateCodeBtn.addEventListener("click", () => {
        const visible = createCodePanel.style.display !== "none";
        createCodePanel.style.display = visible ? "none" : "block";
        showCreateCodeBtn.textContent = visible ? "➕ Lag kode" : "➕ Skjul";
      });
    }

    // Lazy-load pokemon_info.json (needed for variant validation)
    let pkInfoData = null;
    async function loadPkInfo() {
      if (pkInfoData) return;
      try { pkInfoData = await fetch('/pokemon_info.json').then(r => r.json()); }
      catch { pkInfoData = {}; }
    }

    // Prize type → update value field label/hint/visibility
    const tcType = $("tcType");
    const tcValueField = $("tcValueField");
    const tcValueLabel = $("tcValueLabel");
    const tcValueHint  = $("tcValueHint");
    const tcValueInput = $("tcValue");
    const NEEDS_VALUE  = ["coins", "pokemon"];

    // Image dropdown → live preview (declared early so updateTypeUI can reference it)
    const tcImageSelect   = $("tcImage");
    const tcImageNone     = document.getElementById("tcImageNone");
    const tcImageAutoPoke = document.getElementById("tcImageAutoPoke");

    function updateTypeUI() {
      const t = tcType ? tcType.value : "";
      if (tcValueField) tcValueField.style.display = NEEDS_VALUE.includes(t) ? "" : "none";
      if (t === "coins") {
        if (tcValueLabel) tcValueLabel.textContent = "Beløp (maks 50 000)";
        if (tcValueInput) tcValueInput.placeholder = "f.eks. 10000";
        if (tcValueHint)  tcValueHint.style.display = "none";
      } else if (t === "pokemon") {
        if (tcValueLabel) tcValueLabel.textContent = "Pokémon-kode";
        if (tcValueInput) tcValueInput.placeholder = "f.eks. N25 eller S150";
        if (tcValueHint)  tcValueHint.style.display = "";
      }
      // Toggle auto-pokemon image option
      if (tcImageNone)     tcImageNone.hidden     = (t === "pokemon");
      if (tcImageAutoPoke) tcImageAutoPoke.hidden  = (t !== "pokemon");
      if (tcImageSelect && tcImageSelect.value === "") {
        if (t === "pokemon" && tcImageAutoPoke) tcImageAutoPoke.selected = true;
        else if (t !== "pokemon" && tcImageNone) tcImageNone.selected = true;
      }
      // Repeatable only allowed for message type
      const repRow = document.getElementById("tcRepeatableRow");
      if (repRow) {
        const allow = (t === "message");
        repRow.style.display = allow ? "" : "none";
        if (!allow) $("tcRepeatable").checked = false;
      }
    }
    if (tcType) {
      tcType.addEventListener("change", updateTypeUI);
      updateTypeUI();
    }

    // (tcImageSelect already declared above)
    const tcImagePreview = $("tcImagePreview");
    if (tcImageSelect) {
      tcImageSelect.addEventListener("change", () => {
        const src = tcImageSelect.value;
        if (src && tcImagePreview) {
          tcImagePreview.src = "/" + src;
          tcImagePreview.style.display = "";
        } else if (tcImagePreview) {
          tcImagePreview.style.display = "none";
        }
      });
    }

    // Create code form — with validation
    const createTeacherCodeBtn = $("createTeacherCodeBtn");
    if (createTeacherCodeBtn) {
      createTeacherCodeBtn.addEventListener("click", async () => {
        const statusEl = $("createCodeStatus");
        const code  = ($("tcCode").value  || "").trim();
        const label = ($("tcLabel").value || "").trim();
        const type  = tcType ? tcType.value : "";
        const value = ($("tcValue").value || "").trim();
        const image = tcImageSelect ? (tcImageSelect.value || "") : "";
        const repeatable = type === "message" ? $("tcRepeatable").checked : false;

        if (!code || !label || !type) {
          setStatus(statusEl, "Fyll inn kode, label og premie-type.", "bad");
          return;
        }

        // Coins validation
        if (type === "coins") {
          const amt = Number(value);
          if (!value || isNaN(amt) || amt <= 0) {
            setStatus(statusEl, "Skriv inn et gyldig beløp (1–50 000).", "bad");
            return;
          }
          if (amt > 50000) {
            setStatus(statusEl, "Maks 50 000 mynter per kode.", "bad");
            return;
          }
        }

        // Pokémon entry validation
        if (type === "pokemon") {
          if (!value) {
            setStatus(statusEl, "Skriv inn en Pokémon-kode (f.eks. N25 eller S150).", "bad");
            return;
          }
          if (/U/i.test(value)) {
            setStatus(statusEl, "Unike Pokémon (U-varianter) kan ikke brukes som kode-premie.", "bad");
            return;
          }
          if (!/^[NSns]\d+(-[A-Z]?\d+)?$/i.test(value)) {
            setStatus(statusEl, "Ugyldig Pokémon-kode. Bruk N{id} for normal eller S{id} for shiny, f.eks. N25, S150, N25-U1.", "bad");
            return;
          }
          const parts = value.replace(/^[NSns]/, "").split("-");
          const baseId = Number(parts[0]);
          if (baseId < 1 || baseId > 1100) {
            setStatus(statusEl, "Pokémon-ID må være mellom 1 og 1100.", "bad");
            return;
          }
          // If a variant is given, check it exists in pokemon_info.json
          if (parts.length > 1) {
            const varKey = parts[1].toUpperCase();
            setStatus(statusEl, "Sjekker variant…");
            await loadPkInfo();
            const form = pkInfoData?.[String(baseId)]?.[varKey];
            if (!form) {
              setStatus(statusEl, `Variant -${varKey} finnes ikke for Pokémon #${baseId}. Sjekk koden og prøv igjen.`, "bad");
              return;
            }
          }
        }

        setStatus(statusEl, "Lagrer…");
        createTeacherCodeBtn.disabled = true;
        try {
          const token = getTeacherSession();
          const data = await apiJson("/teacher/codes", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
            body: JSON.stringify({ plaintext_code: code, label, prize_type: type,
              prize_value: value || null, prize_image: image || null,
              repeatable, teacher_visible: true })
          });
          setStatus(statusEl, "✅ Kode lagret!", "good");
          $("tcCode").value = "";
          $("tcLabel").value = "";
          if (tcValueInput) tcValueInput.value = "";
          if (tcImageSelect) { tcImageSelect.value = ""; }
          if (tcImagePreview) tcImagePreview.style.display = "none";
          const tc = $("tokenCount");
          if (tc) tc.textContent = data.code_tokens ?? "?";
        } catch(e) {
          setStatus(statusEl, e.message, "bad");
        } finally {
          createTeacherCodeBtn.disabled = false;
        }
      });
    }
  })();