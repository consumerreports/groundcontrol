"use strict";

const Validator = require("jsonschema").Validator;
const v = new Validator();
const gctax = require("./gctax.js");
const gctax_vec_map_schema = require("./schemas/gctax_vec_map_schema.js");

function Gctax_vec_map({name = ""} = {}) {
    this.name = name;
    this.data = new Map(gctax.get_vector_names().map(name => [name, []]));
}

// Note that this is only structural validation, it does not validate vector names against the system vocabulary!
Gctax_vec_map.is_valid = function(vec_map) {
    const res = v.validate(vec_map, gctax_vec_map_schema);
    return res.errors.length > 0 ? false : true;
}

Gctax_vec_map.prototype.add_link = function(vec_name, data) {
    const list = this.data.get(vec_name);

    if (!list) {
        throw new Error(`Vector name ${vec_name} not found!`);
    }

    list.push(data);
}

Gctax_vec_map.prototype.get_links = function(vec_name) {
    return this.data.get(vec_name);
}

module.exports = Gctax_vec_map;
