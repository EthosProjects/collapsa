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
        let inline = true
        const status = {
            online: "**Online**",
            idle: "**Idle**",
            dnd: "**Do not Disturb**",
            offline: "**Offline**"
        }
        if (member.user.bot === true) {
            bot = "✅ Yes";
        } else {
            bot = "❌ No";
        }

        let embed = new MessageEmbed()
            .setThumbnail((member.user.displayAvatarURL()))
            .setColor(member.displayHexColor === '#000000' ? '#ffffff' : member.displayHexColor)
            .addField("**Full Username**", `**${member.user.tag}**`, inline)
            .addField("**ID**", member.user.id, inline)
            .addField("**Nickname**", `${member.displayName != null ? `**✅ Nickname: ${member.displayName}**` : "**❌ None**"}`)
            .addField("**Bot**", `**${bot}**`)
            .addField("**Status**", `${status[member.user.presence.status]}`)
            .addField("**Playing**", `${member.user.presence.game ? `**🎮 ${member.user.presence.game.name}**` : "**❌ Not playing**"}`)
            .addField("**Roles**", `${member.roles.cache.filter(r => r.id !== message.guild.id).map(rolee => rolee.name).join(" **|** ") || "**❌ No Roles**"}`)
            .addField("**Discord Account Created On**", member.user.createdAt)
            .setFooter(`Information about ${member.user.username}`)
            .setAuthor("CollapsaBot", 'http://collapsa.io/client/img/favicon.png')
            .setTimestamp()
    
        message.channel.send(embed);
    }
}