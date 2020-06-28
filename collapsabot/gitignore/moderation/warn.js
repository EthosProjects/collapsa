const Discord = require('discord.js');
const fs = require('fs');
const { MessageEmbed } = require('discord.js');
const { stripIndents } = require('common-tags');

module.exports = {
    name: 'warn',
    category: 'moderation',
    description: 'Warns a User',
    usage: '<warn @user reason',

    run: (client, message, args) => {
        if (!message.member.hasPermission('MANAGE_MESSAGES'))
            return message.reply("You don't have premission to do that!");
        let reason = args.slice(1).join(' ');
        let ruser = message.mentions.members.first();
        if (message.mentions.users.size < 1) return message.reply('You must mention someone to warn them.');
        if (reason.length < 1) return message.reply('You must have a reason for the warning.');

        let dmsEmbed = new Discord.MessageEmbed()
            .setTitle('Warn')
            .setColor('#00ff00')
            .setDescription(`You have been warned on \`${message.guild.name}\``)
            .addField('Warned by', message.author.tag)
            .addField('Reason', reason);

        ruser.user.send(dmsEmbed);

        message.delete();

        const logs = message.guild.channels.cache.find(c => c.name === 'duke-logs') || message.channel;
        const embed = new MessageEmbed()
            .setColor('#0x00FF17')
            .setTimestamp()
            .setFooter(message.guild.name, message.guild.iconURL)
            .setAuthor('Warned member', ruser.displayAvatarURL)
            .setDescription(stripIndents`**- Member:** ${ruser} (${ruser.id})
            **- Warned by:** ${message.member}
            **- Warned in:** ${message.channel}
            **- Reason:** ${reason}`);

        logs.send(embed);
    },
};
