/**
* Products and product taxonomies
* @namespace gctax
*/

"use strict";

const gc = require("../gcapp/gcapp_config.js");

/**
* Fetch the vocabulary of vector names known to this version of Ground Control.
* You probably shouldn't call this directly - prefer {@link module:gcapp~Gcapp.get_vector_names}
* @returns {Array} a list of vector names
* @memberof gctax
*/
function get_vector_names() {
    return Object.keys(gc.VECTORS);
}

/**
* Compute the intersection of sets of vectors over an array of testable entities.
* You probably shouldn't call this directly - prefer {@link module:gcapp~Gcapp.get_common_vecs}
* @returns {Array} an array representing the set of common vectors
* @memberof gctax
*/
function get_common_vecs(tents) {
    const vectors = new Map();

    tents.forEach((tent, i) => {
        tent.vecs.forEach((vec) => {
            const qty = vectors.get(vec);
            vectors.set(vec, (qty === undefined ? 0 : qty) + 1);
        });
    });
    
    return Array.from(vectors.entries()).filter(keyval => keyval[1] === tents.length).map(keyval => keyval[0]);
}

module.exports.get_vector_names = get_vector_names;
module.exports.get_common_vecs = get_common_vecs;
