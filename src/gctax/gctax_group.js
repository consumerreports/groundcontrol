/**
* Groups
* @module gctax_group
*/

"use strict";

const Validator = require("jsonschema").Validator;
const v = new Validator();
const gctax = require("./gctax.js");
const gctax_group_schema = require("./schemas/gctax_group_schema.js");

/**
* A group of testable entities
* @constructor
* @param {Object} config - configuration
* @param {string} config.name - name for the group
* @param {string} config.notes - notes associated with the group
* @param {Array.<module:gctax_tent~Gctax_tent>} config.tents - the testable entities to group
*/
function Gctax_group({name, notes, tents = []} = {}) {
    this.name = name;
    this.notes = notes;
    this.tents = tents;
}

/**
* Validate the structure of a group
* @static
* @param {module:gctax_group~Gctax_group} group - a group
* @returns {boolean} true if the group is valid
*/
Gctax_group.is_valid = function(group) {
    const res = v.validate(group, gctax_group_schema);
    return res.errors.length > 0 ? false : true;
}

module.exports = Gctax_group;
