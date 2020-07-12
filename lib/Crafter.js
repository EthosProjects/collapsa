const { BasicRecipes, TableRecipes, Resources } = require('../items.js');
const Slot = require('./Slot');
const { Collection } = require('discord.js');
class Crafter extends Collection {
    constructor() {
        super(BasicRecipes);
    }
    checkCraft(inventory) {
        let craftables = [];
        for (const [key, val] of this) {
            let craftable = true;
            val.recipe.forEach((supply) => {
                if (!inventory.find((slot) => slot.count >= supply.count && slot.id == supply.id))
                    return (craftable = false);
            });
            if (craftable) craftables.push(key);
        }
        return craftables;
    }
    craftItem(item, inventory) {
        if (!this.checkCraft(inventory).find((craftable) => craftable == item)) return console.log('Not found');
        var recipe = this.get(item).recipe;
        let output = this.get(item).output;
        recipe.forEach((req) => {
            let r = JSON.parse(JSON.stringify(req));
            inventory.forEach((slot, num) => {
                if (slot == 'empty') return;
                if (r.count == 0) return;
                if (slot.id != req.id) return;
                if (r.count < slot.count) {
                    slot.count -= r.count;
                    r.count = 0;
                } else if (r.count > slot.count) {
                    r.count -= slot.count;
                    slot.count = 0;
                } else {
                    r.count = 0;
                    slot.count = 0;
                }
                if (slot.count == 0) inventory.set(num, 'empty');
            });
        });
        inventory.addItemMax(new Slot(item, output.count, output.image, output.stackSize, output.equipable));
        //if(inventory.findKey(slot => slot == 'empty')) inventory.set(inventory.findKey(slot => slot == 'empty'), {id: 'Axe', count:1, image:'draw'})\
    }
}
module.exports = Crafter;
