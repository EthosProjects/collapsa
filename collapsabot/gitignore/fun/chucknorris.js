const Discord = require('discord.js');
let giveMeAJoke = require('give-me-a-joke');

module.exports = {
    name: 'chucknorrisjoke',
    aliases: ['cnjoke'],
    category: 'fun',
    description: 'Gives a random Chuck Norris Joke!',
    usage: '<cnjoke',

    run: async (bot, message, args) => {
        giveMeAJoke.getRandomCNJoke(function (joke) {
            message.channel.send(joke);
        });
    },
};
