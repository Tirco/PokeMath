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
	multiplicationMin:  0,
	multiplicationMax:  10,
	divisionMin:  0,
	divisionMax:  10,
	divisionMultiplierMin:  0,
	divisionMultiplierMax:  10,
	operations: ['+','-','x','/']
}

function onLoad(){
	let params = new URLSearchParams(location.search);
	mathValues.stage = params.get('stage');
	if(mathValues.stage == null || Number(mathValues.stage) == 0) {
		mathValues.stage = 3;
	}
	//console.log("stage: " + mathValues.stage);
	var selector = ("botbar-" + mathValues.stage);
	document.getElementById(selector).outerHTML = `<a class="active">${mathValues.stage}</a>`;
	
	switch(mathValues.stage){
	case '1':
		mathValues.additionMin = 0;
		mathValues.additionMax = 10;
		mathValues.subtractionMin = 0;
		mathValues.subtractionMax = 10;
		mathValues.operations = ['+','-'];
		break;
	case '2':
		mathValues.additionMin = 0;
		mathValues.additionMax = 25;
		mathValues.subtractionMin = 0;
		mathValues.subtractionMax = 25;
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

//pkmnlist will be S1, for shiny #1, and N1 for normal #1.
function addMoney(){
	var value = 1
	switch(Number(mathValues.stage)){
		case 1:
			value = 1;
			break;
		case 2:
			value = 2;
			break;
		case 3:
			value = 5;
			break;
		case 4:
			value = 12;
			break;
		case 5:
			value = 20;
			break;
		default:
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
		alert(value + " is not a number!")
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
	return min + (Math.floor(Math.random() * (max + 1 - min)))
}

function generateProblem() {
  var operator = mathValues.operations[Math.floor(Math.random()*mathValues.operations.length)]
  var numberOne = 1;
  var numberTwo = 1;
  switch(operator) {
	case '+':
		numberOne = generateNumber(mathValues.additionMin, mathValues.additionMax);
		numberTwo = generateNumber(mathValues.additionMin, mathValues.additionMax);
		break;
	case '-':
		numberOne = generateNumber(mathValues.subtractionMin, mathValues.subtractionMax);
		numberTwo = generateNumber(mathValues.subtractionMin, mathValues.subtractionMax);
		break;
	case 'x':
		numberOne = generateNumber(mathValues.multiplicationMin, mathValues.multiplicationMax);
		numberTwo = generateNumber(mathValues.multiplicationMin, mathValues.multiplicationMax);
		break;
	case '/':
		numberOne = generateNumber(mathValues.divisionMultiplierMin, mathValues.divisionMultiplierMax);
		numberTwo = generateNumber(mathValues.divisionMin, mathValues.divisionMax);
		if(numberTwo == 0) {
			numberTwo++;
		}
		numberOne = numberOne * numberTwo
  }
  if((mathValues.stage == '1' || mathValues.stage == '2') && numberOne < numberTwo) {
	  let tempNumber = numberTwo
	  numberTwo = numberOne
	  numberOne = tempNumber
  }
	return {
    operator, numberOne, numberTwo
	}
}

ourForm.addEventListener("submit", handleSubmit)

function handleSubmit(e) {
	e.preventDefault()

  if(ourField.value == "") {
    ourField.focus()
    return;
  }

  if(state.score == winScore) { //Make sure we can't enter a score when whe are in the win screen.
    return;
  }
	
	let correctAnswer
	const p = mathValues.currentProblem
	if(p.operator == "+") {
		correctAnswer = p.numberOne + p.numberTwo
	} else if(p.operator == "-") {
		correctAnswer = p.numberOne - p.numberTwo
	} else if(p.operator == "x") {
		correctAnswer = p.numberOne * p.numberTwo
	} else if(p.operator == "/") {
		correctAnswer = p.numberOne / p.numberTwo
	} else {
		correctAnswer = "?"
	}
	
	if(parseInt(ourField.value,10) == correctAnswer) {
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
		}
	} else {
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