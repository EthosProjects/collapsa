const Discord = require('discord.js');

module.exports = {
    name: 'slotgame',
    aliases: ['slots', 'sgame'],
    category: 'games',
    description: 'Opens slots game',
    usage: '<slots',

    run: async (client, message) => {
        let slots = ['🍎', '🍌', '🍒', '🍓', '🍈'];
        let result1 = Math.floor(Math.random() * slots.length);
        let result2 = Math.floor(Math.random() * slots.length);
        let result3 = Math.floor(Math.random() * slots.length);
        let name = message.author.displayName;
        let msg = await message.channel.send('**Rolling the Slots....**');
        let aicon = message.author.displayAvatarURL;
        if (slots[result1] === slots[result2] && slots[result3]) {
            let wEmbed = new Discord.MessageEmbed()
                .setFooter('You Won!!', aicon)
                .setTitle(':slot_machine:Slots:slot_machine:')
                .addField('Result:', slots[result1] + slots[result2] + slots[result3], true)
                .setColor('#0x00FF17');
            await message.channel.send(wEmbed);
        } else {
            let embed = new Discord.MessageEmbed()
                .setFooter('You Lost! RIP', aicon)
                .setTitle(':slot_machine:Slots:slot_machine:')
                .addField('Result', slots[result1] + slots[result2] + slots[result3], true)
                .setColor('#0x00FF17');
            await message.channel.send(embed);
        }

        if ((slots[result1] == slots[result2]) == slots[result1] && slots[result3] == slots[result1]) {
            let embed = new Discord.MessageEmbed()
                .setFooter('You won the jackpot!!! RIP', aicon)
                .setTitle(':slot_machine:Slots:slot_machine:')
                .addField('Result', slots[result1] + slots[result2] + slots[result3], true)
                .setColor('#0x00FF17');
            await message.channel.send(embed);
        }
    },
};
