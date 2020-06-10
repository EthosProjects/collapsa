const Discord = require("discord.js");
const bot = new Discord.Client();
const randomPuppy = require('random-puppy');

module.exports = {
    name: "meme",
    category: "fun",
    description: "Sends an epic meme",
    usage: "<meme",

    run: (client, message, args) => {
        let randomColor = "#000000".replace(/0/g,function(){return (~~(Math.random()*16)).toString(16);});
        randomPuppy('meme')
        .then(url => {
            const embed = new Discord.MessageEmbed()
            .setImage(url)
            .setColor(randomColor);
         return message.channel.send({ embed });
    })
    }};