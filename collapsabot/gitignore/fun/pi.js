const Discord = require("discord.js");

module.exports = {
  name: "pi",
  category: "fun",
  description: "Displays 100 digits of PI!!",
  usage: "<pi",

  run: async (bot, message, args) => {
    const member =
      message.mentions.members.first() ||
      message.guild.members.get(args[0]) ||
      message.member;
    const pibed = new Discord.MessageEmbed()
      .setThumbnail(
        "https://cms.qz.com/wp-content/uploads/2018/03/pi-symbol.png?w=1400&strip=all&quality=75"
      )
      .setColor(
        member.displayHexColor === "#000000"
          ? "#ffffff"
          : member.displayHexColor
      )
      .setTitle("100 Digits of π!!")
      .addField("~~~~~~~~~~~~~~~~~~~~~~~~", "3.14159, this is π ")
      .addField("~~~~~~~~~~~~~~~~~~~~~~~~", "Followed by 2-6-5-3-5-8-9")
      .addField("~~~~~~~~~~~~~~~~~~~~~~~~", "Circumference over diameter")
      .addField(
        "~~~~~~~~~~~~~~~~~~~~~~~~",
        "7-9, then 3-2-3 OMG! Can't you see?"
      )
      .addField(
        "~~~~~~~~~~~~~~~~~~~~~~~~",
        "8-4-6-2-6-4-3 And now we're on a spree"
      )
      .addField(
        "~~~~~~~~~~~~~~~~~~~~~~~~",
        "38 and 32, now we're blue Oh, who knew?"
      )
      .addField("~~~~~~~~~~~~~~~~~~~~~~~~", "7, 950 and then a two")
      .addField("~~~~~~~~~~~~~~~~~~~~~~~~", "88 and 41, so much fun Now a run")
      .addField("~~~~~~~~~~~~~~~~~~~~~~~~", "9-7-1-6-9-3-9-9")
      .addField("~~~~~~~~~~~~~~~~~~~~~~~~", "Then 3-7, 51 Half way done!")
      .addField("~~~~~~~~~~~~~~~~~~~~~~~~", "0-5-8, now don't be late")
      .addField("~~~~~~~~~~~~~~~~~~~~~~~~", "2-0-9, where's the wine?")
      .addField("~~~~~~~~~~~~~~~~~~~~~~~~", "7-4, it's on the floor")
      .addField("~~~~~~~~~~~~~~~~~~~~~~~~", "Then 9-4-4-5-9")
      .addField("~~~~~~~~~~~~~~~~~~~~~~~~", "2-3-0, we gotta go")
      .addField("~~~~~~~~~~~~~~~~~~~~~~~~", "7-8, we can't wait")
      .addField("~~~~~~~~~~~~~~~~~~~~~~~~", "1-6-4-0-6-2-8")
      .addField(
        "~~~~~~~~~~~~~~~~~~~~~~~~",
        "We're almost near the end, keep going"
      )
      .addField("~~~~~~~~~~~~~~~~~~~~~~~~", "62, we're getting through")
      .addField("~~~~~~~~~~~~~~~~~~~~~~~~", "0-8-9-9, on time")
      .addField(
        "~~~~~~~~~~~~~~~~~~~~~~~~",
        "8-6-2-8-0-3-4 There's only a few more!"
      )
      .addField("~~~~~~~~~~~~~~~~~~~~~~~~", "8-2, then 5-3")
      .addField("~~~~~~~~~~~~~~~~~~~~~~~~", "42, 11, 7-0 and 67")
      .setFooter("Source: Musixmatch");

    message.channel.send(pibed);
  },
};
