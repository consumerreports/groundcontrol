"use strict";

// You probably shouldn't call this function directly - prefer the gcapp convenience wrapper
// Get all the keys for nonscalar parts of a standard, as defined by its schema in jsonschema format 
// Hypothesis: the "meaningful" parts of a standard are described by the keys which map to its nonscalar values.
// Put another way, the elements of nonscalar parts of a standard are likely to comprise the hierarchically
// structured evaluation information that you would need to thoroughly understand a given test.
// Conversely, the scalar values in a standard are likely to represent metadata, like labels and category names.
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
