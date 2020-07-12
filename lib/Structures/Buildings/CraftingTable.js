const Entity = require('../../Entity');
const { Bodies } = require('matter-js');
const { Collection } = require('discord.js');
class CraftingTable extends Collection {
    constructor(game, x, y) {
        super(TableRecipes);
        let originalEntity = new Entity(Bodies.rectangle(x, y, 100, 100, { isStatic: true }), 100, game);
        Object.assign(this, originalEntity);
        console.log(this);
        const { CraftingTables, Entities, initPack } = this.game;
        Entities.splice(
            Entities.findIndex((e) => e.id === originalEntity.id),
            1,
        );
        Entities.push(this);
        var pack = {
            x: this.x,
            y: this.y,
            id: this.id,
        };
        CraftingTables.list.push(this);
        Entities.push(this);
        initPack.ctable.push(pack);
    }
    checkCraft(inventory) {
        let craftables = [];
        for (const [key, val] of this) {
            let craftable = true;
            val.recipe.forEach((supply) => {
                if (!inventory.find((slot) => slot.count >= supply.count && slot.id == supply.id))
                    return (craftable = false);
            });
            if (craftable) craftables.push({ craft: key, craftable: true });
            else craftables.push({ craft: key, craftable: false });
        }

        return craftables;
    }
    craftItem(item, inventory) {
        if (!this.checkCraft(inventory).find((craftable) => craftable.craft == item)) return console.log('Not found');
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
                console.log(item, output);
                if (slot.count == 0) inventory.set(num, 'empty');
            });
        });
        inventory.addItem(
            new Slot(
                item,
                output.count,
                output.image,
                output.stackSize,
                output.equipable,
                output.edible,
                output.armorable,
                output.hatable,
            ),
        );
        //if(inventory.findKey(slot => slot == 'empty')) inventory.set(inventory.findKey(slot => slot == 'empty'), {id: 'Axe', count:1, image:'draw'})\
    }
    getInitPack() {
        return {
            x: this.x,
            y: this.y,
            id: this.id,
        };
    }
}
module.exports = CraftingTable;
