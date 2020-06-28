const Discord = require('discord.js');
let giveMeAJoke = require('give-me-a-joke');

module.exports = {
    name: 'joke',
    category: 'fun',
    description: 'Random Joke',
    usage: '<joke',

    run: async (bot, message, args) => {
        giveMeAJoke.getRandomDadJoke(function (joke) {
            message.channel.send(joke);
        });
    },
};
