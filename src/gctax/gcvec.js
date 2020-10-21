"use strict";

function Gcvec({desc = ""} = {}) {
    this.desc = desc;
    this.refs = [];
}

// Add a reference to this Gcvec, return the new length of refs  
Gcvec.prototype.add = function(ref) {
    return this.refs.push(ref);
}

Gcvec.prototype.get_refs = function() {
    return [...this.refs];
}

// TODO: I guess we need a delete function which slices out a by reference

module.exports = Gcvec;
