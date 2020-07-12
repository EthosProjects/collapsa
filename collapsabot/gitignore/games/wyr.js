const Discord = require('discord.js');
const bot = new Discord.Client();
module.exports = {
    //roger that <3 much love
    name: 'wouldyourather',
    aliases: ['wyr'],
    category: 'games',
    description: 'starts a would you rather game!',
    usage: '<wyr',
    //oh yeah sure lol. I want to test these commands before I say you are fine to use the,, specifically the game ones
    //because they look complicated and I dont want to miss anything
    run: async (client, message, args) => {
        if (!message.guild.member(client.user).hasPermission('ADD_REACTIONS'))
            return message.reply('Sorry, i dont have the perms to do this cmd i need ADD_REACTIONS. :x:');
        const superagent = require('superagent');
        const { body } = await superagent.get('http://www.rrrather.com/botapi');
        const embed = new Discord.MessageEmbed()
            .setTitle(`**Would You Rather..**`)
            .setColor(0x00a2e8)
            .addField(`*➖➖➖➖➖➖*`, `🅰 **${body.choicea}**`)
            .addField(`*➖➖➖➖➖➖*`, `**OR**`)
            .addField(`*➖➖➖➖➖➖*`, `🅱 **${body.choiceb}?**`);
        message.channel.send({ embed }).then((m) => {
            m.react('🅰');
            m.react('🅱');
        });
    },
};
