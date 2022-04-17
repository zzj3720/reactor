import {EventEmitter} from "events";
import Table from "easy-table";
import {Constraint} from "./constraint";

export class Store {
    _lastId = 0
    _store: Record<string, Constraint> = {}
    _index: Record<string, Record<string, Record<string, unknown>>> = {}
    length = 0
    invalid = false
    event = new EventEmitter()

    reset() {
        this._lastId = 0
        this._store = {}
        this._index = {}
        this.length = 0

        this.invalid = false
    }

    store(constraint: Constraint) {
        const id = this._getNewConstraintId()
        constraint.id = id
        this._store[id] = constraint
        this._addToIndex(constraint)
        this.length += 1
        this.event.emit('add', constraint)
        return id
    }

    add(constraint: Constraint) {
        this.store(constraint)
    }

    kill(id: number) {
        const constraint = this._store[id]
        if (!constraint) {
            return
        }

        constraint.alive = false
        delete this._store[id]
        delete this._index[constraint.name][constraint.arity][constraint.id]
        this.length -= 1

        this.event.emit('remove', constraint)
    }

    _getNewConstraintId() {
        this._lastId += 1
        return this._lastId
    }

    _addToIndex(constraint: Constraint) {
        const index = this._index
        if (typeof index[constraint.name] === 'undefined') {
            index[constraint.name] = {}
        }
        if (typeof index[constraint.name][constraint.arity] === 'undefined') {
            index[constraint.name][constraint.arity] = {}
        }

        index[constraint.name][constraint.arity][constraint.id] = true
    }

    alive(id: number) {
        if (!this._store[id]) {
            return false
        }

        return this._store[id].alive
    }

    allAlive(arr: number[]) {
        return arr.every(this.alive.bind(this))
    }

    args(id: number) {
        return this._store[id].args
    }

    find(id: number) {
        return this._store[id]
    }

    lookup(name: string, arity: number) {
        const index = this._index

        if (typeof index[name] !== 'undefined' &&
            typeof index[name][arity] !== 'undefined') {
            return Object.keys(index[name][arity])
        }

        return []
    }

    invalidate() {
        this.reset()
        this.invalid = true
    }

    forEach(cb: (constraint: Constraint, id: string) => void) {
        for (const id in this._store) {
            cb(this._store[id], id)
        }
    }

    map<P>(callback: (constraint: Constraint, id: string, self: this) => P, thisArg?: unknown): P[] {
        const res: P[] = []
        for (const id in this._store) {
            res.push(callback.call(thisArg, this._store[id], id, this))
        }
        return res
    }

    toString() {
        if (this.length === 0) {
            return '(empty)'
        }

        const t = new Table()

        this.forEach(function (constraint) {
            t.cell('ID', constraint.id)
            t.cell('Constraint', constraint.toString())
            t.newRow()
        })

        return t.toString()
    }

}








