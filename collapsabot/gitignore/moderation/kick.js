const { MessageEmbed } = require("discord.js");
const { stripIndents } = require("common-tags");
const { promptMessage } = require("../../functions.js");

module.exports = {
  name: "kick",
  category: "moderation",
  description: "kicks the member",
  usage: "A<kick (User) (Reason)",
  run: async (client, message, args) => {
    const logChannel =
      message.guild.channels.cache.find((c) => c.name === "duke-logs") ||
      message.channel;

    if (message.deletable) message.delete();
    // No args
    if (!args[0]) {
      return message
        .reply("Please provide a person to Kick.")
        .then((m) => m.delete());
    }

    // No reason
    if (!args[1]) {
      return message
        .reply("Please provide a reason to Kick.")
        .then((m) => m.delete());
    }

    // No author permissions
    if (!message.member.hasPermission("KICK_MEMBERS")) {
      return message
        .reply(
          "❌ You do not have permissions to Kick members. Please contact a staff member"
        )
        .then((m) => m.delete());
    }
    // No bot permissions
    if (!message.guild.me.hasPermission("KICK_MEMBERS")) {
      return message
        .reply(
          "❌ I do not have permissions to Kick members. Please contact a staff member"
        )
        .then((m) => m.delete());
    }

    const toKick =
      message.mentions.members.first() || message.guild.members.get(args[0]);

    // No member found
    if (!toKick) {
      return message
        .reply("Couldn't find that member, try again")
        .then((m) => m.delete());
    }

    // Can't Kick urself
    if (toKick.id === message.author.id) {
      return message
        .reply("You can't Kick yourself...")
        .then((m) => m.delete());
    }

    // Check if the user's kickable
    if (!toKick.kickable) {
      return message
        .reply(
          "I can't Kick that person due to role hierarchy, I suppose. Ask a staff member to move my role above the role you are trying to Kick"
        )
        .then((m) => m.delete());
    }

    const embed = new MessageEmbed()
      .setColor("#0x00FF17")
      .setThumbnail(toKick.user.displayAvatarURL)
      .setFooter(message.member.displayName, message.author.displayAvatarURL)
      .setTimestamp()
      .setDescription(stripIndents`**- Kicked member:** ${toKick} (${toKick.id})
            **- Kicked by:** ${message.member} (${message.member.id})
            **- Reason:** ${args.slice(1).join(" ")}`);

    const promptEmbed = new MessageEmbed()
      .setColor("GREEN")
      .setAuthor(`This verification becomes invalid after 30s.`)
      .setDescription(`Do you want to Kick ${toKick}?`);

    // Send the message
    await message.channel.send(promptEmbed).then(async (msg) => {
      // Await the reactions and the reactioncollector
      const emoji = await promptMessage(msg, message.author, 30, ["✅", "❌"]);

      // Verification stuffs
      if (emoji === "✅") {
        msg.delete();

        toKick.kick(args.slice(1).join(" ")).catch((err) => {
          if (err)
            return message.channel.send(
              `Well.... the Kick didn't work out. Here's the error ${err}`
            );
        });

        logChannel.send(embed);
      } else if (emoji === "❌") {
        msg.delete();

        message.reply(`Kick canceled.`).then((m) => m.delete());
      }
    });
  },
};
