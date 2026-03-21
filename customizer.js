var barcode = document.getElementById("barcode")
var additionCheck = document.getElementById("additioncheck");
var addSection = document.getElementById("addSection");
var addMinSelect = document.getElementById("addMinSel")
var addMaxSelect = document.getElementById("addMaxSel")
var addMinSelectB = document.getElementById("addMinSelB")
var addMaxSelectB = document.getElementById("addMaxSelB")
var addDecSelect = document.getElementById("addDecSel")


var subtractionCheck = document.getElementById("subtractioncheck");
var subSection = document.getElementById("subSection");
var subMinSelect = document.getElementById("subMinSel");
var subMaxSelect = document.getElementById("subMaxSel");
var subMinSelectB = document.getElementById("subMinSelB");
var subMaxSelectB = document.getElementById("subMaxSelB");
var subDecSelect = document.getElementById("subDecSel");
var subtractionallownegative = document.getElementById("subtractionallownegative");

var multiplicationCheck = document.getElementById("multiplicationcheck");
var mulSection = document.getElementById("mulSection");
var mulMinSelectA = document.getElementById("mulMinSelA");
var mulMaxSelectA = document.getElementById("mulMaxSelA");
var mulDecSelect = document.getElementById("mulDecSel");
var mulMinSelectB = document.getElementById("mulMinSelB");
var mulMaxSelectB = document.getElementById("mulMaxSelB");


var divisionCheck = document.getElementById("divisioncheck");
var divSectionSelect = document.getElementById("divSection");
var divMinDivSelect = document.getElementById("divMinDivSel");
var divMaxDivSelect = document.getElementById("divMaxDivSel");
var divMinKvoSelect = document.getElementById("divMinKvoSel");
var divMaxKvoSelect = document.getElementById("divMaxKvoSel");
var divDecSelect = document.getElementById("divDecSel");

console.log("Test")

additionCheck.onchange = function() {
    if(this.checked){
        addSection.style.display = "";
  } else{
        addSection.style.display = "none";
  }
}
subtractionCheck.onchange = function() {
    if(this.checked){
        subSection.style.display = "";
  } else{
        subSection.style.display = "none";
  }
}
multiplicationCheck.onchange = function() {
    if(this.checked){
        mulSection.style.display = "";
  } else{
        mulSection.style.display = "none";
  }
}
divisionCheck.onchange = function() {
    if(this.checked){
        divSection.style.display = "";
  } else{
        divSection.style.display = "none";
  }
}

function handleCopy(){
    var text = "https://www.pokemath.online" + fetchURL();
    navigator.clipboard.writeText(text)
    const toast = new Toast({
        text: "Lenken ble kopiert!",
        position: "top-right",
        pauseOnHover: true,
        pauseOnFocusLoss: true,
        canClose: true,
        badToast: false,
      })
}

function handleUse(){
    window.location.href = "." + fetchURL();
}


function loadValues(url) {
    let params = new URLSearchParams(url);

		if(params.get("san" == null || params.get("san") == "f")) {
			subtractionallownegative.checked = false;
		} else {
            subtractionallownegative.checked = true;
        }
        
        if(params.get("add") == "t") {
            additionCheck.checked = true;
            addSection.style.display = "";
            checkAndUpdateValue(params, "amin", addMinSelect);
            checkAndUpdateValue(params, "amax", addMaxSelect);
            checkAndUpdateValue(params, "aminb", addMinSelectB);
            checkAndUpdateValue(params, "amaxb", addMaxSelectB);
            checkAndUpdateValue(params, "adec", addDecSelect);
        } else {
            additionCheck.checked = false;
            addSection.style.display = "none";
        }
        if(params.get("sub") == "t") {
            subtractionCheck.checked = true;
            subSection.style.display = "";
            checkAndUpdateValue(params, "smin", subMinSelect);
            checkAndUpdateValue(params, "smax", subMaxSelect);
            checkAndUpdateValue(params, "sminb", subMinSelectB);
            checkAndUpdateValue(params, "smaxb", subMaxSelectB);
            checkAndUpdateValue(params, "sdec", subDecSelect);
        } else {
            subtractionCheck.checked = false;
            subSection.style.display = "none";
        }
        if(params.get("mul") == "t") {
            multiplicationCheck.checked = true;
            mulSection.style.display = "";
            checkAndUpdateValue(params, "mumina", mulMinSelectA);
            checkAndUpdateValue(params, "mumaxa", mulMaxSelectA);
            checkAndUpdateValue(params, "mudec", mulDecSelect);
            checkAndUpdateValue(params, "muminb", mulMinSelectB);
            checkAndUpdateValue(params, "mumaxb", mulMaxSelectB);
        } else {
            multiplicationCheck.checked = false;
            mulSection.style.display = "none";
        }
        if(params.get("div") == "t") {
            divisionCheck.checked = true;
            divSection.style.display = "";
            checkAndUpdateValue(params, "dmin", divMinDivSelect);
            checkAndUpdateValue(params, "dmax", divMaxDivSelect);
            checkAndUpdateValue(params, "dmmin", divMinKvoSelect);
            checkAndUpdateValue(params, "dmmax", divMaxKvoSelect);
            checkAndUpdateValue(params, "ddec", divDecSelect);
        } else {
            divisionCheck.checked = false;
            divSection.style.display = "none";
        }
}

function checkAndUpdateValue(params, value, element) {
    if(params.get(value) != null) {
        element.value = params.get(value);
    } else {
        element.value = element.defaultValue;
    }
}

function fetchURL(){
    var url="/pokemath.html?custom=true"; //Uh oh, hardcoded
    //Addition
    if(additionCheck.checked) {
        var addMin = addMinSelect.value;
        var addMax = addMaxSelect.value;
        var addMinB = addMinSelectB.value;
        var addMaxB = addMaxSelectB.value;
        var addDec = addDecSelect.value;
        url +="&add=t" + "&amin=" + addMin + "&amax=" + addMax + "&aminb=" + addMinB + "&amaxb=" + addMaxB +"&adec=" + addDec;
    }
    //Subtraction
    if(subtractionCheck.checked) {      
        var subMin = subMinSelect.value;
        var subMax = subMaxSelect.value;
        var subMinB = subMinSelectB.value;
        var subMaxB = subMaxSelectB.value;
        var subDec = subDecSelect.value;
        var san = "";
        if(!subtractionallownegative.checked) {
            san = "&san=f";
        }
        url +="&sub=t" + "&smin=" + subMin + "&smax=" + subMax + "&sminb=" + subMinB + "&smaxb=" + subMaxB + "&sdec=" + subDec + san;
    }
    //MultiplicationMin
    if(multiplicationCheck.checked) {
        var mulMinA = mulMinSelectA.value;
        var mulMaxA = mulMaxSelectA.value;
        var mulDec = mulDecSelect.value;
        var mulMinB = mulMinSelectB.value;
        var mulMaxB = mulMaxSelectB.value;

        url +="&mul=t" + "&mumina=" + mulMinA + "&mumaxa=" + mulMaxA + "&mudec=" + mulDec+ "&muminb=" + mulMinB + "&mumaxb=" + mulMaxB;
    }
    if(divisionCheck.checked) {
        var divMinDiv = divMinDivSelect.value;
        var divMaxDiv = divMaxDivSelect.value;
        var divMinKvo = divMinKvoSelect.value;
        var divMaxKvo = divMaxKvoSelect.value;
        var divDec = divDecSelect.value;
        url += "&div=t" + "&dmin=" + divMinDiv + "&dmax=" + divMaxDiv + "&dmmin=" + divMinKvo + "&dmmax=" + divMaxKvo + "&ddec=" + divDec;
    }
    return url;
}

function generateBarCode() 
{
    var link = "https://www.pokemath.online" + encodeURIComponent(fetchURL());
    var barurl = 'https://api.qrserver.com/v1/create-qr-code/?data=' + link + '&amp;size=250x250';
    barcode.src = barurl;
    barcode.style.display = "";
}

function savePreset(id) {

    var card = document.getElementById("presetCard-"+id);
    var savebtn = card.querySelector(".save-btn");
    var loadbtn = card.querySelector(".load-btn");
    var delbtn = card.querySelector(".del-btn");
    var title = card.querySelector(".card-title");

    if(savebtn.classList.contains("disabled")){
        console.log("disabled!")
        return;
    }

    var name = prompt("Gi forhåndsinstillingen et navn","Lagret #"+id);

    savebtn.classList.add("disabled")
    loadbtn.classList.remove("disabled")
    delbtn.classList.remove("disabled")
    if(name.length> 20) {
        name = name.substring(0,20)


    }
    name = name.replaceAll('|',"-")
    name = name.replaceAll(/^\s+|\s+$/g, '');
    title.textContent = name;

    //TODO store in localstorage
    window.localStorage.setItem("customPreset"+id,JSON.stringify(name + "|" + fetchURL()))
}

function loadPreset(id) {
    var card = document.getElementById("presetCard-"+id);
    //var savebtn = card.querySelector(".save-btn");
    var loadbtn = card.querySelector(".load-btn");
    //var delbtn = card.querySelector(".del-btn");
    //var title = card.querySelector(".card-title");
    if(loadbtn.classList.contains("disabled")){
        console.log("disabled!")
        return;
    }
    //TODO fetch values from local storage.
    var url = getStorageString("customPreset"+id).split("|");
    if(url[1] == null) {
        const toast = new Toast({
            text: "Det skjedde en feil når vi prøvde å laste inn #" + id + ". Dataen eksisterer ikke.",
            position: "top-right",
            pauseOnHover: true,
            pauseOnFocusLoss: true,
            canClose: true,
            badToast: true,
          })
    } else {
        loadValues(url[1])
    }

    const toast = new Toast({
        text: "Den lagrede instillingen har blitt lastet inn. (#" + id + " - " + url[0] + ")",
        position: "top-right",
        pauseOnHover: true,
        pauseOnFocusLoss: true,
        canClose: true,
        badToast: false,
      })
}

function deletePreset(id) {
    var card = document.getElementById("presetCard-"+id);
    var savebtn = card.querySelector(".save-btn");
    var loadbtn = card.querySelector(".load-btn");
    var delbtn = card.querySelector(".del-btn");
    var title = card.querySelector(".card-title");
    if(delbtn.classList.contains("disabled")){
        console.log("disabled!")
        return;
    }
    savebtn.classList.remove("disabled")
    loadbtn.classList.add("disabled")
    delbtn.classList.add("disabled")

    title.textContent = "Lagring #" + id;
    //TODO delete value from local storage.
    window.localStorage.removeItem("customPreset" + id);
    const toast = new Toast({
        text: "Den lagrede instillingen ble slettet.",
        position: "top-right",
        pauseOnHover: true,
        pauseOnFocusLoss: true,
        canClose: true,
        badToast: true,
      })
}

loadSaveButtons();
function loadSaveButtons(){
    for(i = 1; i < 6; i++) {
        if(window.localStorage.getItem("customPreset" + i) != null) {
            let valueArray = window.localStorage.getItem("customPreset" + i).split('|');
            let name = valueArray[0];
            if(valueArray[0] != null) {
                enableLoadButton(i,name)
            }
        }
    }
}

function enableLoadButton(id,name){
    var card = document.getElementById("presetCard-"+id);
    var savebtn = card.querySelector(".save-btn");
    var loadbtn = card.querySelector(".load-btn");
    var delbtn = card.querySelector(".del-btn");
    var title = card.querySelector(".card-title");

    savebtn.classList.add("disabled")
    loadbtn.classList.remove("disabled")
    delbtn.classList.remove("disabled")
    title.textContent = name.substring(1); //after first character because first character is technically ".
}

