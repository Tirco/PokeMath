const prevPokemonWrapper = document.getElementById('prev-evolution-wrapper');
const mainPokemonWrapper = document.getElementById('main-pokemon-wrapper');
const nextPokemonWrapper = document.getElementById('next-evolution-wrapper');
const statsWrapper = document.getElementById('stats-wrapper');
const languagesWrapper = document.getElementById('languages-wrapper');
const prevButton = document.getElementById('prevButtonBG');
const nextButton = document.getElementById('nextButtonBG');

let pokemonInfo = null;
let shiny = false;
const maxId = 1010; 
const minId = 0;

let currentId = 1;
let prevId = 0;
let nextId = 2;

// Load pokemon_info.json
fetch('pokemon_info.json')
  .then(response => response.json())
  .then(data => {
    pokemonInfo = data;
    document.dispatchEvent(new Event('pokemonInfoLoaded'));
  })
  .catch(error => console.error('Error loading pokemon_info.json:', error));

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

let pokemonInfoReady = false;
let loadAllReady = false;

function tryInitialLoad() {
    if (!pokemonInfoReady || !loadAllReady) return;
    const pokemonId = getQueryParam('pokemonId');
    if (pokemonId) {
        document.getElementById('searchBar').value = pokemonId;
        searchPokemon();
    } else {
        searchPokemon(1);
    }
}

document.addEventListener("pokemonInfoLoaded", function() {
    pokemonInfoReady = true;
    tryInitialLoad();
});

document.addEventListener("loadAllComplete", function() {
    loadAllReady = true;
    tryInitialLoad();
});



document.getElementById('searchBar').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        searchPokemon();
    }
});

function searchPokemon(searchId) {
    if (!pokemonInfo) {
        console.error('Pokemon info not loaded yet');
        return;
    }
    
    const searchBar = document.getElementById('searchBar');
    
    let searchTerm = searchId !== undefined ? searchId : searchBar.value.trim().toLowerCase();

    if (searchId) {
        searchBar.value = searchId; 
    }

    let pokemon = null;
    let pokemonId = null;

    if (!isNaN(searchTerm) && searchTerm >= minId && searchTerm <= maxId) {
      pokemonId = searchTerm;
      pokemon = pokemonInfo[searchTerm] && pokemonInfo[searchTerm]['0'];
    } else {
        for (const id in pokemonInfo) {
            const baseForm = pokemonInfo[id]['0'];
            if (baseForm && baseForm.name.toLowerCase() === searchTerm) {
                pokemonId = id;
                pokemon = baseForm;
                break;
            }
        }
    }

    if (!pokemon) {
        console.error('Pokemon not found');
        return;
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

    const entry = isUnlocked ? pokemon.description : "???";

    
    let brightness = isUnlocked ? "brightness(100%)" : "brightness(0%)"
    let nameString = isUnlocked ? pokemon.name : "???";

    let pkmnType = '';
    let typesArray = Array.isArray(pokemon.types) ? pokemon.types : [pokemon.types];
    typesArray.forEach((type) => {
        pkmnType += `<span class="poke-types type-${type}">${type}</span>`;
    });

    // Format generation, height, weight
    let generation = isUnlocked ? (pokemon.generation ? pokemon.generation.charAt(0).toUpperCase() + pokemon.generation.slice(1) : 'Unknown') : '???';
    let height = isUnlocked ? (pokemon.height ? (pokemon.height / 10).toFixed(1) + 'm' : 'Unknown') : '???';
    let weight = isUnlocked ? (pokemon.weight ? (pokemon.weight / 10).toFixed(1) + 'kg' : 'Unknown') : '???';

    mainPokemonContainer.innerHTML = `
          <img src="images/pokemon/${shinyString}/${currentId}.png" alt="${pokemon.name}" class="poke-image" style="filter: ${brightness}; pointer-events: none;">
          <p class="poke-name-box">${nameString}
            <a class="poke-id">#${currentId}</a>
          </p>
          <p>${pkmnType}</p>
          <p class="pokemon-details"><strong>Generasjon:</strong> ${generation} | <strong>Høyde:</strong> ${height} | <strong>Vekt:</strong> ${weight}</p>
          <div>
          <div class="poke-name-box" style="background-color: #ed9999;">Engelsk Pokedex Info:
          <p class="dexentry">${entry}</p>
          </div>
          </p>
          <div class="stats-container">
            <div class="evotitle">Stats:</div>
            ${isUnlocked ? `
                <div class="stat-item"><span class="stat-label">HP</span><span class="stat-value">${pokemon.base_hp}</span></div>
                <div class="stat-item"><span class="stat-label">Attack</span><span class="stat-value">${pokemon.base_atk}</span></div>
                <div class="stat-item"><span class="stat-label">Defense</span><span class="stat-value">${pokemon.base_def}</span></div>
                <div class="stat-item"><span class="stat-label">Sp. Attack</span><span class="stat-value">${pokemon.base_satk}</span></div>
                <div class="stat-item"><span class="stat-label">Sp. Defense</span><span class="stat-value">${pokemon.base_sdef}</span></div>
                <div class="stat-item"><span class="stat-label">Speed</span><span class="stat-value">${pokemon.base_spd}</span></div>
            ` : '<div>???</div>'}
          </div>
          <div class="languages-container">
            <div class="evotitle">Navn på andre språk:</div>
            ${isUnlocked ? `
                <div class="language-item"><span class="language-code">JA</span><span class="language-name">${pokemon.name_ja || 'N/A'}</span></div>
                <div class="language-item"><span class="language-code">JA-R</span><span class="language-name">${pokemon.name_ja_romanji || 'N/A'}</span></div>
                <div class="language-item"><span class="language-code">DE</span><span class="language-name">${pokemon.name_de || 'N/A'}</span></div>
                <div class="language-item"><span class="language-code">FR</span><span class="language-name">${pokemon.name_fr || 'N/A'}</span></div>
            ` : '<div>???</div>'}
          </div>
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

    // Build evolution data from pokemonInfo
    const baseForm = pokemonInfo[currentId] && pokemonInfo[currentId]['0'];
    const evoFromId = baseForm && baseForm.evo_from ? baseForm.evo_from : null;
    const evolvesTo = [];
    for (const id in pokemonInfo) {
      const form = pokemonInfo[id] && pokemonInfo[id]['0'];
      if (form && form.evo_from === currentId) {
        evolvesTo.push(parseInt(id));
      }
    }
    //PREVIOUS EVO DATA
    if(evoFromId) {
        prevPokemon = pokemonInfo[evoFromId] && pokemonInfo[evoFromId]['0'];
        if (!prevPokemon) {
          prevPokemonContainer.innerHTML = `<div class="evotitle">Utvikles fra:</div>
          <div class="evotitle">Ingen</div>`;
          return;
        }
        const prevEvoIsUnlocked = shiny ? state.pkmnList.includes(`S${evoFromId}`) : state.pkmnList.includes(`N${evoFromId}`);

        let prevEvoBrightness = prevEvoIsUnlocked ? "brightness(100%)" : "brightness(0%)";
        let prevEvoNameString = prevEvoIsUnlocked ? prevPokemon.name : "???";

        let prevPkmnType = '';
        let prevTypesArray = Array.isArray(prevPokemon.types) ? prevPokemon.types : [prevPokemon.types];
        prevTypesArray.forEach((type) => {
          prevPkmnType += `<span class="poke-types type-${type}">${type}</span>`;
        });

        prevPokemonContainer.innerHTML = `<div class="evotitle">Utvikles fra:</div>
        <a style="cursor: pointer;"href="./pokeviewer.html?pokemonId=${evoFromId}">
        <div class="small-poke-container  ${shinyBG}">
          <img src="images/pokemon/${shinyString}/${evoFromId}.png" alt="${prevPokemon.name}" class="poke-image" style="filter: ${prevEvoBrightness}; pointer-events: none;">
          <p class="poke-name-box">${prevEvoNameString}
            <a class="poke-id">#${evoFromId}</a>
          </p>
          <p>${prevPkmnType}</p>
        </div></a>`

      } else {
        prevPokemonContainer.innerHTML = `<div class="evotitle">Utvikles fra:</div>
        <div class="evotitle">Ingen</div>`
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
      if (evolvesTo.length > 0) {

        nextPokemonContainer.innerHTML = `<div class="evotitle">Utvikles til (${evolvesTo.length}):</div>`
        evolvesTo.forEach(evolutionId => {
          nextPokemon = pokemonInfo[evolutionId] && pokemonInfo[evolutionId]['0'];
          if (!nextPokemon) return;
          let nextEvoIsUnlocked = shiny ? state.pkmnList.includes(`S${evolutionId}`) : state.pkmnList.includes(`N${evolutionId}`);
          let nextEvoBrightness = nextEvoIsUnlocked ? "brightness(100%)" : "brightness(0%)";
          let nextEvoNameString = nextEvoIsUnlocked ? nextPokemon.name : "???";
          let nextPkmnType = '';
          let nextTypesArray = Array.isArray(nextPokemon.types) ? nextPokemon.types : [nextPokemon.types];
          nextTypesArray.forEach((type) => {
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

  let alternatePokemonWrapper = document.getElementById('alternate-forms-wrapper');
  if(alternatePokemonWrapper) {
    alternatePokemonWrapper.innerHTML = '<div class="wrapper-header">Alternative Former:</div>';
  } else {
    alternatePokemonWrapper = document.createElement('div');
    alternatePokemonWrapper.className = 'alternate-forms-wrapper';
    alternatePokemonWrapper.innerHTML = '<div class="wrapper-header">Alternative Former:</div>';

  }

  // Get all alternate forms from pokemonInfo
  const allForms = Object.keys(pokemonInfo[currentId] || {}).filter(k => k !== '0');
  const hasAlternateForms = allForms.length > 0;

  if (hasAlternateForms) {
    console.log('Adding alternate forms for', currentId);
    alternatePokemonWrapper.style.display = 'flex';
    allForms.forEach(formKey => {
      const formData = pokemonInfo[currentId][formKey];
      if (!formData) return;

      let altId = currentId + "-" + formKey;
      let altIsUnlocked = shiny ? state.pkmnList.includes(`S${altId}`) : state.pkmnList.includes(`N${altId}`);
      let altBrightness = altIsUnlocked ? "brightness(100%)" : "brightness(0%)";
      let altNameString = altIsUnlocked ? formData.name : "???";
      let altPkmnType = '';
      let altTypesArray = Array.isArray(formData.types) ? formData.types : [formData.types];
      altTypesArray.forEach((type) => {
        altPkmnType += `<span class="poke-types type-${type}">${type}</span>`;
      });

      alternatePokemonWrapper.innerHTML += `
      <div class="small-poke-container ${shinyBG}" style="display: block;">
        <img src="images/pokemon/${shinyString}/${formData.imageid}.png" alt="${formData.name}" class="poke-image" style="filter: ${altBrightness}; pointer-events: none;">
        <p class="poke-name-box">${altNameString}
          <a class="poke-id">#${altId}</a>
        </p>
        <p>${altPkmnType}</p>
      </div></a>`
    });
  } else {
    alternatePokemonWrapper.style.display = 'none';
  }
}
}