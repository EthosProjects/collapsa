const Discord = require('discord.js');
const superagent = require('superagent');

module.exports = {
    name: 'pat',
    category: 'things to do to other users',
    description: 'pat the mentioned user',
    usage: '<pat (user)',

    run: async (client, message, args, tools) => {
        if (!message.mentions.users.first()) return message.reply('You need to mention someone to pat them');
        const { body } = await superagent.get('https://nekos.life/api/pat');

        const embed = new Discord.MessageEmbed()
            .setColor('#0x00FF17')
            .setTitle(`${message.author.username} patted ${message.mentions.users.first().username}`)
            .setImage(body.url);
        message.channel.send({ embed });
    },
};
