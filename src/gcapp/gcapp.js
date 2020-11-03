"use strict";

const gc = require("../gcutil/gcconfig.js");

function get_node_hash(std, n) {
    let count = 0;

    return std.dfs((node, data) => {
        if (count === n) {
            data.push(gc.DEFAULT_HASH(node.data));
        }

        count += 1;
    })[0];
}

module.exports.get_node_hash = get_node_hash;
