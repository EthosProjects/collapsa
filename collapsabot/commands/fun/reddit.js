const { MessageEmbed, Message } = require('discord.js');
const Command = require('../../Command.js');
const Argument = require('../../Argument.js');
const https = require('https');
const { random } = require('../../../math.js');
const getAllData = res => {
    return new Promise((resolve, reject) => {
        let buffer = [];
        res.on('data', data => buffer.push(data));
        res.on('end', () => resolve(JSON.parse(buffer.join(''))));
    });
};
const getBrokenData = res => {
    return new Promise((resolve, reject) => {
        let buffer = [];
        res.on('data', data => buffer.push(data));
        res.on('end', () => resolve(buffer.join('')));
    });
};
module.exports = new Command({
    name: 'reddit',
    arguments: [
        new Argument({
            _name: 'subreddit',
            optional: false,
            type: 'Subreddit',
            description: 'The subreddit you want to get a post from',
        }),
    ],
    description: 'Get the avatar of yourself, or other users',
    /**
     * @param {Message} message
     */
    execute: async (message, args = [], client, mLab) => {
        if (!args[0]) return message.reply('Please include a subreddit');
        https
            .get({
                host: 'www.reddit.com',
                path: `/r/${args[0]}.json?sort=top&t=day`,
            })
            .on('response', async res => {
                getAllData(res)
                    .then(body => {
                        if (body.error) throw new Error('Damn');
                        const allowed = message.channel.nsfw
                            ? body.data.children
                            : body.data.children.filter(post => !post.data.over_18);
                        if (!allowed.length) return message.channel.send('It apears that this is an NSFW subreddit');
                        const randomnumber = Math.floor(Math.random() * allowed.length);
                        let post = allowed[Math.floor(Math.random() * allowed.length)];
                        const embed = new MessageEmbed()
                            .setColor(0x00a2e8)
                            .setTitle(post.data.title)
                            .setDescription('Posted by: ' + post.data.author)
                            .setImage(post.data.url)
                            .setFooter('React with ❌ to delete this post');
                        if (post.data.selftext) embed.addField('Text', post.data.selftext);
                        message.channel.send(embed).then(m => {
                            m.react('❌').then(reaction => {
                                let filter = (reaction, user) =>
                                    reaction.emoji.name == '❌' && user.id == message.author.id;
                                let collector = m.createReactionCollector(filter, {});
                                collector.on('collect', reaction => m.delete());
                            });
                        });
                    })
                    .catch(err => {
                        const embed = new MessageEmbed().setColor('red').setTitle('This subreddit was not found');
                        message.channel.send(embed);
                    });
            })
            .end();
    },
});
/*const { body } = await snekfetch
            .get('https://www.reddit.com/r/dankmemes.json?sort=top&t=day')
            .query({ limit: 800 });
        const allowed = message.channel.nsfw ? body.data.children : body.data.children.filter(post => !post.data.over_18);
        if (!allowed.length) return message.channel.send('It seems we are out of fresh memes!, Try again later.');
        const randomnumber = Math.floor(Math.random() * allowed.length)
        const embed = new Discord.MessageEmbed()
            .setColor(0x00A2E8)
            .setTitle(allowed[randomnumber].data.title)
            .setDescription("Posted by: " + allowed[randomnumber].data.author)
            .setImage(allowed[randomnumber].data.url)
            .setFooter("React with ❌ to delete this meme");
        let m = await message.channel.send(embed)
        await m.react("❌")
        let filter = (reaction, user) => (reaction.emoji.name == '❌') && user.id == message.author.id
        let collector = m.createReactionCollector(filter, {})
        collector.on('collect', reaction => {
            collector.stop()
            m.reactions.removeAll()
            embed.setTitle('Deleted Meme')
            embed.setDescription(`Succesfully Deleted Meme!`)
            embed.setImage("https://upload.wikimedia.org/wikipedia/commons/d/d4/Image_deleted_logo.png")
            m.edit(embed)
        })*/
