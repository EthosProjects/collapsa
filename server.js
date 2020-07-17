// Dependencies
var express = require('express');
const cors = require('cors');
var http = require('http');
var https = require('https');
var path = require('path');
var fs = require('fs');
var app = express();
const httpApp = express();
const { EventEmitter } = require('events');
const { config } = require('dotenv');
config();
var key = fs.readFileSync('encryption/server.key') + '';
var cert = fs.readFileSync('encryption/www_collapsa_io.crt') + '';
var ca = fs.readFileSync('encryption/www_collapsa_io.ca-bundle') + '';
let httpsOptions = {
    key: key,
    cert: cert,
    ca: ca,
};
var port = process.env.PORT || 3000; // Used by Heroku and http on localhost
process.env['PORT'] = process.env.PORT || 4000; // Used by https on localhost
let httpsServer;
let httpServer = http.createServer(app);
const { Collection } = require('discord.js');
const { MongoClient } = require('mongodb');
const { discorduserbaseUser, discordguildbaseGuild, collapsauserbaseUser } = require('./api/models/index.js');

let toLiteral = (obj) => JSON.parse(JSON.stringify(obj));
const { mongodbInteractor, collection } = require('./mongoDB');
const mongoDB = new mongodbInteractor('LogosKing', 'TBKCKD6B');
let usersRouter = require('./api/routes/users')(mongoDB);
// Run separate https server if on localhost
if (process.env.NODE_ENV == 'development') {
    httpsServer = https.createServer(httpsOptions, app).listen(process.env.PORT, function () {
        console.log('Express server listening with https on port %d in %s mode', this.address().port, app.settings.env);
    });
}
if (process.env.NODE_ENV == 'development') {
    app.use(function (req, res, next) {
        res.setHeader('Strict-Transport-Security', 'max-age=8640000; includeSubDomains');
        if (!req.secure) {
            return res.redirect(301, 'https://' + req.hostname + ':' + process.env.PORT + req.url);
        } else {
            return next();
        }
    });
} else {
    app.use(function (req, res, next) {
        res.setHeader('Strict-Transport-Security', 'max-age=8640000; includeSubDomains');
        if (req.headers['x-forwarded-proto'] && req.headers['x-forwarded-proto'] === 'http') {
            return res.redirect(301, 'https://' + req.hostname + req.url);
        } else {
            return next();
        }
    });
}
function dhm(t) {
    var cd = 24 * 60 * 60 * 1000,
        ch = 60 * 60 * 1000,
        d = Math.floor(t / cd),
        h = Math.floor((t - d * cd) / ch),
        m = Math.floor((t - d * cd - h * ch) / 60000),
        s = Math.round((t - d * cd - h * ch - m * 60000) / 1000),
        pad = function (n) {
            return n < 10 ? '0' + n : n;
        };
    console.log(cd, ch, d, h, m, pad);
    if (s === 60) {
        m++;
        s = 0;
    }
    if (m === 60) {
        h++;
        m = 0;
    }
    if (h === 24) {
        d++;
        h = 0;
    }
    return (
        (d ? d + ` Day${d > 1 ? 's' : ''} ` : '') +
        (h ? h + ` Hour${h > 1 ? 's' : ''} ` : '') +
        (m ? m + ` Minute${m > 1 ? 's' : ''} ` : '') +
        s +
        ` Second${s != 1 ? 's' : ''}`
    );
}
//var httpsServer = http.Server(app);
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
let dotenv = require('dotenv');
dotenv.config();
var socketIO = require('socket.io');
httpServer.listen(port, () => {
    console.log('Your http server is listening on port ' + httpServer.address().port);
});
let io = httpsServer ? socketIO(httpsServer) : socketIO(httpServer);
io.on('connection', (socket) => {
    console.log('New connection');
});
//var game = require('./Entity.js');
const Game = require('./Entity.js');
new Game(io.of('/usaeast1'), '/usaeast1', mongoDB);
//new game(io.of('/usaeast1'), '/usaeast1', mongoDB);
var favicon = require('serve-favicon');
let client = require('./collapsabot')(mongoDB);
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
            title: "Fully functioning building system",
            type: "rich",
            description: "Fun fact! The building system is now completely up to date. Only thing left to add is a red part for unplaceable campfires, which can wait until another day",
            timestamp: new Date().toISOString(),
            color:parseInt('ff7d36', 16),
            thumbnail:{
                url:'http://www.collapsa.io/img/woodwall.png',
            },
            author:{
                url:'http://www.collapsa.io/img/favicon.png',
                name:'Logos King'
            }
        }  
    ]
}))
webhookreq.end()*/
let collapsa;
/**
 * @type {collection}
 */
let collapsauserbase;
/**
 * @type {collection}
 */
let leaderboard;
process.reqCount = 0;
let formFormat = (data) =>
    Object.keys(data)
        .map((k) => `${k}=${encodeURIComponent(data[k])}`)
        .join('&');
mongoDB.on('ready', () => {
    console.log('Mlab interface loaded');
    collapsa = mongoDB.databases.get('collapsa');
    collapsauserbase = collapsa.collections.get('collapsauserbase');
});
const genSnowflake = require('./util/genSnowflake.js');
Math = require('./math.js');
let JSONtoString = (obj, currIndent = 1) => {
    let ret = '{\r\n';
    let makeLine = (obj, prop, indentTimes) => {
        let str =
            new Array(indentTimes).fill('    ').join('') +
            `${prop}: ${typeof obj[prop] == 'object' ? JSONtoString(obj[prop], indentTimes + 1) : obj[prop]}\r\n`;
        return str;
    };
    for (const prop in obj) {
        ret += makeLine(obj, prop, currIndent);
    }
    return ret + new Array(currIndent - 1).fill('    ').join('') + '}';
};
app.use(bodyParser.json());
app.use(cors());
let apiRouter = express.Router();
let v1Router = express.Router();
apiRouter.use(function timeLog(req, res, next) {
    process.reqCount++;
    next();
});
v1Router.get('/', async (req, res) => {
    res.send(
        JSON.stringify({
            availableEndpoints: 'users',
        }),
    );
});
v1Router.use('/users', usersRouter);
apiRouter.use('/v1', v1Router);
app.use('/api', apiRouter);
var Vector = require('./Vector.js');
const { strict } = require('assert');
const { stringify } = require('querystring');
const { nextTick } = require('process');
const { time } = require('console');
// Aliases
app.get('/.well-known/pki-validation', (req, res) => {
    res.sendFile(path.join(__dirname, '/client/index.html'));
});
app.get('/', function (request, response) {
    response.sendFile(path.join(__dirname, '/client/index.html'));
});
app.get('/404.js', function (request, response) {
    response.sendFile(path.join(__dirname, '/404.js'));
});
app.get('/404.css', function (request, response) {
    response.sendFile(path.join(__dirname, '/404.css'));
});
app.set('port', port);
app.use('/client', express.static(__dirname + '/client'));
app.use('/.well-known/pki-validation', express.static(__dirname + '/'));
app.use('/', express.static(__dirname + '/client'));
app.use(favicon(path.join(__dirname, '/client/favicon.ico')));
app.use(function (req, res, next) {
    res.status(404).sendFile(__dirname + '/404.html');
});
var adminList = [];
if (process.env.NODE_ENV == 'production') {
    let errorHandler = (e) => {
        let errorList = mongoDB.databases.get('collapsa').collections.get('errorList');
        errorList.addDocument(e);
    };
    process.on('uncaughtException', errorHandler);
    process.on('unhandledRejection', errorHandler);
}
/*
let main = [[114, 137, 218], [59, 87, 157], [100, 65, 164]]
let dark = [[91, 110, 174], [47, 70, 126], [80, 52, 131]]
let light = [[142, 161, 225], [98, 121, 177], [131, 103, 182]]
let output = []
main.forEach((e, i) => {
    let innerArray = []
	e.forEach((ee, ie) => {
    	innerArray.push(dark[i][ie]/light[i][ie])
    })
    output.push(innerArray)
})
console.log(output)
console.log([176, 104, 49].map(e => e * 1.25 * 0.6))*/
