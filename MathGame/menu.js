const snowflakes = document.querySelector(".snowflakecontainer");
const menuOne = document.getElementById("menu-image-1")
const menuTwo = document.getElementById("menu-image-2")
const menuThree = document.getElementById("menu-image-3")
const menuFour = document.getElementById("menu-image-4")
const menuFive = document.getElementById("menu-image-5")
const splashOptions = ["Gotta solve 'em all!","Created by Tirco","Almost as fun as coding!",
"Have you tried Minecraft?","Shiny!","Legendary!","Mythic!","Pikachu! I choose you!","I want to be the very best.",
"MewTwo is cool.","Team Rocket blasting off at the speed of light!","Surrender now or prepare to fight!","Me, give up? No way!",
"I am the Flaming Moltres!","Let's make our pokédex bigger!","We hope to see you again!","Let's Go!",
"“Wherever there is number, there is beauty.”-Proclus","“The only way to learn mathematics is to do mathematics.”- Paul R. Halmos.",
"Throw a pokéball at it!","“Pure mathematics is the world’s best game.”- Richard J. Trudeau.",
"Why are all of these in English?"]
const splashText = document.getElementById("logotext")

function load(){
  //Check date
  const d = new Date();
  let month = d.getMonth();
  if(month == 9) { //Måned 9 = oktober
    let eventSplashes = ["Spoopy Season!","Spooky Season!","Ghastly, I choose you!",
    "Happy Halloween!","Spooky numbers?","Boo! Did I scare you?","Gengar! I choose you!","Spooky Scary Skeletons!",
    "Hatch the egg!","October <3!","It's the Nightmare before Christmas!","This is halloween!","Trick or treat!"];
    splashText.textContent = eventSplashes[Math.floor(Math.random()*eventSplashes.length)]
    let logo = document.getElementById("logo");
    logo.style.backgroundImage="url(images/logo-halloween.png)";
  } else if(month == 11) { //Måned 11 = desember
    let eventSplashes = ["Ho Ho Ho!","Merry Christmas!","X-Mas Time!","Santa Delibird is coming to town!","Now with falling snow!",
    "Build a Snowman Pikachu!","Check out our Christmas Calendar!","Free presents for patient players!","Have you met St. Nick?",
    "Give PokeMorten a x-mas hug!","Hot Chocolate, anyone?","Christmas Spirit! I choose you!","What if Santa Clause is a pokemon?",
    "December is here!","31 Days of Joy!","Tell Santa I've been nice!","Ugly Christmas sweaters are awesome!"];
    splashText.textContent = eventSplashes[Math.floor(Math.random()*eventSplashes.length)]
    for(let i = 0; i < 10; i++) {
      snowflakes.innerHTML += '<div class="fallingsnowflake">❅</div>';
    }
    document.getElementById("xmas").classList.remove("is-hidden");
    logo.style.backgroundImage="url(images/logo-christmas.png)";
  } else {
    splashText.textContent = splashOptions[Math.floor(Math.random()*splashOptions.length)]
  }
  var number = (Math.floor(Math.random() * (3)))+1;
  menuOne.innerHTML = ` <div class="card-image" style="background-image: url('images/starter-${number}-1.png'); height: 128px; width: 128px; background-size: cover;">&nbsp;</div>`
  menuTwo.innerHTML = ` <div class="card-image" style="background-image: url('images/starter-${number}-2.png'); height: 128px; width: 128px; background-size: cover;">&nbsp;</div>`
  menuThree.innerHTML = ` <div class="card-image" style="background-image: url('images/starter-${number}-3.png'); height: 128px; width: 128px; background-size: cover;">&nbsp;</div>`
  menuFour.innerHTML = ` <div class="card-image" style="background-image: url('images/starter-${number}-4.png'); height: 128px; width: 128px; background-size: cover;">&nbsp;</div>`
  menuFive.innerHTML = ` <div class="card-image" style="background-image: url('images/starter-${number}-5.png'); height: 128px; width: 128px; background-size: cover;">&nbsp;</div>`
}

function closeAlert() {
  document.getElementById("alertbox").style.display = "none"
}

load()