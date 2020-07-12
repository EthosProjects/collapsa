const { MessageEmbed, Message, Collection } = require("discord.js");
const Command = require("../../Command.js");
const Argument = require("../../Argument.js");
module.exports = new Command({
  name: "configure",
  arguments: [
    new Argument({
      _name: "mutedRole|moderationChannel",
      optional: true,
      type: "Specification",
      description: `It's complicated`,
    }),
  ],
  description: "Configure the optional commands",
  permissions: ["ADMINISTRATOR"],
  /**
   * @param {Message} message
   * @param {Array.<string>} args
   */
  execute: async (message, args = [], client, mLab) => {
    let collapsa = mLab.databases.get("collapsa");
    let discordguildbase = collapsa.collections.get("discordguildbase");
    let guildbase = discordguildbase.documents.get(message.guild.id);
    if (!guildbase)
      return message.reply(
        "This guild is not in the database yet. Please wait"
      );
    let doc = Object.assign({}, guildbase.data);
    let validRoleFilter = (m) => {
      return (
        m.author.id == message.author.id &&
        ((m.mentions.roles.first() &&
          message.guild.roles.cache.has(m.mentions.roles.first().id)) ||
          message.guild.roles.cache.has(m.content) ||
          m.content == "no")
      );
    };
    let validChannelFilter = (m) => {
      return (
        m.author.id == message.author.id &&
        ((m.mentions.channels.first() &&
          message.guild.channels.cache.has(m.mentions.channels.first().id)) ||
          message.guild.channels.cache.has(m.content) ||
          m.content == "no")
      );
    };
    switch (args[0]) {
      case "mutedRole":
        await message.channel.send("Please set a muted role");
        message.channel
          .awaitMessages(validRoleFilter, { max: 1, time: 15000 })
          .then(async (mc) => {
            let m = mc.first();
            if (m.content == "no") {
              await message.channel.send(
                "No muted role: true\nConfiguration complete. Please wait"
              );
            } else {
              let role =
                message.guild.roles.cache.get(m.content) ||
                message.guild.roles.cache.get(m.mentions.roles.first().id);
              doc.mute.role = role.id;
              await message.channel.send(
                `Set muted role to ${role.name}\nConfiguration complete. Please wait`
              );
            }
          })
          .catch(async () => {
            await message.channel.send(
              "No muted role: true\nConfiguration complete. Please wait"
            );
          })
          .finally(async () => {
            await discordguildbase.updateDocument(doc);
            await message.channel.send(`You may now mute users`);
          });
        break;
      case "moderationChannel":
        await message.channel.send(
          "Please select a channel to send moderation logs"
        );
        message.channel
          .awaitMessages(validChannelFilter, { max: 1, time: 15000 })
          .then(async (mc) => {
            let m = mc.first();
            if (m.content == "no") {
              await message.channel.send(
                "No moderation channel selected\nConfiguration complete. Please wait"
              );
            } else {
              let channel =
                message.guild.channels.cache.get(m.content) ||
                message.guild.channels.cache.get(
                  m.mentions.channels.first().id
                );
              doc.moderation.channel = channel.id;
              await message.channel.send(
                `Set moderation channel to ${channel.name}\nConfiguration complete. Please wait`
              );
            }
          })
          .catch(async () => {
            await message.channel.send(
              "No moderation channel\nConfiguration complete. Please wait"
            );
          })
          .finally(async () => {
            await discordguildbase.updateDocument(doc);
            await message.channel.send(`You may now recieve modlogs`);
          });
        break;
      default:
        await message.channel.send("Please set a muted role");
        message.channel
          .awaitMessages(validRoleFilter, { max: 1, time: 15000 })
          .then(async (mc) => {
            let m = mc.first();
            if (m.content == "no") {
              await message.channel.send(
                "No muted role: true\nMoving to next item\nPlease select a channel to send moderation logs"
              );
            } else {
              let role =
                message.guild.roles.cache.get(m.content) ||
                message.guild.roles.cache.get(m.mentions.roles.first().id);
              doc.mute.role = role.id;
              await message.channel.send(
                `Set muted role to ${role.name}\nMoving to next item\nPlease select a channel to send moderation logs`
              );
            }
          })
          .catch(async () => {
            await message.channel.send(
              "No muted role: true\nMoving to next item\nPlease select a channel to send moderation logs"
            );
          })
          .finally(() => {
            message.channel
              .awaitMessages(validChannelFilter, { max: 1, time: 15000 })
              .then(async (mc) => {
                let m = mc.first();
                if (m.content == "no") {
                  await message.channel.send(
                    "No moderation channel selected\nMoving to next item\nPlease select a channel to send welcome messages"
                  );
                } else {
                  let channel =
                    message.guild.channels.cache.get(m.content) ||
                    message.guild.channels.cache.get(
                      m.mentions.channels.first().id
                    );
                  doc.moderation.channel = channel.id;
                  await message.channel.send(
                    `Set moderation channel to ${channel.name}\nMoving to next item\nPlease select a channel to send welcome messages`
                  );
                }
              })
              .catch(async () => {
                await message.channel.send(
                  "No moderation channel\nMoving to next item\nPlease select a channel to send welcome messages"
                );
              })
              .finally(() => {
                message.channel
                  .awaitMessages(validChannelFilter, { max: 1, time: 15000 })
                  .then(async (mc) => {
                    let m = mc.first();
                    if (m.content == "no") {
                      await message.channel.send(
                        "No welcome channel selected\nMoving to next item\nPlease select an autorole"
                      );
                    } else {
                      let channel =
                        message.guild.channels.cache.get(m.content) ||
                        message.guild.channels.cache.get(
                          m.mentions.channels.first().id
                        );
                      doc.welcome.channel = channel.id;
                      await message.channel.send(
                        `Set welcome channel to ${channel.name}\nMoving to next item\nPlease select an autorole`
                      );
                    }
                  })
                  .catch(async () => {
                    await message.channel.send(
                      "No welcome channel selected\nMoving to next item\nPlease select an autorole"
                    );
                  })
                  .finally(() => {
                    message.channel
                      .awaitMessages(validRoleFilter, { max: 1, time: 15000 })
                      .then(async (mc) => {
                        let m = mc.first();
                        if (m.content == "no") {
                          await message.channel.send(
                            "No autorole selected\nConfiguration complete. Please wait"
                          );
                        } else {
                          let role =
                            message.guild.roles.cache.get(m.content) ||
                            message.guild.roles.cache.get(
                              m.mentions.roles.first().id
                            );
                          doc.welcome.role = role.id;
                          await message.channel.send(
                            `Set autorole to ${role.name}\nConfiguration complete. Please wait`
                          );
                        }
                      })
                      .catch(async () => {
                        await message.channel.send(
                          "No autorole selected\nConfiguration complete. Please wait"
                        );
                      })
                      .finally(async () => {
                        await discordguildbase.updateDocument(doc);
                        await message.channel.send(
                          `You may now use your commands of choice`
                        );
                      });
                  });
              });
          });
        break;
    }
  },
});
