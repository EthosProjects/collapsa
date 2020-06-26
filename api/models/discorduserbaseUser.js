const genSnowflake = require('../../util/genSnowflake.js')
class discorduserbaseUser {
    constructor(options){
        this._id = genSnowflake(process.reqCount.toString(2), '2', '0')
        this.id = this._id
        this.guilds = {}
        Object.assign(this, options)
        for(const prop in this.guilds){
            let guild = Object.assign({
                muteTimeEnd:false,
                banTimeEnd:false,
                exp:{
                    amount:0,
                    level:0
                },
                warnings:[]
            }, this.guilds[prop])
            guild.warnings = guild.warnings.map(w => Object.assign({by:'DefaultAuthor', reason:'DefaultReason', time:new Date().getTime()}, w))
            this.guilds[prop] = guild
        }
    }
}
module.exports = discorduserbaseUser