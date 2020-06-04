const { Client, Collection } = require('discord.js')
const { mlabInteractor } = require('mlab-promise')
const fs = require('fs')
/**
 * @typedef Command
 * @property {string} name
 * @property {Function} execute 
 */
class CollapsaBot extends Client {
    /**
     * 
     * @param {mlabInteractor} mLab 
     */
    constructor(mLab){
        super()
        /**
         * @type {string}
         */
        this.owner = '709238821706793071'
        /**
         * @type {string}
         */
        this.mainGuild = '709240989012721717'
        /**
         * @type {mlabInteractor}
         */
        this.mLab = mLab
        this.supportinvite = ''
        this.version = ''
        /**
         * @type {Collection<string,Command}
         */
        this.commands = new Collection()
        const commandFiles = fs.readdirSync('./collapsabot/commands').filter(file => file.endsWith('.js'));
        for (const file of commandFiles) {
            const command = require(`./commands/${file}`);
            this.commands.set(command.name, command);
        }
    }
}
module.exports = CollapsaBot