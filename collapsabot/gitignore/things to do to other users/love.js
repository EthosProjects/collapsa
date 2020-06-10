const { MessageEmbed, Message } = require("discord.js");
const { getMember } = require("../../functions.js");

module.exports = {
    name: "love",
    aliases: ["affinity"],
    category: "things to do to other users",
    description: "Calculates the love affinity you have for another person.",
    usage: "[mention | id | username]",
    /**
     * @param {Message} message
     */
    run: async (client, message, args) => {
        // Get a member from mention, id, or username
        //I tried to fix all the stuff I could understand.
        //I dont know what collection.random does but it should work now
        let person = message.mentions.users.first() || message.guild.members.cache.find(member => member.displayName.includes(args[0]))
            || message.guild.members.cache.find(member => member.user.username.includes(args[0])) || message.guild.members.cache.get(args[0])
        //what does this do? hmm. idk XDD
        //whats the issue here?
        // If no person is found
        // It's going to default to the author
        // And we don't want to love ourself in this command
        // So we filter out our ID from the server members
        // And get a random person from that collection
        if (!person || message.author.id === person.id) {
            person = message.guild.members.cache
                .filter(m => m.id !== message.author.id)
                .random();
        }
        // love is the percentage
        // loveIndex is a number from 0 to 10, based on that love variable
        const love = Math.random() * 100;
        const loveIndex = Math.floor(love / 10);
        const loveLevel = "💖".repeat(loveIndex) + "💔".repeat(10 - loveIndex);
        //shit, i know what's wrong now. Display names only apply if you have one. oh like a nickname?
    //yes
    //usernames are your actual username that you chose. display names can be changed by you, or the admins
        const embed = new MessageEmbed()
            .setColor("#0x00FF17")
            .addField(`☁ **${person.displayName || person.username}** loves **${message.member.displayName || message.author.username}** this much:`,
            `💟 ${Math.floor(love)}%\n\n${loveLevel}`);

        message.channel.send(embed);
    }
}