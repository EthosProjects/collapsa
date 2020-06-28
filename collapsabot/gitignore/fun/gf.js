const Discord = require('discord.js');
module.exports = {
    name: 'girlfriend',
    aliases: ['gf'],
    category: 'fun',
    description: "Duke's Girlfriend",
    usage: '<gf',

    run: (client, message, args) => {
        let girlfriend = '<@703053197807321137>';
        let dukelove = '<:DukeLove:712881247306907708>';

        message.channel.send(`${girlfriend} I love youuu ${dukelove} ${dukelove} ${dukelove}`);
    },
};
