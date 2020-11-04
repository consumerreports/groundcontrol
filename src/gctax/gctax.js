"use strict";

const gc = require("../gcutil/gcconfig.js");

function get_vector_names() {
    return Object.keys(gc.VECTORS);
}
 
module.exports.get_vector_names = get_vector_names;
