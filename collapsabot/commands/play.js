const {MessageEmbed, Message} = require('discord.js')
module.exports = {
    name:'play',
    /**
     * @param {Message} message
     */
    execute: async (message, args = [], client, mLab) => {
        const ytlinkRegex = /(https?)?(:\/\/)?((www\.)?youtube\.com|youtu\.be)\/?.*[a-z]?/;
        const ytListRegex = /^.*((youtu.be\/)?list=)([^#&?]*).*/;
        const isList = ytListRegex.test(message.content);
        const containsYTLink = ytlinkRegex.test(message.content);
        const query = 'https://www.youtube.com/results?search_query=';
        const search = containsYTLink
            ? ytlinkRegex.exec(message.content)[0]
            : query + args.join('+');
        let listVideos = [];
        if (!message.member.voice.channel) {
            return message.reply('You need to join a voice channel first!');
        }
        const connection = await message.member.voice.channel
            .join()
            .catch((err) => {
                client.errorF(
                    message,
                    `something went wrong\n${require('util').inspect(err)}`
                );
            });
        if (!connection) {
            return;
        }
        const queue = client.system.get(message.guild.id);
        queue.channel = message.channel;
        if(connection.dispatcher == null && queue.queue[0]) {
            client.system.play(connection, message, (connection, message) =>helper.loadNext(connection, message));
        }

        if ((!args[0] || args[0] == '') && !queue.active) {
            if (!db.get(message.guild.id)) {
                console.log('server unauthed: ' + message.guild.name);
                db.set(message.guild.id, true);
                const dispatcher = connection.play('Lazor.mp3');
                dispatcher.on('finish', async () => {
                    helper.loadNext(connection, message);
                });
            }
            else {
                // initCustomOrAuto(message, connection);
                helper.loadNext(connection, message);
            }
        }
        if (args.join('+') == '') {
            return;
        }
        console.log(
            `music list status for guild "${message.guild.name}":${
                queue ? 'list exists' : 'list doesnt exist'
            }`
        );


        let info;
        if (isList) {
            listVideos = await client.system.getList(encodeURI(search));
            if(listVideos.error) {
                return client.errorF(
                    message,
                    `something went wrong\n${listVideos.error}`
                );
            }
            const listEmbed = new Discord.MessageEmbed()
                .setColor(helper.normalcolor)
                .setDescription(
                    `Added and queued ${
                        listVideos.length
                    } songs into the playlist`
                );
            message.channel.send(listEmbed);
            info = await client.system.lookUp(listVideos.shift()).catch(e=>client.errorF(message, e));
        }
        else {info = await client.system.lookUp(args.join('+')).catch(e=>client.errorF(message, e));}
        if(!info) {
            return;
        }
        const ytlink = info.video_url;
        if (!db.get(message.guild.id)) {
            console.log('unauthed');
            db.set(message.guild.id, true);
            const dispatcher = connection.play('Lazor.mp3');
            dispatcher.on('finish', async () => {
                await client.system.add(ytlink, message.guild.id);
                client.system.playAlt(connection, message, (connection, message) =>helper.loadNext(connection, message));
            });
        }
        else {
            console.log('authed');
            await client.system.add(ytlink, message.guild.id);
            if (!connection.dispatcher && !queue.active) {
                client.system.playAlt(connection, message, (connection, message)=>helper.loadNext(connection, message));
            }
            else {
                // await client.system.add(ytlink, message.guild.id);
                const thumb = info.thumbnail;
                const embed = new Discord.MessageEmbed()
                    .setTitle('Added to queue:')
                    .setFooter(
                        `HQ|Music|[${client.version}]`,
                        client.gifurl
                    )
                    .setColor(helper.normalcolor)
                    .addField('Song:', `[${info.title}](${ytlink})`, false)
                    .addField('Channel:', `${info.author.name || 'unknown'}`, false)
                    .addField('Position:', client.system.get(message.guild.id).queue.length - 1, false)
                    .setThumbnail(thumb.url);
                message.channel.send(embed);
            }
        }
        if(isList)	{
            listVideos.forEach((vid) => {
                client.system.add(vid, message.guild.id)
                    .catch((err) => {
                        client.errorF(
                            message,
                            `a song failed to load:\n${vid}\n${err}`
                        );
                    });
            });
        }
    }
}