/**
* Vector maps
* @module gctax_vec_map
*/

"use strict";

const Validator = require("jsonschema").Validator;
const v = new Validator();
const gctax = require("./gctax.js");
const gctax_vec_map_schema = require("./schemas/gctax_vec_map_schema.js");

/**
* A vector map
* @constructor
* @param {Object} config
* @param {string} config.name - name for the vector map
*/
function Gctax_vec_map({name = ""} = {}) {
    this.name = name;
    this.data = new Map(gctax.get_vector_names().map(name => [name, []]));
}

/**
* Validate the structure of a vector map. 
* Note that this does not validate vector names against the system vocabulary
* @static
* @param {module:gctax_vec_map~Gctax_vec_map} vec_map - a vector map
* @returns {boolean} true if the vector map is valid
*/
Gctax_vec_map.is_valid = function(vec_map) {
    const res = v.validate(vec_map, gctax_vec_map_schema);
    return res.errors.length > 0 ? false : true;
}

/**
* Add a new link to this vector map
* @param {string} vec_name - the vector to assign to
* @param {any} data - the data to assign as a link; it should probably be a hash as a string, but that isn't enforced!
*/
Gctax_vec_map.prototype.add_link = function(vec_name, data) {
    const list = this.data.get(vec_name);

    if (!list) {
        throw new Error(`Vector name ${vec_name} not found!`);
    }

    list.push(data);
}

/**
* Get all the links associated with a vector in this vector map
* @param {string} vec_name - the vector to fetch links for
* @returns {Array.<any>} an array of link data associated with vector vec_name
*/
Gctax_vec_map.prototype.get_links = function(vec_name) {
    return this.data.get(vec_name);
}

module.exports = Gctax_vec_map;
