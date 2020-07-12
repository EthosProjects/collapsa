const Discord = require('discord.js');

module.exports = {
    name: 'wakanda',
    category: 'fun',
    description: 'Wakanda Forever!?!?',
    usage: '<wakanda',

    run: async (client, message, args) => {
        wakanda = [
            'https://media.giphy.com/media/1nRxQObbYtlrsycVLo/giphy.gif',
            'https://media.giphy.com/media/xkiFVgqCyJ9T7VkZxV/giphy.gif',
            'https://media.giphy.com/media/1xor4Lozq7VMtAyfLJ/giphy.gif',
            'https://media.giphy.com/media/l50uSBj3K2xvf8kool/giphy.gif',
            'https://media.giphy.com/media/5UvznVg5pJATPbuq2Q/giphy.gif',
        ];
        let wakandaresult = Math.floor(Math.random() * wakanda.length);

        let emb = new Discord.MessageEmbed()
            .setColor('#00f00')
            .setDescription(`${message.author} Wakanda Forever!!!`)
            .setImage(wakanda[wakandaresult]);

        message.channel.send(emb);
    },
};
