const Discord = require("discord.js");
const bot = new Discord.Client();
const math = require("mathjs");

module.exports = {
  name: "calculator",
  aliases: ["math"],
  category: "search",
  description: "Does Math for you",
  usage: "<math (Equation)",

  run: async (client, message, args) => {
    const expression = args.join(" ");
    try {
      const solved = math.eval(expression).toString();
      return message.channel.send("The answer is: " + solved);
    } catch (err) {
      return message.channel.send(
        'Please enter a valid equation! : "<math 1+1"'
      );
    }
  },
};
