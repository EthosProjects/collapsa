const Discord = require('discord.js');
const superagent = require('superagent');

module.exports = {
    name: 'lizard',
    category: 'fun',
    description: 'lick the mentioned user',
    usage: '<lizard',

    run: async (client, message, args) => {
        const { body } = await superagent.get('https://nekos.life/api/lizard');

        const embed = new Discord.MessageEmbed().setColor('#0x00FF17').setImage(body.url);
        message.channel.send({ embed });
    },
};
