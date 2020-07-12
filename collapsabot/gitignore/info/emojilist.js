const Discord = require("discord.js");
const bot = new Discord.Client();
module.exports = {
  name: "emojilist",
  aliases: ["emojis"],
  category: "moderation",
  description: "Displays Emojis",

  run: (client, message, args) => {
    const emoji = message.guild.emojis.cache;
    if (!emoji.size) return message.channel.send("Server has no emojis");
    if (emoji.size >= 40)
      return message.channel.send(
        "The server has too many emojis to post in a message!"
      );
    //Why does it say >= 40? The emoji list can only be 50 long. might as well go big or go home
    //All emojis have a very specific length
    //I think you could just truncate it. i'll try it after im done
    message.channel.send(emoji.map((e) => e).join(""));
  },
  //kk
};
