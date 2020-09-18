const Argument = require('./Argument.js');
const { User, Message } = require('discord.js');
const { response } = require('express');
const CollapsaBot = require('./CollapsaBot');
let arr = new Array(100);
class Command {
    constructor(options) {
        this.name = Math.random().toString(16);
        /**
         * @type {Array.<Argument>}
         */
        this.arguments = [];
        this.description = 'Default command description';
        this.permissions = ['SEND_MESSAGES'];
        this.nsfw = false;

        /**
         * @param {Message} message
         * @param {Array.<string>} args
         * @param {CollapsaBot} client
         * @param {mlabInteractor} mLab
         */
        this.resolveArguments = (message, args, client, mLab, Invalid) => {
            let resolvedArgs = new Array(this.arguments.length);
            let currLength = args.length + 1 - 1;
            /**
            ['<@21321432412412>', '10s', 'REASON']
            ['User', 'Time', 'REASON']
            ['<@21321432412412>', 'REASON']
            ['User', 'Time', 'REASON']
            [0, 1, 2]
             * [ , , ]
             * Step 1
             * i = 0
             * We resolve the user
             * [ User, , ]
             * Move on
             * Step 2
             * i = 1
             * We cannot Resolve a time
             * [ User, DefaultTime, ]
             * Index of psuedo Argument becomes 2
             * Index of true argument stays as 1
             * reason is args[1] and beyond, instead of args[2] and beyond
             */
            let argIndex = 0;
            for (let i = 0; i < this.arguments.length; i++) {
                let arg = this.arguments[i];
                console.log(arg, 'Current arg');
                let currArg = args[argIndex];
                if (!arg.optional && !currArg) {
                    return message.reply(`You must specify ${arg.text}`);
                }
                let resolveTime = (argument) => {
                    let arg = args[argIndex];
                    let times = ['m', 'h', 'd', 's'];
                    let timeRegex = new RegExp(`^\\d+(${times.reduce((a, b) => `${a}|${b}`)})$`);
                    let timeReplaceRegex = new RegExp(`(${times.reduce((a, b) => `${a}|${b}`)})$`);
                    if (arg.match(timeRegex)) {
                        let timeRegexes = times.map((t) => new RegExp(t));
                        let time = times[timeRegexes.findIndex((t) => arg.match(t))];
                        let t = parseInt(arg.replace(timeReplaceRegex, '')) * 1000;
                        if (time != 's') t *= 60;
                        if (time == 'h') t *= 60;
                        if (time == 'd') t *= 60 * 24;
                        return t;
                    } else return new Invalid();
                };
                let resolveUser = (arg) => {
                    let userID;
                    let initialResolve = (arg) => {
                        if (args[argIndex].match(/^\d{16,18}$/)) userID = args[argIndex];
                        else if (args[argIndex].match(/^<@!{0,1}\d{16,18}>$/)) {
                            userID = args[argIndex].replace(/^<@!{0,1}/, '').replace(/>$/, '');
                        } else if (
                            message.guild.members.cache.find(
                                (member) => member.nickname == args[argIndex] || member.user.username == args[argIndex],
                            )
                        ) {
                            userID = message.guild.members.cache.find(
                                (member) => member.nickname == args[argIndex] || member.user.username == args[argIndex],
                            ).user.id;
                        } else userID = false;
                        if (userID) {
                            let user = client.users.cache.get(userID);
                            if (user) {
                                return user;
                            } else return new Invalid();
                        } else return new Invalid();
                    };
                    return initialResolve(arg + '');
                };
                let resolveMember = (arg) => {
                    let userID;
                    let initialResolve = (arg) => {
                        if (args[argIndex].match(/^\d{16,18}$/)) userID = args[argIndex];
                        else if (args[argIndex].match(/^<@!{0,1}\d{16,18}>$/)) {
                            userID = args[argIndex].replace(/^<@!{0,1}/, '').replace(/>$/, '');
                        } else if (
                            message.guild.members.cache.find(
                                (member) => member.nickname == args[argIndex] || member.user.username == args[argIndex],
                            )
                        ) {
                            userID = message.guild.members.cache.find(
                                (member) => member.nickname == args[argIndex] || member.user.username == args[argIndex],
                            ).user.id;
                        } else userID = false;
                        if (userID) {
                            let user = message.guild.members.cache.get(userID);
                            if (user) {
                                return user;
                            } else return new Invalid();
                        } else return new Invalid();
                    };
                    return initialResolve(arg + '');
                };
                let resolveUserID = (arg) => {
                    let userID;
                    let initialResolve = (arg) => {
                        if (args[argIndex].match(/^\d{16,18}$/)) userID = args[argIndex];
                        else if (args[argIndex].match(/^<@!{0,1}\d{16,18}>$/)) {
                            userID = args[argIndex].replace(/^<@!{0,1}/, '').replace(/>$/, '');
                        } else if (
                            message.guild.members.cache.find(
                                (member) => member.nickname == args[argIndex] || member.user.username == args[argIndex],
                            )
                        ) {
                            userID = message.guild.members.cache.find(
                                (member) => member.nickname == args[argIndex] || member.user.username == args[argIndex],
                            ).user.id;
                        } else userID = false;
                        if (userID) return userID;
                        else return new Invalid();
                    };
                    return initialResolve(arg + '');
                };
                let resolveReason = (arg) => {
                    for (let c = 0; c < argIndex; c++) {
                        args.shift();
                    }
                    return args.join(' ');
                };
                let resolveAmount = (arg) => {
                    for (let c = 0; c < argIndex; c++) {
                        args.shift();
                    }
                    return args.join(' ');
                };
                let resolveEmoji = (arg) => {
                    let emojiRegex = /^<:[a-zA-Z0-9_]{2,32}:\d{16,18}>$/;
                    if (!args[argIndex].match(emojiRegex)) return new Invalid();
                    let id = args[argIndex].replace(/<:[a-zA-Z0-9_]{2,32}:/, '').replace(/>/, '');
                    let emoji = client.emojis.cache.get(id);
                    if (emoji) return emoji;
                    else return new Invalid();
                };
                let resolveEmojiID = (arg) => {
                    let emojiRegex = /^(<:[a-zA-Z0-9_]{2,32}:\d{16,18}>|\d{16,18})$/;
                    if (!args[argIndex].match(emojiRegex)) return new Invalid();
                    let id = args[argIndex].replace(/<:[a-zA-Z0-9_]{2,32}:/, '').replace(/>/, '');
                    return id
                };
                let resolveCommandName = (argument) => {
                    if (client.commands.has(currArg)) {
                        return client.commands.get(currArg);
                    } else return new Invalid();
                };
                let resolveArgumentName = (argument) => {
                    let previousArg = args[argIndex - 1];
                    if (client.commands.has(previousArg)) {
                        let command = client.commands.get(previousArg);
                        if (command.arguments.find((argument) => argument._name == currArg))
                            return command.arguments.find((argument) => argument._name == currArg);
                        else return new Invalid();
                    } else return new Invalid();
                };
                /**
                 *
                 * @param {Argument} argument psuedoArgument
                 */
                let resolveArgument = (argument) => {
                    if (!currArg) {
                        if (argument.type == 'Time') return (resolvedArgs[i] = 60 * 60 * 1000);
                        if (argument.type == 'Reason') return (resolvedArgs[i] = '');
                        return (resolvedArgs[i] = false);
                    }
                    if (argument.type == 'ArgumentName') {
                        let argumentName = resolveArgumentName(argument);
                        if (argumentName instanceof Invalid) {
                            resolvedArgs[i] = false;
                        } else resolvedArgs[i] = argumentName;
                    } else if (argument.type == 'CommandName') {
                        let commandName = resolveCommandName(argument);
                        if (commandName instanceof Invalid) {
                            resolvedArgs[i] = false;
                        } else resolvedArgs[i] = commandName;
                    } else if (argument.type == 'User') {
                        let user = resolveUser(argument);
                        resolvedArgs[i] = user;
                    } else if (argument.type == 'UserID') {
                        let UserID = resolveUserID(argument);
                        resolvedArgs[i] = UserID;
                    } else if (argument.type == 'Member') {
                        let member = resolveMember(argument);
                        resolvedArgs[i] = member;
                    } else if (argument.type == 'Time') {
                        let time = resolveTime(argument);
                        if (time instanceof Invalid) {
                            resolvedArgs[i] = 60 * 60 * 1000;
                            argIndex--;
                        } else resolvedArgs[i] = time;
                    } else if (argument.type == 'Reason') {
                        let reason = resolveReason();
                        resolvedArgs[i] = reason;
                    } else if (argument.type == 'Emoji') {
                        let emoji = resolveEmoji();
                        if (emoji instanceof Invalid) {
                            resolvedArgs[i] = false;
                        } else resolvedArgs[i] = emoji;
                    } else if (argument.type == 'EmojiID') {
                        let emojiID = resolveEmojiID();
                        if (emojiID instanceof Invalid) {
                            resolvedArgs[i] = false;
                        } else resolvedArgs[i] = emojiID;
                    } else resolvedArgs[i] = args[argIndex];
                };
                resolveArgument(arg);
                argIndex++;
            }
            return resolvedArgs;
        };
        this.execute = (message) => {
            message.channel.send('This command has not been set up :(');
        };
        Object.assign(this, options);
    }
}
module.exports = Command;
