const Discord = require('discord.js');
const superagent = require('superagent');

module.exports = {
    name: "poke",
    category: "things to do to other users",
    description: "poke the mentioned user",
    usage: "<poke (user)",

run: async (client, message, args, tools) => {
    if (!message.mentions.users.first()) return message.reply("You need to mention someone to poke them");
    if (message.mentions.users.first().id === "482128001828651008") return message.channel.send('<a:yayyy:497742636439044096>');
    const { body } = await superagent
    .get("https://nekos.life/api/v2/img/poke");
    
    const embed = new Discord.MessageEmbed()
    .setColor("#0x00FF17")
    .setTitle(`${message.author.username} poked ${message.mentions.users.first().username}`)
    .setImage(body.url);
    message.channel.send({embed})
    
}};