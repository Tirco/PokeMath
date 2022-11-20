const calendarButton = document.querySelector(".btn-start");
const calendarContainer = document.querySelector(".calendar-container");
const aboveCalendar = document.querySelector(".above-calendar")
const money = document.querySelector(".money")
const calendarDays = 24;

const openDoor = (path, event) => {
    parent = event.target.parentNode;
    if(parent.classList.contains("calendar-image-opened")) {
        console.log("already opened");
        return;
    }
    void parent.offsetWidth;

    parent.classList.remove("calendar-image");
    parent.classList.remove("door");
    parent.classList.add("calendar-image-opened");
    parent.style.backgroundImage = `url(./images/events/christmas/${path}.png)`;
    parent.style.backgroundColor = "#ffffff73";
    //parent.innerHTML += '<div class="title-container"><a href="https://codepen.io/johnnyfekete/pen/ZEpGerj" target="_blank" title="Link to source code">Gingerbread cookie</a>'
    console.log("this was #" + path);
    openHatch(path);
}

function openHatch(date) {
    number = Number(date);
    var message = "Unknown";
    var error = false;
    switch (number) {
        case 1:
            message = "Luke 1 er åpnet, og du fikk en Christmas Sudowoodo, og 1000 mynter.";
            addSpecificToPokedex("N185-C1");
            addMoney(1000);
            break;
        case 2:
            message = "Julekalender, Dag 2 - Du har fått en Festive Murkrow, og 1000 mynter!";
            addSpecificToPokedex("N198-C1");
            addMoney(1000);
            break;
        case 3:
            message = "Luke 3 - Gratulerer! Mistletoe Igglybuff has blitt med i samlingen! (og 1000 mynter)";
            addSpecificToPokedex("N174-C1");
            addMoney(1000);
            break;
        case 4:
            message = "Nå er det bare 20 dager igjen til Jul! Du har fått en Drummer Boy Cubone, og 1000 mynter!!";
            addSpecificToPokedex("N104-C1");
            addMoney(1000);
            break;
        case 5:
            message = "Luke 5 - Du har fått en Reindeer Vulpix, og 1000 mynter!";
            addSpecificToPokedex("N37-C1");
            addMoney(1000);
            break;
        case 6:
            message = "Luke 6 - Eeengleer daaaaler neeed i skjuuuul. (Eller under jorda - sånn som Angel Digletten du akuratt fikk sammen med 1000 mynter!)";
            addSpecificToPokedex("N50-C1");
            addMoney(1000);
            break;
        case 7:
            message = "Luke 7 - Du har fått 20 000 mynter!";
            addMoney(20000);
            break;
        case 8:
            message = "Luke 8 - Den nye Christmas Rowleten din ønsker deg en god jul! (+1000 mynter)";
            addSpecificToPokedex("N722-C1");
            addMoney(1000);
            break;
        case 9:
            message = "Luke 9 - Her har du en Christmas Wreath Comfey som du kan henge på døren! (+1000 mynter)";
            addSpecificToPokedex("N764-C1");
            addMoney(1000);
            break;
        case 10:
            message = "Luke 10 - Presents Komala har blitt med på laget! (+1000 mynter)";
            addSpecificToPokedex("N775-C1");
            addMoney(1000);
            break;
        case 11:
            message = "Luke 11 - Elf Impidimp kommer for å gjøre rampestreker! (+1000 mynter)";
            addSpecificToPokedex("N859-C1");
            addMoney(1000);
            break;
        case 12:
            message = "Luke 12 - En Ornaments Spoink vil gjerne henge på treet! (+1000 mynter)";
            addSpecificToPokedex("N325-C1");
            addMoney(1000);
            break;
        case 13:
            message = "Luke 13 - Festive Pidove er klar for julesesongen! (+1000 mynter)";
            addSpecificToPokedex("N519-C1");
            addMoney(1000);
            break;
        case 14:
            message = "Luke 14 - Her får du 30 000 mynter!";
            addMoney(30000);
            break;
        case 15:
            message = "Luke 15 - Festive Farfetch'd funker fint! (+1000 mynter)";
            addSpecificToPokedex("N83-C1");
            addMoney(1000);
            break;
        case 16:
            message = "Luke 16 - Festive Gardevoir har blitt med på laget! (+1000 mynter)";
            addSpecificToPokedex("N282-C1");
            addMoney(1000);
            break;
        case 17:
            if(shopOptions.boughtBackgrounds.includes("bg-019")){
                addMoney(100000);
                message = "Luke 19 - Her skulle du ha fått en ny bakgrunn, men denne har du allerede, så du får pengene tilbake!";
            } else {
                //give background
                shopOptions.boughtBackgrounds.push("bg-019");
                message = "Luke 19 - Her får du en av julebakgrunnene!";
                saveAll();
            }
            break;
        case 18:
            message = "Luke 18 - Festive Gallade er klar til kamp!";
            addSpecificToPokedex("N475-C1");
            addMoney(1000);
            break;
        case 19:
            message = "Luke 19 - Christmas Cake Appletun sørger for en god lukt på kjøkkenet! (+1000 mynter)";
            addSpecificToPokedex("N842-C1");
            addMoney(1000);
            break;
        case 20:
            message = "Luke 20 - Snowman Pikachu har ventet lenge på vintersesongen! (+1000 mynter)";
            addSpecificToPokedex("N25-C1");
            addMoney(1000);
            break;
        case 21:
            message = "Luke 21 - Her får du 50 000 mynter! Bruk dem godt!";
            addMoney(50000);
            break;
        case 22:
            message = "Luke 22 - Santa Delibird har samlet opp gaver i hele år! (+1000 mynter)";
            addSpecificToPokedex("N225-C1");
            addMoney(1000);
            break;
        case 23:
            message = "Luke 23 - Festive Hoopa blir med på laget! (+1000 mynter)";
            addSpecificToPokedex("N720-C1");
            addMoney(1000);
            break;
        case 24:
            if(shopOptions.boughtBackgrounds.includes("bg-020")){
                addMoney(500000);
                message = "Luke 24 - God Jul! Skulle du ha fått julekalenderen som bakgrunn, men den har du allerede, så du får pengene tilbake!";
            } else {
                //give background
                shopOptions.boughtBackgrounds.push("bg-020");
                message = "Luke 24 - God Jul! Her får du en versjon av julekalenderen som du kan bruke som bakgrunn!";
                saveAll();
            }
            break;
        default:
            message = "Unknown date: " + number;
            error = true;
    }

    const toast = new Toast({
        text: message,
        position: "top-right",
        pauseOnHover: true,
        pauseOnFocusLoss: true,
        canClose: true,
        badToast: false,
      })


    if(!error) {
        //Add to opened.
    }
}

function addMoney(value) {
    money.dataset.added = '+' + value;
	money.dataset.total = state.totalScore += value;
	money.textContent = "";
	statCounterAmount("update","coinsEarned",value);
	if (state.totalScore) money.classList.add('animate');
  
	setTimeout(() => {
		money.classList.remove('animate');
	}, 1000)
}

const createCalendar = () => {
    var date = new Date();
    aboveCalendar.textContent += "Dagens dato: " + date.toLocaleDateString("NO");
    for(let i = 0; i < 20; i++) {
        aboveCalendar.innerHTML += '<div class="snowflake">❅</div>';
    }
    if(date.getMonth() != 10) { //11 = desember. Januar = 0.
        calendarContainer.textContent = "Kom tilbake i desember!"
        calendarContainer.classList.remove("calendar-container")
        calendarContainer.classList.add("not-christmas-yet")
        return;
    }

    //TODO ce-year.
    //Get list of opened hatches.
    //clear list if wrong year.

    for(let i = 0; i  < calendarDays; i++) {
        courseNumber = i + 1;
        console.log("Creating #" + courseNumber)
        const calendarDoor = document.createElement("div");
        const calendarDoorText = document.createElement("div");

        calendarDoor.classList.add("calendar-image");

        calendarDoor.classList.add("door");
        calendarDoor.style.gridArea = "door" + courseNumber;
        calendarContainer.appendChild(calendarDoor);

        calendarDoorText.classList.add("text");
        calendarDoorText.innerHTML = courseNumber;
        calendarDoor.appendChild(calendarDoorText);

        let coursePath = `./images/events/christmas/${courseNumber}.png`;
        var aList = [1,2,3,4,5,6]
        if(aList.includes(courseNumber)){
            calendarDoor.classList = "calendar-image-opened";
            calendarDoor.style.backgroundImage = `url(${coursePath})`;
            calendarDoor.style.opacity = "100";
            calendarDoor.style.backgroundColor = "#ffffff73";
            //calendarDoor.innerHTML += '<div class="title-container"><a href="https://codepen.io/johnnyfekete/pen/ZEpGerj" target="_blank" title="Link to source code">Gingerbread cookie</a>'
        } else if(date.getDate() == courseNumber){ //Bare la dagens luke kunne åpnes
            calendarDoorText.addEventListener("click", openDoor.bind(null,  courseNumber));
        }
    }
}
createCalendar();