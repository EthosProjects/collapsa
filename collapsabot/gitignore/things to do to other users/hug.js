const Discord = require('discord.js');
const superagent = require('superagent');

module.exports = {
    name: 'hug',
    category: 'things to do to other users',
    description: 'hug the mentioned user',
    usage: '<hug (user)',

    run: async (client, message, args, tools) => {
        if (!message.mentions.users.first()) return message.reply('You need to mention someone to hug them');
        const { body } = await superagent.get('https://nekos.life/api/hug');

        const embed = new Discord.MessageEmbed()
            .setColor('#0x00FF17')
            .setTitle(`${message.author.username} hugged ${message.mentions.users.first().username}`)
            .setImage(body.url);
        message.channel.send({ embed });
    },
};
