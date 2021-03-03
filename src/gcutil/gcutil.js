/**
* Utility functions
* @namespace gcutil
*/

"use strict";

const crypto = require("crypto");
const util = require("util");

/**
* Compute the SHA256 hash of some data
* @memberof gcutil
* @param {string} data - the data to hash
* @returns {string}
*/
function sha256(data) {
    // TODO: this assumes that the host's OpenSSL implementation includes SHA256
    // if weird/bad things are happening, check 'openssl list -digest-algorithms'
    const hash = crypto.createHash("SHA256");
    hash.update(data);
    return hash.digest("hex");
}

/**
* Deep inspect an object
* @memberof gcutil
* @param {Object} obj - the object to inspect
* @param {number} [depth=20] - recursion depth
* @returns {string}
*/
function inspect(obj, depth = 20) {
    return util.inspect(obj, {showHidden: false, depth: depth, colors: true, compact: 40, breakLength: 200});
}

module.exports.sha256 = sha256;
module.exports.inspect = inspect;
