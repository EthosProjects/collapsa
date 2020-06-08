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
let loginwithDiscordURL = {
    client_id:"710904657811079258",
    redirect_uri:location.origin + '/api/discordLogin',
    response_type:'code',
    scope:'identify email'
}
let formFormat = data => Object.keys(data).map(k => `${k}=${encodeURIComponent(data[k])}`).join('&')
loginwithDiscordURL = formFormat(loginwithDiscordURL)
loginwithDiscordWrapper.href = `https://discord.com/api/oauth2/authorize?${loginwithDiscordURL}`
let loginButton = document.getElementById('loginButton')
let signupButton = document.getElementById('signupButton')
let accountButton = document.getElementById('accountButton')
let loginForm = document.getElementById('loginForm')
let signupForm = document.getElementById('signupForm')
let loginModal = document.getElementById('loginModal');
let signupModal = document.getElementById('signupModal');
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
accountButton.addEventListener('click', e => {
    accountModal.style.display = 'block'
})
if(getCookie('token')){
    loginButton.style.display = 'none'
    signupButton.style.display = 'none'
    accountButton.style.display = 'block';
    (async () => {
    let token = getCookie('token')
    let req = await fetch(`${window.location.href}api/login`, {
        method:'POST',
        headers:{
            'content-type':'application/json'
        },
        body:JSON.stringify({token})
    })
    let res = await req.json()
    if(res.err){
        loginButton.style.display = 'block'
        signupButton.style.display = 'block'
        accountButton.style.display = 'none'
        setCookie('token', '', -30)
    }else {
        sessionStorage.setItem('username', res.username)
        accountUsername.value = res.username
        sessionStorage.setItem('email', res.email)
        accountEmail.value = res.email
        document.getElementById("nameyourself").value = res.username
        accountModalSubmit.disabled = false
    }
    })()
}
signout.addEventListener('click', e => {
    setCookie('token', '', -1)
    accountModal.style.display = 'none'
    loginButton.style.display = 'block'
    signupButton.style.display = 'block'
    accountButton.style.display = 'none'
});
[...signupModal.getElementsByClassName('input')].forEach((element, index) => {
    let validate = () => {
        let validatePassword = sup => {
            var letter = signupModal.querySelector('.letter')
            var number = signupModal.querySelector('.numval')
            var length = signupModal.querySelector('.length')
            let letters = /[a-zA-Z]/g;
            if(sup.match(letters)) {  
                letter.classList.remove("invalid");
                letter.classList.add("valid");
            } else {
                letter.classList.remove("valid");
                letter.classList.add("invalid");
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
            var lengths = /^\w{8,16}$/g;
            if(sup.match(lengths)) {  
                length.classList.remove("invalid");
                length.classList.add("valid");
            } else {
                length.classList.remove("valid");
                length.classList.add("invalid");
            }
            if(!sup.match(/^(?=.*[a-zA-Z0-9]).{8,16}$/)) valid[1] = 0
            else valid[1] = 1
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
            if(suu.match(/^[a-zA-Z]{1}[ \w]{5,11}$/)) valid[0] = 1
            else valid[0] = 0
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
    loginModalSubmit.disabled = true
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
    loginErr.style.display = 'none'
    if(res.err){
        loginErr.style.display = 'block'
        if(res.acceptedLogins){
            console.log(res.acceptedLogins.length, res.acceptedLogins[0])
            if(res.acceptedLogins.length == 1 && res.acceptedLogins[0] == 'Discord') loginErr.textContent = 'You can only log in through discord'
        }else {
            loginErr.textContent = 'Incorrect username or password'
        }
        loginModalSubmit.disabled = false
    }else {
        loginErr.style.display = 'none'
        loginButton.style.display = 'none'
        signupButton.style.display = 'none'
        accountButton.style.display = 'block'
        loginModal.style.display = 'none'
        loginModalSubmit.disabled = false
    }
})
signupForm.addEventListener('submit', async e => {
    e.preventDefault()
    let password = signupPassword.value
    let username = signupUsername.value
    let email = signupEmail.value
    signupModalSubmit.disabled = true
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
    if(res.err){
        if(res.message == 'usernameTaken') signupErrs[0].style.display = 'block'
        if(res.message == 'emailTaken') signupErrs[1].style.display = 'block'
        signupModalSubmit.disabled = false;
    }else {
        sessionStorage.setItem('username', username)
        accountUsername.value = username
        sessionStorage.setItem('email', email)
        accountEmail.value = email
        document.getElementById("nameyourself").value = username
        loginButton.style.display = 'none'
        signupButton.style.display = 'none'
        accountButton.style.display = 'block'
        signupModal.style.display = 'none'
        signupModalSubmit.disabled = false;
    }
});

[...accountModal.getElementsByClassName('input')].forEach((element, index) => {
    let valid = [1, 1, 0, 0]
    let validate = () => {
        let username = accountModal.getElementsByClassName('input')[0]
        let email = accountModal.getElementsByClassName('input')[1]
        let newPassword = accountModal.getElementsByClassName('input')[2]
        let password = accountModal.getElementsByClassName('input')[3]
        let validatePassword = sup => {
            if(!sup.length) return valid[3] = 1
            if(!sup.match(/^(?=.*[a-zA-Z0-9]).{8,16}$/)) valid[3] = 0
            else valid[3] = 1
        }
        let validateEmail = sue => {
            let email = /^\w.+@\w{2,253}\.\w{2,63}$/;
            if(sue.match(email)) {  
                
                valid[1] = 1
            } else if(sue.length == 0){
                valid[1] = 0
            } 
        }
        let validateUsername = suu => {
            if(suu.match(/^[a-zA-Z]{1}[ \w]{5,11}$/)) valid[0] = 1
            else valid[0] = 0
        }
        let validateNewPassword = sup => {
            if(!sup.length) return valid[2] = 1
            if(!sup.match(/^(?=.*[a-zA-Z0-9]).{8,16}$/)) valid[2] = 0
            else valid[2] = 1
        }
        validateUsername(username.value)
        validateEmail(email.value)
        validatePassword(password.value)
        validateNewPassword(newPassword.value)
        if(valid.every(v => v)) accountModalSubmit.disabled = false
        else accountModalSubmit.disabled = true
    }
    element.addEventListener('keyup', validate)
    element.addEventListener('keydown', validate)
    validate(element)
});
accountForm.addEventListener('submit', async e => {
    e.preventDefault()
    e.preventDefault()
    loginModalSubmit.disabled = true
    let password = accountPassword.value
    let username = accountUsername.value
    let email = accountEmail.value
    let newPassword = accountNewPassword.value
    let token = getCookie('token')
    //let loginErr = document.getElementById('loginErr')
    let req = await fetch(`${window.location.href}api/updateAccount`, {
        method:'POST',
        headers:{
            'content-type':'application/json'
        },
        body:JSON.stringify({username:username, password:password, email, newPassword, token})
    })
    let res = await req.json()
    console.log(res)
    //loginErr.style.display = 'none'
    if(res.err){
        /*loginErr.style.display = 'block'
        if(res.acceptedLogins){
            console.log(res.acceptedLogins.length, res.acceptedLogins[0])
            if(res.acceptedLogins.length == 1 && res.acceptedLogins[0] == 'Discord') loginErr.textContent = 'You can only log in through discord'
        }else {
            loginErr.textContent = 'Incorrect username or password'
        }
        loginModalSubmit.disabled = false*/
    }else {
        /*
        setCookie('token', res.token, 30)
        loginErr.style.display = 'none'
        loginButton.style.display = 'none'
        signupButton.style.display = 'none'
        accountButton.style.display = 'block'
        loginModal.style.display = 'none'
        loginModalSubmit.disabled = */
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