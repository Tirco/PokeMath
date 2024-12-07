const calendarButton = document.querySelector(".btn-start");
const calendarContainer = document.querySelector(".calendar-container");
const aboveCalendar = document.querySelector(".above-calendar")
const calendarDays = 24;
let openedHatches = []

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

async function getCurrentDateFromAPI() {
    try {
        let response = await fetch('https://timeapi.io/api/time/current/zone?timeZone=Europe%2FOslo');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        let data = await response.json();
        return new Date(data.dateTime);
    } catch (error) {
        console.error('Unable to fetch current date from API, using local date: ', error);
        return new Date(); // Return local date as a fallback
    }
}

function openHatch(date) {
    number = Number(date);
    var message = "Unknown";

    if(checkACookieExists("cookies")) {
        // Ensure `openedHatches` is an array
        if (!Array.isArray(openedHatches)) {
            try {
                openedHatches = JSON.parse(openedHatches);
                if (!Array.isArray(openedHatches)) {
                    console.error("openedHatches is not an array after parsing:", openedHatches);
                    openedHatches = [];
                }
            } catch (e) {
                console.error("Error parsing openedHatches:", e);
                openedHatches = [];
            }
        }

        // Add the number to the array if not already included
        if (!openedHatches.includes(number)) {
            openedHatches.push(number);
        }

        // Save the updated `openedHatches` to local storage
        window.localStorage.setItem("xmasOpened", JSON.stringify(openedHatches));
    } else {
        const toast = new Toast({
            text: "Du har ikke godkjent bruken av Cookies, så vi kan ikke lagre din spillerdate på din enhet.",
            position: "top-right",
            pauseOnHover: true,
            pauseOnFocusLoss: true,
            canClose: true,
            badToast: true,
          })
          return;
    }

    switch (number) {
        case 1:
            message = "Luke 1 er åpnet, og du fikk en Snowball Gastly, og 1000 mynter.";
            addSpecificToPokedex("N92-C1");
            addMoney(1000);
            break;
        case 2:
            message = "Luke 2 - Du har fått en Christmas Tree Smoliv, og 1000 mynter!";
            addSpecificToPokedex("N928-C1");
            addMoney(1000);
            break;
        case 3:
            message = "Luke 3 - Du har fått en Christmas Tree Dolliv, og 1000 mynter!";
            addSpecificToPokedex("N929-C1");
            addMoney(1000);
            break;
        case 4:
            message = "Luke 4 - Du har fått en Christmas Tree Arboliva, og 1000 mynter!";
            addSpecificToPokedex("N930-C1");
            addMoney(1000);
            break;
        case 5:
            message = "Luke 5 - Du har fått en Ice Princess Kirlia, og 1000 mynter!";
            addSpecificToPokedex("N281-C1");
            addMoney(1000);
            break;
        case 6:
            message = "Luke 6 - Du har fått en Choco Milcery, og 1000 mynter!";
            addSpecificToPokedex("N868-C1");
            addMoney(1000);
            break;
        case 7:
            message = "Luke 7 - Du har fått 20 000 mynter!";
            addMoney(20000);
            break;
        case 8:
            message = "Luke 8 - Den nye Lights Pachirisu din ønsker deg en god jul! (+1000 mynter)";
            addSpecificToPokedex("N417-C1");
            addMoney(1000);
            break;
        case 9:
            message = "Luke 9 - Du har fått en Nutcrack Sirfetch'd, og 1000 mynter!";
            addSpecificToPokedex("N865-C1");
            addMoney(1000);
            break;
        case 10:
            message = "Luke 10 - Ice Present Eiscue har blitt med på laget! (+1000 mynter)";
            addSpecificToPokedex("N875-C1");
            addMoney(1000);
            break;
        case 11:
            message = "Luke 11 - Coal Rolycoly kommer for å varme deg! (+1000 mynter)";
            addSpecificToPokedex("N837-C1");
            addMoney(1000);
            break;
        case 12:
            message = "Luke 12 - Ice Yveltal kommer frem! (+1000 mynter)";
            addSpecificToPokedex("N717-C1");
            addMoney(1000);
            break;
        case 13:
            message = "Luke 13 - Santa H. Zorua er klar for julesesongen! (+1000 mynter)";
            addSpecificToPokedex("N570-C1");
            addMoney(1000);
            break;
        case 14:
            message = "Luke 14 - Her får du 30 000 mynter!";
            addMoney(30000);
            break;
        case 15:
            message = "Luke 15 - Christmas Tree Snorunt er klar for feiring! (+1000 mynter)";
            addSpecificToPokedex("N361-C1");
            addMoney(1000);
            break;
        case 16:
            message = "Luke 16 - Oi! En Lights Mew har blitt med på laget! (+1000 mynter)";
            addSpecificToPokedex("N151-C1");
            addMoney(1000);
            break;
        case 17:
            if(shopOptions.boughtBackgrounds.includes("bg-020")){
                addMoney(100000);
                message = "Luke 17 - Her skulle du ha fått en ny bakgrunn, men denne har du allerede, så du får pengene tilbake!";
            } else {
                //give background
                shopOptions.boughtBackgrounds.push("bg-020");
                message = "Luke 17 - Her får du en av julebakgrunnene!";
                saveAll();
            }
            break;
        case 18:
            message = "Luke 18 - En Unik Pokemon! Festive Mew er klar for Julen! (+1000 mynter)";
            addSpecificToPokedex("N151-U1");
            addMoney(1000);
            break;
        case 19:
            message = "Luke 19 - En Unik Pokemon! Snorlax og vennene er klare for Julen! (+1000 mynter)";
            addSpecificToPokedex("N143-U1");
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
            message = "Luke 22 - En unik pokemon! Pyjama Plusle & Minun koser seg! (+1000 mynter)";
            addSpecificToPokedex("N311-U1");
            addMoney(1000);
            break;
        case 23:
            message = "Luke 23 - Fireworks Cosmog er tidlig ute! (+1000 mynter)";
            addSpecificToPokedex("N789-C1");
            addMoney(1000);
            break;
        case 24:
            if(shopOptions.boughtBackgrounds.includes("bg-019")){
                addMoney(500000);
                message = "Luke 24 - God Jul! Skulle du ha fått julekalenderen som bakgrunn, men den har du allerede, så du får pengene tilbake!";
            } else {
                //give background
                shopOptions.boughtBackgrounds.push("bg-019");
                message = "Luke 24 - God Jul! Her får du en versjon av julekalenderen som du kan bruke som bakgrunn!";
                saveAll();
            }
            break;
        default:
            message = "Unknown date: " + number;
    }

    triggerAchievementOverlay("images/events/christmas/" + number + ".png", message);

    const toast = new Toast({
        text: message,
        position: "top-right",
        pauseOnHover: true,
        pauseOnFocusLoss: true,
        canClose: true,
        badToast: false,
      })

      if(openedHatches.length > 23) {
        setTimeout(() => {
            triggerAchievementOverlay("images/events/christmas/present-1.png", "DU HAR ÅPNET ALLE LUKENE! Derfor får du noen unike shiny pokemon, som man bare kan få fra kalenderen!");
        }, 5000)
        
        const toast = new Toast({
            text: "DU HAR ÅPNET ALLE LUKENE! Derfor får du noen unike shiny pokemon, som man bare kan få fra kalenderen!",
            position: "top-right",
            pauseOnHover: true,
            pauseOnFocusLoss: true,
            canClose: true,
            badToast: false,
          })
        addSpecificToPokedex("S151-U1");
        addSpecificToPokedex("S143-U1");
        addSpecificToPokedex("S311-U1");
        addSpecificToPokedex("S789-C1");
        createFireworks();
    }
}

function addMoney(value) {
    let money = document.querySelector(".money")
    money.dataset.added = '+' + value;
	money.dataset.total = state.totalScore += value;
	money.textContent = "";
	if (state.totalScore) money.classList.add('animate');
    saveAll();
	setTimeout(() => {
		money.classList.remove('animate');
	}, 1000)
}

const createCalendar = async () => {
    var date = await getCurrentDateFromAPI();
    let now;
    if (date instanceof Date) {
       now = date.toLocaleDateString('NO', { day: 'numeric', month: 'long', year: 'numeric' });
    } 

    aboveCalendar.textContent = "God Jul!        Dagens dato: " + now;
    for(let i = 0; i < 10; i++) {
        aboveCalendar.innerHTML += '<div class="fallingsnowflake">❅</div>';
    }


    if(date.getMonth() != 11) { //11 = desember. Januar = 0.
        calendarContainer.textContent = "Kom tilbake i desember!"
        calendarContainer.classList.remove("calendar-container")
        calendarContainer.classList.add("not-christmas-yet")
        return;
    }

     // Ensure `openedHatches` is an array and handle invalid data
     let openedHatchesString = getStorageString("xmasOpened");
     if (openedHatchesString) {
         try {
             let parsedHatches = JSON.parse(openedHatchesString);
             if (Array.isArray(parsedHatches)) {
                openedHatches.length = 0; // Clear the array without reassigning
                openedHatches.push(...parsedHatches); // Copy parsed values into the existing array
            } else {
                console.error("Parsed data is not an array:", parsedHatches);
                openedHatches.length = 0; // Reset to an empty array
            }
         } catch (e) {
             console.error("Error parsing openedHatches:", e);
             openedHatches = [];
         }
     } else {
         console.log("xmasOpened not found or is empty. Initializing openedHatches as empty array.");
         openedHatches = [];
     }

    if(checkACookieExists("cookies")) {
        getOrCreateUUID();
    } else {
        const toast = new Toast({
            text: "Du har ikke godkjent bruken av Cookies, så vi kan ikke lagre din spillerdate på din enhet.",
            position: "top-right",
            pauseOnHover: true,
            pauseOnFocusLoss: true,
            canClose: true,
            badToast: true,
          })
          return;
    }

    let today = date.getDate();
    if(openedHatches.some(day => day > today)) {
        openedHatches = openedHatches.filter(day => day <= today);
        console.log("Removed days greater than today. Remaining Elements - " + openedHatches);
        window.localStorage.setItem('xmasOpened',JSON.stringify(openedHatches))
    } else {
        console.log("No days greater than today. No changes made.");
    }

    for(let i = 0; i  < calendarDays; i++) {
        courseNumber = i + 1;
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
        const storedHatches = getStorageString('xmasOpened');
        if (storedHatches) {
            try {
                const parsedHatches = JSON.parse(storedHatches);
                if (Array.isArray(parsedHatches)) {
                    openedHatches.length = 0; // Clear current array
                    openedHatches.push(...parsedHatches); // Populate with stored values
                }
            } catch (e) {
                console.error('Error parsing xmasOpened:', e);
            }
        }

        var eventYear = getStorageString('xmasYear');
        if(eventYear != date.getFullYear()) {
            window.localStorage.setItem('xmasYear',JSON.stringify(date.getFullYear()));
            openedHatches = new Array();
        }
        
        if(openedHatches.includes(courseNumber) && date.getDate() >= courseNumber) {
            calendarDoor.classList = "calendar-image-opened";
            calendarDoor.style.backgroundImage = `url(${coursePath})`;
            calendarDoor.style.opacity = "100";
            calendarDoor.style.backgroundColor = "#ffffff73";
            //calendarDoor.innerHTML += '<div class="title-container"><a href="https://codepen.io/johnnyfekete/pen/ZEpGerj" target="_blank" title="Link to source code">Gingerbread cookie</a>'
        } else if(date.getDate() >= courseNumber){
            calendarDoorText.addEventListener("click", openDoor.bind(null,  courseNumber));
        }

    }
    if(openedHatches.length > 23) {
        createFireworks();
    }
}

function createFireworks() {
    const fireworksContainer = document.createElement("div");
    const fireworks = document.createElement("div");
    const fireworks2 = document.createElement("div");
    const fireworks3 = document.createElement("div");
    fireworks.classList.add("firework");
    fireworks2.classList.add("firework");
    fireworks3.classList.add("firework");
    fireworksContainer.appendChild(fireworks);
    fireworksContainer.appendChild(fireworks2);
    fireworksContainer.appendChild(fireworks3);
    calendarContainer.appendChild(fireworksContainer);
}
createCalendar();