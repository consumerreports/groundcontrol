"use strict";

const gc = require("../gcapp/gcapp_config.js");

// You probably shouldn't call this directly - prefer the Gcapp convenience wrapper
function get_vector_names() {
    return Object.keys(gc.VECTORS);
}

// You probably shouldn't call this directly - prefer the Gcapp convenience wrapper
// Get the intersection of the sets of vectors for list of Gctent objects 'tents' 
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
