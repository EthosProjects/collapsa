const Discord = require("discord.js");
const superagent = require("superagent");

module.exports = {
  name: "tickle",
  category: "things to do to other users",
  description: "tickle the mentioned user",
  usage: "<tickle (user)",

  run: async (client, message, args, tools) => {
    if (!message.mentions.users.first())
      return message.reply("You need to mention someone to tickle them");
    if (message.mentions.users.first().id === "678124077654867978")
      return message.reply("You can't tickle him you pleblord.:facepalm:");
    const { body } = await superagent.get(
      "https://nekos.life/api/v2/img/tickle"
    );

    const embed = new Discord.MessageEmbed()
      .setColor("#0x00FF17")
      .setTitle(
        `${message.mentions.users.first().username} You got tickled by ${
          message.author.username
        }, hehe HAHAHA HAHHAHAHHAH`
      )
      .setImage(body.url);
    message.channel.send({ embed });
  },
};
