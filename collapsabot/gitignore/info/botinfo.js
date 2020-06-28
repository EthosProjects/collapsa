const Discord = require('discord.js');
const moment = require('moment');
require('moment-duration-format');

module.exports = {
    name: 'botinfo',
    aliases: ['binfo'],
    category: 'info',
    description: "Displays a Duke's Information!",
    usage: '<binfo @user',

    run: async (client, message, args) => {
        let inline = true;
        let resence = true;

        let target = client.user.id;
        let randomColor = '#000000'.replace(/0/g, function () {
            return (~~(Math.random() * 16)).toString(16);
        });
        let embed = new Discord.MessageEmbed()

            //.setAuthor(member.user.username)
            //.setAuthor("Invite", client.user.displayAvatarURL, "https://discord.com/oauth2/authorize?client_id=678124077654867978&permissions=8&scope=bot"

            .setAuthor("Duke's Help", client.user.displayAvatarURL)
            .addField('**Username**', '<@678124077654867978>', true)
            .addField('**Creator**', '<@436016533454454784>', true)
            .addField('**Servers**', `${client.guilds.cache.size}`, true)
            .setColor(randomColor)
            .addField(
                '**Uptime**',
                moment
                    .duration(client.uptime)
                    .format('d [days], h [hours], m [minutes], s [seconds]', { trim: 'small' })
            )
            .addField(
                '**Want Me?**',
                '[Invite me to your server](https://discord.com/oauth2/authorize?client_id=678124077654867978&permissions=8&scope=bot)',
                true
            )
            //   .addField("Vote", "[Vote for this bot](https://top.gg/bot/678124077654867978/vote)", true)
            .addField('**Want more info?**', '[Check out our website](https://bit.ly/Duke_bot)', true)
            .addField('**Having Problems?', '[Join the support server](https://discord.gg/wD2WEwh)', true)
            .addField('**Liking the bot?**', '[Vote for Duke here](https://top.gg/bot/678124077654867978/vote)', true)

            .setTimestamp();

        message.channel.send(embed);
    },
};
