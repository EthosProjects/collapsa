const Discord = require('discord.js');
const superagent = require('superagent');

module.exports = {
    name: "welcome",
    aliases: ["wave"],
    category: "things to do to other users",
    description: "wave and welcome the mentioned user",
    usage: "<wave (user)",

run: async (client, message, args, tools) => {
    if (!message.mentions.users.first()) return message.reply("You must mention someone to wave and welcome them");
    if(message.mentions.users.first().id === "678124077654867978") return message.reply('You can\'t welcome him you pleblord.:facepalm:');
    let user = message.author.username;
    const embed = new Discord.MessageEmbed()
    .setColor("#0x00FF17")
    .setTitle(`${message.mentions.users.first().username} You have been welcomed to ${message.guild.name} by ${user}`)
    .setImage("https://media.giphy.com/media/yoJC2A59OCZHs1LXvW/giphy.gif");
    message.channel.send({embed})
}};