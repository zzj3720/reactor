import Runtime from './runtime'
import {Rules} from './rules'
import {ConstraintItem, Rule, RuleObj} from './rule'
import type {Store} from "./store";
import type {History} from "./history";
import {Term, TermType} from "./term";
import {Logical, MetaLogical} from "./logical";
import {Constraint} from "./constraint";
import {isCompare, isLogical, isLogicalOwner, isMetaLogical, isTerm} from "./is";

const No_Value = {};

type Subst = Record<string, unknown>;

export class CHR {
    Store: Store
    History: History
    Rules: Rules
    Helper = Runtime.Helper
    Constraints: Record<string, unknown[]> = {};
    emit: Record<string, (...args: unknown[]) => void> = {};
    functors: Record<string, unknown[]> = {};

    get Functors() {
        return Object.keys(this.Constraints)
    }

    constructor(opts?: {
        store?: Store;
        history?: History;
        rules?: Rules;
    }) {
        opts = opts || {}
        opts.store = opts.store || new Runtime.Store()
        opts.history = opts.history || new Runtime.History()
        opts.rules = opts.rules || new Rules(this)


        this.Store = opts.store
        this.History = opts.history
        this.Rules = opts.rules
        this.Helper = Runtime.Helper
    }

    init(rules: RuleObj[]) {
        rules.forEach((rule) => {
            this.Rules.Add(rule)
        })
    }

    argsMatch(subst: Subst, ptn: ConstraintItem, arg: Constraint) {
        try {
            const result = this.zipWhileTrue(ptn.parameters, arg.args, (a, b) => {
                return this.ptnMatchAny(subst, a, b)
            });
            return result
        } catch (e) {
            console.error(e);
            throw e;
        }
    }

    ptnMatchAny(subst: Subst, a: unknown, b: unknown): boolean {
        if (isMetaLogical(a)) {
            const name = a.name();
            if (name in subst) {
                return this.matchAny(subst[name], b)
            } else {
                subst[name] = b;
                // this.variable(subst,a);
                return true;
            }
        }
        if (isTerm(a)) {
            if (a.is(TermType.Ref)) {
                return this.ptnMatchAny(subst, this.resolve(a), b);
            } else {
                return this.ptnMatchTerm(subst, a, b);
            }
        }
        if (isLogical(b)) {
            return this.ptnMatchAny(subst, a, this.resolve(b));
        }
        if (isCompare(a)) {
            return a.equal(b)
        }
        return a === b;
    }

    ptnMatchTerm(subst: Subst, ptn: Term, trg: unknown): boolean {
        const trgval = this.resolve(trg)
        if (!(isTerm(trgval))) return false

        if (ptn.is(TermType.Var)) return this.ptnMatchAny(subst, ptn.get().symbol(), trgval)

        if (!this.ptnMatchAny(subst, ptn.get().symbol(), trgval.symbol())) return false

        // FIXME: reversing the order of arguments leads to infinite cycle
        // Example: two terms of the form f(... V_1 ...) and f(... V_2 ...) where
        // V_1 is bound to g(... W_1 ...), V_2 -> g(... W_2 ...), W_1 -> f(... V_1 ...), and W_2 -> f(... V_2 ...)
        return this.zipWhileTrue(ptn.get().args(), trgval.args(), (ptnarg, trgarg) => {
            return this.ptnMatchAny(subst, ptnarg, trgarg)
        })
    }

    zipWhileTrue(first: unknown[], second: unknown[], f: (a: unknown, b: unknown) => boolean) {
        const length = Math.min(first.length, second.length);
        for (let i = 0; i < length; i++) {
            const a = first[i]
            const b = second[i]
            if (!f(a, b)) {
                return false;
            }
        }
        return true;
    }

    resolve(a: unknown): unknown {
        if (isLogicalOwner(a)) {
            return a.logical().isBound() ? this.resolve(a.logical()) : a;
        }
        if (isLogical(a)) {
            return a.isBound() ? a.find().value() : No_Value;
        }
        if (isTerm(a)) {
            return a.is(TermType.Ref) ? this.resolve(a.get()) : a;
        }
        return a;
    }

    matchAny(a: unknown, b: unknown): boolean {
        if (isLogical(a)) {
            return this.matchLogical(a.find(), b)
        }
        if (isTerm(a)) {
            if (a.is(TermType.Ref)) {
                this.matchAny(this.resolve(a), b);
            }
            return this.matchTerm(a, b);
        }
        if (isLogical(b)) {
            return this.matchAny(a, this.resolve(b));
        }
        if (isCompare(a)) {
            return a.equal(b);
        }
        return a === b;
    }

    matchTerm(a: Term, b: unknown) {
        const rb = this.resolve(b);
        if (!(isTerm(rb))) {
            return false;
        }
        if (!this.matchAny(a.get().symbol(), rb.symbol())) return false

        // FIXME: reversing the order of arguments leads to infinite cycle
        // Example: two terms of the form f(... V_1 ...) and f(... V_2 ...) where
        // V_1 is bound to g(... W_1 ...), V_2 -> g(... W_2 ...), W_1 -> f(... V_1 ...), and W_2 -> f(... V_2 ...)
        return this.zipWhileTrue(a.get().args(), rb.args(), (larg, rarg) =>
            this.matchAny(larg, rarg))
    }

    matchLogical(a: Logical, b: unknown): boolean {
        if (isLogical(b)) {
            if (a.isBound()) {
                return this.matchAny(a.find().value(), this.resolve(b));
            }
            return a.find() === b.find();
        }
        if (a.isBound()) {
            return this.matchAny(a.find().value(), b);
        }
        return false
    }

    instantiateArguments(subst: Subst, args: unknown[]) {
        const result = args.map(v => {
            if (isMetaLogical(v)) {
                return this.variable(subst, v)
            }
            return v;
        });
        // console.log(`zuozijian src/reactor/index.ts:175`,result)
        return result
    }

    variable(subst: Subst, metaLogic: MetaLogical): Logical {
        const name = metaLogic.name();
        let v = subst[name];
        if (isLogical(v)) {
            return v;
        }
        if (isLogicalOwner(v)) {
            return v.logical();
        }
        const logic = new Logical(metaLogic, v)
        subst[name] = logic;
        return logic;
    }


    static Constraint = Runtime.Constraint
    static Store = Runtime.Store
    static History = Runtime.History
    static Rule = Rule

    static version = '__VERSION__'


}
