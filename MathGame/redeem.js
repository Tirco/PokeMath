const secretCodeActions = {
  '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824': function() {
      // Example action for 'hello'
      console.log('Redemption for "hello" code executed.');
      document.getElementById("response").innerText = "Hello Code redeemed successfully!";
  },
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

function checkCode() {
  const userInput = document.getElementById("secretCodeInput").value;

  hashString(userInput).then(hash => {
      if (secretCodeActions.hasOwnProperty(hash)) {
          secretCodeActions[hash]();  // Execute the associated action for the redeemed code
      } else {
          document.getElementById("response").innerText = "Feil kode!";
          setTimeout(function() {
            window.location.href = "https://www.pokemath.online";
        }, 3000);
      }
  });
}