const { Command } = require("discord.js-commando");
const snekfetch = require("snekfetch");
const Discord = require("discord.js");
const request = require("request");

module.exports = {
  name: "cat",
  category: "fun",
  description: "Random Kitty?!?",
  usage: "[command]",

  run: async (bot, message, args) => {
    request("http://edgecats.net/random", function (error, response, body) {
      if (!error && response.statusCode == 200) {
        let emb = new Discord.MessageEmbed()
          .setImage(body)
          .setColor("#00ff00")
          .setTitle("Here is your random cat");

        message.channel.send(emb);
      }
    });
  },
};
