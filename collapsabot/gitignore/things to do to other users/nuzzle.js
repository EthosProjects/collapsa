const Discord = require('discord.js');
const superagent = require('superagent');

module.exports = {
    name: 'nuzzle',
    category: 'things to do to other users',
    description: 'nuzzle the mentioned user',
    usage: '<nuzzle (user)',

    run: async (client, message, args, tools) => {
        if (!message.mentions.users.first()) return message.reply('You need to mention someone to nuzzle them');
        const { body } = await superagent.get('https://nekos.life/api/v2/img/cuddle');

        const embed = new Discord.MessageEmbed()
            .setColor('#0x00FF17')
            .setTitle(`${message.author.username} nuzzeled ${message.mentions.users.first().username}`)
            .setImage(body.url);
        message.channel.send({ embed });
    },
};
