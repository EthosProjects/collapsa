const Discord = require("discord.js");
module.exports = {
  name: "pfp",
  category: "info",
  description: "show the avatar of a user",
  usage: "[<pfp @user]",
};
/**
 * @param {Discord.Message} message
 */
module.exports.run = async (bot, message, args) => {
  let msg = await message.channel.send("*Woof Woof*");
  let target = message.mentions.users.first() || message.author;
  await message.channel.send({
    files: [
      {
        attachment: target.displayAvatarURL,
        name: "ProfilePicture.png",
      },
    ],
  });
};
