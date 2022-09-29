async function getHitCounter(type, key){
    var xhr = new XMLHttpRequest();
    path = "https://api.countapi.xyz/" + type + "/pokemath.online/" + key;
    xhr.open("GET", path); //"https://api.countapi.xyz/hit/pokemath.online/test"
    xhr.responseType = "json";
    xhr.onload = function() {
        alert(`This button has been clicked ${this.response.value} times!`);
    }
    xhr.send();
}

async function call() {
    getHitCounter("info","test")
    
}