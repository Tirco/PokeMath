const prevPokemonWrapper = document.getElementById('prev-evolution-wrapper');
const mainPokemonWrapper = document.getElementById('main-pokemon-wrapper');
const nextPokemonWrapper = document.getElementById('next-evolution-wrapper');
const prevButton = document.getElementById('prevButtonBG');
const nextButton = document.getElementById('nextButtonBG');

let shiny = false;
const maxId = 1010; 
const minId = 0;

let currentId = 1;
let prevId = 0;
let nextId = 2;

shinycheck.onchange = function() {
  if(this.checked){
      shiny = true;
  } else{
      shiny = false;
  }
  searchPokemon();
}

function getQueryParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
}

document.getElementById('searchButton').addEventListener('click', function() {
    searchPokemon();
});

document.addEventListener("loadAllComplete", function() {
    const pokemonId = getQueryParam('pokemonId');
    if (pokemonId) {
        document.getElementById('searchBar').value = pokemonId;
        searchPokemon();
    } else {
        searchPokemon(1);
    }

});



document.getElementById('searchBar').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        searchPokemon();
    }
});

function searchPokemon(searchId) {
    const searchBar = document.getElementById('searchBar');
    
    let searchTerm = searchId !== undefined ? searchId : searchBar.value.trim().toLowerCase();

    if (searchId) {
        searchBar.value = searchId; 
    }

    let pokemon = null;
    let pokemonId = null;

    if (!isNaN(searchTerm) && searchTerm >= minId && searchTerm <= maxId) {
      pokemonId = searchTerm;
      pokemon = pokemondata[searchTerm];
    } else {
        for (const id in pokemondata) {
            if (pokemondata[id].name.toLowerCase() === searchTerm) {
                pokemonId = id;
                pokemon = pokemondata[id];
                break;
            }
        }
    }

    currentId = parseInt(pokemonId);
    console.log(pokemon);
    displayPokemon(pokemon);

    let wrapper = document.querySelector(".alternate-forms-wrapper");
    let header = document.querySelector(".wrapper-header");
  
    if (!wrapper || !header) {
      console.error("Wrapper or header element not found.");
      return; // Exit if elements are not found
    }
  
    document.addEventListener("scroll", () => {
      let wrapperTop = wrapper.getBoundingClientRect().top;
      let headerHeight = header.offsetHeight;
  
      if (wrapperTop + headerHeight <= window.innerHeight) {
        header.style.position = "relative";
        header.style.bottom = "auto";
      } else {
        header.style.position = "fixed";
        header.style.bottom = "0";
      }
    });
}

document.getElementById('prevButton').addEventListener('click', function() {
    updatePokemon('prev');
});

document.getElementById('nextButton').addEventListener('click', function() {
    updatePokemon('next');
});

function updatePokemon(direction) {
  let newId = currentId;

  if (direction === 'next') {
      newId = currentId >= maxId ? minId : currentId + 1;
  } else if (direction === 'prev') {
      newId = currentId <= minId ? maxId : currentId - 1;
  }

  if (newId !== currentId) {
      currentId = newId;
      searchPokemon(currentId);
  }
}

function displayPokemon(pokemon) {
  if (pokemon) {
    nextId = currentId < maxId ? currentId + 1 : minId;
    prevId = currentId > minId ? currentId - 1 : maxId;

    const shinyString = shiny ? "shiny" : "normal";
    let shinyBG = shiny ? "pokemon-shiny" : "";

    const isUnlocked = shiny ? state.pkmnList.includes(`S${currentId}`) : state.pkmnList.includes(`N${currentId}`);
  
    //Make sure we have a container for the main pokemon
    let mainPokemonContainer = document.getElementById('main-pokemon-container');
    if(mainPokemonContainer) {
      mainPokemonContainer.innerHTML = '';
    } else {
      mainPokemonContainer = document.createElement('div');
      mainPokemonContainer.className = `main-pokemon-container ${shinyBG}`;
      if(mainPokemonWrapper) {
        mainPokemonWrapper.innerHTML = '';
        mainPokemonWrapper.appendChild(mainPokemonContainer);
      }

    }

    const entry = isUnlocked ? dexEntries[currentId]?.dex_entry : "???";

    
    let brightness = isUnlocked ? "brightness(100%)" : "brightness(0%)"
    let nameString = isUnlocked ? pokemon.name : "???";

    let pkmnType = '';
    pokemon.types.forEach((type) => {
        pkmnType += `<span class="poke-types type-${type}">${type}</span>`;
    });
    mainPokemonContainer.innerHTML = `
          <img src="images/pokemon/${shinyString}/${currentId}.png" alt="${pokemon.name}" class="poke-image" style="filter: ${brightness}; pointer-events: none;">
          <p class="poke-name-box">${nameString}
            <a class="poke-id">#${currentId}</a>
          </p>
          <p>${pkmnType}</p>
          <div>
          <div class="poke-name-box" style="background-color: #ed9999;">Engelsk Pokedex Info:
          <p class="dexentry">${entry}</p>
          </div>
          </p>
    `

    //Do next & Prev button stuff.
    const prevIsUnlocked = shiny ? state.pkmnList.includes(`S${prevId}`) : state.pkmnList.includes(`N${prevId}`);
    let prevBrightness = prevIsUnlocked ? "brightness(100%)" : "brightness(0%)"
    const nextIsUnlocked = shiny ? state.pkmnList.includes(`S${nextId}`) : state.pkmnList.includes(`N${nextId}`);
    let nextBrightness = nextIsUnlocked ? "brightness(100%)" : "brightness(0%)"
    prevButton.style.filter = prevBrightness;
    prevButton.style.backgroundImage = `url(images/pokemon/${shinyString}/${prevId}.png)`;
    nextButton.style.filter = nextBrightness;
    nextButton.style.backgroundImage = `url(images/pokemon/${shinyString}/${nextId}.png)`;

    //EVO STUFF

    //PREVIOUS EVO
    let prevPokemonContainer = document.getElementById('prev-pokemon-container');
    if(prevPokemonContainer) {
      prevPokemonContainer.innerHTML = '';
    } else {
      prevPokemonContainer = document.createElement('div');
      prevPokemonContainer.className = 'prev-pokemon-container ';
      if(prevPokemonWrapper) {
        prevPokemonWrapper.innerHTML = '';
        prevPokemonWrapper.appendChild(prevPokemonContainer);
      }
    }
    const evolutionData = evolutionRelationships[currentId];
    if (evolutionData) {

      //PREVIOUS EVO DATA
      if(evolutionData.evolves_from) {
        const prevId = evolutionData.evolves_from;
        prevPokemon = pokemondata[prevId];
        const prevEvoIsUnlocked = shiny ? state.pkmnList.includes(`S${prevId}`) : state.pkmnList.includes(`N${prevId}`);
      
        let prevEvoBrightness = prevEvoIsUnlocked ? "brightness(100%)" : "brightness(0%)";
        let prevEvoNameString = prevEvoIsUnlocked ? prevPokemon.name : "???";

        let prevPkmnType = '';
        prevPokemon.types.forEach((type) => {
          prevPkmnType += `<span class="poke-types type-${type}">${type}</span>`;
        });
  
        prevPokemonContainer.innerHTML = `<div class="evotitle">Utvikles fra:</div>
        <a style="cursor: pointer;"href="./pokeviewer.html?pokemonId=${prevId}">
        <div class="small-poke-container  ${shinyBG}">
          <img src="images/pokemon/${shinyString}/${prevId}.png" alt="${prevPokemon.name}" class="poke-image" style="filter: ${prevEvoBrightness}; pointer-events: none;">
          <p class="poke-name-box">${prevEvoNameString}
            <a class="poke-id">#${prevId}</a>
          </p>
          <p>${prevPkmnType}</p>
        </div></a>`
  
      } else {
        prevPokemonContainer.innerHTML = `<div class="evotitle">Utvikles til:</div>
        <div class="evotitle ">Ukjent</div>`
      }

      let nextPokemonContainer = document.getElementById('next-pokemon-container');
      if(nextPokemonContainer) {
        nextPokemonContainer.innerHTML = '';
      } else {
        nextPokemonContainer = document.createElement('div');
        nextPokemonContainer.className = 'next-pokemon-container';
        if(nextPokemonWrapper) {
          nextPokemonWrapper.innerHTML = '';
          nextPokemonWrapper.appendChild(nextPokemonContainer);
        }
      }
      if (evolutionData.evolves_to.length > 0) {

        nextPokemonContainer.innerHTML = `<div class="evotitle">Utvikles til (${evolutionData.evolves_to.length}):</div>`
        evolutionData.evolves_to.forEach(evolutionId => {
          nextPokemon = pokemondata[evolutionId];
          let nextEvoIsUnlocked = shiny ? state.pkmnList.includes(`S${evolutionId}`) : state.pkmnList.includes(`N${evolutionId}`);
          let nextEvoBrightness = nextEvoIsUnlocked ? "brightness(100%)" : "brightness(0%)";
          let nextEvoNameString = nextEvoIsUnlocked ? nextPokemon.name : "???";
          let nextPkmnType = '';
            nextPokemon.types.forEach((type) => {
            nextPkmnType += `<span class="poke-types type-${type}">${type}</span>`;
          });
          nextPokemonContainer.innerHTML += `
          <a style="cursor: pointer;"href="./pokeviewer.html?pokemonId=${evolutionId}">
          <div class="small-poke-container ${shinyBG}">
            <img src="images/pokemon/${shinyString}/${evolutionId}.png" alt="${nextPokemon.name}" class="poke-image" style="filter: ${nextEvoBrightness}; pointer-events: none;">
            <p class="poke-name-box">${nextEvoNameString}
              <a class="poke-id">#${evolutionId}</a>
            </p>
            <p>${nextPkmnType}</p>
          </div></a>`
// Append to mainPokemonWrapper
        });
    } else {
      nextPokemonContainer.innerHTML = `<div class="evotitle">Utvikles til:</div>
      <div class="evotitle">Ukjent</div>`
    }

  }
  let alternatePokemonWrapper = document.getElementById('alternate-forms-wrapper');
  if(alternatePokemonWrapper) {
    alternatePokemonWrapper.innerHTML = '<div class="wrapper-header">Alternative Former:</div>';
  } else {
    alternatePokemonWrapper = document.createElement('div');
    alternatePokemonWrapper.className = 'alternate-forms-wrapper';
    alternatePokemonWrapper.innerHTML = '<div class="wrapper-header">Alternative Former:</div>';

  }

  const alternateForms = alternateFormsData[currentId];
  const halloweenForms = eventData["halloween"][currentId];
  const xmasForms = eventData["christmas"][currentId]
  const uniqueForms = eventData["unique"][currentId]
    if (alternateForms) {
      Object.entries(alternateForms).forEach(([key, item]) => {
        let altId=currentId + "-" + key;

        let altIsUnlocked = shiny ? state.pkmnList.includes(`S${altId}`) : state.pkmnList.includes(`N${altId}`);
        let altBrightness = altIsUnlocked ? "brightness(100%)" : "brightness(0%)";
        let altNameString = altIsUnlocked ? item.name : "???";
        let altPkmnType = '';
          item.types.forEach((type) => {
            altPkmnType += `<span class="poke-types type-${type}">${type}</span>`;
        });

        alternatePokemonWrapper.innerHTML += `
        <div class="small-poke-container ${shinyBG}" style="display: block;">
          <img src="images/pokemon/${shinyString}/${item.imageid}.png" alt="${item.name}" class="poke-image" style="filter: ${altBrightness}; pointer-events: none;">
          <p class="poke-name-box">${altNameString}
            <a class="poke-id">#${altId}</a>
          </p>
          <p>${altPkmnType}</p>
        </div></a>`
      });
    }
    if (halloweenForms) {
      Object.entries(halloweenForms).forEach(([key, item]) => {
        let altId=currentId + "-H" + key;
        let altIsUnlocked = shiny ? state.pkmnList.includes(`S${altId}`) : state.pkmnList.includes(`N${altId}`);
        let altBrightness = altIsUnlocked ? "brightness(100%)" : "brightness(0%)";
        let altNameString = altIsUnlocked ? item.name : "???";
        let altPkmnType = '';
          item.types.forEach((type) => {
            altPkmnType += `<span class="poke-types type-${type}">${type}</span>`;
        });

        alternatePokemonWrapper.innerHTML += `
        
        <div class="small-poke-container" style="display: block;">
          <img src="images/pokemon/${shinyString}/${item.imageid}.png" alt="${item.name}" class="poke-image" style="filter: ${altBrightness}; pointer-events: none;">
          <p class="poke-name-box">${altNameString}
            <a class="poke-id">#${altId}</a>
          </p>
          <p>${altPkmnType}</p>
        </div></a>`
      });
    }
    if (xmasForms) {
      Object.entries(xmasForms).forEach(([key, item]) => {
        let altId=currentId + "-C" + key;

        let altIsUnlocked = shiny ? state.pkmnList.includes(`S${altId}`) : state.pkmnList.includes(`N${altId}`);
        let altBrightness = altIsUnlocked ? "brightness(100%)" : "brightness(0%)";
        let altNameString = altIsUnlocked ? item.name : "???";
        let altPkmnType = '';
          item.types.forEach((type) => {
            altPkmnType += `<span class="poke-types type-${type}">${type}</span>`;
        });

        alternatePokemonWrapper.innerHTML += `
        
        <div class="small-poke-container" style="display: block;">
          <img src="images/pokemon/${shinyString}/${item.imageid}.png" alt="${item.name}" class="poke-image" style="filter: ${altBrightness}; pointer-events: none;">
          <p class="poke-name-box">${altNameString}
            <a class="poke-id">#${altId}</a>
          </p>
          <p>${altPkmnType}</p>
        </div></a>`
      });
    }
    if (uniqueForms) {
      Object.entries(uniqueForms).forEach(([key, item]) => {
        let altId=currentId + "-U" + key;

        let altIsUnlocked = shiny ? state.pkmnList.includes(`S${altId}`) : state.pkmnList.includes(`N${altId}`);
        let altBrightness = altIsUnlocked ? "brightness(100%)" : "brightness(0%)";
        let altNameString = altIsUnlocked ? item.name : "???";
        let altPkmnType = '';
          item.types.forEach((type) => {
            altPkmnType += `<span class="poke-types type-${type}">${type}</span>`;
        });

        alternatePokemonWrapper.innerHTML += `
        
        <div class="small-poke-container" style="display: block;">
          <img src="images/pokemon/${shinyString}/${item.imageid}.png" alt="${item.name}" class="poke-image" style="filter: ${altBrightness}; pointer-events: none;">
          <p class="poke-name-box">${altNameString}
            <a class="poke-id">#${altId}</a>
          </p>
          <p>${altPkmnType}</p>
        </div></a>`
      });
    }
}
}