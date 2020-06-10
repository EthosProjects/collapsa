const Discord = require("discord.js");

module.exports = {
    name: "serverinfo",
    aliases: ["sinfo"],
    category: "info",
    description: "Displays the server Info!",
    usage: "<sinfo",
    /**
     * @param {Discord.Message} message
     */
    run: async (bot, message, args) => {
        const verlvl = {
          "NONE": "None",
          "LOW": "Low",
          "MEDIUM": "Medium",
          "HIGH": "(╯°□°）╯︵ ┻━┻",
          "VERY_HIGH": "(ノಠ益ಠ)ノ彡┻━┻"
        }
      
          let inline = true
          let sicon = message.guild.iconURL;
          //console.log(message.guild.verificationLevel)
          let serverembed = new Discord.MessageEmbed()
          .setColor("#00ff00")
          .setThumbnail(sicon)
          .setAuthor(message.guild.name)
          .addField("Name", message.guild.name, inline)
          .addField("ID", message.guild.id, inline)
          .addField("Owner", message.guild.owner, inline)
          .addField("Region", message.guild.region, inline)
          .addField("Verification Level", verlvl[message.guild.verificationLevel] ,inline)
          .addField("Members", `👥: ${message.guild.memberCount}`, inline)
          .addField("Roles", message.guild.roles.cache.size, inline)
          .addField("Channels", message.guild.channels.cache.size, inline)
          .addField("You Joined", message.member.joinedAt)
          .setFooter(`Created ${message.guild.createdAt}`);
      
          message.channel.send(serverembed);
      

      }
}