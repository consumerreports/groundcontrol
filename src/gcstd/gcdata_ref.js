"use strict";

const gcutil = require("../gcutil/gcutil.js");

// A Gcdata_ref is an opaque reference to some arbitrary unit of data
// It's just a thin abstraction for comparing equality between multiple
// units of data in asymptotically favorable time without being so tightly coupled to one method
function Gcdata_ref({data} = {}) {
    if (!data) {
        throw new Error("You must supply a value for argument 'data'");
    }

    this.type = typeof data;
    this.sha256 = gcutil.sha256(data); 
}

Gcdata_ref.prototype.equals = function({data} = {}) {
    if (typeof data === this.type && gcutil.sha256(data) === this.sha256) {
        return true;
    }

    return false;
}

module.exports = Gcdata_ref;
