// Dependencies
var express = require('express');
var http = require('http');
var https = require('https');
var path = require('path');
var fs = require('fs');
var app = express();
const httpApp = express();
//console.log(fs.readFileSync('./httpsServer.csr'))
var key = fs.readFileSync('encryption/server.key') + '';
var cert = fs.readFileSync( 'encryption/server.crt' ) + '';
var ca = fs.readFileSync( 'encryption/server.ca-bundle' ) + '';
let httpsOptions = {
    key: key,
    cert: cert,
    ca: ca
}
var port = process.env.PORT || 3000; // Used by Heroku and http on localhost
process.env['PORT'] = process.env.PORT || 4000; // Used by https on localhost
let httpsServer
let httpServer = http.createServer(app)

// Run separate https server if on localhost
if (process.env.NODE_ENV != 'production') {
    httpsServer = https.createServer(httpsOptions, app).listen(process.env.PORT, function () {
        console.log("Express server listening with https on port %d in %s mode", this.address().port, app.settings.env);
    });
};

if (process.env.NODE_ENV == 'production') {
    app.use(function (req, res, next) {
        res.setHeader('Strict-Transport-Security', 'max-age=8640000; includeSubDomains');
        if (req.headers['x-forwarded-proto'] && req.headers['x-forwarded-proto'] === "http") {
            return res.redirect(301, 'https://' + req.host + req.url);
        } else {
            return next();
            }
    });
} else {
    app.use(function (req, res, next) {
        res.setHeader('Strict-Transport-Security', 'max-age=8640000; includeSubDomains');
        if (!req.secure) {
            return res.redirect(301, 'https://' + req.host  + ":" + process.env.PORT + req.url);
        } else {
            return next();
        }
    });

};
//var httpsServer = http.Server(app);
const bodyParser = require('body-parser')
const bcrypt = require('bcrypt')
let dotenv = require('dotenv')
dotenv.config();
var socketIO = require('socket.io');
const io
if(httpsServer) io = socketIO(httpsServer);
else io = socketIO(httpServer);
var favicon = require('serve-favicon')
var game = require("./Entity.js")
new game(io.of('/usaeast1'), '/usaeast1');
//new game(io.of('/usaeast2'), '/usaeast2');
const discordRoute = require('./api/routes/discord')
const { mlabInteractor } = require('mlab-promise')

const mLab = new mlabInteractor('4unBPu8hpfod29vxgQI57c0NMUqMObzP', ['lexybase', 'chatbase'])
require('./collapsabot')(mLab)
let collapsa
let collapsauserbase
let reqCount = 0
let formFormat = data => Object.keys(data).map(k => `${k}=${encodeURIComponent(data[k])}`).join('&')
mLab.on('ready', () => {
    console.log('Mlab interface loaded')
    collapsa = mLab.databases.get('collapsa')
    collapsauserbase = collapsa.collections.get('collapsauserbase')
})
let zeroFill = (s, w) => new Array(w - s.length).fill('0').join('') + s
const genSnowflake = (increment, processID, workerID) => {
    let timestamp = zeroFill((new Date().getTime() - 1591092539000).toString(2), 42)
    increment = zeroFill(reqCount.toString(2), 12)
    processID = zeroFill(processID, 5)
    workerID = zeroFill(workerID, 5)
    return parseInt(timestamp + processID + workerID + increment, 2)
}
Math = require('./math.js')
app.use(bodyParser.json())
app.route('/api')
    .get(async (req, res) => {
        reqCount++
        res.send('hello')
    })
app.route('/api/login')
    .post(async (req, res) => {
        reqCount++
        let username = req.body.username
        let password = req.body.password
        if(req.body.token){
            if(!collapsauserbase.findDocument(d => d.data.token == req.body.token)) res.send(JSON.stringify({message:"invalidToken", err:true}))
            let userbase = collapsauserbase.findDocument(d => d.data.token == req.body.token)
            res.send(JSON.stringify({message:"validToken", username:userbase.data.username, email:userbase.data.email}))
            return
        }
        if(!collapsauserbase.findDocument(d => d.data.username == username)) return res.send(JSON.stringify({message:"Incorrect username or password", err:true}))
        
        let document = collapsauserbase.findDocument(d => d.data.username == username)
        if(!document.data.password){
            let acceptedLogins = []
            if(document.data.discordid) acceptedLogins.push('Discord')
            return res.send(JSON.stringify({acceptedLogins, err:true}))
        }
        let successful = await bcrypt.compare(password, document.data.password)
        if(successful) res.send(JSON.stringify({token:document.data.id}))
        else res.send(JSON.stringify({message:"Incorrect username or password"}))
    })
app.route('/api/signup')
    .post(async (req, res) => {
        reqCount++
        let username = req.body.username
        let password = req.body.password
        let email = req.body.email
        if(collapsauserbase.findDocument(d => d.data.username == username)) return res.send(JSON.stringify({message:"usernameTaken", err:true}))
        if(collapsauserbase.findDocument(d => d.data.email == email)) return res.send(JSON.stringify({message:"emailTaken", err:true}))
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
            if(suu.length < 6 || suu.match(/^\d/) || suu.match(/\W/)) valid[0] = 0
            else valid[0] = 1
        }
        validatePassword(password)
        validateUsername(username)
        validateEmail(email)
        if(valid.every(d => d)){
            let id = genSnowflake(reqCount.toString(2), '2', '0')
            let token = await bcrypt.genSalt(10)
            let psw = await bcrypt.hash(password, 10)
            let random = Math.floor(Math.random() * 100).toString()
            token = 'Aph_' + (random.length == 2 ? random : '0' + random) + 'yght' + token.substr(7)
            await collapsauserbase.addDocument({
                id:id,
                token:token,
                password:psw,
                username:username,
                email:email
            })
            var d = new Date();
            d.setTime(d.getTime() + (30 * 24 * 60 * 60 * 1000));
            var expires = "Expires="+ d.toUTCString();
            res.set('Set-Cookie', `token=${token}; ${expires}; path=/`)
            res.send({message:'signupSuccess'})
        }
        else {
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
app.route('/api/discordLogin')
    .get(async (req, res) => {
        if(!req.query.code) return res.redirect('../../')
        //res.sendFile(path.join(__dirname, '/client/index.html'));
        let client_id = '710904657811079258'
        let client_secret = 'ZabZmWdAlMZFPl2O7xGRqtqpZhIar9tE'
        let redirect_uri = process.env.local ? 'http://localhost:3000/api/discordLogin' : 'http://www.collapsa.io/api/discordLogin'
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
        console.log(user)
        if(user.error){ 
            res.status(404)
            return res.send(JSON.stringify({error: "invalid user"}))
        }
        if(collapsauserbase.findDocument(document => document.data.discordid == user.id)){
            let userbase = collapsauserbase.findDocument(document => document.data.discordid == user.id)
            var d = new Date();
            d.setTime(d.getTime() + (30 * 24 * 60 * 60 * 1000));
            var expires = "Expires="+ d.toUTCString();
            console.log(`token=${userbase.data.token}; ${expires}`)
            res.set('Set-Cookie', `token=${userbase.data.token}; ${expires}; path=/`)
            res.redirect('../../')
        }else {
            let id = genSnowflake(reqCount.toString(2), '2', '0')
            let token = await bcrypt.genSalt(10)
            let random = Math.floor(Math.random() * 100).toString()
            token = 'Aph_' + (random.length == 2 ? random : '0' + random) + 'yght' + token.substr(7)
            await collapsauserbase.addDocument({
                id:id,
                token:token,
                discordid:user.id,
                username:user.username,
                email:user.email
            })
            var d = new Date();
            d.setTime(d.getTime() + (30 * 24 * 60 * 60 * 1000));
            var expires = "Expires="+ d.toUTCString();
            res.set('Set-Cookie', `token=${token}; ${expires}; path=/`)
            res.redirect('../../')
        }
    })
var Vector = require('./Vector.js')
// Aliases
io.on('connection', socket => {
    console.log('New connection')
})
httpServer.listen(
    port,
    function() {
        console.log('Your http server is listening on port ' + httpServer.address().port);
    }
)
app.get('/.well-known/pki-validation', (req, res) => {
    res.sendFile(path.join(__dirname, '/client/index.html'))
})
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
app.use('/.well-known/pki-validation', express.static(__dirname + '/'))
app.use('/', express.static(__dirname + '/client'))
app.use(favicon(path.join(__dirname, '/client/favicon.ico')));
app.use(function(req, res, next) {
    res.status(404).sendFile(__dirname + '/404.html')
})
var adminList = [];
