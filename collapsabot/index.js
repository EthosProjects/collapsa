const fs = require("fs");
const {
  MessageEmbed,
  Webhook,
  WebhookClient,
  TextChannel,
  Collection,
} = require("discord.js");
//
if (process.env.NODE_ENV == "development") {
  const { Client } = require("discord-rpc");
  const DiscordRPC = require("discord-rpc");
  DiscordRPC.register("717959362131263609");
  const rpcClient = new Client({ transport: "ipc" });
  rpcClient.on("ready", () => {
    const startTimestamp = new Date();
    rpcClient.setActivity({
      state: "Working on Collapsa.io",
      startTimestamp,
      largeImageKey: "favicon",
      largeImageText: "Awesome Developer",
      smallImageKey: "devshovel",
      smallImageText: "Shoveling away errors",
      instance: false,
    });
  });
  rpcClient.login({ clientId: "717959362131263609" });
}
let toLiteral = (obj) => JSON.parse(JSON.stringify(obj));
//
let { token, prefix } = require("./config.json");
prefix = process.env.NODE_ENV == "production" ? "!" : "?";
let { mlabInteractor } = require("mlab-promise");
let youtubeInteractor = require("./youtube.js/Youtube");
const { discorduserbaseUser, discordguildbaseGuild } = require("../api/models");
//let yotube = new youtubeInteractor('AIzaSyCeld1vKBcUuZESB7qz_gIJxrTJl5w5e_Y')
module.exports = (mLab) => {
  const ytdl = require("ytdl-core-discord");
  const CollapsaBot = require("./CollapsaBot");
  const client = new CollapsaBot(mLab);
  mLab.once("ready", () => {
    let discorduserbase = mLab.databases
      .get("collapsa")
      .collections.get("discorduserbase");
    client.databaseLoaded = true;
  });
  let antiSpam = new Collection();
  let expRate = new Collection();
  client.on("message", async (message) => {
    let channel = message.channel;
    let content = message.content;
    let author = message.author;
    let member = message.member;
    let guild = message.guild;
    let collapsa = mLab.databases.get("collapsa");
    if (!message.guild) return;
    if (
      message.guild.id == "264445053596991498" &&
      message.author.id != client.owner
    )
      return;
    if (
      message.content.startsWith("!joinGuild") &&
      message.author.id == client.owner
    ) {
      client.emit("guildCreate", message.guild);
      return;
    }
    if (message.content == "join me collapsabot") {
      if (message.member.voice.channel) {
        const connection = await message.member.voice.channel.join();
        //connection.play(await ytdl('https://www.youtube.com/watch?v=kJQP7kiw5Fk'), { type: 'opus' });
      }
    }
    if (author.bot || message.webhookID) return;
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
    if (expRate.has(author.id + message.guild.id)) {
      let expRated = expRate.get(author.id + message.guild.id);
      expRate.set(author.id + message.guild.id, {
        author: author.id,
        count: Date.now(),
      });
      if (Date.now() - expRated.count > 60000) {
        let user = new discorduserbaseUser(
          discorduserbase.documents.get(member.id).data
        );
        user.guilds[guild.id].exp.amount += Math.floor(Math.random() * 20 + 20);
        user = new discorduserbaseUser(user);
        discorduserbase.updateDocument(toLiteral(user));
      }
    } else {
      expRate.set(author.id + message.guild.id, {
        author: author.id,
        count: Date.now(),
      });
      let user = new discorduserbaseUser(
        discorduserbase.documents.get(member.id).data
      );
      user.guilds[guild.id].exp.amount += Math.floor(Math.random() * 20 + 20);
      user = new discorduserbaseUser(user);
      discorduserbase.updateDocument(toLiteral(user));
    }
    if (antiSpam.has(author.id + message.guild.id)) {
      let usr = antiSpam.get(author.id + message.guild.id);
      if (usr.count >= 5) {
        if (channel.permissionsFor(message.guild.me).has("DELETE_MESSAGES"))
          message.delete();
        message.channel.send("You're sending messages too fast!");
      }
      usr.count++;
      setTimeout(() => {
        antiSpam.get(author.id + message.guild.id).count--;
        if (!antiSpam.get(author.id + message.guild.id).count)
          antiSpam.delete(author.id + message.guild.id);
      }, 2000);
    } else {
      antiSpam.set(author.id + message.guild.id, {
        author: author.id,
        count: 1,
      });
      setTimeout(() => {
        antiSpam.get(author.id + message.guild.id).count--;
        if (!antiSpam.get(author.id + message.guild.id).count)
          antiSpam.delete(author.id + message.guild.id);
      }, 2000);
    }

    let prefixRegex = new RegExp(
      `^(<@!{0,1}\\d+> |${prefix == "!" ? "!" : "\\" + prefix})`
    );
    if (!content.match(prefixRegex)) return;
    if (
      content.match(/^d+/) &&
      message.mentions.members.first().id != client.user.id
    )
      return;
    if (
      message.content.match(`\\${prefix}eval`) &&
      message.author.id == client.owner
    ) {
      let args = content
        .replace(prefixRegex, "")
        .replace(/^eval +/, "")
        .split(/ +/);
      client.commands.get("eval").execute(message, args, client, mLab);
      return;
    }
    let args;
    args = content.replace(prefixRegex, "").split(/ +/);
    const commandName = args.shift().toLowerCase();

    if (client.commands.has(commandName)) {
      let command = client.commands.get(commandName);
      class Invalid {
        constructor() {}
      }
      let fluidCommands = ["nhentai", "eval"];
      if (!fluidCommands.find((c) => c == commandName))
        args = command.resolveArguments(message, args, client, mLab, Invalid);
      if (
        !member.hasPermission(command.permissions) &&
        member.id != client.owner
      )
        return message.reply(`You don't have permission to use this command`);
      if (
        !guild.me.hasPermission(
          [...command.permissions].splice(
            command.permissions.findIndex((e) => e == "ADMINISTRATOR"),
            1
          )
        )
      )
        return message.reply(`I don't have permission to use this command`);
      command.execute(message, args, client, mLab, Invalid);
    }
  });
  client.on("guildMemberAdd", async (member) => {});
  client.on("guildCreate", async (guild) => {
    let guildBase = new discordguildbaseGuild({
      id: guild.id,
      _id: guild.id,
    });
    await mLab.databases
      .get("collapsa")
      .collections.get("discordguildbase")
      .addDocument(toLiteral(guildBase));
    let defaultChannel = "";
    guild.channels.cache.forEach((channel) => {
      if (
        channel.name.includes("general") ||
        channel.name.includes("lounge") ||
        channel.name.includes("chat")
      ) {
        if (channel.permissionsFor(guild.me).has("SEND_MESSAGES")) {
          defaultChannel = channel;
        }
      }
    });
    guild.channels.cache.forEach((channel) => {
      if (channel.type == "text" && defaultChannel == "") {
        if (channel.permissionsFor(guild.me).has("SEND_MESSAGES")) {
          defaultChannel = channel;
        }
      }
    });
    defaultChannel.send(
      "Hello! It's CollapsaBot. Use !configure to begin configuration"
    );
  });
  client.login(
    process.env.NODE_ENV == "production"
      ? token
      : "NzE3OTU5MzYyMTMxMjYzNjA5.Xty2Pg.exCv_gp7VQbgPWK11TtTBGereJ8"
  );
  process.on("uncaughtException", (error) => {
    console.error(error);
  });
  return client;
};
//let mLab = new mlabInteractor('4unBPu8hpfod29vxgQI57c0NMUqMObzP', ['lexybase', 'chatbase'])
