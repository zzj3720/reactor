import {Logical, LogicalOwner} from "./logical";
import {_isLogicalOwner, _isTerm} from "./is";

export const TermType = {
    Var: 'Var',
    Fun: 'Fun',
    Ref: 'Ref'
} as const;
export type TermType = typeof TermType;

export abstract class Term {
    [_isTerm] = true as const

    abstract is(type: TermType[keyof TermType]): boolean

    abstract symbol(): unknown

    args(): Term[] {
        return []
    }

    abstract get(): Term

}

export class FunTerm extends Term {
    _symbol: unknown;
    _args: Term[];

    constructor(_symbol: unknown, ...args: Term[]) {
        super();
        this._symbol = _symbol;
        this._args = args
    }

    get(): Term {
        return this;
    }


    symbol(): unknown {
        return this._symbol;
    }

    is(type: TermType[keyof TermType]): boolean {
        return type === TermType.Fun;
    }
}

export class LogicalVarTerm extends Term implements LogicalOwner {
    _logical: Logical<Term>

    constructor(logical: Logical<Term>) {
        super();
        this._logical = logical;
    }

    get(): Term {
        if (this._logical.isBound()) {
            return this._logical.find().value()!;

        } else {
            return this;
        }
    }

    is(type: TermType[keyof TermType]): boolean {
        if (this._logical.isBound()) {
            return type === TermType.Ref;
        } else {
            return type === TermType.Var;
        }
    }

    logical(): Logical<Term> {
        return this._logical;
    }

    symbol(): unknown {
        return undefined;
    }

    [_isLogicalOwner] = true as const;
}

export const lit = (value: boolean | string | number | null | undefined): Term => new FunTerm(value)
