const { Collection } = require('discord.js');
class Storage extends Collection {
    /**
     * Constructs a new Storage unit
     * @param {Array.<"empty"|Slot>} base
     * @param {number} length
     */
    constructor(base, length) {
        base ? super(base) : super(new Array(length).fill('').map((e, i) => [`${i + 1}`, 'empty']));
    }
    /**
     * @typedef simpleItem
     * @property {string} type
     * @property {string} image
     * @property {count}  number
     */
    /**
     * Returns a list of items 
     
     * @returns {Array.<simpleItem>}
     */
    listItems() {
        let itemArray = [];
        this.forEach((item) => {
            if (item == 'empty') return itemArray.push(' ');
            else
                return itemArray.push({
                    type: item.id,
                    image: item.image,
                    count: item.count,
                });
        });
        return itemArray;
    }
    /**
     * Adds as many of an item as possible
     * @param {Slot} toAdd
     */
    addItem(toAdd) {
        let found = false;
        let posSlots = this.filter((item) => item.id == toAdd.id);
        posSlots.forEach((item) => {
            if (found) return;
            if (item.id == toAdd.id) {
                if (item.count >= item.stackSize) {
                    found = false;
                } else {
                    if (
                        item.count + toAdd.count > item.stackSize &&
                        this.find((item) => {
                            if (item == 'empty') return true;
                            if (item.id == toAdd.id && item.count != item.stackSize) return true;
                            return false;
                        })
                    ) {
                        toAdd.count -= item.stackSize - item.count;
                        item.count = item.stackSize;
                        found = true;
                        this.addItem(toAdd);
                        return;
                    } else if (item.count + toAdd.count > item.stackSize) {
                        item.count = item.stackSize;
                        found = true;
                        return;
                    }
                    item.count += toAdd.count;
                    found = true;
                }
            }
        });
        if (found) return;
        if (this.find((item) => item == 'empty'))
            return this.set(
                this.findKey((item) => item == 'empty'),
                toAdd,
            );
    }
    /**
     * Adds as many of an item as possible and returns a remainder
     * @param {Slot} toAdd
     * @return {Slot|null}
     */
    addItemMax(toAdd) {
        let found = false;
        let posSlots = this.filter((item) => item.id == toAdd.id);
        let ret = true;
        if (!ret) return;
        while (
            this.find((item) => {
                if (item == 'empty') return true;
                if (item.id == toAdd.id && item.count !== item.stackSize) return true;
                return false;
            }) &&
            toAdd.count &&
            ret
        ) {
            let i = this.find((item) => {
                if (item == 'empty') return true;
                if (item.id == toAdd.id && item.count !== item.stackSize) return true;
                return false;
            });
            if (i == 'empty') {
                ret = false;
                this.set(
                    this.findKey((item) => item == 'empty'),
                    toAdd,
                );
                return;
            }
            if (toAdd.count + i.count > i.stackSize) {
                toAdd.count -= i.stackSize - i.count;
                i.count = i.stackSize;
            } else {
                i.count += toAdd.count;
                ret = false;
            }
        }
        if (ret) return toAdd;
    }
}
module.exports = Storage;
