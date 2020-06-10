const {MessageEmbed, Message} = require('discord.js')
module.exports = {
    name:'bigemoji',
    /**
     * @param {Message} message
     */
    execute: async (message, args = [], client, mLab) => {
        let emojiRegex = /^<:[a-zA-Z0-9_]{2,32}:\d{16,18}>$/
        if(!args[0].match(emojiRegex)) return message.reply('No emoji specified?')
        let id = args[0].replace(/<:[a-zA-Z0-9_]{2,32}:/, '').replace(/>/, '')
        let emoji = client.emojis.cache.get(id)
        if(!emoji) return message.reply('Why the fake emoji?')
        let embed = new MessageEmbed()
            .setImage(emoji.url)
        await message.channel.send(embed);
    }
}