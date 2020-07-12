const { MessageEmbed, Message } = require('discord.js');
const Command = require('../../Command.js');
const Argument = require('../../Argument.js');
module.exports = new Command({
    name: 'purge',
    arguments: [
        new Argument({
            _name: 'limit',
            optional: false,
            type: 'Amount',
            description: 'Amount of messages you want to delete',
        }),
    ],
    description: 'Delete up to 100 messages at once',
    permissions: ['MANAGE_MESSAGES'],
    /**
     * @param {Message} message
     * @param {Array.<string>} args
     * @param {CollapsaBot} client
     * @param {mlabInteractor} mLab
     */
    execute: async (message, args = [], client, mLab) => {
        console.log('aaaa');
        args = args.length ? args : ['10'];
        if (!message.guild.me.hasPermission(['MANAGE_MESSAGES']))
            return message.reply("I don't have permission to do that");
        let limit = parseFloat(args[0]) || 10;
        limit = limit < 101 ? limit : 100;
        let messages = await message.channel.messages.fetch({ limit });
        await message.channel.bulkDelete(messages);
        let embed = new MessageEmbed()
            .setColor('#9f00ad')
            .setTitle(`Purged ${limit} messages`)
            .setAuthor(message.author.username, message.author.avatarURL());
        message.channel.send(embed);
    },
});
