const Storage = require('./Storage')
class Inventory extends Storage {
    constructor() {
        super(false, 9);
    }
    listItems() {
        let itemArray = [];
        this.forEach(item => {
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
    addItem(toAdd) {
        let found = false;
        let posSlots = this.filter(item => item.id == toAdd.id);
        posSlots.forEach(item => {
            if (found) return;
            if (item.id == toAdd.id) {
                if (item.count >= item.stackSize) {
                    found = false;
                } else {
                    if (
                        item.count + toAdd.count > item.stackSize &&
                        this.find(item => {
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
        if (this.find(item => item == 'empty'))
            return this.set(
                this.findKey(item => item == 'empty'),
                toAdd
            );
    }
    addItemMax(toAdd) {
        let found = false;
        let posSlots = this.filter(item => item.id == toAdd.id);
        let ret = true;
        if (!ret) return;
        while (
            this.find(item => {
                if (item == 'empty') return true;
                if (item.id == toAdd.id && item.count !== item.stackSize) return true;
                return false;
            }) &&
            toAdd.count &&
            ret
        ) {
            let i = this.find(item => {
                if (item == 'empty') return true;
                if (item.id == toAdd.id && item.count !== item.stackSize) return true;
                return false;
            });
            if (i == 'empty') {
                ret = false;
                this.set(
                    this.findKey(item => item == 'empty'),
                    toAdd
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
module.exports = Inventory