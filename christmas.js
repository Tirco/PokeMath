const calendarButton = document.querySelector(".btn-start");
const calendarContainer = document.querySelector(".calendar-container");
const aboveCalendar = document.querySelector(".above-calendar")
const calendarDays = 24;
let openedHatches = []

// Mapping: door number → {entry, imageid, msg}
// Doors 7, 14, 17, 21, 24 are coins/backgrounds (no entry here)
const doorPokemon = {
  1:  { entry: "N225-C1",  imageid: 50038,  msg: "Luke 1 – Du har fått en Santa Delibird, og 1000 mynter!" },
  2:  { entry: "N37-C1",   imageid: 50033,  msg: "Luke 2 – Rudolph Vulpix har blitt med på laget! (+1000 mynter)" },
  3:  { entry: "N198-C1",  imageid: 50005,  msg: "Luke 3 – Festive Murkrow vil feire med deg! (+1000 mynter)" },
  4:  { entry: "N50-C1",   imageid: 50034,  msg: "Luke 4 – En Angel Diglett har dukket opp! (+1000 mynter)" },
  5:  { entry: "N174-C1",  imageid: 50012,  msg: "Luke 5 – Festive Igglybuff er klar for julen! (+1000 mynter)" },
  6:  { entry: "N104-C1",  imageid: 50013,  msg: "Luke 6 – Festive Cubone er med på feiringen! (+1000 mynter)" },
  8:  { entry: "N179-C1",  imageid: 50037,  msg: "Luke 8 – Christmas Mareep ønsker deg god jul! (+1000 mynter)" },
  9:  { entry: "N216-C1",  imageid: 50199,  msg: "Luke 9 – Sweater Teddiursa holder deg varm! (+1000 mynter)" },
  10: { entry: "N572-C1",  imageid: 50146,  msg: "Luke 10 – Pyjama Minccino koser seg i jula! (+1000 mynter)" },
  11: { entry: "N698-C1",  imageid: 50051,  msg: "Luke 11 – Snowy Amaura dukker opp fra isen! (+1000 mynter)" },
  12: { entry: "N149-C1",  imageid: 50148,  msg: "Luke 12 – Conductor Dragonite er klar for juletog! (+1000 mynter)" },
  13: { entry: "N861-C1",  imageid: 50207,  msg: "Luke 13 – Grinchsnarl prøver å stjele julen! (+1000 mynter)" },
  15: { entry: "N999-C1",  imageid: 50209,  msg: "Luke 15 – Gingerbread Gimmighoul! Spis meg ikke! (+1000 mynter)" },
  16: { entry: "N896-C1",  imageid: 50057,  msg: "Luke 16 – Det legendariske Primal Glastrier har vist seg! (+1000 mynter)" },
  18: { entry: "N151-U1",  imageid: 130001, msg: "Luke 18 – En Unik Pokémon! Christmas Mew er klar for Julen! (+1000 mynter)" },
  19: { entry: "N143-C1",  imageid: 50202,  msg: "Luke 19 – Ho ho ho! Santa Snorlax er klar med gavene! (+1000 mynter)" },
  20: { entry: "N25-C1",   imageid: 50054,  msg: "Luke 20 – Snowman Pikachu har ventet lenge på vintersesongen! (+1000 mynter)" },
  22: { entry: "N311-U1",  imageid: 50149,  msg: "Luke 22 – En Unik Pokémon! Pyjama Plusle & Minun koser seg! (+1000 mynter)" },
  23: { entry: "N960-C1",  imageid: 50208,  msg: "Luke 23 – Candy Cane Wiglett søter julen din! (+1000 mynter)" },
};

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

    const pk = doorPokemon[path];
    if (pk) {
        parent.style.backgroundImage = `url(./images/pokemon/normal/${pk.imageid}.png)`;
    } else {
        parent.style.backgroundImage = `url(./images/events/christmas/${path}.png)`;
    }
    parent.style.backgroundColor = "#ffffff73";
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
        return new Date();
    }
}

function openHatch(date) {
    number = Number(date);
    var message = "Unknown";

    if(checkACookieExists("cookies")) {
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

        if (!openedHatches.includes(number)) {
            openedHatches.push(number);
        }

        window.localStorage.setItem("xmasOpened", JSON.stringify(openedHatches));
    } else {
        new Toast({
            text: "Du har ikke godkjent bruken av Cookies, så vi kan ikke lagre din spillerdate på din enhet.",
            position: "top-right",
            pauseOnHover: true,
            pauseOnFocusLoss: true,
            canClose: true,
            badToast: true,
        });
        return;
    }

    // Pokemon door
    if (doorPokemon[number]) {
        const pk = doorPokemon[number];
        message = pk.msg;
        addSpecificToPokedex(pk.entry);
        addMoney(1000);
    } else {
        // Special doors: coins & backgrounds
        switch (number) {
            case 7:
                message = "Luke 7 – Du har fått 20 000 mynter!";
                addMoney(20000);
                break;
            case 14:
                message = "Luke 14 – Her får du 30 000 mynter!";
                addMoney(30000);
                break;
            case 17:
                if (shopOptions.boughtBackgrounds.includes("bg-020")) {
                    addMoney(100000);
                    message = "Luke 17 – Her skulle du ha fått en ny bakgrunn, men denne har du allerede, så du får pengene tilbake!";
                } else {
                    shopOptions.boughtBackgrounds.push("bg-020");
                    message = "Luke 17 – Her får du en av julebakgrunnene!";
                    saveAll();
                }
                break;
            case 21:
                message = "Luke 21 – Her får du 50 000 mynter! Bruk dem godt!";
                addMoney(50000);
                break;
            case 24:
                if (shopOptions.boughtBackgrounds.includes("bg-019")) {
                    addMoney(500000);
                    message = "Luke 24 – God Jul! Skulle du ha fått julekalenderen som bakgrunn, men den har du allerede, så du får pengene tilbake!";
                } else {
                    shopOptions.boughtBackgrounds.push("bg-019");
                    message = "Luke 24 – God Jul! Her får du en versjon av julekalenderen som du kan bruke som bakgrunn!";
                    saveAll();
                }
                break;
            default:
                message = "Unknown date: " + number;
        }
    }

    const overlayImg = doorPokemon[number]
        ? "images/pokemon/normal/" + doorPokemon[number].imageid + ".png"
        : "images/events/christmas/" + number + ".png";
    triggerAchievementOverlay(overlayImg, message);

    new Toast({
        text: message,
        position: "top-right",
        pauseOnHover: true,
        pauseOnFocusLoss: true,
        canClose: true,
        badToast: false,
    });

    if (openedHatches.length > 23) {
        const bonusMsg = "DU HAR ÅPNET ALLE LUKENE! Derfor får du noen unike shiny pokemon, som man bare kan få fra kalenderen!";
        setTimeout(() => {
            triggerAchievementOverlay("images/events/christmas/present-1.png", bonusMsg);
        }, 5000);
        new Toast({
            text: bonusMsg,
            position: "top-right",
            pauseOnHover: true,
            pauseOnFocusLoss: true,
            canClose: true,
            badToast: false,
        });
        addSpecificToPokedex("S225-C1");  // Shiny Santa Delibird
        addSpecificToPokedex("S143-C1");  // Shiny Santa Snorlax
        addSpecificToPokedex("S151-U1");  // Shiny Christmas Mew
        addSpecificToPokedex("S311-U1");  // Shiny Pyjama Plusle & Minun
        createFireworks();
    }
    getOrCreateUUID();
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
                openedHatches.length = 0;
                openedHatches.push(...parsedHatches);
            } else {
                console.error("Parsed data is not an array:", parsedHatches);
                openedHatches.length = 0;
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
    } else {
        new Toast({
            text: "Du har ikke godkjent bruken av Cookies, så vi kan ikke lagre din spillerdate på din enhet.",
            position: "top-right",
            pauseOnHover: true,
            pauseOnFocusLoss: true,
            canClose: true,
            badToast: true,
        });
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

    for(let i = 0; i < calendarDays; i++) {
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

        const pk = doorPokemon[courseNumber];
        const coursePath = pk
            ? `./images/pokemon/normal/${pk.imageid}.png`
            : `./images/events/christmas/${courseNumber}.png`;

        const storedHatches = getStorageString('xmasOpened');
        if (storedHatches) {
            try {
                const parsedHatches = JSON.parse(storedHatches);
                if (Array.isArray(parsedHatches)) {
                    openedHatches.length = 0;
                    openedHatches.push(...parsedHatches);
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
        } else if(date.getDate() >= courseNumber){
            calendarDoorText.addEventListener("click", openDoor.bind(null, courseNumber));
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
