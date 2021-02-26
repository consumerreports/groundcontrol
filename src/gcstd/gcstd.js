/** 
* Standards and standards-related functionality
* @namespace gcstd
*/

"use strict";

/**
* Get all the keys corresponding to nonscalar values in a standard (as defined by its schema).
* You probably shouldn't call this directly - prefer {@link module:gcapp~Gcapp.get_nonscalar_keys}
* @param {Object} val - a standard schema in jsonschema format
* @returns {Array} a list of keys
* @memberof gcstd
*/
function get_nonscalar_keys(val, key = null, data = []) {
    const objkeys = Object.keys(val);

    objkeys.forEach((objkey) => {
        if (typeof val[objkey] === "object") {
            data = get_nonscalar_keys(val[objkey], objkey, data);
        }

        if (objkey === "type" && val.type === "array") {
            data.push(key);
        }
    });

    return data;
}

module.exports.get_nonscalar_keys = get_nonscalar_keys;
