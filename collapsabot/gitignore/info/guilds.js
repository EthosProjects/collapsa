const Discord = require("discord.js");
const superagent = require("superagent");
module.exports = {
  name: "servers",
  category: "info",
  description: "Shows the Servers Duke Bot is in!",
  usage: "<servers",
  //this command is only for me to use. since the bot is on Top.gg. this is considered personal information
  run: async (client, message, args) => {
    let target = message.author.id === "436016533454454784";
    let msg = client.guilds.cache
      .map((guild) => `**${guild.name}** Members: ${guild.memberCount}`)
      .join("\n");
    if (!target)
      return message.reply(
        "Only the bot Owner <@436016533454454784> Can use this Command. sorry"
      );
    else {
      let embed = new Discord.MessageEmbed()
        .setTitle(`I am in ${client.guilds.cache.size} servers!`)
        .setDescription(`${msg}`)
        .setColor("#0x00FF17");

      message.channel.send(embed);
    } // oh okay. imma start it up, so test it real quick
  },
};
