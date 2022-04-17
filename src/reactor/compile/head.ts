import type {RuleObj} from "../rule";

export class Compiler {
    rule: RuleObj;

    constructor(rule: RuleObj) {
        this.rule = rule
    }

    get selfName() {
        return 'self';
    }

    get defineSelf() {
        return `var ${this.selfName} = this;`
    }

    get history() {
        return `${this.selfName}.History`
    }

    get helper() {
        return `${this.selfName}.Helper`
    }

    get argsMatch() {
        return `${this.selfName}.argsMatch`
    }

    get instantiateArguments() {
        return `${this.selfName}.instantiateArguments`
    }

    headNo(headNo: number) {
        const rule = this.rule

        if (!rule.head[headNo]) {
            throw new Error('No constraint with number ' + headNo + ' in this rule head')
        }

        const constraint = rule.head[headNo]
        if (constraint.type !== 'Constraint') {
            throw new Error('No constraint at number ' + headNo)
        }

        let parts: string[] = []
        let level = 0

        parts.push(this.defineSelf)
        parts.push(`var subst = {};`)

        if (constraint.arity > 0) {
            parts.push(`if(!${this.argsMatch}(subst,rule.head[${headNo}],constraint))return Promise.resolve();`)
        }

        // start:def_constraintIds
        parts.push(
            `var constraintIds = [${
                rule.head.map(function (head, headIndex) {
                    if (headIndex === headNo) {
                        return '[ constraint.id ]'
                    } else {
                        return 'self.Store.lookup("' + head.name + '", ' + head.arity + ')'
                    }
                }).join(',')
            }];`
        )
        // end:def_constraintIds

        // start:return_promise
        parts.push(`return new Promise(function (resolve, reject) {`)

        // start:def_iterator
        parts.push(
            this.helper + '.forEach(constraintIds, function iterateConstraint (ids, callback) {'
        )
        parts.push(this.testAllAlive());
        parts.push(this.testRuleFired());
        parts.push(this.matchOtherConstraints(headNo));
        parts.push(this.generateGuardPromisesArray())

        parts.push(`Promise.resolve().then(function () {${this.history}.add("${rule.name}", ids);`)
        for (let k = rule.r + 1; k <= rule.head.length; k++) {
            // remove constraints
            parts.push('self.Store.kill(ids[' + (k - 1) + ']);')
        }
        // start:tells
        if (rule.body.length > 0) {
            parts.push(this.generateTellPromises().join(''))
        } else {
            parts.push('callback();')
        }
        // end: tells
        if (rule.guard && rule.guard.length > 0) {
            level -= 1
            parts.push(
                '})',
                '.catch(function () {',
                ' callback();',
                '})'
            )
        }
        // end:guards_promises

        level -= 1
        parts.push(
            '}, resolve)'
        )
        // end:def_iterator

        level -= 1
        parts.push('})')
        // end:return_promise

        return parts
    }

    testAllAlive() {
        return `if (!self.Store.allAlive(ids))return callback();`
    }

    testRuleFired() {
        return `if (${this.history}.has("${this.rule.name}", ids))return callback();`
    }

    matchOtherConstraints(headNo: number) {
        const headMatches = this.rule.head.map((head, headIndex) => {
            if (headIndex === headNo) {
                return ''
            }
            if (head.arity > 0) {
                return `if(!${this.argsMatch}(localSubst,rule.head[${headIndex}],self.Store.find(ids[${headIndex}])))return callback();`
            }
        })
        return `var localSubst = {...subst};${headMatches.join('')}`
    }

    generateGuardPromisesArray() {
        return this.rule.guard.map((guard, guardIndex) => {
            const guardExp = `rule.guard[${guardIndex}]`
            return `if(!${guardExp}.fn(...${this.instantiateArguments}(localSubst,${guardExp}.args)))return callback();`
        }).join('')
    }

    generateTellPromises() {
        let parts: string[] = []

        parts.push('Promise.resolve()')

        this.rule.body.forEach((body, bodyIndex) => {
            if (body.type === 'Constraint' && body.name === 'true' && body.arity === 0) {
                return
            }
            parts.push('.then(function () {')
            if (body.type === 'Predicate') {
                const bodyExp = `rule.body[${bodyIndex}]`
                parts.push(`${bodyExp}.fn(...${this.instantiateArguments}(localSubst,${bodyExp}.args))`)
            }
            if (body.type === 'Constraint') {
                let expr = `return self.emit.${body.name}(...${this.instantiateArguments}(localSubst,rule.body[${bodyIndex}].parameters))`
                parts.push(expr)
            }
            parts.push('})')
        })
        parts.push(`.then(function(){callback()}).catch(function(){reject()})`)

        return parts
    }
}

