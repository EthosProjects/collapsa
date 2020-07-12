const Discord = require("discord.js");
module.exports = {
  name: "woosh",
  category: "things to do to other users",
  description: "wooshes over their head",
  usage: "<woosh @user",
  run: async (client, message, args) => {
    let avatar = message.mentions.users.size
      ? message.mentions.users.first().avatarURL
      : message.author.avatarURL;

    const embed = new Discord.MessageEmbed()
      .setColor("#ff9900")
      .setImage(`https://api.alexflipnote.dev/jokeoverhead?image=` + avatar);
    message.channel.send({ embed });
  },
};
