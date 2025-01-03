// Save LocalStorage as an obfuscated file
function saveLocalStorageToFile() {
    // Retrieve all LocalStorage fields
    const localStorageData = {};
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        localStorageData[key] = localStorage.getItem(key);
    }

    // Convert to JSON and obfuscate with Base64
    const jsonData = JSON.stringify(localStorageData);
    const base64Data = btoa(jsonData);

    // Create a file with .pkmth extension
    const blob = new Blob([base64Data], { type: "application/octet-stream" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);

    let date = new Date();
    let dateString = toJSONLocal(date)
    if (!state.username || state.username.trim() === "" || /[ `!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/.test(state.username)) {
        state.username = "Username_Error";
        log("Renamed username. Format did not fit.");
    }
    let sanitizedUsername = state.username.replace(/[^a-zA-Z0-9_-]/g, "");
    let sanitizedDateString = dateString.replace(/[^a-zA-Z0-9_-]/g, "");
    let filename = `${sanitizedUsername}_savefile_${sanitizedDateString}.pkmth`;    
    log("Filename: " + filename);

    a.download = filename;
    a.click();

    // Clean up the object URL
    URL.revokeObjectURL(a.href);
    snoozeBackupAlertThreeDays();
}

//Old download function
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
    try{saveLocalStorageToFile()} catch(e){ //previously: createSaveFile();
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

//Old & manual version.
function createSaveFile(){
    let date = new Date();
    let dateString = toJSONLocal(date)
    if (!state.username || state.username.trim() === "" || /[ `!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/.test(state.username)) {
        state.username = "Username_Error";
        log("Renamed username. Format did not fit.");
    }
    let sanitizedUsername = state.username.replace(/[^a-zA-Z0-9_-]/g, "");
    let sanitizedDateString = dateString.replace(/[^a-zA-Z0-9_-]/g, "");
    let filename = `${sanitizedUsername}_savefile_${sanitizedDateString}.pkmth`;    
    log("Filename: " + filename);
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
    content+= "*SPLIT*"
    const storedCodes = JSON.parse(localStorage.getItem('redeemedCodes'));
    if (storedCodes) {
        const storedCodesString = JSON.stringify(storedCodes);
        content +=storedCodesString;
    }

    content = btoa(content);
    log("Attempting to download file... If nothing happens, please check device permissions!")
    download(filename,content);
    //console.log(atob(content));
    snoozeBackupAlertThreeDays();
}

function toJSONLocal (date) {
    var local = new Date(date);
    local.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    return local.toJSON().slice(0, 10);
}

function init(){
    document.getElementById('fileInput').addEventListener('change', handleFileSelect, false);
}

/** Old version
function handleFileSelect(event){
    const reader = new FileReader()
    reader.onload = loadLocalStorageFromFile;
    reader.readAsText(event.target.files[0])
} */

function handleFileSelect(event) {
    const reader = new FileReader();

    reader.onload = function (event) {
        const base64Data = event.target.result;
        try {
            // Attempt to decode Base64 and parse JSON
            const jsonData = atob(base64Data);
            const localStorageData = JSON.parse(jsonData);

            // Restore LocalStorage fields
            for (const [key, value] of Object.entries(localStorageData)) {
                localStorage.setItem(key, value);
            }

            loadAll();
            triggerAchievementOverlay("images/up-arrow.png", 
                "Dataen har blitt lastet inn! Bruker: " + state.username + " med " + state.pkmnCaught + " Pokémon");
            //alert("LocalStorage restored successfully!");
        } catch (jsonError) {
            console.warn("Prøver å laste inn dataen din med en gammel versjon...", jsonError);
            try {
                handleOldFileLoad(event);
                alert("Dataen din ble lastet inn ved bruk av den gamle versjonen!");
            } catch (legacyError) {
                console.error("Error restoring LocalStorage data:", legacyError);
                alert("Det oppstod en feil når vi prøvde å laste inn dataen din... Kontakt PokeMorten og send inn filen din!");
            }
        }
    };

    reader.onerror = function () {
        console.error("Error reading the file:", reader.error);
        alert("Failed to read the file.");
    };

    // Read the file as a Base64 string
    reader.readAsText(event.target.files[0]);
}
  
function handleOldFileLoad(event){
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

    if (!Array.isArray(uploadArray) || uploadArray.length < 2) {
        log("Error! The file we got had an incorrect file syntax.");
        toast("Filen du lastet opp er satt sammen på feil måte.", true);
        return;
    }
    
    if (!Array.isArray(stateText) || stateText.length < 13) {
        log("Error! State data is malformed.");
        toast("Filen din har feil format på State-data.", true);
        return;
    }
    
    if (!Array.isArray(shopText) || shopText.length < 10) {
        log("Error! Shop data is malformed.");
        toast("Filen din har feil format på Shop-data.", true);
        return;
    }

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
    //SPLIT
    shopOptions.background = shopText[0];
    shopOptions.playerIcon = shopText[1];
    shopOptions.boughtBackgrounds = shopText[2].split(',');
    shopOptions.boughtPlayerIcons = shopText[3].split(',');
    shopOptions.claimedSecrets = shopText[4].split(',');
    shopOptions.shinyLevel = shopText[5];
    shopOptions.mythicLevel = shopText[6];
    shopOptions.legendLevel = shopText[7];
    shopOptions.specialLevel = shopText[8];
    shopOptions.coinLevel = shopText[9];
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
      if (loadedAchievementString && loadedAchievementString.trim() !== "") {		
        try {
          const achievements = JSON.parse(loadedAchievementString); // Parse the string into an object
          localStorage.setItem('badges', JSON.stringify(achievements)); 
        } catch (error) {
          console.error("Error parsing loadedAchievementString:", error);
        }
      }
    }
  
  if(uploadArray[4] != null) {
    log("loading code stuff :)");
    const loadedCodesString = uploadArray[4];
    log(loadedCodesString);
    if (loadedCodesString && loadedCodesString.trim() !== "") {
      try {
        const codes = JSON.parse(loadedCodesString);
        localStorage.setItem('redeemedCodes', JSON.stringify(codes));
      } catch (error) {
        console.error("Error parsing loadedCodesString:", error);
      }
    }
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
    triggerAchievementOverlay("images/up-arrow.png", 
        "Dataen har blitt lastet inn! Bruker: " + state.username + " med " + state.pkmnCaught + " Pokémon");
    snoozeBackupAlertThreeDays();

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
 * 4 - claimedSecrets
 * 5 - shinyLevel
 * 6 - mythicLevel 
 * 7 - legendLevel 
 * 8 - specialLevel
 * 9 - coinLevel
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
    for(i = 1; i < 100; i++) {
        console.log(i);
        promises.push(
            axios
            .get(`https://pokeapi.co/api/v2/pokemon-species//${i}`, {
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
