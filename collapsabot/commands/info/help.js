const {MessageEmbed, Message} = require('discord.js')
const CollapsaBot = require('../../CollapsaBot')
const Command = require('../../Command.js')
module.exports = new Command({
    name:'help',
    description:'Get a list of commands',
    permissions:[],
    /**
     * @param {Message} message
     * @param {Array.<string>} args
     * @param {CollapsaBot} client
     * @param {mlabInteractor} mLab
     */
    execute: async (message, args = [], client, mLab) => {
        let embed = new MessageEmbed()
        if(!args[0]){
            embed.setTitle('Command Information')
            client.commandFolders.forEach((commands, name) => {

                commands = commands.filter(c => message.channel.nsfw || !c.nsfw)
                if(!commands.length) return
                let firstCommand = commands.shift()
                let commandList = commands.reduce((a, b) => `${a} ${b.name}`, firstCommand.name)
                commands.unshift(firstCommand)
                embed.addField(name, commandList)
            })
            message.channel.send(embed);
        }else {
            let command = client.commands.get(args[0])
            if(!command || (!message.channel.nsfw && command.nsfw)){
                message.reply("This command is not valid")
                embed.setTitle('Command Information')
                client.commandFolders.forEach((commands, name) => {
                    commands = commands.filter(c => message.channel.nsfw || c.nsfw == false)
                    if(!commands.length) return
                    let firstCommand = commands.shift()
                    let commandList = commands.reduce((a, b) => `${a} ${b.name}`, firstCommand.name)
                    commands.unshift(firstCommand)
                    embed.addField(name, commandList)
                })
                return message.channel.send(embed);
            }
            if(!args[1]){
                embed.setTitle(`Information about ${command.name}`)
                embed.setDescription(command.description)
                let firstArugment = command.arguments.shift()
                let argumentList = firstArugment ? command.arguments.reduce((a, b) => `${a} <${b.name}>`, `<${firstArugment.name}>`) : ''
                command.arguments.unshift(firstArugment)
                embed.addField('Usage', `!${command.name} ${argumentList}`)
                let roles = message.guild.roles.cache.filter(
                    role => role.permissions.has(command.permissions)
                ).array().map(role => role.toString()).join(' ')
                console.log(roles)
                embed.addField('Roles', roles.startsWith('@everyone') ? '@everyone' : roles)
                message.channel.send(embed)
                message.channel.send('Use `' + `!help ${command.name} argumentname` + '` to get information on a specific argument')
            }else {
                if(!command.arguments.some(arg => arg._name == args[1])){
                    embed.setTitle(`Information about ${command.name}`)
                    embed.setDescription(command.description)
                    let firstArugment = command.arguments.shift()
                    let argumentList = command.arguments.reduce((a, b) => `${a} ${b.name}`, `<${firstArugment.name}>`)
                    command.arguments.unshift(firstArugment)
                    embed.addField('Usage', `!${command.name} ${argumentList}`)
                    let roles = message.guild.roles.cache.filter(
                            role => role.permissions.has(command.permissions)
                        ).array().map(role => role.toString()).join(' ')
                    embed.addField('Roles', roles[0] == '@everyone' ? roles[0] : roles)
                    message.channel.send(embed)
                    message.channel.send('Use `' + `!help ${command.name} argumentname` + '` to get information on a specific argument')
                    return
                }
                let argument = command.arguments.find(arg => arg._name == args[1])
                embed.setTitle(`Information about ${argument.name} in ${command.name}`)
                embed.setDescription(argument.description)
                embed.addField('Optional', argument.optional, true)
                embed.addField('Type', argument.type, true)
                message.channel.send(embed)
            }
        }
    }
})