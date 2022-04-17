import {Logical, LogicalOwner, MetaLogical} from "./logical";
import {Term} from "./term";
import {Compare} from "./Compare";
export const _isLogicalOwner = Symbol('_isLogicalOwner')
export const _isMetaLogical = Symbol('_isMetaLogical')
export const _isLogical = Symbol('_isLogical')
export const _isTerm = Symbol('_isTerm')
export const _isCompare = Symbol('_isCompare')

export const isLogicalOwner = (a: unknown): a is LogicalOwner => {
    return a != null && typeof a === 'object' && _isLogicalOwner in a && (a as any)[_isLogicalOwner] === true;
}
export const isMetaLogical = (a: unknown): a is MetaLogical => {
    return a != null && typeof a === 'object' && _isMetaLogical in a && (a as any)[_isMetaLogical] === true;
}
export const isLogical = (a: unknown): a is Logical => {
    return a != null && typeof a === 'object' && _isLogical in a && (a as any)[_isLogical] === true;
}

export const isTerm = (a: unknown): a is Term => {
    return a != null && typeof a === 'object' && _isTerm in a && (a as any)[_isTerm] === true;
}

export const isCompare = (a: unknown): a is Compare => {
    return a != null && typeof a === 'object' && _isCompare in a && (a as any)[_isCompare] === true;
}
