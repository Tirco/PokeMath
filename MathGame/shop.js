//Load the prices of all elements.

const shinyMaxLevel = 150;
const shinyBasePrice = 100;

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
            console.log("level =" + level);

            if(priceTag != null) {
                price = Number((priceTag.getAttribute('data-price')+ " ").replace(" ",""));
                console.log("price =" + price);
            }

            if(levelIndicator.classList.contains("shinyLevel")) {
                maxLevel = shinyMaxLevel;
                level = shopOptions.shinyLevel;
                levelIndicator.dataset.level =  level;
                price = Math.ceil((shinyBasePrice * (level ** 1.3))/100)*100;
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

loadShopLocal();

function shopButtonBuy(btn){
    parent = btn.parentNode;
    id = parent.id;
    console.log(parent.id);
    var priceTag = parent.querySelector('.pricetag');
    price = -1;
    if(priceTag != null) {
        price = Number((priceTag.getAttribute('data-price')+ " ").replace(" ",""));
        console.log("price = " + price);
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
        moneySubAnimation(price);
        
        var buyButton = parent.querySelector('.buy');
        var useButton = parent.querySelector('.use');
        buyButton.classList.add("disabled");
        useButton.classList.remove("disabled");
        shopOptions.boughtBackgrounds.push(id);
        saveAll();
        loadShop();
}

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
        console.log("price = " + price);
    }

    if(levelIndicator != null) {
        level = Number(priceTag.getAttribute('data-level'));

        if(priceTag != null) {
            price = Number((priceTag.getAttribute('data-price')+ " ").replace(" ",""));
        }

        if(levelIndicator.classList.contains("shinyLevel")) {
            maxLevel = shinyMaxLevel;
            level = shopOptions.shinyLevel;
        }
        //Do other button types.

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


        //Probably a better way to do this?
        if(levelIndicator.classList.contains("shinyLevel")) {
            shopOptions.shinyLevel ++;
        }

        moneySubAnimation(price);
        
        var upgButton = btn;
        if(level >= maxLevel || price > state.totalScore) {
            btn.classList.add("disabled");    
        }

        saveAll();
        loadShopLocal();
        const toast = new Toast({
            text: "Shiny Charm ble oppgradert til nivå " + shopOptions.shinyLevel + "!",
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