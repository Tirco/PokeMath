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
    { id: 20018, name: "Katt", image: null, text: "🐱", textClass: null, description: "Fang en kattepokemon", difficulty: "medium" },
    { id: 20019, name: "Mus", image: null, text: "🐭", textClass: null, description: "Fang en mus- eller rottepokemon", difficulty: "medium" },
    { id: 20020, name: "Eeveelution", image: "images/pokemon/normal/133.png", text: null, textClass: null, description: "Fang en Eevee eller en av dens evolusjoner", difficulty: "medium" },
    { id: 20021, name: "Alien", image: null, text: "👽", textClass: null, description: "Fang en pokemon fra en annen dimensjon (kosmisk eller Ultra Beast)", difficulty: "medium" },
    { id: 20022, name: "Maskin", image: null, text: "⚙️", textClass: null, description: "Fang en maskin-pokemon (robot, pokéball eller mekanisk)", difficulty: "medium" },
    { id: 20023, name: "Gårdsdyr", image: null, text: "🐄", textClass: null, description: "Fang en pokemon basert på et gårdsdyr (ku, sau, hest, osv.)", difficulty: "medium" },
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
    },
    unik: {
        easy: 0,
        medium: 0,
        hard: 0,
        randomRange: 0,
        random: 0,
        uniqueIds: 24  // special flag — handled separately in buildTaskBoard
    }
};

// --- AUTO-RULES ---------------------------------------------------------------
// This makes tasks self-describing so the server can match them reliably.

function attachRulesToTasks(tasksArr) {
    for (const t of tasksArr) {
      if (!t || typeof t !== "object") continue;
      if (t.id === -1) continue;
  
      // Gen tasks
      if (t.id >= 10001 && t.id <= 10009) {
        t.rule = { kind: "gen", gen: t.id - 10000 };
        continue;
      }
  
      // Type tasks (easy + medium types)
      // Examples: "Water-Type", "Steel-Type" etc.
      if ((t.id >= 10010 && t.id <= 10022) || (t.id >= 20001 && t.id <= 20005)) {
        const name = String(t.name || "").toLowerCase(); // "water-type"
        const type = name.split("-")[0];                 // "water"
        t.rule = { kind: "type", type };
        continue;
      }
  
      // Feature tasks (you already have these IDs)
      if (t.id === 20009) { t.rule = { kind: "flag", flag: "mega" }; continue; }
      if (t.id === 20010){ t.rule = { kind: "flag", flag: "gmax" }; continue; }
      if (t.id === 20011){ t.rule = { kind: "flag", flag: "hisuian" }; continue; }
      if (t.id === 20012){ t.rule = { kind: "flag", flag: "alolan" }; continue; }
  
      // Category tasks
      if (t.id === 20013){ t.rule = { kind: "category", category: "starter" }; continue; }
      if (t.id === 20014){ t.rule = { kind: "category", category: "dog" }; continue; }
      if (t.id === 20015){ t.rule = { kind: "category", category: "bird" }; continue; }
      if (t.id === 20016){ t.rule = { kind: "category", category: "fish" }; continue; }
      if (t.id === 20017){ t.rule = { kind: "category", category: "plant" }; continue; }
      if (t.id === 20018){ t.rule = { kind: "category", category: "cat" }; continue; }
      if (t.id === 20019){ t.rule = { kind: "category", category: "mouse" }; continue; }
      if (t.id === 20020){ t.rule = { kind: "category", category: "eevee" }; continue; }
      if (t.id === 20021){ t.rule = { kind: "category", category: "alien" }; continue; }
      if (t.id === 20022){ t.rule = { kind: "category", category: "machine" }; continue; }
      if (t.id === 20023){ t.rule = { kind: "category", category: "farm" }; continue; }
  
      // Shiny / Legendary / Mythic
      if (t.id === 30001){ t.rule = { kind: "flag", flag: "shiny" }; continue; }
      if (t.id === 30002){ t.rule = { kind: "flag", flag: "legendary" }; continue; }
      if (t.id === 30003){ t.rule = { kind: "flag", flag: "mythic" }; continue; }
  
      // If it's one of the generated tasks that got stored, keep as-is (rule may be already present)
      // Otherwise: leave t.rule undefined (server will fallback)
    }
  }
  
  // Ensure our existing tasks get rules
  attachRulesToTasks(tasks);
  
  // Update generators to return rule as well
  const _origGenNum = generateRandomNumberTask;
  generateRandomNumberTask = function() {
    const task = _origGenNum();
    const n = task.id > 50000 ? (task.id - 50000) : null;
    if (n) task.rule = { kind: "pokedexExact", id: n };
    return task;
  };
  
  const _origGenRange = generateRandomRangeTask;
  generateRandomRangeTask = function() {
    const task = _origGenRange();
    // your generator creates id = 40000 + start
    const start = task.id - 40000;
    const end = start + 9;
    task.rule = { kind: "pokedexRange", start, end };
    return task;
  };
  
  // CommonJS export for Node, without breaking browser usage
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { tasks, generateRandomNumberTask, generateRandomRangeTask, difficultyConfig, generateUniqueIdTasks };
  }

  function generateUniqueIdTasks(count) {
    const used = new Set();
    while (used.size < count) used.add(Math.floor(Math.random() * 1010) + 1);
    return [...used].map(id => ({
      id: 50000 + id,
      name: `#${id}`,
      image: `images/pokemon/normal/${id}.png`,
      text: null, textClass: null,
      description: `Fang pokémon #${id}`,
      difficulty: "unik",
      rule: { kind: "pokedexExact", id }
    }));
  }


  