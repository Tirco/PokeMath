// redeem.js  –  secret code redemption (server-backed)

async function checkCode() {
  const input  = document.getElementById("secretCodeInput");
  const respEl = document.getElementById("response");
  const code   = (input.value || "").trim();
  if (!code) { respEl.textContent = "Skriv inn en kode først."; return; }

  const lsKey = "redeemed_" + code.toLowerCase();
  if (localStorage.getItem(lsKey)) {
    respEl.textContent = "Du har allerede brukt denne koden!";
    return;
  }

  respEl.textContent = "Sjekker kode…";

  let data;
  try {
    const r = await fetch("/redeem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code })
    });
    data = await r.json();
  } catch (e) {
    respEl.textContent = "Nettverksfeil - sjekk internettforbindelsen og prøv igjen.";
    return;
  }

  if (!data.ok) {
    respEl.textContent = data.message || "Ugyldig kode!";
    return;
  }

  localStorage.setItem(lsKey, "1");
  applyRedeemPrize(data.prize);
  respEl.textContent = "🎉 Koden ble brukt!";
  input.value = "";
}

function applyRedeemPrize(prize) {
  const type  = prize.type  || "message";
  const value = prize.value || "";
  const label = prize.label || "Premie!";

  function img(fallback) {
    return prize.image || fallback || "images/logo.png";
  }

  switch (type) {
    case "coins": {
      const amt = Number(value) || 0;
      triggerAchievementOverlay(img("images/events/christmas/14.png"), label);
      addMoney(amt);
      break;
    }
    case "pokemon": {
      const entry   = String(value || "");
      const isShiny = /^S/i.test(entry);
      const baseId  = Number(entry.replace(/^[NS]/i, "").split("-")[0]);
      const folder  = isShiny ? "shiny" : "normal";
      triggerAchievementOverlay(img(`images/pokemon/${folder}/${baseId}.png`), label);
      if (entry) addSpecificToPokedex(entry);
      break;
    }
    case "random_legendary": {
      const id = REDEEM_LEGENDARIES[Math.floor(Math.random() * REDEEM_LEGENDARIES.length)];
      triggerAchievementOverlay(img(`images/pokemon/normal/${id}.png`), label);
      addSpecificToPokedex("N" + id);
      break;
    }
    case "random_mythic": {
      const id = REDEEM_MYTHICS[Math.floor(Math.random() * REDEEM_MYTHICS.length)];
      triggerAchievementOverlay(img(`images/pokemon/normal/${id}.png`), label);
      addSpecificToPokedex("N" + id);
      break;
    }
    case "random_shiny": {
      const id = Math.floor(Math.random() * 1008) + 1;
      triggerAchievementOverlay(img(`images/pokemon/shiny/${id}.png`), label);
      addSpecificToPokedex("S" + id);
      break;
    }
    case "random_shiny_mythic": {
      const id = REDEEM_MYTHICS[Math.floor(Math.random() * REDEEM_MYTHICS.length)];
      triggerAchievementOverlay(img(`images/pokemon/shiny/${id}.png`), label);
      addSpecificToPokedex("S" + id);
      break;
    }
    case "stardust": {
      const dustAmt = Math.max(1, Number(value) || 1);
      shopOptions.shinyBaitCount += dustAmt;
      saveAll();
      triggerAchievementOverlay(img("images/stardust.png"), label);
      break;
    }
    case "background": {
      if (value && !shopOptions.boughtBackgrounds.includes(value)) {
        shopOptions.boughtBackgrounds.push(value);
        saveAll();
      }
      triggerAchievementOverlay(img("images/logo.png"), label);
      break;
    }
    case "character": {
      if (value && !shopOptions.boughtPlayerIcons.includes(value)) {
        shopOptions.boughtPlayerIcons.push(value);
        saveAll();
      }
      triggerAchievementOverlay(img("images/logo.png"), label);
      break;
    }
    case "fireworks":
      triggerAchievementOverlay(img("images/logo.png"), label);
      createFireworks();
      break;
    default: // "message" or unknown
      triggerAchievementOverlay(img("images/logo.png"), label);
      break;
  }
}

const REDEEM_LEGENDARIES = [144,145,146,150,243,244,245,249,250,377,378,379,380,381,382,383,384,
  480,481,482,483,484,485,486,487,488,638,639,640,641,642,643,644,645,646,716,717,718,
  772,773,785,786,787,788,789,790,791,792,800,888,889,890,891,892,894,895,896,897,898,
  905,1001,1002,1003,1004,1007,1008];
const REDEEM_MYTHICS = [151,251,385,386,489,490,491,492,493,494,647,648,649,719,720,721,
  801,802,807,808,809,893];

function addMoney(value) {
  const money = document.querySelector(".money");
  if (money) {
    money.dataset.added = "+" + value;
    money.dataset.total = state.totalScore += value;
    money.textContent = "";
    money.classList.add("animate");
    setTimeout(() => money.classList.remove("animate"), 1000);
  } else {
    state.totalScore += value;
  }
  saveAll();
}

function createFireworks() {
  const container = document.createElement("div");
  for (let i = 0; i < 3; i++) {
    const d = document.createElement("div");
    d.classList.add("firework");
    container.appendChild(d);
  }
  const main = document.querySelector(".main");
  if (main) main.appendChild(container);
}

document.getElementById("secretCodeInput").addEventListener("keydown", function(e) {
  if (e.key === "Enter") { e.preventDefault(); checkCode(); }
});
