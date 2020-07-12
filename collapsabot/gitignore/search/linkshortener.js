const shorten = require("isgd");

module.exports = {
  name: "linkshortener",
  aliases: ["ls", "link", "shorten"],
  category: "search",
  description: "Shortens a link for you",
  usage: "<link (Link) (Name)",

  run: (client, message, args, tools) => {
    try {
      if (!args[0])
        return message.channel.send(
          "invalid usage! use <shorten (url) [title]"
        );

      if (!args[1]) {
        shorten.shorten(args[0], function (res) {
          if (res.startsWith("Error:"))
            return message.channel.send("**Please enter a valid URL**");

          message.channel.send(`**<${res}>**`);
        });
      } else {
        shorten.custom(args[0], args[1], function (res) {
          if (res.startsWith("Error:"))
            return message.channel.send(`**${res}**`);

          message.channel.send(`**<${res}>**`);
        });
      }
    } catch (err) {
      const errorlogs = client.channels.get("464424869497536512");
      message.channel.send(
        `Whoops, We got a error right now! This error has been reported to Support center!`
      );
      errorlogs.send(`Error on linkshortener commands!\n\nError:\n\n ${err}`);
    }
  },
};
