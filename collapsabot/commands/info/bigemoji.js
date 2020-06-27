const {MessageEmbed, Message, GuildEmoji} = require('discord.js')
const Command = require('../../Command.js')
const Argument = require('../../Argument.js')
module.exports = new Command({
    name:'bigemoji',
    arguments:[
        new Argument({
            _name:'emoji',
            optional:false,
            nameStartsWithVowel:true,
            type:'Emoji',
            description:'The emoji to enlarge'
        })
    ],
    /**
     * @param {Message} message
     */
    execute: async (message, args = [], client, mLab) => {
        let emoji = args[0]
        console.log(emoji)
        if(!(emoji instanceof GuildEmoji)) return message.reply('Invalid Emoji specified')
        let embed = new MessageEmbed()
            .setImage(emoji.url)
            .setAuthor("CollapsaBot", 'http://www.collapsa.io/client/img/favicon.png')
            .setTimestamp()
        await message.channel.send(embed);
    }
})