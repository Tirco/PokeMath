const pkmnNum = 905
const pokeball = document.getElementById("pokeball")
const pokedex = document.getElementById("pokedex")
const endMessage = document.querySelector(".end-message")
const newCatchInfo = document.getElementById("new-catch-info")
const pkmncaught = document.getElementById("balltext")

const legendaries = Object.freeze([144,145,146,150,243,244,245,249,250,377,378,379,380,381,382,383,384,480,481,482,483,484,485,486,487,488,491,638,639,640,641,642,643,644,645,646,716,717,718,772,773,785,786,787,788,789,790,791,792,800,888,889,890,891,892,894,895,896,897,898,905])
const mythics = Object.freeze([151,251,385,386,489,490,492,493,494,647,648,649,719,720,721,801,802,807,808,809,893])

const specialforms = Object.freeze([3,6,9,12,15,18,19,20,25,26,27,28,37,38,50,51,52,53,58,59,65,68,74,75,76,77,78,79,80,83,88,89,94,99,100,101,103,105,110,115,122,127,130,131,133,142,143,144,145,146,150,157,181,199,208,211,212,214,215,222,229,248,254,257,260,263,264,282,302,303,306,308,310,319,323,334,351,354,359,362,373,376,380,381,382,383,384,386,413,428,445,448,460,475,479,483,484,492,503,531,549,550,554,555,562,569,570,571,618,628,641,642,645,646,647,648,658,681,705,706,710,711,713,718,719,720,724,741,778,809,812,815,818,823,826,834,839,841,842,844,849,851,858,861,869,879,884,890,892,905])
const specialbonus = 3



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
  let randomInt = Math.floor(Math.random()* (Object.keys(specialforms).length))
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
    randomPokemon = specialforms[Math.floor(Math.random()* (Object.keys(specialforms).length))]
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
 * @param {} id The ID of the pokemon to give to the user.
 * @returns 
 */

function createSpecificPokemon(id) {
  pokeball.classList.add("is-hidden")
  resetButton.classList.remove("is-hidden")

  let specialId = id;

  if(specialforms.includes(id)) {
    let randomVariety = Math.floor(Math.random()* (Object.keys(alternateFormsData[id]).length+1))
    if(randomVariety != 0 && (Math.random() > (0.4))) {
      //Get a special variety
      specialId = id + "-" + randomVariety;
      pokemonObjectSet = alternateFormsData[id][randomVariety];
    } else {
      randomVariety = "";
    }

  }


  addToPokedex(specialId);
}

function createEventPokemon(eventName) {
  pokeball.classList.add("is-hidden")
  resetButton.classList.remove("is-hidden")

    let eventKeys = eventData[eventName];
    let randomID = getRandomProperty(eventKeys)
    let eventSubKeys = randomID;
    let randomVarietyObject = getRandomProperty(eventSubKeys);
    const pkmnId = randomVarietyObject.id;
    let specialId = pkmnId + "-" + randomVarietyObject.specialId;
    addToPokedex(specialId)
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
  if(generateShiny() === 0) {
    entry = "S"+id;
    state.streak = 0; //Reset streak
  } else {
    entry = "N"+id;
  }
  
  state.pkmnCaught++
  statCounter("hit","pokemonCaught");
  pkmncaught.textContent = state.pkmnCaught
  state.pkmnList.push(entry);
  loadFromList(entry,false,true,false);
  return;
}

function addSpecificToPokedex(entry) {  
  state.pkmnCaught++
  statCounter("hit","pokemonCaught");
  state.pkmnList.push(entry);
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

async function loadAmountFromList(amount, reverse, log) {
  if(pokedex == null) {
    log("Attempted to load " + amount + "from list, but there was no pokedex")
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

function loadFromList(entry, firstLoad, capture, returnString) {
  if(firstLoad == null) {
    firstLoad = false;
  }
  if(capture == null) {
    capture = false;
  }
  
  if(entry == null || entry == "") {
    log("Error - No entry provided during LoadFromList!")
    return;
  }

  //shiny, id, special-form, amount, legendary, mythic
  var shiny = (Array.from(entry)[0]=='S');
  //log("Shiny: " + shiny);
  var repeats = getOccurrence(state.pkmnList, entry);
  //log("Amount: " + repeats);
  var id = 0;
  var cardId = entry.substring(1);
  var specialFormVariation = 0;
  var legendary = ""
  var legendaryText = ""
  var pkmnTypes = [];
  var shinyTag = ``
  var shinyText = ``
  var pkmnName = "";
  var imageId = 0;
  var imageLink = "";
  var repeatMultiplier = 1;

  if(entry.includes('-')) { //There's something Special!
    var splitEntry = entry.split("-");
    idString = splitEntry[0].replace(/\D/g,'');
    id = Number(idString);
    specialFormString = splitEntry[1].replace(/\D/g,'');
    specialFormVariation = Number(specialFormString);
    if(splitEntry[1].includes('H')) {
      pkmnName = eventData["halloween"][id][specialFormVariation].name
      pkmnTypes = eventData["halloween"][id][specialFormVariation].types
      imageId = eventData["halloween"][id][specialFormVariation].imageid
    } else if(splitEntry[1].includes('C')){
      pkmnName = eventData["christmas"][id][specialFormVariation].name
      pkmnTypes = eventData["christmas"][id][specialFormVariation].types
      imageId = eventData["christmas"][id][specialFormVariation].imageid
    } else {

      pkmnTypes = alternateFormsData[id][specialFormVariation].types;
      pkmnName = alternateFormsData[id][specialFormVariation].name
      imageId = alternateFormsData[id][specialFormVariation].imageid
    }

    
  } else {
      idString = entry.replace(/\D/g,'');
      id = Number(idString);
      imageId = id;
    if(pokemondata[id] == null ) {
      pkmnTypes = ["Unknown ("+id+")"];
      cardId = "???"
      pkmnName = "Missing No.";
      id = 0;
      imageId = 0;
    } else {
      pkmnTypes = pokemondata[id].types;
      pkmnName = pokemondata[id].name;
    }
  }

  //Failsafes
  if(pkmnName == "" || pkmnName == null) {
      pkmnName = "???";
  }
  if(pkmnTypes == null || pkmnTypes.length === 0) {
      pkmnTypes = ["Unknown"];
  }

    
  //Is it legendary?
  if(legendaries.includes(id)) {
    legendary = `legendary`
    legendaryText = "Legendarisk "
    repeatMultiplier = repeatMultiplier * 2
  } else if(mythics.includes(id)) {
    legendary = `mythic`
    legendaryText = "Mytisk "
    repeatMultiplier = repeatMultiplier * 3
  }

  if(shiny == true) {
    //SHINY - set the values.
    repeatMultiplier = repeatMultiplier * 2
    shinyTag = `pokemon-shiny`
    shinyText = `Shiny `
    imageLink = `images/pokemon/shiny/${imageId}.png`
  } else {
    imageLink = `images/pokemon/normal/${imageId}.png`
  }

  let filterText = ("filtered #"+entry+shinyText+legendaryText+" #"+id+" " + pkmnName);
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
        <div style="background-image: url('${imageLink}'); height: 128px; width: 128px; background-size: cover; display: block;margin-left:auto; margin-right:auto;">&nbsp;</div>
      </div>`
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
    <a id=${entry} class="column is-narrow ${filterText}" style="cursor: pointer;" href=${imageLink} target="_blank">
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
