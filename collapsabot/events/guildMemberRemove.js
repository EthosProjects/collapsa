const Event = require('../Event.js');
const { MessageEmbed } = require('discord.js');
module.exports = new Event({
    name: 'guildMemberRemove',
    execute: (member, client) => {
        const mLab = client.mLab;
        let guildSetup = mLab.databases
            .get('collapsa')
            .collections.get('discordguildbase')
            .documents.get(member.guild.id).data;
        if (guildSetup.moderation.channel) {
            let channel = member.guild.channels.cache.get(guildSetup.moderation.channel);
            if (!channel) return;
            let embed = new MessageEmbed()
                .setTitle('Member left')
                .setAuthor(member.user.username, member.user.avatarURL())
                .addField('Account creation', member.user.createdAt)
                .addField('Joined date', member.joinedAt);
            channel.send(embed);
        }
    },
});
