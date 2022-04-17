import {Logical} from "./logical";
import {isLogical} from "./is";

export class Constraint {
    id!: number
    alive = true
    activated = false
    stored = false
    hist = null
    name: string
    arity: number
    functor: string
    args: unknown[]

    constructor(name: string, arity: number, args: unknown[]) {
        this.name = name
        this.arity = arity
        this.functor = name + '/' + arity
        this.args = args
    }

    toString() {
        let res = this.name
        if (this.arity > 0) {
            res += '('
            res += this.args.map(escape).join(',')
            res += ')'
        }
        return res
    }
}


const escape = (val: unknown) => {
    if (isLogical(val)) {
        return val.toString();
    }
    return JSON.stringify(val)
}
