import {CHR} from "./reactor";
import {ConstBuilder, createMetaLogical, exp, rule, statement} from "./reactor/builder";
import {FunTerm, lit, LogicalVarTerm, Term} from "./reactor/term";
import {MetaLogical} from "./reactor/logical";
import {RuleObj} from "./reactor/rule";
import {_isCompare} from "./reactor/is";
import {Compare} from "./reactor/Compare";

const chr = new CHR()
const stringType = (value: string) => new FunTerm(Symbol.for('string'), lit(value));
const numberType = (value: string) => new FunTerm(Symbol.for('number'), lit(value));
const booleanType = (value: string) => new FunTerm(Symbol.for('boolean'), lit(value));
const arrayType = (item: Term) => new FunTerm(Symbol.for('array'), item);
const objectType = (properties: Term[]) => new FunTerm(Symbol.for('object'), ...properties);
const propertyType = (name: string, value: Term) => new FunTerm(Symbol.for('property'), lit(name), value);
const logicalTerm = (metaLogical: MetaLogical) => new LogicalVarTerm(metaLogical)
const assign = (name: unknown, value: unknown) => ({
    type: 'assign',
    name,
    value,
})
const statements = (list: unknown[]) => ({
    type: 'statements',
    list,
})
const lit = (value: string | number | boolean) => ({
    type: typeof value,
    value,
})
const ref = (name: string) => ({
    type: 'ref',
    name,
})
const name = (name: string) => ({
    type: 'id',
    name,
})
// const dot = ()
const n = name('asd');
const scope = {
    'asd': n
}
const program = statements([
    assign(n, lit(123)),
    ref('asd')
])
const match = (name: string, f: () => RuleObj[]): RuleObj[] => {
    return f()
}
const [nodeConst] = ConstBuilder('node')
const node = (p: (v: { type: string }) => boolean) => {
    return nodeConst({
        [_isCompare]: true, equal(other) {
            if (!other || typeof other !== 'object' || !('type' in other)) {
                return false;
            }
            return p(other as any)
        }
    } as Compare)
}
const type = () => {
    const [M, N] = createMetaLogical<[number, number]>('M', 'N')
    const [typeOf, start] = ConstBuilder('typeOf', 'start')
    return [
        ...match('numberLit', () => {
            const nodeMatch = node(v => v.type === 'boolean')
            return [
                rule({
                    name: 'numberLit',
                    kept: [start()],
                    body: [
                        typeOf()
                    ]
                }),
            ]
        }),
        rule({
            name: 'typeof',
            removed: [typeOf()],
            guard: [exp([M], m => m.get() > 2)],
            body: [
                statement([M, N], (m, n) => {
                    n.set(m.get() - 1)
                }),
                count(N),
                prime(N)
            ]
        }),
        rule({
            name: 'prime',
            kept: [prime(M)],
            removed: [prime(N)],
            guard: [exp([M, N], (m, n) => n.get() % m.get() === 0)],
        })
    ]
}
chr.init(type())
const start = Date.now()
Promise.all([
    chr.emit.count(1000)
]).then(() => {
    console.log(`${Date.now() - start}ms`)
    console.log(chr.Store.toString())
})
