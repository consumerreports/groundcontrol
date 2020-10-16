"use strict";

const gcutil = require("./gcutil.js");

const DEFAULT_HASH = function(data) {
    if (typeof data !== "string") {
        data = JSON.stringify(data);
    }
    
    return gcutil.sha256(data);
}

module.exports = {
    DEFAULT_HASH: DEFAULT_HASH
};
