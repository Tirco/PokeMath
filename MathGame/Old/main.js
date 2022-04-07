const pkmnNum = 898
const problemElement = document.querySelector(".problem")
const mainUI = document.querySelector(".main-ui")
const ourForm = document.querySelector(".our-form")
const ourField = document.querySelector(".our-field")
const pointsNeeded = document.querySelector(".points-needed")
const mistakesAllowed = document.querySelector(".mistakes-allowed")
const pokeball = document.getElementById("pokeball")
const pokedex = document.getElementById("pokedex")
const progressBar = document.querySelector(".progress-inner")
const endMessage = document.querySelector(".end-message")
const resetButton = document.querySelector(".reset-button")
const newCatchInfo = document.getElementById("new-catch-info")
const winScore = 5 //hvor mange poeng som trengs.
const defaultLives = 3 //hvor mange forsøk man har.
const highscore = document.querySelector(".high-score")
const pkmncaught = document.querySelector(".pkmn-caught")
const legendaries = [144,145,146,150,243,244,245,249,250,377,378,379,380,381,382,383,384,480,481,482,483,484,485,486,487,488,491,638,639,640,641,642,643,644,645,646,716,717,718,772,773,785,786,787,788,789,790,791,792,800,888,890,891,892,894,895,896,897,898]
const mythics = [151,251,385,386,489,490,492,493,494,647,648,649,719,720,721,801,802,807,808,809,893]
const localStorage = window.localStorage;
const cookieAllowButton = document.getElementById("cookie-allow")
const cookieCancelButton = document.getElementById("cookie-cancel")
const cookiePrompt = document.querySelector(".cookie-consent")
const newsButton = document.getElementById("update-log")

let state = {
	totalScore: 0,
	score: 0,
	wrongAnswers: 0,
  pkmnCaught: 0,
  pkmnList: []
}

//cookie stuff
let cookie_consent = getCookie("user_cookie_consent");
if(cookie_consent != ""){
    document.getElementById("cookieNotice").style.display = "none";
    
}else{
    document.getElementById("cookieNotice").style.display = "block";
}


// Create cookie
function setCookie(cname, cvalue, exdays) {
  const d = new Date();
  d.setTime(d.getTime() + (exdays*24*60*60*1000));
  let expires = "expires="+ d.toUTCString();
  document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

// Delete cookie
function deleteCookie(cname) {
  const d = new Date();
  d.setTime(d.getTime() + (24*60*60*1000));
  let expires = "expires="+ d.toUTCString();
  document.cookie = cname + "=;" + expires + ";path=/";
}

// Read cookie
function getCookie(cname) {
  let name = cname + "=";
  let decodedCookie = decodeURIComponent(document.cookie);
  let ca = decodedCookie.split(';');
  for(let i = 0; i <ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) == ' ') {
          c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
          return c.substring(name.length, c.length);
      }
  }
  return "";
}

function savePokemonInCookie() {
  setCookie('pokedex', state.pkmnList.join('|'),90)
  console.log("cookies saved.")
}

async function loadPokemonFromCookie(){
  var json_str = getCookie('pokedex')
  if(json_str == "") {
    console.log("No cookie found")
    return;
  }
  pklist = json_str.split('|')
  for (var i = 0; i < pklist.length; i++) {
    x = pklist[i]
    console.log(x)
    
    //Load
    shiny = 1
    if(x.charAt(0) == 'S'){
      shiny = 0
    }
    number = x.substring(1);

    await axios.get(`https://pokeapi.co/api/v2/pokemon/${number}`, {
      timeout: 5000,
    })
    .then((res) => addToPokedex(number,shiny,res))
    .catch((err) => console.log(err))
    
  }
  newCatchInfo.innerHTML = ""
  
}


//Try to load on join

cookieAllowButton.addEventListener("click", allowCookies)
cookieCancelButton.addEventListener("click", hideCookiePrompt)
newsButton.addEventListener("click",toggleNews)

function toggleNews(){
  if(document.getElementById("callout").style.display == 'none') {
    document.getElementById("callout").style.display = 'block';
  } else {
    document.getElementById("callout").style.display = 'none';
  }
  
}

function allowCookies(){
  // Set cookie consent
  deleteCookie('user_cookie_consent');
  setCookie('user_cookie_consent', 1, 30);
  document.getElementById("cookieNotice").style.display = "none";
}
function hideCookiePrompt(){
  document.getElementById("cookieNotice").style.display = "none";
}


//pkmnlist will be S1, for shiny #1, and N1 for normal #1.

function updateProblem() {
	state.currentProblem = generateProblem()
	problemElement.innerHTML = `${state.currentProblem.numberOne} ${state.currentProblem.operator} ${state.currentProblem.numberTwo}`
	ourField.value = ""
	ourField.focus()
}

function generateNumber(max) {
	return (Math.floor(Math.random() * (max + 1)))
}

pokeball.addEventListener('click', () => { 
  createPokemon()
})

function generateProblem() {
  var operator = ['+','-','x','/'][generateNumber(3)]
  var numberOne = generateNumber(10)
	var numberTwo = generateNumber(10)
  if(operator == '/') {
    if(numberTwo == 0) {
      numberTwo++;
    }
    numberOne = numberOne * numberTwo
  }
	return {
    operator, numberOne, numberTwo
	}
}

ourForm.addEventListener("submit", handleSubmit)

function handleSubmit(e) {
	e.preventDefault()

  if(ourField.value == "") {
    ourField.focus()
    return;
  }

  if(state.score == winScore) { //Make sure we can't enter a score when whe are in the win screen.
    return;
  }
	
	let correctAnswer
	const p = state.currentProblem
	if(p.operator == "+") {
		correctAnswer = p.numberOne + p.numberTwo
	} else if(p.operator == "-") {
		correctAnswer = p.numberOne - p.numberTwo
	} else if(p.operator == "x") {
		correctAnswer = p.numberOne * p.numberTwo
	} else if(p.operator == "/") {
		correctAnswer = p.numberOne / p.numberTwo
	} else {
		correctAnswer = "?"
	}
	
	if(parseInt(ourField.value,10) == correctAnswer) {
		state.score++
		state.totalScore++
		pointsNeeded.textContent = 5 - state.score
    highscore.textContent = state.totalScore
    mainUI.classList.add("ui-animate-correct")
    setTimeout(() =>  mainUI.classList.remove("ui-animate-correct"), 1001)
		updateProblem()
		renderProgressBar()
	} else {
		state.wrongAnswers++
    ourField.value = ""
		mistakesAllowed.textContent = 2-state.wrongAnswers
		ourField.focus()
    problemElement.classList.add("animate-wrong")
    setTimeout(() => problemElement.classList.remove("animate-wrong"), 451)
    mainUI.classList.add("ui-animate-wrong")
    setTimeout(() =>  mainUI.classList.remove("ui-animate-wrong"), 1001)
	}
	checkLogic()
		
}

function checkLogic() {
	//If you win
	if(state.score === winScore) {
	  endMessage.textContent = "Flott jobbet!"
	  document.body.classList.add("overlay-is-open")
      pokeball.classList.remove("is-hidden")
	}
	//If you lost
	if(state.wrongAnswers === defaultLives) {
		resetGame()
	}
}

resetButton.addEventListener("click", resetGame)

function resetGame() {
	document.body.classList.remove("overlay-is-open")
	updateProblem()
	state.score = 0
	state.wrongAnswers = 0
	pointsNeeded.textContent = winScore
	mistakesAllowed.textContent = (defaultLives -1)
	renderProgressBar()
  newCatchInfo.innerHTML = ""
  resetButton.classList.add("is-hidden")
  savePokemonInCookie()
/* 	if(pokeball.classList.contains("is-hidden") === false) {
		pokeball.classList.add("is-hidden")
	} */
}

function renderProgressBar(){
	progressBar.style.transform = `scaleX(${state.score/5})`
}

function catchPokemon(res, randomPokemon) {

  
  //gjør "fortsett" knappen synlig
  resetButton.classList.remove("is-hidden")


  //Skal de få en shiny?
  let generateShiny = Math.floor(Math.random() * 100) //Here shinychance is defined.
  addToPokedex(randomPokemon,generateShiny,res)
}

/**
 * 
 * @param {*} randomPokemon = ID of pokemon to add
 * @param {*} generateShiny = 0 for shiny, 1 for not.
 */
function addToPokedex(randomPokemon,generateShiny,res) {
  const pkmnname = res.data["name"]
  
  const pkmntypes = res.data["types"]
  let pkmntype = ''

  
  //oppdater statistikk
  state.pkmnCaught++
  pkmncaught.textContent = state.pkmnCaught

  const types = pkmntypes.forEach((type) => {
    pkmntype += `<span class="tag is-medium is-light mx-1">${type.type.name} </span>`
  })

  let shiny = ""
  let shinyText = ""
  let legendary = ""
  let legendaryText = ""
  let imagelink = `https://assets.poketwo.net/images/${randomPokemon}.png?v=24`
  //Is it legendary?
  if(legendaries.includes(randomPokemon)) {
    legendary = `pokemon-legendary`
    legendaryText = "Legendarisk "
  } else if(mythics.includes(randomPokemon)) {
    legendary = `pokemon-mythic`
    legendaryText = "Mytisk "
  }
  if(generateShiny === 0) {
    //SHINY - set the values.
    shiny = `pokemon-shiny`
    shinyText = `Shiny `
    imagelink = `https://assets.poketwo.net/shiny/${randomPokemon}.png?v=24`
  //save pokemon to cookie
    state.pkmnList.push("S"+randomPokemon);
  }
    state.pkmnList.push("N"+randomPokemon);
  
  

    // Display on screen
    endMessage.textContent = `Du fanget en ${shinyText}${legendaryText}${pkmnname}!`
    newCatchInfo.innerHTML = 
    `<div class="has-text-centered">
      <div style="background-image: url('${imagelink}'); height: 128px; width: 128px; background-size: cover; display: block;margin-left:auto; margin-right:auto;">&nbsp;</div>
    </div>`

  // Add to dex
  pokedex.innerHTML = `
    <div class="column is-narrow">
      <div class="card ${shiny} ${legendary}">
        <div class="card-content">
          <div class="has-text-centered">
            <div style="background-image: url('${imagelink}'); height: 128px; width: 128px; background-size: cover; display: block;">&nbsp;</div>
          </div>
        </div>
        <div class="card-footer">
          <p class="card-footer-item">
            <strong style="text-transform: capitalize;">${pkmnname}</strong>
          </p>
          <p class="card-footer-item">
            # ${randomPokemon}
          </p>
        </div>
        <footer class="card-footer">
          <p class="card-footer-item" style="text-transform: capitalize;>
            ${pkmntype}
          </p>
        </footer>
      </div>
    </div>
  ` + pokedex.innerHTML
  //Done!
}

function createPokemon(){
  let randomPokemon = Math.floor(Math.random() * pkmnNum)+1

  if(legendaries.includes(randomPokemon)) {
    //Legendaries should be 5x more rare than any other pokemon. Let us see if they get to keep it, or we will reroll.
    if((Math.floor(Math.random() * 8)) === 0) {
      //keep the legendary.
      console.log("kept legendary")
    } else {
      //reroll
      console.log("rerolled legendary")
      return(createPokemon)
    }
    
  } else if(mythics.includes(randomPokemon)) {
    //Legendaries should be 5x more rare than any other pokemon. Let us see if they get to keep it, or we will reroll.
    if((Math.floor(Math.random() * 15)) === 0) {
      //keep the legendary.
      console.log("kept mythic")
    } else {
      //reroll
      console.log("rerolled mythic")
      return(createPokemon)
    }
    
  }

  axios
    .get(`https://pokeapi.co/api/v2/pokemon/${randomPokemon}`, {
      timeout: 5000,
    })
    .then((res) => catchPokemon(res, randomPokemon))
    .catch((err) => console.log(err))
  pokeball.classList.add("is-hidden")
}
	loadPokemonFromCookie()
	updateProblem()