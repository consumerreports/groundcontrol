/**
* Global configuration
* @namespace gcapp_config
*/

"use strict";

const gcutil = require("../gcutil/gcutil.js");

/**
* Systemwide default hash function.
* You probably shouldn't call this directly - prefer TK LINK TO GCAPP.DHASH
* @function DEFAULT_HASH
* @param {any} data - the value to hash
* @returns {string}
* @memberof gcapp_config
*/
const DEFAULT_HASH = function(data) {
    if (typeof data !== "string") {
        data = JSON.stringify(data);
    }
    
    return gcutil.sha256(data);
}

/**
* Systemwide vector definitions.
* You probably shouldn't fetch this directly - prefer TK LINK TO GCAPP.GET_VECTOR_NAMES
* @memberof gcapp_config
*/
const VECTORS = {
    UI_AUTH: "UI_AUTH",
    PW_COMPLEXITY: "PW_COMPLEXITY",
    NOTIFICATION_MECHANISM: "NOTIFICATION_MECHANISM",
    ATTACK_PROTECTION: "ATTACK_PROTECTION",
    ENCRYPTION: "ENCRYPTION",
    ENCRYPTION_SI_STORAGE: "ENCRYPTION_SI_STORAGE",
    KNOWN_VULNERABILITY_CVE_CHECKS: "KNOWN_VULNERABILITY_CVE_CHECKS",
    AUTO_SECURITY_UPDATES: "AUTO_SECURITY_UPDATES",
    SECURITY_UPDATE_NOTIFICATION: "SECURITY_UPDATE_NOTIFICATION"
};

module.exports = {
    DEFAULT_HASH: DEFAULT_HASH,
    VECTORS: VECTORS
};
