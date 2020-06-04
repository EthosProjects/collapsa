const {MessageEmbed} = require('discord.js')
module.exports = {
    name:'purge',
    execute: async (message, args) => {
        args = args.length ? args : ['10']
        let limit = parseFloat(args[0]) || 10
        let messages = await message.channel.messages.fetch({ limit })
        await message.channel.bulkDelete(messages)
        let embed = new MessageEmbed()
            .setColor('#9f00ad')
            .setTitle(`Purged ${limit} messages`)
            .setAuthor(message.author.username, message.author.avatarURL())
        message.channel.send(embed)
    }
}