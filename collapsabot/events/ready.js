const Event = require('../Event.js');
module.exports = new Event({
    name: 'ready',
    execute: (ph, client) => {
        let statusChannel = client.guilds.cache
            .find(guild => guild.id == client.mainGuild)
            .channels.cache.find(channel => channel.id == '720399190089531393');
        //statusChannel.bulkDelete(100, true)
        //statusChannel.send('I\'m online!')
        //console.log(statusChannel.messages.cache)
        console.log(
            `${client.user.username} is now online in ${client.guilds.cache.size} guild${
                client.guilds.cache.size > 1 ? 's' : ''
            }`
        );
        client.guilds.cache.forEach(guild => {
            //console.log(guild.name);

            guild.channels.cache.forEach(channel => {
                //console.log(` - ${channel.name} ${channel.type} ${channel.id}`);
            });
            // general text 679422692931272744
        });
        client.user.setActivity('Collapsa.io', { type: 'PLAYING' });
        //console.log(client)
    },
});
