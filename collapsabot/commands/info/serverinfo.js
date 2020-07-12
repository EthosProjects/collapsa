const { MessageEmbed, Message } = require('discord.js');
const Command = require('../../Command.js');
module.exports = new Command({
    name: 'serverinfo',
    description: 'Get information on a server',
    /**
     * @param {Message} message
     */
    execute: async (message, args = [], client, mLab) => {
        const verlvl = {
            NONE: 'None',
            LOW: 'Low',
            MEDIUM: 'Medium',
            HIGH: '(╯°□°）╯︵ ┻━┻',
            VERY_HIGH: '(ノಠ益ಠ)ノ彡┻━┻',
        };

        let inline = true;
        let sicon = message.guild.iconURL;
        //console.log(message.guild.verificationLevel)
        let embed = new MessageEmbed()
            .setColor('#00ff00')
            .setThumbnail(sicon)
            .setAuthor(message.guild.name, message.guild.iconURL({ dynamic: true }))
            .addField('Name', message.guild.name, inline)
            .addField('ID', message.guild.id, inline)
            .addField('Owner', message.guild.owner, inline)
            .addField('Region', message.guild.region, inline)
            .addField('Verification Level', verlvl[message.guild.verificationLevel], inline)
            .addField('Members', `👥: ${message.guild.memberCount}`, inline)
            .addField('Roles', message.guild.roles.cache.size, inline)
            .addField('Channels', message.guild.channels.cache.size, inline)
            .addField('You Joined', message.member.joinedAt)
            .setFooter(`Created ${message.guild.createdAt}`);

        message.channel.send(embed);
    },
});
