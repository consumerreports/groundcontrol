"use strict";

function Gclog() {

}

Gclog.LOGF = console.log;

Gclog.ERRF = console.err;

Gclog.set_log = function(f) {
    if (typeof f !== "function") {
        throw new TypeError("Argument f must be a function");
    }

    Gclog.LOGF = f;
}

Gclog.set_err = function(f) {
    if (typeof f !== "function") {
        throw new TypeError("Argument f must be a function");
    }

    Gclog.ERRF = f;
}

Gclog.log = function(msg, startn = false, endn = false) {
    Gclog.LOGF(`${startn ? "\n" : ""} ${new Date().toLocaleString()} ${msg}${endn ? "\n" : ""}`);
}

module.exports = Gclog;