const { Command } = require('discord.js-commando');
const snekfetch = require('snekfetch');
const Discord = require("discord.js");

module.exports = {
    name: "dog",
    category: "fun",
    description: "Random Dogo?!?",
    usage: "[command]",

    run: async (bot, message, args) => {

        const { body } = await snekfetch.get('https://random.dog/woof.json');
        const embed = new Discord.MessageEmbed()
        .setColor("#00ff00")
        .setImage(body.url);
    
        message.channel.send(embed)
    
    }
}