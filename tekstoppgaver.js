// ====== Nivåer ======
const LEVELS = [
    { key:'gronn',  name:'Grønn',      max:20,        decimals:0, preferTerminating:true },
    { key:'gul',    name:'Gul',        max:50,        decimals:1, preferTerminating:true },
    { key:'rod',    name:'Rød',        max:100,       decimals:2, preferTerminating:true },
    { key:'svart',  name:'Svart',      max:10000,     decimals:3, preferTerminating:false },
    { key:'skull',  name:'Hodeskalle', max:1000000,   decimals:4, preferTerminating:false },
  ];
  let currentLevel = 0; // 0..4
  
  // ====== Teller per nivå ======
  const STORE_KEY = 'oppg_teller_per_nivaa_v1';
  function loadCounters(){ try{ return JSON.parse(localStorage.getItem(STORE_KEY)) || [0,0,0,0,0]; }catch{ return [0,0,0,0,0]; } }
  function saveCounters(){ localStorage.setItem(STORE_KEY, JSON.stringify(counters)); }
  let counters = loadCounters();
  function updateCountersUI(){
    const el = document.getElementById('counters');
    if(!el) return;
    el.innerHTML = `Løst – <b>Grønn:</b> ${counters[0]} • <b>Gul:</b> ${counters[1]} • <b>Rød:</b> ${counters[2]} • <b>Svart:</b> ${counters[3]} • <b>Hodeskalle:</b> ${counters[4]}`;
  }
  
  function rngForLevel(){ const max = LEVELS[currentLevel].max; return {min:0,max}; }
  
  function setLevelUI(){
    const lv = LEVELS[currentLevel];
    const pill = document.getElementById('level-pill');
    if(pill){ pill.textContent = lv.name; pill.className = `pill lv-pill lv-${currentLevel}`; }
    const body = document.body;
    const gradients = [
      "linear-gradient(180deg,#064e3b,#052e22)", // Grønn
      "linear-gradient(180deg,#854d0e,#42240a)", // Gul
      "linear-gradient(180deg,#7f1d1d,#3b0a0a)", // Rød
      "linear-gradient(180deg,#111827,#0b1023)", // Svart
      "linear-gradient(180deg,#2c0e37,#0d0416)"  // Hodeskalle
    ];
    body.style.background = gradients[currentLevel] || gradients[0];
    const sel = document.getElementById('levelSelect');
    if(sel){ sel.value = String(currentLevel); }
  }
  
  // ====== Navn / utils ======
  const NAMES = [
    "Emma","Noah","Olivia","Lucas","Maja","Jakob","Nora","Filip","Ingrid","Aksel","Ella","Oliver","Hedda","Isak","Sofie","Mikkel","Thea","Lars","Jonas","Sara","Tobias","Iben","Amalie","Henrik","Sander","Mina","Leah","Emil","Matheo","Kine"
  ];
  
  const randInt = (min, max) => Math.floor(Math.random()*(max-min+1))+min;
  const choice = arr => arr[randInt(0, arr.length-1)];
  
  function findPlaceholders(str, type){
    const re = new RegExp(`<${type}_(\\d+)>`, 'g');
    const found = new Set();
    let m; while((m = re.exec(str))) found.add(Number(m[1]));
    return Array.from(found).sort((a,b)=>a-b);
  }
  
  function formatNumber(n){
    const decs = LEVELS[currentLevel].decimals;
    const rounded = Number.parseFloat(n.toFixed(decs));
    return String(rounded);
  }
  
  // Ryddig norsk for entall og "ny/nytt/nye"
  function applyGrammarAdjustments(text, nums) {
    const pluralToSingular = {
      "kort":"kort","klistremerker":"klistremerke","muffins":"muffin","epler":"eple","bær":"bær","venner":"venn","meter":"meter","kroner":"krone","mynter":"mynt","poeng":"poeng","boller":"bolle","pølser":"pølse","ballonger":"ballong","bananer":"banan","appelsiner":"appelsin","druer":"drue","sjokolader":"sjokolade","kjeks":"kjeks","flasker":"flaske","kopper":"kopp","skiver":"skive","ark":"ark","sider":"side","bilder":"bilde","kasser":"kasse","esker":"eske","lapper":"lapp","stoler":"stol","bord":"bord","bøker":"bok","katter":"katt","minutter":"minutt","sekunder":"sekund","timer":"time","trær":"tre","baller":"ball","billetter":"billett","gaver":"gave","frimerker":"frimerke","penger":"krone","glass":"glass","pizzaer":"pizza","trinn":"trinn","lag":"lag","hefter":"hefte","penner":"penn","blyanter":"blyant","viskelær":"viskelær","linjaler":"linjal","notatbøker":"notatbok","poser":"pose","kurver":"kurv","sandwicher":"sandwich","kjøttboller":"kjøttbolle","pannekaker":"pannekake","vafler":"vaffel","båter":"båt","biler":"bil"
    };
    const neuterNouns = new Set(["kort","eple","bilde","glass","ark","tre","frimerke","klistremerke","poeng","kjeks","egg","barn"]);
  
    text = text.replace(/\b1 nye (\w+)/g, (m, noun) => {
      const base = (pluralToSingular[noun] || noun);
      const adj = neuterNouns.has(base) ? "nytt" : "ny";
      return `1 ${adj} ${base}`;
    });
    text = text.replace(/\b1 (\w+)\b/g, (m, noun) => {
      const base = (pluralToSingular[noun] || noun);
      return `1 ${base}`;
    });
    return text
      .replace(/\b1 muffins\b/g, "1 muffin")
      .replace(/\b1 kroner\b/g, "1 krone")
      .replace(/\b1 meter\b/g, "1 meter");
  }
  
  function parseUserNumber(str){
    if(!str) return NaN;
    const normalized = str.replace(/\s+/g,'').replace(',', '.');
    return Number(normalized);
  }
  
  // ====== Oppgavesett per nivå ======
  const LEVEL_SETS = {
    0: [ // Grønn (0–20)
        { id:'g_story_01', op:'add',
            text:'Etter skolen gikk <name_1> og <name_2> innom nærbutikken for å kjøpe klistremerker til klassens plakater. <name_1> fant <num_1> klistremerker, og <name_2> fant <num_2>. I klassen er de <num_3> elever, og plakaten skal henge oppe klokken <num_4> i dag.\n\nHvor mange klistremerker har de til sammen?',
            formula:'n1+n2',
            numRanges:{1:{min:2,max:10},2:{min:2,max:10},3:{min:12,max:20},4:{min:8,max:19}} },
          
          { id:'g_story_02', op:'sub', ensure:'n1>=n2',
            text:'I pausen delte <name_1> ut kjeks til vennene sine. I boksen lå det <num_1> kjeks, og <name_1> ga bort <num_2> kjeks. På bordet sto det <num_3> glass med saft, og leken skulle starte om <num_4> minutter.\n\nHvor mange kjeks er igjen i boksen?',
            formula:'n1-n2',
            numRanges:{1:{min:8,max:20},2:{min:1,max:8},3:{min:4,max:12},4:{min:1,max:10}} },
          
          { id:'g_story_03', op:'add',
            text:'<name_1> øvde på høytlesing hjemme. Før middag leste <name_1> <num_1> sider, i storefri leste <name_1> <num_2> sider, og etter middag leste <name_1> <num_3> sider. Boken har <num_4> kapitler til sammen.\n\nHvor mange sider leste <name_1> i dag?',
            formula:'n1+n2+n3',
            numRanges:{1:{min:1,max:6},2:{min:1,max:6},3:{min:1,max:6},4:{min:6,max:12}} },
          
          { id:'g_story_04', op:'mul',
            text:'I klasserommet gjorde de klart til foreldremøte. Det står <num_1> rader med stoler og <num_2> stoler i hver rad. På tavlen ligger det <num_3> tusjer hvis noen vil tegne noe etterpå.\n\nHvor mange stoler er satt fram?',
            formula:'n1*n2',
            numRanges:{1:{min:2,max:5},2:{min:2,max:5},3:{min:3,max:10}} },
          
          { id:'g_story_05', op:'div', ensure:'divisible',
            text:'Til fruktstund tok <name_1> med seg druer til gruppen. Det var <num_1> druer som skulle deles likt på <num_2> barn. I skapet fant de også <num_3> små skåler og <num_4> servietter.\n\nHvor mange druer får hvert barn?',
            formula:'n1/n2',
            numRanges:{1:{min:8,max:20},2:{min:2,max:5},3:{min:4,max:10},4:{min:6,max:14}} },
          
          { id:'g_story_06', op:'add',
            text:'På vei til skolen plukket <name_1> og <name_2> søppel til miljødugnaden. Først plukket de <num_1> småting ved lekeplassen, og senere fant de <num_2> ved sykkelstativet. Vaktmesteren sa at totalt var det samlet inn over <num_3> flasker i går.\n\nHvor mange ting plukket de til sammen i dag?',
            formula:'n1+n2',
            numRanges:{1:{min:2,max:9},2:{min:2,max:9},3:{min:12,max:20}} },
          
          { id:'g_story_07', op:'sub', ensure:'n1>=n2',
            text:'Før kunst og håndverk telte <name_1> fargeblyantene sine. Det var <num_1> fargeblyanter i etui­et, men etter tegningen var <num_2> lånt bort til en venn. I hylla lå det også <num_3> tusjer som klassen kan bruke senere.\n\nHvor mange fargeblyanter har <name_1> igjen i etuiet?',
            formula:'n1-n2',
            numRanges:{1:{min:10,max:20},2:{min:1,max:9},3:{min:5,max:12}} },
          
          { id:'g_story_08', op:'mul',
            text:'Klassen gjorde klar en liten utstilling. De la <num_1> bilder på hver av de <num_2> benkene i gangen. I tillegg hang det <num_3> plakater på veggen som fortalte om prosjektet.\n\nHvor mange bilder la de ut på benkene til sammen?',
            formula:'n1*n2',
            numRanges:{1:{min:2,max:5},2:{min:2,max:5},3:{min:2,max:10}} },
          
          { id:'g_story_09', op:'div', ensure:'divisible',
            text:'<name_1> bakte muffins til klassekameratene. Det ble <num_1> muffins som skulle fordeles likt på <num_2> fat. På bordet sto allerede <num_3> glass melk klare.\n\nHvor mange muffins skulle ligge på hvert fat?',
            formula:'n1/n2',
            numRanges:{1:{min:8,max:20},2:{min:2,max:5},3:{min:4,max:10}} },
          
          { id:'g_story_10', op:'add',
            text:'På stranden lette <name_1> og <name_2> etter fine skjell til naturfagsprosjektet. <name_1> fant <num_1> skjell, og <name_2> fant <num_2> skjell. Bølgene var vistnok <num_3> i høyde ifølge strandvakten.\n\nHvor mange skjell fant de til sammen?',
            formula:'n1+n2',
            numRanges:{1:{min:3,max:10},2:{min:3,max:10},3:{min:1,max:3}} },
          
          { id:'g_story_11', op:'add',
            text:'På skoleveien fant <name_1> mynter to ganger. Først fant <name_1> <num_1> kroner ved busstoppet, og senere <num_2> kroner ved biblioteket. Bussruten deres heter nummer <num_3>.\n\nHvor mange kroner fant <name_1> i alt?',
            formula:'n1+n2',
            numRanges:{1:{min:2,max:10},2:{min:1,max:8},3:{min:1,max:20}} },
          
          { id:'g_story_12', op:'div', ensure:'divisible',
            text:'I en skuff lå det <num_1> blyanter. Læreren ville legge dem i like mange esker, <num_2> esker i alt. I en annen skuff lå det dessuten <num_3> viskelær som klassen kan bruke senere.\n\nHvor mange blyanter blir det i hver eske?',
            formula:'n1/n2',
            numRanges:{1:{min:8,max:20},2:{min:2,max:5},3:{min:4,max:12}} },
            { id:'g_story_13', op:'add',
                text:'Før klassetimen gjorde <name_1> klar en plakat. I kunstvogna lå det allerede lim og saks. <name_1> fant <num_1> klistremerker i skuffen, og <name_2> fant <num_2> klistremerker i en perm. Klassen teller <num_3> elever i år.\n\nHvor mange klistremerker har de til sammen?',
                formula:'n1+n2',
                numRanges:{1:{min:2,max:10},2:{min:2,max:10},3:{min:12,max:20}} },
              
              { id:'g_story_14', op:'sub', ensure:'n1>=n2',
                text:'I fruktpausen lå det <num_1> jordbær i en bolle. <name_1> delte ut <num_2> jordbær til vennene ved bordet. På tralla ved siden av sto det <num_3> glass med melk.\n\nHvor mange jordbær er igjen i bollen?',
                formula:'n1-n2',
                numRanges:{1:{min:8,max:20},2:{min:1,max:8},3:{min:4,max:12}} },
              
              { id:'g_story_15', op:'add',
                text:'I biblioteket leste <name_1> først <num_1> sider i en faktabok og senere <num_2> sider i en tegneserie. Det er <num_3> sitteplasser ved vinduet.\n\nHvor mange sider leste <name_1> til sammen?',
                formula:'n1+n2',
                numRanges:{1:{min:2,max:10},2:{min:2,max:10},3:{min:4,max:12}} },
              
              { id:'g_story_16', op:'mul',
                text:'Til utstillingen la klassen bilder på benkene i gangen. Det ble lagt <num_1> bilder på hver benk, og de brukte <num_2> benker. På veggen hang det <num_3> plakater med forklaringer.\n\nHvor mange bilder la de ut på benkene til sammen?',
                formula:'n1*n2',
                numRanges:{1:{min:2,max:5},2:{min:2,max:5},3:{min:2,max:10}} },
              
              { id:'g_story_17', op:'div', ensure:'divisible',
                text:'<name_1> tok med <num_1> sjokoladebiter til gruppa. De skulle deles likt på <num_2> barn. I boksen lå det også <num_3> små servietter til hver bit.\n\nHvor mange sjokoladebiter får hvert barn?',
                formula:'n1/n2',
                numRanges:{1:{min:8,max:20},2:{min:2,max:5},3:{min:4,max:10}} },
              
              { id:'g_story_18', op:'add',
                text:'På vei til skolen plukket <name_1> og <name_2> søppel. Før porten fant de <num_1> småting, og ved sykkelstativet fant de <num_2>. Miljøgruppa samlet i går over <num_3> flasker.\n\nHvor mange småting plukket de i dag?',
                formula:'n1+n2',
                numRanges:{1:{min:2,max:9},2:{min:2,max:9},3:{min:12,max:20}} },
              
              { id:'g_story_19', op:'sub', ensure:'n1>=n2',
                text:'I penalet lå det <num_1> fargeblyanter. Etter tegneøkten var <num_2> lånt bort til en nabo­pult. På hylla sto det <num_3> tusjer som hele klassen kan bruke.\n\nHvor mange fargeblyanter er igjen i penalet?',
                formula:'n1-n2',
                numRanges:{1:{min:10,max:20},2:{min:1,max:9},3:{min:5,max:12}} },
              
              { id:'g_story_20', op:'mul',
                text:'Til vårfesten brettet klassen papirblomster. De la <num_1> blomster i hver av <num_2> små kurver. På bordet sto <num_3> lysglass for pynt.\n\nHvor mange papirblomster lå i kurvene til sammen?',
                formula:'n1*n2',
                numRanges:{1:{min:2,max:5},2:{min:2,max:5},3:{min:2,max:8}} },
              
              { id:'g_story_21', op:'div', ensure:'divisible',
                text:'I gymtimen hadde de med erteposer. Totalt var det <num_1> erteposer som skulle deles likt på <num_2> stasjoner. I skapet fantes <num_3> kjegler til hinderløypa.\n\nHvor mange erteposer får hver stasjon?',
                formula:'n1/n2',
                numRanges:{1:{min:8,max:20},2:{min:2,max:5},3:{min:4,max:12}} },
              
              { id:'g_story_22', op:'add',
                text:'I naturfagen målte <name_1> insekter på to steder. Ved blomsterbedet telte <name_1> <num_1> marihøner, og ved hekken <num_2>. Læreren noterte også at de fant <num_3> maurtuer i området.\n\nHvor mange marihøner telte <name_1> til sammen?',
                formula:'n1+n2',
                numRanges:{1:{min:2,max:10},2:{min:2,max:10},3:{min:1,max:6}} },
              
              { id:'g_story_23', op:'sub', ensure:'n1>=n2',
                text:'I matpausen lå det <num_1> brødskiver på fatet. <name_2> tok <num_2> skiver. I en annen kurv lå det <num_3> epler som skulle deles senere.\n\nHvor mange skiver er igjen på fatet?',
                formula:'n1-n2',
                numRanges:{1:{min:10,max:20},2:{min:1,max:9},3:{min:3,max:10}} },
              
              { id:'g_story_24', op:'add',
                text:'Før korøvelsen øvde <name_1> hjemme. Før middag sang <name_1> i <num_1> minutter, og etter middag i <num_2> minutter. I salen er det <num_3> rader med stoler.\n\nHvor mange minutter øvde <name_1> til sammen?',
                formula:'n1+n2',
                numRanges:{1:{min:4,max:12},2:{min:4,max:12},3:{min:2,max:6}} },
              
              { id:'g_story_25', op:'mul',
                text:'I skolegården tegnet de ruter med kritt. Hver rad fikk <num_1> ruter, og de lagde <num_2> rader. Ved siden av lå det <num_3> hoppetau klare til lek.\n\nHvor mange ruter tegnet de til sammen?',
                formula:'n1*n2',
                numRanges:{1:{min:2,max:5},2:{min:2,max:5},3:{min:2,max:8}} },
              
              { id:'g_story_26', op:'div', ensure:'divisible',
                text:'I klassen var det <num_1> klistremerker til premie, som skulle deles likt på <num_2> grupper. Utdelingen starter om <num_3> minutter.\n\nHvor mange klistremerker får hver gruppe?',
                formula:'n1/n2',
                numRanges:{1:{min:8,max:20},2:{min:2,max:5},3:{min:1,max:10}} },
              
              { id:'g_story_27', op:'add',
                text:'På turdagen talte <name_1> fugler. Om morgenen så <name_1> <num_1> fugler, og på ettermiddagen <num_2>. Turlederen sa at stien var <num_3> kilometer lang.\n\nHvor mange fugler så <name_1> i alt?',
                formula:'n1+n2',
                numRanges:{1:{min:2,max:9},2:{min:2,max:9},3:{min:1,max:3}} },
              
              { id:'g_story_28', op:'sub', ensure:'n1>=n2',
                text:'I boksen lå det <num_1> klistrelapper. <name_1> brukte <num_2> for å merke hyller. På vogna sto <num_3> tusjer for etiketter.\n\nHvor mange klistrelapper er igjen i boksen?',
                formula:'n1-n2',
                numRanges:{1:{min:10,max:20},2:{min:1,max:9},3:{min:3,max:10}} },
              
              { id:'g_story_29', op:'add',
                text:'I vårdugnaden fikk <name_1> <num_1> kroner i pant, og <name_2> fikk <num_2> kroner. Vaktmesteren fortalte at det totalt i fjor ble samlet inn over <num_3> flasker.\n\nHvor mange kroner fikk de til sammen i år?',
                formula:'n1+n2',
                numRanges:{1:{min:5,max:12},2:{min:5,max:12},3:{min:12,max:20}} },
              
              { id:'g_story_30', op:'mul',
                text:'I musikkrommet la de rytmepinner på bordene. Hvert bord fikk <num_1> pinner, og de brukte <num_2> bord. Metronomen stod på <num_3> slag i minuttet.\n\nHvor mange rytmepinner la de ut totalt?',
                formula:'n1*n2',
                numRanges:{1:{min:2,max:5},2:{min:2,max:5},3:{min:60,max:120}} },
              
              { id:'g_story_31', op:'div', ensure:'divisible',
                text:'Til lesestunden hadde de <num_1> bokmerker som skulle fordeles likt på <num_2> elever. Læreren viste også fram <num_3> nye bøker til hylla.\n\nHvor mange bokmerker får hver elev?',
                formula:'n1/n2',
                numRanges:{1:{min:8,max:20},2:{min:2,max:5},3:{min:4,max:12}} },
              
              { id:'g_story_32', op:'add',
                text:'I kantina hjalp <name_1> og <name_2> med å sette ut frukt. <name_1> la ut <num_1> epler, og <name_2> la ut <num_2> bananer. I skapet lå det <num_3> ekstra servietter til senere.\n\nHvor mange frukter la de ut til sammen?',
                formula:'n1+n2',
                numRanges:{1:{min:3,max:10},2:{min:3,max:10},3:{min:6,max:14}} },
              
    ],
  
    1: [ // Gul (0–50)
        { id:'y_story_01', op:'add',
            text:'Til skolekafeen bakte <name_1> muffins hjemme. Først bakte <name_1> <num_1> muffins, og senere bakte <name_2> <num_2> muffins for å hjelpe. Til pynt kjøpte de <num_3> lys og <num_4> servietter til bordene.\n\nHvor mange muffins bakte de til sammen?',
            formula:'n1+n2',
            numRanges:{1:{min:10,max:25},2:{min:10,max:25},3:{min:5,max:20},4:{min:10,max:40}} },
          
          { id:'y_story_02', op:'sub', ensure:'n1>=n2',
            text:'I klassesettet med tusjer var det <num_1> tusjer da dagen startet. Etter kunst og håndverk var <num_2> lånt ut til andre klasser. I samme skap sto det <num_3> limstifter og <num_4> sakser.\n\nHvor mange tusjer er igjen i klassesettet?',
            formula:'n1-n2',
            numRanges:{1:{min:20,max:50},2:{min:5,max:20},3:{min:5,max:20},4:{min:5,max:20}} },
          
          { id:'y_story_03', op:'add',
            text:'I biblioteket leste <name_1> først <num_1> sider i en fagbok, og senere <num_2> sider i en roman. På bordet ved vinduet er det <num_3> stoler, og i dag kom det <num_4> elever innom.\n\nHvor mange sider leste <name_1> til sammen?',
            formula:'n1+n2',
            numRanges:{1:{min:8,max:20},2:{min:8,max:20},3:{min:4,max:12},4:{min:10,max:40}} },
          
          { id:'y_story_04', op:'mul',
            text:'Til utstillingen i gangen la klassen bilder på bordene. Hvert bord fikk <num_1> bilder, og de brukte <num_2> bord langs veggen. I tillegg hang de opp <num_3> plakater.\n\nHvor mange bilder ble lagt ut totalt?',
            formula:'n1*n2',
            numRanges:{1:{min:3,max:8},2:{min:4,max:8},3:{min:4,max:12}} },
          
          { id:'y_story_05', op:'div', ensure:'divisible',
            text:'I gymtimen skulle erteposene deles likt på stasjoner. Det fantes <num_1> erteposer og <num_2> stasjoner. I skapet var det dessuten <num_3> rockeringer til hinderløypa.\n\nHvor mange erteposer fikk hver stasjon?',
            formula:'n1/n2',
            numRanges:{1:{min:12,max:48},2:{min:3,max:8},3:{min:6,max:20}} },
          
          { id:'y_story_06', op:'add',
            text:'Til naturfagseksperimentet trengte gruppa målinger. Om morgenen registrerte de <num_1> små observasjoner ute i skolegården, og etter lunsj registrerte de <num_2> til. Læreren noterte også at de fant <num_3> typer blader.\n\nHvor mange observasjoner registrerte de i dag?',
            formula:'n1+n2',
            numRanges:{1:{min:6,max:18},2:{min:6,max:18},3:{min:3,max:10}} },
          
          { id:'y_story_07', op:'sub', ensure:'n1>=n2',
            text:'I matvogna var det <num_1> brødskiver ferdig smurt til klassen. Da pausen var over, var <num_2> spist opp. I tillegg ble det satt ut <num_3> glass melk og <num_4> epler.\n\nHvor mange brødskiver er igjen på matvogna?',
            formula:'n1-n2',
            numRanges:{1:{min:20,max:50},2:{min:5,max:20},3:{min:10,max:30},4:{min:10,max:30}} },
          
          { id:'y_story_08', op:'mul',
            text:'I musikkrommet ble det lagt rytmepinner ut. Hver pult fikk <num_1> pinner, og det var <num_2> pulter i bruk denne timen. Metronomen sto på <num_3> slag i minuttet.\n\nHvor mange rytmepinner ble lagt ut i alt?',
            formula:'n1*n2',
            numRanges:{1:{min:3,max:6},2:{min:5,max:8},3:{min:60,max:120}} },
          
          { id:'y_story_09', op:'div', ensure:'terminating',
            text:'På skolekjøkkenet ble en deig delt likt. Deigen veide <num_1> hekto til sammen, og den skulle deles på <num_2> elever. I skapet var det <num_3> forklær.\n\nHvor mye deig fikk hver elev (hekto)?',
            formula:'n1/n2',
            numRanges:{1:{min:20,max:40},2:{min:2,max:10},3:{min:8,max:20}} },
          
          { id:'y_story_10', op:'add',
            text:'I løpet av uka samlet <name_1> inn plast til gjenvinning. Mandag ble det <num_1> flasker, og tirsdag <num_2> flasker. I fjor samlet klassen over <num_3> flasker i samme periode.\n\nHvor mange flasker samlet <name_1> mandag og tirsdag?',
            formula:'n1+n2',
            numRanges:{1:{min:10,max:25},2:{min:10,max:25},3:{min:20,max:50}} },
          
          { id:'y_story_11', op:'sub', ensure:'n1>=n2',
            text:'I skriveskuffen lå det <num_1> notatbøker. Etter norskfaget ble <num_2> delt ut til gruppene. I hylla ved siden av ligger det <num_3> permer.\n\nHvor mange notatbøker er fortsatt i skuffen?',
            formula:'n1-n2',
            numRanges:{1:{min:20,max:50},2:{min:5,max:20},3:{min:5,max:20}} },
          
          { id:'y_story_12', op:'mul',
            text:'Til utendørsleker ble kjegler satt opp i rekker. Hver rekke fikk <num_1> kjegler, og de lagde <num_2> rekker. I boden var det <num_3> ekstra tau til hoppetaukonkurransen.\n\nHvor mange kjegler ble satt opp i alt?',
            formula:'n1*n2',
            numRanges:{1:{min:3,max:7},2:{min:4,max:8},3:{min:6,max:20}} },
          
          { id:'y_story_13', op:'div', ensure:'divisible',
            text:'I bibliotekskassen lå det <num_1> bokmerker som skulle fordeles likt på <num_2> klasser. Samtidig kom det inn <num_3> nye bøker i hylla.\n\nHvor mange bokmerker fikk hver klasse?',
            formula:'n1/n2',
            numRanges:{1:{min:12,max:48},2:{min:3,max:8},3:{min:6,max:20}} },
          
          { id:'y_story_14', op:'add',
            text:'I orkesterøving øvde <name_1> i to økter. Før lunsj spilte <name_1> i <num_1> minutter, og etter lunsj i <num_2> minutter. Det var <num_3> elever i ensemblet i dag.\n\nHvor mange minutter øvde <name_1> til sammen?',
            formula:'n1+n2',
            numRanges:{1:{min:8,max:20},2:{min:8,max:20},3:{min:10,max:40}} },
          
          { id:'y_story_15', op:'sub', ensure:'n1>=n2',
            text:'Klasserommet hadde <num_1> markører ved starten av uken. Etter to dager var <num_2> markører tomme. På lærerbordet lå det <num_3> whiteboard-svamper.\n\nHvor mange markører virker fortsatt?',
            formula:'n1-n2',
            numRanges:{1:{min:20,max:50},2:{min:5,max:20},3:{min:2,max:8}} },
          
          { id:'y_story_16', op:'mul',
            text:'Til matte-verkstedet ble det laget stasjoner. Hver stasjon fikk <num_1> kort, og det var satt opp <num_2> stasjoner. Det kom <num_3> foreldre på besøk i timen.\n\nHvor mange kort ble lagt ut totalt?',
            formula:'n1*n2',
            numRanges:{1:{min:3,max:8},2:{min:4,max:8},3:{min:10,max:40}} },
          
          { id:'y_story_17', op:'div', ensure:'terminating',
            text:'Et tau på <num_1> meter klippes i <num_2> like deler til en lengdelek i skolegården. I tillegg ble <num_3> kjegler satt ut som merker.\n\nHvor lang blir hver del (meter)?',
            formula:'n1/n2',
            numRanges:{1:{min:20,max:50},2:{min:2,max:10},3:{min:6,max:20}} },
          
          { id:'y_story_18', op:'add',
            text:'På klassefesten ble det lagt ut frukt. Først la <name_1> ut <num_1> fruktbiter, og så la <name_2> ut <num_2> til. Ved siden av sto det <num_3> glass og <num_4> tallerkener.\n\nHvor mange fruktbiter ble lagt ut til sammen?',
            formula:'n1+n2',
            numRanges:{1:{min:10,max:25},2:{min:10,max:25},3:{min:10,max:40},4:{min:10,max:40}} },
          
          { id:'y_story_19', op:'sub', ensure:'n1>=n2',
            text:'I garderoben var det <num_1> jakker på knaggene før friminuttet. Da timen startet igjen, var <num_2> hentet av elevene. Antall sko i hylla var <num_3>.\n\nHvor mange jakker henger fortsatt på knaggene?',
            formula:'n1-n2',
            numRanges:{1:{min:20,max:50},2:{min:5,max:20},3:{min:10,max:40}} },
          
          { id:'y_story_20', op:'add',
            text:'På turplanleggingen regnet klassen med utgifter. Først satte de av <num_1> kroner til buss, og senere <num_2> kroner til inngang. Lunsjpakker ble bestilt til <num_3> elever.\n\nHvor mange kroner er satt av til buss og inngang til sammen?',
            formula:'n1+n2',
            numRanges:{1:{min:15,max:30},2:{min:15,max:30},3:{min:10,max:35}} },
    ],
  
    2: [ // Rød (0–100)
        { id:'r_story_01', op:'add',
            text:'Til klasseavisa samlet <name_1> inn bilder fra turen. Før lunsj fikk <name_1> inn <num_1> bilder, og etter lunsj kom det <num_2> til. Redaksjonen består av <num_3> elever som sorterer bildene.\n\nHvor mange bilder kom inn totalt denne dagen?',
            formula:'n1+n2',
            numRanges:{1:{min:10,max:30},2:{min:10,max:30},3:{min:4,max:10}} },
          
          { id:'r_story_02', op:'sub', ensure:'n1>=n2',
            text:'I elevrådskassen lå det <num_1> kroner ved månedens start. Etter innkjøp av pappkrus ble <num_2> kroner brukt. Det var <num_3> kr i mynt på bordet som skulle rulles.\n\nHvor mange kroner står igjen i elevrådskassen?',
            formula:'n1-n2',
            numRanges:{1:{min:40,max:100},2:{min:10,max:60},3:{min:5,max:20}} },
          
          { id:'r_story_03', op:'add',
            text:'På sykkelaksjonen registrerte <name_1> og <name_2> antall runder i skolegården. <name_1> syklet <num_1> runder og <name_2> syklet <num_2> runder. I tillegg delte læreren ut <num_3> refleksvester før start.\n\nHvor mange runder ble syklet til sammen av de to?',
            formula:'n1+n2',
            numRanges:{1:{min:12,max:35},2:{min:12,max:35},3:{min:10,max:30}} },
          
          { id:'r_story_04', op:'mul',
            text:'Til foredraget satte klassen opp stolrader. Det ble laget <num_1> rader med stoler, og hver rad fikk <num_2> stoler. Ved siden av ble det satt fram <num_3> bord til brosjyrer.\n\nHvor mange stoler ble satt ut totalt?',
            formula:'n1*n2',
            numRanges:{1:{min:4,max:12},2:{min:6,max:12},3:{min:2,max:8}} },
          
          { id:'r_story_05', op:'div', ensure:'terminating',
            text:'På skolekjøkkenet skulle de dele en stor kanne saft. Det var <num_1> desiliter saft som skulle fordeles likt på <num_2> kanner. I skapet sto det <num_3> ekstra glass til servering.\n\nHvor mange desiliter saft ble det i hver kanne?',
            formula:'n1/n2',
            numRanges:{1:{min:24,max:96},2:{min:3,max:12},3:{min:10,max:30}} },
          
          { id:'r_story_06', op:'add',
            text:'Under ryddedugnaden samlet <name_1> først <num_1> flasker, og senere <num_2> flasker. Vaktmesteren fortalte at forrige uke ble det totalt samlet inn over <num_3> flasker på hele skolen.\n\nHvor mange flasker samlet <name_1> denne dagen?',
            formula:'n1+n2',
            numRanges:{1:{min:10,max:25},2:{min:10,max:25},3:{min:40,max:100}} },
          
          { id:'r_story_07', op:'sub', ensure:'n1>=n2',
            text:'I klasserommet var det <num_1> markører som virket ved ukestart. Etter to dager var <num_2> markører tørket inn. Læreren hadde i tillegg lagt fram <num_3> nye viskelær.\n\nHvor mange markører virker fortsatt?',
            formula:'n1-n2',
            numRanges:{1:{min:40,max:90},2:{min:10,max:40},3:{min:4,max:12}} },
          
          { id:'r_story_08', op:'mul',
            text:'Til matteverkstedet laget <name_1> stasjoner med kort. Hver stasjon skulle ha <num_1> kort, og de satte opp <num_2> stasjoner. <num_3> foreldre meldte seg som hjelpere.\n\nHvor mange kort ble lagt ut totalt?',
            formula:'n1*n2',
            numRanges:{1:{min:4,max:10},2:{min:4,max:10},3:{min:5,max:20}} },
          
          { id:'r_story_09', op:'div', ensure:'divisible',
            text:'Klassen hadde <num_1> plakater som skulle fordeles likt på <num_2> grupper for presentasjon. Det kom også <num_3> gjester innom for å se utstillingen.\n\nHvor mange plakater fikk hver gruppe?',
            formula:'n1/n2',
            numRanges:{1:{min:24,max:72},2:{min:3,max:12},3:{min:10,max:40}} },
          
          { id:'r_story_10', op:'add',
            text:'I ukeprosjektet samlet <name_1> data to dager på rad. Første dag noterte <name_1> <num_1> observasjoner, og andre dag <num_2> observasjoner. På tavla sto også antall timer igjen av prosjektet: <num_3>.\n\nHvor mange observasjoner noterte <name_1> totalt?',
            formula:'n1+n2',
            numRanges:{1:{min:12,max:35},2:{min:12,max:35},3:{min:2,max:12}} },
          
          { id:'r_story_11', op:'sub', ensure:'n1>=n2',
            text:'Klassens budsjett for utstyr var <num_1> kroner. Etter innkjøp av ark og lim ble <num_2> kroner brukt. På ønskelista stod fortsatt <num_3> saker.\n\nHvor mye penger er igjen i budsjettet?',
            formula:'n1-n2',
            numRanges:{1:{min:60,max:100},2:{min:10,max:60},3:{min:3,max:12}} },
          
          { id:'r_story_12', op:'mul',
            text:'Til uteforestillingen ble det hengt opp vimpler. Hver snor fikk <num_1> vimpler, og de strakk opp <num_2> snorer. Det ble brukt <num_3> klyper i reserve.\n\nHvor mange vimpler hang de opp i alt?',
            formula:'n1*n2',
            numRanges:{1:{min:5,max:10},2:{min:5,max:10},3:{min:5,max:20}} },
          
          { id:'r_story_13', op:'div', ensure:'terminating',
            text:'En planke på <num_1> meter skulle deles i <num_2> like deler til en hinderløype i gymsalen. I boden lå det <num_3> matter klare.\n\nHvor lang blir hver del (meter)?',
            formula:'n1/n2',
            numRanges:{1:{min:24,max:96},2:{min:3,max:12},3:{min:4,max:12}} },
          
          { id:'r_story_14', op:'add',
            text:'Til korøving øvde <name_1> hjemme to ganger. Før middag sang <name_1> i <num_1> minutter, og etter middag i <num_2> minutter. Til konserten i morgen forventes det <num_3> tilhørere.\n\nHvor mange minutter øvde <name_1> denne dagen?',
            formula:'n1+n2',
            numRanges:{1:{min:10,max:30},2:{min:10,max:30},3:{min:20,max:80}} },
          
          { id:'r_story_15', op:'sub', ensure:'n1>=n2',
            text:'I skolegården ble det satt ut <num_1> kjegler før friminuttet. Etter lek ble <num_2> kjegler flyttet inn i boden igjen. På lista sto også <num_3> hoppetau.\n\nHvor mange kjegler står fortsatt ute?',
            formula:'n1-n2',
            numRanges:{1:{min:30,max:90},2:{min:10,max:45},3:{min:5,max:20}} },
          
          { id:'r_story_16', op:'mul',
            text:'I naturfag satte de opp små plantekasser. Hver kasse ble fylt med <num_1> planter, og klassen fylte <num_2> kasser. Lærerrommet hadde <num_3> ekstra vannkanner.\n\nHvor mange planter plantet de i alt?',
            formula:'n1*n2',
            numRanges:{1:{min:3,max:10},2:{min:4,max:10},3:{min:2,max:10}} },
          
          { id:'r_story_17', op:'div', ensure:'divisible',
            text:'Til leseaksjonen ble det kjøpt inn bokmerker. Det var <num_1> bokmerker som skulle deles likt på <num_2> elever i to parallelle klasser. Bibliotekaren hadde i tillegg <num_3> nye magasiner.\n\nHvor mange bokmerker fikk hver elev?',
            formula:'n1/n2',
            numRanges:{1:{min:30,max:90},2:{min:3,max:12},3:{min:4,max:20}} },
          
          { id:'r_story_18', op:'add',
            text:'Til prosjektkvelden printet <name_1> informasjonsark to runder. Første runde ble det <num_1> ark, og andre runde <num_2> ark. Skriveren har totalt <num_3> ark i magasinet.\n\nHvor mange ark ble printet til sammen av <name_1>?',
            formula:'n1+n2',
            numRanges:{1:{min:15,max:40},2:{min:15,max:40},3:{min:50,max:100}} },
          
          { id:'r_story_19', op:'sub', ensure:'n1>=n2',
            text:'I turkassa lå det <num_1> sitteunderlag før avreise. Da de kom tilbake, var <num_2> lånt bort til en annen klasse. Læreren talte også at de hadde <num_3> ekstra termoskopper.\n\nHvor mange sitteunderlag ligger igjen i turkassa?',
            formula:'n1-n2',
            numRanges:{1:{min:30,max:80},2:{min:10,max:35},3:{min:5,max:15}} },
          
          { id:'r_story_20', op:'add',
            text:'I klassens pantdugnad leverte <name_1> <num_1> flasker, og <name_2> leverte <num_2> flasker. Vaktmesteren registrerte også <num_3> poser fra parallellklassen.\n\nHvor mange flasker leverte <name_1> og <name_2> til sammen?',
            formula:'n1+n2',
            numRanges:{1:{min:12,max:35},2:{min:12,max:35},3:{min:4,max:20}} },
    ],
  
    3: [ // Svart (0–10 000)
        { id:'s_story_01', op:'add',
            text:'Til skolekorpsets innsamlingsrunde samlet <name_1> inn <num_1> kroner på formiddagen og <name_2> samlet inn <num_2> kroner etter lunsj. Totalt var det <num_3> bøsser i omløp denne dagen, og korpset har øvd i <num_4> år.\n\nHvor mye penger samlet de to inn til sammen denne dagen?',
            formula:'n1+n2',
            numRanges:{1:{min:500,max:3500},2:{min:500,max:3500},3:{min:8,max:30},4:{min:3,max:90}} },
          
          { id:'s_story_02', op:'sub', ensure:'n1>=n2',
            text:'Lageret registrerte ved månedsskiftet <num_1> varer. Etter et stort salg ble <num_2> varer sendt ut. I tillegg kom det inn <num_3> paller med utstyr til et annet prosjekt.\n\nHvor mange varer står igjen på lageret etter salget?',
            formula:'n1-n2',
            numRanges:{1:{min:4000,max:9000},2:{min:500,max:3000},3:{min:2,max:20}} },
          
          { id:'s_story_03', op:'add',
            text:'I en bokaksjon solgte <name_1> <num_1> bøker på stand ved butikken, og <name_2> solgte <num_2> bøker ved biblioteket. Plakaten deres ble trykket i <num_3> eksemplarer og delte ut flyers i <num_4> nabolag.\n\nHvor mange bøker solgte de to til sammen?',
            formula:'n1+n2',
            numRanges:{1:{min:200,max:1800},2:{min:200,max:1800},3:{min:20,max:200},4:{min:2,max:10}} },
          
          { id:'s_story_04', op:'mul',
            text:'I idrettshallen settes det opp stoler til turnstevne. Det er <num_1> rader og <num_2> stoler i hver rad. Speakerbordet trenger <num_3> mikrofoner og <num_4> reservekabler.\n\nHvor mange stoler blir satt ut totalt?',
            formula:'n1*n2',
            numRanges:{1:{min:20,max:80},2:{min:20,max:80},3:{min:2,max:8},4:{min:4,max:20}} },
          
          { id:'s_story_05', op:'div', ensure:'terminating',
            text:'Kommunen deler ut støtte likt mellom idrettslag. Den totale potten er på <num_1> kroner og skal fordeles på <num_2> lag. I tillegg har kommunen <num_3> prosjektmidler for utstyr.\n\nHvor mye får hvert lag fra støttepotten (kr)?',
            formula:'n1/n2',
            numRanges:{1:{min:20000,max:200000},2:{min:4,max:25},3:{min:5000,max:50000}} },
          
          { id:'s_story_06', op:'add',
            text:'Til klassetur samla foreldrerådet inn midler. Basaren ga <num_1> kroner, og kiosksalget ga <num_2> kroner. Det kom <num_3> besøkende innom og været var <num_4> grader.\n\nHvor mye penger kom inn totalt fra basar og kiosksalg?',
            formula:'n1+n2',
            numRanges:{1:{min:1500,max:5000},2:{min:1500,max:5000},3:{min:50,max:400},4:{min:5,max:25}} },
          
          { id:'s_story_07', op:'sub', ensure:'n1>=n2',
            text:'Et firma bestilte <num_1> t-skjorter til et arrangement. Første leveranse var forsinket, så <num_2> t-skjorter ble solgt før resten kom. Det var <num_3> selgere på stand.\n\nHvor mange t-skjorter er fortsatt på lager etter salget?',
            formula:'n1-n2',
            numRanges:{1:{min:2000,max:8000},2:{min:500,max:3000},3:{min:3,max:20}} },
          
          { id:'s_story_08', op:'mul',
            text:'På klassens loppemarked ble bøker plassert i kasser. Hver rad fikk <num_1> kasser, og det ble laget <num_2> rader. I tillegg hadde de <num_3> plakater som pekte vei og <num_4> frivillige.\n\nHvor mange kasser med bøker ble satt ut totalt?',
            formula:'n1*n2',
            numRanges:{1:{min:10,max:40},2:{min:10,max:40},3:{min:5,max:25},4:{min:8,max:40}} },
          
          { id:'s_story_09', op:'div', ensure:'terminating',
            text:'En strekning på <num_1> kilometer skal fordeles jevnt mellom <num_2> etapper i en stafett. I målområdet er det satt ut <num_3> vanndunker.\n\nHvor lang blir hver etappe (km)?',
            formula:'n1/n2',
            numRanges:{1:{min:100,max:10000},2:{min:4,max:20},3:{min:10,max:60}} },
          
          { id:'s_story_10', op:'add',
            text:'To parallelle klasser samlet inn pant. 7. A leverte <num_1> flasker, og 7. B leverte <num_2> flasker. Vaktmesteren tømte i alt <num_3> sekker samme dag.\n\nHvor mange flasker leverte 7. A og 7. B til sammen?',
            formula:'n1+n2',
            numRanges:{1:{min:800,max:3000},2:{min:800,max:3000},3:{min:10,max:60}} },
          
          { id:'s_story_11', op:'sub', ensure:'n1>=n2',
            text:'Skolebiblioteket hadde <num_1> bøker ved inventar. Etter utlån i prosjektuka var <num_2> bøker utlånt. I tillegg ble <num_3> nye bøker bestilt for neste måned.\n\nHvor mange bøker står fortsatt på biblioteket nå?',
            formula:'n1-n2',
            numRanges:{1:{min:3000,max:9000},2:{min:300,max:2500},3:{min:20,max:200}} },
          
          { id:'s_story_12', op:'mul',
            text:'Til skolekonserten fordeles programhefter. Hver rekke skal få <num_1> hefter, og det er <num_2> rekker i salen. Det er også <num_3> reserver ved inngangen.\n\nHvor mange programhefter må deles ut i salen?',
            formula:'n1*n2',
            numRanges:{1:{min:8,max:30},2:{min:8,max:30},3:{min:10,max:100}} },
          
          { id:'s_story_13', op:'div', ensure:'divisible',
            text:'Et parti på <num_1> datamus skal fordeles likt på <num_2> klasserom. IT-ansvarlig har samtidig <num_3> skjermer på lager til annet bruk.\n\nHvor mange datamus får hvert klasserom?',
            formula:'n1/n2',
            numRanges:{1:{min:200,max:1000},2:{min:4,max:20},3:{min:10,max:100}} },
          
          { id:'s_story_14', op:'add',
            text:'Miljøgruppa registrerte søppel langs to ruter. Første rute ga <num_1> funn, og andre rute ga <num_2> funn. De noterte også <num_3> typer materialer og brukte <num_4> hansker.\n\nHvor mange funn ble registrert totalt på de to rutene?',
            formula:'n1+n2',
            numRanges:{1:{min:150,max:1200},2:{min:150,max:1200},3:{min:3,max:12},4:{min:4,max:20}} },
          
          { id:'s_story_15', op:'sub', ensure:'n1>=n2',
            text:'En veldedig auksjon hadde <num_1> kroner i startkapital. Etter innkjøp av utstyr ble <num_2> kroner brukt. Samtidig ble det solgt lodder i <num_3> boder.\n\nHvor mange kroner står igjen i startkapitalen etter innkjøpet?',
            formula:'n1-n2',
            numRanges:{1:{min:5000,max:20000},2:{min:1000,max:8000},3:{min:2,max:12}} },
          
          { id:'s_story_16', op:'mul',
            text:'En konsertarena setter opp sperrebånd i seksjoner. Hver seksjon får <num_1> stolper, og det er <num_2> seksjoner langs løypa. I depotet ligger <num_3> ruller tape.\n\nHvor mange stolper trengs totalt?',
            formula:'n1*n2',
            numRanges:{1:{min:10,max:50},2:{min:10,max:50},3:{min:5,max:30}} },
          
          { id:'s_story_17', op:'div', ensure:'terminating',
            text:'Et lager flytter <num_1> kg ris likt over <num_2> beholdere. I tillegg står <num_3> tomme beholdere klare til neste uke.\n\nHvor mange kg blir det i hver beholder?',
            formula:'n1/n2',
            numRanges:{1:{min:200,max:5000},2:{min:4,max:25},3:{min:4,max:20}} },
          
          { id:'s_story_18', op:'add',
            text:'I en leseaksjon summerte <name_1> sider lest to perioder. Første periode ble det <num_1> sider, og andre periode <num_2> sider. Klassen fikk <num_3> nye bokmerker den dagen.\n\nHvor mange sider leste <name_1> til sammen i de to periodene?',
            formula:'n1+n2',
            numRanges:{1:{min:120,max:900},2:{min:120,max:900},3:{min:10,max:60}} },
          
          { id:'s_story_19', op:'sub', ensure:'n1>=n2',
            text:'En veldedighetsløype hadde <num_1> påmeldte. Etter en værendring trakk <num_2> seg. Det ble lagt ut <num_3> vester til funksjonærer.\n\nHvor mange deltakere sto igjen som påmeldte?',
            formula:'n1-n2',
            numRanges:{1:{min:800,max:3000},2:{min:100,max:900},3:{min:10,max:80}} },
          
          { id:'s_story_20', op:'add',
            text:'To skolelag samlet inn kroner til nytt utstyr. Lag A fikk inn <num_1> kroner, og lag B fikk inn <num_2> kroner. Det kom <num_3> givere innom stands den dagen.\n\nHvor mye fikk lag A og B inn til sammen?',
            formula:'n1+n2',
            numRanges:{1:{min:1500,max:6000},2:{min:1500,max:6000},3:{min:30,max:300}} },
          
    ],
  
    4: [ // Hodeskalle (opp til millioner)
        { id:'h_plus_mix_01', op:'add',
            text:'I starten av uken ble sceneområdet merket opp. Frivillige fordelte seg i soner, og vaktsjefen loggførte tall fortløpende. Sponsorer lovet <num_2> kr i støtte, mens nettauksjonen samme kveld innbrakte <num_4> kr. Parkeringsvaktene telte <num_1> biler.\n\nHvor mye ble summen av sponsorstøtte og nettauksjonen denne kvelden?',
            formula:'n2 + n4',
            numRanges:{1:{min:200,max:6000},2:{min:200000,max:3500000},4:{min:100000,max:2500000}} },
          
          { id:'h_minus_mix_02', op:'sub',
            text:'Et prosjekt hadde først et mellomregnskap etter del 1 og del 2. Etter en ekstrabevilgning på <num_3> kr skulle transportkostnad på <num_1> kr og lagerleie på <num_2> kr trekkes fra. Antall leverandører var <num_4>.\n\nHvor mye står igjen etter at transport og lagerleie er trukket fra ekstrabevilgningen?',
            formula:'n3 - (n1 + n2)',
            numRanges:{1:{min:50000,max:1200000},2:{min:20000,max:900000},3:{min:500000,max:6000000},4:{min:2,max:40}} },
          
          { id:'h_mul_mix_03', op:'mul',
            text:'En distributør forbereder høstkampanje. Det pakkes sett i partier, og delvis automatikk brukes på linjen. Hvert sett skal ha <num_3> enheter, og det produseres <num_1> sett i første kjør. Samtidig er <num_2> ekstra esker satt av.\n\nHvor mange enheter produseres i første kjør?',
            formula:'n1 * n3',
            numRanges:{1:{min:400,max:20000},2:{min:1000,max:80000},3:{min:50,max:3000}} },
          
          { id:'h_div_mix_04', op:'div', ensure:'terminating',
            text:'Et fond skal fordeles på avdelinger etter opptrappingsplan. Administrasjonen legger til side midler til kurs, men disse er ikke med i fordelingen. Total pott til fordeling er <num_4> kr, og den skal deles likt på <num_2> avdelinger. Kursmidler er <num_1> kr.\n\nHvor mye får hver avdeling (kr) fra fordelingspotten?',
            formula:'n4 / n2',
            numRanges:{1:{min:50000,max:500000},2:{min:5,max:40},4:{min:800000,max:9000000}} },
          
          { id:'h_plus_mix_05', op:'add',
            text:'Festivalledelsen oppsummerte kvelden bak scenen. Matboder rapporterte egne tall, og billettluken stengte sent. Dagskort ga <num_3> kr, og ungdomsbilletter ga <num_1> kr. Antall vakter på vaktlisten var <num_2>.\n\nHvor mye ga dagskort og ungdomsbilletter til sammen?',
            formula:'n3 + n1',
            numRanges:{1:{min:200000,max:2500000},2:{min:50,max:800},3:{min:300000,max:3000000}} },
          
          { id:'h_minus_mix_06', op:'sub',
            text:'En større sceneoppgradering fikk ekstra midler. Først ble det innvilget <num_4> kr. Deretter måtte lydrigg for <num_1> kr og lys for <num_3> kr betales. Antall leverandørtilbud var <num_2>.\n\nHvor mye av de innvilgede midlene gjenstår etter disse to kjøpene?',
            formula:'n4 - (n1 + n3)',
            numRanges:{1:{min:150000,max:3000000},2:{min:3,max:40},3:{min:120000,max:2800000},4:{min:800000,max:8000000}} },
          
          { id:'h_mul_mix_07', op:'mul',
            text:'En logistikkpartner skal fylle containere for en kampanje. Etter nattskiftet står <num_2> containere klare, og hver container skal lastes med <num_4> kartonger. Reservepaller utgjør <num_1>.\n\nHvor mange kartonger lastes i containerne til sammen?',
            formula:'n2 * n4',
            numRanges:{1:{min:10,max:2000},2:{min:40,max:2000},4:{min:500,max:5000}} },
          
          { id:'h_div_mix_08', op:'div', ensure:'terminating',
            text:'En stipendpott fordeling skal justeres. Etter at administrative kostnader er trukket fra, står en sum igjen som fordeles jevnt. Etter fratrekk står <num_3> kr igjen, og dette deles likt på <num_1> kandidater. Antall søknader mottatt var <num_2>.\n\nHvor mye får hver kandidat (kr) fra restpotten?',
            formula:'n3 / n1',
            numRanges:{1:{min:5,max:40},2:{min:50,max:2000},3:{min:1200000,max:12000000}} },
          
          { id:'h_mix_chain_09', op:'add',
            text:'I siste innsamlingsrunde ble det flere kilder. SMS-kampanjen ga <num_2> kr, mens bedriftsdonasjoner landet på <num_5> kr. Nettbutikken solgte også T-skjorter, men det regnes separat. Antall frivillige var <num_1> og besøkende <num_3>.\n\nHvor mye ble summen av SMS-kampanjen og bedriftsdonasjonene?',
            formula:'n2 + n5',
            numRanges:{1:{min:50,max:1000},2:{min:150000,max:3500000},3:{min:500,max:80000},5:{min:150000,max:4000000}} },
          
          { id:'h_mix_chain_10', op:'sub',
            text:'Prosjektkontoen fikk to innskudd tidligere i måneden, men nå må en utbetaling bokføres. Etter dagens støtte på <num_2> kr skal en faktura på <num_4> kr trekkes. Årskontroll viste <num_1> sensorer i drift og <num_3> reservemoduler.\n\nHvor mye står igjen av dagens støtte etter at fakturaen trekkes?',
            formula:'n2 - n4',
            numRanges:{1:{min:100,max:3000},2:{min:400000,max:5000000},3:{min:10,max:500},4:{min:120000,max:4500000}} },
          
          { id:'h_mix_chain_11', op:'add',
            text:'En stor kampanjedag ble delt i to tidsvinduer. Formiddagsvinduet ga <num_4> kr i salg, og kvelds­vinduet ga <num_1> kr. Antall varer per handlekurv var omtrent <num_2>, og antall budskap som gikk ut var <num_3>.\n\nHvor mye ble summen av formiddags- og kveldssalget denne dagen?',
            formula:'n4 + n1',
            numRanges:{1:{min:300000,max:5000000},2:{min:1,max:20},3:{min:2,max:40},4:{min:300000,max:5000000}} },
          
          { id:'h_plus_minus_12', op:'add',
            text:'For å ferdigstille et kulturprosjekt ble to inntektskilder og én utgift registrert samtidig. Billettinntekter ga <num_3> kr, og støtteordning ga <num_1> kr, mens sceneleie på <num_2> kr skulle trekkes fra. Antall fremføringer var <num_4>.\n\nHva blir netto (inntekter minus sceneleie) fra billettinntekter og støtte?',
            formula:'(n3 + n1) - n2',
            numRanges:{1:{min:200000,max:3000000},2:{min:80000,max:1500000},3:{min:250000,max:3500000},4:{min:1,max:50}} },
          
          { id:'h_diff_13', op:'sub',
            text:'Et lager melder om beholdning og svinn. Etter telling viser rapporten at svinnet var <num_3> enheter, mens beholdningen før telling var <num_5> enheter. I mellomtiden har innkjøp på <num_1> enheter og utlevering på <num_2> enheter blitt registrert. Antall ansatte på skiftet var <num_4>.\n\nHvor stort er differansen mellom innkjøp og utlevering (innkjøp minus utlevering)?',
            formula:'n1 - n2',
            numRanges:{1:{min:10000,max:800000},2:{min:5000,max:700000},3:{min:10,max:20000},4:{min:5,max:200},5:{min:20000,max:1000000}} },
          
          { id:'h_mul_chain_14', op:'mul',
            text:'Et nasjonalt trykkeri kjører en stor batch av informasjonshefter. Dagtid har <num_2> maskiner i drift, og hvert maskinsett produserer <num_5> hefter per syklus. Nattlaget står for vedlikehold med <num_1> teknikere.\n\nHvor mange hefter produseres per syklus i dagtiden?',
            formula:'n2 * n5',
            numRanges:{1:{min:5,max:200},2:{min:20,max:400},5:{min:500,max:4000}} },
          
          { id:'h_div_chain_15', op:'div', ensure:'terminating',
            text:'Støtte til skolene settes av etter en fordelingsnøkkel. En ringefordeling skal teste kapasitet: En testpott på <num_5> kr fordeles likt på <num_3> skoler. I tillegg holdes <num_2> kr av til beredskap.\n\nHvor mye får hver skole (kr) av testpotten?',
            formula:'n5 / n3',
            numRanges:{2:{min:50000,max:800000},3:{min:5,max:40},5:{min:1000000,max:12000000}} },
          
          { id:'h_plus_chain_16', op:'add',
            text:'I en fellesaksjon kom ulike strømminger inn gjennom dagen. Målgruppen for kveldsaksjonen ble utvidet. Ettermiddagsrunde ga <num_2> kr og formiddagsrunde ga <num_4> kr, mens nattlisten med frivillige var på <num_1> navn.\n\nHvor mye ga formiddags- og ettermiddagsrundene til sammen?',
            formula:'n4 + n2',
            numRanges:{1:{min:20,max:1200},2:{min:300000,max:4000000},4:{min:300000,max:4000000}} },
          
          { id:'h_minus_chain_17', op:'sub',
            text:'En potensiell sponsor har gitt tilsagn. Fra tilsagnet på <num_2> kr må produksjonskost på <num_5> kr trekkes. Antall annonserte visninger i kampanjen er <num_1> og antall profiler som meldte interesse var <num_3>.\n\nHvor mye gjenstår av sponsorbeløpet etter produksjonskostnaden er trukket fra?',
            formula:'n2 - n5',
            numRanges:{1:{min:100000,max:9000000},2:{min:300000,max:6000000},3:{min:1000,max:500000},5:{min:100000,max:4000000}} },
          
          { id:'h_mul_chain_18', op:'mul',
            text:'En produksjonslinje forbereder lansering. Det settes opp <num_1> linjer i parallell, og hver linje skal produsere <num_4> enheter per batch. Samtidig er <num_2> paller frigjort på lageret.\n\nHvor mange enheter produseres per batch i parallell?',
            formula:'n1 * n4',
            numRanges:{1:{min:5,max:300},2:{min:200,max:50000},4:{min:200,max:5000}} },
          
          { id:'h_div_chain_19', op:'div', ensure:'terminating',
            text:'Et nasjonalt gavefond oppdateres. Etter avsetninger står en sum klar til jevn fordeling. Beløpet <num_4> kr skal fordeles likt på <num_1> regioner. Det er registrert <num_3> lokale lag.\n\nHvor mye får hver region (kr)?',
            formula:'n4 / n1',
            numRanges:{1:{min:5,max:25},3:{min:50,max:2000},4:{min:2000000,max:20000000}} },
          
          { id:'h_plus_chain_20', op:'add',
            text:'På en maratondag for inntekter skjer det to store topper. Nattlig strøm av gaver økte til <num_3> kr, mens formiddagskampanjen landet på <num_2> kr. Antall digitale kvitteringer var <num_1>.\n\nHvor mye ga nattlig strøm og formiddagskampanjen til sammen?',
            formula:'n3 + n2',
            numRanges:{1:{min:1000,max:500000},2:{min:400000,max:5000000},3:{min:400000,max:5000000}} },
          
    ]
  };
  
  function getLevelSet(){ return LEVEL_SETS[currentLevel] || LEVEL_SETS[0]; }
  function pickTemplateFromLevel(){ const set = getLevelSet(); return set[randInt(0, set.length-1)]; }

 
  
  // ====== Gjeldende oppgave ======
  let current = null;
  
  function makeNumbersFor(template){
    // 1) Finn alle num-plassholdere i selve tekstmalen
    const idxs = findPlaceholders(template.text, 'num'); // f.eks. [1,2,3]
    const nums = {};
    const ranges = template.numRanges || {};
    const fallback = rngForLevel(); // nivåets standardområde
  
    // 2) Fyll ALLE funnede <num_i> med range[i] eller fallback
    for (const i of idxs) {
      const r = ranges[i] || fallback;
      nums[i] = randInt(r.min, r.max);
    }
  
    // 3) Håndter "ensure"-regler uten å miste irrelevante tall
    let ensure = template.ensure || '';
    // På nivåer med "pene" svar: preferer terminerende desimal ved divisjon
    if (LEVELS[currentLevel].preferTerminating && template.op === 'div' && ensure !== 'divisible') {
      ensure = 'terminating';
    }
  
    if (ensure === 'n1>=n2') {
      if ((nums[1] ?? 0) < (nums[2] ?? 0)) {
        const t = nums[1]; nums[1] = nums[2]; nums[2] = t;
      }
    } else if (ensure === 'divisible') {
      // Sørg for at n1 er et multiplum av n2, men behold andre num_i urørt
      const r2 = ranges[2] || {min:2, max:12};
      nums[2] = Math.max(2, randInt(r2.min, r2.max));
      const r1 = ranges[1] || {min:nums[2]*2, max:nums[2]*50};
      const kMin = Math.max(1, Math.ceil(r1.min / nums[2]));
      const kMax = Math.max(kMin, Math.floor(r1.max / nums[2]));
      nums[1] = nums[2] * randInt(kMin, kMax);
    } else if (ensure === 'terminating' && template.op === 'div') {
      // Velg n2 som gir terminerende desimal; tilpass n1 rundt det
      const r2 = ranges[2] || {min:2, max:25};
      const goodDivs = [2,4,5,8,10,20,25].filter(d => d>=r2.min && d<=r2.max);
      nums[2] = goodDivs.length ? choice(goodDivs) : Math.max(2, randInt(r2.min, r2.max));
      const r1 = ranges[1] || {min:nums[2], max:nums[2]*100};
      const bases = [nums[2], nums[2]/2, nums[2]*2].filter(x => Number.isFinite(x) && x>=r1.min && x<=r1.max);
      if (bases.length){
        const base = choice(bases);
        const kMin = Math.max(1, Math.ceil(r1.min/base));
        const kMax = Math.max(kMin, Math.floor(r1.max/base));
        nums[1] = base * randInt(kMin, kMax);
      } else {
        nums[1] = randInt(r1.min, r1.max);
      }
      nums[1] = Math.round(nums[1]);
      nums[2] = Math.round(nums[2]);
    }
  
    // 4) Sikre ikke-negative svar på lave nivåer (0=Grønn, 1=Gul)
    if (currentLevel <= 1) {
      try {
        const preview = computeAnswer({ formula: template.formula }, nums);
        if (preview < 0 && nums[1] != null && nums[2] != null) {
          const t = nums[1]; nums[1] = nums[2]; nums[2] = t;
        }
      } catch {}
    }
  
    // 5) SIKKERHET: etterfyll manglende/NaN for alle i idxs
    for (const i of idxs) {
      if (!Number.isFinite(nums[i])) {
        const r = ranges[i] || fallback;
        nums[i] = randInt(r.min, r.max);
      }
    }
  
    return nums;
  }
  
  function fillNames(text){
    const idxs = findPlaceholders(text, 'name');
    const taken = new Set();
    const names = {};
    for(const i of idxs){ let n; do { n = choice(NAMES); } while(taken.has(n) && taken.size < NAMES.length); taken.add(n); names[i] = n; }
    return names;
  }
  
  function computeAnswer(template, nums){
    const args = []; const vals = [];
    for(let i=1;i<=9;i++){ args.push('n'+i); vals.push(nums[i] ?? 0); }
    let raw; try{ const fn = new Function(...args, `return (${template.formula});`); raw = fn(...vals); } catch(e){ raw = NaN; }
    return raw;
  }
  
  function pickTemplate(){ return pickTemplateFromLevel(); }
  
  function renderProblem(){
    const tpl = pickTemplate();
    const names = fillNames(tpl.text);
    const nums  = makeNumbersFor(tpl);
    let text = tpl.text;
    for (const [i,v] of Object.entries(names)) text = text.replaceAll(`<name_${i}>`, v);
    for (const [i,v] of Object.entries(nums))  text = text.replaceAll(`<num_${i}>`, String(v));
    const raw    = computeAnswer(tpl, nums);
    const answer = Number.parseFloat(raw.toFixed(LEVELS[currentLevel].decimals));
    current = {
      templateId: tpl.id,
      operation: tpl.op,
      formula: tpl.formula,
      level: LEVELS[currentLevel].name,
      levelIndex: currentLevel,
      names, nums,
      answer,
      prettyAnswer: formatNumber(answer),
      solved:false,
      cheated:false
    };
    text = applyGrammarAdjustments(text, nums);
    document.getElementById('problem').textContent = text;
    document.getElementById('answerInput').value = '';
    const newBtn = document.getElementById('newBtn');
    if(newBtn){ newBtn.style.background = '#0b1222'; newBtn.style.borderColor = '#243043'; newBtn.style.color = 'var(--ink)'; }
    const status = document.getElementById('status'); if(status){ status.textContent = '\u00A0'; status.className='status'; }
    document.getElementById('type-pill').textContent =
      ({add:'Addisjon',sub:'Subtraksjon',mul:'Multiplikasjon',div:'Divisjon'})[tpl.op] || '—';
    setLevelUI();
    const meta = document.getElementById('meta'); if(meta){ meta.textContent = JSON.stringify(current, null, 2); }
  }
  
  function showAnswer(){
    const status = document.getElementById('status');
    if (!current.cheated) {
      const ok = confirm('Vis fasit? Hvis du ser fasiten, får du ingen poeng på denne oppgaven.');
      if (!ok) return;
      current.cheated = true;
    }
    status.textContent = `Fasit: ${current.prettyAnswer}`;
    status.className = 'status';
  }
  
  function checkAnswer(){
    const val = parseUserNumber(document.getElementById('answerInput').value);
    const status = document.getElementById('status');
    if (Number.isNaN(val)) { status.textContent = 'Skriv et tall (komma eller punktum går fint).'; status.className = 'status bad'; return; }
    const decs = LEVELS[currentLevel].decimals;
    const userRounded = Number(val.toFixed(decs));
    const tol = Math.pow(10, -(decs + 2));
    const ok = Math.abs(userRounded - current.answer) <= tol;
  
    if (ok) {
      if (current.solved) { status.textContent = 'Allerede riktig ✔'; status.className = 'status ok'; return; }
      current.solved = true;
      if (current.cheated) {
        status.textContent = 'Riktig, men fasit ble vist – ingen poeng.';
        status.className = 'status ok';
      } else {
        status.textContent = 'Riktig! ✔';
        status.className = 'status ok';
        counters[currentLevel] = (counters[currentLevel] || 0) + 1;
        saveCounters();
        updateCountersUI();
      }
      const newBtn = document.getElementById('newBtn');
      if(newBtn){
        newBtn.style.background = 'linear-gradient(180deg,#16a34a,#15803d)';
        newBtn.style.borderColor = '#15803d';
        newBtn.style.color = 'white';
        newBtn.style.transition = 'all 0.3s ease';
      }
    } else {
      status.textContent = 'Ikke helt. Prøv igjen!';
      status.className = 'status bad';
    }
  }
  
  // ====== Eventer ======
  function bindEvents(){
    document.getElementById('newBtn').addEventListener('click', renderProblem);
    document.getElementById('checkBtn').addEventListener('click', checkAnswer);
    document.getElementById('showBtn').addEventListener('click', showAnswer);
    document.getElementById('hideMetaBtn').addEventListener('click', ()=>{ const box = document.getElementById('metaBox'); box.open = !box.open; });
  
    document.getElementById('answerInput').addEventListener('keydown', (e)=>{ if(e.key==='Enter') checkAnswer(); });
  
    document.getElementById('levelSelect').addEventListener('change', (e)=>{
      currentLevel = parseInt(e.target.value,10) || 0;
      setLevelUI();
      renderProblem(); // ny oppgave fra det nivåets sett
    });
  
    document.getElementById('easierBtn').addEventListener('click', ()=>{
      if(currentLevel>0){ currentLevel--; setLevelUI(); renderProblem(); }
    });
    document.getElementById('harderBtn').addEventListener('click', ()=>{
      if(currentLevel<LEVELS.length-1){ currentLevel++; setLevelUI(); renderProblem(); }
    });
  }
  
  // ====== Chicken mascot ======
  (function(){
    const chicken = document.getElementById('chicken');
    if(!chicken) return;
    function cleanupAnimations(){ chicken.classList.remove('hop','shake'); }
    function setMood(happy){ chicken.classList.remove('happy','sad'); chicken.classList.add(happy ? 'happy' : 'sad'); }
    function triggerAnimation(cls){ cleanupAnimations(); void chicken.offsetWidth; chicken.classList.add(cls); setTimeout(cleanupAnimations, 1500); }
    window.chickenReact = function(isHappy){ setMood(!!isHappy); triggerAnimation(isHappy ? 'hop' : 'shake'); };
    function bindToStatus(){ const status = document.getElementById('status'); if(!status) return; const obs = new MutationObserver(()=>{ const cls = status.className || ''; if(cls.includes(' ok')) window.chickenReact(true); else if(cls.includes(' bad')) window.chickenReact(false); }); obs.observe(status, { attributes:true, attributeFilter:['class'] }); }
    if(document.readyState === 'loading'){ document.addEventListener('DOMContentLoaded', bindToStatus); } else { bindToStatus(); }
  })();
  
  // ====== Meta-visibility via hash ======
  function toggleMetaVisibility(){ const metaBox = document.getElementById('metaBox'); if(!metaBox) return; if (!window.location.hash.includes('meta')) { metaBox.style.display = 'none'; } else { metaBox.style.display = 'block'; } }
  window.addEventListener('hashchange', toggleMetaVisibility);
  
  // ====== Init ======
  (function init(){
    if(document.readyState === 'loading'){
      document.addEventListener('DOMContentLoaded', ()=>{ setLevelUI(); updateCountersUI(); bindEvents(); toggleMetaVisibility(); renderProblem(); });
    } else {
      setLevelUI(); updateCountersUI(); bindEvents(); toggleMetaVisibility(); renderProblem();
    }
  })();
  