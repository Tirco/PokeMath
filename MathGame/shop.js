//Load the prices of all elements.

const shinyMaxLevel = 150;
const legendMaxLevel = 15;
const mythicMaxLevel = 25;
const coinMaxLevel = 150;
const shinyBasePrice = 100;
const legendBasePrice = 1000;
const mythicBasePrice = 2000;
const coinBasePrice = 200;

/**
 * Load in all elements of the shop. 
 * Update the pricing and button colors.
 */
function loadShopLocal(){
    
    //Load the background-carousel
    var carouselObjects = document.getElementsByClassName("carousel-caption");
    for(var i = 0; i < carouselObjects.length; i++){
        element = carouselObjects[i];
        id = element.id;
        var buyButton = element.querySelector('.buy');
        var useButton = element.querySelector('.use');
        var priceTag = element.querySelector('.pricetag');
        price = -1;
        if(priceTag != null) {
            price = Number((priceTag.getAttribute('data-price')+ " ").replace(" ",""));
        }
        
        if(shopOptions.boughtBackgrounds.includes(id) || price === -1) {
            buyButton.classList.add("disabled");
            useButton.classList.remove("disabled");
        } else {
            if(price <= state.totalScore) {
                buyButton.classList.remove("disabled");
            } else {
                buyButton.classList.add("disabled");
            }
            
            useButton.classList.add("disabled");
        }
    }

    //Load playerIcon carousel
    var carouselObjects = document.getElementsByClassName("carousel-playericon-caption");
    for(var i = 0; i < carouselObjects.length; i++){
        element = carouselObjects[i];
        id = element.id;
        var buyButton = element.querySelector('.buy');
        var useButton = element.querySelector('.use');
        var priceTag = element.querySelector('.pricetag');
        price = -1;
        if(priceTag != null) {
            price = Number((priceTag.getAttribute('data-price')+ " ").replace(" ",""));
        }
        
        if(shopOptions.boughtPlayerIcons.includes(id) || price === -1) {
            buyButton.classList.add("disabled");
            useButton.classList.remove("disabled");
        } else {
            if(price <= state.totalScore) {
                buyButton.classList.remove("disabled");
            } else {
                buyButton.classList.add("disabled");
            }
            
            useButton.classList.add("disabled");
        }
    }

    //Load the upgrade buttons
    var shopObjects = document.getElementsByClassName("shopObject");
    for(var i = 0; i < shopObjects.length; i++){
        element = shopObjects[i];
        var priceTag = element.querySelector('.pricetag');
        var levelIndicator = element.querySelector('.levelIndicator');
        price = -1;
        level = 0;
        maxLevel = -1;

        if(levelIndicator != null) {
            level = Number(priceTag.getAttribute('data-level'));

            if(priceTag != null) {
                price = Number((priceTag.getAttribute('data-price')+ " ").replace(" ",""));
            }

            if(levelIndicator.classList.contains("shinyLevel")) {
                maxLevel = shinyMaxLevel;
                level = shopOptions.shinyLevel;
                levelIndicator.dataset.level =  level;
                price = Math.ceil((shinyBasePrice * (level ** 1.3))/100)*100 + shinyBasePrice;
                priceTag.dataset.price = price;
            } else if(levelIndicator.classList.contains("mythicLevel")) {
                maxLevel = mythicMaxLevel;
                level = shopOptions.mythicLevel;
                levelIndicator.dataset.level =  level;
                price = Math.ceil((mythicBasePrice * (level ** 1.3))/100)*100 + mythicBasePrice;
                priceTag.dataset.price = price;
            } else if(levelIndicator.classList.contains("legendLevel")) {
                maxLevel = legendMaxLevel;
                level = shopOptions.legendLevel;
                levelIndicator.dataset.level =  level;
                price = Math.ceil((legendBasePrice * (level ** 1.3))/100)*100 + legendBasePrice;
                priceTag.dataset.price = price;
            } else if(levelIndicator.classList.contains("coinLevel")) {
                maxLevel = coinMaxLevel;
                level = shopOptions.coinLevel;
                levelIndicator.dataset.level =  level;
                if(level < 50) {
                    price = Math.ceil((coinBasePrice * (level ** 1.1))/100)*100 + coinBasePrice;
                } else {
                    price = Math.ceil(((coinBasePrice+20000) * ((level - 49) ** 1.3))/100)*200 + coinBasePrice;
                }
                
                priceTag.dataset.price = price;
            }
            //Do other button types.

        }

        //Update the button
        var upgButton = element.querySelector('.upgrade');
        if(state.totalScore >= price && level < maxLevel) {
            upgButton.classList.remove("disabled");
        } else {
            upgButton.classList.add("disabled");
        }

    }
}

/**
 * Used when purchasing backgrounds from the carousel.
 * @param {*} btn The button clicked.
 * @returns 
 */
function shopButtonBuy(btn){
    parent = btn.parentNode;
    id = parent.id;
    var priceTag = parent.querySelector('.pricetag');
    price = -1;
    if(priceTag != null) {
        price = Number((priceTag.getAttribute('data-price')+ " ").replace(" ",""));
    }

    if(price == -1 ) {
        console.log("Bugged Price")
        return;
    } else if(state.totalScore < price) {
        console.log("can't afford!")
        const toast = new Toast({
            text: "Du har ikke nok mynter!",
            position: "top-right",
            pauseOnHover: true,
            pauseOnFocusLoss: true,
            canClose: true,
            badToast: true,
          })
        return;
    } else if(shopOptions.boughtBackgrounds.includes(id)){
        console.log("Already bought!")
        const toast = new Toast({
            text: "Du eier allerede denne!",
            position: "top-right",
            pauseOnHover: true,
            pauseOnFocusLoss: true,
            canClose: true,
            badToast: true,
          })
        return;
    }

    //Let's buy it!
        state.totalScore -= price;
        incrementProgress(20,price);
        moneySubAnimation(price);
        
        var buyButton = parent.querySelector('.buy');
        var useButton = parent.querySelector('.use');
        buyButton.classList.add("disabled");
        useButton.classList.remove("disabled");
        shopOptions.boughtBackgrounds.push(id);
        saveAll();
        loadShop();
        loadShopLocal();
}

/**
 * Used when selecting a background to equip from the carousel
 * @param {*} btn The button clicked
 * @returns 
 */
function shopButtonUse(btn) {
    btn = btn || "empty"
    if(btn == "empty") {
        if(shopOptions.background == "") {
            return;
        }
        shopOptions.background = "";
        window.localStorage.setItem('shopBackground',JSON.stringify(""))
        loadBackground();
        const toast = new Toast({
            text: "Bakgrunnen ble fjernet!",
            position: "top-right",
            pauseOnHover: true,
            pauseOnFocusLoss: true,
            canClose: true,
            badToast: false,
          })
        return;
    }   
    parent = btn.parentNode;
    id = parent.id;
    if(shopOptions.boughtBackgrounds.includes(id)){
        if(id == shopOptions.background) {
            const toast = new Toast({
                text: "Du bruker allerede denne bakgrunnen!",
                position: "top-right",
                pauseOnHover: true,
                pauseOnFocusLoss: true,
                canClose: true,
                badToast: true,
              })
              return;
        }
        shopOptions.background = id;
        window.localStorage.setItem('shopBackground',JSON.stringify(shopOptions.background))
        loadBackground();
        const toast = new Toast({
            text: "Bakgrunnen ble endret!",
            position: "top-right",
            pauseOnHover: true,
            pauseOnFocusLoss: true,
            canClose: true,
            badToast: false,
          })

    }
}

/**
 * Used when purchasing player icons from the carousel.
 * @param {*} btn The button clicked.
 * @returns 
 */
 function playerIconButtonBuy(btn){
    parent = btn.parentNode;
    id = parent.id;
    console.log(parent.id);
    var priceTag = parent.querySelector('.pricetag');
    price = -1;
    if(priceTag != null) {
        price = Number((priceTag.getAttribute('data-price')+ " ").replace(" ",""));
    }

    if(price == -1 ) {
        console.log("Bugged Price")
        return;
    } else if(state.totalScore < price) {
        console.log("can't afford!")
        const toast = new Toast({
            text: "Du har ikke nok mynter!",
            position: "top-right",
            pauseOnHover: true,
            pauseOnFocusLoss: true,
            canClose: true,
            badToast: true,
          })
        return;
    } else if(shopOptions.boughtPlayerIcons.includes(id)){
        console.log("Already bought!")
        const toast = new Toast({
            text: "Du eier allerede denne figuren!",
            position: "top-right",
            pauseOnHover: true,
            pauseOnFocusLoss: true,
            canClose: true,
            badToast: true,
          })
        return;
    }

    //Let's buy it!
        state.totalScore -= price;
        incrementProgress(20,price);
        moneySubAnimation(price);
        
        var buyButton = parent.querySelector('.buy');
        var useButton = parent.querySelector('.use');
        buyButton.classList.add("disabled");
        useButton.classList.remove("disabled");
        shopOptions.boughtPlayerIcons.push(id);
        saveAll();
        loadShop();
        loadShopLocal();
}
/**
 * Used when selecting a background to equip from the carousel
 * @param {*} btn The button clicked
 * @returns 
 */
 function playerIconButtonUse(btn) {
    btn = btn || "empty"
    if(btn == "empty") {
        if(shopOptions.playerIcon == "") {
            return;
        }
        shopOptions.playerIcon = "";
        window.localStorage.setItem('playerIcon',JSON.stringify(""))
        loadPlayerIcon();
        const toast = new Toast({
            text: "Figuren ble fjernet!",
            position: "top-right",
            pauseOnHover: true,
            pauseOnFocusLoss: true,
            canClose: true,
            badToast: false,
          })
        return;
    }   
    parent = btn.parentNode;
    id = parent.id;
    if(shopOptions.boughtPlayerIcons.includes(id)){
        if(id == shopOptions.playerIcon) {
            const toast = new Toast({
                text: "Du bruker allerede denne figuren!",
                position: "top-right",
                pauseOnHover: true,
                pauseOnFocusLoss: true,
                canClose: true,
                badToast: true,
              })
              return;
        }
        shopOptions.playerIcon = id;
        window.localStorage.setItem('playerIcon',JSON.stringify(shopOptions.playerIcon))
        loadPlayerIcon();
        const toast = new Toast({
            text: "Figuren ble endret!",
            position: "top-right",
            pauseOnHover: true,
            pauseOnFocusLoss: true,
            canClose: true,
            badToast: false,
          })

    }
}

function shopButtonUpgrade(btn){
    parent = btn.parentNode;
    id = parent.id;
    var priceTag = parent.querySelector('.pricetag');
    var levelIndicator = parent.querySelector('.levelIndicator');
    price = -1;
    level = -1;
    maxLevel = -1;
    if(priceTag != null) {
        price = Number((priceTag.getAttribute('data-price')+ " ").replace(" ",""));
    }

    if(levelIndicator != null) {
        level = Number(priceTag.getAttribute('data-level'));

        if(priceTag != null) {
            price = Number((priceTag.getAttribute('data-price')+ " ").replace(" ",""));
        }

        if(levelIndicator.classList.contains("shinyLevel")) {
            maxLevel = shinyMaxLevel;
            level = shopOptions.shinyLevel;
        } else if(levelIndicator.classList.contains("legendLevel")) {
            maxLevel = legendMaxLevel;
            level = shopOptions.legendLevel;
        } else if(levelIndicator.classList.contains("mythicLevel")) {
            maxLevel = mythicMaxLevel;
            level = shopOptions.mythicLevel;
        } else if(levelIndicator.classList.contains("coinLevel")) {
            maxLevel = coinMaxLevel;
            level = shopOptions.coinLevel;
        }
        //Do other button types.

    }

    if(level >= maxLevel) {
        console.log("Max level reached")
        const toast = new Toast({
            text: "Du har nådd maks nivå",
            position: "top-right",
            pauseOnHover: true,
            pauseOnFocusLoss: true,
            canClose: true,
            badToast: true,
          })
        return;
    }


    if(price == -1 || level == -1 ) {
        console.log("Bugged Price or Level")
        const toast = new Toast({
            text: "Her skjedde det noe feil!",
            position: "top-right",
            pauseOnHover: true,
            pauseOnFocusLoss: true,
            canClose: true,
            badToast: true,
          })
        return;
    } else if(state.totalScore < price) {
        console.log("can't afford!")
        const toast = new Toast({
            text: "Du har ikke nok mynter!",
            position: "top-right",
            pauseOnHover: true,
            pauseOnFocusLoss: true,
            canClose: true,
            badToast: true,
          })
        return;
    }



    //Let's buy it!
        state.totalScore -= price;
        incrementProgress(20,price);

        var upgString = "Ukjent oppgradering."
        //Probably a better way to do this?
        if(levelIndicator.classList.contains("shinyLevel")) {
            shopOptions.shinyLevel ++;
            upgString = "Shiny Charm ble oppgradert til nivå " + shopOptions.shinyLevel + "!";
        } else if(levelIndicator.classList.contains("legendLevel")) {
            shopOptions.legendLevel ++;
            upgString = "Legend Lure ble oppgradert til nivå " + shopOptions.legendLevel + "!";
        } else if(levelIndicator.classList.contains("mythicLevel")) {
            shopOptions.mythicLevel ++;
            upgString = "Mythic Lure ble oppgradert til nivå " + shopOptions.mythicLevel + "!";
        } else if(levelIndicator.classList.contains("coinLevel")) {
            shopOptions.coinLevel ++;
            upgString = "Repeat Coins ble oppgradert til nivå " + shopOptions.coinLevel + "!";
        }

        moneySubAnimation(price);
        
        var upgButton = btn;
        if(level >= maxLevel || price > state.totalScore) {
            btn.classList.add("disabled");    
        }

        saveAll();
        loadShopLocal();
        const toast = new Toast({
            text: upgString,
            position: "top-right",
            pauseOnHover: true,
            pauseOnFocusLoss: true,
            canClose: true,
            badToast: false,
          })

}

function moneySubAnimation(value) {
    money = document.querySelector(".money");
    money.dataset.added = '-' + value;
	money.dataset.total = state.totalScore;
	money.textContent = "";
	if (state.totalScore) money.classList.add('animate');
  
	setTimeout(() => {
		money.classList.remove('animate');
	}, 500)
}

document.addEventListener("DOMContentLoaded", () => {
    const header = document.getElementById("topbar");
    if (header) {
        // Directly call loadAll() if the topbar element is found
        loadShopLocal();
        
    } else {
        // Optionally retry if header may take extra time to load
        log("ShopJS - Top Bar Not Found - Retrying.")
        var attempt = 0;
        const checkHeaderInterval = setInterval(() => {
            attempt ++;
            const header = document.getElementById("topbar");
            if (header) {
                log("Shop - Top Bar Finally Found after " + attempt + " attemtps - Loading initiated.")
                clearInterval(checkHeaderInterval);
                loadShopLocal();
            } else {
              log("Header not found - retrying. (" + attempt + ")")
            }
        }, 100); // Check every 100ms until header is found
    }
  });