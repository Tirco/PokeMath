const money = document.querySelector(".money")
const secretCodeActions = {
  '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824': {
    id: '1',
    action: function() {
      // Example action for 'hello'
      triggerAchievementOverlay("images/events/christmas/calendar.png", "Hello!");
    },
    repeatable: true 
  },
  '4dfa901d1e4d4c1b7cdc997042412d3b49e1cf68c8ddc8b67f9307e9295ebab8': {
    id: '2',
    action: function() {
      triggerAchievementOverlay("images/snorlax.png", "PokeMorten sier hei!");
    },
    repeatable: true
  },
  '3f3d9085d18bc8a159cba6e39516339a630b54fd31cf6e1d09b6124a282bdd1e': {
    id: '3',
    action: function() {
      triggerAchievementOverlay("images/pokemon/normal/130003.png", "UNIK Pokemon ble lagt til i PokeDexen!");
      addSpecificToPokedex("N0-U1");
    },
    repeatable: false
  },
  '37292e28d4c12e1636bc998d4ec7ff8599cfaa888ca1b48bb97922305b0dafc4': {
    id: '4',
    action: function() {
      triggerAchievementOverlay("images/events/christmas/14.png", "50.000 Mynter!");
      addMoney(50000);
    },
    repeatable: false
  },
  'd44c28606578d321df14bc205170e86c8531148cc972d30b9d8c1d0f19f35aee': {
    id: '5',
    action: function() {
      triggerAchievementOverlay("images/pokemon/normal/130004.png", "UNIK Pokemon ble lagt til i PokeDexen!");
      addSpecificToPokedex("N0-U2");
    },
    repeatable: false
  },
  '33bb607db77d2fdead7febd3c32bce186a974ca511fee822d0b711775a810158': {
    id: '6',
    action: function() {
      triggerAchievementOverlay("images/pokemon/normal/130005.png", "UNIK Pokemon ble lagt til i PokeDexen!");
      addSpecificToPokedex("N0-U3");
    },
    repeatable: false
  },
  '1bda6979fa3428879cc65019b4bac8c89e95cfeeed57315f1c07e4baea40b5db': {
    id: '7',
    action: function() {
      triggerAchievementOverlay("images/events/christmas/7.png", "10.000 Mynter!");
      addMoney(10000);
    },
    repeatable: false
  },
  'd98ee0e5f9399db9381014c9f890f896d3fcb272c2a7a521d0a13aa23085a284': {
    id: '8',
    action: function() {
      triggerAchievementOverlay("images/pokemon/normal/0.png", "ERROR!");
      addSpecificToPokedex("N0");
    },
    repeatable: false
  },
  '76a9cd20e1c5faab05fe3116c1a2e4e9c991a4fdb3ba75efa3572e2a20c0db31': {
    id: '9',
    action: function() {
      triggerAchievementOverlay("images/pokemon/normal/580.png", "Maria sier QUACK!");
    },
    repeatable: true
  },
  '2444781c3000c3e53b73fa9dc8f8a5d258e5ec0ae8fc87d2aeaf4fd3ccc52429': {
    id: '10',
    action: function() {
      triggerAchievementOverlay("images/pokemon/normal/380.png", "Latios og Latioas har blitt med i alle sine former!");
      addSpecificToPokedex("N380");
      addSpecificToPokedex("N380-1");
      addSpecificToPokedex("N381");
      addSpecificToPokedex("N381-1");
    },
    repeatable: false
  },
  '32a23cef168cbcb4e67a306ee12b4827f32387bd468ab29e0cb07e94fac3b445': {
    id: '11',
    action: function() {
      //Murkrow
      triggerAchievementOverlay("images/pokemon/normal/198.png", "MAS MAS MAS!");
    },
    repeatable: true
  },
  '6a79fb940aae31efdc1b442a58b556eed86f4bb67f1adefdf4a764e1fcfd0073': {
    id: '12',
    action: function() {
      //Murkrow
      triggerAchievementOverlay("images/pokemon/normal/198.png", "MAS MAS MAS!");
    },
    repeatable: true
  },
  'c65d912ab1899907fe337861ecdc57c411e81fdcebdaaf56c25ec12263929582': {
    id: '13',
    action: function() {
      //Fisketur
      triggerAchievementOverlay("images/pokemon/normal/130006.png", "UNIK Pokemon ble lagt til i PokeDexen!");
      addSpecificToPokedex("N235-U1");
    },
    repeatable: false
  },
  'fe642eae473f423985630311ad3f736310648736a58d8abfbf91c13e2f572dde': {
    id: '14',
    action: function() {
      //Motherlode
      triggerAchievementOverlay("images/events/christmas/14.png", "100.000 Mynter!");
      addMoney(100000);
    },
    repeatable: false
  },
  'f9896d553add9b3f183a9c7fe1fbd1823c68e417a5f2a29ef2ae3887c9697fe7': {
    id: '15',
    action: function() {
      //Fireworks
      createFireworks();
    },
    repeatable: true
  },
  '8c574c9b9ad6fe8745c3a26d9cc3e3026100cfc4cb33ae11f75b174009b27b2d': {
    id: '16',
    action: function() {
      triggerAchievementOverlay("images/pokemon/normal/130007.png", "Happy PRIDE!");
      //TODO
    },
    repeatable: true
  },
  '4291f633c77369773411d56839084c956177984fdf27768f5f330de152a26c14': {
    id: '17',
    action: function() {
      //Telt
      triggerAchievementOverlay("images/pokemon/normal/130007.png", "UNIK Pokemon ble lagt til i PokeDexen!");
      addSpecificToPokedex("N361-U1");
    },
    repeatable: false
  },
  'bc4cbdb085c1e67f940e0295e59dd6d42faafd00caf25160307f59a1a1fddee4': {
    id: '18',
    action: function() {
      //Random Legend
      var randomIndex = Math.floor(Math.random() * legendaries.length);
      var id = legendaries[randomIndex];
      triggerAchievementOverlay("images/pokemon/normal/" + id + ".png", "En tilfeldig legendarisk pokemon ble lagt til!");
      addSpecificToPokedex("N"+id);
    },
    repeatable: false
  },
  '50288ce22d2eda6392b4547917469b2c92b576365c983c27332b62d6291db196': {
    id: '19',
    action: function() {
      //Random Legend
      var randomIndex = Math.floor(Math.random() * legendaries.length);
      var id = legendaries[randomIndex];
      triggerAchievementOverlay("images/pokemon/normal/" + id + ".png", "En tilfeldig legendarisk pokemon ble lagt til!");
      addSpecificToPokedex("N"+id);
    },
    repeatable: false
  },
  '361c11eb0185bfb51e4d53d2e9e0eb22723674f1144db7803204689f4dbb1658': {
    id: '20',
    action: function() {
      //Random Legend
      var randomIndex = Math.floor(Math.random() * legendaries.length);
      var id = legendaries[randomIndex];
      triggerAchievementOverlay("images/pokemon/normal/" + id + ".png", "En tilfeldig legendarisk pokemon ble lagt til!");
      addSpecificToPokedex("N"+id);
    },
    repeatable: false
  },
  '06a02406d636a6086d2fcb50872852f756017bd5eca82f2caaf74cbb9ac6804d': {
    id: '21',
    action: function() {
      //Random Legend
      var randomIndex = Math.floor(Math.random() * legendaries.length);
      var id = legendaries[randomIndex];
      triggerAchievementOverlay("images/pokemon/normal/" + id + ".png", "En tilfeldig legendarisk pokemon ble lagt til!");
      addSpecificToPokedex("N"+id);
    },
    repeatable: false
  },
  '30af2f65e6e17f8c54d0f83941c8422f1c26e55c2794fe3a0d143ddb0467955f': {
    id: '22',
    action: function() {
      //Random Legend
      var randomIndex = Math.floor(Math.random() * legendaries.length);
      var id = legendaries[randomIndex];
      triggerAchievementOverlay("images/pokemon/normal/" + id + ".png", "En tilfeldig legendarisk pokemon ble lagt til!");
      addSpecificToPokedex("N"+id);
    },
    repeatable: false
  },
  'f79277973251841b3f56c3da414e35b73895e10e6c317f5400a74c5447ebddc1': {
    id: '23',
    action: function() {
      //Random Mythic
      var randomIndex = Math.floor(Math.random() * mythics.length);
      var id = mythics[randomIndex];
      triggerAchievementOverlay("images/pokemon/normal/" + id + ".png", "En tilfeldig mytisk pokemon ble lagt til!");
      addSpecificToPokedex("N"+id);
    },
    repeatable: false
  },
  '1066c9c11a3f338589d73ed9bcf41d9508f00cf57e2252fed840fe200ddb0049': {
    id: '24',
    action: function() {      //Random Mythic
      var randomIndex = Math.floor(Math.random() * mythics.length);
      var id = mythics[randomIndex];
      triggerAchievementOverlay("images/pokemon/normal/" + id + ".png", "En tilfeldig mytisk pokemon ble lagt til!");
      addSpecificToPokedex("N"+id);
    },
    repeatable: false
  },
  '158121f11c39405c6532d35d5fcb310312b287af72d7dc34f314ac63ef8c1e01': {
    id: '25',
    action: function() {
      //Random Shiny
      var id = Math.floor(Math.random() * pkmnNum);
      triggerAchievementOverlay("images/pokemon/shiny/" + id + ".png", "En tilfeldig shiny pokemon ble lagt til!");
      addSpecificToPokedex("S"+id);

    },
    repeatable: false
  },
  '3cbf5363949de05c69f4819b503c3763d62ac3468e03876eec0078dddcc7885c': {
    id: '26',
    action: function() {
      //Random Shiny
      var id = Math.floor(Math.random() * pkmnNum);
      triggerAchievementOverlay("images/pokemon/shiny/" + id + ".png", "En tilfeldig shiny pokemon ble lagt til!");
      addSpecificToPokedex("S"+id);
    },
    repeatable: false
  }
  // Add other hashed codes and their actions here...
};

async function hashString(string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(string);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

function getRedeemedCodes() {
  const redeemedCodesString = localStorage.getItem('redeemedCodes');
  if (redeemedCodesString) {
      return JSON.parse(redeemedCodesString);
  }
  return [];
}

function hasBeenRedeemedBefore(id) {
  const redeemedCodes = getRedeemedCodes();
  return redeemedCodes.includes(id);
}

function markAsRedeemed(id) {
  const redeemedCodes = getRedeemedCodes();
  redeemedCodes.push(id);
  localStorage.setItem('redeemedCodes', JSON.stringify(redeemedCodes));
}

function checkCode() {
  const userInput = document.getElementById("secretCodeInput").value;

  hashString(userInput).then(hash => {
      if (secretCodeActions.hasOwnProperty(hash)) {
          const codeDetails = secretCodeActions[hash];
          
          if (codeDetails.repeatable || !hasBeenRedeemedBefore(codeDetails.id)) {
              codeDetails.action();  // Execute the associated action for the redeemed code
              
              // Only mark as redeemed if it's not repeatable
              if (!codeDetails.repeatable) {
                  markAsRedeemed(codeDetails.id);
              }
              
              document.getElementById("response").innerText = "Koden ble brukt!";
          } else {
              document.getElementById("response").innerText = "Du har allerede brukt denne koden!";
          }
      } else {
          document.getElementById("response").innerText = "Ugyldig kode! Har du husket store og små bokstaver?";
      }
  });
}

function triggerAchievementOverlay(imagePath, text) {
  const notificationContainer = document.getElementById('notification-container');
  
  // Create the notification element
  const notification = document.createElement('div');
  notification.className = 'notification';
  
  // Add the image and text to the notification
  notification.innerHTML = `
      <img src="${imagePath}" alt="${text}" width="250">
      <p>${text}</p>
  `;
  
  // Append the notification to the container
  notificationContainer.appendChild(notification);
  
  // Remove the notification after the animation completes
  setTimeout(() => notificationContainer.removeChild(notification), 8000);
}

document.getElementById("secretCodeInput").addEventListener("keydown", function(event) {
  if (event.keyCode === 13) {  // 13 is the key code for Enter
      event.preventDefault();  // Prevent the default action (if any)
      checkCode();
  }
});

function addMoney(value) {
  money.dataset.added = '+' + value;
money.dataset.total = state.totalScore += value;
money.textContent = "";
statCounterAmount("update","coinsEarned",value);
if (state.totalScore) money.classList.add('animate');
  saveAll();
setTimeout(() => {
  money.classList.remove('animate');
}, 1000)
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
  const mainDiv = document.getElementsByClassName("main");
  mainDiv[0].appendChild(fireworksContainer);
}