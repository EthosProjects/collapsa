// Dependencies
var express = require('express');
const cors = require('cors')
var http = require('http');
var https = require('https');
var path = require('path');
var fs = require('fs');
var app = express();
const httpApp = express();
const { EventEmitter } = require('events');
const { config } = require('dotenv');
config()
//console.log(fs.readFileSync('./httpsServer.csr'))
var key = fs.readFileSync('encryption/server.key') + '';
var cert = fs.readFileSync( 'encryption/www_collapsa_io.crt' ) + '';
var ca = fs.readFileSync( 'encryption/www_collapsa_io.ca-bundle' ) + '';
let httpsOptions = {
    key: key,
    cert: cert,
    ca: ca
}
var port = process.env.PORT || 3000; // Used by Heroku and http on localhost
process.env['PORT'] = process.env.PORT || 4000; // Used by https on localhost
let httpsServer
let httpServer = http.createServer(app)
const { Collection } = require('discord.js')
const { MongoClient } = require('mongodb')
const { discorduserbaseUser, discordguildbaseGuild, collapsauserbaseUser } = require('./api/models/index.js')


let toLiteral = obj => JSON.parse(JSON.stringify(obj))
const { mongodbInteractor, collection } = require('./mongoDB')
const mongoDB = new mongodbInteractor('LogosKing', 'TBKCKD6B')
let usersRouter = require('./api/routes/users')(mongoDB)
// Run separate https server if on localhost
if (process.env.NODE_ENV == 'development') {
    httpsServer = https.createServer(httpsOptions, app).listen(process.env.PORT, function () {
        console.log("Express server listening with https on port %d in %s mode", this.address().port, app.settings.env);
    });
};
if (process.env.NODE_ENV == 'development') {
    app.use(function (req, res, next) {
        res.setHeader('Strict-Transport-Security', 'max-age=8640000; includeSubDomains');
        if (!req.secure) {
            return res.redirect(301, 'https://' + req.hostname  + ":" + process.env.PORT + req.url);
        } else {
            return next();
        }
    });
} else {
    app.use(function (req, res, next) {
        res.setHeader('Strict-Transport-Security', 'max-age=8640000; includeSubDomains');
        if (req.headers['x-forwarded-proto'] && req.headers['x-forwarded-proto'] === "http") {
            return res.redirect(301, 'https://' + req.host + req.url);
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
httpServer.listen(
    port,
    () => {
        console.log('Your http server is listening on port ' + httpServer.address().port);
    }
)
let io = httpsServer ? socketIO(httpsServer) : socketIO(httpServer);
io.on('connection', socket => {
    console.log('New connection')
})
var game = require("./Entity.js")
new game(io.of('/usaeast1'), '/usaeast1', mongoDB);
var favicon = require('serve-favicon')
let client = require('./collapsabot')(mongoDB)
/*
let webhookreq = https.request({
    host:'discordapp.com',
    path:'/api/webhooks/720406265997819994/ulw78QPg8HKXyr5nUHJOu8eLfGEuCjbXbId1TzhwPUg5KBCIngEdigUaQ0N6yTDeuYKs',
    method:"POST",
    headers: {
        'content-type':'application/json'
    }
})
.on('response', res => {
    let buffer = []
    res.on('data', d => buffer.push(d))
    res.on('end', () => console.log(buffer.join('')))
})
webhookreq.write(JSON.stringify({
    content:'@everyone',
    embeds:[
        {
            title: "CollapsaBot Help commands",
            type: "rich",
            description: "There is now a help command with complete descriptions of every command",
            timestamp: new Date().toISOString(),
            color:parseInt('2ecc71', 16),
            thumbnail:{
                url:'http://www.collapsa.io/img/favicon.png',
            },
            fields:[{
                name:'Glitches found',
                value:'None'
            }],
            author:{
                url:'http://www.collapsa.io/img/favicon.png',
                name:'Logos King'
            }
        }  
    ]
}))
webhookreq.end()*/
let collapsa
/**
 * @type {collection}
 */
let collapsauserbase
/**
 * @type {collection}
 */
let leaderboard
process.reqCount = 0
let formFormat = data => Object.keys(data).map(k => `${k}=${encodeURIComponent(data[k])}`).join('&')
mongoDB.on('ready', () => {
    console.log('Mlab interface loaded')
    collapsa = mongoDB.databases.get('collapsa')
    collapsauserbase = collapsa.collections.get('collapsauserbase')
})
let zeroFill = (s, w) => new Array(w - s.length).fill('0').join('') + s
const genSnowflake = require('./util/genSnowflake.js')
Math = require('./math.js')
let JSONtoString = (obj, currIndent = 1) => {
    let ret = '{\r\n'
    let makeLine = (obj, prop, indentTimes) => {
        let str = new Array(indentTimes).fill('    ').join('') + `${prop}: ${typeof obj[prop] == 'object' ? JSONtoString(obj[prop], indentTimes + 1) : obj[prop]}\r\n`
        return str
    }
    for(const prop in obj){
        ret += makeLine(obj, prop, currIndent)
    }
    return ret + new Array(currIndent - 1).fill('    ').join('') + '}'
}
app.use(bodyParser.json())
let apiRouter = express.Router()
let v1Router = express.Router()
apiRouter.use(function timeLog (req, res, next) {
    process.reqCount++
    next()
})
v1Router.get('/', async (req, res) => {
    res.send(JSON.stringify({
        availableEndpoints:'users'
    }))
})
v1Router.use('/users', usersRouter)
apiRouter.use('/v1', v1Router)
app.use('/api', apiRouter)
app.route('/api/leaderboard')
    .get(async (req, res) => {
        let discorduserbase = collapsa.collections.get('discorduserbase')
        let discordUsers = discorduserbase.filterDocuments(document => {
            if(!document.data.guilds['709240989012721717']) return false
            if(!collapsauserbase.findDocument(doc => doc.data.discordid == document.name)) return false
            return true
        })
        let users = [...collapsauserbase.documents.values()].map(doc => ({
            username:doc.data.username,
            score:doc.data.highscore,
            discordid:doc.data.discordid ? doc.data.discordid : undefined
        }))
        discordUsers.forEach(document => users.find(doc => document.data.discordid == doc.name).discordexp = document.data.guilds['709240989012721717'].exp.amount)
        res.send(JSON.stringify(users))
    })
app.route('/api/discordLogin')
    .get(async (req, res) => {
        if(!req.query.code) return res.redirect('../../')
        //res.sendFile(path.join(__dirname, '/client/index.html'));
        let client_id = '710904657811079258'
        let client_secret = 'ZabZmWdAlMZFPl2O7xGRqtqpZhIar9tE'
        let redirect_uri = process.env.NODE_ENV == 'development' ? 'https://localhost:4000/api/discordLogin' : 'http://www.collapsa.io/api/discordLogin'
        console.log(redirect_uri)
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
            console.log(tokens)
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
        if(collapsauserbase.findDocument(document => document.data.discordid == user.id)){
            let userbase = collapsauserbase.findDocument(document => document.data.discordid == user.id)
            var d = new Date();
            d.setTime(d.getTime() + (30 * 24 * 60 * 60 * 1000));
            var expires = "Expires="+ d.toUTCString();
            console.log(`token=${userbase.data.token}; ${expires}`)
            res.set('Set-Cookie', `token=${userbase.data.token}; ${expires}; path=/`)
            res.redirect('../../')
        }else {
            let id = genSnowflake(process.reqCount.toString(2), '2', '0')
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
var Vector = require('./Vector.js');
const { strict } = require('assert');
const { stringify } = require('querystring');
const { nextTick } = require('process');
// Aliases
app.use(cors())
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
