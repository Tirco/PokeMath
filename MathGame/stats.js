async function getHitCounter(type, key, element){
    var xhr = new XMLHttpRequest();
    path = "https://api.countapi.xyz/" + type + "/pokemath.online/" + key;
    xhr.open("GET", path); //"https://api.countapi.xyz/hit/pokemath.online/test"
    xhr.responseType = "json";
    xhr.onload = function() {
        //element.innerHTML = 
        //element.style.setProperty("--countervalue", );
        
        jQuery({ Counter: Number(element.text) }).animate({
            Counter: this.response.value
          }, {
            duration: 8000,
            easing: 'swing',
            step: function() {
              element.text = (Math.ceil(this.Counter));
            }  
          }
        );
        
        //incEltNbr(element, );
        //console.log("Ran for " + key);
    }
    xhr.send();
}

async function call() {
    
    getHitCounter("info","test",document.getElementById("btnClicks"));
    getHitCounter("info","unicount",document.getElementById("uniCount"));
    getHitCounter("info","visits",document.getElementById("visits"));
    getHitCounter("info","statsVisited",document.getElementById("statLoads"));
    getHitCounter("info","mathVisited",document.getElementById("mathLoads"));
    getHitCounter("info","shopVisited",document.getElementById("shopLoads"));
    getHitCounter("info","aboutVisited",document.getElementById("aboutLoads"));
    getHitCounter("info","dexVisited",document.getElementById("dexLoads"));
    getHitCounter("info","coinsEarned",document.getElementById("coinsEarned"));
    getHitCounter("info","coinsSpendt",document.getElementById("coinsSpendt")); //Jaja, skrivefeil...
    getHitCounter("info","customizerVisited",document.getElementById("customizerLoads"));
    getHitCounter("info","pokemonCaught",document.getElementById("pokemonCaught"));
    getHitCounter("info","tasksSolved",document.getElementById("tasksSolved"));
    getHitCounter("info","wrongAnswers",document.getElementById("wrongAnswers"));
    getHitCounter("info","filesaves",document.getElementById("fileSaves"));
    getHitCounter("info","fileloads",document.getElementById("fileLoads"));
    getHitCounter("info","xmasVisited",document.getElementById("xmasVisited"));
    getHitCounter("info","xmasHatchesOpened",document.getElementById("xmasHatchesOpened"));
    getHitCounter("info","xmasPresentOpened",document.getElementById("xmasPresentOpened"));
    getHitCounter("info","allXmasHatchesOpened",document.getElementById("allXmasHatchesOpened"));
    //https://api.countapi.xyz/hit/pokemath.online/unicount
    //https://api.countapi.xyz/create?namespace=pokemath.online&key=statsVisited&update_lowerbound=0
    //https://api.countapi.xyz/create?namespace=pokemath.online&key=mathVisited&update_lowerbound=0
    //https://api.countapi.xyz/create?namespace=pokemath.online&key=shopVisited&update_lowerbound=0
    //https://api.countapi.xyz/create?namespace=pokemath.online&key=aboutVisited&update_lowerbound=0
    //https://api.countapi.xyz/create?namespace=pokemath.online&key=coinsEarned&update_lowerbound=0&update_upperbound=9999999&enable_reset=1
    
}

call();

setInterval(function(){
    call()
}, 16000)

async function btnCall() {
    getHitCounter("hit","test",document.getElementById("btnClicks"));
}
