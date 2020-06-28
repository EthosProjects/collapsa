const Discord = require('discord.js');

module.exports = {
    name: 'puff',
    category: 'fun',
    description: 'Random Puffer?!?',
    usage: '[command]',

    run: async (bot, message, args) => {
        fish = [
            'https://media.giphy.com/media/6t3ISgOPaNaeY/giphy.gif',
            'https://media.giphy.com/media/3ohhwIkoQvnnvy9QRy/giphy.gif',
            'https://media.giphy.com/media/kTZBUjdRlZB3G/giphy.gif',
            'https://media.giphy.com/media/11WDHk7pLeqKys/giphy.gif',
            'https://media.giphy.com/media/Ri36aXH6NzQ76/giphy.gif',
            'https://media.giphy.com/media/OsfRSG5QcGO8o/giphy.gif',
            'https://media.giphy.com/media/rVC4HgciIpYGI/giphy.gif',
            'https://upload.wikimedia.org/wikipedia/commons/f/f5/Extra_flotation_devices.jpg',
            'https://azgardens.com/wp-content/uploads/2017/06/Red-Dragon-Bubble-eye-Goldfish.jpg',
            'https://cdn11.bigcommerce.com/s-kkon4imfg5/images/stencil/1280x1280/products/5884/4664/18100071__51729.1522383864.jpg?c=2',
            'https://fishtankmaster.com/wp-content/uploads/2019/04/Bubble-Eye-Goldfish.jpg',
            'https://news.yale.edu/sites/default/files/styles/featured_media/public/adobestock_247791659-ynews-cc.jpg?itok=QBjU78nw&c=07307e7d6a991172b9f808eb83b18804',
            'https://lh3.googleusercontent.com/proxy/0mkYl9sTFHhjhgnbPTLoHMCLALWhCUEdpcMr00wywNvgVHCvaEb0UORzpGHsWvAhBlW8eJsd9wtI8Et5wUK1pn4Hv9q45OFfxGbPpVTdIMVRWwzVhizuKxKe4TxM',
            'https://www.nationalgeographic.com/content/dam/animals/pictures/mammals/n/narwhal/narwhal.jpg',
            'https://thumbs-prod.si-cdn.com/7UodV-s6j5aEVfrYwg5KQ26oBLY=/fit-in/1600x0/https://public-media.si-cdn.com/filer/d6/93/d6939718-4e41-44a8-a8f3-d13648d2bcd0/c3npbx.jpg',
            'https://images.theconversation.com/files/299379/original/file-20191030-154716-1wc4d64.jpg?ixlib=rb-1.1.0&rect=18%2C3%2C2026%2C1355&q=45&auto=format&w=496&fit=clip',
            'https://www.thisiscolossal.com/wp-content/uploads/2019/06/tsubaki-12.jpg',
            'https://cdn0.wideopenpets.com/wp-content/uploads/2019/10/Fish-Names-770x405.png',
            'https://www.telegraph.co.uk/content/dam/science/2017/10/22/TELEMMGLPICT000144108354_trans%2B%2BZqbNnzMENeQWOPqPMX-4IhRy7TN-7bbEnHI_PZtKCtQ.jpeg',
            'https://upload.wikimedia.org/wikipedia/commons/b/bf/Pterois_volitans_Manado-e_edit.jpg',
            'https://www.fishkeepingworld.com/wp-content/uploads/2018/02/17-Most-Popular-Freshwater-Fish-Article-Banner.png',
            'https://www.britishcouncil.org/sites/default/files/clownfish-1920-x-1080.jpg',
            'https://media.discordapp.net/attachments/696482843441889344/708155627041587261/gf2i2xaqc5521.png',
            'https://media.discordapp.net/attachments/696482843441889344/708155749796282429/d9aca0ff6db8f0160a8ac1faed3429d4--funny-fish-water-animals.png',
        ];
        let fishresult = Math.floor(Math.random() * fish.length);

        const embed = new Discord.MessageEmbed()
            .setTitle('Puff For Fish')
            .setColor('#00ff00')
            .setImage(fish[fishresult]);

        message.channel.send(embed);
    },
};
