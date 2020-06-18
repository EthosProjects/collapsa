const { MongoClient } = require('mongodb')
const { Collection } = require('discord.js')
/**
 * A database structure
 * @extends {baseStructure}
 */
class database {
    /**
     * 
     * @param {string} apiKey Your API key
     * @param {string} name 
     * @param {Map.<string, collection>} collections collections to add by default
     */
    constructor(name, collections){
        this.name = name
        /**
         * @type {Collection<string, collection>}
         */
        this.collections = new Collection(collections.map(c => [c.name, c]))
    }
    /**
     * 
     * @param {string} name Name of the collection to create
     */
    addCollection(name){
        this.collections.set(name, new collection(this.apiKey, name, [], this.name))
    }
}
module.exports = database