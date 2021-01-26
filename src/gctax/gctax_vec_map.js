"use strict";

const gctax = require("./gctax.js");

function Gctax_vec_map({name = ""} = {}) {
    this.name = name;
    this.data = new Map(gctax.get_vector_names().map(name => [name, []]));
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
