const Discord = require('discord.js');
const superagent = require('superagent');

module.exports = {
    name: "boop",
    category: "things to do to other users",
    description: "boop the mentioned user",
    usage: "<boop (user)",

run: async (client, message, args, tools) => {
    boop = ["https://media.giphy.com/media/DSzhk81pkwTrW/giphy.gif", "https://media.giphy.com/media/lcvjDNIJ8CS88/giphy.gif", "https://media.giphy.com/media/10MSCF1viNV7zy/giphy.gif", "https://media.giphy.com/media/aCqb9YW7QclN3rtto5/giphy.gif", "https://media.giphy.com/media/13eFBWrZEnJTGM/giphy.gif", "https://media.giphy.com/media/1qgIPm9bmOhRjANGGF/giphy.gif", "https://media.giphy.com/media/1qgIPm9bmOhRjANGGF/giphy.gif", ""];
    let boopresult = Math.floor((Math.random() * boop.length));

    if (!message.mentions.users.first()) return message.reply("You need to mention someone to boop them");
    
    const embed = new Discord.MessageEmbed()
    .setColor("#0x00FF17")
    .setTitle(`${message.author.username} booped ${message.mentions.users.first().username}`)
    .setImage(boop[boopresult]);
    message.channel.send({embed})
    
}};