"use strict";

const Validator = require("jsonschema").Validator;
const v = new Validator();
const gctax = require("./gctax.js");
const gctent_schema = require("./schemas/gctent_schema.js");

// TODO: this will be our in-memory data structure for testable entities
function Gctent() {

}

Gctent.is_valid = function(tent) {
    const res = v.validate(tent, gctent_schema);
    return res.errors.length > 0 ? false : true;
}

Gctent.get_unknown_vecs = function(tent) {
    const vec_names = new Set(gctax.get_vector_names());
    
    return tent.vecs.filter((vec) => {
        return !vec_names.has(vec.vec);
    }).map((vec) => {
        return vec.vec;
    });
}

module.exports = Gctent;
