const tasks = [
    { id: 10001, name: "Gen I", image: null, text: null, textClass: null, description: "Fang en pokemon fra Generasjon 1. (001 - 151)", difficulty: "easy" },
    { id: 10002, name: "Gen II", image: null, text: null, textClass: null,description: "Fang en pokemon fra Generasjon 2. (152 - 251)", difficulty: "easy" },
    { id: 10003, name: "Gen III", image: null, text: null, textClass: null,description: "Fang en pokemon fra Generasjon 3. (252 - 386)", difficulty: "easy" },
    { id: 10004, name: "Gen IV", image: null, text: null, textClass: null,description: "Fang en pokemon fra Generasjon 4. (387 - 493)", difficulty: "easy" },
    { id: 10005, name: "Gen V", image: null, text: null, textClass: null,description: "Fang en pokemon fra Generasjon 5. (494 - 649)", difficulty: "easy" },
    { id: 10006, name: "Gen VI", image: null, text: null, textClass: null,description: "Fang en pokemon fra Generasjon 6. (650 - 721)", difficulty: "easy" },
    { id: 10007, name: "Gen VII", image: null, text: null, textClass: null,description: "Fang en pokemon fra Generasjon 7. (722 - 809)", difficulty: "easy" },
    { id: 10008, name: "Gen VIII", image: null, text: null, textClass: null,description: "Fang en pokemon fra Generasjon 8. (810 - 905)", difficulty: "easy" },
    { id: 10009, name: "Gen IX", image: null, text: null, textClass: null,description: "Fang en pokemon fra Generasjon 9. (906 - 1017)", difficulty: "easy" },
    { id: 10010, name: "Water-Type", image: "images/badges/4.png", text: null, textClass: null,description: "Fang en Vann-Pokemon", difficulty: "easy" },
    { id: 10011, name: "Normal-Type", image: "images/badges/1.png", text: null, textClass: null,description: "Fang en Normal-Pokemon", difficulty: "easy" },
    { id: 10012, name: "Flying-Type", image: "images/badges/5.png", text: null, textClass: null,description: "Fang en Flyve-Pokemon", difficulty: "easy" },
    { id: 10013, name: "Grass-Type", image: "images/badges/6.png", text: null, textClass: null,description: "Fang en Gress-Pokemon", difficulty: "easy" },
    { id: 10014, name: "Psychic-Type", image: "images/badges/10.png", text: null, textClass: null,description: "Fang en Psykisk-Pokemon", difficulty: "easy" },
    { id: 10015, name: "Bug-Type", image: "images/badges/13.png", text: null, textClass: null,description: "Fang en Insekt-Pokemon", difficulty: "easy" },
    { id: 10016, name: "Ground-Type", image: "images/badges/25.png", text: null, textClass: null,description: "Fang en Jord-Pokemon", difficulty: "easy" },
    { id: 10017, name: "Poison-Type", image: "images/badges/7.png", text: null, textClass: null,description: "Fang en Gift-Pokemon", difficulty: "easy" },
    { id: 10018, name: "Fire-Type", image: "images/badges/2.png", text: null, textClass: null,description: "Fang en Ild-Pokemon", difficulty: "easy" },
    { id: 10019, name: "Rock-Type", image: "images/badges/11.png", text: null, textClass: null,description: "Fang en Stein-Pokemon", difficulty: "easy" },
    { id: 10020, name: "Fighting-Type", image: "images/badges/3.png", text: null, textClass: null,description: "Fang en Sloss-Pokemon", difficulty: "easy" },
    { id: 10021, name: "Fairy-Type", image: "images/badges/18.png", text: null, textClass: null,description: "Fang en Fe-Pokemon", difficulty: "easy" },
    { id: 10022, name: "Electric-Type", image: "images/badges/8.png", text: null, textClass: null,description: "Fang en Elektrisk-Pokemon", difficulty: "easy" },
    
    // ... add more tasks similarly
    { id: 20001, name: "Steel-Type", image: "images/badges/17.png", text: null, textClass: null,description: "Fang en Stål-Pokemon", difficulty: "medium" },
    { id: 20002, name: "Dark-Type", image: "images/badges/16.png", text: null, textClass: null,description: "Fang en Mørk-Pokemon", difficulty: "medium" },
    { id: 20003, name: "Dragon-Type", image: "images/badges/14.png", text: null, textClass: null,description: "Fang en Drage-Pokemon", difficulty: "medium" },
    { id: 20004, name: "Ghost-Type", image: "images/badges/15.png", text: null, textClass: null,description: "Fang en Spøkelse-Pokemon", difficulty: "medium" },
    { id: 20005, name: "Ice-Type", image: "images/badges/12.png", text: null, textClass: null,description: "Fang en Is-Pokemon", difficulty: "medium" },
    { id: 20009, name: "Mega", image: "images/mega.png", text: null, textClass: null, description: "Fang en mega pokemon", difficulty: "medium" },
    { id: 20010, name: "Gigantamax", image: "images/gigantamax.png", text: null, textClass: null, description: "Fang en gigantamax pokemon", difficulty: "medium" },
    { id: 20011, name: "Hisuian", image: "images/hisuian_ball.png", text: null, textClass: null, description: "Fang en Hisuian pokemon", difficulty: "medium" },
    { id: 20012, name: "Alolan", image: null, text: null, textClass: null, description: "Fang en Alolan pokemon", difficulty: "medium" },
    { id: 20013, name: "Starter", image: null, text: null, textClass: null, description: "Fang en starter pokemon", difficulty: "medium" },
    { id: 20014, name: "Hund", image: null, text: null, textClass: null, description: "Fang en hundepokemon", difficulty: "medium" },
    { id: 20015, name: "Fugl", image: null, text: null, textClass: null, description: "Fang en fuglepokemon", difficulty: "medium" },
    { id: 20016, name: "Fisk", image: null, text: null, textClass: null, description: "Fang en fiskepokemon", difficulty: "medium" },
    { id: 20017, name: "Plante", image: null, text: null, textClass: null, description: "Fang en plantepokemon", difficulty: "medium" },
    // ...
    { id: 30001, name: "Shiny", image: "images/shinycharm.png", text: null, textClass: null, description: "Fang en Shiny pokemon", difficulty: "hard" },
    { id: 30002, name: "Legendary", image: "images/lure_legend.svg", text: null, textClass: null, description: "Fang en legendarisk pokemon", difficulty: "hard" },
    { id: 30003, name: "Mythic", image: "images/lure.svg", text: null, textClass: null, description: "Fang en mytisk pokemon", difficulty: "hard" },
    // ...
];

function generateRandomNumberTask() {
    const randomNumber = Math.floor(Math.random() * 1010) + 1;
    return {
        id: 50000 + randomNumber,
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
        id: 40000 + startNumber,
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
        random: 0
    },
    hard: {
        easy: 0,
        medium: 9,
        hard: 0,
        randomRange: 8, 
        random: 7
    },
    extreme: {
        easy: 0,
        medium: 0,
        hard: 0,
        randomRange: 14,
        random: 10
    }
};
