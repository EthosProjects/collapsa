const Discord = require("discord.js")
const weather = require("weather-js")
module.exports = {
    name: "weather",
    category: "search",
    description: "Displays the Weather of the selected location you choose!",
    usage: "<weather <place>",

    run: async (bot, message, args) => {

        weather.find({search: args.join(" "), degreeType: "C"}, function(err, result) {
            if(err) message.channel.send("Please Seach Location aswell!")
    
            //If the place entered is invalid
            if(result.length === 0) {
                message.channel.send("**I could not find this location. I'm sorry...**")
                return;
            }
    
            //Variables
            var current = result[0].current //Variable for the current part of the JSON Output
            var location = result[0].location //This is a variable for the location part of the JSON Output
            const Fahrenheit = Math.round(current.temperature * 9/5 + 32)
    
            //Sends weather log in embed
            let embed = new Discord.MessageEmbed()
               .setDescription(`**${current.skytext}**`) //How the sky looks like
               .setAuthor(`Weather for ${current.observationpoint}`) //Shows the current location of the weater
               .setThumbnail(current.imageUrl) //Sets thumbnail of the embed
               .setColor(0x00AE86) //Sets the color of the embed
               .addField("Timezone", `UTC${location.timezone}`, true) //Shows the timezone
               .addField("Celsius", current.temperature, true) //Shows the degrees in Celsius
               .addField("Fahrenheit", Fahrenheit, true) //Calls on Fahrenheit variable I made above and inserts it here
               .addField("Humidity", ` ${current.humidity}%`, true)
               .addField("Winds", current.winddisplay, true)
               .addField("Day", `${current.day}`, true)
               .addField("Date", `${current.date}`, true)
               .setFooter("Weather presented from https://openweathermap.org")
               
               //Display when it's called
               message.channel.send(embed)
    
        });
    
        message.delete();
        
        }

}