const Discord = require('discord.js');
const snekfetch = require('snekfetch');
module.exports = {
    name: 'showerthoughts',
    aliases: ['sthoughts'],
    category: 'fun',
    description: 'Shower Thoughts',
    usage: '<sthoughts',

    run: async (client, message, args) => {
        try {
            const { body } = await snekfetch.get('https://www.reddit.com/r/Showerthoughts.json').query({ limit: 1000 });
            const allowed = message.channel.nsfw
                ? body.data.children
                : body.data.children.filter(post => !post.data.over_18);
            if (!allowed.length)
                return message.channel.send('It seems the shower thoughts are gone right now. Try again later!');
            return message.channel.send(allowed[Math.floor(Math.random() * allowed.length)].data.title);
        } catch (err) {
            return;
        }
    },
};
