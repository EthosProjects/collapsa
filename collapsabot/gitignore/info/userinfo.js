const Discord = require('discord.js');

module.exports = {
    name: 'userinfo',
    aliases: ['uinfo'],
    category: 'info',
    description: "Displays a user's Information!",
    usage: '<uinfo @user',
    /**
     * @param {Discord.Message} message
     */
    run: async (bot, message, args) => {
        let inline = true;
        let resence = true;
        const status = {
            online: '**🟢 Online**',
            idle: '**🟡 Idle**',
            dnd: '**🔴 Do not Disturb**',
            offline: '**⚫ Offline**',
        };

        const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]) || message.member;

        if (member.user.bot === true) {
            bot = '✅ Yes';
        } else {
            bot = '❌ No';
        }

        let embed = new Discord.MessageEmbed()
            .setThumbnail(member.user.displayAvatarURL())
            .setColor(member.displayHexColor === '#000000' ? '#ffffff' : member.displayHexColor)
            .addField('**Full Username**', `**${member.user.tag}**`, inline)
            .addField('**ID**', member.user.id, inline)
            .addField(
                '**Nickname**',
                `${member.displayName != null ? `**✅ Nickname: ${member.displayName}**` : '**❌ None**'}`,
            )
            .addField('**Bot**', `**${bot}**`)
            .addField('**Status**', `${status[member.user.presence.status]}`)
            .addField(
                '**Playing**',
                `${member.user.presence.game ? `**🎮 ${member.user.presence.game.name}**` : '**❌ Not playing**'}`,
            )
            .addField(
                '**Roles**',
                `${
                    member.roles.cache
                        .filter((r) => r.id !== message.guild.id)
                        .map((roles) => `\`${roles.name}\``)
                        .join(' **|** ') || '**❌ No Roles**'
                }`,
            )
            .addField('**Discord Account Created On**', member.user.createdAt)
            .setFooter(`Information about ${member.user.username}`)
            .setTimestamp();

        message.channel.send(embed);
    },
};
