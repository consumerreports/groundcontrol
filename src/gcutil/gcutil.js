"use strict";

const crypto = require("crypto");
const util = require("util");

function sha256(data) {
    const hash = crypto.createHash("SHA256"); // TODO: the encoding string is host dependent, 'openssl list -digest-algorithms'
    hash.update(data);
    return hash.digest("hex");
}

function inspect(obj, depth = 20) {
    return util.inspect(obj, {showHidden: false, depth: depth, colors: true, compact: 40, breakLength: 200});
}

module.exports.sha256 = sha256;
module.exports.inspect = inspect;
