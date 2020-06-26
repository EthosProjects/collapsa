const { discorduserbaseUser, discordguildbaseGuild, collapsauserbaseUser } = require('../models/index.js')
var express = require('express');
module.exports = mongoDB => {
    let usersRouter = express.Router()
    usersRouter.route('/')
        .get(async(req, res) => {
            console.log('aaaa')
            console.log(mongoDB)
            const collapsauserbase = mongoDB.databases.get('collapsa').collections.get('collapsauserbase')
            let userArray = Array.from(collapsauserbase.documents).map(([key, value]) => value)
            res.send(JSON.stringify(userArray.map(u => new collapsauserbaseUser(u.data).public)))
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
            console.log(document)
            let newDoc = Object.assign({}, document.data)
            if(!password){
                if(document.data.password) return res.send(JSON.stringify({message:"neededPassword", err:true}))
            }else {
                let successful = await bcrypt.compare(password, document.data.password)
                console.log(successful, document.data.password, password)
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
            newDoc.password = await bcrypt.hash(newPassword, 10)
            newDoc.email = email
            newDoc.username = username
            await collapsauserbase.updateDocument(newDoc)
            res.send(JSON.stringify({message:"Account update successful"}))
        })
    usersRouter.get('/:userid', (req, res, next) => {
        const collapsauserbase = mongoDB.databases.get('collapsa').collections.get('collapsauserbase')
        if(collapsauserbase.documents.has(req.params.userid)){
            console.log(req.headers['authorization'])
            if(req.headers['authorization']){
                let user = new collapsauserbaseUser(collapsauserbase.documents.get(req.params.userid).data)
                if(req.headers['authorization'] == `Basic ${user.token}`){
                    res.send(JSON.stringify(new collapsauserbaseUser(collapsauserbase.documents.get(req.params.userid).data).private))
                }else res.send(400).send({message:'Not Found', error:true})
            }else res.send(JSON.stringify(new collapsauserbaseUser(collapsauserbase.documents.get(req.params.userid).data).public))
        }
        else res.status(404).send({message:'Not Found', error:true})
    })
    usersRouter.post('/login', async (req, res) => {
            const collapsauserbase = mongoDB.databases.get('collapsa').collections.get('collapsauserbase')
            process.reqCount++
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