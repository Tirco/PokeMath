var barcode = document.getElementById("barcode")
var additionCheck = document.getElementById("additioncheck");
var addSection = document.getElementById("addSection");
var addMinSelect = document.getElementById("addMinSel")
var addMaxSelect = document.getElementById("addMaxSel")
var addDecSelect = document.getElementById("addDecSel")

var subtractionCheck = document.getElementById("subtractioncheck");
var subSection = document.getElementById("subSection");
var subMinSelect = document.getElementById("subMinSel");
var subMaxSelect = document.getElementById("subMaxSel");
var subDecSelect = document.getElementById("subDecSel");
var subtractionallownegative = document.getElementById("subtractionallownegative");

var multiplicationCheck = document.getElementById("multiplicationcheck");
var mulSection = document.getElementById("mulSection");
var mulMinSelect = document.getElementById("mulMinSel");
var mulMaxSelect = document.getElementById("mulMaxSel");
var mulDecSelect = document.getElementById("mulDecSel");

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
    var text = fetchURL();
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
    console.log("Used!")
    window.location.href = fetchURL();
}

function fetchURL(){
    //?custom=true
    //&add=t&amin=1&amax=999&adec=2
    //&sub=t&smin=5&smax=10&san=f&sdec=2
    //&mul=t&mumin=101&mumax=100&mudec=2
    //&div=t &dmin=1 &dmax=10 &dmmin=100 &dmmax=101 &ddec=2
    var url="https://www.pokemath.online/pokemath.html?custom=true"; //Uh oh, hardcoded
    //Addition
    if(additionCheck.checked) {
        console.log("Addition is checked")
        
        var addMin = addMinSelect.value;
        var addMax = addMaxSelect.value;
        var addDec = addDecSelect.value;
        url +="&add=t" + "&amin=" + addMin + "&amax=" + addMax + "&adec=" + addDec;
    }
    //Subtraction
    if(subtractionCheck.checked) {
        console.log("Subtraction is checked")
        
        var subMin = subMinSelect.value;
        var subMax = subMaxSelect.value;
        var subDec = subDecSelect.value;
        var san = "";
        if(!subtractionallownegative.checked) {
            san = "&san=f";
        }
        url +="&sub=t" + "&smin=" + subMin + "&smax=" + subMax + "&sdec=" + subDec + san;
    }
    //MultiplicationMin
    if(multiplicationCheck.checked) {
        var mulMin = mulMinSelect.value;
        var mulMax = mulMaxSelect.value;
        var mulDec = mulDecSelect.value;

        url +="&mul=t" + "&mumin=" + mulMin + "&mumax=" + mulMax + "&mudec=" + mulDec;
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
    var link = encodeURIComponent(fetchURL());
    var barurl = 'https://api.qrserver.com/v1/create-qr-code/?data=' + link + '&amp;size=250x250';
    //$('#barcode').attr('src', barurl);
    barcode.src = barurl;
    barcode.style.display = "";
}