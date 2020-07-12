const {
  MessageEmbed,
  Message,
  Collection,
  GuildMember,
} = require("discord.js");
const { mlabInteractor } = require("mlab-promise");
const CollapsaBot = require("../../CollapsaBot");
const Command = require("../../Command.js");
const Argument = require("../../Argument.js");
const {
  discorduserbaseUser,
  discordguildbaseGuild,
} = require("../../../api/models");
let toLiteral = (obj) => JSON.parse(JSON.stringify(obj));
module.exports = new Command({
  name: "mute",
  arguments: [
    new Argument({
      _name: "member",
      optional: false,
      type: "Member",
      description:
        "User ID, mention, or username of the member whom you want to mute",
    }),
    new Argument({
      _name: "time",
      optional: true,
      type: "Time",
      description: "Length of the mute",
    }),
    new Argument({
      _name: "reason",
      optional: true,
      type: "Reason",
      description: "Reason for the mute",
    }),
  ],
  permissions: ["MANAGE_ROLES"],
  description: "Mutes a user",
  /**
   * @param {Message} message
   * @param {[GuildMember, Number, String]} args
   * @param {CollapsaBot} client
   * @param {mlabInteractor} mLab
   */
  execute: async (message, args = [], client, mLab) => {
    let currTime = new Date();
    let t = args[1];
    let endTime = currTime.getTime() + t;
    function dhm(t) {
      console.log(cd);
      var cd = 24 * 60 * 60 * 1000,
        ch = 60 * 60 * 1000,
        d = Math.floor(t / cd),
        h = Math.floor((t - d * cd) / ch),
        m = Math.floor((t - d * cd - h * ch) / 60000),
        s = Math.round((t - d * cd - h * ch - m * 60000) / 1000),
        pad = function (n) {
          return n < 10 ? "0" + n : n;
        };
      if (s === 60) {
        m++;
        s = 0;
      }
      if (m === 60) {
        h++;
        m = 0;
      }
      if (h === 24) {
        d++;
        h = 0;
      }
      return (
        (d ? d + ` Day${d > 1 ? "s" : ""} ` : "") +
        (h ? h + ` Hour${h > 1 ? "s" : ""} ` : "") +
        (m ? m + ` Minute${m > 1 ? "s" : ""} ` : "") +
        s +
        ` Second${s != 1 ? "s" : ""}`
      );
    }
    let guild = message.guild;
    let author = guild.members.cache.get(message.author.id);
    let member = args[0];
    let reason = args[2];
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
      return message.channel.send("You can't mute yourself");
    // Check if the user mention or the entered userID is the message author himsmelf
    //if (!reason) return message.reply('You forgot to enter a reason for this ban!');
    // Check if a reason has been given by the message author
    let authorRolesArr = [...author.roles.cache.values()]
      .map((role) => role.rawPosition)
      .sort((a, b) => b - a);
    let memberRolesArr = [...member.roles.cache.values()]
      .map((role) => role.rawPosition)
      .sort((a, b) => b - a);
    let guildSetup = collapsa.collections.get("discordguildbase");
    if (!guildSetup.documents.has(guild.id))
      return message.reply("This server does not have a setup :(");
    if (!guildSetup.documents.get(guild.id).data.mute.role)
      return message.reply("This server does not have a mute role set");
    let role = guild.roles.cache.get(
      guildSetup.documents.get(guild.id).data.mute.role
    );
    if (!role)
      return message.reply(
        "It seems that someone has deleted the muted role for this server. Please reconfigure it"
      );
    if (role.rawPosition < memberRolesArr[0])
      return message.reply("This mute will do nothing");
    if (!guild.me.hasPermission(["MANAGE_ROLES"]))
      return message.reply(
        "You can't mute this user because the bot doesn't have sufficient pemissions"
      );
    if (author.id == client.owner || author.id == guild.ownerID) {
      let user = new discorduserbaseUser(
        discorduserbase.documents.get(member.id).data
      );
      user.guilds[guild.id].muteTimeEnd = endTime;
      user.guilds[guild.id].moderation.push({
        type: "Mute",
        by: message.author.username,
        reason,
        time: new Date().getTime(),
      });
      user = new discorduserbaseUser(user);
      discorduserbase.updateDocument(toLiteral(user));
      setTimeout(() => {
        if (!guild.members.cache.has(member.id)) return;
        member.roles.remove(role, "Times up");
        let user = new discorduserbaseUser(
          discorduserbase.documents.get(member.id).data
        );
        user.guilds[guild.id].muteTimeEnd = false;
        user = new discorduserbaseUser(user);
        discorduserbase.updateDocument(user);
      }, t);
      await member.roles.add(role, reason);
      let embed = new MessageEmbed()
        .setColor("#000001")
        .setTitle(`Muted ${member.user.username}`)
        .addFields([
          {
            name: "Reason",
            value: reason ? reason : "No reason specified",
            inline: true,
          },
          { name: "Time", value: dhm(t), inline: true },
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
      return message.reply(
        "You can't mute this user because they own the server"
      );
    let user = new discorduserbaseUser(
      discorduserbase.documents.get(member.id).data
    );
    user.guilds[guild.id].muteTimeEnd = endTime;
    user.guilds[guild.id].moderation.push({
      type: "Mute",
      by: message.author.username,
      reason,
      time: new Date().getTime(),
    });
    user = new discorduserbaseUser(user);
    await discorduserbase.updateDocument(toLiteral(user));
    await member.roles.add(role, reason);

    setTimeout(() => {
      if (!guild.members.cache.get(member.id)) return;
      member.roles.remove(role);
      let user = new discorduserbaseUser(
        discorduserbase.documents.get(member.id).data
      );
      user.guilds[guild.id].muteTimeEnd = false;
      user = new discorduserbaseUser(user);
      discorduserbase.updateDocument(toLiteral(user));
    }, t);
    let embed = new MessageEmbed()
      .setColor("#000001")
      .setTitle(`Muted ${message.mentions.users.first().username}`)
      .addFields([
        {
          name: "Reason",
          value: reason ? reason : "No reason specified",
          inline: true,
        },
        { name: "Time", value: dhm(t), inline: true },
      ])
      .setAuthor(message.author.username, message.author.avatarURL());
    message.channel.send(embed);
  },
});
