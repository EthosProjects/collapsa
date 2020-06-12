class Argument {
    constructor(options){
        this._name = Math.random().toString(16)
        this.optional = true
        this.type = 'unknown'
        this.description = 'Argument'
        Object.assign(this, options)
    }
    get name(){
        return this.optional ? `?${this._name}` : this._name
    }
}
module.exports = Argument