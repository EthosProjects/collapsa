const Discord = require("discord.js");
const superagent = require("superagent");

module.exports = {
  name: "kiss",
  category: "things to do to other users",
  description: "kiss the mentioned user",
  usage: "<kiss (user)",

  run: async (client, message, args, tools) => {
    if (!message.mentions.users.first())
      return message.reply("You need to mention someone to kiss them");
    const { body } = await superagent.get("https://nekos.life/api/kiss");

    const embed = new Discord.MessageEmbed()
      .setColor("#0x00FF17")
      .setTitle(
        `${message.author.username} kissed ${
          message.mentions.users.first().username
        }, Awww`
      )
      .setImage(body.url);
    message.channel.send({ embed });
  },
};
