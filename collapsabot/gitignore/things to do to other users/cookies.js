const Discord = require('discord.js');
module.exports = {
    name: 'cookie',
    aliases: ['cookies'],
    category: 'fun',
    description: 'Give someone a cookie!',
    usage: '<cookie (@user)',

    run: async (bot, message, args) => {
        if (!message.mentions.users.first()) return message.reply('You need to mention someone to give them a cookie!');
        if (message.mentions.users.first().id === message.author.id)
            return message.channel.send(`<@${message.author.id}> You cannot give a cookies to yourself`);
        let randomColor = '#000000'.replace(/0/g, function () {
            return (~~(Math.random() * 16)).toString(16);
        });
        const embed = new Discord.MessageEmbed()
            .setColor(randomColor)
            .setTitle(`${message.author.username} gave some cookies to ${message.mentions.users.first().username}`)
            .setDescription('🍪🍪🍪🍪🍪🍪🍪🍪🍪');
        message.channel.send({ embed });
    },
};
