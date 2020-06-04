const {MessageEmbed, Message} = require('discord.js')
module.exports = {
    name:'userinfo',
    /**
     * @param {Message} message
     */
    execute: async (message, args = [], client, mLab) => {
        let member = message.mentions.users.first() ? message.guild.members.cache.get(message.mentions.users.first().id) : message.member
        if(message.guild.members.cache.has(args[0])) member = message.guild.members.cache.get(args[0])
        if(message.member.hasPermission('MANAGE_ROLES')) ''
        let embed = new MessageEmbed()
            .setColor('purple')
            .setTitle(member.user.tag)
            .addFields([
                {name: 'Joined at', value:member.joinedAt, inline:true},
                {name: 'Created at', value:member.user.createdAt, inline:true},
                //{name: 'Joiend at', value:member.joinedAt, inline:true},
                //{name: 'Joiend at', value:member.joinedAt, inline:true},
                //message.member.hasPermission('MANAGE_ROLES') ? {name: 'Joiend at', value:member.joinedAt, inline:true}: mLab.databases.get('collapsa').collections.get('discorduserbase').documents.get(member.id).data.warnings
            ])
            .setThumbnail(member.user.avatarURL())
            .setAuthor("CollapsaBot", 'http://collapsa.io/client/img/favicon.png')
            
        message.channel.send(embed)
    }
}