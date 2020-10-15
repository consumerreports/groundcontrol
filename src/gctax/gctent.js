"use strict";

function Gctent({desc = ""} = {}) {
    this.desc = desc;
    this.vecs = [];
}

// Add a Gcvec to this Gctent, return the new length of vecs
Gctent.prototype.add = function(vec) {
    return this.vecs.push(vec);
}

Gctent.prototype.get_vecs = function() {
    return [...this.vecs];
}

// TODO: I guess we want a delete function that slices out a Gcvec by reference

module.exports = Gctent;
