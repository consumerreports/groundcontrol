"use strict";

const gcutil = require("./gcutil.js");

// You probably don't want to call this directly - use the Gcapp convenience wrapper
const DEFAULT_HASH = function(data) {
    if (typeof data !== "string") {
        data = JSON.stringify(data);
    }
    
    return gcutil.sha256(data);
}

// Our controlled vocabulary of vector names - don't fetch this directly, use Gcapp.get_vector_names
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
