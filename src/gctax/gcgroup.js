"use strict";

const Validator = require("jsonschema").Validator;
const v = new Validator();
const gctax = require("./gctax.js");
const gcgroup_schema = require("./schemas/gcgroup_schema.js");

// TODO: this will be our in-memory data structure for groups
function Gcgroup({name, notes, tents = []} = {}) {
    this.name = name;
    this.notes = notes;
    this.tents = tents;
}

Gcgroup.is_valid = function(group) {
    const res = v.validate(group, gcgroup_schema);
    return res.errors.length > 0 ? false : true;
}

module.exports = Gcgroup;
