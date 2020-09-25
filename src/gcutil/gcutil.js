"use strict";

const crypto = require("crypto");

function sha256(data) {
    const hash = crypto.createHash("SHA256"); // TODO: the encoding string is host dependent, 'openssl list -digest-algorithms'
    hash.update(data);
    return hash.digest("hex");
}

module.exports.sha256 = sha256;
