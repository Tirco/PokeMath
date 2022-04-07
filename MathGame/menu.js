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
  var number = (Math.floor(Math.random() * (3)))+1;
  splashText.textContent = splashOptions[Math.floor(Math.random()*splashOptions.length)]
  menuOne.innerHTML = ` <div class="card-image" style="background-image: url('images/starter-${number}-1.png'); height: 128px; width: 128px; background-size: cover;">&nbsp;</div>`
  menuTwo.innerHTML = ` <div class="card-image" style="background-image: url('images/starter-${number}-2.png'); height: 128px; width: 128px; background-size: cover;">&nbsp;</div>`
  menuThree.innerHTML = ` <div class="card-image" style="background-image: url('images/starter-${number}-3.png'); height: 128px; width: 128px; background-size: cover;">&nbsp;</div>`
  menuFour.innerHTML = ` <div class="card-image" style="background-image: url('images/starter-${number}-4.png'); height: 128px; width: 128px; background-size: cover;">&nbsp;</div>`
  menuFive.innerHTML = ` <div class="card-image" style="background-image: url('images/starter-${number}-5.png'); height: 128px; width: 128px; background-size: cover;">&nbsp;</div>`
}

load()