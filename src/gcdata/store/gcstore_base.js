"use strict";

function Gcstore({} = {}) {

}

Gcstore.prototype.put = function(id) {
    throw new Error("Subclasses must implement 'put'");    
}

Gcstore.prototype.get = function(id) {
    throw new Error("Subclasses must implement 'get'");
}

module.exports = Gcstore;
