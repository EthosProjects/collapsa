const { MessageEmbed, Message } = require('discord.js');
const Command = require('../../Command.js');
const Argument = require('../../Argument.js');
module.exports = new Command({
    name: 'eval',
    /**
     * @param {Message} message
     */
    execute: async (message, args = [], client, mLab) => {
        const clean = (text) => {
            if (typeof text === 'string')
                return text
                    .replace(/`/g, '`' + String.fromCharCode(8203))
                    .replace(/@/g, '@' + String.fromCharCode(8203));
            else return text;
        };
        console.log(message.content);
        if (message.author.id !== client.owner) return;
        try {
            let code = args.join(' ');
            console.log(code, 'Joining');
            code = code.replace(/```$/, '');
            console.log(code, 'Removing end');
            code = code.replace(/^eval(\n| ){1}```\w*/, '');
            console.log([code], 'finished');
            let evaled = eval(code);
            if (typeof evaled !== 'string') evaled = require('util').inspect(evaled);
            message.channel.send(clean(evaled), { code: 'xl' });
        } catch (err) {
            message.channel.send(`\`ERROR\` \`\`\`xl\n${clean(err)}\n\`\`\``);
        }
    },
});
