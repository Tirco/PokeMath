const pkmnNum = 905
const pokeball = document.getElementById("pokeball")
const pokedex = document.getElementById("pokedex")
const endMessage = document.querySelector(".end-message")
const newCatchInfo = document.getElementById("new-catch-info")
const pkmncaught = document.getElementById("balltext")

const legendaries = Object.freeze([144,145,146,150,243,244,245,249,250,377,378,379,380,381,382,383,384,480,481,482,483,484,485,486,487,488,491,638,639,640,641,642,643,644,645,646,716,717,718,772,773,785,786,787,788,789,790,791,792,800,888,889,890,891,892,894,895,896,897,898])
const mythics = Object.freeze([151,251,385,386,489,490,492,493,494,647,648,649,719,720,721,801,802,807,808,809,893])

const specialforms = Object.freeze([3,6,9,12,15,18,19,20,25,26,27,28,37,38,50,51,52,53,65,68,74,75,76,77,78,79,80,83,88,89,94,99,103,105,110,115,122,127,130,131,133,142,143,144,145,146,150,181,199,208,212,214,222,229,248,254,257,260,263,264,282,302,303,306,308,310,319,323,334,351,354,359,362,373,376,380,381,382,383,384,386,413,428,445,448,460,475,479,492,531,550,554,555,562,569,618,641,642,645,646,647,648,658,681,710,711,718,719,720,741,778,809,812,815,818,823,826,834,839,841,842,844,849,851,858,861,869,879,884,890,892])
const specialbonus = 3

var shinyChance = (512 + 5 - ((mathValues.stage*10) + (shopOptions.shinyLevel * 3)));

//For use in informational bits. Currently only used in console.
function shinyChancePercentage(partialValue, totalValue) {
  return "" + (100 / shinyChance).toFixed(4) + "%"
} 
//Special stuff for Pokémon with multiple forms and event pokemon.
pokeball.addEventListener('click', () => { 
  createRandomPokemon()
})

/**
 * Function to always create a special pokemon. 
 * It is not guaranteed that it will be any of the special versions of the pokemon that is picked.
 */
function createSpecialPokemon(){
  let randomInt = Math.floor(Math.random()* (Object.keys(specialforms).length))
  randomPokemon = specialforms[randomInt]
  createSpecificPokemon(randomPokemon);
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
    if((Math.floor(Math.random() * (20-(Number(mathValues.stage) + shopOptions.legendLevel)))) === 0) {
      //keep the legendary.
      //console.log("kept legendary")
    } else {
      //reroll
      //console.log("rerolled legendary")
      createRandomPokemon()
      return
    }
    
  } else if(mythics.includes(randomPokemon)) {
    //Legendaries should be 5x more rare than any other pokemon. Let us see if they get to keep it, or we will reroll.
    if((Math.floor(Math.random() * (30-(Number(mathValues.stage) + shopOptions.mythicLevel)))) === 0) {
      //keep the legendary.
      //console.log("kept mythic")
    } else {
      //reroll
      //console.log("rerolled mythic")
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

  let pokeNumber = id;
  pokeball.classList.add("is-hidden")
  resetButton.classList.remove("is-hidden")

  if(specialforms.includes(id)) {
    let randomVariety = Math.floor(Math.random()* (Object.keys(alternateFormsData[id]).length+1))
    if(randomVariety != 0 && (Math.random() > (0.7 - ((Number(mathValues.stage) * 0.1))))) {
      //Get a special variety
      let specialId = id + "-" + randomVariety;
      const pkmnName = alternateFormsData[id][randomVariety].name
      const pkmnTypes = alternateFormsData[id][randomVariety].types
      const imageId = alternateFormsData[id][randomVariety].imageid

      addToPokedex(specialId, pkmnName, pkmnTypes, imageId, generateShiny(), id)
      return; //Don't do the rest!
    }

  }
  
  //Do normal fetch stuff
  axios //Originalt fra Lesekloden.no TODO vurder å bytte ut.
    .get(`https://pokeapi.co/api/v2/pokemon/${pokeNumber}`, {
      timeout: 5000,
    })
    .then((res) => addToDexFromRes(pokeNumber,generateShiny(),res))
    .catch((err) => console.log(err))


}


/**
 * Should they get a shiny?
 * This function will check their shinyChance and compare it to a generated number.
 */
function generateShiny() {
    return Math.floor(Math.random() * shinyChance) //Here shinyChance is defined.
}

/**
 * Adds a pokemon to the players dex from axios result.
 * @param {*} randomPokemon The pokemons ID
 * @param {*} generateShiny Should the player get a shiny?
 * @param {*} res The pokemon json bit.
 */
function addToDexFromRes(randomPokemon,generateShiny,res){
  const pkmnName = res.data["name"]
  const pkmnTypes = []
  res.data.types.forEach((type) => {
    pkmnTypes.push(type.type.name);
  })
  let imageId = randomPokemon;
  addToPokedex(randomPokemon, pkmnName, pkmnTypes, imageId, generateShiny, randomPokemon)
}


 //Deler av denne koden er originalt fra Lesekloden.no TODO vurder å bytte ut.

/**
 * Add a pokemon to the pokedex
 * @param {*} randomPokemon = ID of pokemon to add
 * @param {*} generateShiny = 0 for shiny, 1+ for not.
 */
function addToPokedex(id, pkmnName, pkmnTypes, imageId, generateShiny, baseId) {
  let randomPokemon = id;
  //Update the statistics
  state.pkmnCaught++
  pkmncaught.textContent = state.pkmnCaught

  
  let imageLink = `images/pokemon/normal/${imageId}.png`
  if(generateShiny === 0) {
    imageLink = `images/pokemon/shiny/${imageId}.png`
  }


  let shiny = ""
  let shinyText = ""
  let legendary = ""
  let legendaryText = ""
  
  //Is it legendary?
  if(legendaries.includes(baseId)) {
    legendary = `legendary`
    legendaryText = "Legendarisk "
  } else if(mythics.includes(baseId)) {
    legendary = `mythic`
    legendaryText = "Mytisk "
  }
  let identifier = ("N"+randomPokemon)
  if(generateShiny === 0) {
    //SHINY - set the values.
    shiny = `pokemon-shiny`
    shinyText = `Shiny `
  //save pokemon to cookie
    identifier = ("S"+randomPokemon);
  }
  
  state.pkmnList.push(identifier);
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

  //Check if pokedex has the identifier already, if it does, update it.
  let repeats = 1;
  if(pokedex.contains(document.getElementById(identifier))) {
    //Update existing pokemon.
    card = pokedex.querySelector("#" + identifier);
    counter = card.querySelector("#cardcounter")
    var number = parseInt(counter.textContent.substring(1));
    repeats += number;
    counter.textContent = ("x" + repeats);
    var repeatMoney = (100 + (shopOptions.coinLevel * 20));
    endMessage.textContent = `Du fanget en ${shinyText}${legendaryText}${pkmnName}!\r\nSiden du allerede har denne pokémonen, fikk du ${repeatMoney} mynter istedet.`
    addFixedMoney(repeatMoney)

  } else {
    //Make new
    let filterText = ("filtered "+id+shinyText+legendaryText+" #"+baseId+" " + pkmnName);
    let pkmnType = ''
    const types = pkmnTypes.forEach((type) => {
      pkmnType += `<span class="typecard type-${type}">${type}</span>`
      filterText += " " + type;
    })

    //Add a new pokemon card to the dex. //Originalt fra Lesekloden.no TODO vurder å bytte ut.
    pokedex.innerHTML = `
    <a id=${identifier} class="column is-narrow ${filterText}" style="cursor: pointer;" href=${imageLink} target="_blank">
      <div class="card ${shiny} ${legendary}">
        <div class="card-content">
          <div class="has-text-centered card-image">
            <div class="card-image" style="background-image: url('${imageLink}'); height: 128px; width: 128px; background-size: cover; background-position: center; display: block;"></div>
            <div class="card-id"> #${randomPokemon}</div>
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
  ` + pokedex.innerHTML
  }

  //else:
  // Add to dex
  
  //Done!
}