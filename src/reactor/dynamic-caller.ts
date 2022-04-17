import {Constraint} from "./constraint";
import {CHR} from "./index";
import {Rule} from "./rule";

export const dynamicCaller = function (name: string) {
    return function (this: CHR) {
        const args = Array.prototype.slice.call(arguments)
        const arity = arguments.length
        const functor = name + '/' + arity
        // console.log(`emit`,functor,...args)
        if (typeof this.Constraints[functor] === 'undefined') {
            throw new Error('Constraint ' + functor + ' not defined.')
        }

        const constraint = new Constraint(name, arity, args)
        this.Store.add(constraint)

        const rules: Rule[] = []
        this.Rules.ForEach(function (rule) {
            if (rule.functors[functor]) {
                rules.push(rule)
            }
        })

        const self = this

        return rules.reduce(function (curr, rule) {
            return curr.then(function () {
                return rule.Fire(self, constraint)
            })
        }, Promise.resolve())
    }
};
