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

loadAllFromList();
sortOnLoad();

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