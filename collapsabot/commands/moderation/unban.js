const { MessageEmbed, Message } = require('discord.js');
const Command = require('../../Command.js');
const CollapsaBot = require('../../CollapsaBot');
const Argument = require('../../Argument.js');
module.exports = new Command({
    name: 'unban',
    arguments: [
        new Argument({
            _name: 'user',
            nameStartsWithVowel: false,
            optional: false,
            type: 'UserID',
            description: 'User ID, mention, or username of the user whom you want unban',
        }),
        new Argument({
            _name: 'reason',
            nameStartsWithVowel: false,
            optional: true,
            type: 'Reason',
            description: 'Reason for unbanning this user',
        }),
    ],
    description: 'Unbans a user',
    permissions: ['BAN_MEMBERS'],
    /**
     * @param {Message} message
     * @param {Array.<string>} args
     * @param {CollapsaBot} client
     * @param {mlabInteractor} mLab
     */
    execute: async (message, args = [], client, mLab) => {
        let guild = message.guild;
        let author = guild.members.cache.get(message.author.id);
        if (guild.members.cache.has(args[0])) {
            return message.reply('This user is not banned');
        }
        let user = args[0];
        if (user === message.author.id) return message.channel.send("You aren't banned");
        let reason = args[1];
        if (guild.owner.id == author.id || author.id == client.owner) {
            guild.members.unban(user).then(
                (res) => {
                    let embed = new MessageEmbed()
                        .setColor('#ff0000')
                        .setTitle(`Unbanned ${res.username}`)
                        .addField('Reason', reason ? reason : 'No reason specified')
                        .setThumbnail('http://www.collapsa.io/client/img/amethysthammer.png')
                        .setAuthor('CollapsaBot', 'http://www.collapsa.io/client/img/favicon.png')
                        .setTimestamp();
                    message.channel.send(embed);
                },
                (err) => {
                    let embed = new MessageEmbed()
                        .setColor('#ff0000')
                        .setTitle(`Failed to unban ${user}`)
                        .addField('Reason', err.message)
                        .setThumbnail('http://www.collapsa.io/client/img/amethysthammer.png')
                        .setAuthor('CollapsaBot', 'http://www.collapsa.io/client/img/favicon.png')
                        .setTimestamp();
                    message.channel.send(embed);
                },
            );
            return;
        }
        if (!guild.owner.id == user) return message.reply("You can't ban this user because they own the server");
        guild.members.unban(user).then(
            (res) => {
                let embed = new MessageEmbed()
                    .setColor('#ff0000')
                    .setTitle(`Unbanned ${res.username}`)
                    .addField('Reason', reason ? reason : 'No reason specified')
                    .setThumbnail('http://www.collapsa.io/client/img/amethysthammer.png')
                    .setAuthor('CollapsaBot', 'http://www.collapsa.io/client/img/favicon.png')
                    .setTimestamp();
                message.channel.send(embed);
            },
            (err) => {
                let embed = new MessageEmbed()
                    .setColor('#ff0000')
                    .setTitle(`Failed to unban ${user}`)
                    .addField('Reason', err.message)
                    .setThumbnail('http://www.collapsa.io/client/img/amethysthammer.png')
                    .setAuthor('CollapsaBot', 'http://www.collapsa.io/client/img/favicon.png')
                    .setTimestamp();
                message.channel.send(embed);
            },
        );
    },
});
