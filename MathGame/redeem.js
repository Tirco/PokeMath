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