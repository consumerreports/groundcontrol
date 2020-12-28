"use strict";

const yaml = require("js-yaml");
const fs = require("fs");
const p = require("path");
const gc = require("../gcutil/gcconfig.js");
const Gctent = require("../gctax/gctent.js");
const Gcgroup = require("../gctax/gcgroup.js");

function Gcapp({data_modules = []} = {}) {
    this.data_modules = data_modules;
    this.id = gc.DEFAULT_HASH(Date.now());
}

// Compute the hash of node number n in a Gcntree
Gcapp.get_node_hash = function(std, n) {
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
Gcapp.load_tent_ext = function(path) {
    // TODO: what happens if errors happen during file I/O or deserialization?
    const doc = fs.readFileSync(path, {encoding: "utf8"});
    const json = yaml.safeLoad(doc, "utf8");
    
    if (!Gctent.is_valid(json)) {
        throw new Error(`${path} is not a valid testable entity`);
    }
    
    const bad_vecs = Gctent.get_unknown_vecs(json);

    if (bad_vecs.length > 0) {
        throw new Error(`Testable entity '${json.tent}' has unknown vector(s): ${bad_vecs.join(", ")}`);
    }
    
    return new Gctent({name: json.tent, notes: json.notes, vecs: json.vecs.map(vec => vec.vec)});
}

// Load a group from an external YML file, validate its structure and constituent testable entities
// assumes that testable entities are referenced using relative pathnames
Gcapp.load_group_ext = function(path) {
    // TODO: what happens if errors happen during file I/O or deserialization?
    const doc = fs.readFileSync(path, {encoding: "utf8"});
    const json = yaml.safeLoad(doc, "utf8");
    
    if (!Gcgroup.is_valid(json)) {
        throw new Error(`${path} is not a valid group`);
    }
    
    return new Gcgroup({
        name: json.group,
        notes: json.notes,
        tents: json.tent_paths.map(tent_path => Gcapp.load_tent_ext(`${p.dirname(path)}/${tent_path.tent_path}`))
    });
}

// Initialize an instance of a Gcapp object - a new Gcapp object isn't ready to use until this has been executed
Gcapp.prototype.init = async function() {
    console.log(`[GCAPP] Initializing Ground Control kernel ${this.id}...`);
    await Promise.all(this.data_modules.map(module => module.init()));
}

module.exports = Gcapp;