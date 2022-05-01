const newsButton = document.getElementById("update-log")


/**
 * Toast stuff
 */

 const DEFAULT_OPTIONS = {
  autoClose: 5000,
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
  tier5Solved: 0
}

let shopOptions = {
  background: "",
  playerIcon: "",
  boughtBackgrounds: [],
  boughtPlayerIcons: [],
  shinyLevel: 1,
  mythicLevel: 0,
  legendLevel: 0,
  specialLevel: 0,
  coinLevel: 0
}

function loadShop() {
  shopOptions.background = getStorageString('shopBackground')//"images/backgrounds/bg-001.png"//
  shopOptions.boughtBackgrounds = getStorageArray('boughtBackgrounds','|')
  shopOptions.playerIcon = getStorageString('playerIcon')//"images/backgrounds/bg-001.png"//
  shopOptions.boughtPlayerIcons = getStorageArray('boughtPlayerIcons','|')
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

function loadBackground(){
  if(shopOptions.background != "") {
    document.getElementById("background").setAttribute('src',"images/backgrounds/"+shopOptions.background+".png")
  } else {
    document.getElementById("background").setAttribute('src',"")
  }
}

function loadPlayerIcon(){
  if(shopOptions.playerIcon != "") {
    document.getElementById("playerimage").setAttribute('src',"images/playericons/"+shopOptions.playerIcon+".png")
    document.getElementById("playerimagebig").setAttribute('src',"images/playericons/"+shopOptions.playerIcon+".png")
  } else {
    document.getElementById("playerimage").setAttribute('src',"images/player.png")
    document.getElementById("playerimagebig").setAttribute('src',"images/player.png")
  }
}

function saveAll(){
  if(!isNaN(state.totalScore)) {
    window.localStorage.setItem('money',JSON.stringify(state.totalScore))
  }
  if(!isNaN(state.pkmnCaught)) {
    window.localStorage.setItem('pkmncaught',JSON.stringify(state.pkmnCaught))
  }
  if(state.pokemonlist != "") {
    window.localStorage.setItem('pokemonlist',JSON.stringify(state.pkmnList.join('|')))
  }
  if(document.getElementById("pokedex")!=null) {
    window.localStorage.setItem('pokedex',JSON.stringify(document.getElementById("pokedex").innerHTML))
  }
  if(state.username != "") {
    window.localStorage.setItem('username',JSON.stringify(state.username))
  } else {
    window.localStorage.setItem('username',JSON.stringify("Ash"))
  }
  if(true) {
    window.localStorage.setItem('tier1Solved',JSON.stringify(state.tier1Solved))
    window.localStorage.setItem('tier2Solved',JSON.stringify(state.tier2Solved))
    window.localStorage.setItem('tier3Solved',JSON.stringify(state.tier3Solved))
    window.localStorage.setItem('tier4Solved',JSON.stringify(state.tier4Solved))
    window.localStorage.setItem('tier5Solved',JSON.stringify(state.tier5Solved))
  }

  //Shop stuff
  window.localStorage.setItem('shopBackground',JSON.stringify(shopOptions.background))
  if(shopOptions.boughtBackgrounds != "") {
    window.localStorage.setItem('boughtBackgrounds',JSON.stringify(shopOptions.boughtBackgrounds.join('|')))
  }
  window.localStorage.setItem('playerIcon',JSON.stringify(shopOptions.playerIcon))
  if(shopOptions.boughtPlayerIcons != "") {
    window.localStorage.setItem('boughtPlayerIcons',JSON.stringify(shopOptions.boughtPlayerIcons.join('|')))
  }
  if(shopOptions.shinyLevel != "") {
    window.localStorage.setItem('shinyLevel',JSON.stringify(shopOptions.shinyLevel))
  }
  if(shopOptions.legendLevel != "") {
    window.localStorage.setItem('legendLevel',JSON.stringify(shopOptions.legendLevel))
  }
  if(shopOptions.mythicLevel != "") {
    window.localStorage.setItem('mythicLevel',JSON.stringify(shopOptions.mythicLevel))
  }
  if(shopOptions.specialLevel != "") {
    window.localStorage.setItem('specialLevel',JSON.stringify(shopOptions.specialLevel))
  }
  if(shopOptions.coinLevel != "") {
    window.localStorage.setItem('coinLevel',JSON.stringify(shopOptions.coinLevel))
  }
}

function loadAll() {
  //See if name is set
  let params = new URLSearchParams(location.search);
	var name = params.get('name');
  if(name == null || name == "") {
    //Do nothing
  } else {
    window.localStorage.setItem('username',JSON.stringify(name))
  }


  state.totalScore = getStorageInt('money')
  state.pkmnCaught = getStorageInt('pkmncaught')
  state.pkmnList = getStorageArray('pokemonlist','|')
  state.tier1Solved = getStorageInt('tier1Solved')
  state.tier2Solved = getStorageInt('tier2Solved')
  state.tier3Solved = getStorageInt('tier3Solved')
  state.tier4Solved = getStorageInt('tier4Solved')
  state.tier5Solved = getStorageInt('tier5Solved')
  if(document.getElementById("pokedex")!=null){
    document.getElementById("pokedex").innerHTML = getStorageString('pokedex')
  }

  state.username = getStorageString('username')
  if(state.username.length > 15) {
    state.username = "Ash";
    window.localStorage.setItem('username',JSON.stringify("Ash"))
    const toast = new Toast({
      text: "Brukernavnet er for langt! Det har blitt tilbakestilt til Ash",
      position: "top-right",
      pauseOnHover: true,
      pauseOnFocusLoss: true,
      canClose: true,
      badToast: true,
    })
  } else if(state.username.length < 1){
    //No name = Default
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
  loadShop()
}

function getStorageString(key) {
  if(window.localStorage.getItem(key)) {
    return JSON.parse(window.localStorage.getItem(key));
  } else {
    return "";
  }
}
function getStorageArray(key,splitter) {
  if(window.localStorage.getItem(key)) {
    var array = getStorageString(key).split(splitter);
    if(array.length < 1) {
      return new Array();
    }
    return array;
  } else {
    return new Array();
  }
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
}

loadAll();