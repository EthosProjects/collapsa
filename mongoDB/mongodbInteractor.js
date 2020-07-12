const { MongoClient } = require('mongodb');
const { Collection } = require('discord.js');
const { EventEmitter } = require('events');
const document = require('./document.js');
const collection = require('./collection.js');
const database = require('./database.js');
class mongodbInteractor extends EventEmitter {
    constructor(username, password) {
        super();
        this.client = new MongoClient(
            `mongodb+srv://${username}:${password}@cluster0-cpzc9.mongodb.net/collapsa?retryWrites=true&w=majority`,
            { useUnifiedTopology: true },
        );
        /**
         * @type {Collection<string, collection>}
         */
        this.collections = new Collection();
        /**
         * @type {Collection<string, database>}
         */
        this.databases = new Collection();
        this.client.connect().then(async (client) => {
            let collapsa = this.client.db('collapsa');
            let collections = await collapsa.listCollections().toArray();
            let colPromises = collections.map((c) => {
                return new Promise((resolve, reject) => {
                    let col = collapsa.collection(c.name);
                    col.find()
                        .toArray()
                        .then((ds) => {
                            let documents = ds.map((doc) => new document(doc.id, doc));
                            resolve(new collection(this.client, c.name, documents, 'collapsa'));
                        });
                });
            });
            Promise.all(colPromises).then((cols) => {
                this.databases.set('collapsa', new database('collapsa', cols));
                this.emit('ready');
            });
        });
    }
}
module.exports = mongodbInteractor;
