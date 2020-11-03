"use strict";

const gctax = require("./gctax.js");

function Gcvec_map({name = ""} = {}) {
    this.name = name;
    this.data = new Map(gctax.get_vector_names().map(name => [name, []]));
}

Gcvec_map.prototype.add_link = function(vec_name, data) {
    const list = this.data.get(vec_name);

    if (!list) {
        throw new Error(`Vector name ${vec_name} not found!`);
    }

    list.push(data);
}

module.exports = Gcvec_map;
