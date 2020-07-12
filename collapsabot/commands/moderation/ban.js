const { MessageEmbed, Message, GuildMember } = require('discord.js');
const Command = require('../../Command.js');
const Argument = require('../../Argument.js');
const { discorduserbaseUser, discordguildbaseGuild } = require('../../../api/models');
let toLiteral = (obj) => JSON.parse(JSON.stringify(obj));
module.exports = new Command({
    name: 'ban',
    arguments: [
        new Argument({
            _name: 'member',
            optional: false,
            type: 'Member',
            description: 'User ID, mention, or username of the member whom you want to ban',
        }),
        new Argument({
            _name: 'reason',
            optional: true,
            type: 'Reason',
            description: 'Reason for the ban',
        }),
    ],
    description: 'Bans a user',
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
        let member = args[0];
        let reason = args[1];
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
        if (member.id === message.author.id) return message.channel.send("You can't ban yourself");
        let authorRolesArr = [...author.roles.cache.values()].map((role) => role.rawPosition).sort((a, b) => b - a);
        let memberRolesArr = [...member.roles.cache.values()].map((role) => role.rawPosition).sort((a, b) => b - a);
        //if (!guild.member(user).bannable) return message.reply('You can\'t ban this user because the bot does not have sufficient permissions!');
        if (!member.bannable)
            return message.reply("You can't ban this user because the bot doesn't have sufficient pemissions");
        if (guild.owner.id == author.id || author.id == client.owner) {
            await member.ban();
            let user = new discorduserbaseUser(discorduserbase.documents.get(member.id).data);
            user.guilds[guild.id].moderation.push({
                type: 'Ban',
                by: message.author.username,
                reason,
                time: new Date().getTime(),
            });
            user = new discorduserbaseUser(user);
            await discorduserbase.updateDocument(toLiteral(user));
            let embed = new MessageEmbed()
                .setColor('#ff0000')
                .setTitle(`Banned ${member.displayName}`)
                .addField('Reason', reason ? reason : 'No reason specified')
                .setThumbnail('http://www.collapsa.io/client/img/amethysthammer.png')
                .setAuthor('CollapsaBot', 'http://www.collapsa.io/client/img/favicon.png')
                .setTimestamp();
            message.channel.send(embed);
            return;
        }
        if (authorRolesArr[0] <= memberRolesArr[0])
            return message.reply("You can't ban this user your role is not high enough");
        if (!guild.owner.id == user.id) return message.reply("You can't ban this user because they own the server");
        await member.ban();
        let user = new discorduserbaseUser(discorduserbase.documents.get(member.id).data);
        user.guilds[guild.id].moderation.push({
            type: 'Ban',
            by: message.author.username,
            reason,
            time: new Date().getTime(),
        });
        user = new discorduserbaseUser(user);
        await discorduserbase.updateDocument(toLiteral(user));
        let embed = new MessageEmbed();
        setColor('#ff0000')
            .setTitle(`Banned ${member.displayName}`)
            .addField('Reason', reason ? reason : 'No reason specified')
            .setThumbnail('http://www.collapsa.io/client/img/amethysthammer.png')
            .setAuthor('CollapsaBot', 'http://www.collapsa.io/client/img/favicon.png')
            .setTimestamp();
        message.channel.send(embed);
    },
});
