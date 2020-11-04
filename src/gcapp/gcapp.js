"use strict";

const yaml = require("js-yaml");
const fs = require("fs");
const gc = require("../gcutil/gcconfig.js");
const Gctent = require("../gctax/gctent.js");

function get_node_hash(std, n) {
    let count = 0;

    return std.dfs((node, data) => {
        if (count === n) {
            data.push(gc.DEFAULT_HASH(node.data));
        }

        count += 1;
    })[0];
}

// Load a testable entity from an external YML file, validate its structure and vec definitions
// Returns the deserialized testable entity
function load_tent_ext(path) {
    // TODO: what happens if errors happen? during file I/O or deserialization?
    const doc = fs.readFileSync(path, {encoding: "utf8"});
    const json = yaml.safeLoad(doc, "utf8");
    
    if (!Gctent.is_valid(json)) {
        throw new Error(`${path} is not a valid testable entity`);
    }
    
    const bad_vecs = Gctent.get_unknown_vecs(json);

    if (bad_vecs.length > 0) {
        throw new Error(`Testable entity '${json.tent}' has unknown vector(s): ${bad_vecs.join(", ")}`);
    }

    return json;
}

module.exports.get_node_hash = get_node_hash;
module.exports.load_tent_ext = load_tent_ext;
