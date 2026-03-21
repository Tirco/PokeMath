const pkmnNum = 1025
const pokeball = document.getElementById("pokeball")
const pokedex = document.getElementById("pokedex")
const endMessage = document.querySelector(".end-message")
const newCatchInfo = document.getElementById("new-catch-info")

const specialbonus = 3

let pkmnInfoData = null;
let legendaries = [];
let mythics = [];
let specialforms = [];

fetch('pokemon_info.json')
  .then(r => r.json())
  .then(data => {
    pkmnInfoData = data;
    for (const [dex, variants] of Object.entries(data)) {
      const base = variants['0'];
      if (!base) continue;
      const dexNum = parseInt(dex);
      if (base.is_legendary) legendaries.push(dexNum);
      if (base.is_mythical) mythics.push(dexNum);
      const hasNumericVariants = Object.keys(variants).some(k => /^\d+$/.test(k) && k !== '0');
      if (hasNumericVariants) specialforms.push(dexNum);
    }
    document.dispatchEvent(new Event('pokemonInfoLoaded'));
  });

function getCurrentSeason() {
  const month = new Date().getMonth() + 1;
  if ([3, 4, 5].includes(month))  return 'spring';
  if ([6, 7, 8].includes(month))  return 'summer';
  if ([9, 10, 11].includes(month)) return 'autumn';
  return 'winter';
}

function getCurrentEventType() {
  const month = new Date().getMonth() + 1;
  if (month === 10) return 'H';
  if (month === 12) return 'C';
  if ([3, 4].includes(month)) return 'E';
  if ([6, 7, 8].includes(month)) return 'S';
  return null;
}



function calculateShinyChance(level){
  if(mathValues.stage == null) {
    mathValues.stage = 1;
  }
   var chance = 55 + (15 - mathValues.stage * 3) - (level/3.3) - (state.streak/1000);
   if(chance < 0) { 
    chance = 0;
   }
   return chance;
}

//For use in informational bits. Currently only used in console.
function shinyChancePercentage(partialValue, totalValue) {
  return "" + ((1 / calculateShinyChance(shopOptions.shinyLevel))*100).toFixed(4) + "%"
}

function simulateShiny(level) {
  var chance = calculateShinyChance(level);
  var value = Math.floor(Math.random() * chance);
  var percentage = (1/chance)*100 + "%";
  log("Level: " + level + " Highest: " + chance + " value: " + value + " percentage: " + percentage)
}
/**
 * Should they get a shiny?
 * This function will check their shinyChance and compare it to a generated number.
 */
 function generateShiny() {
  return Math.floor(Math.random() * calculateShinyChance(shopOptions.shinyLevel)) //Here shinyChance is defined.
}

if(pokeball != null) {
  pokeball.addEventListener('click', () => { 
    createRandomPokemon()
  })
}

/**
 * Function to always create a special pokemon. 
 * It is not guaranteed that it will be any of the special versions of the pokemon that is picked.
 */
function createSpecialPokemon(){
  let randomInt = Math.floor(Math.random() * specialforms.length)
  randomPokemon = specialforms[randomInt]
  createSpecificPokemon(randomPokemon);
}

function canCaptureLegendary() {
  var value = (Math.floor(Math.random() * (31-((Number(mathValues.stage)*3) + shopOptions.legendLevel+ (state.streak/1000)))));
  log("legend check: " + value);
  if(value < 0) {
    value = 0;
  }
  var boolean = value === 0;
  if(boolean) {
    state.streak = 0; //Reset streak
  }
  return boolean;
}

function canCaptureMythic() {
  var value = (Math.floor(Math.random() * (41-((Number(mathValues.stage)*3) + shopOptions.mythicLevel + (state.streak/1000)))));
  log("mythic check: " + value);
  if(value < 0) {
    value = 0;
  }
  var boolean = value === 0;
  if(boolean) {
    state.streak = 0; //Reset streak
  }
  return boolean;
}

/**
 * Function to make any random pokemon.
 * @returns 
 */
function createRandomPokemon(){
  let randomPokemon = Math.floor(Math.random() * (pkmnNum + (specialbonus + Number(mathValues.stage))))+1
  if(randomPokemon > pkmnNum) {
    //Get extra special roll
    randomPokemon = specialforms[Math.floor(Math.random() * specialforms.length)]
  }

  if(legendaries.includes(randomPokemon)) {
    //Legendaries should be 5x more rare than any other pokemon. Let us see if they get to keep it, or we will reroll.
    if(!canCaptureLegendary()) {
      createRandomPokemon()
      return
    }
  } else if(mythics.includes(randomPokemon)) {
    //Legendaries should be 5x more rare than any other pokemon. Let us see if they get to keep it, or we will reroll.
    if(!canCaptureMythic()) {
      createRandomPokemon()
      return
    }
  }

  createSpecificPokemon(randomPokemon);
  pokeball.classList.add("is-hidden")
}

/**
 * Create a specific pokemon and give it to the user.
 * @param {number} dexId The dex ID of the pokemon to give to the user.
 */
function createSpecificPokemon(dexId) {
  pokeball.classList.add("is-hidden")
  resetButton.classList.remove("is-hidden")

  if (!pkmnInfoData) {
    addToPokedex(dexId);
    return;
  }

  const variants = pkmnInfoData[String(dexId)];
  if (!variants) {
    addToPokedex(dexId);
    return;
  }

  const season = getCurrentSeason();

  // Build pool: only numeric-keyed variants (excludes event H/C/U/E/S keys).
  // Seasonal variants (e.g. Deerling) only appear in their matching season.
  const pool = Object.entries(variants).filter(([key, v]) => {
    if (!/^\d+$/.test(key)) return false;
    if (key === '0') return true;
    if (v.spawn_season && v.spawn_season !== season) return false;
    return true;
  });

  let chosenKey = '0';
  const variantPool = pool.filter(([k]) => k !== '0');
  const stage = (mathValues && mathValues.stage) || 3;
  const altThreshold = stage <= 1 ? 0.95 : stage <= 2 ? 0.85 : 0.4;
  if (variantPool.length > 0 && Math.random() > altThreshold) {
    const [key] = variantPool[Math.floor(Math.random() * variantPool.length)];
    chosenKey = key;
  }

  const specialId = chosenKey === '0' ? String(dexId) : `${dexId}-${chosenKey}`;
  addToPokedex(specialId);
}

function createEventPokemon(overrideType) {
  pokeball.classList.add("is-hidden")
  resetButton.classList.remove("is-hidden")

  const typeMap = { halloween: "H", christmas: "C", easter: "E", summer: "S", unique: "U" };
  const eventType = typeMap[overrideType?.toLowerCase()] || overrideType || getCurrentEventType();
  if (!eventType || !pkmnInfoData) return;

  const pool = [];
  const pattern = new RegExp(`^${eventType}\\d+$`);
  for (const [dex, variants] of Object.entries(pkmnInfoData)) {
    for (const [key, v] of Object.entries(variants)) {
      if (pattern.test(key) && v.enabled) {
        pool.push(`${dex}-${key}`);
      }
    }
  }

  if (!pool.length) return;
  const pick = pool[Math.floor(Math.random() * pool.length)];
  log("Capturing event pokemon - " + pick);
  addToPokedex(pick);
}

function getRandomProperty(obj){
  var keys = Object.keys(obj);
  return obj[keys[ keys.length * Math.random() << 0]];
};


/**
 * Add a pokemon to the pokedex
 * @param {*} randomPokemon = ID of pokemon to add
 * @param {*} generateShiny = 0 for shiny, 1+ for not.
 */
function addToPokedex(id) {
  let entry = "";
  const baitActive = shopOptions.shinyBaitCount > 0;
  if(baitActive) {
    shopOptions.shinyBaitCount--;
    saveAll();
  }
  if(baitActive || generateShiny() === 0) {
    entry = "S"+id;
    state.streak = 0; //Reset streak
  } else {
    entry = "N"+id;
  }
  
  state.pkmnCaught++
  const pkmncaught = document.getElementById("balltext")
  pkmncaught.textContent = state.pkmnCaught
  state.pkmnList.push(entry);
  if (typeof trackEvent === "function") trackEvent("/track-catch", {});
  loadFromList(entry,false,true,false);
  const bingoFn = window.bingoSendCatch || window.bingoReportCatch;
  if (typeof bingoFn === "function") {
    const params = new URLSearchParams(window.location.search);
    const stage = params.get("stage");
    const difficulty = stage ? `stage${stage}` : (params.get("custom") ? "custom" : null);

    const raw = String(entry || "").replace(/^[NS]/i, "");
    const baseId = Number(raw.split("-")[0]);
    const hasVar = raw.includes("-");

    const dexEntry = pkmnInfoData?.[baseId];
    const baseForm = dexEntry?.['0'];
    let pokemonName = baseForm?.name || null;
    let types = Array.isArray(baseForm?.types) ? baseForm.types : (baseForm?.types ? [baseForm.types] : []);

    if (hasVar) {
      const rawVar = raw.split("-")[1] || "";
      const varForm = dexEntry?.[rawVar];
      if (varForm) {
        pokemonName = varForm.name || pokemonName;
        types = Array.isArray(varForm.types) ? varForm.types : (varForm.types ? [varForm.types] : types);
      }
    }

    const flags = {
      shiny: /^S/i.test(entry),
      mega: (pokemonName || "").toLowerCase().includes("mega"),
      gmax: (pokemonName || "").toLowerCase().includes("gigantamax") || (pokemonName || "").toLowerCase().includes("gmax"),
      hisuian: (pokemonName || "").toLowerCase().includes("hisuian"),
      alolan: (pokemonName || "").toLowerCase().includes("alolan"),
      legendary: (typeof legendaries !== "undefined") ? legendaries.includes(baseId) : false,
      mythic: (typeof mythics !== "undefined") ? mythics.includes(baseId) : false
    };
  
    const extra = { pokedexId: baseId, types, flags, pokemonName };
    window.bingoSendCatch(entry, difficulty, extra);
  }

  return;
}

function addSpecificToPokedex(entry) {
  state.pkmnCaught++
  const pkmncaught = document.getElementById("balltext")
  pkmncaught.textContent = state.pkmnCaught
  state.pkmnList.push(entry);
  // Easter event: increment local counter and notify global API
  if (window.easterEvent) {
    const year = new Date().getFullYear();
    if (parseInt(localStorage.getItem('easterYear') || '0') === year) {
      const prev = parseInt(localStorage.getItem('easterCaught') || '0');
      const next = prev + 1;
      localStorage.setItem('easterCaught', next);
      // Mark timestamp when a local segment is first reached
      const seg = Math.floor(next / 50); // segment that just completed (1-indexed when next%50===0)
      if (next % 50 === 0 && seg >= 1 && seg <= 10) {
        try {
          const ts = JSON.parse(localStorage.getItem('easterLocalTs') || '{}');
          if (!ts[seg]) { ts[seg] = Date.now(); localStorage.setItem('easterLocalTs', JSON.stringify(ts)); }
        } catch {}
      }
    }
    // Global API (rate-limited server-side by UUID)
    try {
      const uuid = typeof getOrCreateUUID === 'function' ? getOrCreateUUID() : null;
      if (uuid) fetch('/api/easter/catch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uuid })
      }).catch(() => {});
    } catch {}
  }
  if (typeof trackEvent === "function") trackEvent("/track-catch", {});
  if(checkACookieExists("cookies")) {
    window.localStorage.setItem('pokemonlist',JSON.stringify(state.pkmnList.join('|')))
  } else {
    const toast = new Toast({
      text: "Du har ikke godkjent bruken av Cookies, så vi kan ikke lagre din spillerdate på din enhet. Last inn siden på nytt og godkjenn cookies for at dette skal fungere.",
      position: "top-right",
      pauseOnHover: true,
      pauseOnFocusLoss: true,
      canClose: true,
      badToast: true,
    })
  }
  return;
}

// ---------------------------------------------------------------------------
// Bingo prize application — called by bingo_client_live.js after claiming
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Bingo lootbox animation
// ---------------------------------------------------------------------------
function _ensureBingoLootboxStyles() {
  if (document.getElementById("bingo-lootbox-style")) return;
  var style = document.createElement("style");
  style.id = "bingo-lootbox-style";
  style.textContent = [
    "#bingo-lootbox-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.82);z-index:99999;display:flex;align-items:center;justify-content:center;flex-direction:column;animation:blootboxFadeIn 0.3s ease;}",
    "@keyframes blootboxFadeIn{from{opacity:0}to{opacity:1}}",
    "@keyframes blootboxSpin{0%{transform:rotate(0deg) scale(1)}50%{transform:rotate(180deg) scale(1.15)}100%{transform:rotate(360deg) scale(1)}}",
    "@keyframes blootboxShake{0%,100%{transform:translateX(0) scale(1.2)}20%{transform:translateX(-10px) rotate(-6deg) scale(1.2)}40%{transform:translateX(10px) rotate(6deg) scale(1.2)}60%{transform:translateX(-6px) scale(1.2)}80%{transform:translateX(6px) scale(1.2)}}",
    "@keyframes blootboxReveal{0%{opacity:0;transform:scale(0.4) translateY(30px)}60%{transform:scale(1.1) translateY(-5px)}100%{opacity:1;transform:scale(1) translateY(0)}}",
    "@keyframes blootboxFlash{0%,100%{background:rgba(0,0,0,0.82)}50%{background:rgba(255,255,255,0.95)}}",
    ".blootbox-ball{width:110px;height:110px;border-radius:50%;background:linear-gradient(180deg,#cc1a1a 50%,#fff 50%);border:5px solid #222;box-shadow:0 0 40px rgba(204,26,26,0.6),inset 0 -4px 8px rgba(0,0,0,0.3);position:relative;}",
    ".blootbox-ball::after{content:'';position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:26px;height:26px;border-radius:50%;background:#fff;border:5px solid #222;box-shadow:0 0 0 3px #fff;}",
    ".blootbox-prize{display:flex;flex-direction:column;align-items:center;gap:12px;animation:blootboxReveal 0.6s cubic-bezier(0.22,1,0.36,1) forwards;}",
    ".blootbox-prize img{width:110px;height:110px;image-rendering:pixelated;filter:drop-shadow(0 4px 16px rgba(255,220,50,0.8));}",
    ".blootbox-prize .blootbox-label{color:#fff;font-size:1.4em;font-weight:800;text-shadow:0 2px 8px rgba(0,0,0,0.7);text-align:center;max-width:320px;}",
    ".blootbox-tap{color:rgba(255,255,255,0.55);font-size:0.9em;margin-top:20px;}"
  ].join("");
  document.head.appendChild(style);
}

function _showSingleLootbox(prize, onDone) {
  _ensureBingoLootboxStyles();
  var overlay = document.createElement("div");
  overlay.id = "bingo-lootbox-overlay";

  var ball = document.createElement("div");
  ball.className = "blootbox-ball";
  ball.style.animation = "blootboxSpin 1.2s ease-in-out";
  overlay.appendChild(ball);

  var tap = document.createElement("div");
  tap.className = "blootbox-tap";
  tap.textContent = "Trykk for å åpne...";
  overlay.appendChild(tap);

  document.body.appendChild(overlay);

  function reveal() {
    overlay.removeEventListener("click", reveal);
    overlay.style.animation = "blootboxFlash 0.4s ease";

    setTimeout(function() {
      overlay.innerHTML = "";

      var prizeDiv = document.createElement("div");
      prizeDiv.className = "blootbox-prize";

      var imgEl = document.createElement("img");
      var label = "";

      if (prize.type === "coins") {
        imgEl.src = "/images/coinbag.svg";
        imgEl.style.filter = "none";
        var amt = Number(prize.amount) || 0;
        var potNote = prize.participationPot
          ? "<br><span style='font-size:0.7em;opacity:0.75'>Pott: " + Number(prize.participationPot).toLocaleString("no-NO") + " mynter totalt</span>"
          : "";
        var coinPrefix = prize.source === "admin" ? "Gave fra admin: " : "";
        label = coinPrefix + "+" + amt.toLocaleString("no-NO") + " mynter!" + potNote;
      } else if (prize.type === "pokemon") {
        var isShiny = prize.shiny || (prize.entry || "").startsWith("S");
        var folder = isShiny ? "shiny" : "normal";
        imgEl.src = "/images/pokemon/" + folder + "/" + prize.pokedexId + ".png";
        var name = prize.easterName || pkmnInfoData?.[String(prize.pokedexId)]?.['0']?.name || "Pokémon #" + prize.pokedexId;
        var sourceLabel = prize.source === "admin"  ? "Gave fra admin:"
                        : prize.source === "easter" ? "Påskepremie!"
                        : "Bingo-premie!";
        var typeLabel   = prize.source === "admin" || prize.source === "easter"
                        ? (isShiny ? "Shiny " : "")
                        : (isShiny ? "✨ Shiny " : (prize.legendary ? "⭐ Legendarisk " : "🌟 Mytisk "));
        label = sourceLabel + "<br>" + typeLabel + name;
        if (prize.easterCoins) {
          label += "<br><span style='font-size:0.75em;opacity:0.85'>+" + Number(prize.easterCoins).toLocaleString("no-NO") + " mynter</span>";
        }
      }

      var labelEl = document.createElement("div");
      labelEl.className = "blootbox-label";
      labelEl.innerHTML = label;

      prizeDiv.appendChild(imgEl);
      prizeDiv.appendChild(labelEl);
      overlay.appendChild(prizeDiv);

      var closeTap = document.createElement("div");
      closeTap.className = "blootbox-tap";
      closeTap.textContent = "Trykk for å lukke";
      overlay.appendChild(closeTap);

      overlay.addEventListener("click", function() {
        overlay.remove();
        if (onDone) onDone();
      });
    }, 400);
  }

  // Auto-open after 2.5s if not tapped
  var autoTimer = setTimeout(reveal, 2500);
  overlay.addEventListener("click", function() {
    clearTimeout(autoTimer);
    reveal();
  }, { once: true });
}

function _showLootboxQueue(queue, idx) {
  if (idx >= queue.length) return;
  _showSingleLootbox(queue[idx], function() {
    _showLootboxQueue(queue, idx + 1);
  });
}

window.applyBingoPrize = function(prizes) {
  if (!Array.isArray(prizes) || !prizes.length) return;

  var queue = [];
  prizes.forEach(function(prize) {
    if (prize.type === "coins") {
      var amt = Number(prize.amount) || 0;
      if (!amt) return;
      state.totalScore += amt;
      saveAll();
      queue.push(prize);
    } else if (prize.type === "pokemon") {
      var entry = String(prize.entry || "");
      if (!entry) return;
      addSpecificToPokedex(entry);
      queue.push(prize);
    } else if (prize.type === "stardust") {
      var dustAmt = Number(prize.amount) || 1;
      shopOptions.shinyBaitCount += dustAmt;
      saveAll();
      queue.push(prize);
    }
  });

  _showLootboxQueue(queue, 0);
};

async function loadAmountFromList(amount, reverse, log) {
  if(pokedex == null) {
    log("Attempted to load " + amount + "from list, but there was no pokedex!")
    return; //cancel, there is no dex
  }
  pokedex.innerHTML = "";

  let fetchFrom =  state.pkmnList.map((x) => x);
  if(reverse) {
    fetchFrom.reverse();
  }
  let fetched = [];
  for (var i = 0; i < amount; i++) {
    if(fetchFrom[i] == null){
      //log("No more pokemon to fetch from - Breaking at " + i)
      break;
    } else if(!fetched.includes(fetchFrom[i])){
      loadFromList(fetchFrom[i],true, false, false);
      fetched.push(fetchFrom[i]);

    } else {   
      if(amount < fetchFrom.length){
        amount++;
      }
    }
  }
  //log("Finished! Fetched contains  " + fetched.length + " and has the following: " + fetched)
}

function removeItemAll(arr, value) {
  var i = 0;
  while (i < arr.length) {
    if (arr[i] === value) {
      arr.splice(i, 1);
    } else {
      ++i;
    }
  }
  return arr;
}



const generationRanges = {
  1: [1, 151],          // Gen I
  2: [152, 251],        // Gen II
  3: [252, 386],        // Gen III
  4: [387, 493],        // Gen IV
  5: [494, 649],        // Gen V
  6: [650, 721],        // Gen VI
  7: [722, 809],        // Gen VII
  8: [810, 898],        // Gen VIII
  9: [899, 1025]        // Gen IX
};


// Special handling for forms
const specialForms = {
  "Hisuian": 4,
  "Alolan": 7
};

// Determine generation based on ID
function getGenerationForId(id, name) {
  
  if (name.includes("Hisuian")) return specialForms.Hisuian;
  if (name.includes("Alolan")) return specialForms.Alolan;

  for (const [gen, range] of Object.entries(generationRanges)) {
      if (id >= range[0] && id <= range[1]) {
          return parseInt(gen);
      }
  }

  return 0;
}

function loadFromList(entry, firstLoad = false, capture = false, returnString) { 
  if (entry == null || entry === "") {
    log("Error - No entry provided during LoadFromList!" + entry);
    return;
  }

  // Normalize the entry to support old and new formats
  if (entry.startsWith('"') && entry.endsWith('"')) {
    entry = entry.slice(1, -1); // Remove leading and trailing quotes
  }

  //shiny, id, special-form, amount, legendary, mythic
  var shiny = (Array.from(entry)[0]=='S');
  //log("Shiny: " + shiny);
  var repeats = getOccurrence(state.pkmnList, entry);
  //log("Amount: " + repeats);
  var id = 0;
  var cardId = entry.substring(1);
  var legendary = ""
  var legendaryText = ""
  var pkmnTypes = [];
  var shinyTag = ``
  var shinyText = ``
  var pkmnName = "";
  var imageId = 0;
  var imageLink = "";
  var repeatMultiplier = 1;
  var generationText = "";

  if(entry.includes('-')) { //There's something Special!
    try{
      var splitEntry = entry.split("-");
      idString = splitEntry[0].replace(/\D/g,'');
      id = Number(idString);
      const variantKey = splitEntry[1]; // e.g. "H1", "E2", "S1", "7"
      const varData = pkmnInfoData?.[id]?.[variantKey];
      if (varData) {
        pkmnName  = varData.name   || "???";
        pkmnTypes = Array.isArray(varData.types) ? varData.types : (varData.types ? [varData.types] : ["Unknown"]);
        imageId   = varData.imageid ?? id;
      } else {
        const baseData = pkmnInfoData?.[id]?.['0'];
        pkmnName  = baseData?.name || "???";
        pkmnTypes = Array.isArray(baseData?.types) ? baseData.types : (baseData?.types ? [baseData.types] : ["Unknown"]);
        imageId   = id;
        console.warn(`loadFromList: no variant data for ${entry}`);
      }
    } catch (error) {
      if (error instanceof TypeError) {
        console.error("A TypeError occurred in loadFromList:", error);
        log("TypeError: Please check the entry format or data integrity.");
        const toast = new Toast({
          text: `Å nei! En pokemon kunne ikke lastes! Send en melding til PokeMorten med denne informasjonen, og lagringsfilen din: ID ` + entry,
          position: "top-right",
          pauseOnHover: true,
          pauseOnFocusLoss: true,
          canClose: true,
          badToast: true,
        })
        return;
      } else {
        console.error("An unexpected error occurred in loadFromList:", error);
      }
    }
  } else {
    idString = entry.replace(/\D/g,'');
    id = Number(idString);
    imageId = id;
    const baseData = pkmnInfoData?.[id]?.['0'];
    if (!baseData) {
      pkmnTypes = ["Unknown ("+id+")"];
      cardId = "???";
      pkmnName = "Missing No.";
      id = 0;
      imageId = 0;
    } else {
      pkmnTypes = Array.isArray(baseData.types) ? baseData.types : (baseData.types ? [baseData.types] : ["Unknown"]);
      pkmnName = baseData.name;
    }
  }

  //Failsafes
  if (pkmnName === "" || pkmnName == null) {
    pkmnName = "???";
  }
  if (pkmnTypes == null || pkmnTypes.length === 0) {
    pkmnTypes = ["Unknown"];
  }

    
  //Is it legendary?
  if(legendaries.includes(id)) {
    legendary = `legendary`
    legendaryText = "Legendarisk "
    repeatMultiplier = repeatMultiplier * 2
    if(capture) {
      incrementProgress(21,1);
    }
  } else if(mythics.includes(id)) {
    legendary = `mythic`
    legendaryText = "Mytisk "
    repeatMultiplier = repeatMultiplier * 3
    if(capture) {
      incrementProgress(22,1);
    }
  }

  if(shiny == true) {
    //SHINY - set the values.
    repeatMultiplier = repeatMultiplier * 2
    shinyTag = `pokemon-shiny`
    shinyText = `Shiny `
    imageLink = `images/pokemon/shiny/${imageId}.png`
    if(capture) {
      incrementProgress(23,1);
    }
  } else {
    imageLink = `images/pokemon/normal/${imageId}.png`
  }

  generationText = "gen-"+ getGenerationForId(id,pkmnName);

  let filterText = ("filtered #"+entry+ " " + shinyText+" " + legendaryText+ pkmnName + " " + generationText);
  let pkmnType = ''
  const types = pkmnTypes.forEach((type) => {
      pkmnType += `<span class="typecard type-${type}">${type}</span>`
      filterText += " " + type;
  })

    /** Are we capturing this? */
  if(capture) {
      const toast = new Toast({
          text: `Du fanget en ${shinyText}${legendaryText}${pkmnName}`,
          position: "top-right",
          pauseOnHover: true,
          pauseOnFocusLoss: true,
          canClose: true,
          badToast: false,
      })
      // Display on screen
      endMessage.textContent = `Du fanget en ${shinyText}${legendaryText}${pkmnName}!`
      newCatchInfo.innerHTML =
      `<div class="has-text-centered">
        <div class="pkmn-pop" style="background-image: url('${imageLink}'); height: 128px; width: 128px; background-size: cover; display: block;margin-left:auto; margin-right:auto;">&nbsp;</div>
      </div>`
      progressPokemonTrainerBadge();
      pkmnTypes.forEach((type) => {progressTypeAchievement(type)})
  }

  //Check if pokedex has the identifier already, if it does, update it.
  if(capture && repeats > 1 && !firstLoad) {
      //Update existing pokemon.
      let card = document.getElementById(entry);
      var repeatMoney = (100 + (shopOptions.coinLevel * 20)) * repeatMultiplier;
      endMessage.textContent = `Du fanget en ${shinyText}${legendaryText}${pkmnName}!\r\nSiden du allerede har denne pokémonen, fikk du ${repeatMoney} mynter istedet.`
      addFixedMoney(repeatMoney)
      if(card != null) {
        //Update existing card
        counter = card.querySelector("#cardcounter")
        counter.textContent = ("x" + repeats);
        return;
      }
  } else if(!capture && repeats > 1 && firstLoad){
    let card = document.getElementById(entry);
    if(card != null) {
      //Update existing card
      counter = card.querySelector("#cardcounter")
      counter.textContent = ("x" + repeats);
      return;
    }
  }

    let inputHTML = `
    <a id=${entry} class="column is-narrow ${filterText}" style="cursor: pointer;" href=./pokeviewer.html?pokemonId=${id} target="_blank">
      <div class="card ${shinyTag} ${legendary}">
        <div class="card-content">
          <div class="has-text-centered card-image">
            <div class="card-image" style="background-image: url('${imageLink}');"></div>
            <div class="card-id"> #${cardId}</div>
            <div id="cardcounter" class="card-counter">x${repeats}</div>
          </div>
        <div class="card-footer">
          <p class="card-footer-item">
            <strong style="text-transform: capitalize;">${pkmnName}&nbsp;</strong> 
          </p>
        </div>
        <footer class="card-footer">
          <p class="card-footer-item" style="text-transform: capitalize;">
            ${pkmnType}
          </p>
        </footer>
        </div>
      </div>
    </a>
  `;
    if(returnString) {
      return inputHTML;
    } else if(firstLoad) {
      pokedex.innerHTML = pokedex.innerHTML + inputHTML;
    } else {
      pokedex.innerHTML = inputHTML + pokedex.innerHTML;
    }
    
}  

function getOccurrence(array, value) {
  var count = 0;
  array.forEach((v) => (v === value && count++));
  return count;
}
