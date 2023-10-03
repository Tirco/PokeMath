const tasks = [
    { name: "Gen I", image: null, text: null, textClass: null, description: "Fang en pokemon fra Generasjon 1. (001 - 151)", difficulty: "easy" },
    { name: "Gen II", image: null, text: null, textClass: null,description: "Fang en pokemon fra Generasjon 2. (152 - 251)", difficulty: "easy" },
    { name: "Gen III", image: null, text: null, textClass: null,description: "Fang en pokemon fra Generasjon 3. (252 - 386)", difficulty: "easy" },
    { name: "Gen IV", image: null, text: null, textClass: null,description: "Fang en pokemon fra Generasjon 4. (387 - 493)", difficulty: "easy" },
    { name: "Gen V", image: null, text: null, textClass: null,description: "Fang en pokemon fra Generasjon 5. (494 - 649)", difficulty: "easy" },
    { name: "Gen VI", image: null, text: null, textClass: null,description: "Fang en pokemon fra Generasjon 6. (650 - 721)", difficulty: "easy" },
    { name: "Gen VII", image: null, text: null, textClass: null,description: "Fang en pokemon fra Generasjon 7. (722 - 809)", difficulty: "easy" },
    { name: "Gen VIII", image: null, text: null, textClass: null,description: "Fang en pokemon fra Generasjon 8. (810 - 905)", difficulty: "easy" },
    { name: "Gen IX", image: null, text: null, textClass: null,description: "Fang en pokemon fra Generasjon 9. (906 - 1017)", difficulty: "easy" },
    { name: "Water-Type", image: null, text: null, textClass: null,description: "Fang en Vann-Pokemon", difficulty: "easy" },
    { name: "Normal-Type", image: null, text: null, textClass: null,description: "Fang en Normal-Pokemon", difficulty: "easy" },
    { name: "Flying-Type", image: null, text: null, textClass: null,description: "Fang en Flyve-Pokemon", difficulty: "easy" },
    { name: "Grass-Type", image: null, text: null, textClass: null,description: "Fang en Gress-Pokemon", difficulty: "easy" },
    { name: "Psychic-Type", image: null, text: null, textClass: null,description: "Fang en Psykisk-Pokemon", difficulty: "easy" },
    { name: "Bug-Type", image: null, text: null, textClass: null,description: "Fang en Insekt-Pokemon", difficulty: "easy" },
    { name: "Ground-Type", image: null, text: null, textClass: null,description: "Fang en Jord-Pokemon", difficulty: "easy" },
    { name: "Poison-Type", image: null, text: null, textClass: null,description: "Fang en Gift-Pokemon", difficulty: "easy" },
    { name: "Fire-Type", image: null, text: null, textClass: null,description: "Fang en Ild-Pokemon", difficulty: "easy" },
    { name: "Rock-Type", image: null, text: null, textClass: null,description: "Fang en Stein-Pokemon", difficulty: "easy" },
    { name: "Fighting-Type", image: null, text: null, textClass: null,description: "Fang en Sloss-Pokemon", difficulty: "easy" },
    { name: "Fairy-Type", image: null, text: null, textClass: null,description: "Fang en Fe-Pokemon", difficulty: "easy" },
    { name: "Electric-Type", image: null, text: null, textClass: null,description: "Fang en Elektrisk-Pokemon", difficulty: "easy" },
    
    // ... add more tasks similarly
    { name: "Steel-Type", image: null, text: null, textClass: null,description: "Fang en Stål-Pokemon", difficulty: "medium" },
    { name: "Dark-Type", image: null, text: null, textClass: null,description: "Fang en Mørk-Pokemon", difficulty: "medium" },
    { name: "Dragon-Type", image: null, text: null, textClass: null,description: "Fang en Drage-Pokemon", difficulty: "medium" },
    { name: "Ghost-Type", image: null, text: null, textClass: null,description: "Fang en Spøkelse-Pokemon", difficulty: "medium" },
    { name: "Ice-Type", image: null, text: null, textClass: null,description: "Fang en Is-Pokemon", difficulty: "medium" },
    { name: "Shiny", image: "images/shinycharm.png", text: null, textClass: null, description: "Fang en Shiny pokemon", difficulty: "medium" },
    { name: "Legendary", image: "images/lure_legend.svg", text: null, textClass: null, description: "Fang en legendarisk pokemon", difficulty: "medium" },
    { name: "Mythic", image: "images/lure.svg", text: null, textClass: null, description: "Fang en mytisk pokemon", difficulty: "medium" },
    { name: "Mega", image: "images/up-arrow.png", text: null, textClass: null, description: "Fang en mega pokemon", difficulty: "medium" },
    { name: "Gigantamax", image: "images/up-arrow.png", text: null, textClass: null, description: "Fang en gigantamax pokemon", difficulty: "medium" },
    { name: "Hisuian", image: null, text: null, textClass: null, description: "Fang en Hisuian pokemon", difficulty: "medium" },
    { name: "Alolan", image: null, text: null, textClass: null, description: "Fang en Alolan pokemon", difficulty: "medium" },
    { name: "Starter", image: null, text: null, textClass: null, description: "Fang en starter pokemon", difficulty: "medium" },
    { name: "Hund", image: null, text: null, textClass: null, description: "Fang en hundepokemon", difficulty: "medium" },
    { name: "Fugl", image: null, text: null, textClass: null, description: "Fang en fuglepokemon", difficulty: "medium" },
    { name: "Fisk", image: null, text: null, textClass: null, description: "Fang en fiskepokemon", difficulty: "medium" },
    { name: "Plante", image: null, text: null, textClass: null, description: "Fang en plantepokemon", difficulty: "medium" },
    // ...
    { name: "5x Shiny", image: "images/shinycharm.png", text: null, textClass: null, description: "Description for Task H1", difficulty: "hard" },
    // ...
];

function generateRandomNumberTask() {
    const randomNumber = Math.floor(Math.random() * 1010) + 1;
    return {
        name: `Pokédex #${randomNumber}`,
        image: `images/pokemon/normal/${randomNumber}.png`,
        description: `Få pokemonen med Pokédex ID #${randomNumber}`,
        difficulty: "hard" // you can set the difficulty as per your choice
    };
}

function generateRandomRangeTask() {
    const startNumber = Math.floor(Math.random() * 1000) + 1;  // 1006 ensures we don't exceed 1010 when adding 4
    const endNumber = startNumber + 9;
    return {
        name: `Pokédex #${startNumber}-${endNumber}`,
        image: `images/badges/14.png`,  // No specific image as it's a range
        text: null,
        textClass: null,
        description: `Fang en pokemon med Pokédex ID mellom #${startNumber} og #${endNumber}`,
        difficulty: "medium" 
    };
}

const difficultyConfig = {
    easy: {
        easy: 19,
        medium: 5,
        hard: 0,
        randomRange: 0,
        random: 0
    },
    medium: {
        easy: 5,
        medium: 10,
        hard: 0,
        randomRange: 9, 
        random: 0  // 5 random number tasks for medium difficulty
    },
    hard: {
        easy: 0,
        medium: 9,
        hard: 0,
        randomRange: 8, 
        random: 7 // 12 random number tasks for hard difficulty
    },
    extreme: {
        easy: 0,
        medium: 0,
        hard: 0,
        randomRange: 14,
        random: 10 // 12 random number tasks for hard difficulty
    }
};


function generateCard() {
    const difficulty = document.getElementById("difficulty").value;
    const config = difficultyConfig[difficulty];

    let availableTasks = [];

    // Add tasks based on configuration
    availableTasks = availableTasks.concat(shuffleArray(tasks.filter(task => task.difficulty === "easy")).slice(0, config.easy));
    availableTasks = availableTasks.concat(shuffleArray(tasks.filter(task => task.difficulty === "medium")).slice(0, config.medium));
    availableTasks = availableTasks.concat(shuffleArray(tasks.filter(task => task.difficulty === "hard")).slice(0, config.hard));
    availableTasks = availableTasks.concat(shuffleArray(tasks.filter(task => task.difficulty === "extreme")).slice(0, config.extreme));

    // Add random tasks
    for (let i = 0; i < config.random; i++) {
        availableTasks.push(generateRandomNumberTask());
    }

        // Add random range tasks
    for (let i = 0; i < config.randomRange; i++) {
        availableTasks.push(generateRandomRangeTask());
    }

    const cardTasks = shuffleArray(availableTasks).slice(0, 24);

    const table = document.getElementById("bingoCard");
    table.innerHTML = '';

    for (let i = 0; i < 5; i++) {
        const row = document.createElement("tr");
        for (let j = 0; j < 5; j++) {
            const cell = document.createElement("td");

            // If center box
            if (i === 2 && j === 2) {
                cell.innerHTML = `<img src="images/compass.png" alt="Free Space"><br>FREE SPACE`;
                cell.classList.add("free-space");
            } else {
                const taskIndex = (i * 5 + j) < 12 ? i * 5 + j : i * 5 + j - 1;
                const task = cardTasks[taskIndex];
                if (task) {
                    let visualContent = ''; 
                
                    if (task.image) {
                        visualContent = `<img src="${task.image}" alt="${task.name}">`;
                    } else if (task.text) {
                        visualContent = `<span class="${task.textClass || ''}">${task.text}</span>`;
                    }
                
                    cell.innerHTML = `
                        ${visualContent}
                        <br>${task.name}
                        <br><span class="task-description">${task.description}</span>`;
                }
            }

            // Toggle background on click
            cell.addEventListener("click", function() {
                if (!this.classList.contains("free-space")) {
                    if (this.classList.contains("toggled")) {
                        this.classList.remove("toggled");
                    } else {
                        this.classList.add("toggled");
                    }
                }
            });

            row.appendChild(cell);
        }
        table.appendChild(row);
    }
}




function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}
