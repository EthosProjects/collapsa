const {MessageEmbed, Message, Collection, Client} = require('discord.js')
module.exports = {
    name:'unmute',
    /**
     * @param {Message} message
     * @param {Array.<string>} args
     * @param {Client} client
     */
    execute: async (message, args = [], client, mLab) => {
        if(!args[0]){
            return message.reply('No user specified')
        }
        let guild = message.guild
        let guildSetup = mLab.databases.get('collapsa').collections.get('discordguildbase').documents.get(guild.id).data
        if(!guildSetup) return message.reply('This guild has no set up')
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
                exp:{
                    amount:0,
                    level:1
                },
                warnings:[]
            }
            await discorduserbase.addDocument(doc)
        }else if(!discorduserbase.documents.get(member.id).data.guilds[guild.id]){
            let doc = Object.assign({}, discorduserbase.documents.get(member.id).data)
            doc.guilds[guild.id] = {
                muteTimeEnd:false,
                exp:{
                    amount:0,
                    level:1
                },
                warnings:[]
            }
            await discorduserbase.updateDocument(member.id, doc)
        }
        
        if (member.id === message.author.id) return message.channel.send('You\'re. . . . . . .not muted. . . . . .'); 
        args.shift()
        let reason = args.join(' ')
        let authorRolesArr = [...author.roles.cache.values()].map(role => role.rawPosition).sort((a, b) => b - a)
        let memberRolesArr = [...member.roles.cache.values()].map(role => role.rawPosition).sort((a, b) => b - a)
        let role = guild.roles.cache.get(guildSetup.mute.role)
        let botRolesArr = [...guild.members.cache.get(client.user.id).roles.cache.values()].map(role => role.rawPosition).sort((a, b) => b - a)
        if(botRolesArr[0] < role.rawPosition ||!guild.members.cache.get(client.user.id).hasPermission(['MANAGE_ROLES'])) return message.reply('The bot doesn\'t have permission to assign this role')
        if(role.rawPosition < memberRolesArr[0]) return message.reply('This unmute will do nothing')
        if(!member.roles.cache.has(role.id)) return message.reply('This member isn\'t muted')
        if(author.id == client.owner || author.id == guild.ownerID){
            let doc = Object.assign({}, discorduserbase.documents.get(member.id).data)
            doc.guilds[guild.id].muteTimeEnd = false
            discorduserbase.updateDocument(doc)
            await member.roles.remove(role)
            let embed = new MessageEmbed()
                .setColor('#000001')
                .setTitle(`Unmuted ${member.user.username}`)
                .addFields([
                    {name: 'Reason', value :reason ? reason : 'No reason specified', inline:true}
                ])
                .setDescription('Owner force')
                .setAuthor(message.author.username, message.author.avatarURL())
            message.channel.send(embed)
            return
        }
        if(authorRolesArr[0] <= memberRolesArr[0]) return message.reply('You can\'t mute this user your role is not high enough')
        if (!author.hasPermission(['MANAGE_ROLES'])) return message.reply('You can\'t mute this user because you don\'t have sufficient pemissions')
        if (!guild.owner.id == member.id) return message.reply('This user cannot be unmuted')
        let doc = Object.assign({}, discorduserbase.documents.get(member.id).data)
        doc.guilds[guild.id].muteTimeEnd = false
        await discorduserbase.updateDocument(doc)
        await member.roles.remove(role)
        let embed = new MessageEmbed()
            .setColor('#000001')
            .setTitle(`Unmuted ${message.mentions.users.first().username}`)
            .addFields([
                {name: 'Reason', value :reason ? reason : 'No reason specified', inline:true}
            ])
            .setAuthor(message.author.username, message.author.avatarURL())
        message.channel.send(embed)
    }
}