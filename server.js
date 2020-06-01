// Dependencies
var express = require('express');
var http = require('http');
var path = require('path');
var fs = require('fs');
var app = express();
var server = http.Server(app);
const bodyParser = require('body-parser')
const bcrypt = require('bcrypt')
var port = process.env.PORT || 3000;
var socketIO = require('socket.io');
var io = socketIO(server);
var favicon = require('serve-favicon')
var game = require("./Entity.js")
new game(io.of('/usaeast1'), '/usaeast1');
//new game(io.of('/usaeast2'), '/usaeast2');
const discordRoute = require('./api/routes/discord')
const mlabInteractor = require('../mlab-promise')
const mLab = new mlabInteractor('4unBPu8hpfod29vxgQI57c0NMUqMObzP', ['lexybase', 'chatbase'])
let collapsa
let collapsauserbase
mLab.on('ready', () => {
    console.log('Mlab interface loaded')
    collapsa = mLab.databases.get('collapsa')
    collapsauserbase = collapsa.collections.get('collapsauserbase')
    console.log(collapsauserbase)
})
Math = require('./math.js')
app.use(bodyParser.json())
app.route('/api/login')
    .post(async (req, res) => {
        let username = req.body.username
        let password = req.body.password
        if(req.body.token){
            if(!collapsauserbase.findDocument(d => d.name == req.body.token)) res.send(JSON.stringify({message:"invalidToken", err:true}))
            else res.send(JSON.stringify({message:"validToken"}))
            return
        }
        if(!collapsauserbase.findDocument(d => d.data.username == username)) return res.send(JSON.stringify({message:"Incorrect username or password", err:true}))
        let document = collapsauserbase.findDocument(d => d.data.username == username)
        let successful = await bcrypt.compare(password, document.data.password)
        if(successful) res.send(JSON.stringify({token:document.data.id}))
        else res.send(JSON.stringify({message:"Incorrect username or password"}))
        console.log(req.params, req.body)
    })
app.route('/api/signup')
    .post(async (req, res) => {
        let username = req.body.username
        let password = req.body.password
        let email = req.body.email
        if(collapsauserbase.findDocument(d => d.data.username == username)) return res.send(JSON.stringify({message:"usernameTaken", err:true}))
        if(collapsauserbase.findDocument(d => d.data.email == email)) return res.send(JSON.stringify({message:"emailTaken", err:true}))
        let valid = [0, 0, 0]
        let validatePassword = sup => {
            var lowerCaseLetters = /[a-z]/g;

            // Validate capital letters
            var upperCaseLetters = /[A-Z]/g;

            // Validate numbers
            var numbers = /[0-9]/g;
            if(
                sup.match(numbers) && 
                sup.match(upperCaseLetters) && 
                sup.match(lowerCaseLetters) && sup.length > 7) valid[1] = 1
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
            if(suu.length < 6 || suu.match(/^\d/) || suu.match(/\W/)) valid[0] = 0
            else valid[0] = 1
        }
        validatePassword(password)
        validateUsername(username)
        validateEmail(email)
        if(valid.every(d => d)){
            let token = await bcrypt.genSalt(10)
            let psw = await bcrypt.hash(password, 10)
            let random = Math.floor(Math.random() * 100).toString()
            token = 'Aph_' + (random.length == 2 ? random : '0' + random) + 'yght' + token.substr(7)
            console.log(token, psw, await bcrypt.compare(password, psw))
            await collapsauserbase.addDocument({
                id:token,
                password:psw,
                username:username,
                email:email
            })
            res.send({token})
        }
        else {
            if(!valid[0] && !valid[1] && !valid[2]) res.send({message:'This request is faulty', err:true}) 
            else if(!valid[0] && !valid[1]) res.send({message:'The username and password are invalid', err:true}) 
            else if(!valid[0] && !valid[2]) res.send({message:'The username and email are invalid', err:true}) 
            else if(!valid[1] && !valid[1]) res.send({message:'The password and email are invalid', err:true}) 
            else if(!valid[0]) res.send({message:'The username is invalid', err:true})
            else if(!valid[1]) res.send({message:'The password is invalid', err:true})
            else if(!valid[2]) res.send({message:'The email is invalid', err:true}) 
        }
        res.end()
    })
var Vector = require('./Vector.js')
// Aliases
io.on('connection', socket => {
    console.log('aaa')
})
server.listen(
    port,
    function() {
        console.log('Your app is listening on port ' + server.address().port);
    }
)
app.get('/', function(request, response) {
    response.sendFile(path.join(__dirname, '/client/index.html'));
});
app.get('/404.js', function(request, response) {
    response.sendFile(path.join(__dirname, '/404.js'));
});
app.get('/404.css', function(request, response) {
    response.sendFile(path.join(__dirname, '/404.css'));
});
app.set('port', port);
app.use('/client', express.static(__dirname + '/client'))
app.use(favicon(path.join(__dirname, '/client/img/favicon.ico')));
app.use(function(req, res, next) {
    res.status(404).sendFile(__dirname + '/404.html')
})
var adminList = [];