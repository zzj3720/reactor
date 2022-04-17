import {History} from "./history";
import {Store} from "./store";
import {Constraint} from "./constraint";
import {dynamicCaller} from "./dynamic-caller";

const Helper = {
    allDifferent: allDifferent,
    dynamicCaller: dynamicCaller,
    forEach: forEach
}
export default {
    History,
    Store,
    Constraint,
    Helper
}

function allDifferent(arr: string[]) {
    return arr.every(function (el1, ix) {
        return arr.slice(ix + 1).every(function (el2) {
            return el1 != el2 // eslint-disable-line eqeqeq
        })
    })
}

function forEach(arr: string[][], iterator: (arr: string[], next: () => void) => void, onEnd: () => void) {
    const indexes = Array.apply(null, Array(arr.length)).map(Number.prototype.valueOf, 0)
    forEachOnIndex(arr, indexes, iterator, onEnd)
}

function forEachOnIndex(arr: string[][], indexes: number[], iterator: (arr: string[], next: () => void) => void, onEnd: () => void) {
    let iterablePosition = -1
    const values = []
    let value
    let ix

    let disjoint = true
    for (let position = 0; position < indexes.length; position++) {
        ix = indexes[position]

        if (typeof arr[position][ix] === 'undefined') {
            return onEnd()
        }
        value = arr[position][ix].toString()

        if (ix < arr[position].length - 1) {
            iterablePosition = position
        }

        if (values.indexOf(value) >= 0) {
            disjoint = false
            break
        }

        values.push(value)
    }

    function next() {
        if (iterablePosition === -1) {
            return onEnd()
        }

        // calculate next indexes
        if (iterablePosition > -1) {
            indexes[iterablePosition] += 1
            for (let ix = iterablePosition + 1; ix < indexes.length; ix++) {
                indexes[ix] = 0
            }
        }

        forEachOnIndex(arr, indexes, iterator, onEnd)
    }

    if (!disjoint) {
        return next()
    }
    try {
        iterator(values, next)
    } catch (e) {
        console.error(e)
        throw e
    }
}
