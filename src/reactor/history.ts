export class History {
    // _history: Record<string, string[]> = {}
    _set: Record<string, Set<string>> = {};

    add(rule: string, ids: string[]) {
        if (typeof this._set[rule] === 'undefined') {
            // this._history[rule] = []
            this._set[rule] = new Set()
        }

        const str = hash(ids)
        // this._history[rule].push(str)
        this._set[rule].add(str)
        return this;
    }

    notIn(rule: string, ids: string[]) {
        return !this.has(rule, ids)
    }

    has(rule: string, ids: string[]) {
        if (typeof this._set[rule] === 'undefined') {
            return false
        }

        const str = hash(ids)
        return this._set[rule].has(str)
    }
}

const hash = (ids: string[]) => {
    return ids.join('_')
}
