"use strict";

const Validator = require("jsonschema").Validator;
const v = new Validator();
const gctax = require("./gctax.js");
const gctax_group_schema = require("./schemas/gctax_group_schema.js");

// TODO: this will be our in-memory data structure for groups
function Gctax_group({name, notes, tents = []} = {}) {
    this.name = name;
    this.notes = notes;
    this.tents = tents;
}

Gctax_group.is_valid = function(group) {
    const res = v.validate(group, gctax_group_schema);
    return res.errors.length > 0 ? false : true;
}

module.exports = Gctax_group;
