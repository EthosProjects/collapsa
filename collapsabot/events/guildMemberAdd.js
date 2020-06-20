const Event = require('../Event.js')
const { MessageEmbed } = require('discord.js')
module.exports = new Event({
    name:'guildMemberAdd',
    execute:(member, client) => {
        const mLab = client.mLab
        let guildSetup = mLab.databases
            .get('collapsa')
            .collections.get('discordguildbase')
            .documents.get(member.guild.id).data;
        if (
            mLab.databases
                .get('collapsa')
                .collections.get('discorduserbase')
                .documents.has(member.id)
        ) {
            let mData = mLab.databases
                .get('collapsa')
                .collections.get('discorduserbase')
                .documents.get(member.id);
            if (
                mData.data.muteTimeEnd &&
                guildSetup.mute.role &&
                member.guild.roles.cache.has(guildSetup.mute.role)
            ) {
                let role = guildSetup.mute.role;
            }
        }
        if (guildSetup.moderation.channel) {
            let channel = member.guild.channels.cache.get(
                guildSetup.moderation.channel
            );
            if(!channel) return
            let embed = new MessageEmbed()
                .setTitle('Member joined')
                .setAuthor(member.user.username, member.user.avatarURL())
                .addField('Account creation', member.user.createdAt)
                .addField('Joined date', member.joinedAt);
            channel.send(embed);
        }
        if (guildSetup.welcome.role) {
            let role = member.guild.roles.cache.find(
                (r) => r.id == guildSetup.welcome.role
            );
            member.roles.add(role);
        }
    }
})