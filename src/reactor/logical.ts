import {_isLogical, _isLogicalOwner, _isMetaLogical} from "./is";

export class MetaLogical<T = unknown> {
    [_isMetaLogical] = true as const;
    _name: string;

    constructor(name: string) {
        this._name = name;
    }

    name() {
        return this._name
    }
}

export interface LogicalOwner {
    logical(): Logical;

    [_isLogicalOwner]: true;
}

export class Logical<T = unknown> {
    [_isLogical] = true as const;
    static lastIdx = 0;
    metaLogical: MetaLogical<T>;
    _name: string;
    _value?: T;
    _parent?: Logical<T>;
    _rank: number = 0;

    constructor(metaLogical: MetaLogical<T>, value?: T) {
        this.metaLogical = metaLogical
        this._name = `${metaLogical.name()}_${++Logical.lastIdx}`
        this._value = value;
    }

    value(): T | undefined {
        return this._value
    }

    get(): T {
        return this.find().value()!;
    }

    getOrNull(): T | undefined {
        return this.find().value();
    }

    set(value: T) {
        this.find().setValue(value);
    }

    name(): string {
        return this._name;
    }

    isBound() {
        return this.find().value() !== undefined;
    }

    find(): Logical<T> {
        const tmp = this._parent
        if (tmp == null) return this
        else {
            const root = tmp.find()
            this._parent = root
            return root
        }
    }

    union(other: Logical<T>, reconciler: (a: T, b: T) => void) {
        const thisRepr = this.find()
        const otherRepr = other.find()

        if (thisRepr === otherRepr) {
            // nothing to do
            return
        }

        // invariant: thisRepr.rank > otherRepr.rank
        if (thisRepr.rank() < otherRepr.rank()) {
            otherRepr.union(thisRepr, reconciler)
            return

        } else if (thisRepr.rank() == otherRepr.rank()) {
            if (thisRepr._value == null && otherRepr._value != null) {
                otherRepr.union(thisRepr, reconciler)
                return

            } else {
                thisRepr.incRank()

            }
        }

        const thisVal = thisRepr.value()
        const otherVal = otherRepr.value()

        // first copy the value
        if (thisVal == null && otherVal != null) {
            // var ground
            thisRepr.setValue(otherVal);
            // TODO: clear the value in the "other" logical after union

        } else if (thisVal != null && otherVal == null) {
            // ground var
            // TODO: no need to copy the value
            otherRepr.setValue(thisVal);
        }

        // then set parent
        otherRepr.setParent(thisRepr)
        // thisRepr.mergeParentObservers(otherRepr)

        // last, reconcile the values/merge observers
        if (thisVal == null && otherVal == null) {
            // var var
            // thisRepr.mergeValueObservers(otherRepr);

        } else if (thisVal != null && otherVal != null) {
            // ground ground
            reconciler(thisVal, otherVal)
        }

        // copy usages
        // thisRepr.usagesCount += otherRepr.usagesCount
    }

    rank() {
        return this._rank
    }

    private incRank() {
        this._rank++;
    }

    private setValue(otherVal: T) {
        this._value = otherVal;
    }

    private setParent(thisRepr: Logical<T>) {
        this._parent = thisRepr;
    }

    toString(): string {
        return this._parent != null ? `${this.name()}(^${this._parent.toString()})` : `${this.name()}:${this.value()}`
    }
}
