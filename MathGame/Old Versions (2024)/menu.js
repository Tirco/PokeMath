const snowflakes = document.querySelector(".snowflakecontainer");
const menuOne = document.getElementById("menu-image-1")
const menuTwo = document.getElementById("menu-image-2")
const menuThree = document.getElementById("menu-image-3")
const menuFour = document.getElementById("menu-image-4")
const menuFive = document.getElementById("menu-image-5")
const splashOptions = ["Gotta solve 'em all!",
"Created by Tirco",
"Almost as fun as coding!",
"Have you tried Minecraft?",
"Shiny!",
"Legendary!",
"Mythic!",
"Pikachu! I choose you!",
"I want to be the very best.",
"MewTwo is cool.",
"Team Rocket blasting off at the speed of light!",
"Surrender now or prepare to fight!",
"Me, give up? No way!",
"I am the Flaming Moltres!",
"Let's make our pokédex bigger!",
"We hope to see you again!",
"Let's Go!",
"“Wherever there is number, there is beauty.”-Proclus",
"“The only way to learn mathematics is to do mathematics.”- Paul R. Halmos.",
"Throw a pokéball at it!",
"“Pure mathematics is the world’s best game.”- Richard J. Trudeau.",
"Why are all of these in English?",
"Made in Norway!",
"ERROR is a secret code!",
"All The Things That Happen Each Day...Every One Of Them Matters.",
"Everybody Makes A Wrong Turn Once In A While.",
"Do You Always Need A Reason To Help Somebody?",
"Hey, I'll Use My Trusty Frying Pan As A Drying Pan.",
"I Wanna Make Friends With All The Pokemon In The World.",
"You Can't Expect To Win Every Single Battle...","Now with BADGES!",
"“Err...my name is...Tom Ato!” - Ash",
"“What!? Err...well...my name is Ann...Chovi.” - Misty",
"“And my name is Caesar Salad.” – Brock",
"Catch 'em all... variables!",
"Where parabolas and Pikachu meet!",
"Fractionally better than the rest!",
"sqrt(-1) is an imaginary friend!",
"It's super effective... at math!",
"Where Charizard meets calculus!",
"Integrating Pidgeys!","Limit does not exist... but Mewtwo does!",
"Evolving your brain cells!",
"Factor your Polynomials, not your Pokéballs!",
"Beware the wild Math Problem!",
"A wild Math Problem appeared!",
"Mew and Math: A perfect pair!",
"Alakazam knows the answer!",
"Solve for x... and for Exeggcute!",
"Rare Candies not included!",
"Now with 151% more fun!",
"Adding up to a Pokémon adventure!",
"Subtract your doubts, multiply your fun!",
"Where Multiplication meets Mudkip!",
"Dive into Division with Dewgong!",
"Pikachu + Raichu = Electrifying fun!",
"Growlithe minus Fire Stone = No Arcanine!",
"Multiply your Pokédex entries!",
"Add a Potion, subtract the damage!",
"Bulbasaur knows addition by Photosynthesis!",
"Meowth's Pay Day adds more coins!",
"Geodude + Graveler, it's a multiplication evolution!",
"Subtracting HP with every Tackle!",
"Charmander times Charizard equals... wait, that's not right!",
"Eevee's evolutions divide and conquer!",
"Multiplying Metapods, hope you have enough Tackle!",
"Psyduck's headache? Must've been a division problem!",
"Add up your badges to become the Champion!",
"Subtract the competition, multiply your victories!",
"Gengar's Lick divides your health!",
"Catch two Magikarp; it's simple multiplication!",
"Squirtle + Water Gun, wet math ahead!",
"Join the arithmetic Elite Four challenge!",
"Jigglypuff divides your team... by putting half to sleep!",
"Nidoking knows the division of his kingdom!",
"Growlithe ate my homework!"
]
const splashText = document.getElementById("logotext")

function load(){
  //Check date
  const d = new Date();
  let month = d.getMonth();
  if(month == 9) { //Måned 9 = oktober
    let eventSplashes = ["Spoopy Season!",
    "Spooky Season!",
    "Ghastly, I choose you!",
    "Happy Halloween!",
    "Spooky numbers?",
    "Boo! Did I scare you?",
    "Gengar! I choose you!",
    "Spooky Scary Skeletons!",
    "Hatch the egg!","October <3!",
    "It's the Nightmare before Christmas!",
    "This is halloween!",
    "Trick or treat!",
    "Don't let math scare you – catch 'em all!",
    "Mimikyu's disguise hides a world of numbers.",
    "Use a Dusk Stone to evolve your equations!",
    "Beware of the MissingNo. in your calculations!",
    "Mimikyu's mimicry mocks mathematical mistakes!"];
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