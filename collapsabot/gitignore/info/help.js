const { MessageEmbed } = require("discord.js");
const { stripIndents } = require("common-tags");
const Discord = require("discord.js");

module.exports = {
  name: "help",
  aliases: ["h"],
  category: "info",
  description: "Need help? Displays all commands.",
  usage: "[command | alias]",

  run: (client, message, args) => {
    let user = message.author;

    let dmsEmbed = new Discord.MessageEmbed()
      .setThumbnail(
        "https://cdn.discordapp.com/attachments/700849887394398208/702562846675959878/ProfilePicture.png"
      )
      .setTitle(`**Help**`)
      .setAuthor(user.username, user.avatarURL)
      .setColor("#00ff00")
      .setDescription(`You asked for help in \`${message.guild.name}\`.`)
      .setURL("https://notcreepa.wixsite.com/dukebot/commands")
      .setFooter("Click the blue link for the help menu!")
      .setTimestamp();

    user.send(dmsEmbed);

    message.channel.send("Check your dms for the help message!");
  },
};
