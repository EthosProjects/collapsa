const Argument = require('./Argument.js')
class Command {
    constructor(options){
        this.name = Math.random().toString(16)
        /**
         * @type {Array.<Argument>}
         */
        this.arguments = []
        this.description = 'Default command description'
        this.permissions = ['SEND_MESSAGES']
        this.execute = message => {
            message.channel.send('This command has not been set up :(')
        }
        Object.assign(this, options)
    }
}
module.exports = Command