import {CHR} from "./reactor";
import {ConstBuilder, createMetaLogical, exp, rule, statement} from "./reactor/builder";

const chr = new CHR()
const prime = () => {
    const [M, N] = createMetaLogical<[number, number]>('M', 'N')
    const [count, prime] = ConstBuilder('count', 'prime')
    return [
        rule({
            name: 'count',
            removed: [count(M)],
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
chr.init(prime())
const start = Date.now()
Promise.all([
    chr.emit.count(1000)
]).then(() => {
    console.log(`${Date.now() - start}ms`)
    console.log(chr.Store.toString())
})
