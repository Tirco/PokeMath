const progressBar = document.getElementById("dexLoadStatus");

var filterKeys = [""]
filterSelection("all")


function sortOnLoad() {
  var main = document.getElementById("pokedex");
  [].map.call( main.children, Object ).sort((a,b) => a.id.localeCompare(b.id,'en', {numeric: true})).forEach( function ( elem ) {
    main.appendChild( elem );
  });
  /**  [].map.call( main.children, Object ).sort( function ( a, b ) {
    return +a.id.match( /\d+/ ) - +b.id.match( /\d+/ );
  }).forEach( function ( elem ) {
    main.appendChild( elem );
  }); */

  //Update bottom text
  document.getElementById("amountCaught2").textContent = document.getElementsByClassName('card').length
  document.getElementById("amountCaught").textContent = state.pkmnCaught;
  filterSelection("all");
}

window.onload = function(){
  loadAllFromList(true);
}


function filterSelection(filterKeyToAdd) {
  var x, i;
  x = document.getElementsByClassName("filtered");
  if (filterKeyToAdd == "all"){
    filterKeys = [""]
  } else {
    if(!filterKeys.includes(filterKeyToAdd)){
      filterKeys.push(filterKeyToAdd);
    } else {
      //Remove it
      for( var i = 0; i < filterKeys.length; i++){ 
        if ( filterKeys[i] === filterKeyToAdd) { 
          filterKeys.splice(i, 1);
        }
      }
    }
    
  }
  // Add the "show" class (display:block) to the filtered elements, and remove the "show" class from the elements that are not selected
  for (i = 0; i < x.length; i++) {
    w3RemoveClass(x[i], "show");
    show = true;
    for(var n = 0; n < filterKeys.length; n++) {
      if (x[i].className.indexOf(filterKeys[n]) > -1) continue;
      show = false;
    }
    if(show) {
      w3AddClass(x[i], "show")
    }
    
    
  }
  document.getElementById("amountCaught3").textContent = document.getElementsByClassName('show').length
}

// Show filtered elements
function w3AddClass(element, name) {
  var i, arr1, arr2;
  arr1 = element.className.split(" ");
  arr2 = name.split(" ");
  for (i = 0; i < arr2.length; i++) {
    if (arr1.indexOf(arr2[i]) == -1) {
      element.className += " " + arr2[i];
    }
  }
}

// Hide elements that are not selected
function w3RemoveClass(element, name) {
  var i, arr1, arr2;
  arr1 = element.className.split(" ");
  arr2 = name.split(" ");
  for (i = 0; i < arr2.length; i++) {
    while (arr1.indexOf(arr2[i]) > -1) {
      arr1.splice(arr1.indexOf(arr2[i]), 1);
    }
  }
  element.className = arr1.join(" ");
}

// Add active class to the current control button (highlight it)
var btnContainer = document.getElementById("filterButtons");
var btns = btnContainer.getElementsByClassName("btn");
var typecard = document.getElementById("typedropdown")
for (var i = 0; i < btns.length; i++) {
  btns[i].addEventListener("click", function() {
    if(this.id == "filterAllBtn") {
          var current = document.getElementsByClassName("active");
          while(current.length > 0) {
            current[0].className = current[0].className.replace(" active", "");
            typecard.className = "altbtn typedropdown"
          }
          
          this.className += " active";
    } else {
          //Remove from "All"
          this.classList.toggle("active");
          if(document.getElementsByClassName("active").length == 0) {
            document.getElementById("filterAllBtn").className = "btn active"
            typecard.className = "altbtn typedropdown"
          } else {
            document.getElementById("filterAllBtn").className = "btn"
            if(this.classList.contains("typecard2")) {
              typecard.className = "altbtn typedropdown altactive"
            }
          }
          
    }
  });
}



function textFilterFunction() {
  var input, filter, ul, li, a, i;
  input = document.getElementById("searchInput");
  filter = input.value.toUpperCase();
  div = document.getElementById("pokedex");
  a = div.getElementsByTagName("a");
  for (i = 0; i < a.length; i++) {
    txtValue = a[i].textContent || a[i].innerText;
    if (txtValue.toUpperCase().indexOf(filter) > -1) {
      a[i].style.display = "";
    } else {
      a[i].style.display = "none";
    }
  }
}


async function loadAllFromList(){
  pokedex.innerHTML = "";

  if(!checkACookieExists("cookies")) {
    pokedex.innerHTML = "Vi trenger tilgang til Cookies for å laste inn pokedexen din.";
    return;
  }
  /*// Save data to sessionStorage
sessionStorage.setItem("key", "value");

// Get saved data from sessionStorage
let data = sessionStorage.getItem("key");

// Remove saved data from sessionStorage
sessionStorage.removeItem("key");

// Remove all saved data from sessionStorage
sessionStorage.clear();
*/
  let sessionDex = sessionStorage.getItem("sessionDex");
  let sessionUsedArray = JSON.parse(sessionStorage.getItem("sessionUsedArray"));


  let fetchFromArray =  state.pkmnList.map((x) => x);

  let intersection = [];
  if(sessionUsedArray != null) {
    intersection = getDifference(fetchFromArray, sessionUsedArray);
  }
  
  if(sessionUsedArray != null && sessionDex != null && sessionUsedArray <= state.pkmnList && intersection.length < 250) {
    progressBar.textContent = "Oppdaterer " + intersection.length + " pokemon, og laster inn " + state.pkmnList.length + " elementer fra minnet.";
    await sleep(100);
    pokedex.innerHTML = sessionDex;

    for(var i = 0; i < intersection.length; i++) {
      loadFromList(intersection[i], true, false,false);
    }

  } else {
    
    let fetchFrom = [...new Set(fetchFromArray)];

    var returned = [];
    for (var i = 0; i < fetchFrom.length; i++) {
      //console.log("Loading #" + i + " of amount: " + fetchFrom.length)
      returned.push(loadFromList(fetchFrom[i],true, false,true));
      progressBar.textContent = "Laster inn (1/2): " + i + "/" + fetchFrom.length;
      await sleep(1);
    }

    await addAllToInnerHTML(returned);
  }

  sessionStorage.setItem("sessionUsedArray", JSON.stringify(state.pkmnList));
  let dexString = pokedex.innerHTML.replace(/(\r\n|\n|\r)/gm, "");
  dexString = dexString.replaceAll(/^\s+|\s+$/g, "");
  dexString = dexString.replaceAll('\t', '');
  dexString = dexString.replaceAll(/ +(?= )/g,'');
  sessionStorage.setItem("sessionDex", dexString);
  sortOnLoad();
  progressBar.textContent = "Lastet!";
  progressBar.style.opacity = "0";
  if(pokedex.innerHTML == "") {
    pokedex.innerHTML = "Du har ingen pokemon!"
    progressBar.textContent = "";
  }
}

function getDifference(a, b) {
  return [...b.reduce( (acc, v) => acc.set(v, (acc.get(v) || 0) - 1),
    a.reduce( (acc, v) => acc.set(v, (acc.get(v) || 0) + 1), new Map() ) 
)].reduce( (acc, [v, count]) => acc.concat(Array(Math.abs(count)).fill(v)), [] );
}


const sleep = (time) => {
  return new Promise((resolve) => {
    return setTimeout(function () {
      resolve();
    }, time)
  })
}


async function addAllToInnerHTML(array) {
  progressBar.textContent = "Setter sammen...";
  let size = array.length;
  let string = "";
  for (var i = 0; i < array.length; i++) {
    string+= array[i];
    progressBar.textContent = "Setter sammen (2/2): " + i + "/" + size;
    await sleep(1);
  }
  pokedex.innerHTML = string;
}