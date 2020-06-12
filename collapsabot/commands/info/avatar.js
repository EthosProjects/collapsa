const {MessageEmbed, Message} = require('discord.js')
const Command = require('../../Command.js')
const Argument = require('../../Argument.js')
module.exports = new Command({
    name:'avatar',
    arguments:[
        new Argument({
            _name:'user',
            optional:true,
            type:'User',
            description:'User ID, mention, or username of the user whom you want to get the avatar of',
        })
    ],
    description:'Get the avatar of yourself, or other users',
    /**
     * @param {Message} message
     */
    execute: async (message, args = [], client, mLab) => {
        let member = message.mentions.members.first()
        if(!member) member = message.guild.members.cache.get(args[0])
        if(!member) member = message.guild.members.cache.find(m => m.displayName == args[0]) || message.guild.members.cache.find(m => m.user.username == args[0])
        if(!member) member = message.member
        let embed = new MessageEmbed()
            .setColor(member.displayHexColor === '#000000' ? '#ffffff' : member.displayHexColor)
            .setImage(member.user.avatarURL({ dynamic:true }).replace('.webp', '.png') + '?size=1024')
            .setFooter(`Avatar of ${member.user.username}`)
            .setAuthor("CollapsaBot", 'http://www.collapsa.io/client/img/favicon.png')
            .setTimestamp()
        message.channel.send(embed);
    }
})