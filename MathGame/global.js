const newsButton = document.getElementById("update-log")

//Halloween
const halloweenbox = document.getElementById("halloween-egg")

/**
 * Toast stuff
 */

 const DEFAULT_OPTIONS = {
  autoClose: 8000,
  position: "top-right",
  onClose: () => {},
  canClose: true,
  showProgress: true,
}

class Toast {
  #toastElem
  #autoCloseInterval
  #progressInterval
  #removeBinded
  #timeVisible = 0
  #autoClose
  #isPaused = false
  #unpause
  #pause
  #visibilityChange
  #shouldUnPause

  constructor(options) {
    this.#toastElem = document.createElement("div")
    this.#toastElem.classList.add("toast")
    requestAnimationFrame(() => {
      this.#toastElem.classList.add("show")
    })
    this.#removeBinded = this.remove.bind(this)
    this.#unpause = () => (this.#isPaused = false)
    this.#pause = () => (this.#isPaused = true)
    this.#visibilityChange = () => {
      this.#shouldUnPause = document.visibilityState === "visible"
    }
    this.update({ ...DEFAULT_OPTIONS, ...options })
  }

  set autoClose(value) {
    this.#autoClose = value
    this.#timeVisible = 0
    if (value === false) return

    let lastTime
    const func = time => {
      if (this.#shouldUnPause) {
        lastTime = null
        this.#shouldUnPause = false
      }
      if (lastTime == null) {
        lastTime = time
        this.#autoCloseInterval = requestAnimationFrame(func)
        return
      }
      if (!this.#isPaused) {
        this.#timeVisible += time - lastTime
        if (this.#timeVisible >= this.#autoClose) {
          this.remove()
          return
        }
      }

      lastTime = time
      this.#autoCloseInterval = requestAnimationFrame(func)
    }

    this.#autoCloseInterval = requestAnimationFrame(func)
  }

  set position(value) {
    const currentContainer = this.#toastElem.parentElement
    const selector = `.toast-container[data-position="${value}"]`
    const container = document.querySelector(selector) || createContainer(value)
    container.append(this.#toastElem)
    if (currentContainer == null || currentContainer.hasChildNodes()) return
    currentContainer.remove()
  }

  set text(value) {
    this.#toastElem.textContent = value
  }

  set canClose(value) {
    this.#toastElem.classList.toggle("can-close", value)
    if (value) {
      this.#toastElem.addEventListener("click", this.#removeBinded)
    } else {
      this.#toastElem.removeEventListener("click", this.#removeBinded)
    }
  }

  set showProgress(value) {
    this.#toastElem.classList.toggle("progress", value)
    this.#toastElem.style.setProperty("--progress", 1)

    if (value) {
      const func = () => {
        if (!this.#isPaused) {
          this.#toastElem.style.setProperty(
            "--progress",
            1 - this.#timeVisible / this.#autoClose
          )
        }
        this.#progressInterval = requestAnimationFrame(func)
      }

      this.#progressInterval = requestAnimationFrame(func)
    }
  }

  set badToast(value) {
    this.#toastElem.classList.toggle("badToast", value)
    this.#toastElem.classList.toggle("goodToast", !value)
  }

  set pauseOnHover(value) {
    if (value) {
      this.#toastElem.addEventListener("mouseover", this.#pause)
      this.#toastElem.addEventListener("mouseleave", this.#unpause)
    } else {
      this.#toastElem.removeEventListener("mouseover", this.#pause)
      this.#toastElem.removeEventListener("mouseleave", this.#unpause)
    }
  }

  set pauseOnFocusLoss(value) {
    if (value) {
      document.addEventListener("visibilitychange", this.#visibilityChange)
    } else {
      document.removeEventListener("visibilitychange", this.#visibilityChange)
    }
  }

  update(options) {
    Object.entries(options).forEach(([key, value]) => {
      this[key] = value
    })
  }

  remove() {
    cancelAnimationFrame(this.#autoCloseInterval)
    cancelAnimationFrame(this.#progressInterval)
    const container = this.#toastElem.parentElement
    this.#toastElem.classList.remove("show")
    this.#toastElem.addEventListener("transitionend", () => {
      this.#toastElem.remove()
      if (container.hasChildNodes()) return
      container.remove()
    })
    this.onClose()
  }
}

function createContainer(position) {
  const container = document.createElement("div")
  container.classList.add("toast-container")
  container.dataset.position = position
  document.body.append(container)
  return container
}

function createToast() {
  const toast = new Toast({
    text: "Hello",
    position: "top-right",
    pauseOnHover: true,
    pauseOnFocusLoss: true,
    canClose: true,
    badToast: true,
  })
}

// Get the modal
var modal = document.getElementById('id01');

// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
}
/**
 * Other stuff
 */

function resetPrompt(){
  if (confirm('Er du sikker på at du vil slette alle pokemon og poeng?')) {
    // Save it!
    clearStorage();
    console.log('Everything was deleted as requested..');
    location.reload();
  } else {
    // Do nothing!
    console.log('Nothing was deleted.');
  }
}

function settingsMenu() {
  document.getElementById("settingsDropdown").classList.toggle("show");
}

// Close the dropdown if the user clicks outside of it
window.onclick = function(event) {
  if (!event.target.matches('.dropbtn')) {
    var dropdowns = document.getElementsByClassName("dropdown-content");
    var i;
    for (i = 0; i < dropdowns.length; i++) {
      var openDropdown = dropdowns[i];
      if (openDropdown.classList.contains('show')) {
        openDropdown.classList.remove('show');
      }
    }
  } else if (!event.target.matches('.playerbtn')) {
    var dropdowns = document.getElementsByClassName("playercard-content");
    var i;
    for (i = 0; i < dropdowns.length; i++) {
      var openDropdown = dropdowns[i];
      if (openDropdown.classList.contains('show')) {
        openDropdown.classList.remove('show');
      }
    }
  }
}


let state = {
	username: "Ash",
	totalScore: 0,
	score: 0,
	wrongAnswers: 0,
	streak: 0,
  pkmnCaught: 0,
  pkmnList: new Array(),
  tier1Solved: 0,
  tier2Solved: 0,
  tier3Solved: 0,
  tier4Solved: 0,
  tier5Solved: 0,
  customSolved: 0
}

let shopOptions = {
  background: "",
  playerIcon: "",
  boughtBackgrounds: [],
  boughtPlayerIcons: [],
  claimedSecrets: [],
  shinyLevel: 1,
  mythicLevel: 0,
  legendLevel: 0,
  specialLevel: 0,
  coinLevel: 0
}

function loadShop() {
  shopOptions.background = sanitizeStorageValue(getStorageString('shopBackground'));//"images/backgrounds/bg-001.png"//
  shopOptions.boughtBackgrounds = getStorageArray('boughtBackgrounds','|')
  shopOptions.playerIcon = sanitizeStorageValue(getStorageString('playerIcon'))//"images/backgrounds/bg-001.png"//
  shopOptions.boughtPlayerIcons = getStorageArray('boughtPlayerIcons','|')
  shopOptions.claimedSecrets = getStorageArray('claimedSecrets','|')
  shopOptions.shinyLevel = getStorageInt('shinyLevel')
  if(shopOptions.shinyLevel == 0) {
    shopOptions.shinyLevel = 1
  }
  shopOptions.mythicLevel = getStorageInt('mythicLevel')
  shopOptions.legendLevel = getStorageInt('legendLevel')
  shopOptions.specialLevel = getStorageInt('specialLevel')
  shopOptions.coinLevel = getStorageInt('coinLevel')
  loadBackground();
  loadPlayerIcon();
}

function sanitizeStorageValue(value) {
  if (typeof value === 'string') {
    // Remove unnecessary surrounding quotes
    return value.replace(/^"+|"+$/g, '').trim();
  }
  return value || ""; // Return an empty string if undefined or null
}

function loadBackground(){
  if(document.getElementById("background") == null) {
    console.log("This page did not have a background element. Unable to load global background variable")
    return;
  }
  if(shopOptions.background && shopOptions.background.trim() !== "") {
    document.getElementById("background").setAttribute('src',"images/backgrounds/"+shopOptions.background+".png")
  } else {
    document.getElementById("background").setAttribute('src',"")
  }
}

function loadPlayerIcon(){
  if (shopOptions.playerIcon && shopOptions.playerIcon.trim() !== "") {  // weird issue with " icons after loading from file...
    document.getElementById("playerimage").setAttribute('src',"images/playericons/"+shopOptions.playerIcon+".png")
    document.getElementById("playerimagebig").setAttribute('src',"images/playericons/"+shopOptions.playerIcon+".png")
  } else {
    document.getElementById("playerimage").setAttribute('src',"images/player.png")
    document.getElementById("playerimagebig").setAttribute('src',"images/player.png")
  }
}

function saveAll(){
  if(checkACookieExists("cookies")) {
    //console.log("Saving all - Cookies are accepted")
  } else {
    const toast = new Toast({
      text: "Du har ikke godkjent bruken av Cookies, så vi kan ikke lagre din spillerdate på din enhet.",
      position: "top-right",
      pauseOnHover: true,
      pauseOnFocusLoss: true,
      canClose: true,
      badToast: true,
    })
    return;
  }

  window.localStorage.setItem('money', state.totalScore || 0);
  window.localStorage.setItem('pkmncaught', state.pkmnCaught || 0);

  const sanitizedPokemonList = state.pkmnList.filter(pokemon => pokemon.trim() !== "");
  window.localStorage.setItem('pokemonlist', sanitizedPokemonList.join('|'));
  
  window.localStorage.setItem('username', state.username || "Ash");

  if(true) {
    window.localStorage.setItem('tier1Solved', state.tier1Solved)
    window.localStorage.setItem('tier2Solved', state.tier2Solved)
    window.localStorage.setItem('tier3Solved', state.tier3Solved)
    window.localStorage.setItem('tier4Solved', state.tier4Solved)
    window.localStorage.setItem('tier5Solved', state.tier5Solved)
    window.localStorage.setItem('customSolved', state.customSolved)
  }

  // Validate shop options
  const sanitizedPlayerIcons = shopOptions.boughtPlayerIcons.filter(icon => icon.trim() !== "");
  window.localStorage.setItem('boughtPlayerIcons', sanitizedPlayerIcons.join('|'));
  window.localStorage.setItem('playerIcon', shopOptions.playerIcon || "");

  const sanitizedPlayerBackgrounds = shopOptions.boughtBackgrounds.filter(icon => icon.trim() !== "");
  window.localStorage.setItem('boughtBackgrounds', sanitizedPlayerBackgrounds.join('|'));
  window.localStorage.setItem('shopBackground', shopOptions.background || "");

  if (Array.isArray(shopOptions.claimedSecrets) && shopOptions.claimedSecrets.length > 0) {
    window.localStorage.setItem('claimedSecrets', shopOptions.claimedSecrets.join('|'));
}

  window.localStorage.setItem('shinyLevel', shopOptions.shinyLevel || 1);
  window.localStorage.setItem('legendLevel', shopOptions.legendLevel || 0);
  window.localStorage.setItem('mythicLevel', shopOptions.mythicLevel || 0);
  window.localStorage.setItem('specialLevel', shopOptions.specialLevel || 0);
  window.localStorage.setItem('coinLevel', shopOptions.coinLevel || 0);
}

const getCookieValue = (name) => (
  document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)')?.pop() || ''
)
function checkACookieExists(name) {
  if (document.cookie.split(';').some((item) => item.trim().startsWith(name + '='))) {
    return true;
  }
  return false;
}

async function getOrCreateUUID(retryLimit = 3) {
  let uuid = localStorage.getItem("UUID");
  let token = localStorage.getItem("token");


  if (!uuid) {
    uuid = generateUUID();
    log("getOrCreateUUID - No UUID saved - making a new one. " + uuid);
  }

  try {
    const { valid, unique, token: newToken } = await validateUUID(uuid, token, retryLimit);
    
    if (unique) { //UUID was unique, so it has not been saved to MySQL before
      localStorage.setItem("UUID", uuid);
      localStorage.setItem("token", newToken);
      updateConnectionIndicator("good");
      log("getOrCreateUUID - UUID was Unique, got new token" + uuid);
      return { uuid, token: newToken };
    }

    if (!valid) {
      throw new Error("Invalid token");
    }

    //Not unique, but valid - let's return the values.l
    updateConnectionIndicator("good");
    log("getOrCreateUUID - UUID and Token was good");
    return { uuid, token };
  } catch (error) {
    updateConnectionIndicator("disconnected");
    console.error("Error validating UUID:", error);
    return null;
  }
}

async function validateUUID(uuid, token, retryLimit = 3) {
  const url = `${window.location.protocol}//${window.location.host}/validate-user?uuid=${uuid}&token=${token || ''}`;
  let attempts = 0;

  while (attempts < retryLimit) {
      try {
          const response = await fetch(url);
          if (!response.ok) {
              updateConnectionIndicator("disconnected");
              throw new Error(`Server returned status ${response.status}`);
          }
          return await response.json();
      } catch (error) {
          attempts++;
          console.warn(`Attempt ${attempts} failed:`, error);

          if (attempts >= retryLimit) {
              throw new Error("Failed to validate UUID after multiple attempts.");
          }

          await new Promise(resolve => setTimeout(resolve, 1000));
      }
  }
}

async function validateUser(uuid, retryLimit = 3) {
  const MINIMUM_PKMN_CAUGHT = 25;
  const VALIDATION_LIFETIME = 6 * 60 * 60 * 1000; // 6 hours in milliseconds
  const VALIDATION_KEY = "validationTimestamp";

  const token = localStorage.getItem("token");

  if (state.pkmnCaught < MINIMUM_PKMN_CAUGHT) {
    console.log("Did not validate user, as they have too few Pokémon.");
    updateConnectionIndicator("disconnected");
    return false;
  }

  const lastValidation = localStorage.getItem(VALIDATION_KEY);
  const now = Date.now();

  if (lastValidation && now - parseInt(lastValidation, 10) < VALIDATION_LIFETIME) {
    if (uuid && token) {
      console.log("Validation is still fresh. Skipping server validation.");
      updateConnectionIndicator("okay");
      return true;
    }
  }

  const url = `${window.location.protocol}//${window.location.host}/validate-user?uuid=${uuid}${token ? `&token=${token}` : ""}`;
  let attempts = 0;

  while (attempts < retryLimit) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const data = await response.json();
      if (data.unique && data.valid) {
        localStorage.setItem("token", token);
        localStorage.setItem(VALIDATION_KEY, now.toString());
        updateConnectionIndicator("good");
        log("Connection: Data was Unique and Data was valid.")
        return true;
      } else if (data.unique && data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem(VALIDATION_KEY, now.toString());
        updateConnectionIndicator("good");
        log("Connection: Data was Unique and new token was saved. - " + data.token)
        return true;
      } else {
        updateConnectionIndicator("disconnected");
        return false;
      }
    } catch (error) {
      attempts++;
      if (attempts >= retryLimit) {
        updateConnectionIndicator("disconnected");
        console.error("Failed to connect to the server after multiple attempts:", error);
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}

function compressPkmnList(pkmnList) {
  const countMap = {};

  pkmnList.forEach((pkmn) => {
    if (pkmn && /\d+/.test(pkmn)) {
      countMap[pkmn] = (countMap[pkmn] || 0) + 1;
    } else {
      console.warn(`Skipping malformed ID: ${pkmn}`);
    }
  });

  const compressedList = Object.entries(countMap).map(([pkmn, count]) =>
    count > 1 ? `${pkmn}x${count}` : pkmn
  );

  compressedList.sort((a, b) => {
    const getNumericPart = (id) => parseInt(id.match(/\d+/)[0], 10);
    return getNumericPart(a) - getNumericPart(b) || a.localeCompare(b);
  });

  return compressedList;
}

function decompressPkmnList(compressedList) {
  const decompressedList = [];

  // Expand each entry
  compressedList.forEach((entry) => {
      const match = entry.match(/^(.+?)x(\d+)$/); // Match entries with "x<number>"
      if (match) {
          const [_, pkmn, count] = match;
          for (let i = 0; i < parseInt(count, 10); i++) {
              decompressedList.push(pkmn);
          }
      } else {
          decompressedList.push(entry);
      }
  });

  return decompressedList;
}

// Function to generate a new UUID
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0,
            v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
  });
}

async function uploadUserStats() {
    let uuid = localStorage.getItem("UUID");
    let token = localStorage.getItem("token");
  
    if (!uuid || !token) {
      console.log("UUID or token missing. Attempting to get or create UUID and token.");
      const newCredentials = await getOrCreateUUID();
      if (!newCredentials) return; // Exit if UUID creation fails
      uuid = newCredentials.uuid;
      token = newCredentials.token;
    }
  
    if (state.pkmnCaught < 25) {
      console.log("Cannot upload stats: Less than 25 Pokémon caught.");
      return;
    }

    // Check if the username is allowed
    /**We are still in beta, and do not want userdata to be stored until we have updated our GDPR compliance etc. */
    if (state.username !== "PokeMorten_UUIDTest") {
      console.log(`Username "${state.username}" is not allowed for upload yet.`);
      return;
    }
  
    const payload = {
      uuid,
      token,
      state: {
        username: state.username,
        totalScore: state.totalScore,
        pkmnCaught: state.pkmnCaught,
        pkmnList: compressPkmnList(state.pkmnList),
        tier1Solved: state.tier1Solved,
        tier2Solved: state.tier2Solved,
        tier3Solved: state.tier3Solved,
        tier4Solved: state.tier4Solved,
        tier5Solved: state.tier5Solved,
        customSolved: state.customSolved,
      },
      shopOptions: {
        background: shopOptions.background,
        playerIcon: shopOptions.playerIcon,
        boughtBackgrounds: shopOptions.boughtBackgrounds,
        boughtPlayerIcons: shopOptions.boughtPlayerIcons,
        shinyLevel: shopOptions.shinyLevel,
        mythicLevel: shopOptions.mythicLevel,
        legendLevel: shopOptions.legendLevel,
        specialLevel: shopOptions.specialLevel,
        coinLevel: shopOptions.coinLevel,
      },
    };
  
    try {
      const response = await fetch(`${window.location.protocol}//${window.location.host}/update-user-stats`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 401) {
        console.error("Unauthorized: Invalid token. Refreshing token.");
        const newCredentials = await getOrCreateUUID();
        if (!newCredentials) return;
        localStorage.setItem("UUID", newCredentials.uuid);
        localStorage.setItem("token", newCredentials.token);
        return uploadUserStats(); // Retry with refreshed token
      }
  
      const result = await response.json();
      if (response.ok) {
        console.log("User stats updated successfully:", result);
      } else {
        console.error("Error updating user stats:", result.error);
      }
    } catch (error) {
      console.error("Network error:", error);
    }
}

// Helper function to set a cookie
function setCookie(name, value, days) {
  if(checkACookieExists("cookies")) {
    //console.log("Saving all - Cookies are accepted")
  } else {
    const toast = new Toast({
      text: "Du har ikke godkjent bruken av Cookies, så vi kan ikke lagre din spillerdate på din enhet.",
      position: "top-right",
      pauseOnHover: true,
      pauseOnFocusLoss: true,
      canClose: true,
      badToast: true,
    })
    return;
  }
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `${name}=${value}; expires=${expires}; path=/`;
}

// Helper function to get a cookie by name
function getCookie(name) {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : null;
}

function cleanupCorruptedData() {
  // Clean up pokemonlist
  const rawPokemonList = window.localStorage.getItem('pokemonlist');
  if (rawPokemonList && (rawPokemonList.includes('"') || rawPokemonList.includes('%22'))) {
    const cleanedList = rawPokemonList
      .replace(/%22/g, '"') // First, convert '%22' back into quotes for consistency
      .replace(/"/g, '') // Then remove actual quotes
      .split('|');
    window.localStorage.setItem('pokemonlist', cleanedList.join('|'));
    state.pkmnList = cleanedList;
  }

  // Clean up boughtPlayerIcons
  const rawIcons = window.localStorage.getItem('boughtPlayerIcons');
  if (rawIcons && (rawIcons.includes('"') || rawIcons.includes('%22'))) {
    const cleanedIcons = rawIcons
      .replace(/%22/g, '"') // Convert '%22' back into quotes
      .replace(/"/g, '') // Remove actual quotes
      .split('|');
    window.localStorage.setItem('boughtPlayerIcons', cleanedIcons.join('|'));
    shopOptions.boughtPlayerIcons = cleanedIcons;
  }
}


function loadAll() {
  //Log to console
  console.log('%cPokeMath!', 'color: black; background: red; font-size: 30px; padding: 10px');
  console.log('%cVi er klar over at det er mulig å endre på egne verdier for å jukse i PokeMath. Dette er en svakhet ved at vi lagrer all spillerdata på brukerens maskin, istedet for å samle det inn til en server, men det er tryggere for brukeren med GDPR i fokus.', 'color: black; font-size: 20px; padding: 10px');
  console.log('%cHvis du er her for å jukse til deg pokemon så skal vi ikke prøve å stoppe deg, men vit at å jukse i et spill vil ødelegge mye av motivasjonen du får ellers. Du ender altså bare opp med å ødelegge for deg selv. Hvis du finner ut av noen av våre hemmeligheter (f.eks lukene i julekalender eller andre events) så setter vi pris på om du klarer å holde det hemmelig for klassekammeratene dine!', 'color: black; font-size: 20px; padding: 10px');
  console.log('%cDu kan finne all kildekoden til PokeMath på vår GitHub side (se Kontakt Oss). Det er litt lettere å lese seg frem der, enn i nettleserens Developer Tools. Ønsker du å bidra til prosjektet så er det stedet å starte! Finner du bugs, eller sikkerhetshull, så ikke nøl med å kontakte oss.', 'color: black; font-size: 20px; padding: 10px');
  
  //See if cookies are consented
  if(checkACookieExists("cookies")) {
    const cookiePolicy = document.getElementById("cookie-container");
    if(cookiePolicy != null) {
      cookiePolicy.style = "display: none";
    }
  }

  //See if name is set
  let params = new URLSearchParams(location.search);
	var name = params.get('name');
  if(name == null || name == "") {
    //Do nothing
  } else {
    window.localStorage.setItem('username', name)
  }

  state.totalScore = getStorageInt('money')
  state.pkmnList = getStorageArray('pokemonlist','|')
  state.pkmnCaught = state.pkmnList.length;
  state.tier1Solved = getStorageInt('tier1Solved')
  state.tier2Solved = getStorageInt('tier2Solved')
  state.tier3Solved = getStorageInt('tier3Solved')
  state.tier4Solved = getStorageInt('tier4Solved')
  state.tier5Solved = getStorageInt('tier5Solved')
  state.customSolved = getStorageInt('customSolved')
  /**
  if(document.getElementById("pokedex")!=null){
    document.getElementById("pokedex").innerHTML = getStorageString('pokedex')
  } */

  state.username = getStorageString('username')
  if(!state.username || state.username.length > 22) {
    state.username = "Ash";
    window.localStorage.setItem('username', "Ash")
  } else if(state.username.length < 1){
    state.username = "Ash";
  
  }
  document.getElementById("cointext").dataset.total = state.totalScore;
  document.getElementById("balltext").textContent = state.pkmnCaught;
  document.getElementById("playertext").textContent = state.username;
  document.getElementById("playertextheader").textContent = state.username;
  document.getElementById("t1solved").textContent = state.tier1Solved;
  document.getElementById("t2solved").textContent = state.tier2Solved;
  document.getElementById("t3solved").textContent = state.tier3Solved;
  document.getElementById("t4solved").textContent = state.tier4Solved;
  document.getElementById("t5solved").textContent = state.tier5Solved;
  //document.getElementById("csolved").textContent = state.customSolved;
  loadShop();
  cleanupCorruptedData();
  document.dispatchEvent(new Event('loadAllComplete'));

  //Backup popup!
  const popup = document.getElementById("backup-popup");
    const doBackupBtn = document.getElementById("do-backup-btn");
    const snoozeBtn = document.getElementById("snooze-btn");
    const snoozeSelect = document.getElementById("snooze-select");

    // Function to check the current page's filename
    function isBackupPage() {
        return window.location.pathname.includes("saveandload");
    }

    // Show the popup
    function showPopup() {
        if (!isBackupPage()) { // Only show popup if not on saveandload.html
            popup.classList.remove("hidden");
        }
    }

    // Hide the popup
    function hidePopup() {
        popup.classList.add("hidden");
    }

    // Handle "Do a Backup" action
    doBackupBtn.addEventListener("click", () => {
        hidePopup();
        // Redirect to backup page
        window.location.href = "./saveandload.html";
    });

    // Handle "Snooze" action
    snoozeBtn.addEventListener("click", () => {
        const snoozeDays = parseInt(snoozeSelect.value, 10);
        const snoozeUntil = new Date();
        snoozeUntil.setDate(snoozeUntil.getDate() + snoozeDays);
        localStorage.setItem("backupReminder", snoozeUntil.toISOString());
        alert(`Varselett ble utsatt i ${snoozeDays} dag(er).`);
        hidePopup();
    });

    // Check if it's time to show the popup
    function checkReminder() {
        if (!isBackupPage() && state.pkmnCaught > 25) { // Only check reminder if not on saveandload.html
            const snoozeUntil = localStorage.getItem("backupReminder");
            if (!snoozeUntil || new Date() > new Date(snoozeUntil)) {
                showPopup();
            }
        } else {
          hidePopup();
        }
    }

    // Run the check on page load
    checkReminder();

    // Simulated connection state
    let connectionState = "okay"; // Options: "good", "okay", "disconnected"
    updateConnectionIndicator(connectionState);
}

function updateConnectionIndicator(state) {
    //Connection Indicator
  let connectionStatus = document.getElementById("connection-status");
  if(!connectionStatus) {
    return;
  }
  if (state === "good") {
      connectionStatus.className = "status-green";
  } else if (state === "okay") {
      connectionStatus.className = "status-yellow";
  } else if (state === "disconnected") {
      connectionStatus.className = "status-red";
  }
}

function snoozeBackupAlertThreeDays() {
  const snoozeDays = 3;
  const snoozeUntil = new Date();
  snoozeUntil.setDate(snoozeUntil.getDate() + snoozeDays);
  localStorage.setItem("backupReminder", snoozeUntil.toISOString());
}

function getStorageString(key) {
  const storedValue = window.localStorage.getItem(key);
  if (storedValue) {
    try {
      // Sanitize quotes and trim
      return storedValue.replace(/^"+|"+$/g, '').trim();
    } catch (error) {
      console.error(`Error parsing string for key "${key}":`, error);
      return "";
    }
  }
  return "";
}

function getStorageArray(key, splitter) {
  const storedValue = window.localStorage.getItem(key);
  if (storedValue) {
    try {
      // Split the string and sanitize individual items
      return storedValue.split(splitter).map(item => item.replace(/^"+|"+$/g, '').trim());
    } catch (error) {
      console.error(`Error parsing array for key "${key}":`, error);
      return [];
    }
  }
  return [];
}

function getStorageInt(key) {
  if(window.localStorage.getItem(key)) {
    var number = JSON.parse(window.localStorage.getItem(key));
    return (parseInt(number));
  } else {
    return 0;
  }
}

function clearStorage() {
  window.localStorage.clear();
  window.sessionStorage.clear();
}

window.acceptCookies = function() {
  const cookiePolicy = document.getElementById("cookie-container")
  log("Accepting Cookies...")
  if (cookiePolicy != null) {
      cookiePolicy.style = "display: none";
  }
  const d = new Date();
  d.setTime(d.getTime() + (90 * 24 * 60 * 60 * 1000)); // 90 days
  let expires = "expires=" + d.toUTCString();
  document.cookie = "cookies=true;" + expires + ";path=/";
  log("Cookies Accepted!")
};

window.addEventListener( "pageshow", function ( event ) {
  var historyTraversal = event.persisted || 
                         ( typeof window.performance != "undefined" && 
                         window.performance.getEntriesByType("navigation")[0].type === "back_forward" );
  if ( historyTraversal ) {
    // Handle page restore.
    console.log("Forcing reload because browser back button was clicked.")
    //window.location.reload();
    loadAll();
  }
});

function log(message){
  if(state.username == "debugger") {
    console.log(message);
    const toast = new Toast({
      text: "DEBUG: " + message,
      position: "top-right",
      pauseOnHover: true,
      pauseOnFocusLoss: true,
      canClose: true,
      badToast: true,
    })
  } else {
    console.log(message);
  }
}

function sendToast(message, bad) {
  if(message == null || message.isEmpty()) {
    log("Attempted to toast empty message.");
    return;
  }
  if(bad == null) {
    bad = false;
  }
  const toast = new Toast({
    text: message,
    position: "top-right",
    pauseOnHover: true,
    pauseOnFocusLoss: true,
    canClose: true,
    badToast: bad,
  })
}

const defaultAchievements = {
  version: '1.0',
  badges: [
  { id: 1, name: 'Normal-Type Trener', description: 'Fang 250 Normal-type pokemon.', achieved: false, progress: 0, goal: 250 },
  { id: 2, name: 'Fire-Type Trener', description: 'Fang 250 Fire-type pokemon.', achieved: false, progress: 0, goal: 250 },
  { id: 3, name: 'Fighting-Type Trener', description: 'Fang 250 Fighting-type pokemon.', achieved: false, progress: 0, goal: 250 },
  { id: 4, name: 'Water-Type Trener', description: 'Fang 250 Water-type pokemon.', achieved: false, progress: 0, goal: 250 },
  { id: 5, name: 'Flying-Type Trener', description: 'Fang 250 Flying-type pokemon.', achieved: false, progress: 0, goal: 250 },
  { id: 6, name: 'Grass-Type Trener', description: 'Fang 250 Grass-type pokemon.', achieved: false, progress: 0, goal: 250 },
  { id: 7, name: 'Poison-Type Trener', description: 'Fang 250 Poison-type pokemon.', achieved: false, progress: 0, goal: 250 },
  { id: 8, name: 'Electric-Type Trener', description: 'Fang 250 Electric-type pokemon.', achieved: false, progress: 0, goal: 250 },
  { id: 9, name: 'Ground-Type Trener', description: 'Fang 250 Ground-type pokemon.', achieved: false, progress: 0, goal: 250 },
  { id: 10, name: 'Psychic-Type Trener', description: 'Fang 250 Psychic-type pokemon.', achieved: false, progress: 0, goal: 250 },
  { id: 11, name: 'Rock-Type Trener', description: 'Fang 250 Rock-type pokemon.', achieved: false, progress: 0, goal: 250 },
  { id: 12, name: 'Ice-Type Trener', description: 'Fang 250 Ice-type pokemon.', achieved: false, progress: 0, goal: 250 },
  { id: 13, name: 'Bug-Type Trener', description: 'Fang 250 Bug-type pokemon.', achieved: false, progress: 0, goal: 250 },
  { id: 14, name: 'Dragon-Type Trener', description: 'Fang 250 Dragon-type pokemon.', achieved: false, progress: 0, goal: 250 },
  { id: 15, name: 'Ghost-Type Trener', description: 'Fang 250 Ghost-type pokemon.', achieved: false, progress: 0, goal: 250 },
  { id: 16, name: 'Dark-Type Trener', description: 'Fang 250 Dark-type pokemon.', achieved: false, progress: 0, goal: 250 },
  { id: 17, name: 'Steel-Type Trener', description: 'Fang 250 Steel-type pokemon.', achieved: false, progress: 0, goal: 250 },
  { id: 18, name: 'Fairy-Type Trener', description: 'Fang 250 Fairy-type pokemon.', achieved: false, progress: 0, goal: 250 },
  { id: 19, name: 'Big Earner', description: 'Få 10.000.000 mynter, totalt.', achieved: false, progress: 0, goal: 10000000 },
  { id: 20, name: 'Big Spender', description: 'Bruk 5.000.000 mynter, totalt.', achieved: false, progress: 0, goal: 5000000 },
  { id: 21, name: 'Legendarisk Trener', description: 'Fang 25 Legendariske pokemon.', achieved: false, progress: 0, goal: 25 },
  { id: 22, name: 'Mytisk Trener', description: 'Fang 25 Mytiske pokemon.', achieved: false, progress: 0, goal: 25 },
  { id: 23, name: 'Shiny Trener', description: 'Fang 100 Shiny pokemon.', achieved: false, progress: 0, goal: 100 },
  { id: 24, name: 'Nivå 1 Mester', description: 'Løs 1000 oppgaver på Nivå 1.', achieved: false, progress: 0, goal: 1000 },
  { id: 25, name: 'Nivå 2 Mester', description: 'Løs 1000 oppgaver på Nivå 2.', achieved: false, progress: 0, goal: 1000 },
  { id: 26, name: 'Nivå 3 Mester', description: 'Løs 1000 oppgaver på Nivå 3.', achieved: false, progress: 0, goal: 1000 },
  { id: 27, name: 'Nivå 4 Mester', description: 'Løs 1000 oppgaver på Nivå 4.', achieved: false, progress: 0, goal: 1000 },
  { id: 28, name: 'Nivå 5 Mester', description: 'Løs 1000 oppgaver på Nivå 5.', achieved: false, progress: 0, goal: 1000 },
  { id: 29, name: 'Rookie Trener', description: 'Fang 100 pokemon.', achieved: false, progress: 0, goal: 100 },
  { id: 30, name: 'Rising Star', description: 'Fang 500 pokemon.', achieved: false, progress: 0, goal: 500 },
  { id: 31, name: 'Challenger', description: 'Fang 1500 pokemon.', achieved: false, progress: 0, goal: 1500 },
  { id: 32, name: 'Gym Leader', description: 'Fang 5000 pokemon.', achieved: false, progress: 0, goal: 5000 },
  { id: 33, name: 'Pokemon Mester', description: 'Fang 10.000 pokemon.', achieved: false, progress: 0, goal: 10000 }
  ],
};

function progressPokemonTrainerBadge() {
  incrementProgress(29,1);
  incrementProgress(30,1);
  incrementProgress(31,1);
  incrementProgress(32,1);
  incrementProgress(33,1);
}

function progressTypeAchievement(type) {
  let id = 1;
  log(type + " was submitted.")
  switch (type) {
    case "normal": 
      id = 1;
      break;
    case "fire":
      id = 2;
      break;
    case "fighting":
      id = 3;
      break;
    case "water":
      id = 4;
      break;
    case "flying":
      id = 5;
      break;
    case "grass":
      id = 6;
      break;
    case "poison":
      id = 7;
      break;
    case "electric":
      id = 8;
      break;
    case "ground":
      id = 9;
      break;
    case "psychic":
      id = 10;
      break;
    case "rock":
      id = 11;
      break;
    case "ice":
      id = 12;
      break;
    case "bug":
      id = 13;
      break;
    case "dragon":
      id = 14;
      break;
    case "ghost":
      id = 15;
      break;
    case "dark":
      id = 16;
      break;
    case "steel":
      id = 17;
      break;
    case "fairy":
      id = 18;
      break;
    default:
      return;
  }
  incrementProgress(id,1);
}

// Load achievements from LocalStorage or set default values
const storedAchievements = JSON.parse(localStorage.getItem('badges')) || defaultAchievements;
if (storedAchievements) {
  // Check the version of stored achievements
  if (storedAchievements.version === '1.0') {
    // Migrate data from version 1.0 to 1.1
    storedAchievements.version = '1.1';
    // Perform any other necessary migrations here
  }
  
  // After migrations, update the stored achievements in localStorage
  localStorage.setItem('badges', JSON.stringify(storedAchievements));

  // Update the achievements in memory
  storedAchievements.badges.forEach(achievement => {
    const storedAchievement = storedAchievements.badges.find(a => a.id === achievement.id);
    if (storedAchievement) {
      achievement.achieved = storedAchievement.achieved;
      achievement.progress = storedAchievement.progress;
    }
  });
} else {
  // If there are no stored achievements, store the default achievements
  localStorage.setItem('badges', JSON.stringify(defaultAchievements));
}

// Render achievements
const achievementGrid = document.querySelector('.achievement-grid');
if (achievementGrid) {
    storedAchievements.badges.forEach(achievement => {
        const achievementDiv = document.createElement('div');
        achievementDiv.className = 'achievement' + (achievement.achieved ? ' achieved' : '');
        achievementDiv.innerHTML = `
            <img src="images/badges/${achievement.id}.png" alt="${achievement.name}">
            <div class="badgetooltip">
                <strong>${achievement.name}</strong>
                <br>${achievement.description} (Fremgang: ${achievement.progress}/${achievement.goal})
            </div>
        `;
        achievementGrid.appendChild(achievementDiv);
        
        // Add event listener for click
        achievementDiv.addEventListener('click', () => {
            achievementDiv.classList.toggle('active');
        });
    });
}

function incrementProgress(id, amount = 1) {
  const achievement = storedAchievements.badges.find(a => a.id === id);
  if (achievement && !achievement.achieved) {
      achievement.progress += amount;
      if (achievement.progress >= achievement.goal) {
          achievement.achieved = true;
          notifyAchievement(achievement);
      }
      localStorage.setItem('badges', JSON.stringify(storedAchievements));
      updateProgressDisplay(achievement);
  }
}

// Function to update the displayed progress
function updateProgressDisplay(achievement) {
  const achievementDiv = document.querySelector(`.achievement:nth-child(${achievement.id}) .badgetooltip`);
  if (achievementDiv) {
      //log("div found - updating")
      achievementDiv.innerHTML = `<strong>${achievement.name}</strong><br>${achievement.description} (Fremgang: ${achievement.progress}/${achievement.goal})`;
  } else {
    //log("achi div not found")
  }
}


function triggerAchievementOverlay(imagePath, text) {
  const notificationContainer = document.getElementById('notification-container');
  
  // Create the notification element
  const notification = document.createElement('div');
  notification.className = 'notification';
  
  // Add the image and text to the notification
  notification.innerHTML = `
      <img src="${imagePath}" alt="${text}" width="250">
      <p>${text}</p>
  `;
  
  // Append the notification to the container
  notificationContainer.appendChild(notification);
  
  // Remove the notification after the animation completes
  setTimeout(() => notificationContainer.removeChild(notification), 8000);
}

// Function to display achievement notifications
function notifyAchievement(achievement) {
  const notificationContainer = document.getElementById('notification-container');
  
  // Create the notification element
  const notification = document.createElement('div');
  notification.className = 'notification';
  
  // Add the badge image and achievement name to the notification
  notification.innerHTML = `
      <img src="images/badges/${achievement.id}.png" alt="${achievement.name}" width="250">
      <p>Merke Låst Opp: ${achievement.name}</p>
  `;
  
  // Append the notification to the container
  notificationContainer.appendChild(notification);
  
  // Remove the notification after the animation completes
  setTimeout(() => notificationContainer.removeChild(notification), 8000);
}

// Assuming you have a button with id 'clickButton'
//const clickButton = document.getElementById('clickButton');
//clickButton.addEventListener('click', () => incrementProgress(1));
document.addEventListener("DOMContentLoaded", () => {
  const header = document.getElementById("topbar");
  if (header) {
      // Directly call loadAll() if the topbar element is found
      //log("Top Bar Found - Loading initiated.")
      loadAll();
      
  } else {
      // Optionally retry if header may take extra time to load
      log("Top Bar Not Found - Retrying.")
      var attempt = 0;
      const checkHeaderInterval = setInterval(() => {
          attempt ++;
          const header = document.getElementById("topbar");
          if (header) {
              log("Top Bar Finally Found after " + attempt + " attemtps - Loading initiated.")
              clearInterval(checkHeaderInterval);
              loadAll();
          } else {
            log("Header not found - retrying. (" + attempt + ")")
          }
      }, 100); // Check every 100ms until header is found
  }
});