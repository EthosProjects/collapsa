const Discord = require("discord.js");
const bot = new Discord.Client();
module.exports = {
  name: "bigemoji",
  aliases: ["bemoji", "emojiurl", "downloademoji", "dloademoji", "dlemoji"],
  category: "info",
  description: "Displays Emojis",

  run: async (client, message, args = []) => {
    // const emojiii = message.get(args[0])
    let randomColor = "#000000".replace(/0/g, function () {
      return (~~(Math.random() * 16)).toString(16);
    });
    let emojiRegex = /^<a{0,1}:[a-zA-Z0-9_]{2,32}:\d{16,18}>$/;
    if (!args[0].match(emojiRegex)) return message.reply("No emoji specified?");
    let id = args[0]
      .replace(/<a{0,1}:[a-zA-Z0-9_]{2,32}:/, "")
      .replace(/>/, "");
    let embed = new Discord.MessageEmbed()
      .setTitle("Here's the Emoji")
      .setColor(randomColor)
      .setImage(
        `https://cdn.discordapp.com/emojis/${id}.${
          args[0].match(/<a:/) ? "gif" : "png"
        }`
      );
    console.log(
      `https://cdn.discordapp.com/emojis/${id}.${
        args[0].match(/<a:/) ? "gif" : "png"
      }`
    );
    await message.channel.send(embed);
  },
};
//It's sooo long
//I can't run commands in it lol
//run npm uninstall discord.js and npm install discord.js
//kk done
//start up the bot
//did it crash?
//run npm install in terminal
//I'm gonna get to work
//well acc yes
