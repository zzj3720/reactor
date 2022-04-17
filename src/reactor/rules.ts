import {dynamicCaller} from './dynamic-caller'
import {Rule, RuleObj} from './rule'
import type {CHR} from "./index";

export class Rules {
    _chr: CHR
    Order: string[]
    rules: Record<string, Rule> = {}

    constructor(chr: CHR) {
        this._chr = chr
        this.Order = []
    }

    Add(ruleObj: RuleObj, globalReplacements: string[]) {
        const self = this

        const rule = new Rule(ruleObj, {
            replacements: globalReplacements,
        })
        const ruleName = rule.Name

        if (typeof this.rules[ruleName] !== 'undefined') {
            throw new Error('Rule with name "' + ruleName + '" multiple times specified')
        }

        this.rules[ruleName] = rule
        this.Order.push(rule.Name)

        let constraintName
        ruleObj.constraints.forEach(functor => {
            // add callers if not present
            constraintName = functor.split('/')[0]
            if (!self._chr.emit[constraintName]) {
                self._chr.emit[constraintName] = dynamicCaller(constraintName).bind(self._chr)
            }

            if (!self._chr.functors[functor]) {
                self._chr.Constraints[functor] = []
            }
        })

        ruleObj.head.forEach(function (constraint) {
            self._chr.Constraints[constraint.functor].push(ruleName)
        })
    }

    Reset() {
        const self = this
        const chr = this._chr

        let constraintName
        for (const functor in chr.Constraints) {
            constraintName = functor.split('/')[0]
            if (typeof chr.emit[constraintName] !== 'undefined') {
                delete chr.emit[constraintName]
            }
        }
        chr.Constraints = {}

        this.ForEach(rule => {
            delete self.rules[rule.Name]
        })
        this.Order = []
    }

    ForEach(callback: (rule: Rule) => void, thisArg?: unknown) {
        const self = this

        this.Order.forEach(ruleName => {
            callback.call(thisArg, self.rules[ruleName])
        })
    }

    SetBreakpoints(f?: () => void) {
        this.ForEach(function (rule) {
            rule.Breakpoints.onTry = f
            rule.ForEach(function (occurrences) {
                occurrences.forEach(function (occurrence) {
                    occurrence.onTry = f
                })
            })
        })
    }

    RemoveBreakpoints() {
        this.SetBreakpoints(undefined)
    }
}
