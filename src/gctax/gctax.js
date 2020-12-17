"use strict";

const gc = require("../gcutil/gcconfig.js");

function get_vector_names() {
    return Object.keys(gc.VECTORS);
}

// Get the intersection of the sets of vectors for list of Gctent objects 'tents' 
function get_common_vecs(tents) {
    const vectors = new Map();

    tents.forEach((tent, i) => {
        tent.vecs.forEach((vec) => {
            const qty = vectors.get(vec);
            vectors.set(vec, (qty === undefined ? 0 : qty) + 1);
        });
    });
    
    return Array.from(vectors.entries()).filter(keyval => keyval[1] > 1).map(keyval => keyval[0]);
}

module.exports.get_vector_names = get_vector_names;
module.exports.get_common_vecs = get_common_vecs;
