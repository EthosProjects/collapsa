const { discorduserbaseUser, discordguildbaseGuild, collapsauserbaseUser } = require('../models/index.js')
const mongodbInteractor = require('../../mongoDB/mongodbInteractor')
const genSnowflake = require('../../util/genSnowflake.js')
const https = require('https')
let formFormat = data => Object.keys(data).map(k => `${k}=${encodeURIComponent(data[k])}`).join('&')
var express = require('express');
const bcrypt = require('bcrypt')
/**
 * 
 * @param {mongodbInteractor} mongoDB 
 */
module.exports = mongoDB => {
    let usersRouter = express.Router()
    usersRouter.route('/')
        .get(async(req, res) => {
            const collapsauserbase = mongoDB.databases.get('collapsa').collections.get('collapsauserbase')
            let userArray = Array.from(collapsauserbase.documents).map(([key, value]) => value).map(u => new collapsauserbaseUser(u.data).public)
            if(req.query.sort == 'true'){
                userArray.sort((a, b) => b.highscore - a.highscore)
            }
            if(req.query.discord){
                const discorduserbase = mongoDB.databases.get('collapsa').collections.get('discorduserbase')
                let discordUsers = Array.from(discorduserbase.filterDocuments(document => {
                    if(!document.data.guilds['709240989012721717']) return false
                    if(!collapsauserbase.findDocument(doc => doc.data.discordid == document.name)) return false
                    return true
                })).map(([key, val]) => new discorduserbaseUser(val.data))
                discordUsers.forEach(dUser => userArray.find(cUser => cUser.discordid == dUser.id).discordexp = dUser.guilds['709240989012721717'].exp.amount)
            }
            res.send(JSON.stringify(userArray))
    })
        .post(async (req, res, next) => {
            const collapsauserbase = mongoDB.databases.get('collapsa').collections.get('collapsauserbase')
            let username = req.body.username
            let password = req.body.password
            let email = req.body.email
            if(!username || !password || !email) return res.status(400).send({message:'invalidFormBody', error:true})
            if(collapsauserbase.findDocument(d => d.data.username == username)) return res.status(400).send(JSON.stringify({message:"usernameTaken", err:true}))
            if(collapsauserbase.findDocument(d => d.data.email == email)) return res.status(400).send(JSON.stringify({message:"emailTaken", err:true}))
            let valid = [0, 0, 0]
            let validatePassword = sup => {
                if(sup.match(/^(?=.*[a-zA-Z0-9]).{8,16}$/)) valid[1] = 1
            }
            let validateEmail = sue => {
                let email = /^\w.+@\w{2,253}\.\w{2,63}$/;
                if(sue.match(email)) {  
                    valid[2] = 1
                } else if(sue.length == 0){
                    valid[2] = 0
                } else {
                    valid[2] = 0
                }
            }
            let validateUsername = suu => {
                if(!suu.match(/^[a-zA-Z]{1}[ \w]{5,11}$/)) valid[0] = 0
                else valid[0] = 1
            }
            validatePassword(password)
            validateUsername(username)
            validateEmail(email)
            if(valid.every(d => d)){
                let id = genSnowflake(process.reqCount.toString(2), '2', '0')
                let token = await bcrypt.genSalt(10)
                let psw = await bcrypt.hash(password, 10)
                let random = Math.floor(Math.random() * 100).toString()
                token = 'Aph_' + (random.length == 2 ? random : '0' + random) + 'yght' + token.substr(7)
                let user = new collapsauserbaseUser({
                    id:id,
                    token:token,
                    password:psw,
                    username:username,
                    email:email
                })
                await collapsauserbase.addDocument(Object.assign({}, user))
                var d = new Date();
                d.setTime(d.getTime() + (30 * 24 * 60 * 60 * 1000));
                var expires = "Expires="+ d.toUTCString();
                res.set('Set-Cookie', `token=${token}; ${expires}; path=/`)
                res.send({message:'signupSuccess', data:user.public})
            }
            else {
                res.status(400)
                if(!valid[0] && !valid[1] && !valid[2]) res.send({message:'This request is faulty', err:true}) 
                else if(!valid[0] && !valid[1]) res.send({message:'The username and password are invalid', err:true}) 
                else if(!valid[0] && !valid[2]) res.send({message:'The username and email are invalid', err:true}) 
                else if(!valid[1] && !valid[2]) res.send({message:'The password and email are invalid', err:true}) 
                else if(!valid[0]) res.send({message:'The username is invalid', err:true})
                else if(!valid[1]) res.send({message:'The password is invalid', err:true})
                else if(!valid[2]) res.send({message:'The email is invalid', err:true}) 
            }
            res.end()
        })
        .put(async (req, res) => {
            const collapsauserbase = mongoDB.databases.get('collapsa').collections.get('collapsauserbase')
            let username = req.body.username
            let email = req.body.email
            let newPassword = req.body.newPassword
            let password = req.body.password
            let token = req.body.token
            if(!collapsauserbase.findDocument(d => d.data.token == token)) return res.send(JSON.stringify({message:"invalidUsername", err:true}))
            let document = collapsauserbase.findDocument(d => d.data.token == token)
            let newDoc = Object.assign({}, document.data)
            if(!password){
                if(document.data.password) return res.send(JSON.stringify({message:"neededPassword", err:true}))
            }else if(document.data.password){
                let successful = await bcrypt.compare(password, document.data.password)
                if(!successful) return res.send(JSON.stringify({message:"incorrectPassword", err:true})) 
            }
            if(newPassword){
                if(!newPassword.match(/^(?=.*[a-zA-Z0-9]).{8,16}$/)) return res.status(400).send(JSON.stringify({message:"invalidNewPassword", err:true}))
            }
            if(username != document.data.username){
                if(!username.match(/^[a-zA-Z]{1}[ \w]{5,11}$/)) return res.status(400).send(JSON.stringify({message:"invalidUsername", err:true}))
            }
            if(email != document.data.email){
                if(!email.match(/^\w.+@\w{2,253}\.\w{2,63}$/)) return res.status(400).send(JSON.stringify({message:"invalidEmail", err:true}))
            }
            if(newPassword) newDoc.password = await bcrypt.hash(newPassword, 10)
            newDoc.email = email
            newDoc.username = username
            await collapsauserbase.updateDocument(newDoc)
            res.send(JSON.stringify({message:"Account update successful"}))
        })
    usersRouter.get('/link', async (req, res, next) => {
        const collapsauserbase = mongoDB.databases.get('collapsa').collections.get('collapsauserbase')
        'https://localhost:4000/api/v1/users/link?site=discord&code=5kqZibrReGM2Jq66uIITnNrvVzKGpD'
        if(!req.query.code) return res.redirect('../../')
        //res.sendFile(path.join(__dirname, '/client/index.html'));
        let client_id = '710904657811079258'
        let client_secret = 'ZabZmWdAlMZFPl2O7xGRqtqpZhIar9tE'
        let redirect_uri = process.env.NODE_ENV == 'development' ? 'https://localhost:4000/api/v1/users/link?site=discord' : 'http://www.collapsa.io/api/v1/users/link?site=discord'
        let code = req.query.code
        let obj = {
            'code': code,
            'client_id': client_id,
            'client_secret': client_secret,
            'redirect_uri': redirect_uri,
            'scope': 'identify email'
        }
        let tokens = await new Promise((resolve, reject) => {
            let tokenReq = https.request({
                host:'discord.com',
                path:`/api/oauth2/token?grant_type=authorization_code`,
                method:"POST",
                headers:{
                    'content-type':'application/x-www-form-urlencoded'
                }
            })
            .on('response', res => {
                let buffer = []
                res.on('data', data => buffer.push(data))
                .on('end', () => resolve(JSON.parse(buffer.join(''))))
            })
            tokenReq.write(formFormat(obj))
            tokenReq.end()
        })
        if(tokens.error){ 
            res.status(404)
            return res.send(JSON.stringify({error: "invalid token"}))
        }
        let access_token = tokens.access_token
        let user = await new Promise((resolve, reject) => {
            https.get({
                host:'discord.com',
                path:`/api/v6/users/@me`,
                headers: {
                    "Authorization": `Bearer ${access_token}`
                }
            })
            .on('response', res => {
                let buffer = []
                res.on('data', data => buffer.push(data))
                res.on('end', () => resolve(JSON.parse(buffer.join(''))))
            })
        })
        if(user.error){ 
            res.status(404)
            return res.send(JSON.stringify({error: "invalid user"}))
        }
        function getCookie(cname) {
            var name = cname + "=";
            var decodedCookie = decodeURIComponent(req.headers.cookie);
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
        if(getCookie('token')){
            if(collapsauserbase.findDocument(document => document.data.token == getCookie('token'))){
                let cUser = new collapsauserbaseUser(collapsauserbase.findDocument(document => document.data.token == getCookie('token')).data)
                cUser.discordid = user.id
                await collapsauserbase.addDocument(Object.assign({}, cUser))
            }
            res.redirect('../../../')
        }else if(collapsauserbase.findDocument(document => document.data.discordid == user.id)){
            let cUser = new collapsauserbaseUser(collapsauserbase.findDocument(document => document.data.discordid == user.id).data)
            var d = new Date();
            d.setTime(d.getTime() + (30 * 24 * 60 * 60 * 1000));
            var expires = "Expires="+ d.toUTCString();
            res.set('Set-Cookie', `token=${cUser.token}; ${expires}; path=/`)
            res.redirect('../../../')
        }else {
            if(collapsauserbase.findDocument(d => d.data.username == user.username)) return res.status(400).send(JSON.stringify({message:"usernameTaken", err:true}))
            if(collapsauserbase.findDocument(d => d.data.email == user.email)) return res.status(400).send(JSON.stringify({message:"emailTaken", err:true}))
            let id = genSnowflake(process.reqCount.toString(2), '2', '0')
            let token = await bcrypt.genSalt(10)
            let random = Math.floor(Math.random() * 100).toString()
            token = 'Aph_' + (random.length == 2 ? random : '0' + random) + 'yght' + token.substr(7)
            let cUser = new collapsauserbaseUser({
                id:id,
                token:token,
                discordid:user.id,
                username:user.username,
                email:user.email
            })
            await collapsauserbase.addDocument(Object.assign({}, cUser))
            var d = new Date();
            d.setTime(d.getTime() + (30 * 24 * 60 * 60 * 1000));
            var expires = "Expires="+ d.toUTCString();
            res.set('Set-Cookie', `token=${token}; ${expires}; path=/`)
            res.redirect('../../../')
        }
    })
    usersRouter.get('/:userid', (req, res, next) => {
        const collapsauserbase = mongoDB.databases.get('collapsa').collections.get('collapsauserbase')
        if(collapsauserbase.documents.has(req.params.userid)){
            if(req.headers['authorization']){
                let user = new collapsauserbaseUser(collapsauserbase.documents.get(req.params.userid).data)
                if(req.headers['authorization'] == `Basic ${user.token}`){
                    res.send(JSON.stringify(new collapsauserbaseUser(collapsauserbase.documents.get(req.params.userid).data).private))
                }else res.status(400).send({message:'Not Found', error:true})
            }else res.send(JSON.stringify(new collapsauserbaseUser(collapsauserbase.documents.get(req.params.userid).data).public))
        }
        else res.status(404).send({message:'Not Found', error:true})
    })
    usersRouter.post('/login', async (req, res) => {
            const collapsauserbase = mongoDB.databases.get('collapsa').collections.get('collapsauserbase')
            process.reqCount++
            if(req.body.token){
                if(!collapsauserbase.findDocument(d => d.data.token == req.body.token)) 
                    return res.send(JSON.stringify({message:"invalidToken", err:true}))
                let document = collapsauserbase.findDocument(d => d.data.token == req.body.token)
                let user = new collapsauserbaseUser(document.data)
                res.send(JSON.stringify(user.private))
                return
            }
            let username = req.body.username
            let password = req.body.password
            if(!collapsauserbase.findDocument(d => d.data.username == username)) 
                return res.send(JSON.stringify({message:"Incorrect username or password", err:true}))
            let document = collapsauserbase.findDocument(d => d.data.username == username)
            let user = new collapsauserbaseUser(document.data)
            if(!document.data.password){
                let acceptedLogins = []
                if(user.discordid) acceptedLogins.push('Discord')
                return res.send(JSON.stringify({acceptedLogins, err:true}))
            }
            let successful = await bcrypt.compare(password, user.password)
            if(successful){
                var d = new Date();
                d.setTime(d.getTime() + (30 * 24 * 60 * 60 * 1000));
                var expires = "Expires="+ d.toUTCString();
                res.set('Set-Cookie', `token=${user.token}; ${expires}; path=/`)
    
                res.send(JSON.stringify(user.private))
            }
            else res.send(JSON.stringify({message:"Incorrect username or password"}))
        })
    return usersRouter
}