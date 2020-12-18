"use strict";

const Gcstore_base = require("./gcstore_base.js");

function Gcstore_gs({} = {}) {
   Gcstore_base.call(this);
}

Gcstore_gs.prototype = Object.create(Gcstore_base.prototype);

Gcstore_gs.prototype.put = function(id) {
    // TODO: write me
    console.log("PUT called");
}

Gcstore_gs.prototype.get = function(id) {
    // TODO: write me
    console.log("GET called");
}

module.exports = Gcstore_gs;
