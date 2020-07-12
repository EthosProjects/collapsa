const { MessageEmbed, Message } = require('discord.js');
const { API } = require('nhentai-api');
const Command = require('../../Command.js');
const Argument = require('../../Argument.js');
module.exports = new Command({
    name: 'nhentai',
    /**
     * @param {Message} message
     */
    execute: async (message, args = [], client, mLab) => {
        if (!message.author.id == client.owner && !message.channel.nsfw) return;
        let api = new API();
        let type = args.shift();
        switch (type) {
            case 'search':
                let first = args[0] == 'first';
                if (first) args.shift();
                let results = await api.search(encodeURIComponent(args.join(' ')), 1);
                if (first) {
                    let book = results.books[0];
                    let embed = new MessageEmbed()
                        .setTitle((book.title.pretty || book.title.english || book.title.japanese) + ': Cover Page')
                        .setImage(api.getImageURL(book.pages[0]));
                    let m = await message.channel.send(embed);
                    m.react('⬅️');
                    m.react('➡️');
                    m.react('❌');
                    let filter = (reaction, user) =>
                        (reaction.emoji.name == '⬅️' || reaction.emoji.name == '➡️' || reaction.emoji.name == '❌') &&
                        user.id == message.author.id;
                    let badReactionFilter = (reaction, user) => user.id != message.author.id && !user.bot;
                    let pageNum = 1;
                    let collector = m.createReactionCollector(filter, {});
                    collector.on('collect', (reaction) => {
                        reaction.users.remove(message.author.id);
                        if (reaction.emoji.name == '➡️') {
                            if (pageNum == book.pages.length) return;
                            pageNum++;
                            embed.setTitle(
                                (book.title.pretty || book.title.english || book.title.japanese) +
                                    (pageNum == 1 ? ': Cover Page' : `Page ${pageNum} out of ${book.pages.length}`),
                            );
                            embed.setImage(api.getImageURL(book.pages[pageNum - 1]));
                            m.edit(embed);
                        } else if (reaction.emoji.name == '⬅️') {
                            if (pageNum == 1) return;
                            pageNum--;
                            embed.setTitle(
                                (book.title.pretty || book.title.english || book.title.japanese) +
                                    (pageNum == 1 ? ': Cover Page' : `Page ${pageNum} out of ${book.pages.length}`),
                            );
                            embed.setImage(api.getImageURL(book.pages[pageNum - 1]));
                            m.edit(embed);
                        } else {
                            embed.setImage('');
                            embed.setTitle(
                                `Thank you for reading ${
                                    book.title.pretty || book.title.english || book.title.japanese
                                }`,
                            );
                            m.edit(embed);
                            collector.stop('The reading was ended');
                        }
                    });
                    let badCollector = m.createReactionCollector(badReactionFilter, {});
                    badCollector.on('collect', (reaction, user) => {
                        user.send("Don't interfere with other people's reading :)");
                        reaction.users.remove(user.id);
                    });
                } else {
                    let books = results.books
                        .filter((book) => book.tags.some((tag) => tag.type.type == 'language' && tag.name == 'english'))
                        .splice(0, 10);
                    let embed = new MessageEmbed().setTitle(`Search results for ${args.join(' ')}`);
                    books.forEach((book) => {
                        let tags = book.tags.filter((tag) => tag.type.type == 'tag');
                        embed
                            .addField('Name', book.title.pretty || book.title.english || book.title.japanese, true)
                            .addField('Page Count', book.pages.length, true)
                            .addField(
                                'Tags',
                                tags.length > 10
                                    ? tags
                                          .splice(0, 10)
                                          .map((tag) => '`' + tag.name + '`')
                                          .join(' ') + '...'
                                    : tags.map((tag) => tag.name).join(' '),
                                true,
                            );
                    });
                    if (embed.length > 6000)
                        return message.channel.send('Unfortunately, this query is unnacceptable. Please try again');
                    let m = await message.channel.send(embed);
                }
                break;
            case 'read':
                let book = await api.getBook(args[0]).catch((e) => {});
                let embed = new MessageEmbed()
                    .setTitle((book.title.pretty || book.title.english || book.title.japanese) + ': Cover Page')
                    .setImage(api.getImageURL(book.pages[0]));
                let m = await message.channel.send(embed);
                m.react('⬅️');
                m.react('➡️');
                m.react('❌');
                let filter = (reaction, user) =>
                    (reaction.emoji.name == '⬅️' || reaction.emoji.name == '➡️' || reaction.emoji.name == '❌') &&
                    user.id == message.author.id;
                let badReactionFilter = (reaction, user) => user.id != message.author.id && !user.bot;
                let pageNum = 1;
                let collector = m.createReactionCollector(filter, {});
                collector.on('collect', (reaction) => {
                    reaction.users.remove(message.author.id);
                    if (reaction.emoji.name == '➡️') {
                        if (pageNum == book.pages.length) return;
                        pageNum++;
                        embed.setTitle(
                            (book.title.pretty || book.title.english || book.title.japanese) +
                                (pageNum == 1 ? ': Cover Page' : `Page ${pageNum} out of ${book.pages.length}`),
                        );
                        embed.setImage(api.getImageURL(book.pages[pageNum - 1]));
                        m.edit(embed);
                    } else if (reaction.emoji.name == '⬅️') {
                        if (pageNum == 1) return;
                        pageNum--;
                        embed.setTitle(
                            (book.title.pretty || book.title.english || book.title.japanese) +
                                (pageNum == 1 ? ': Cover Page' : `Page ${pageNum} out of ${book.pages.length}`),
                        );
                        embed.setImage(api.getImageURL(book.pages[pageNum - 1]));
                        m.edit(embed);
                    } else {
                        embed.setImage('');
                        embed.setTitle(
                            `Thank you for reading ${book.title.pretty || book.title.english || book.title.japanese}`,
                        );
                        m.edit(embed);
                        collector.stop('The reading was ended');
                    }
                });
                let badCollector = m.createReactionCollector(badReactionFilter, {});
                badCollector.on('collect', (reaction, user) => {
                    user.send("Don't interfere with other people's reading :)");
                    reaction.users.remove(user.id);
                });
                break;
        }
    },
    nsfw: true,
});
