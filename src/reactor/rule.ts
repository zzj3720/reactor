import {v1 as uuid} from "uuid";
import {Compiler} from "./compile/head";
import type {CHR} from "./index";
import type {Term} from "./term";
import {Logical, MetaLogical} from "./logical";

export type HeadItem = ConstraintItem;
export type GuardItem = PredicateItem;
export type BodyItem = ConstraintItem | PredicateItem
export type ConstraintParam = Term | MetaLogical | Logical | number | string | boolean | object | null | undefined;
export type ConstraintItem = {
    type: 'Constraint';
    parameters: ConstraintParam[];
    name: string;
    functor: string;
    arity: number;
}
export type PredicateItem = {
    type: 'Predicate';
    fn: (...ars: Logical[]) => boolean;
    args: MetaLogical[];
}
export type RuleObj = {
    type: 'PropagationRule',
    head: HeadItem[];
    name?: string
    guard: GuardItem[]
    body: BodyItem[]
    constraints: string[]
    r: number;
};
export  type OnTry = () => void
export type FunctorFn = Function & {
    onTry?: OnTry;
}

export class Rule {
    _source: RuleObj;
    Name: string;
    functors: Record<string, FunctorFn[]> = {}
    Breakpoints: { onTry?: OnTry } = {
        onTry: undefined
    }

    constructor(ruleObj: RuleObj, opts?: {
        breakpoints?: boolean;
    }) {
        if (typeof ruleObj.name === 'undefined') {
            ruleObj.name = '_' + uuid()
        }

        opts = opts || {}
        opts.breakpoints = opts.breakpoints || false

        this._source = ruleObj

        this.Name = ruleObj.name

        this.Breakpoints = {
            onTry: undefined
        }

        this._compile(ruleObj)
    }

    _compile(ruleObj: RuleObj) {
        const self = this

        let head
        let compiled

        const headCompiler = new Compiler(ruleObj)

        for (let headNo = ruleObj.head.length - 1; headNo >= 0; headNo--) {
            head = ruleObj.head[headNo]

            compiled = headCompiler.headNo(headNo).map(function (row) {
                return '  ' + row
            }).join('\n')

            this._addConstraintCaller(head.functor, compiled, ruleObj)
        }
    }

    _addConstraintCaller(functor: string, compiled: string, rule: RuleObj) {
        // create a new function with a single parameter "constraint"
        let compiledFunction: Function | undefined = undefined;
        try {
            compiledFunction = new Function('constraint', 'rule', compiled)
        } catch (e) {
            console.log('Compiled source:')
            console.log(compiled)
            throw e
        }

        if (!this.functors[functor]) {
            this.functors[functor] = []
        }

        this.functors[functor].push(compiledFunction)
    }

    ForEach(callback: (functor: FunctorFn[]) => void, thisArg?: unknown) {
        const self = this

        for (const functor in self.functors) {
            if (!functor.match(/^[a-z]/)) {
                continue
            }

            callback.call(thisArg, self.functors[functor])
        }
    }

    Fire(chr: CHR, constraint: { functor: string }) {
        const self = this
        return Promise.resolve().then(callback2Promise(this.Breakpoints.onTry, {
            event: 'rule:try',
            rule: self.Name,
            constraint: constraint
        })).then(function () {
            const occurrences = self.functors[constraint.functor].length - 1
            return self.functors[constraint.functor].reduce(function (promise, occurrence, ix) {
                return promise.then(callback2Promise(occurrence.onTry, {
                    event: 'rule:try-occurrence',
                    rule: self.Name,
                    occurrence: occurrences - ix,
                    constraint: constraint,
                })).then(function () {
                    return occurrence.call(chr, constraint, self._source)
                })
            }, Promise.resolve())
        })
    }
}


function callback2Promise(this: unknown, f?: (...args: unknown[]) => unknown, ...args: unknown[]) {
    if (!f) {
        return function () {
            return Promise.resolve()
        }
    }

    const self = this
    return function () {
        return new Promise(function (resolve) {
            f.apply(self, [...args, resolve])
        })
    }
}
