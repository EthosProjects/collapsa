const { MessageEmbed, Message, GuildEmoji } = require('discord.js');
const Command = require('../../Command.js');
const Argument = require('../../Argument.js');
module.exports = new Command({
    name: 'bigemoji',
    arguments: [
        new Argument({
            _name: 'emoji',
            optional: false,
            nameStartsWithVowel: true,
            type: 'EmojiID',
            description: 'The emoji to enlarge',
        }),
    ],
    /**
     * @param {Message} message
     */
    execute: async (message, args = [], client, mLab, Invalid) => {
        let emoji = args[0]
        if(emoji instanceof Invalid) return message.reply('Invalid emoji specified')
        let url = `https://cdn.discordapp.com/emojis/${emoji}.png`
        let embed = new MessageEmbed()
            .setImage(url)
            .setAuthor('CollapsaBot', 'http://www.collapsa.io/client/img/favicon.png')
            .setTimestamp();
        await message.channel.send(embed);
    },
});
