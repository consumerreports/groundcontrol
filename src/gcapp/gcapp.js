"use strict";

const yaml = require("js-yaml");
const fs = require("fs");
const p = require("path");
const gc = require("./gcapp_config.js");
const Gclog = require("../gclog/gclog.js");
const Gcstd_eval = require("../gcstd/gcstd_eval.js");
const gctax = require("../gctax/gctax.js");
const gcstd = require("../gcstd/gcstd.js");
const Gcapp_tp_res = require("./gcapp_tp_res.js");
const Gctax_tent = require("../gctax/gctax_tent.js");
const Gctax_group = require("../gctax/gctax_group.js");
const Gctax_vec_map = require("../gctax/gctax_vec_map.js");
const Gcntree = require("../gctypes/gcntree/gcntree.js");
const gctax_group_schema = require("../gctax/schemas/gctax_group_schema.js");
const gctax_tent_schema = require("../gctax/schemas/gctax_tent_schema.js");
const Validator = require("jsonschema").Validator;

// Gcapp constructor
function Gcapp({data_modules = []} = {}) {
    this.data_modules = data_modules;
    this.id = gc.DEFAULT_HASH(Date.now());
}

// Convenience wrapper - hash a value using the systemwide default hash function
Gcapp.dhash = function(data) {
    return gc.DEFAULT_HASH(data);
}

// Convenience wrapper - return a list of keys corresponding to the nonscalar values in a standard 
// sch must be a jsonschema schema for a standard
Gcapp.get_nonscalar_keys = function(sch) {
    return gcstd.get_nonscalar_keys(sch);
}

// Convenience wrapper - return the vector vocabulary known to this version of Ground Control
Gcapp.get_vector_names = function() {
    return gctax.get_vector_names();
}

// Convenience wrapper - return the intersection of the sets of vectors for a list of Gctax_tent objects
Gcapp.get_common_vecs = function(tent_list) {
    return gctax.get_common_vecs(tent_list);
}

// Compute the hash of node number n in a Gcntree
Gcapp.get_node_hash = function(std, n) {
    let count = 0;

    return std.dfs((node, data) => {
        if (count === n) {
            data.push(Gcapp.dhash(node.data));
        }

        count += 1;
    })[0];
}

// Convenience function to create an evaluation set from a standard (as a Gcntree) and a list of node numbers
// Returns a Gcstd_eval object
Gcapp.make_eval_set = function(std, nums = [], name = "") {
    if (nums.length === 0) {
        throw new Error("You must specify at least one node to create an evaluation set");
    }

    return Gcstd_eval.from_nodes({std: std, nums: nums, name: name});
}

// Write an evaluation set (as a Gcstd_eval object) to disk in YML format
// Returns the path to the output file as a string
Gcapp.write_eval_set_ext = function(es, notes) {
    const output = {
        eval: es.name,
        notes: notes,
        set: Array.from(es.set.values()).map(hash => Object.fromEntries([["hash", hash]]))
    };
    
    const output_path = `${process.cwd()}/../../out/${Date.now()}.yml`;
    
    // TODO: what happens on error?
    fs.writeFileSync(output_path, yaml.dump(output));
    return output_path;
}

// Load an evaluation set from an external YML file, validate its structure
// Returns the deserialized evaluation set as a Gcstd_eval object
Gcapp.load_eval_set_ext = function(path) {
    // TODO: what happens if errors?
    const doc = fs.readFileSync(path, {encoding: "utf8"});
    const json = yaml.safeLoad(doc, "utf8");
    
    if (!Gcstd_eval.is_valid(json)) {
        throw new Error(`${path} is not a valid evaluation set`);
    }
    
    // TODO: makes you wonder if Gcstd_eval objects should have a from_json constructor, and if the transformation
    // in write_eval_set_ext above should become a to_json method...
    const es = new Gcstd_eval({name: json.eval});
    json.set.forEach(hash => es.set.add(hash.hash));
    return es;
}

// Load a testable entity from an external YML file, validate its structure and vec definitions
// Returns the deserialized testable entity
Gcapp.load_tent_ext = function(path) {
    // TODO: what happens if errors happen during file I/O or deserialization?
    const doc = fs.readFileSync(path, {encoding: "utf8"});
    const json = yaml.safeLoad(doc, "utf8");
    
    if (!Gctax_tent.is_valid(json)) {
        throw new Error(`${path} is not a valid testable entity`);
    }
    
    const bad_vecs = Gctax_tent.get_unknown_vecs(json);

    if (bad_vecs.length > 0) {
        throw new Error(`Testable entity '${json.tent}' has unknown vector(s): ${bad_vecs.join(", ")}`);
    }
    
    return new Gctax_tent({name: json.tent, notes: json.notes, vecs: json.vecs.map(vec => vec.vec)});
}

// Load a group from an external YML file, validate its structure and constituent testable entities
// assumes that testable entities are referenced using relative pathnames
Gcapp.load_group_ext = function(path) {
    // TODO: what happens if errors happen during file I/O or deserialization?
    const doc = fs.readFileSync(path, {encoding: "utf8"});
    const json = yaml.safeLoad(doc, "utf8");
    
    if (!Gctax_group.is_valid(json)) {
        throw new Error(`${path} is not a valid group`);
    }
    
    return new Gctax_group({
        name: json.group,
        notes: json.notes,
        tents: json.tent_paths.map(tent_path => Gcapp.load_tent_ext(`${p.dirname(path)}/${tent_path.tent_path}`))
    });
}

// Load a standard from an external YML file, optionally validate its schema
// If the module at schema_path exports multiple schema objects, we consider the order of exports:
// the 0th object is considered the parent schema, the following objects are registered as its children
// Returns the deserialized standard as a Gcntree
Gcapp.load_std_ext = async function(std_path, schema_path = null) {
    // TODO: what happens if errors?
    const doc = fs.readFileSync(std_path, {encoding: "utf8"});
    const ymldoc = yaml.safeLoad(doc, "utf8");
    
    if (schema_path !== null) {
         // ES2020 dynamic import, time to get weird!
        const sch = await import(schema_path);
        const sch_objs = Object.values(sch.default);
    
        const v = new Validator();
    
        if (sch_objs.length > 1) {
            sch_objs.slice(1).forEach(obj => v.addSchema(obj, obj.id));
        }
    
        const res = v.validate(ymldoc, sch_objs[0], {nestedErrors: true});
    
        if (res.errors.length > 0) {
            throw new Error(`${std_path} is not a valid instance of standard ${schema_path}`);
        }
    }
    
    return Gcntree.from_json_doc(ymldoc, Gcntree.trans.to_obj);
}

// Load a standard schema as an external file
// Returns a schema object
Gcapp.load_schema_ext = async function(path) {
    const sch = await import(path);
    return sch.default;
}

// Generate a testplan from data provded as external YML files
// Returns a Gcapp_tp_res object which wraps a Map where the keys are vector names and 
// the values are arrays where each element is a part of a standard
Gcapp.testplan_ext = function(subj_path, std_path, eval_path) {
    // TODO: This function should prob let you specify a vector mapping? The help text currently says it
    // uses the default vector mapping... for now, let's just load the vector map we created in the global scope for testing
    const vec_map = cr_vec_map;
    
    if (!subj_path || !std_path) {
        throw new Error("Missing path");
    }

    const eval_set = eval_path ? Gcapp.load_eval_set_ext(eval_path) : null;
    
    // Deserialize the file for the test subject and determine if it's a tent or a group
    // TODO: this duplicates the validation that occurs in the group and tent loaders, do we care?
    const subj_doc = fs.readFileSync(subj_path, {encoding: "utf8"});
    const subj_obj = yaml.safeLoad(subj_doc, "utf8");
    const v = new Validator();
    let is_group = true;
    let subj = null;

    if (v.validate(subj_obj, gctax_group_schema).errors.length === 0) {
        subj = Gcapp.load_group_ext(subj_path);
    } else if (v.validate(subj_obj, gctax_tent_schema).errors.length === 0) {
        is_group = false;
        subj = Gcapp.load_tent_ext(subj_path);
    } else {
        throw new Error(`${subj_path} doesn't seem to be a group or a testable entity`);
    }
    
    // Load the standard file and transform to a Gcntree
    const doc = fs.readFileSync(std_path, {encoding: "utf8"});
    const ymldoc = yaml.safeLoad(doc, "utf8");
    const doc_tree = Gcntree.from_json_doc(ymldoc, Gcntree.trans.to_obj);
    
    const vecs_to_evaluate = is_group ? this.get_common_vecs(subj.tents) : subj.vecs;
    
    const vec_coverage = vecs_to_evaluate.map((vec) => {
        return vec_map.get_links(vec).map((node_hash) => {
            if (eval_set === null || eval_set.set.has(node_hash)) {
                return true;
            }

            return false;
        });
    });

    const total_evals = vec_coverage.reduce((acc, bool_list) => {
        return acc + bool_list.length;
    }, 0);

    const selected_evals = vec_coverage.reduce((acc, bool_list) => {
        return acc + bool_list.reduce((acc, bool) => {
            return bool ? acc + 1 : acc;
        }, 0);
    }, 0);
    
    // Associate selected hashes with their vec names   
    const a = new Map(vecs_to_evaluate.map((vec) => {
        return vec_map.get_links(vec).filter((hash) => {
            return eval_set === null || eval_set.set.has(hash);
        }).map((hash) => {
            return [hash, vec];
        });
    }).flat());
   
    // Prep a hashmap that associates vec names with tree search results
    const b = new Map(Array.from(a.values()).map(val => [val, []]));
   
    // Inorder traversal, if we get a hash match on a, push the text of the standard part and its node number into b
    // Collect the matching hashes for later
    let n = 0;

    const found_hashes = doc_tree.dfs((node, data) => {
        const vec_name = a.get(Gcapp.dhash(node.data));

        if (vec_name) {
            b.get(vec_name).push({std_txt: node.data, node_num: n});
            data.push(Gcapp.dhash(node.data));
        }

        n += 1;
    });
    
    // Get the set complement of a with respect to the hashes found above, the result is the hashes that weren't found in the standard
    const unfound = Array.from(a.keys()).filter((hash) => {
        return !found_hashes.includes(hash);
    });
    
    return new Gcapp_tp_res({
        map: b,
        subj: subj,
        is_group: is_group,
        eval_set: eval_set,
        std_path: std_path,
        vecs_to_evaluate: vecs_to_evaluate,
        selected_evals: selected_evals,
        total_evals: total_evals,
        vec_coverage: vec_coverage,
        num_links: a.size,
        num_unfound: unfound.length
    });
}

// Compute the absolute node numbers for one "part" of an external standard file as defined using the "parts" command
// Returns an object with some metadata which wraps an array of [node_num, node_data, path_to_node] arrays
Gcapp.fnum_ext = async function(std_path, sch_path, part_id) {
    // Get the property name for the part code we're interested in
    const schema = await Gcapp.load_schema_ext(sch_path);
    const keys = Gcapp.get_nonscalar_keys(schema);

    if (part_id < 0 || part_id > keys.length - 1) {
        throw new Error(`Part ID out of range for standard schema ${sch_path}`);
    }

    const prop = keys[part_id];

    // Load the standard
    const doc_tree = await Gcapp.load_std_ext(std_path);
    let total_nodes = 0;

    const res = doc_tree.dfs((node, data) => {
        // TODO: this is a brittle and bad way to discern between diff kinds of nodes
        // we prob need a wrapper class for tree nodes which lets them reflect their type
        // and the set of node types for a given standard is specified by the standard schema
        if (node.parent && node.parent.data === prop && typeof node.data !== "string") {
            const path = [];
            let pnode = node.parent;

            while (pnode !== null) {
                if (pnode.parent && keys.includes(pnode.parent.data)) {
                    path.push(pnode.data);
                }

                pnode = pnode.parent;
            }
            
            // TODO: this grossly assumes that the standard was transformed to a Gcntree using the 
            // to_obj transformer... that's gonna break real quick
            const pathstr = path.reverse().map((hop) => {
                return `${Object.values(hop)[0]} /`;
            }).join(" ");
            
            data.push([total_nodes, node.data, pathstr.substr(0, pathstr.length - 2)]);
        }

        total_nodes += 1;
    });

    return {
        prop: prop,
        part_id: part_id,
        total_nodes: total_nodes,
        nodes: res
    };
}


// Initialize an instance of a Gcapp object - a new Gcapp object isn't ready to use until this has been executed
Gcapp.prototype.init = async function() {
    Gclog.log(`[GCAPP] Initializing Ground Control kernel ${this.id}...`);
    await Promise.all(this.data_modules.map(module => module.init()));
}

// Return a list of the data modules associated with this instance of Gcapp 
Gcapp.prototype.get_data_modules = function() {
    return this.data_modules;
}

// TODO: We haven't yet figured out where vector maps should live... should there be a default map
// that lives on every instance of Gcapp? Or should vector maps be more like standards and tents,
// they're data that you can script as YML or keep in the datastore? The big question that informs the 
// rest: Will a typical organization test against different kinds of standards, or just one standard?
// Vector maps necessitate standard homogeneity -- so if you test against different standards, you need
// a vector map for each one...
const doc = fs.readFileSync("../../temp/ds_103020.yml", {encoding: "utf8"});
const ymldoc = yaml.safeLoad(doc, "utf8");
const doc_tree = Gcntree.from_json_doc(ymldoc, Gcntree.trans.to_obj);
const cr_vec_map = new Gctax_vec_map({name: "Consumer Reports Privacy & Security Testing"});
cr_vec_map.add_link(gc.VECTORS.UI_AUTH, Gcapp.get_node_hash(doc_tree, 311));
cr_vec_map.add_link(gc.VECTORS.PW_COMPLEXITY, Gcapp.get_node_hash(doc_tree, 357));
cr_vec_map.add_link(gc.VECTORS.PW_COMPLEXITY, Gcapp.get_node_hash(doc_tree, 360));
cr_vec_map.add_link(gc.VECTORS.PW_COMPLEXITY, Gcapp.get_node_hash(doc_tree, 363));
cr_vec_map.add_link(gc.VECTORS.UI_AUTH, Gcapp.get_node_hash(doc_tree, 342));
cr_vec_map.add_link(gc.VECTORS.PW_COMPLEXITY, Gcapp.get_node_hash(doc_tree, 352));
cr_vec_map.add_link(gc.VECTORS.NOTIFICATION_MECHANISM, Gcapp.get_node_hash(doc_tree, 369));
cr_vec_map.add_link(gc.VECTORS.NOTIFICATION_MECHANISM, Gcapp.get_node_hash(doc_tree, 372));
cr_vec_map.add_link(gc.VECTORS.ATTACK_PROTECTION, Gcapp.get_node_hash(doc_tree, 378));
cr_vec_map.add_link(gc.VECTORS.ENCRYPTION, Gcapp.get_node_hash(doc_tree, 386));
cr_vec_map.add_link(gc.VECTORS.KNOWN_VULNERABILITY_CVE_CHECKS, Gcapp.get_node_hash(doc_tree, 394));
cr_vec_map.add_link(gc.VECTORS.AUTO_SECURITY_UPDATES, Gcapp.get_node_hash(doc_tree, 418));
cr_vec_map.add_link(gc.VECTORS.SECURITY_UPDATE_NOTIFICATION, Gcapp.get_node_hash(doc_tree, 421));
// Below is a case where an indicator actually has multiple indicators concatenated together as one long string; node #386 holds
// indicators that cover DS parts S.4.1.2 and S.4.1.1 and it looks like a few more -- not sure what to do with these, so 
// we're just skipping them
// cr_vec_map.add_link(gc.VECTORS.ENCRYPTION_SI_STORAGE, Gcapp.get_node_hash(doc_tree, 386));  

module.exports = Gcapp;
