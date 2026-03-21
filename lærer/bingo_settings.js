(function () {
  const teacherSession = localStorage.getItem("teacherSession");
  const mustLogin   = document.getElementById("mustLogin");
  const settingsBox = document.getElementById("settingsBox");
  const startBtn    = document.getElementById("startBtn");
  const resetBtn    = document.getElementById("resetBtn");
  const statusEl    = document.getElementById("status");
  const diffEl      = document.getElementById("difficulty");
  const minLevelEl  = document.getElementById("minLevel");
  const classEl     = document.getElementById("className");
  const prizeEl       = document.getElementById("prizeType");
  const prizeSecretEl = document.getElementById("prizeSecret");

  function setStatus(msg, kind) {
    statusEl.className = "status" + (kind ? " " + kind : "");
    statusEl.textContent = msg || "";
  }

  if (!teacherSession) {
    if (mustLogin)   mustLogin.style.display   = "block";
    if (settingsBox) settingsBox.style.display = "none";
    return;
  }

  if (mustLogin)   mustLogin.style.display   = "none";
  if (settingsBox) settingsBox.style.display = "block";

  // Restore previous settings
  try {
    const prev = JSON.parse(sessionStorage.getItem("bingoSettings") || "{}");
    if (prev.difficulty && diffEl) diffEl.value = prev.difficulty;
    if (prev.minLevel  && minLevelEl) minLevelEl.value = prev.minLevel;
    if (prev.className  && classEl) classEl.value = prev.className;
    if (prev.prizeType  && prizeEl) prizeEl.value = prev.prizeType;
    if (prev.prizeSecret !== undefined && prizeSecretEl) prizeSecretEl.checked = !!prev.prizeSecret;
  } catch (_) {}

  startBtn.addEventListener("click", () => {
    const difficulty = diffEl ? diffEl.value : "medium";
    const minLevel   = minLevelEl ? minLevelEl.value : "alle";
    const className  = classEl ? classEl.value.trim() : "";
    const prizeType   = prizeEl ? prizeEl.value : "random";
    const prizeSecret = prizeSecretEl ? prizeSecretEl.checked : false;

    sessionStorage.setItem("bingoSettings", JSON.stringify({ difficulty, minLevel, className, prizeType, prizeSecret }));
    setStatus("Starter bingo…");
    startBtn.disabled = true;

    location.href = "/lærer/bingo_host.html";
  });

  resetBtn.addEventListener("click", () => {
    if (diffEl)     diffEl.value     = "medium";
    if (minLevelEl) minLevelEl.value = "alle";
    if (classEl)    classEl.value    = "";
    if (prizeEl)       prizeEl.value    = "random";
    if (prizeSecretEl) prizeSecretEl.checked = false;
    sessionStorage.removeItem("bingoSettings");
    setStatus("");
  });
})();
