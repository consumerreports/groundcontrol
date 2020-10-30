"use strict";

const gc = require("../gcutil/gcconfig.js");
const gcutil = require("../gcutil/gcutil.js");
const Gcntree = require("../gctypes/gcntree/gcntree.js");

// std must be a Gcntree for a standard, nums must be an array of node numbers
// this constructor is based on what we think a nice interface would be like to do this using a mature product:
// you'd probably see a standard in the UI, with all its nodes color coded by its role ("part") in the schema
// and you could click to select a set of homogenous nodes
// TODO: we probably shouldn't allow you to derive a Gceval from an incorrect standard... 
function Gceval({std = null, nums = []} = {}) {
    // TODO: to validate or not to validate? if we check this, shouldn't we also make sure nums has > 0 elements, etc?
    if (!(std instanceof Gcntree)) {
        throw new Error("Argument 'std' must be a Gcntree");
    }

    this.set = new Set();
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
            
        this.set.add(gc.DEFAULT_HASH(data));
    });
}

module.exports = Gceval;
