const {MessageEmbed, Message} = require('discord.js')
const Command = require('../../Command.js')
const Argument = require('../../Argument.js')
module.exports = new Command({
    name:'avatar',
    arguments:[
        new Argument({
            _name:'member',
            optional:true,
            type:'Member',
            description:'User ID, mention, or username of the member whom you want to get the avatar of',
        })
    ],
    description:'Get the avatar of yourself, or other users',
    /**
     * @param {Message} message
     */
    execute: async (message, args = [], client, mLab) => {
        let member = args[0] || message.member
        let embed = new MessageEmbed()
            .setColor(member.displayHexColor === '#000000' ? '#ffffff' : member.displayHexColor)
            .setImage(member.user.avatarURL({ dynamic:true }).replace('.webp', '.png') + '?size=1024')
            .setFooter(`Avatar of ${member.user.username}`)
            .setAuthor("CollapsaBot", 'http://www.collapsa.io/client/img/favicon.png')
            .setTimestamp()
        message.channel.send(embed);
    }
})