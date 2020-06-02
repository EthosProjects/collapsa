const state = { 'page_id': 1, 'user_id': 5 }
const title = ''
const url = '/'

history.pushState(state, title, url)
function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    var expires = "expires="+ d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}
function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for(var i = 0; i <ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}
let loginButton = document.getElementById('loginButton')
let signupButton = document.getElementById('signupButton')
let accountButton = document.getElementById('accountButton')
let loginForm = document.getElementById('loginForm')
let signupForm = document.getElementById('signupForm')
let loginModal = document.getElementById('loginModal');
let signupModal = document.getElementById('signupModal');
let signupModalSubmit = document.querySelectorAll('.submit')[1];
let loginDropdown = document.getElementById('dropdown-content')
loginButton.addEventListener('mouseover', () => {
    loginDropdown.style.display = 'block'
})
loginButton.addEventListener('mouseout', () => {
    loginDropdown.style.display = 'none'
})
loginDropdown.addEventListener('mouseover', () => {
    loginDropdown.style.display = 'block'
})
loginDropdown.addEventListener('mouseout', () => {
    loginDropdown.style.display = 'none'
})
let valid = [0, 0, 0];
if(getCookie('token')){
    (async () => {
    loginButton.style.display = 'none'
    signupButton.style.display = 'none'
    accountButton.style.display = 'block'
    let token = getCookie('token')
    let req = await fetch(`${window.location.href}api/login`, {
        method:'POST',
        headers:{
            'content-type':'application/json'
        },
        body:JSON.stringify({token})
    })
    let res = await req.json()
    console.log(res)
    if(res.err){
        loginButton.style.display = 'block'
        signupButton.style.display = 'block'
        accountButton.style.display = 'none'
        setCookie('token', '', -30)
    }})()
}
[...signupModal.getElementsByClassName('input')].forEach((element, index) => {
    let validate = () => {
        let validatePassword = sup => {
            var letter = document.getElementById('lowercaseval')
            var capital = document.getElementById('uppercaseval')
            var number = document.getElementById('numval')
            var lowerCaseLetters = /[a-z]/g;
            if(sup.match(lowerCaseLetters)) {  
                letter.classList.remove("invalid");
                letter.classList.add("valid");
            } else {
                letter.classList.remove("valid");
                letter.classList.add("invalid");
            }

            // Validate capital letters
            var upperCaseLetters = /[A-Z]/g;
            if(sup.match(upperCaseLetters)) {  
                capital.classList.remove("invalid");
                capital.classList.add("valid");
            } else {
                capital.classList.remove("valid");
                capital.classList.add("invalid");
            }

            // Validate numbers
            var numbers = /[0-9]/g;
            if(sup.match(numbers)) {  
                number.classList.remove("invalid");
                number.classList.add("valid");
            } else {
                number.classList.remove("valid");
                number.classList.add("invalid");
            }
            if(
                !sup.match(numbers) || 
                !sup.match(upperCaseLetters) || 
                !sup.match(lowerCaseLetters)) valid[1] = 0
            else valid[1] = 1
            console.log(signupModalSubmit.disabled, !sup.match(numbers) || 
            !sup.match(upperCaseLetters) || 
            !sup.match(lowerCaseLetters) )
            // Validate length
            if(sup.length < 8) valid[1] = 0
        }
        let validateEmail = sue => {
            let email = /^\w.+@\w{2,253}\.\w{2,63}$/;
            if(sue.match(email)) {  
                document.getElementById('emailerr').style.display = 'none'
                valid[2] = 1
            } else if(sue.length == 0){
                document.getElementById('emailerr').style.display = 'none'
                valid[2] = 0
            } else {
                document.getElementById('emailerr').style.display = 'block'
                valid[2] = 0
            }
        }
        let validateUsername = suu => {
            if(suu.length < 6 || suu.match(/^\d/) || suu.match(/\W/)) valid[0] = 0
            else valid[0] = 1
        }
        if(index == 0) validateUsername(element.value)
        if(index == 1) validatePassword(element.value)
        if(index == 2) validateEmail(element.value)
        if(valid.every(v => v)) signupModalSubmit.disabled = false
        else signupModalSubmit.disabled = true
    }
    element.addEventListener('keyup', validate)
    element.addEventListener('keydown', validate)
    validate(element)
});

[...document.getElementsByClassName('accountModalContent')].forEach(modal => {
    let closebtn = modal.getElementsByClassName('closebtn')[0]
    closebtn.addEventListener('click', e => {
        e.preventDefault()
        modal.parentElement.style.display = 'none'
    })
});
[...document.getElementsByClassName('mask')].forEach(mask => {
    mask.addEventListener('click', e => {
        let parent = mask.parentElement
        let password = parent.getElementsByClassName('input')[0]
        if(password.type == 'password'){
            password.type="text";
            e.target.src="https://i.stack.imgur.com/waw4z.png";
        }else {
            password.type = "password";
            e.target.src = "https://i.stack.imgur.com/Oyk1g.png";
        }
    })
    
})
loginButton.addEventListener('click', async e => {
    loginModal.style.display = 'block'
})
signupButton.addEventListener('click', e => {
    signupModal.style.display = 'block'
})
loginForm.addEventListener('submit', async e => {
    e.preventDefault()
    let password = document.getElementById('loginPassword').value
    let username = document.getElementById('loginUsername').value
    let loginErr = document.getElementById('loginErr')
    let req = await fetch(`${window.location.href}api/login`, {
        method:'POST',
        headers:{
            'content-type':'application/json'
        },
        body:JSON.stringify({username:username, password:password})
    })
    let res = await req.json()
    console.log(res)
    loginErr.style.display = 'none'
    console.log(res)
    if(res.err){
        loginErr.style.display = 'block'
    }else {
        setCookie('token', res.token, 30)
        loginErr.style.display = 'none'
        loginButton.style.display = 'none'
        signupButton.style.display = 'none'
        accountButton.style.display = 'block'
        loginModal.style.display = 'none'
    }
})
signupForm.addEventListener('submit', async e => {
    e.preventDefault()
    let password = document.getElementById('signupPassword').value
    let username = document.getElementById('signupUsername').value
    let email = document.getElementById('signupEmail').value
    let req = await fetch(`${window.location.href}api/signup`, {
        method:'POST',
        headers:{
            'content-type':'application/json'
        },
        body:JSON.stringify({username, password, email})
    })
    let res = await req.json();
    let signupErrs = signupForm.querySelectorAll('.signupErr');
    [...signupErrs].forEach(e => e.style.display = 'none')
    console.log(res)
    if(res.err){
        if(res.message == 'usernameTaken') signupErrs[0].style.display = 'block'
        if(res.message == 'emailTaken') signupErrs[1].style.display = 'block'
    }else {
        setCookie('token', res.token, 30)
        console.log(getCookie('token'))
        loginButton.style.display = 'none'
        signupButton.style.display = 'none'
        accountButton.style.display = 'block'
        signupModal.style.display = 'none'
    }
})
let percentageWidth = window.innerWidth/window.outerWidth
let percentageHeight = window.innerHeight/window.outerHeight
let percentage = percentageWidth * percentageHeight
loginButton.getElementsByTagName('h1')[0].style.fontSize = 40 * percentage + 'px'
signupButton.getElementsByTagName('h1')[0].style.fontSize = 40 * percentage + 'px'
window.addEventListener('resize', e => {
    let percentageWidth = window.innerWidth/window.outerWidth
    let percentageHeight = window.innerHeight/window.outerHeight
    let percentage = percentageWidth * percentageHeight
    loginButton.getElementsByTagName('h1')[0].style.fontSize = 40 * percentage + 'px'
    signupButton.getElementsByTagName('h1')[0].style.fontSize = 40 * percentage + 'px'
})