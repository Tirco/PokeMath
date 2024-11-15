// HTML Elements
const progressBar = document.getElementById("dexLoadStatus");
const pokedexContainer = document.getElementById("pokedex");
const searchInput = document.getElementById("searchInput"); // Ensure this ID matches your HTML
let filteredPokemonData = []; // Store only filtered Pokémon data

const generationRanges = {
    1: [1, 151],          // Gen I
    2: [152, 251],        // Gen II
    3: [252, 386],        // Gen III
    4: [387, 493],        // Gen IV
    5: [494, 649],        // Gen V
    6: [650, 721],        // Gen VI
    7: [722, 809],        // Gen VII
    8: [810, 898],        // Gen VIII
    9: [899, 1010]        // Gen IX
};

// Special handling for forms
const specialForms = {
    "Hisuian": 4,
    "Alolan": 7
};

let offset = 0;
const limit = 2000; // Number of Pokémon to load initially
let allPokemonData = []; // Store all Pokémon data for filtering
var filterKeys = [""];

// Show shimmer effect while loading
function showShimmerEffect() {
    pokedexContainer.innerHTML = '<div class="skeleton"></div>'.repeat(20);
}

// Remove shimmer effect after loading
function removeShimmerEffect() {
    pokedexContainer.innerHTML = ''; // Clear skeletons
}

// Initial page load
// Listen for the custom "loadAllComplete" event to start loading Pokémon data
document.addEventListener("loadAllComplete", async function() {
  showShimmerEffect(); // Display shimmer while loading
  await fetchAllPokemonData(); // Fetch and store all Pokémon data
  loadAllPokemon(); // Load the initial batch to display
  filterSelection("all"); // Set "Show All" as the default filter
});

// Fetch and store all unique Pokémon data, sorted numerically by ID
async function fetchAllPokemonData() {
  const fetchFromArray = [...new Set(state.pkmnList.map(id => id))]; // Ensure uniqueness

  // Fetch all Pokémon and sort them by their numeric ID
  allPokemonData = await Promise.all(
      fetchFromArray.map(id => loadFromList(id, true, false, true))
  );

  // Sort based on Pokémon ID extracted from each HTML string
  allPokemonData.sort((a, b) => {
      const idA = parseInt(a.match(/pokemonId=(\d+)/)[1], 10);
      const idB = parseInt(b.match(/pokemonId=(\d+)/)[1], 10);
      return idA - idB;
  });

  //console.log("Fetched and sorted unique Pokémon Data:", allPokemonData);
}

// Load the entire Pokémon dataset at once, respecting active filters
function loadAllPokemon() {
  const filteredData = filterKeys[0] === "" 
      ? allPokemonData // No filter; show all
      : allPokemonData.filter(pokemon => filterKeys.every(key => pokemon.includes(key)));

  renderPokemon(filteredData); // Render all at once
}

function filterSelection(filterKeyToAdd) {
  offset = 0; // Reset offset for filtered data

  if (filterKeyToAdd === "all") {
      filterKeys = [""];
  } else {
      filterKeys = toggleFilterKey(filterKeyToAdd);
  }

  if (filterKeys.length > 1 && filterKeys.includes("")) {
      filterKeys = filterKeys.filter(key => key !== "");
  }

  if (filterKeys.length === 0) {
      filterKeys = [""];
  }

  // Update the button states based on active filters
  updateActiveFilterButtons();

  // Clear only if applying a specific filter (not for "Show All")
  if (filterKeys[0] !== "") {
      pokedexContainer.innerHTML = "";
      showShimmerEffect();
  }

  const filteredData = filterKeys[0] === "" 
      ? allPokemonData // No filter; show all
      : allPokemonData.filter(pokemon => filterKeys.every(key => pokemon.includes(key)));

  renderPokemon(filteredData); // Load all filtered results at once
  document.getElementById("amountCaught3").textContent = document.getElementsByClassName('show').length;
  progressBar.textContent = `${document.getElementsByClassName('show').length} Pokémon displayed.`;
  document.getElementById("amountCaught2").textContent = allPokemonData.length;
  document.getElementById("amountCaught").textContent = state.pkmnCaught;
}

// Update the active class for filter buttons
function updateActiveFilterButtons() {
  const filterButtons = document.querySelectorAll("#filterButtons .btn, #filterButtons .altbtn");

  filterButtons.forEach(button => {
      const buttonKey = button.getAttribute("data-filter"); // Each button should have a data-filter attribute that matches filter keys

      // Add "active" class if button's filter key is active, remove it otherwise
      if (filterKeys.includes(buttonKey)) {
          button.classList.add("active");
      } else {
          button.classList.remove("active");
      }
  });
}

// Toggle filter key presence and handle "Show All"
function toggleFilterKey(key) {
    if (key === "all") {
        filterKeys = [""]; // Reset to show all if "Show All" is selected
    } else {
        // Toggle the filter key
        if (!filterKeys.includes(key)) {
            filterKeys.push(key);
        } else {
            filterKeys = filterKeys.filter(item => item !== key);
        }
    }
    return filterKeys;
}

// Render Pokémon by appending new items to existing content without replacing it
function renderPokemon(pokemonArray) {
  removeShimmerEffect(); // Ensure shimmer effect is cleared before rendering

  const fragment = document.createDocumentFragment();

  pokemonArray.forEach(htmlString => {
      if (htmlString) {
          const pokemonElement = document.createElement("div");
          pokemonElement.innerHTML = htmlString.trim();

          const card = pokemonElement.firstElementChild;
          if (card) {
              card.classList.add("show");
              fragment.appendChild(card);
              //console.log("Appending Pokémon card to fragment:", card);
          } else {
              console.error("Failed to append card; no element found in HTML:", htmlString);
          }
      } else {
          console.error("Empty or invalid HTML string:", htmlString);
      }
  });

  if (fragment.children.length > 0) {
      //console.log("Appending fragment to pokedexContainer without clearing");
      pokedexContainer.appendChild(fragment);
      progressBar.textContent = "Loaded!";
      progressBar.style.opacity = "0";
  } else {
      console.error("Fragment is empty, no cards to append");
  }
}

// Real-time search filter for Pokémon within displayed results
function textFilterFunction() {
    let input = searchInput.value.toUpperCase();
    let items = pokedexContainer.getElementsByClassName("column"); // Ensure this targets the correct elements

    Array.from(items).forEach(item => {
        const txtValue = item.textContent || item.innerText;
        if (item.classList.contains("show")) { // Only apply search filter to visible items
            item.style.display = txtValue.toUpperCase().includes(input) ? "" : "none";
        }
    });
}

// Add event listener for real-time search filtering
searchInput.addEventListener("input", textFilterFunction);

// Update session storage with Pokémon data (for faster reloads)
function updateSessionStorage() {
    sessionStorage.setItem("allPokemonData", JSON.stringify(allPokemonData));
}

// Load Pokémon data from session or fetch if needed
async function loadAllFromList() {
    showShimmerEffect(); // Show shimmer while checking data

    if (!checkACookieExists("cookies")) {
        pokedexContainer.innerHTML = "Cookies required to load Pokédex.";
        return;
    }

    let sessionData = sessionStorage.getItem("allPokemonData");

    if (sessionData) {
        allPokemonData = JSON.parse(sessionData);
    } else {
        await fetchAllPokemonData();
        updateSessionStorage();
    }

    loadAllPokemon();
}

// Sort Pokémon entries on load (if sorting is needed)
function sortOnLoad() {
    const main = document.getElementById("pokedex");

    Array.from(main.children)
        .sort((a, b) => {
            const idA = parseIdAndSuffix(a.id);
            const idB = parseIdAndSuffix(b.id);

            // Compare the base IDs first (numerically)
            if (idA.base !== idB.base) {
                return idA.base - idB.base;
            }

            // Sort normal versions before alternate forms and shiny versions
            if (idA.suffix === "" && idB.suffix !== "") return -1;
            if (idA.suffix !== "" && idB.suffix === "") return 1;

            // Sort shiny versions after normal or alternate forms
            if (idA.suffix === "shiny" && idB.suffix !== "shiny") return 1;
            if (idB.suffix === "shiny" && idA.suffix !== "shiny") return -1;

            // If both have suffixes (e.g., "-1", "-2"), sort numerically by suffix
            return idA.suffix.localeCompare(idB.suffix, 'en', { numeric: true });
        })
        .forEach(elem => main.appendChild(elem));

    // Update counts and filter after sorting
    filterSelection("all");
}

// Helper function to parse the base ID and suffix// Helper function to parse the base ID and suffix
function parseIdAndSuffix(id) {
    // Remove non-numeric prefix (e.g., "N") before parsing
    const cleanedId = id ? id.replace(/^\D+/g, '') : null; // Remove any leading non-digits

    const match = cleanedId ? cleanedId.match(/^(\d+)(-\d+|shiny)?$/) : null;
    
    if (!match) {
        console.warn("Invalid ID format:", id); // Log a warning if the ID is invalid
        return { base: null, suffix: "" };
    }

    return {
        base: parseInt(match[1], 10),               // Base ID as integer
        suffix: match[2] ? match[2] : ""            // Suffix (e.g., "-1", "-2", "shiny") or empty for main forms
    };
}

// Helper function to pause for a given time
const sleep = (time) => new Promise((resolve) => setTimeout(resolve, time));

// Fetch the selected generations
function getSelectedGenerations() {
    const checkboxes = document.querySelectorAll(".genCheckbox");
    const selectedGenerations = [];
    checkboxes.forEach(checkbox => {
        if (checkbox.checked) {
            selectedGenerations.push(parseInt(checkbox.value));
        }
    });
    console.log("Selected generations:", selectedGenerations); // Debugging line
    return selectedGenerations;
}

// Filter function to apply generation-based filtering
function filterByGeneration() {
    const selectedGenerations = getSelectedGenerations();
    console.log("Active Generations:", selectedGenerations); // Debugging line

    const pokemonCards = document.querySelectorAll(".pokemon-card"); // Adjust selector if needed

    Array.from(pokemonCards).forEach(card => {
        const { base: id } = parseIdAndSuffix(card.id);
        if (id === null) {
            console.warn("Skipping card due to invalid ID:", card); // Debugging line
            return; // Skip cards with invalid or missing IDs
        }

        const name = card.getAttribute("data-name") || ""; // Ensure data-name attribute is set for forms
        const generation = getGenerationForId(id, name);

        // Debugging: Log each card's decision to be shown or hidden
        if (selectedGenerations.includes(generation)) {
            card.style.display = ""; // Show card if generation is selected
            console.log(`Showing card for ${name} (ID: ${id}, Gen: ${generation})`);
        } else {
            card.style.display = "none"; // Hide card if generation is not selected
            console.log(`Hiding card for ${name} (ID: ${id}, Gen: ${generation})`);
        }
    });
}

// Determine generation for Pokémon based on ID and special forms
function getGenerationForId(id, name) {
    for (const [gen, range] of Object.entries(generationRanges)) {
        if (id >= range[0] && id <= range[1]) {
            console.log(`ID: ${id}, Gen: ${gen}`); // Debugging line
            return parseInt(gen);
        }
    }
    // Special handling for forms
    if (name.includes("Hisuian")) {
        console.log(`ID: ${id}, Form: Hisuian, Gen: ${specialForms.Hisuian}`); // Debugging line
        return specialForms.Hisuian;
    }
    if (name.includes("Alolan")) {
        console.log(`ID: ${id}, Form: Alolan, Gen: ${specialForms.Alolan}`); // Debugging line
        return specialForms.Alolan;
    }
    console.warn("No generation found for ID:", id, "Name:", name); // Debug if no generation found
    return null; // Return null if no generation is matched
}

// Attach the filter function to checkboxes
// Attach the filter function to checkboxes
// Ensure each generation checkbox has an event listener
document.querySelectorAll(".genCheckbox").forEach(checkbox => {
    checkbox.addEventListener("change", () => {
        console.log(`Checkbox for Gen ${checkbox.value} changed to: ${checkbox.checked}`); // Debugging
        filterSelection("generation"); // Call filterSelection when generation filter changes
    });
});;

// Toggle the generation dropdown open/close on click
document.getElementById("generationDropdown").addEventListener("click", function() {
    const content = document.querySelector(".generationContent");
    content.style.display = content.style.display === "block" ? "none" : "block";
});

// Close the dropdown if clicked outside
document.addEventListener("click", function(event) {
    const dropdown = document.getElementById("generationDropdown");
    const content = document.querySelector(".generationContent");
    if (!dropdown.contains(event.target)) {
        content.style.display = "none";
    }
});

// {
// function filterSelection(filterKeyToAdd) {
//   var x, i;
//   x = document.getElementsByClassName("filtered");
//   if (filterKeyToAdd == "all"){
//     filterKeys = [""]
//   } else {
//     if(!filterKeys.includes(filterKeyToAdd)){
//       filterKeys.push(filterKeyToAdd);
//     } else {
//       //Remove it
//       for( var i = 0; i < filterKeys.length; i++){ 
//         if ( filterKeys[i] === filterKeyToAdd) { 
//           filterKeys.splice(i, 1);
//         }
//       }
//     }
    
//   }
//   // Add the "show" class (display:block) to the filtered elements, and remove the "show" class from the elements that are not selected
//   for (i = 0; i < x.length; i++) {
//     w3RemoveClass(x[i], "show");
//     show = true;
//     for(var n = 0; n < filterKeys.length; n++) {
//       if (x[i].className.indexOf(filterKeys[n]) > -1) continue;
//       show = false;
//     }
//     if(show) {
//       w3AddClass(x[i], "show")
//     }
    
    
//   }
//   document.getElementById("amountCaught3").textContent = document.getElementsByClassName('show').length
// }

// // Show filtered elements
// function w3AddClass(element, name) {
//   var i, arr1, arr2;
//   arr1 = element.className.split(" ");
//   arr2 = name.split(" ");
//   for (i = 0; i < arr2.length; i++) {
//     if (arr1.indexOf(arr2[i]) == -1) {
//       element.className += " " + arr2[i];
//     }
//   }
// }

// // Hide elements that are not selected
// function w3RemoveClass(element, name) {
//   var i, arr1, arr2;
//   arr1 = element.className.split(" ");
//   arr2 = name.split(" ");
//   for (i = 0; i < arr2.length; i++) {
//     while (arr1.indexOf(arr2[i]) > -1) {
//       arr1.splice(arr1.indexOf(arr2[i]), 1);
//     }
//   }
//   element.className = arr1.join(" ");
// }

// // Add active class to the current control button (highlight it)
// var btnContainer = document.getElementById("filterButtons");
// var btns = btnContainer.getElementsByClassName("btn");
// var typecard = document.getElementById("typedropdown")
// for (var i = 0; i < btns.length; i++) {
//   btns[i].addEventListener("click", function() {
//     if(this.id == "filterAllBtn") {
//           var current = document.getElementsByClassName("active");
//           while(current.length > 0) {
//             current[0].className = current[0].className.replace(" active", "");
//             typecard.className = "altbtn typedropdown"
//           }
          
//           this.className += " active";
//     } else {
//           //Remove from "All"
//           this.classList.toggle("active");
//           if(document.getElementsByClassName("active").length == 0) {
//             document.getElementById("filterAllBtn").className = "btn active"
//             typecard.className = "altbtn typedropdown"
//           } else {
//             document.getElementById("filterAllBtn").className = "btn"
//             if(this.classList.contains("typecard2")) {
//               typecard.className = "altbtn typedropdown altactive"
//             }
//           }
          
//     }
//   });
// }



// function textFilterFunction() {
//   var input, filter, ul, li, a, i;
//   input = document.getElementById("searchInput");
//   filter = input.value.toUpperCase();
//   div = document.getElementById("pokedex");
//   a = div.getElementsByTagName("a");
//   for (i = 0; i < a.length; i++) {
//     txtValue = a[i].textContent || a[i].innerText;
//     if (txtValue.toUpperCase().indexOf(filter) > -1) {
//       a[i].style.display = "";
//     } else {
//       a[i].style.display = "none";
//     }
//   }
// }


// async function loadAllFromList(){
//   pokedex.innerHTML = "";

//   if(!checkACookieExists("cookies")) {
//     pokedex.innerHTML = "Vi trenger tilgang til Cookies for å laste inn pokedexen din.";
//     return;
//   }

//   let sessionDex = sessionStorage.getItem("sessionDex");
//   let sessionUsedArray = JSON.parse(sessionStorage.getItem("sessionUsedArray"));

//   let fetchFromArray =  state.pkmnList.map((x) => x);

//   let intersection = [];
//   if(sessionUsedArray != null) {
//     intersection = getDifference(fetchFromArray, sessionUsedArray);
//   }
  
//   if(sessionUsedArray != null && sessionDex != null && sessionUsedArray <= state.pkmnList && intersection.length < 250) {
//     progressBar.textContent = "Oppdaterer " + intersection.length + " pokemon, og laster inn " + state.pkmnList.length + " elementer fra minnet.";
//     await sleep(100);
//     pokedex.innerHTML = sessionDex;

//     for(var i = 0; i < intersection.length; i++) {
//       loadFromList(intersection[i], true, false,false);
//     }

//   } else {
    
//     let fetchFrom = [...new Set(fetchFromArray)];

//     var returned = [];
//     for (var i = 0; i < fetchFrom.length; i++) {
//       //console.log("Loading #" + i + " of amount: " + fetchFrom.length)
//       returned.push(loadFromList(fetchFrom[i],true, false,true));
//       progressBar.textContent = "Laster inn (1/2): " + i + "/" + fetchFrom.length;
//       await sleep(1);
//     }

//     await addAllToInnerHTML(returned);
//   }

//   sessionStorage.setItem("sessionUsedArray", JSON.stringify(state.pkmnList));
//   let dexString = pokedex.innerHTML.replace(/(\r\n|\n|\r)/gm, "");
//   dexString = dexString.replaceAll(/^\s+|\s+$/g, "");
//   dexString = dexString.replaceAll('\t', '');
//   dexString = dexString.replaceAll(/ +(?= )/g,'');
//   sessionStorage.setItem("sessionDex", dexString);
//   sortOnLoad();
//   progressBar.textContent = "Lastet!";
//   progressBar.style.opacity = "0";
//   if(pokedex.innerHTML == "") {
//     pokedex.innerHTML = "Du har ingen pokemon, eller så skjedde det noe feil under innlastingen."
//     progressBar.textContent = "";
//   }
// }

// function getDifference(a, b) {
//   return [...b.reduce( (acc, v) => acc.set(v, (acc.get(v) || 0) - 1),
//     a.reduce( (acc, v) => acc.set(v, (acc.get(v) || 0) + 1), new Map() ) 
// )].reduce( (acc, [v, count]) => acc.concat(Array(Math.abs(count)).fill(v)), [] );
// }


// async function addAllToInnerHTML(array) {
//   progressBar.textContent = "Setter sammen...";
//   let size = array.length;
//   let string = "";
//   for (var i = 0; i < array.length; i++) {
//     string+= array[i];
//     progressBar.textContent = "Setter sammen (2/2): " + i + "/" + size;
//     await sleep(1);
//   }
//   pokedex.innerHTML = string;
// }}