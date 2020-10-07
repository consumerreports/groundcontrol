"use strict";

const gcutil = require("../gcutil/gcutil.js");
const Gcntree = require("../gctypes/gcntree/gcntree.js");

// std must be a Gcntree for a standard, nodes must be an array of node numbers
// this constructor is based on what we think a nice interface would be like to do this using a mature product:
// you'd probably see a standard in the UI, with all its procedures highlighted and clickable, and you could
// toggle on whichever procedures you want to include in the eval...
// TODO: we probably shouldn't allow you to derive a Gceval from an incorrect standard... 
function Gceval({std = null, nums = []} = {}) {
    // TODO: to validate or not to validate? if we check this, shouldn't we also make sure nums has > 0 elements, etc?
    if (!(std instanceof Gcntree)) {
        throw new Error("Argument 'std' must be a Gcntree");
    }

    this.set = [];
    const tree_data = new Map();
    let n = 0;
    
    // TODO: bad way to check if a node is a procedure! grep "procs" in gcsh.js 
    std.dfs((node, data) => {
        if (node.parent && node.parent.data === "procedures") {
            tree_data.set(n, node.data);
            n += 1;
        }
    });
    
    nums.forEach((num) => {
        const data = tree_data.get(num);

        if (!data) {
            throw new Error(`Node number ${num} invalid or out of range`);
        }

        this.set.push(gcutil.sha256(JSON.stringify(data)));
    });
}

module.exports = Gceval;
