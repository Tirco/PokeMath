function download(filename, text) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);
  
    element.style.display = 'none';
    document.body.appendChild(element);
  
    element.click();
  
    document.body.removeChild(element);
}

function saveFileDLButton(){
    try{createSaveFile()} catch(e){
        const toast = new Toast({
            text: e,
            position: "top-right",
            pauseOnHover: true,
            pauseOnFocusLoss: true,
            canClose: true,
            badToast: true,
        })
    }
}

function createSaveFile(){
    let date = new Date();
    let dateString = toJSONLocal(date)
    var format = /[ `!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/;
    if(format.test(state.username)) {
        state.username = "Username_Error"
        log("Renamed username.");
    }
    let filename = (state.username + "_savefile_" + dateString + ".pkmth");// + date.getDay + "." + date.getMonth + "." + date.getFullYear + "_" + date.getHours + ":" + date.getMinutes;
    console.log(filename);
    let content = ""

    //Loop through State
    let keys = Object.keys(state);
    keys.forEach((key, index) => {
        //console.log(`${key}: ${state[key]}`);
        content += `${state[key]}`+"|"
    });

    content+= "*SPLIT*"

    //Loop through Shop
    let shopKeys = Object.keys(shopOptions);
    shopKeys.forEach((key, index) => {
        console.log(`${key}: ${shopOptions[key]}`);
        content += `${shopOptions[key]}`+"|"
    });

    content+= "*SPLIT*"
    
    //Save xmas stuff
    xmasOpened = [];
    if(window.localStorage.getItem("xmasOpened") != null){
        xmasOpened = getStorageString('xmasOpened');
    }
    xmasYear = 2021
    if(window.localStorage.getItem("xmasYear") != null){
        xmasYear = getStorageInt('xmasYear');
    }
    content += xmasYear + "|" + xmasOpened;
    
    //Achi/Badge
    content+= "*SPLIT*"
    const storedAchievements = JSON.parse(localStorage.getItem('badges'));
    if (storedAchievements) {
        const achievementString = JSON.stringify(storedAchievements);
        content +=achievementString;
    }

    content = btoa(content);
    download(filename,content);
    //console.log(atob(content));
}

function toJSONLocal (date) {
    var local = new Date(date);
    local.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    return local.toJSON().slice(0, 10);
}

function init(){
    document.getElementById('fileInput').addEventListener('change', handleFileSelect, false);
}
  
function handleFileSelect(event){
    const reader = new FileReader()
    reader.onload = handleFileLoad;
    reader.readAsText(event.target.files[0])
}
  
function handleFileLoad(event){
    console.log(event);
    var uploadedText = atob(event.target.result);
    if(uploadedText == null || uploadedText.length == 0) {
        log("Error! no readable text found in file.")
        toast("Filen du lastet opp hadde ingenting vi kunne lese.", true);
        return;
    }
    // Let's check our result!
    let uploadArray = uploadedText.split("*SPLIT*");
    if(uploadArray.length < 2) {
        log("Error! The file we got had an incorrect file syntax")
        toast("Filen du lastet opp er satt sammen på feil måte.",true);
        return;
    }
    let stateText = uploadArray[0].split('|');
    let shopText = uploadArray[1].split('|');

    state.username = stateText[0];
    state.totalScore = stateText[1];
    state.score = stateText[2];
    state.wrongAnswers = stateText[3];
    state.streak = stateText[4];
    state.pkmnCaught = stateText[5];
    state.pkmnList = stateText[6].split(',');
    state.tier1Solved = stateText[7];
    state.tier2Solved = stateText[8];
    state.tier3Solved = stateText[9];
    state.tier4Solved = stateText[10];
    state.tier5Solved = stateText[11];
    state.customSolved = stateText[12];
    shopOptions.background = shopText[0];
    shopOptions.playerIcon = shopText[1];
    shopOptions.boughtBackgrounds = shopText[2].split(',');
    shopOptions.boughtPlayerIcons = shopText[3].split(',');
    shopOptions.shinyLevel = shopText[4];
    shopOptions.mythicLevel = shopText[5];
    shopOptions.legendLevel = shopText[6];
    shopOptions.specialLevel = shopText[7];
    shopOptions.coinLevel = shopText[8];
    window.localStorage.setItem('visitCounted','true');

    if(uploadArray[2] != null) {
        log("loading xmas stuff :)")
        let xmasSplit = uploadArray[2].split('|');
        window.localStorage.setItem('xmasYear',JSON.stringify(Number(xmasSplit[0])));
        let xmasOpenedArray = xmasSplit[1];
        window.localStorage.setItem('xmasOpened',JSON.stringify(xmasOpenedArray));
    }
    if(uploadArray[3] != null) {
        log("loading achievements stuff :)")
        const loadedAchievementString = uploadArray[3]; // Load this string from the text file
        const achievements = JSON.parse(loadedAchievementString); // Parse the string into an object
        localStorage.setItem('badges', JSON.stringify(achievements)); 
    }
    saveAll();
    loadAll();

    const toast = new Toast({
        text: "Dataen din har blitt lastet inn!",
        position: "top-right",
        pauseOnHover: true,
        pauseOnFocusLoss: true,
        canClose: true,
        badToast: false,
    })

    //Update stats on how many loaded.
    statCounter("hit","fileloads");

    //document.getElementById('fileContent').textContent = atob(event.target.result);
}

////////////////////////////////
/**
 * 0 - name
 * 1 - totalScore
 * 2 - score 
 * 3 - wrongAnswers 
 * 4 - streak 
 * 5 - pkmnCaught 
 * 6 - pkmnList
 * 7 - tier1Soved
 * 8 - tier2Solved
 * 9 - tier3Solved
 * 10 - tier4solved
 * 11 - tier5solved
 * 12 - customSolved
 * "*SPLIT*"
 * 0 - background
 * 1 - playericon
 * 2 - boughtBackgrounds
 * 3 - boughtPlayerIcons
 * 4 - shinyLevel
 * 5 - mythicLevel 
 * 6 - legendLevel 
 * 7 - specialLevel
 * 8 - coinLevel
 */
/**
 * let state = {
	username: "Ash",
	totalScore: 0,
	score: 0,
	wrongAnswers: 0,
	streak: 0,
  pkmnCaught: 0,
  pkmnList: new Array(),
  tier1Solved: 0,
  tier2Solved: 0,
  tier3Solved: 0,
  tier4Solved: 0,
  tier5Solved: 0,
  customSolved: 0
}

let shopOptions = {
  background: "",
  playerIcon: "",
  boughtBackgrounds: [],
  boughtPlayerIcons: [],
  shinyLevel: 1,
  mythicLevel: 0,
  legendLevel: 0,
  specialLevel: 0,
  coinLevel: 0
} */



//for internal use...
let dex = {0: {"name":"Error","types" : ["water","fire"]}}

function makeJsonFile() { 
    let s = "";

    let promises = [];
    let responses = [];
    for(i = 898; i < 1011; i++) {
        console.log(i);
        promises.push(
            axios
            .get(`https://pokeapi.co/api/v2/pokemon/${i}`, {
            timeout: 5000,
            })
            .then((res) => responses.push(res))
        ) //fetchResValues(res)
    }
    Promise.all(promises).then(() => 
        {
            for(var i = 1; i < responses.length; i++) {
                fetchResValues(responses[i-1],i);
                //Do something
            };
        }
    )
    //console.log("Dex is: " + dex)
    //download("pkmn.json",JSON.stringify(dex));
}

function donwloadJS(){
    download("pkmn.json",JSON.stringify(dex));
}

function fetchResValues(res,i) {
    let id = res.data["id"]
    let pkmnName = res.data["name"]
    let pkmnTypes = []
    res.data.types.forEach((type) => {
      pkmnTypes.push(type.type.name);
    })
    var pkmn = {"name" : pkmnName, "types" : pkmnTypes}
    console.log(id + " " + pkmn);
    dex[id] = pkmn;
    return(pkmn);
} 