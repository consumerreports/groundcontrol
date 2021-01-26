"use strict";

const Validator = require("jsonschema").Validator;
const v = new Validator();
const gctax = require("./gctax.js");
const gctax_tent_schema = require("./schemas/gctax_tent_schema.js");

// TODO: this will be our in-memory data structure for testable entities
function Gctax_tent({name, notes, vecs = []} = []) {
    this.name = name;
    this.notes = notes;
    this.vecs = vecs;
}

Gctax_tent.is_valid = function(tent) {
    const res = v.validate(tent, gctax_tent_schema);
    return res.errors.length > 0 ? false : true;
}

Gctax_tent.get_unknown_vecs = function(tent) {
    const vec_names = new Set(gctax.get_vector_names());
    
    return tent.vecs.filter((vec) => {
        return !vec_names.has(vec.vec);
    }).map((vec) => {
        return vec.vec;
    });
}

module.exports = Gctax_tent;
