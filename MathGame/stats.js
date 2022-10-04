async function getHitCounter(type, key, element){
    var xhr = new XMLHttpRequest();
    path = "https://api.countapi.xyz/" + type + "/pokemath.online/" + key;
    xhr.open("GET", path); //"https://api.countapi.xyz/hit/pokemath.online/test"
    xhr.responseType = "json";
    xhr.onload = function() {
        element.innerText =(`${this.response.value}`);
    }
    xhr.send();
}

async function call() {
    
    getHitCounter("info","test",document.getElementById("btnClicks"));
    getHitCounter("info","unicount",document.getElementById("uniCount"));
    //https://api.countapi.xyz/hit/pokemath.online/unicount
    
}