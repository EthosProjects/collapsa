const { MessageEmbed } = require("discord.js");
const { stripIndents } = require("common-tags");

module.exports = {
  name: "report",
  category: "moderation",
  description: "Reports a member",
  usage: "<mention, id>",
  run: async (client, message, args) => {
    if (message.deletable) message.delete();

    let rMember =
      message.mentions.members.first() || message.guild.members.get(args[0]);

    if (!rMember)
      return message
        .reply("Couldn't find that person?")
        .then((m) => m.delete(5000));

    if (rMember.hasPermission("BAN_MEMBERS"))
      return message.channel
        .send("I cannot report that user due to role hierarchy")
        .then((m) => m.delete(5000));
    if (rMember.user.bot)
      return message.channel
        .send("I cannot report that member because they are a bot")
        .then((m) => m.delete(5000));

    if (!args[1])
      return message.channel
        .send("Please provide a reason for the report")
        .then((m) => m.delete(5000));

    const channel =
      message.guild.channels.cache.find((c) => c.name === "duke-reports") ||
      message.channel;

    if (!channel)
      return message.channel
        .send("Couldn't find a `#duke-reports` channel")
        .then((m) => m.delete(5000));

    const embed = new MessageEmbed()
      .setColor("#0x00FF17")
      .setTimestamp()
      .setFooter(message.guild.name, message.guild.iconURL)
      .setAuthor("Reported member", rMember.user.displayAvatarURL)
      .setDescription(stripIndents`**- Member:** ${rMember} (${rMember.user.id})
            **- Reported by:** ${message.member}
            **- Reported in:** ${message.channel}
            **- Reason:** ${args.slice(1).join(" ")}`);

    return channel.send(embed);
  },
};
