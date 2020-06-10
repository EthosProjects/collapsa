const Discord = require('discord.js');
const randomPuppy = require('random-puppy');

module.exports = {
    name: "animememe",
    aliases: ["animeme"],
    category: "fun",
    description: "Sends an epic anime meme",
    usage: "<animeme",

run: (client, message, args) => {
    let randomColor = "#000000".replace(/0/g,function(){return (~~(Math.random()*16)).toString(16);});
    randomPuppy('animemes')
    .then(url => {
        const embed = new Discord.MessageEmbed()
        .setImage(url)
        .setColor(randomColor);
     return message.channel.send({ embed });
})
}};