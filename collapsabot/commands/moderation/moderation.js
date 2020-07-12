const { MessageEmbed, Message, Collection, GuildMember } = require('discord.js');
const Command = require('../../Command.js');
const Argument = require('../../Argument.js');
const { discorduserbaseUser, discordguildbaseGuild } = require('../../../api/models');
let toLiteral = (obj) => JSON.parse(JSON.stringify(obj));
module.exports = new Command({
    name: 'moderation',
    arguments: [
        new Argument({
            _name: 'member',
            nameStartsWithVowel: false,
            optional: false,
            type: 'Member',
            description: 'User ID, mention, or username of the Member whom you want the moderation of',
        }),
        new Argument({
            _name: 'moderationID',
            nameStartsWithVowel: false,
            optional: true,
            type: 'ModerationID',
            description: 'Moderation ID',
        }),
        new Argument({
            _name: 'moderationCommand',
            nameStartsWithVowel: false,
            optional: true,
            type: 'ModerationCommand',
            description: 'command to run',
        }),
        new Argument({
            _name: 'moderationValue',
            nameStartsWithVowel: false,
            optional: true,
            type: 'Reason',
            description: 'replacement value for reason',
        }),
    ],
    description: 'Gets moderation data on a user',
    permissions: ['MANAGE_MESSAGES'],
    /**
     * @param {Message} message
     * @param {Array.<string>} args
     * @param {CollapsaBot} client
     * @param {mlabInteractor} mLab
     */
    execute: async (message, args = [], client, mLab) => {
        let guild = message.guild;
        let member = args[0];
        if (!(member instanceof GuildMember)) return;
        let collapsa = mLab.databases.get('collapsa');
        let discorduserbase = collapsa.collections.get('discorduserbase');
        if (!discorduserbase.documents.has(member.id)) {
            let doc = {
                id: member.id,
                guilds: {},
            };
            doc.guilds[guild.id] = {};
            let user = new discorduserbaseUser(doc);
            await discorduserbase.addDocument(toLiteral(user));
        } else if (!discorduserbase.documents.get(member.id).data.guilds[guild.id]) {
            let user = new discorduserbaseUser(discorduserbase.documents.get(member.id).data);
            user.guilds[guild.id] = {};
            user = new discorduserbaseUser(user);
            await discorduserbase.updateDocument(toLiteral(user));
        }
        let user = new discorduserbaseUser(discorduserbase.documents.get(member.id).data);
        let moderation = user.guilds[guild.id].moderation.find((m) => m.id == args[1]);
        if (!moderation) {
            let embed = new MessageEmbed()
                .setColor('#000001')
                .setTitle(
                    `Moderation ${member.user.username} has currently been moderated ${
                        user.guilds[guild.id].moderation.filter((m) => !m.removed).length
                    } time${user.guilds[guild.id].moderation.filter((m) => !m.removed).length == 1 ? '' : 's'}`,
                )
                .setAuthor(message.author.username, message.author.avatarURL());
            user.guilds[guild.id].moderation
                .filter((m) => !m.removed)
                .forEach((moderation) => {
                    embed.addFields([
                        { name: 'Type', value: moderation.type, inline: true },
                        { name: 'Reason', value: moderation.reason || 'None Given', inline: true },
                        { name: 'ID', value: moderation.id, inline: true },
                    ]);
                });
            message.channel.send(embed);
        } else {
            let moderationCommands = ['remove', 'reason'];
            if (moderationCommands.find((c) => c == args[2])) {
                if (args[2] == 'remove') {
                    console.log(user.guilds[guild.id].moderation);
                    moderation.removed = true;
                    console.log(user.guilds[guild.id].moderation);
                    user = new discorduserbaseUser(user);
                    await discorduserbase.updateDocument(toLiteral(user));
                    let embed = new MessageEmbed().setColor('#000001').setTitle(`Removed moderation ${moderation.id}`);
                    message.channel.send(embed);
                } else if (args[3]) {
                    moderation.reason = args[3];
                    user = new discorduserbaseUser(user);
                    await discorduserbase.updateDocument(toLiteral(user));
                    let embed = new MessageEmbed()
                        .setColor('#000001')
                        .setTitle(`Changed reason for ${moderation.id} to ${args[3]}`);
                    message.channel.send(embed);
                }
                return;
            }
            let embed = new MessageEmbed()
                .setColor('#000001')
                .setTitle(`Detailed moderation on ${args[1]}`)
                .addFields([
                    { name: 'Type', value: moderation.type },
                    { name: 'Reason', value: moderation.reason || 'None Given' },
                    { name: 'ID', value: moderation.id },
                    { name: 'By', value: moderation.by },
                    { name: `Moderated at`, value: moderation.time },
                ]);
            message.channel.send(embed);
        }
    },
});
