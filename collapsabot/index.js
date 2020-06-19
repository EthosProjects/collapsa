const fs = require('fs');
const {
    MessageEmbed,
    Webhook,
    WebhookClient,
    TextChannel,
} = require('discord.js');
const { 
    Client
} = require('discord-rpc')
const DiscordRPC = require('discord-rpc')
DiscordRPC.register('717959362131263609')
const rpcClient = new Client({ transport:'ipc' })
rpcClient.on('ready', () => {
    const startTimestamp = new Date();
    rpcClient.setActivity({
        state: 'Working on Collapsa.io',
        startTimestamp,
        largeImageKey: 'favicon',
        largeImageText: 'Awesome Developer',
        smallImageKey: 'devshovel',
        smallImageText: 'Shoveling away errors',
        instance: false,
    });
})
rpcClient.login({ clientId:'717959362131263609'})
//
const Collection = require('discord.js').Collection;
let { token, prefix } = require('./config.json');
prefix = process.env.NODE_ENV == 'production' ? '!' : '?'
let { mlabInteractor } = require('mlab-promise');
let youtubeInteractor = require('./youtube.js/Youtube');
//let yotube = new youtubeInteractor('AIzaSyCeld1vKBcUuZESB7qz_gIJxrTJl5w5e_Y')
module.exports = (mLab) => {
    const ytdl = require('ytdl-core-discord');
    const CollapsaBot = require('./CollapsaBot');
    const client = new CollapsaBot(mLab);
    mLab.once('ready', () => {
        let discorduserbase = mLab.databases
            .get('collapsa')
            .collections.get('discorduserbase');
        client.databaseLoaded = true;
        //console.log(owner)
    });
    client.once('ready', () => {
        let statusChannel = client.guilds.cache.find(guild => guild.id == client.mainGuild).channels.cache.find(channel => channel.id == '720399190089531393')
        //statusChannel.bulkDelete(100, true)
        //statusChannel.send('I\'m online!')
        //console.log(statusChannel.messages.cache)
        console.log(
            `${client.user.username} is now online in ${
                client.guilds.cache.size
            } guild${client.guilds.cache.size > 1 ? 's' : ''}`
        );
        client.guilds.cache.forEach((guild) => {
            //console.log(guild.name);
    
            guild.channels.cache.forEach((channel) => {
                //console.log(` - ${channel.name} ${channel.type} ${channel.id}`);
            });
            // general text 679422692931272744
        });
        client.user.setActivity('Collapsa.io', { type: 'PLAYING' })
        //console.log(client)
    });
    let antiSpam = new Collection();
    let expRate = new Collection();
    client.on('message', async (message) => {
        let channel = message.channel;
        let content = message.content;
        let author = message.author;
        if(!message.guild) return
        if (
            message.content.startsWith('!join ') &&
            message.author.id == client.owner
        ) {
            let member = message.guild.members.cache.get(
                message.mentions.users.first().id
            );
            client.emit('guildMemberAdd', member);
            return;
        }
        if (
            message.content.startsWith('!joinGuild') &&
            message.author.id == client.owner
        ) {
            client.emit('guildCreate', message.guild);
            return;
        }
        if (message.content == 'join me collapsabot') {
            if (message.member.voice.channel) {
                const connection = await message.member.voice.channel.join();
                //connection.play(await ytdl('https://www.youtube.com/watch?v=kJQP7kiw5Fk'), { type: 'opus' });
            }
        }
        if (author.bot || message.webhookID) return;
        let member = message.member;
        let guild = message.guild;
        let collapsa = mLab.databases.get('collapsa');
        let discorduserbase = collapsa.collections.get('discorduserbase');
        if (!discorduserbase.documents.has(member.id)) {
            let doc = {
                id: member.id,
                guilds: {},
            };
            doc.guilds[guild.id] = {
                muteTimeEnd: false,
                exp: {
                    amount: 0,
                    level: 1,
                },
                warnings: [],
            };
            await discorduserbase.addDocument(doc);
        } else if (
            !discorduserbase.documents.get(member.id).data.guilds[guild.id]
        ) {
            let doc = Object.assign(
                {},
                discorduserbase.documents.get(member.id).data
            );
            doc.guilds[guild.id] = {
                muteTimeEnd: false,
                exp: {
                    amount: 0,
                    level: 1,
                },
                warnings: [],
            };
            await discorduserbase.updateDocument(doc);
        }
        if (expRate.has(author.id + message.guild.id)) {
            let expRated = expRate.get(author.id + message.guild.id);
            expRate.set(author.id + message.guild.id, {
                author: author.id,
                count: Date.now(),
            });
            if (Date.now() - expRated.count > 60000) {
                let userbase = discorduserbase.documents.get(member.id).data;
                let doc = Object.assign({}, userbase);
                doc.guilds[guild.id].exp.amount += Math.floor(
                    Math.random() * 20 + 20
                );
                discorduserbase.updateDocument(doc);
            }
        } else {
            expRate.set(author.id + message.guild.id, {
                author: author.id,
                count: Date.now(),
            });
            let userbase = discorduserbase.documents.get(member.id).data;
            let doc = Object.assign({}, userbase);
            doc.guilds[guild.id].exp.amount += Math.floor(
                Math.random() * 20 + 20
            );
            discorduserbase.updateDocument(doc);
        }
        if (antiSpam.has(author.id + message.guild.id)) {
            let usr = antiSpam.get(author.id + message.guild.id);
            if (usr.count >= 5) {
                if (
                    channel
                        .permissionsFor(message.guild.me)
                        .has('DELETE_MESSAGES')
                )
                    message.delete();
                message.channel.send("You're sending messages too fast!");
            }
            usr.count++;
            setTimeout(() => {
                antiSpam.get(author.id + message.guild.id).count--;
                if (!antiSpam.get(author.id + message.guild.id).count)
                    antiSpam.delete(author.id + message.guild.id);
            }, 2000);
        } else {
            antiSpam.set(author.id + message.guild.id, {
                author: author.id,
                count: 1,
            });
            setTimeout(() => {
                antiSpam.get(author.id + message.guild.id).count--;
                if (!antiSpam.get(author.id + message.guild.id).count)
                    antiSpam.delete(author.id + message.guild.id);
            }, 2000);
        }
        let prefixRegex = new RegExp(`^(<@!{0,1}\\d+> |${prefix == '!' ?'!' : '\\' + prefix})`)
        if(!content.match(prefixRegex)) return;
        if(content.match(/^d+/) && message.mentions.members.first().id != client.user.id) return
        let args;
        args = content.replace(prefixRegex, '').split(/ +/);
        const commandName = args.shift().toLowerCase();
        if (client.commands.has(commandName))
            client.commands
                .get(commandName)
                .execute(message, args, client, mLab);
    });
    client.on('guildMemberAdd', async (member) => {
        let guildSetup = mLab.databases
            .get('collapsa')
            .collections.get('discordguildbase')
            .documents.get(member.guild.id).data;
        if (
            mLab.databases
                .get('collapsa')
                .collections.get('discorduserbase')
                .documents.has(member.id)
        ) {
            let mData = mLab.databases
                .get('collapsa')
                .collections.get('discorduserbase')
                .documents.get(member.id);
            if (
                mData.data.muteTimeEnd &&
                guildSetup.mute.role &&
                member.guild.roles.cache.has(guildSetup.mute.role)
            ) {
                let role = guildSetup.mute.role;
            }
        }
        if (guildSetup.moderation.channel) {
            let channel = member.guild.channels.cache.get(
                guildSetup.moderation.channel
            );
            let embed = new MessageEmbed()
                .setTitle('Member joined')
                .setAuthor(member.user.username, member.user.avatarURL())
                .addField('Account creation', member.user.createdAt)
                .addField('Joined date', member.joinedAt);
            channel.send(embed);
        }
        if (guildSetup.welcome.role) {
            let role = member.guild.roles.cache.find(
                (r) => r.id == guildSetup.welcome.role
            );
            member.roles.add(role);
        }
    });
    client.on('guildCreate', async (guild) => {
        await mLab.databases
            .get('collapsa')
            .collections.get('discordguildbase')
            .addDocument({
                id: guild.id,
                mute: {
                    role: false,
                },
                moderation: {
                    channel: false,
                },
                welcome: {
                    channel: false,
                    role: false,
                },
            });
        let defaultChannel = '';
        guild.channels.cache.forEach((channel) => {
            if (channel.name.includes('general') || channel.name.includes('lounge') || channel.name.includes('chat')) {
                if (channel.permissionsFor(guild.me).has('SEND_MESSAGES')) {
                    defaultChannel = channel;
                }
            }
        });
        guild.channels.cache.forEach((channel) => {
            if (channel.type == 'text' && defaultChannel == '') {
                if (channel.permissionsFor(guild.me).has('SEND_MESSAGES')) {
                    defaultChannel = channel;
                }
            }
        });
        defaultChannel.send(
            "Hello! It's CollapsaBot. Use !configure to begin configuration"
        );
    });
    client.login(process.env.NODE_ENV == 'production' ? token : 'NzE3OTU5MzYyMTMxMjYzNjA5.Xty2Pg.exCv_gp7VQbgPWK11TtTBGereJ8');
    process.on('uncaughtException', (error) => {
        console.error(error);
    });
};
//let mLab = new mlabInteractor('4unBPu8hpfod29vxgQI57c0NMUqMObzP', ['lexybase', 'chatbase'])