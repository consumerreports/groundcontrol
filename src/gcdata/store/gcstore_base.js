"use strict";

/**
* Base class for a data store
* @constructor
*/
function Gcstore({} = {}) {
    this.type = "BASE";
}

/**
* Initialize this data store. Will be executed during {@link module:gcapp~Gcapp#init} 
* @abstract
*/
Gcstore.prototype.init = async function() {
    // Do nothing
}

/**
* Shut down this data store
* @abstract
*/
Gcstore.prototype.shutdown = function() {
    // Do nothing
}

/**
* Save data to this data store
* @abstract
* @param key {string} key, usage is subclass dependent
* @param val {Any} value to save
*/
Gcstore.prototype.put = function(key, val) {
    throw new Error("Subclasses must implement 'put'");    
}

/**
* Fetch data from this data store
* @abstract
* @param key {string} key, usage is subclass dependent
*/
Gcstore.prototype.get = function(key) {
    throw new Error("Subclasses must implement 'get'");
}

module.exports = Gcstore;
