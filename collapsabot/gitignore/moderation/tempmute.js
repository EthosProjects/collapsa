const ms = require("ms");
const { stripIndents } = require("common-tags");
const { MessageEmbed } = require("discord.js");
module.exports = {
  name: "tempmute",
  category: "moderation",
  description: "Temporarily Mute a person",
  usage: "<tempmute (user) (1s/h/d/m)",
  run: async (bot, message, args) => {
    //!tempmute @user 1s/m/h/d

    // No author permissions

    let toMute = message.guild.member(
      message.mentions.users.first() || message.guild.members.get(args[0])
    );
    if (!toMute) return message.reply("Couldn't find user.");
    if (toMute.hasPermission("MANAGE_MESSAGES"))
      return message.reply(
        "I can't mute that person due to role hierarchy, I suppose. Ask a staff member to move my role above the role you are trying to mute"
      );
    let muterole = message.guild.roles.find(`name`, "muted");
    if (!message.member.hasPermission("MANAGE_MESSAGES"))
      return message.reply(
        "You Do not have permission to mute. Please contact a staff member"
      );
    const logChannel =
      message.guild.channels.find((c) => c.name === "duke-logs") ||
      message.channel;
    //start of create role
    if (!muterole) {
      try {
        muterole = await message.guild.createRole({
          name: "muted",
          color: "#000000",
          permissions: [],
        });
        message.guild.channels.forEach(async (channel, id) => {
          await channel.overwritePermissions(muterole, {
            SEND_MESSAGES: false,
            ADD_REACTIONS: false,
          });
        });
      } catch (e) {
        console.log(e.stack);
      }
    }
    //end of create role
    let mutetime = args[1];
    if (!mutetime) return message.reply("You didn't specify a time!");

    await toMute.addRole(muterole.id);
    message.reply(`<@${toMute.id}> has been muted for ${ms(ms(mutetime))}`);

    const embed = new MessageEmbed()
      .setColor("#0x00FF17")
      .setThumbnail(toMute.user.displayAvatarURL)
      .setFooter(message.member.displayName, message.author.displayAvatarURL)
      .setTimestamp()
      .setDescription(stripIndents`**- Muted member:** ${toMute} (${toMute.id})
  **- Muted by:** ${message.member} (${message.member.id})
  **- Time:** ${args.slice(1).join(" ")}`);

    logChannel.send(embed);

    setTimeout(function () {
      toMute.removeRole(muterole.id);
      message.channel.send(`<@${toMute.id}> has been unmuted!`);
      const unmuteembed = new MessageEmbed()
        .setColor("#0x00FF17")
        .setThumbnail(toMute.user.displayAvatarURL)
        .setFooter(message.member.displayName, message.author.displayAvatarURL)
        .setTimestamp()
        .setDescription(stripIndents`**- Unmuted member:** ${toMute} (${
        toMute.id
      })
    **- Unmute Reason:** Automatic
    **- Time:** ${args.slice(1).join(" ")}`);
      logChannel.send(unmuteembed);
    }, ms(mutetime));
  },
};
