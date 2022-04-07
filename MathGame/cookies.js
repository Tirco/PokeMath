const localStorage = window.localStorage;
const cookieAllowButton = document.getElementById("cookie-allow")
const cookieCancelButton = document.getElementById("cookie-cancel")
const cookiePrompt = document.querySelector(".cookie-consent")


cookieAllowButton.addEventListener("click", allowCookies)
cookieCancelButton.addEventListener("click",hideCookiePrompt);

//cookie stuff
let cookie_consent = getCookie("user_cookie_consent");
if(cookie_consent != ""){
    document.getElementById("cookieNotice").style.display = "none";
    document.getElementById("cointext").textContent = "";
    
}else{
    document.getElementById("cookieNotice").style.display = "block";
}

function allowCookies(){
	// Set cookie consent
	deleteCookie('user_cookie_consent');
  cookie_consent="true";
	setCookie('user_cookie_consent', 1, 30);
	document.getElementById("cookieNotice").style.display = "none";
}

function hideCookiePrompt(){
	  document.getElementById("cookieNotice").style.display = "none";
  }

// Create cookie
function setCookie(cname, cvalue, exdays) {
  if(cookie_consent != "") {
    const d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    let expires = "expires="+ d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
  }
}

// Delete cookie
function deleteCookie(cname) {
  const d = new Date();
  d.setTime(d.getTime() + (24*60*60*1000));
  let expires = "expires="+ d.toUTCString();
  document.cookie = cname + "=;" + expires + ";path=/";
}

// Read cookie
function getCookie(cname) {
  let name = cname + "=";
  let decodedCookie = decodeURIComponent(document.cookie);
  let ca = decodedCookie.split(';');
  for(let i = 0; i <ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) == ' ') {
          c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
          return c.substring(name.length, c.length);
      }
  }
  return "";
}