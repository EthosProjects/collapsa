const {MessageEmbed, Message, Collection} = require('discord.js')
const Command = require('../../Command.js')
const Argument = require('../../Argument.js')
module.exports = new Command({
    name:'warn',
    arguments:[
        new Argument({
            _name:'user',
            optional:false,
            type:'User',
            description:'User ID, mention, or username of the user whom you want to warn'
        }),
    ],
    description:'Warns a user',
    /**
     * @param {Message} message
     * @param {Array.<string>} args
     * @param {CollapsaBot} client
     * @param {mlabInteractor} mLab
     */
    execute: async (message, args = [], client, mLab) => {
        if(!args[0]){
            return message.reply('No user specified')
        }
        
        let guild = message.guild
        let author = guild.members.cache.get(message.author.id)
        let member = message.mentions.users.first() ? guild.members.cache.get(message.mentions.users.first().id) : guild.members.cache.get(args[0])
        if(!member) return message.reply('Invalid user specified')
        let collapsa = mLab.databases.get('collapsa')
        let discorduserbase = collapsa.collections.get('discorduserbase')
        if(!discorduserbase.documents.has(member.id)){
            let doc = {
                id:member.id,
                guilds: {

                }
            }
            doc.guilds[guild.id] = {
                muteTimeEnd:false,
                exp:0,
                warnings:[]
            }
            await discorduserbase.addDocument(doc)
            let embed = new MessageEmbed()
                .setTitle('Added member to database')
                .addField('Username', member.user.username)
            message.reply(embed)
        }else if(!discorduserbase.documents.get(member.id).data.guilds[guild.id]){
            let doc = Object.assign({}, discorduserbase.documents.get(member.id).data)
            doc.guilds[guild.id] = {
                muteTimeEnd:false,
                exp:0,
                warnings:[]
            }
            await discorduserbase.updateDocument(doc)
        }
        
        if (member.id === message.author.id) return message.channel.send('You can\'t warn yourself'); 
        args.shift()
        let reason = args.join(' ')
        // Check if the user mention or the entered userID is the message author himsmelf
        //if (!reason) return message.reply('You forgot to enter a reason for this ban!'); 
        // Check if a reason has been given by the message author
        let authorRolesArr = [...author.roles.cache.values()].map(role => role.rawPosition).sort((a, b) => b - a)
        let memberRolesArr = [...member.roles.cache.values()].map(role => role.rawPosition).sort((a, b) => b - a)
        let role = guild.roles.cache.get('715973607590723635')
        if(author.id == client.owner || author.id == guild.ownerID){
            let doc = Object.assign({}, discorduserbase.documents.get(member.id).data)
            console.log(doc)
            doc.guilds[guild.id].warnings.push({by:message.author.username, reason, time:new Date().getTime()})
            discorduserbase.updateDocument(doc)
            let embed = new MessageEmbed()
                .setColor('#000001')
                .setTitle(`Warned ${member.user.username}`)
                .addFields([
                    {name: 'Reason', value :reason ? reason : 'No reason specified', inline:true},
                    {name: 'Current warnings count', value: doc.guilds[guild.id].warnings.length, inline:true}    
                ])
                .setDescription('Owner force')
                .setAuthor(message.author.username, message.author.avatarURL())
            message.channel.send(embed)
            return
        }
        if(authorRolesArr[0] <= memberRolesArr[0]) return message.reply('You can\'t warn this user your role is not high enough')
        if (!author.hasPermission(['MANAGE_ROLES'])) return message.reply('You can\'t warn this user because you don\'t have sufficient pemissions')
        if (!guild.owner.id == member.id) return message.reply('You can\'t warn this user because they own the server')
        let doc = Object.assign({}, discorduserbase.documents.get(member.id).data)
        doc.guilds[guild.id].warnings.push({by:message.author.username, reason})
        await discorduserbase.updateDocument(doc)
        let embed = new MessageEmbed()
            .setColor('#000001')
            .setTitle(`Warned ${member.user.username}`)
            .addFields([
                {name: 'Reason', value :reason ? reason : 'No reason specified', inline:true},
                {name: 'Current warnings count', value: doc.guilds[guild.id].warnings.length, inline:true}    
            ])
            .setAuthor(message.author.username, message.author.avatarURL())
        message.channel.send
    }
})