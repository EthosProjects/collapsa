const Discord = require("discord.js");
const bot = new Discord.Client();

module.exports = {
    name: "minecraft",
    aliases: ["achievement"],
    category: "fun",
    description: "Custom Achievements!",
    usage: "<minecraft (Text you want to achieve)",
run: async (client, message, args) => {
    try {
       const text = args.join(" ");
       if(!args[0]) return message.channel.send("You need to provide text for the achievement");
            if (text.length > 25) return message.reply('text must be under 25 characters.');

        const superagent = require('superagent')
        const { body } = await superagent

            .get('https://www.minecraftskinstealer.com/achievement/a.php')
            .query({
                i: Math.floor(Math.random() * 39),
                h: 'Achievement Get!',
                t: text
            });
        message.channel.send({ files: [{ attachment: body, name: 'achievement.png' }] 
      });
    } catch (err) {
            console.log(err)
    }
}}