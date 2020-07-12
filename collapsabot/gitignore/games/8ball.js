const Discord = require("discord.js");
module.exports = {
  name: "8ball",
  aliases: ["8b"],
  category: "games",
  description: "Random 8Ball",
  usage: "[command | alias]",

  run: async (bot, message, args) => {
    //!8ball question
    if (!args[1])
      return message.reply(
        "Please enter a full question with 2 or more words!"
      );
    let replies = [
      "Yes",
      "No",
      "I don't know",
      "Ask again later!",
      "Cyka",
      "I am not sure!",
      "Pls No",
      "You tell me",
      "Without a doubt",
      "Cannot predict now",
      "Without a doubt",
    ];

    let result = Math.floor(Math.random() * replies.length);
    let question = args.join(" ");

    let ballembed = new Discord.RichEmbed()

      .setAuthor(message.author.username)
      .setColor("#00ff00")
      .addField("Question", question)
      .addField("Answer", replies[result]);

    message.channel.send(ballembed);

    message.delete();
  },
};
