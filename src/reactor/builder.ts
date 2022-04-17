import {BodyItem, ConstraintItem, ConstraintParam, GuardItem, PredicateItem, RuleObj} from "./rule";
import {Logical, MetaLogical} from "./logical";

export const ConstBuilder = (...names: string[]) => names.map(name => (...args: ConstraintParam[]): ConstraintItem => {
        return {
            type: 'Constraint',
            name,
            parameters: args,
            arity: args.length,
            functor: `${name}/${args.length}`
        }
    }
)
export const createMetaLogical = <T extends unknown[]>(...names: string[]): { [K in keyof T]: MetaLogical<T[K]> } => {
    return names.map(name => new MetaLogical(name)) as any
}
export const exp = <T extends unknown[]>(args: { [K in keyof T]: MetaLogical<T[K]> }, fn: (...args: { [K in keyof T]: Logical<T[K]> }) => boolean): PredicateItem => {
    return {
        type: 'Predicate',
        fn: fn as any,
        args
    }
}
export const statement = <T extends unknown[]>(args: { [K in keyof T]: MetaLogical<T[K]> }, fn: (...args: { [K in keyof T]: Logical<T[K]> }) => void): PredicateItem => {
    return exp(args, (...args) => {
        fn(...args as any);
        return true;
    })
}
export const rule = (ops: {
    name: string;
    kept?: ConstraintItem[];
    removed?: ConstraintItem[];
    guard?: GuardItem[];
    body?: BodyItem[];
}): RuleObj => {
    const head = [...ops.kept ?? [], ...ops.removed ?? []]
    return {
        type: 'PropagationRule',
        name: ops.name,
        head,
        body: ops.body ?? [],
        guard: ops.guard ?? [],
        constraints: [...new Set(head.map(v => v.functor))],
        r: ops.kept?.length ?? 0,
    }
}
