/**
* Evaluation sets
* @module gcstd_eval
*/

"use strict";

const Validator = require("jsonschema").Validator;
const v = new Validator();
const gc = require("../gcapp/gcapp_config.js");
const gcutil = require("../gcutil/gcutil.js");
const Gcntree = require("../gctypes/gcntree/gcntree.js");
const gcstd_eval_schema = require("./schemas/gcstd_eval_schema.js");

/**
* An evaluation set
* @constructor
* @param {Object} config - configuration
* @param {string} config.name - name for the evaluation set
*/
function Gcstd_eval({name} = {}) {
    this.name = name;
    this.set = new Set();
}

/**
* Factory function to create a {@link module:gcstd_eval~Gcstd_eval} object from a standard and a list of node numbers
* @static
* @param {Object} config - configuration
* @param {Object} config.std - a standard as a Gcntree
* @param {Array} config.nums - absolute node numbers
* @param {string} config.name - name for the evaluation set
* @returns {module:gcstd_eval~Gcstd_eval}
*/
Gcstd_eval.from_nodes = function({std = null, nums = [], name = ""} = {}) {
    // TODO: we probably shouldn't let you derive a Gceval from an incorrect standard...
    // TODO: to validate or not to validate? if we check this, shouldn't we also make sure nums has > 0 elements, etc?
    if (!(std instanceof Gcntree)) {
        throw new Error("Argument 'std' must be a Gcntree");
    }
    
    const es = new this({name: name});
    const tree_data = new Map();
    let n = 0;
    
    // TODO: our method is to build a hash map from the Gcntree nodes so we can lookup node numbers in O(1)
    // which makes the whole algorithm O(m + n) instead of O(m * n) had we just done linear search against
    // the list of node numbers for each node in the Gcntree... but are setup costs/space complexity tradeoffs 
    // worth it for what will almost certainly always be small sets?
    std.dfs((node, data) => {
        tree_data.set(n, node.data);
        n += 1;
    });
    
    nums.forEach((num) => {
        const data = tree_data.get(num);

        if (!data) {
            throw new Error(`Node number ${num} invalid or out of range`);
        }
            
        es.set.add(gc.DEFAULT_HASH(data));
    });
    
    return es;
}

/**
* Validate the structure of an evaluation set
* @static
* @param {module:gcstd_eval~Gcstd_eval} es - an evaluation set
* @returns {boolean} true if the evaluation set is valid
*/
Gcstd_eval.is_valid = function(es) {
    // TODO: maybe we should perform some superficial validation of the hashes too? we could try to address this in the Gceval schema too...
    const res = v.validate(es, gcstd_eval_schema);
    return res.errors.length > 0 ? false : true;
}

module.exports = Gcstd_eval;
