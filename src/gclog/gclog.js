/**
* Logging and error messaging
* @module gclog
*/

"use strict";

/**
* Gclog singleton
* @constructor
* @hideconstructor
*/
function Gclog() {

}

Gclog.LOGF = console.log;

Gclog.ERRF = console.err;

/**
* Set the log function hook
* @static
* @param {function} f - function to execute 
*/
Gclog.set_log = function(f) {
    if (typeof f !== "function") {
        throw new TypeError("Argument f must be a function");
    }

    Gclog.LOGF = f;
}

/**
* Set the err function hook
* @static
* @param {function} f - function to execute
*/
Gclog.set_err = function(f) {
    // TODO: we don't have a way to run the err hook yet!

    if (typeof f !== "function") {
        throw new TypeError("Argument f must be a function");
    }

    Gclog.ERRF = f;
}

/**
* Log a message 
* @static
* @param {string} msg - message to log
* @param {boolean} startn - add a leading newline?
* @param {boolean} endn - add a trailing newline?
*/
Gclog.log = function(msg, startn = false, endn = false) {
    Gclog.LOGF(`${startn ? "\n" : ""} ${new Date().toLocaleString()} ${msg}${endn ? "\n" : ""}`);
}

module.exports = Gclog;
