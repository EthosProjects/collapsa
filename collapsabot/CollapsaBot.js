const { Client, Collection } = require('discord.js');
const { mlabInteractor } = require('mlab-promise');
const Command = require('./Command.js');
const fs = require('fs');
class CollapsaBot extends Client {
    /**
     *
     * @param {mlabInteractor} mLab
     */
    constructor(mLab) {
        super();
        this.prefix = '!';
        /**
         * @type {string}
         */
        this.owner = '709238821706793071';
        /**
         * @type {string}
         */
        this.mainGuild = '709240989012721717';
        /**
         * @type {mlabInteractor}
         */
        this.mLab = mLab;
        this.supportinvite = 'https://discord.gg/MSbqVCy';
        this.version = '0.0.1';
        /**
         * @type {Collection<string,Command>}
         */
        this.commands = new Collection();
        /**
         * @type {Collection<string,Array.<Command>>}
         */
        this.commandFolders = new Collection();
        const commandFolders = fs.readdirSync('./collapsabot/commands');
        for (const folder of commandFolders) {
            const commandFiles = fs
                .readdirSync(`./collapsabot/commands/${folder}`)
                .filter((file) => file.endsWith('.js'));
            let folderArr = [];
            for (const file of commandFiles) {
                /**
                 * @type {Command}
                 */
                const command = require(`./commands/${folder}/${file}`);
                this.commands.set(command.name, command);
                folderArr.push(command);
            }
            this.commandFolders.set(folder, folderArr);
        }
        const eventFiles = fs.readdirSync('./collapsabot/events');
        for (const file of eventFiles) {
            const event = require(`./events/${file}`);
            this.on(event.name, (eventData) => {
                event.execute(eventData, this);
            });
        }
        //console.log(this.commands, this.commandFolders)
    }
}
module.exports = CollapsaBot;
