const {MessageEmbed, Message} = require('discord.js')
module.exports = {
    name:'kick',
    /**
     * @param {Message} message
     */
    execute: async (message, args = []) => {
        if(!args[0]){
            return message.reply('No user specified')
        }
        let guild = message.guild
        let author = guild.members.cache.get(message.author.id)
        let user = message.mentions.users.first()
        if(guild.members.cache.has(args[0])) user = guild.members.cache.get(args[0])
        if(!user) return message.reply('Error getting user')
        let member = guild.members.cache.get(user.id)
        if (member.id === message.author.id) return message.channel.send('You can\'t kick yourself'); 
        
        args.shift()
        let reason = args.join(' ')
        // Check if the user mention or the entered userID is the message author himsmelf
        //if (!reason) return message.reply('You forgot to enter a reason for this ban!'); 
        // Check if a reason has been given by the message author
        let authorRolesArr = [...author.roles.cache.values()].map(role => role.rawPosition).sort((a, b) => b - a)
        let memberRolesArr = [...author.roles.cache.values()].map(role => role.rawPosition).sort((a, b) => b - a)
        if(authorRolesArr[0] <= memberRolesArr[0]) return message.reply('You can\'t kick this user your role is not high enough')
        if (!author.hasPermission(['KICK_MEMBERS'])) return message.reply('You can\'t kick this user because you don\'t have sufficient pemissions')
        if (!guild.member(user).kickable) return message.reply('You can\'t kick this user because the bot does not have sufficient permissions!'); 
        if (!guild.owner.id == user.id) return message.reply('You can\'t kick this user because they own the server')
        // Check if the user is bannable with the bot's permissions
        await member.kick() // Bans the user
        console.log('rip')
        let embed = new MessageEmbed()
            .setColor('purple')
            .setTitle(`Kicked ${message.mentions.users.first().username}`)
            .addField('Reason', reason ? reason : 'No reason specified')
            .setAuthor(message.author.username, message.author.avatarURL())
        message.channel.send(embed)
    }
}