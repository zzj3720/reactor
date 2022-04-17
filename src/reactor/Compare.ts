import {_isCompare} from "./is";

export interface Compare {
    [_isCompare]: true;

    equal(other: unknown): boolean;
}
