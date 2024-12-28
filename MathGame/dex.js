// HTML Elements
const progressBar = document.getElementById("dexLoadStatus");
const pokedexContainer = document.getElementById("pokedex");
const searchInput = document.getElementById("searchInput"); // Ensure this ID matches your HTML
let filteredPokemonData = []; // Store only filtered Pokémon data

let offset = 0;
const limit = 2000; // Number of Pokémon to load initially
let allPokemonData = []; // Store all Pokémon data for filtering
var filterKeys = ["gen-1","gen-2","gen-3","gen-4","gen-5","gen-6","gen-7","gen-8","gen-9","gen-0"];

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
  initializeGenerationFilter();
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


function loadAllPokemon() {
    const filteredData = filterKeys[0] === ""
        ? allPokemonData // No filter; show all
        : allPokemonData.filter(pokemon => {
            if (!pokemon || typeof pokemon !== "string") {
                console.warn("Skipping corrupted Pokémon data:", pokemon);
                return false; // Skip invalid or undefined entries
            }

            const generationFilters = filterKeys.filter(key => key.startsWith("gen-"));
            const otherFilters = filterKeys.filter(key => !key.startsWith("gen-"));

            // Match generations using "some", other filters with "every"
            const matchesGeneration = generationFilters.some(key => pokemon.includes(key));
            const matchesOther = otherFilters.length === 0 || otherFilters.every(key => pokemon.includes(key));

            return matchesGeneration && matchesOther;
        });

    renderPokemon(filteredData); // Render all at once
}


function filterSelection(filterKeyToAdd) {
    offset = 0; // Reset offset for filtered data
  
    if (filterKeyToAdd === "all") {
        filterKeys = ["gen-1","gen-2","gen-3","gen-4","gen-5","gen-6","gen-7","gen-8","gen-9","gen-0"]; // Reset to include all generations
          // Ensure all generation checkboxes are checked
          const checkboxes = document.querySelectorAll(".genCheckbox");
          checkboxes.forEach(checkbox => checkbox.checked = true);
    } else {
        filterKeys = toggleFilterKey(filterKeyToAdd);
    }
  
    if (filterKeys.length > 1 && filterKeys.includes("")) {
        filterKeys = filterKeys.filter(key => key !== "");
    }
  
    if (filterKeys.length === 0) {
        filterKeys = ["gen-1","gen-2","gen-3","gen-4","gen-5","gen-6","gen-7","gen-8","gen-9","gen-0"]; // Default to all generations
    }
  
    // Update the button states based on active filters
    updateActiveFilterButtons();
  
    // Clear only if applying a specific filter (not for "Show All")
    if (filterKeys[0] !== "") {
        pokedexContainer.innerHTML = "";
        showShimmerEffect();
    }
    let filteredData = []; // Declare variable outside the try block
    try {
      filteredData = filterKeys[0] === "" 
          ? allPokemonData // No filter; show all
          : allPokemonData.filter(pokemon => {
                try {
                    const generationFilters = filterKeys.filter(key => key.startsWith("gen-"));
                    const otherFilters = filterKeys.filter(key => !key.startsWith("gen-"));
  
                    // Match generations using "some", other filters with "every"
                    const matchesGeneration = generationFilters.some(key => pokemon.includes(key));
                    const matchesOther = otherFilters.length === 0 || otherFilters.every(key => pokemon.includes(key));
  
                    return matchesGeneration && matchesOther;
                } catch (error) {
                    if (error instanceof TypeError) {
                        console.error("Skipping corrupted Pokémon data:", pokemon, error);
                        log("TypeError: Corrupted data detected and skipped.");
                    } else {
                        console.error("Unexpected error during filtering:", error);
                    }
                    return false; // Skip this iteration
                }
          });
  } catch (error) {
      console.error("An unexpected error occurred in filterSelection:", error);
      log("Unexpected error occurred in filtering. Check data integrity.");
      const toast = new Toast({
          text: `En uventet feil oppstod under filtrering av Pokémon.`,
          position: "top-right",
          pauseOnHover: true,
          pauseOnFocusLoss: true,
          canClose: true,
          badToast: true,
      });
      return; // Exit the function if an unexpected error occurs
  }
  
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
        filterKeys = ["gen-1","gen-2","gen-3","gen-4","gen-5","gen-6","gen-7","gen-8","gen-9","gen-0"]; // Reset to all generations if "Show All" is selected
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

// Get selected generations based on checkbox state
function getSelectedGenerations() {
    const checkboxes = document.querySelectorAll(".genCheckbox");

    const selectedGenerations = Array.from(checkboxes)
        .filter(checkbox => checkbox.checked) // Only include checked boxes
        .map(checkbox => checkbox.value); // Convert the values to integers

    return selectedGenerations;
}

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

// Add generation checkbox listeners
function initializeGenerationFilter() {
    const checkboxes = document.querySelectorAll(".genCheckbox");

    checkboxes.forEach(checkbox => {
        checkbox.addEventListener("change", () => {
            const generationKey = `${checkbox.value}`;

            if (checkbox.checked) {
                // Add the generation key to filterKeys
                if (!filterKeys.includes(generationKey)) {
                    filterKeys.push(generationKey);
                }
            } else {
                // Remove the generation key from filterKeys
                filterKeys = filterKeys.filter(key => key !== generationKey);
            }

            // Trigger the existing filterSelection function
            filterSelection("");
        });
    });
}