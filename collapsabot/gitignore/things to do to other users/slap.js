const Discord = require("discord.js");
const superagent = require("superagent");

module.exports = {
  name: "slap",
  category: "things to do to other users",
  description: "slap the mentioned user",
  usage: "<slap (user)",

  run: async (client, message, args, tools) => {
    if (!message.mentions.users.first())
      return message.reply("You need to mention someone to slap them");
    if (message.mentions.users.first().id === "242263403001937920")
      return message.reply("You can't hurt him you pleblord.:facepalm:");
    const { body } = await superagent.get("https://nekos.life/api/v2/img/slap");

    const embed = new Discord.MessageEmbed()
      .setColor("#0x00FF17")
      .setTitle(
        `${message.mentions.users.first().username} You got slapped by ${
          message.author.username
        }, OuCh`
      )
      .setImage(body.url);
    message.channel.send({ embed });
  },
};
