const {MessageEmbed, Message} = require('discord.js')
const Command = require('../../Command.js')
const Argument = require('../../Argument.js')
module.exports = new Command({
    name:'ban',
    arguments:[
        new Argument({
            _name:'user',
            optional:false,
            type:'User',
            description:'User ID, mention, or username of the user whom you want ban'
        })
    ],
    description:'Bans a user',
    /**
     * @param {Message} message
     */
    execute: async (message, args = [], client) => {
        if(!args[0]){
            return message.reply('No user specified')
        }
        let guild = message.guild
        let author = guild.members.cache.get(message.author.id)
        let user = message.mentions.users.first()
        if(guild.members.cache.has(args[0])) user = guild.members.cache.get(args[0])
        if(!user) return message.reply('Error getting user')
        let member = guild.members.cache.get(user.id)
        if (member.id === message.author.id) return message.channel.send('You can\'t ban yourself'); 
        
        args.shift()
        let reason = args.join(' ')
        //let authorRolesArr = [...author.roles.cache.values()].map(role => role.rawPosition).sort((a, b) => b - a)
        //let memberRolesArr = [...author.roles.cache.values()].map(role => role.rawPosition).sort((a, b) => b - a)
        //if (!guild.member(user).bannable) return message.reply('You can\'t ban this user because the bot does not have sufficient permissions!'); 
        if (!member.bannable) return message.reply('You can\'t ban this user because the bot doesn\'t have sufficient pemissions')
        if (guild.owner.id == author.id || author.id == client.owner){
            await member.ban()
            let embed = new MessageEmbed()
                .setColor('#ff0000')
                .setTitle(`Banned ${message.mentions.users.first().username}`)
                .addField('Reason', reason ? reason : 'No reason specified')
                .setThumbnail('http://www.collapsa.io/client/img/amethysthammer.png')
                .setDescription('Owner force')
                .setAuthor("CollapsaBot", 'http://www.collapsa.io/client/img/favicon.png')
                .setTimestamp()
            message.channel.send(embed)
            return
        }
        if(authorRolesArr[0] <= memberRolesArr[0]) return message.reply('You can\'t ban this user your role is not high enough')
        if (!author.hasPermission(['BAN_MEMBERS'])) return message.reply('You can\'t ban this user because you don\'t have sufficient pemissions')
        if (!guild.owner.id == user.id) return message.reply('You can\'t ban this user because they own the server')
        await member.ban()
        let embed = new MessageEmbed()
        setColor('#ff0000')
            .setTitle(`Banned ${message.mentions.users.first().username}`)
            .addField('Reason', reason ? reason : 'No reason specified')
            .setThumbnail('http://www.collapsa.io/client/img/amethysthammer.png')
            .setAuthor("CollapsaBot", 'http://www.collapsa.io/client/img/favicon.png')
            .setTimestamp()
        message.channel.send(embed)
    }
})