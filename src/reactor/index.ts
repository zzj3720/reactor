type Predicate = {
    args: any[]
    ask: (...args: any[]) => boolean;
    tell: (...args: any[]) => boolean
}
type Constraint = {
    id: string;
    args: any[];
    toString(): string;
}
type BodyItem = Predicate | Constraint
const metaLogicalSymbol = Symbol('metaLogical');
type MetaLogical = {
    [metaLogicalSymbol]: true;
    name: string;
    getLogical(): Logical
}
const MetaLogical = {
    isMetaLogical(v: any): v is MetaLogical {
        return v[metaLogicalSymbol];
    }
}
const logicalSymbol = Symbol('logical')
type Logical = {
    [logicalSymbol]: true;
    name: string;
    get(): any,
    set(v: any): void;
    union(other: Logical): void;
    toString(): string;
}
const Logical = {
    isLogical(v: any): v is Logical {
        return v[logicalSymbol]
    }
}
type Rule = {
    name: string;
    keptList: Constraint[];
    replaceList: Constraint[];
    guardList: Predicate[];
    bodyList: BodyItem[]
}
type Result = {}
type LogicalStore = {
    variable(metaLogical: MetaLogical): Logical
};
const createLogicalStore = (): LogicalStore => {
    const map = new Map<MetaLogical, Logical>();
    return {
        variable(metaLogical: MetaLogical): Logical {
            if (map.has(metaLogical)) {
                return map.get(metaLogical)!
            }
            const logical = metaLogical.getLogical();
            map.set(metaLogical, logical)
            return logical
        }
    }
}
const rule = (ops: {
    name: string;
    headKept: Constraint[];
    headReplace: Constraint[];
    guard: Predicate[];
    body: BodyItem[];
}): Rule => {
    return {
        name: ops.name,
        keptList: ops.headKept,
        replaceList: ops.headReplace,
        guardList: ops.guard,
        bodyList: ops.body,
    }
}
const constraint = (id: string, ...args: any[]): Constraint => {
    return {
        id,
        args,
        toString(): string {
            return `${id}(${args.join(',')})`
        }
    }
}
const expression = <Args extends MetaLogical[]>(args: Args, block: (...args: { [K in keyof Args]: Logical }) => boolean): Predicate => {
    return {
        args,
        tell: (args) => {
            return block(...args)
        },
        ask: (args) => {
            return block(...args)
        },
    }
}
const statement = <Args extends MetaLogical[]>(args: Args, block: (...args: { [K in keyof Args]: Logical }) => void): Predicate => {
    return expression(args, (...args) => {
        block(...args);
        return true;
    })
}
const createMetaLogical = (name: string): MetaLogical => {
    let i = 0;
    return {
        [metaLogicalSymbol]: true,
        name,
        getLogical(): Logical {
            i++;
            return createLogical(name + '_' + i)
        }
    }
}
const createLogical = (name: string): Logical => {
    let value: any;
    return {
        [logicalSymbol]: true,
        name,
        union(other: Logical) {

        },
        get(): any {
            return value;
        },
        set(v: any) {
            value = v;
        },
        toString() {
            return `${name}@${value ?? null}`
        }
    }
}
const metaLogical = <Args extends string[]>(...args: Args): { [K in Args[number]]: MetaLogical } => {
    return args.reduce((acc, v) => {
        acc[v] = createMetaLogical(v);
        return acc;
    }, {} as any)
}
const matchHead = (head: Constraint[], list: Constraint[]) => {
    const run = (i: number, rest: Constraint[]): Constraint[][] => {
        if (i === head.length) {
            return [[]]
        }
        const currentHead = head[i];
        const result: Constraint[][] = [];
        for (let j = 0; j < rest.length; j++) {
            const cst = rest[j];
            if (cst.id === currentHead.id) {
                const newRest = [...rest]
                newRest.splice(j, 1)
                result.push(...run(i + 1, newRest).map(arr => [cst, ...arr]))
            }
        }
        return result;
    }
    return run(0, list);
}
const variableArgs = (args: any[], logicalStore: LogicalStore) => {
    return args.map(v => {
        if (MetaLogical.isMetaLogical(v)) {
            return logicalStore.variable(v);
        }
        return v;
    })
}
const runRules = (rules: Rule[]): Constraint[] => {
    const globalStore = new Set<Constraint>();
    const activate = (cst: Constraint) => {
        console.log(`+`, cst.toString())
        globalStore.add(cst);
        for (const rule of rules) {
            const head = [...rule.keptList, ...rule.replaceList];
            const matches = matchHead(head, [...globalStore]);
            for (const match of matches) {
                if (match.length !== head.length) {
                    continue;
                }
                const logicalStore: LogicalStore = createLogicalStore();
                match.forEach((v, i) => {
                    v.args.forEach((matchV, j) => {
                        const headV = logicalStore.variable(head[i].args[j]);
                        if (Logical.isLogical(matchV)) {
                            headV.set(matchV.get());
                        } else {
                            headV.set(matchV)
                        }
                    })
                })
                const result = rule.guardList.every(v => v.ask(variableArgs(v.args, logicalStore)))
                if (!result) {
                    continue;
                }
                console.log(`match ${rule.name}`, match.map(v => `${v.id}(${v.args.join(',')})`).join(', '))
                match.slice(rule.keptList.length).forEach(cst => {
                    globalStore.delete(cst)
                    console.log(`-`, cst.toString())
                });
                for (const body of rule.bodyList) {
                    if ('id' in body) {
                        activate(constraint(body.id, ...variableArgs(body.args, logicalStore)));
                    } else {
                        body.tell(variableArgs(body.args, logicalStore))
                    }
                }
                break;
            }
        }
    }
    activate(constraint('main'))
    return [...globalStore];
}
const gcd = () => {
    const l = metaLogical("M", "N", "TMP")
    return [
        rule({
            name: 'main',
            headKept: [],
            headReplace: [constraint("main")],
            guard: [],
            body: [
                statement([l.M, l.N], (m, n) => {
                    m.set(21);
                    n.set(35);
                }),
                constraint('gcd', l.M),
                constraint('gcd', l.N),
            ]
        }),
        rule({
            name: 'trivial',
            headKept: [],
            headReplace: [constraint('gcd', l.M)],
            guard: [expression([l.M], m => m.get() == 0)],
            body: [
                statement([], () => {
                })
            ]
        }),
        rule({
            name: 'step',
            headKept: [constraint('gcd', l.N)],
            headReplace: [constraint('gcd', l.M)],
            guard: [expression([l.M, l.N], (m, n) => {
                return m.get() >= n.get()
            })],
            body: [
                statement([l.M, l.N, l.TMP], (m, n, tmp) => tmp.set(m.get() - n.get())),
                constraint('gcd', l.TMP)
            ]
        })
    ]
}
const prime = () => {
    const l = metaLogical("M", "N")
    return [
        rule({
            name: 'main',
            headKept: [],
            headReplace: [constraint("main")],
            guard: [],
            body: [
                ...Array.from({length: 400}).map((_, i) => {
                    return constraint('prime', i + 2)
                })
            ]
        }),
        rule({
            name: 'prime',
            headKept: [constraint('prime', l.M)],
            headReplace: [constraint('prime', l.N)],
            guard: [expression([l.M, l.N], (m, n) => n.get() % m.get() === 0)],
            body: [
                statement([], () => {
                })
            ]
        }),
    ]
}
export const main = () => {
    const rules = prime();
    const result = runRules(rules)
    console.log(`result`, result.join(','))
}
