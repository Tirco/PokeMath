
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

const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const socketUrl = `${protocol}//${window.location.host}:8080`;
const socket = new WebSocket(socketUrl);

socket.onopen = () => {
    console.log("WebSocket connection established.");
};

socket.onerror = function(error) {
    console.error("WebSocket connection error:", error);
};

socket.onclose = function(event) {
    console.log("WebSocket Closed:", event);
};


let lobbyCode;
let playerUUID;

function startSolo() {
    document.getElementById('solo-mode').style.display = 'block';
}

function hostLobby() {
    document.getElementById('host-lobby').style.display = 'block';
}

function joinLobby() {
    document.getElementById('join-lobby').style.display = 'block';
}

async function createLobby() {
    const difficulty = document.getElementById("difficulty").value;  // Assuming you have a difficulty selector
    const creatorUUID = getOrCreateUUID(); // Replace with actual UUID fetching logic
    const creatorUsername = state.username; // Replace with actual username fetching logic

    // Retrieve the password from the `lobbyPassword` input field
    const password = document.getElementById("lobbyPassword").value;

    try {
        const response = await fetch(`${window.location.protocol}//${window.location.host}/create-board`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                difficulty,
                creatorUUID,
                creatorUsername,
                password
            })
        });

        const data = await response.json();

        if (response.ok) {
            console.log("Lobby created successfully with code:", data.boardCode);
            alert("Lobby created! Code: " + data.boardCode);
            return data.boardCode;
        } else {
            console.error("Failed to create lobby:", data.error);
            alert("Failed to create lobby: " + data.error);
        }
    } catch (error) {
        console.error("Error creating lobby:", error);
        alert("Error creating lobby: " + error.message);
    }
}

function joinExistingLobby() {
    lobbyCode = document.getElementById('lobbyCode').value;
    const playerName = state.username;
    playerUUID = getOrCreateUUID();

    if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
            type: 'joinLobby',
            lobbyCode,
            playerName,
            playerUUID
        }));
    } else {
        socket.onopen = () => {
            socket.send(JSON.stringify({
                type: 'joinLobby',
                lobbyCode,
                playerName,
                playerUUID
            }));
        };
    }
}


function catchPokemon(pokemonID) {
    socket.send(JSON.stringify({
        type: 'catchPokemon',
        lobbyCode,
        playerUUID,
        pokemonID
    }));
}

function updateBingoBoard(data) {
    const { pokemonID, task } = data;
    // Logic to update the board UI
}

document.querySelectorAll('#lobby-selection button').forEach(button => {
    button.addEventListener('click', () => {
        // Hide all buttons when one is clicked
        document.getElementById('lobby-selection').style.display = 'none';

        // Display the relevant section based on the button clicked
        if (button.textContent.includes("Solo")) {
            document.getElementById('solo-mode').style.display = 'block';
            startSolo();
        } else if (button.textContent.includes("Host")) {
            document.getElementById('host-lobby').style.display = 'block';
        } else if (button.textContent.includes("Join")) {
            document.getElementById('join-lobby').style.display = 'block';
        }
    });
});
