const { MessageEmbed, Message, GuildMember } = require("discord.js");
const Command = require("../../Command.js");
const Argument = require("../../Argument.js");
const {
  discorduserbaseUser,
  discordguildbaseGuild,
} = require("../../../api/models");
let toLiteral = (obj) => JSON.parse(JSON.stringify(obj));
module.exports = new Command({
  name: "kick",
  arguments: [
    new Argument({
      _name: "member",
      optional: false,
      type: "Member",
      description:
        "User ID, mention, or username of the member whom you want to kick",
    }),
    new Argument({
      _name: "reason",
      optional: true,
      type: "Reason",
      description: "Reason for the kick",
    }),
  ],
  description: "Kicks a user",
  permissions: ["KICK_MEMBERS"],
  /**
   * @param {Message} message
   * @param {Array.<string>} args
   * @param {CollapsaBot} client
   * @param {mlabInteractor} mLab
   */
  execute: async (message, args = [], client, mLab) => {
    let guild = message.guild;
    let author = guild.members.cache.get(message.author.id);
    let member = args[0];
    let reason = args[1];
    if (!(member instanceof GuildMember)) return;
    let collapsa = mLab.databases.get("collapsa");
    let discorduserbase = collapsa.collections.get("discorduserbase");
    if (!discorduserbase.documents.has(member.id)) {
      let doc = {
        id: member.id,
        guilds: {},
      };
      doc.guilds[guild.id] = {};
      let user = new discorduserbaseUser(doc);
      await discorduserbase.addDocument(toLiteral(user));
    } else if (
      !discorduserbase.documents.get(member.id).data.guilds[guild.id]
    ) {
      let user = new discorduserbaseUser(
        discorduserbase.documents.get(member.id).data
      );
      user.guilds[guild.id] = {};
      user = new discorduserbaseUser(user);
      await discorduserbase.updateDocument(toLiteral(user));
    }
    if (member.id === message.author.id)
      return message.channel.send("You can't kick yourself");
    let authorRolesArr = [...author.roles.cache.values()]
      .map((role) => role.rawPosition)
      .sort((a, b) => b - a);
    let memberRolesArr = [...member.roles.cache.values()]
      .map((role) => role.rawPosition)
      .sort((a, b) => b - a);
    if (!member.kickable)
      return message.reply(
        "You can't kick this user because the bot does not have sufficient permissions!"
      );
    if (!guild.owner.id == member.id.id)
      return message.reply(
        "You can't kick this user because they own the server"
      );
    if (guild.owner.Kicked == author.id || author.id == client.owner) {
      await member.kick();
      let user = new discorduserbaseUser(
        discorduserbase.documents.get(member.id).data
      );
      user.guilds[guild.id].moderation.push({
        type: "Kick",
        by: message.author.username,
        reason,
        time: new Date().getTime(),
      });
      user = new discorduserbaseUser(user);
      await discorduserbase.updateDocument(toLiteral(user));
      let embed = new MessageEmbed()
        .setColor("#ff0000")
        .setTitle(`Kicked ${member.displayName}`)
        .addField("Reason", reason ? reason : "No reason specified")
        .setDescription("Owner force")
        .setAuthor(
          "CollapsaBot",
          "http://www.collapsa.io/client/img/favicon.png"
        )
        .setTimestamp();
      message.channel.send(embed);
      return;
    }
    if (authorRolesArr[0] <= memberRolesArr[0])
      return message.reply(
        "You can't kick this user your role is not high enough"
      );
    // Check if the user is kickable with the bot's permissions
    await member.kick(); // Kicks the user
    let user = new discorduserbaseUser(
      discorduserbase.documents.get(member.id).data
    );
    user.guilds[guild.id].moderation.push({
      type: "Kick",
      by: message.author.username,
      reason,
      time: new Date().getTime(),
    });
    user = new discorduserbaseUser(user);
    await discorduserbase.updateDocument(toLiteral(user));
    let embed = new MessageEmbed()
      .setColor("purple")
      .setTitle(`Kicked ${member.displayName.username}`)
      .addField("Reason", reason ? reason : "No reason specified")
      .setAuthor(message.author.username, message.author.avatarURL());
    message.channel.send(embed);
  },
});
