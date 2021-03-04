/**
* Testable entities
* @module gctax_tent
*/

"use strict";

const Validator = require("jsonschema").Validator;
const v = new Validator();
const gctax = require("./gctax.js");
const gctax_tent_schema = require("./schemas/gctax_tent_schema.js");

/**
* A testable entity
* @constructor
* @param {Object} config - configuration
* @param {string} config.name - name for the testable entity
* @param {string} config.notes - notes to associate with the testable entity
* @param {Array.<string>} config.vecs - vectors to assign to this testable entity
*/
function Gctax_tent({name, notes, vecs = []} = []) {
    this.name = name;
    this.notes = notes;
    this.vecs = vecs;
}

/**
* Validate the structure of a testable entity
* @static
* @param {module:gctax_tent~Gctax_tent} tent - a testable entity
* @returns {boolean} true if the testable entity is valid
*/
Gctax_tent.is_valid = function(tent) {
    const res = v.validate(tent, gctax_tent_schema);
    return res.errors.length > 0 ? false : true;
}

/**
* Fetch the set of vectors associated with a testable entity that are unknown to this version of Ground Control
* @static
* @param {module:gctax_tent~Gctax_tent} tent - a testable entity
* @returns {Array.<string>} - unknown vector names
*/
Gctax_tent.get_unknown_vecs = function(tent) {
    const vec_names = new Set(gctax.get_vector_names());
    
    return tent.vecs.filter((vec) => {
        return !vec_names.has(vec.vec);
    }).map((vec) => {
        return vec.vec;
    });
}

module.exports = Gctax_tent;
