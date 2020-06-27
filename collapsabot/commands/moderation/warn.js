const {MessageEmbed, Message, Collection, GuildMember} = require('discord.js')
const Command = require('../../Command.js')
const Argument = require('../../Argument.js')
const { discorduserbaseUser, discordguildbaseGuild } = require('../../../api/models');
let toLiteral = obj => JSON.parse(JSON.stringify(obj))
module.exports = new Command({
    name:'warn',
    arguments:[
        new Argument({
            _name:'member',
            nameStartsWithVowel:false,
            optional:false,
            type:'Member',
            description:'User ID, mention, or username of the Member whom you want warn'
        }), 
        new Argument({
            _name:'reason',
            nameStartsWithVowel:false,
            optional:true,
            type:'Reason',
            description:'Reason for warning this user'
        })
    ],
    description:'Warns a user',
    /**
     * @param {Message} message
     * @param {Array.<string>} args
     * @param {CollapsaBot} client
     * @param {mlabInteractor} mLab
     */
    execute: async (message, args = [], client, mLab) => {
        console.log(args)
        let guild = message.guild
        let author = guild.members.cache.get(message.author.id)
        let member = args[0]
        let reason = args[1]
        if(!(member instanceof GuildMember)) return
        let collapsa = mLab.databases.get('collapsa')
        let discorduserbase = collapsa.collections.get('discorduserbase')
        if (!discorduserbase.documents.has(member.id)) {
            let doc = {
                id: member.id,
                guilds: {},
            };
            doc.guilds[guild.id] = {};
            let user = new discorduserbaseUser(doc)
            await discorduserbase.addDocument(toLiteral(user));
        } else if (
            !discorduserbase.documents.get(member.id).data.guilds[guild.id]
        ) {
            let user = new discorduserbaseUser(discorduserbase.documents.get(member.id).data);
            user.guilds[guild.id] = {};
            user = new discorduserbaseUser(user)
            await discorduserbase.updateDocument(toLiteral(user));
        }
        
        if (member.id === message.author.id) return message.channel.send('You can\'t warn yourself');
        // Check if the user mention or the entered userID is the message author himsmelf
        //if (!reason) return message.reply('You forgot to enter a reason for this ban!'); 
        // Check if a reason has been given by the message author
        let authorRolesArr = [...author.roles.cache.values()].map(role => role.rawPosition).sort((a, b) => b - a)
        let memberRolesArr = [...member.roles.cache.values()].map(role => role.rawPosition).sort((a, b) => b - a)
        if(author.id == client.owner || author.id == guild.ownerID){
            let user = new discorduserbaseUser( discorduserbase.documents.get(member.id).data)
            user.guilds[guild.id].moderation.push({
                type:'Warning',
                by:message.author.username, 
                reason, 
                time:new Date().getTime()
            })
            user = new discorduserbaseUser(user)
            discorduserbase.updateDocument(toLiteral(user))
            let embed = new MessageEmbed()
                .setColor('#000001')
                .setTitle(`Warned ${member.user.username}`)
                .addFields([
                    {name: 'Reason', value :reason ? reason : 'No reason specified', inline:true},
                    {name: 'Current warnings count', value: user.guilds[guild.id].moderation.filter(warning => warning.type == 'Warning').length, inline:true}    
                ])
                .setDescription('Owner force')
                .setAuthor(message.author.username, message.author.avatarURL())
            message.channel.send(embed)
            return
        }
        if(authorRolesArr[0] <= memberRolesArr[0]) return message.reply('You can\'t warn this user your role is not high enough')
        if (!author.hasPermission(['MANAGE_ROLES'])) return message.reply('You can\'t warn this user because you don\'t have sufficient pemissions')
        if (!guild.owner.id == member.id) return message.reply('You can\'t warn this user because they own the server')
        let user = new discorduserbaseUser(discorduserbase.documents.get(member.id).data)
        user.guilds[guild.id].moderation.push({
            type:'Warning',
            by:message.author.username, 
            reason, 
            time:new Date().getTime()
        })
        user = new discorduserbaseUser(user)
        await discorduserbase.updateDocument(toLiteral(user))
        let embed = new MessageEmbed()
            .setColor('#000001')
            .setTitle(`Warned ${member.user.username}`)
            .addFields([
                {name: 'Reason', value :reason ? reason : 'No reason specified', inline:true},
                {name: 'Current warnings count', value: user.guilds[guild.id].moderation.filter(warning => warning.type == 'Warning').length, inline:true}    
            ])
            .setAuthor(message.author.username, message.author.avatarURL())
        message.channel.send(embed)
    }
})