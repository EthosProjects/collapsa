const {
  MessageEmbed,
  Message,
  Collection,
  Client,
  GuildMember,
} = require("discord.js");
const Command = require("../../Command.js");
const Argument = require("../../Argument.js");
const { discorduserbaseUser } = require("../../../api/models/index.js");
let toLiteral = (obj) => JSON.parse(JSON.stringify(obj));
module.exports = new Command({
  name: "unmute",
  arguments: [
    new Argument({
      _name: "member",
      optional: false,
      type: "Member",
      description:
        "User ID, mention, or username of the member whom you want to unmute",
    }),
    new Argument({
      _name: "reason",
      optional: true,
      type: "Reason",
      description: "Reason for the unmute",
    }),
  ],
  description: "Unmutes a user",
  permissions: ["MANAGE_ROLES"],
  /**
   * @param {Message} message
   * @param {Array.<string>} args
   * @param {Client} client
   */
  execute: async (message, args = [], client, mLab) => {
    if (!args[0]) {
      return message.reply("No user specified");
    }
    let guild = message.guild;
    let guildSetup = mLab.databases
      .get("collapsa")
      .collections.get("discordguildbase")
      .documents.get(guild.id).data;
    if (!guildSetup) return message.reply("This guild has no set up");
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
      return message.channel.send(
        "It is physically impossible for this bot to have muted that user"
      );
    } else if (
      !discorduserbase.documents.get(member.id).data.guilds[guild.id]
    ) {
      let user = new discorduserbaseUser(
        discorduserbase.documents.get(member.id).data
      );
      user.guilds[guild.id] = {};
      user = new discorduserbaseUser(user);
      await discorduserbase.updateDocument(toLiteral(user));
      return message.channel.send(
        "It is physically impossible for this bot to have muted that user"
      );
    }
    if (member.id === message.author.id)
      return message.channel.send("You're. . . . . . .not muted. . . . . .");
    let authorRolesArr = [...author.roles.cache.values()]
      .map((role) => role.rawPosition)
      .sort((a, b) => b - a);
    let memberRolesArr = [...member.roles.cache.values()]
      .map((role) => role.rawPosition)
      .sort((a, b) => b - a);
    let role = guild.roles.cache.get(guildSetup.mute.role);
    let botRolesArr = [
      ...guild.members.cache.get(client.user.id).roles.cache.values(),
    ]
      .map((role) => role.rawPosition)
      .sort((a, b) => b - a);
    if (
      botRolesArr[0] < role.rawPosition ||
      !guild.members.cache.get(client.user.id).hasPermission(["MANAGE_ROLES"])
    )
      return message.reply(
        "The bot doesn't have permission to assign this role"
      );
    if (role.rawPosition < memberRolesArr[0])
      return message.reply("This unmute will do nothing");
    if (!member.roles.cache.has(role.id))
      return message.reply("This member isn't muted");
    if (author.id == client.owner || author.id == guild.ownerID) {
      let user = new discorduserbaseUser(
        discorduserbase.documents.get(member.id).data
      );
      user.guilds[guild.id].muteTimeEnd = false;
      user = new discorduserbaseUser(user);
      discorduserbase.updateDocument(toLiteral(user));
      await member.roles.remove(role);
      let embed = new MessageEmbed()
        .setColor("#000001")
        .setTitle(`Unmuted ${member.user.username}`)
        .addFields([
          {
            name: "Reason",
            value: reason ? reason : "No reason specified",
            inline: true,
          },
        ])
        .setDescription("Owner force")
        .setAuthor(message.author.username, message.author.avatarURL());
      message.channel.send(embed);
      return;
    }
    if (authorRolesArr[0] <= memberRolesArr[0])
      return message.reply(
        "You can't mute this user your role is not high enough"
      );
    if (!guild.owner.id == member.id)
      return message.reply("This user cannot be unmuted");
    let user = new discorduserbaseUser(
      discorduserbase.documents.get(member.id).data
    );
    user.guilds[guild.id].muteTimeEnd = false;
    user = new discorduserbaseUser(user);
    await discorduserbase.updateDocument(toLiteral(user));
    await member.roles.remove(role);
    let embed = new MessageEmbed()
      .setColor("#000001")
      .setTitle(`Unmuted ${message.mentions.users.first().username}`)
      .addFields([
        {
          name: "Reason",
          value: reason ? reason : "No reason specified",
          inline: true,
        },
      ])
      .setAuthor(message.author.username, message.author.avatarURL());
    message.channel.send(embed);
  },
});
