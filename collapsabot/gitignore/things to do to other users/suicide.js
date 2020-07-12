const Discord = require("discord.js");

module.exports = {
  name: "kill",
  aliases: ["kms", "suicide"],
  category: "things to do to other users",
  description: "kys?",
  usage: "<kms",

  run: async (client, message, args) => {
    kgif = [
      "https://media.giphy.com/media/ehmZM6huZkqznX9NLE/giphy.gif",
      "https://38.media.tumblr.com/37d04e8353180946970bdf6f4b221be2/tumblr_n60hcwcxZ51sqoko9o1_400.gif",
      "https://i.makeagif.com/media/7-07-2015/qG76qo.gif",
      "https://media.giphy.com/media/yNFjQR6zKOGmk/giphy.gif",
      "https://media.giphy.com/media/krlI3HIux5pJe/giphy.gif",
      "https://media.giphy.com/media/iA6uDPHzvUVNK/giphy.gif",
      "https://media.giphy.com/media/xd3IcZqZRpyve/giphy.gif",
    ];
    let kresult = Math.floor(Math.random() * kgif.length);

    const killed =
      message.mentions.members.first() || message.guild.members.get(args[0]);
    if (!killed) {
      sgif = [
        "https://media.giphy.com/media/j6ZlX8ghxNFRknObVk/giphy.gif",
        "https://media.giphy.com/media/zqdbOacOP9Djy/giphy.gif",
        "https://media.giphy.com/media/jSxK33dwEMbkY/giphy.gif",
        "https://media.giphy.com/media/VkJ7okLnPBTy0/giphy.gif",
      ];
      let sresult = Math.floor(Math.random() * sgif.length);
      let emb = new Discord.MessageEmbed()
        .setColor("#00f00")
        .setDescription(
          `${message.author} decided to kill themself ?? REST IN PEACE`
        )
        .setImage(sgif[sresult]);

      message.channel.send(emb);
    } else {
      let emb = new Discord.MessageEmbed()
        .setColor("#00f00")
        .setDescription(
          `${killed} was killed by ${message.author} ?? REST IN PEACE`
        )
        .setImage(kgif[kresult]);

      message.channel.send(emb);
    }
  },
};
