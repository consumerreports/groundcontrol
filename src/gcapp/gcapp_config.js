/**
* Global configuration
* @namespace gcapp_config
*/

"use strict";

const gcutil = require("../gcutil/gcutil.js");

/**
* Systemwide default hash function.
* You probably shouldn't call this directly - prefer {@link module:gcapp~Gcapp.dhash}
* @memberof gcapp_config
* @param {any} data - the value to hash
* @returns {string}
*/
const DEFAULT_HASH = function(data) {
    if (typeof data !== "string") {
        data = JSON.stringify(data);
    }
    
    return gcutil.sha256(data);
}

/**
* Systemwide vector definitions.
* You probably shouldn't fetch this directly - prefer {@link module:gcapp~Gcapp.get_vector_names}
* @memberof gcapp_config
* @constant
*/
const VECTORS = {
    ACCOUNT: "ACCOUNT",
    MICROPHONE: "MICROPHONE",
    CAMERA: "CAMERA",
    BIOMETRIC_SENSORS: "BIOMETRIC_SENSORS",
    MOBILE_APP: "MOBILE_APP",
    WEB_ACCESS: "WEB_ACCESS",
    CONNECTED_DEVICE: "CONNECTED_DEVICE",
    PERSONAL_INFO: "PERSONAL_INFO",
    HEALTH_INFO: "HEALTH_INFO",
    LOCATION_INFO: "LOCATION_INFO",
    FINANCIAL_INFO: "FINANCIAL_INFO",
    WIRELESS: "WIRELESS",
    WIRED: "WIRED",
    LOCAL_NETWORK: "LOCAL_NETWORK",
    INTERNET: "INTERNET",
    BLUETOOTH: "BLUETOOTH",
    USB: "USB",
    ZWAVE: "ZWAVE",
    NFC: "NFC",
    LOCAL_STORAGE: "LOCAL_STORAGE",
    CLOUD_STORAGE: "CLOUD_STORAGE",
    PERIPHERAL_STORAGE: "PERIPHERAL_STORAGE"
};

module.exports = {
    DEFAULT_HASH: DEFAULT_HASH,
    VECTORS: VECTORS
};
