const {MessageEmbed, Message, Collection, Client} = require('discord.js')
const { mlabInteractor } = require('mlab-promise')
module.exports = {
    name:'mute',
    /**
     * @param {Message} message
     * @param {Array.<string>} args
     * @param {Client} client
     * @param {mlabInteractor} mLab
     */
    execute: async (message, args = [], client, mLab) => {
        if(!args[0]){
            return message.reply('No user specified')
        }
        let endTime = new Date().getTime()
        let times = new Collection([
            ['m', ['m', 'minute', 'minutes', ' Minute']], 
            ['h', ['h', 'hr', 'hour', ' hours', 'hours', ' Hour']], 
            ['d', ['day', 'd', ' days', 'days', ' Day']],
            ['s', ['s', 'sec', 'second', 'seconds', ' Second']]
        ])
        let validTime = 'h'
        let timeInt = parseFloat(args[1]) ? parseFloat(args[1]) : 1
        let t = timeInt + 0
        //console.log(args, times)
        console.log(args)
        if(timeInt != 1000 * 60 * 60 && args[1]){
            timeInt + 0
            validTime = [...times.keys()].filter(t => times.get(t).some(a => args[1].endsWith(a)))[0] || 'h'
            let originalTime = times.get(validTime).find(t => args[1].endsWith(t))
            if(!(timeInt + originalTime == args[1]) || !validTime){
                t = 1
                message.reply('Invalid Timer. Using default')
            }
        }
        switch(validTime){
            case 's': 
                t *= 1000
                break;
            case 'm':
                t *= (1000 * 60)
                break;
            case 'h': 
                t *= (1000 * 60 * 60)
                break;
            case 'd':
                t *= (1000 * 60 * 60 * 24)
                break;
        }
        endTime += t
        console.log(t, timeInt, validTime)
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
                exp:{
                    amount:0,
                    level:1
                },
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
                exp:{
                    amount:0,
                    level:1
                },
                warnings:[]
            }
            await discorduserbase.updateDocument(doc)
        }
        
        if (member.id === message.author.id) return message.channel.send('You can\'t mute yourself');
        args.shift() 
        console.log(args)
        if(parseInt(args[0])) args.shift() 
        let reason = args.join(' ')
        // Check if the user mention or the entered userID is the message author himsmelf
        //if (!reason) return message.reply('You forgot to enter a reason for this ban!'); 
        // Check if a reason has been given by the message author
        let authorRolesArr = [...author.roles.cache.values()].map(role => role.rawPosition).sort((a, b) => b - a)
        let memberRolesArr = [...member.roles.cache.values()].map(role => role.rawPosition).sort((a, b) => b - a)
        let guildSetup = collapsa.collections.get('discordguildbase')
        if(!guildSetup.documents.has(guild.id)) return message.reply('This server does not have a setup :(')
        if(!guildSetup.documents.get(guild.id).data.mute.role) return message.reply('This server does not have a mute role set')
        let role = guild.roles.cache.get(guildSetup.documents.get(guild.id).data.mute.role)
        if(!role) return message.reply('It seems that someone has deleted the muted role for this server. Please reconfigure it')
        if(role.rawPosition < memberRolesArr[0]) return message.reply('This mute will do nothing')
        if (!guild.me.hasPermission(['MANAGE_ROLES'])) return message.reply('You can\'t mute this user because the bot doesn\'t have sufficient pemissions')
        if(author.id == client.owner || author.id == guild.ownerID){
            let doc = Object.assign({}, discorduserbase.documents.get(member.id).data)
            doc.guilds[guild.id].muteTimeEnd = endTime
            discorduserbase.updateDocument(doc)
            setTimeout(() => {
                if(!guild.members.cache.has(member.id)) return
                member.roles.remove(role, "Times up")
                let doc = Object.assign({}, discorduserbase.documents.get(member.id).data)
                doc.guilds[guild.id].muteTimeEnd = false
                discorduserbase.updateDocument(doc)
            }, t)
            await member.roles.add(role, reason)
            let embed = new MessageEmbed()
                .setColor('#000001')
                .setTitle(`Muted ${member.user.username}`)
                .addFields([
                    {name: 'Reason', value :reason ? reason : 'No reason specified', inline:true},
                    {name: 'Time', value: `${timeInt} ${times.get(validTime)[times.get(validTime).length - 1]}${timeInt > 1 ? 's' : ''}`, inline:true}
                ])
                .setDescription('Owner force')
                .setAuthor(message.author.username, message.author.avatarURL())
            message.channel.send(embed)
            return
        }
        if(authorRolesArr[0] <= memberRolesArr[0]) return message.reply('You can\'t mute this user your role is not high enough')
        if (!author.hasPermission(['MANAGE_ROLES'])) return message.reply('You can\'t mute this user because you don\'t have sufficient pemissions')
        if (!guild.owner.id == member.id) return message.reply('You can\'t mute this user because they own the server')
        let doc = Object.assign({}, discorduserbase.documents.get(member.id).data)
        doc.guilds[guild.id].muteTimeEnd = endTime
        await discorduserbase.updateDocument(doc)
        await member.roles.add(role, reason)
        setTimeout(() => {
            if(!guild.members.cache.get(member.id)) return
            member.roles.remove(role)
            let doc = Object.assign({}, discorduserbase.documents.get(member.id).data)
            doc.guilds[guild.id].muteTimeEnd = false
            discorduserbase.updateDocument(doc)
        }, t)
        let embed = new MessageEmbed()
            .setColor('#000001')
            .setTitle(`Muted ${message.mentions.users.first().username}`)
            .addFields([
                {name: 'Reason', value :reason ? reason : 'No reason specified', inline:true},
                {name: 'Time', value: `${timeInt} ${times.get(validTime)[times.get(validTime).length - 1]}${timeInt > 1 ? 's' : 's'}`, inline:true}
            ])
            .setAuthor(message.author.username, message.author.avatarURL())
        message.channel.send(embed)
    }
}