"use strict";

const crypto = require("crypto");
const util = require("util");

// Calculate the SHA256 hash of some data
// TODO: this makes the sketchy assumption that the host's OpenSSL implementation has SHA256 available
// If weird stuff is happening, try 'openssl list -digest-algorithms'
function sha256(data) {
    const hash = crypto.createHash("SHA256");
    hash.update(data);
    return hash.digest("hex");
}

// Deep inspect an object, useful for debugging
function inspect(obj, depth = 20) {
    return util.inspect(obj, {showHidden: false, depth: depth, colors: true, compact: 40, breakLength: 200});
}

module.exports.sha256 = sha256;
module.exports.inspect = inspect;
