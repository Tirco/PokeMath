const problemElement = document.querySelector(".problem")
const mainUI = document.querySelector(".main-ui")
const ourForm = document.querySelector(".our-form") //Bad naming...
const ourField = document.querySelector(".our-field") //More bad naming...
const pointsNeeded = document.querySelector(".points-needed")
const mistakesAllowed = document.querySelector(".mistakes-allowed")
const progressBar = document.querySelector(".progress-inner")
const resetButton = document.querySelector(".reset-button")
const winScore = 5 //hvor mange poeng som trengs.
const defaultLives = 3 //hvor mange forsøk man har.
const money = document.querySelector(".money")
const goodMessages = ["Flott jobbet!","Nice!","Ny pokémon!","Trykk på ballen!","Enda en til samlingen!","Fortsett sånn!","Stå på!","Du er super!","Oh, hva får du nå?","Eyy! Bra jobbet!"]


let mathValues = {
	stage: 3,
	additionMin: 0,
	additionMax: 10,
	subtractionMin:  0,
	subtractionMax:  10,
	subAllowNegative: true,
	multiplicationMin:  0,
	multiplicationMax:  10,
	divisionMin:  0,
	divisionMax:  10,
	divisionMultiplierMin:  0,
	divisionMultiplierMax:  10,
	operations: ['+','-','x','/'],
	additionDecimals: 0,
	subtractionDecimals: 0,
	multiplicationDecimals: 0,
	divisionDecimals: 0
}

function onLoad(){
	let params = new URLSearchParams(location.search);
	
	if(params.get('custom') == "true" ) {
		mathValues.stage = 3;
		mathValues.operations = [];
		if(params.get("san") == "f") {
			mathValues.subAllowNegative = false;
		}
		if(params.get("add") == "t") {
			mathValues.additionMin = Number(params.get("amin"));
			mathValues.additionMax = Number(params.get("amax"));
			mathValues.additionDecimals = Number(params.get("adec"));
			mathValues.operations.push("+");
		}
		if(params.get("sub") == "t") {
			mathValues.subtractionMin = Number(params.get("smin"));
			mathValues.subtractionMax = Number(params.get("smax"));
			mathValues.subtractionDecimals = Number(params.get("sdec"));
			mathValues.operations.push("-")
		}
		if(params.get("mul") == "t") {
			mathValues.multiplicationMin = Number(params.get("mumin"));
			mathValues.multiplicationMax = Number(params.get("mumax"));
			mathValues.multiplicationDecimals = Number(params.get("mudec"));
			mathValues.operations.push("x")
		}
		if(params.get("div") == "t") {
			mathValues.divisionMin = Number(params.get("dmin"));
			mathValues.divisionMax = Number(params.get("dmax"));
			mathValues.divisionMultiplierMin = Number(params.get("dmmin"));
			mathValues.divisionMultiplierMax = Number(params.get("dmmin"));
			mathValues.divisionDecimals = Number(params.get("ddec"));
			mathValues.operations.push("/")
		}
		updateProblem();
		return;
	}
	
	if(mathValues.stage == null || Number(mathValues.stage) == 0) {
		mathValues.stage = 3;
	}
	//console.log("stage: " + mathValues.stage);
	
	switch(mathValues.stage){
	case '1':
		mathValues.additionMin = 0;
		mathValues.additionMax = 10;
		mathValues.subtractionMin = 0;
		mathValues.subtractionMax = 10;
		mathValues.subAllowNegative = false;
		mathValues.operations = ['+','-'];
		break;
	case '2':
		mathValues.additionMin = 0;
		mathValues.additionMax = 25;
		mathValues.subtractionMin = 0;
		mathValues.subtractionMax = 25;
		mathValues.subAllowNegative = false;
		mathValues.operations = ['+','-'];
		break;
	case '3':
		mathValues.additionMin = 0;
		mathValues.additionMax = 10;
		mathValues.subtractionMin = 0;
		mathValues.subtractionMax = 10;
		mathValues.multiplicationMin = 0;
		mathValues.multiplicationMax = 10;
		mathValues.divisionMin = 1;
		mathValues.divisionMax = 10;
		mathValues.divisionMultiplierMin = 0,
		mathValues.divisionMultiplierMax = 10,
		mathValues.operations = ['+','-','x','/'];
		break;
	case '4':
		mathValues.additionMin = 10;
		mathValues.additionMax = 100;
		mathValues.subtractionMin = 10;
		mathValues.subtractionMax = 100;
		mathValues.multiplicationMin = 10;
		mathValues.multiplicationMax = 100;
		mathValues.divisionMin = 1;
		mathValues.divisionMax = 10;
		mathValues.divisionMultiplierMin = 1,
		mathValues.divisionMultiplierMax = 100,
		mathValues.operations = ['+','-','x','/'];
		break;
	case '5':
		mathValues.additionMin = 1000;
		mathValues.additionMax = 10000;
		mathValues.subtractionMin = 1000;
		mathValues.subtractionMax = 10000;
		mathValues.multiplicationMin = 10;
		mathValues.multiplicationMax = 999;
		mathValues.divisionMin = 10;
		mathValues.divisionMax = 100;
		mathValues.divisionMultiplierMin = 10,
		mathValues.divisionMultiplierMax = 1000,
		mathValues.operations = ['+','-','x','/'];
		break;
	default:
		break;
	}

	updateProblem();
}

function addMoney(){
	var value = 1
	switch(Number(mathValues.stage)){
		case 1:
			value = 4;
			break;
		case 2:
			value = 8;
			break;
		case 3:
			value = 10;
			break;
		case 4:
			value = 20;
			break;
		case 5:
			value = 50;
			break;
		default:
			value = 10;
			break;
	}
	money.dataset.added = '+' + value;
	money.dataset.total = state.totalScore += value;
	money.textContent = "";
	if (state.totalScore) money.classList.add('animate');
  
	setTimeout(() => {
		money.classList.remove('animate');
	}, 500)
}
function addFixedMoney(value){
	if(Number.isNaN(value)){
		alert(value + " is not a number! Error on payment.")
		return;
	}
	money.dataset.added = '+' + value;
	money.dataset.total = state.totalScore += value;
	money.textContent = "";
	if (state.totalScore) money.classList.add('animate');
  
	setTimeout(() => {
		money.classList.remove('animate');
	}, 500)
}

function updateProblem() {
	mathValues.currentProblem = generateProblem()
	problemElement.innerHTML = `${mathValues.currentProblem.numberOne} ${mathValues.currentProblem.operator} ${mathValues.currentProblem.numberTwo}`
	ourField.value = ""
	ourField.focus()
}

function generateNumber(max) {
	return (Math.floor(Math.random() * (max + 1)))
}
function generateNumber(min, max) {
	console.log("Gen Number: min" + min + " max " + max)
	return min + (Math.floor(Math.random() * (max + 1 - min)))
}
function generateNumber(min, max, decimals) {
	let num = min + (Math.random() * (max - min));
	console.log("Gen Number: min" + min + " max " + max + " dec " + decimals + " result: " + num + " numFix " + Number(num.toFixed(decimals)))
	return Number(num.toFixed(decimals))
}

function generateProblem() {
  var operator = mathValues.operations[Math.floor(Math.random()*mathValues.operations.length)]
  var numberOne = 1;
  var numberTwo = 1;
  switch(operator) {
	case '+':
		numberOne = generateNumber(mathValues.additionMin, mathValues.additionMax, mathValues.additionDecimals);
		numberTwo = generateNumber(mathValues.additionMin, mathValues.additionMax, mathValues.additionDecimals);
		break;
	case '-':
		numberOne = generateNumber(mathValues.subtractionMin, mathValues.subtractionMax, mathValues.subtractionDecimals);
		numberTwo = generateNumber(mathValues.subtractionMin, mathValues.subtractionMax, mathValues.subtractionDecimals);
		break;
	case 'x':
		numberOne = generateNumber(mathValues.multiplicationMin, mathValues.multiplicationMax, mathValues.multiplicationDecimals);
		numberTwo = generateNumber(mathValues.multiplicationMin, mathValues.multiplicationMax, mathValues.multiplicationDecimals);
		break;
	case '/':
		numberOne = generateNumber(mathValues.divisionMultiplierMin, mathValues.divisionMultiplierMax, mathValues.divisionDecimals);
		numberTwo = generateNumber(mathValues.divisionMin, mathValues.divisionMax, mathValues.divisionDecimals);
		if(numberTwo == 0) {
			numberTwo++;
		}
		numberOne = numberOne * numberTwo
		if(countDecimals(numberOne) != mathValues.divisionDecimals) {
			console.log("Editing decimals of division " + numberOne)
			numberOne = Number(numberOne.toFixed(mathValues.divisionDecimals))
		}
  }
  
  if((!mathValues.subAllowNegative && operator == "-") && numberOne < numberTwo) {
	  let tempNumber = numberTwo
	  numberTwo = numberOne
	  numberOne = tempNumber
  }
	return {
    operator, numberOne, numberTwo
	}
}

ourForm.addEventListener("submit", handleSubmit)

function swapNegative(){
	value = Number(ourField.value)
	ourField.value = value - (value * 2);
	ourField.focus();
	return;
}

function handleSubmit(e) {
	console.log("triggered")
	e.preventDefault()

  if(ourField.value == "") {
    ourField.focus()
    return;
  }

  if(state.score == winScore) { //Make sure we can't enter a score when whe are in the win screen.
    return;
  }
	var playerAnswer = Number(ourField.value);
	var convertedPlayerAnswer = playerAnswer;

	let correctAnswer
	const p = mathValues.currentProblem
	if(p.operator == "+") {
		correctAnswer = p.numberOne + p.numberTwo
		correctAnswer = Number(correctAnswer.toFixed(mathValues.additionDecimals))
		convertedPlayerAnswer = Number(playerAnswer.toFixed(mathValues.additionDecimals))
	} else if(p.operator == "-") {
		correctAnswer = p.numberOne - p.numberTwo
		correctAnswer = Number(correctAnswer.toFixed(mathValues.subtractionDecimals))
		convertedPlayerAnswer = Number(playerAnswer.toFixed(mathValues.subtractionDecimals))
	} else if(p.operator == "x") {
		correctAnswer = p.numberOne * p.numberTwo
		correctAnswer = Number(correctAnswer.toFixed(mathValues.multiplicationDecimals))
		convertedPlayerAnswer = Number(playerAnswer.toFixed(mathValues.multiplicationDecimals))
	} else if(p.operator == "/") {
		correctAnswer = p.numberOne / p.numberTwo
		correctAnswer = Number(correctAnswer.toFixed(mathValues.divisionDecimals))
		convertedPlayerAnswer = Number(playerAnswer.toFixed(mathValues.divisionDecimals))
	} else {
		correctAnswer = "?"
	}

	console.log(correctAnswer);
	
	if(playerAnswer == correctAnswer || convertedPlayerAnswer == correctAnswer) {
		state.score++
		state.streak++
		pointsNeeded.textContent = 5 - state.score
		addMoney()
    	mainUI.classList.add("ui-animate-correct")
    	setTimeout(() =>  mainUI.classList.remove("ui-animate-correct"), 1001)
		updateProblem()
		renderProgressBar()
		//Update tier solved.
		switch(mathValues.stage) {
			case '1':
				state.tier1Solved ++;
				break;
			case '2':
				state.tier2Solved ++;
				break;
			case '3':
				state.tier3Solved ++;
				break;
			case '4':
				state.tier4Solved ++;
				break;
			case '5':
				state.tier5Solved ++;
				break;
			default:
				state.customSolved ++;
				break;
		}
	} else {
		//TODO make popup with amount of Decimals.
		
		console.log(countDecimals("Answer Decimals:" + correctAnswer))
		console.log(countDecimals("Your Decimals:" + playerAnswer))
		console.log("Converted Answer: " + Number(correctAnswer.toFixed(mathValues.divisionDecimals)))
		console.log("Your converted Answer: " + Number(playerAnswer.toFixed(mathValues.divisionDecimals)))
		console.log("Do they match? " + (Number(correctAnswer.toFixed(mathValues.divisionDecimals)) == Number(playerAnswer.toFixed(mathValues.divisionDecimals))))

		state.wrongAnswers++
		state.streak = 0;
    	ourField.value = ""
		mistakesAllowed.textContent = 2-state.wrongAnswers
		ourField.focus()
    	problemElement.classList.add("animate-wrong")
    	setTimeout(() => problemElement.classList.remove("animate-wrong"), 451)
    	mainUI.classList.add("ui-animate-wrong")
    	setTimeout(() =>  mainUI.classList.remove("ui-animate-wrong"), 1001)
	}
	checkLogic()
		
}

function countDecimals(number) { //Thank you https://stackoverflow.com/questions/17369098/simplest-way-of-getting-the-number-of-decimals-in-a-number-in-javascript
    if (Math.floor(number.valueOf()) === number.valueOf()) return 0;

    var str = number.toString();
    if (str.indexOf(".") !== -1 && str.indexOf("-") !== -1) {
        return str.split("-")[1] || 0;
    } else if (str.indexOf(".") !== -1) {
        return str.split(".")[1].length || 0;
    }
    return str.split("-")[1] || 0;
}

function checkLogic() {
	//If you win
	if(state.score === winScore) {
	  endMessage.textContent = goodMessages[Math.floor(Math.random()* (Object.keys(goodMessages).length))]
	  document.body.classList.add("overlay-is-open")
      pokeball.classList.remove("is-hidden")
	}
	//If you lost
	if(state.wrongAnswers === defaultLives) {
		resetGame()
	}
}

resetButton.addEventListener("click", resetGame)

function resetGame() {
	document.body.classList.remove("overlay-is-open")
	state.score = 0
	state.wrongAnswers = 0
	pointsNeeded.textContent = winScore
	mistakesAllowed.textContent = (defaultLives -1)
	renderProgressBar()
 	newCatchInfo.innerHTML = ""
  	resetButton.classList.add("is-hidden")
  	saveAll()
/* 	if(pokeball.classList.contains("is-hidden") === false) {
		pokeball.classList.add("is-hidden")
	} */
}

function renderProgressBar(){
	progressBar.style.transform = `scaleX(${state.score/winScore})`
}


onLoad()	