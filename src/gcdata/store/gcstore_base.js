"use strict";

function Gcstore({} = {}) {
    this.type = "BASE";
}

Gcstore.prototype.init = async function() {
    // Do nothing
}

Gcstore.prototype.shutdown = function() {
    // Do nothing
}

Gcstore.prototype.put = function(key, val) {
    throw new Error("Subclasses must implement 'put'");    
}

Gcstore.prototype.get = function(key) {
    throw new Error("Subclasses must implement 'get'");
}

module.exports = Gcstore;
