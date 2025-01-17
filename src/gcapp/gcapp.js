/**
* Public API
* @module gcapp
*/

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

/**
* Gcapp exposes Ground Control's high level API
* @constructor
* @param {Object} config - configuration
* @param {Array.<Gcstore>} config.data_modules - an array of data I/O modules to use
*/
function Gcapp({data_modules = []} = {}) {
    this.data_modules = data_modules;
    this.id = gc.DEFAULT_HASH(Date.now());
}

/**
* Hash a value using the systemwide default hash function
* @static
* @param {any} data - the value to hash
* @returns {string}
*/
Gcapp.dhash = function(data) {
    return gc.DEFAULT_HASH(data);
}


/**
* Return a list of keys corresponding to the nonscalar values in a standard
* @static
* @param {Object} sch - a standard schema in jsonschema format
* @returns {Array.<string>}
*/
Gcapp.get_nonscalar_keys = function(sch) {
    return gcstd.get_nonscalar_keys(sch);
}

/**
* Fetch the systemwide vocabulary of vector names
* @static
* @returns {Array.<string>}
*/
Gcapp.get_vector_names = function() {
    return gctax.get_vector_names();
}

/**
* Compute the intersection of sets of vectors over an array of testable entities
* @static
* @param {Array.<module:gctax_tent~Gctax_tent>} tent_list - the testable entities to compute over
* @returns {Array.<string>} an array representing the set of common vectors
*/
Gcapp.get_common_vecs = function(tent_list) {
    return gctax.get_common_vecs(tent_list);
}

/**
* Compute the hash of a node in a standard specified by absolute node number using the default hash function
* @static
* @param {Gcntree} std - a standard
* @param {number} n - node number
* @returns {string}
*/
Gcapp.get_node_hash = function(std, n) {
    let count = 0;

    return std.dfs((node, data) => {
        if (count === n) {
            data.push(Gcapp.dhash(node.data));
        }

        count += 1;
    })[0];
}

/**
* Search the nodes of a standard for a text string, case sensitive
* @static
* @param {Gcntree} std - a standard
* @param {string} str - text string to search for
* @returns {Array.<Array>} nodes where the string was found, as [node number, node data]
*/
Gcapp.text_search_nodes = function(std, str) {
    let n = 0;
    
    // TODO: this grossly assumes that node.data are constructed using 
    // the to_obj transformer
    return std.dfs((node, found) => {
        if (JSON.stringify(node.data).includes(str)) {
            found.push([n, node.data]);
        }
        
        n += 1;
    });
}

/**
* Compute the asymmetric difference between Gcntree A and Gcntree B
* @static
* @param {Gcntree} a - Gcntree A
* @param {Gcntree} b - Gcntree B
* @returns {Array} set of node data representing the asymmetric difference
*/
Gcapp.asymdif = function(a, b) {
    // TODO: this is O(a * b), right? and it's always worst case bc we don't terminate DFS early
    return a.dfs((node, bad_nodes) => {
        const hash_a = Gcapp.dhash(node.data);
        let found = false;

        b.dfs((node, data) => {
            const hash_b = Gcapp.dhash(node.data);

            if (hash_a === hash_b) {
                found = true;
            }
        });

        if (!found) {
            bad_nodes.push(node.data);
        }
    });
}

/**
* Create a vector map from a standard
* @static
* @param {Gcntree} std - the standard to derive mappings from
* @param {Array.<Array>} nums - a 2D array of absolute node numbers, where the array at nums[i] corresponds to the ith 
* vector name returned by {@link module:gcapp~Gcapp.get_vector_names}
* @param {string=} name - name for the vector map
* @returns {module:gctax_vec_map~Gctax_vec_map}
*/
Gcapp.make_vec_map = function(std, nums = [], name = "") {
    const vecs = Gcapp.get_vector_names();

    // Very basic validation - are there as many columns as we have vectors?
    if (nums.length !== vecs.length) {
        throw new Error("Vectors length mismatch");
    }
    
    const vec_map = new Gctax_vec_map({name: name});

    nums.forEach((num_arr, i) => {
        num_arr.forEach(num => vec_map.add_link(vecs[i], Gcapp.get_node_hash(std, num)));
    });

    return vec_map;
}

/**
* Write a vector map to disk in YML format
* @static
* @param {module:gctax_vec_map~Gctax_vec_map} vec_map - the vector map to write
* @param {string} notes - data for the notes field
* @returns {string} output path
*/
Gcapp.write_vec_map_ext = function(vec_map, notes = "") {
    const output = {
        vec_map: vec_map.name,
        notes: notes,
        vecs: Array.from(vec_map.data.entries()).map((entry) => {
            return {
                vec_name: entry[0], 
                hash_list: entry[1].map(hash => Object.fromEntries([["hash", hash]]))
            };
        }) 
    };

    const output_path = `${process.cwd()}/../../out/vec_map_${Date.now()}.yml`;
    
    // TODO: what happens on error?
    fs.writeFileSync(output_path, yaml.dump(output));
    return output_path;
}

/**
* Load a vector map from a YML file
* @static
* @param {string} path - path to a vector map in YML format
* @returns {module:gctax_vec_map~Gctax_vec_map}
*/
Gcapp.load_vec_map_ext = function(path) {
    // TODO: what happens if errors?
    const doc = fs.readFileSync(path, {encoding: "utf8"});
    const json = yaml.safeLoad(doc, "utf8");

    if (!Gctax_vec_map.is_valid(json)) {
        throw new Error(`${path} is not a valid vector map`);
    }
    
    // TODO: We enforce a simple rule: any vector map file must have exactly the same vector vocabulary
    // as the currently running version of GC - however, it may instead be preferable to allow 
    // files which have a valid subset of our vector vocabulary...
    const system_vecs = new Set(Gcapp.get_vector_names());
    const present_vecs = json.vecs.map(vec => vec.vec_name) 
    
    if (present_vecs.length !== system_vecs.size || !present_vecs.every(vec => system_vecs.has(vec))) {
        throw new Error(`${path} is a mismatch for system vectors`);
    }
    
    const vec_map = new Gctax_vec_map({name: json.vec_map});
    json.vecs.forEach(vec => vec.hash_list.forEach(hash => vec_map.add_link(vec.vec_name, hash.hash))); 
    return vec_map;    
}

/**
* Create an evaluation set from a standard
* @static
* @param {Gcntree} std - the standard to derive evaluations from
* @param {Array.<number>} nums - nodes to include, as absolute node numbers
* @param {string=} name - name for the evaluation set
* @returns {module:gcstd_eval~Gcstd_eval}
*/
Gcapp.make_eval_set = function(std, nums = [], name = "") {
    if (nums.length === 0) {
        throw new Error("You must specify at least one node to create an evaluation set");
    }

    return Gcstd_eval.from_nodes({std: std, nums: nums, name: name});
}

/**
* Write an evaluation set to disk in YML format
* @static
* @param {module:gcstd_eval~Gcstd_eval} es - the evaluation set to write
* @param {string} notes - data for the notes field
* @returns {string} output path
*/
Gcapp.write_eval_set_ext = function(es, notes = "") {
    const output = {
        eval: es.name,
        notes: notes,
        set: Array.from(es.set.values()).map(hash => Object.fromEntries([["hash", hash]]))
    };
    
    const output_path = `${process.cwd()}/../../out/eval_set_${Date.now()}.yml`;
    
    // TODO: what happens on error?
    fs.writeFileSync(output_path, yaml.dump(output));
    return output_path;
}

/**
* Load an evaluation set from a YML file
* @static
* @param {string} path - path to an evaluation set in YML format
* @returns {module:gcstd_eval~Gcstd_eval}
*/
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

/** 
* Load a testable entity from a YML file
* @static
* @param {string} path - path to a testable entity in YML format
* @returns {module:gctax_tent~Gctax_tent}
*/
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

/**
* Load a group from a YML file
* @static
* @param {string} path - path to a group in YML format (assumes relative pathnames)
* @returns {module:gctax_group~Gctax_group}
*/
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

/**
* Load a standard from a YML file
* @static
* @param {string} std_path - path to a standard in YML format
* @param {string=} schema_path - path to a standard schema for validation (if the schema module exports multiple objects, the 0th is consdered the parent and the following are registered as children)
* @returns {Gcntree}
*/
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

/**
* Load a standard schema (in jsonschema format) from disk
* @static
* @param {string} path - path to an importable JavaScript module
* @returns {Object} a jsonschema object
*/
Gcapp.load_schema_ext = async function(path) {
    const sch = await import(path);
    return sch.default;
}

/**
* Generate a testplan from YML files
* @static
* @param {string} sub_path - path to a testable entity OR group in YML format
* @param {string} std_path - path to a standard in YML format
* @param {string} vec_map_path - path to a vector map in YML format
* @param {string} eval_path - path to an evaluation set in YML format
* @returns {Gcapp_tp_res}
*/
Gcapp.testplan_ext = function(subj_path, std_path, vec_map_path, eval_path) {
    if (!subj_path || !std_path || !vec_map_path) {
        throw new Error("Missing path");
    }
    
    const vec_map = Gcapp.load_vec_map_ext(vec_map_path);
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

/**
* Compute the absolute node numbers for one part of a standard file (in YML format).
* To get part IDs for a standard, see {@link module:gcapp~Gcapp.get_nonscalar_keys}
* @static
* @see module:gcapp~Gcapp.get_nonscalar_keys
* @param {string} std_path - path to a standard in YML format
* @param {string} sch_path - path to the standard schema for standard std_path
* @param {number} part_id - part ID
* @returns {Object} wraps node numbers and associated metadata, see source code
*/
Gcapp.num_ext = async function(std_path, sch_path, part_id) {
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

/**
* Find the symmetric difference between the sets of nodes in two external standard files, expressed as reciprocal asymmetric differences.
* Note that identical standards and permuted standards will return the same result
* @static
* @param {string} path1 - path to standard A in YML format
* @param {string} path2 - path to standard B in YML format
* @param {string} sch_path - path to the standard schema for both standards
* @returns {Object} wraps asymmetric differences, see source code
*/
Gcapp.cmp_ext = async function(path1, path2, sch_path) {
    const doca_tree = await Gcapp.load_std_ext(path1, sch_path);
    const docb_tree = await Gcapp.load_std_ext(path2, sch_path);

    // TODO: This is asymptotically stupid, we should write a function to compare both trees simultaneously
    const bada = Gcapp.asymdif(doca_tree, docb_tree);
    const badb = Gcapp.asymdif(docb_tree, doca_tree);

    return {
        a: bada,
        b: badb
    };
}

/**
* Validate an external standard file against a standard schema
* @static
* @param {string} std_path - path to a standard in YML format
* @param {string} sch_path - path to the standard schema for standard std_path
* @returns {boolean} true if the standard is a valid instance of schema sch_path
*/
Gcapp.valid_ext = async function(std_path, sch_path) {
    // TODO: it'd be nice to emit the errors found in invalid standards, but we gotta refactor load_std_ext to return em
    // also TODO: this doesn't discern between an invalid path and an invalid schema
    try {
        await Gcapp.load_std_ext(std_path, sch_path);
        return true;
    } catch(err) {
        return false;
    }
}

/**
* Find which elements of an external evaluation set are resolved for a given external standard
* @static
* @param {string} eval_path - path to an evaluation set in YML format
* @param {string} std_path - path to a standard in YML format
* @returns {Object} wrapper for resolved parts and associated metadata, see source code
*/
Gcapp.checkset_ext = async function(eval_path, std_path) {
    const ev = Gcapp.load_eval_set_ext(eval_path);
    const doctree = await Gcapp.load_std_ext(std_path);

    const parts = new Map();
    let n = 0;

    doctree.dfs((node, data) => {
        const node_hash = Gcapp.dhash(node.data);

        if (ev.set.has(node_hash)) {
            parts.set(node_hash, node.data);
        }

        n += 1;
    });

    const h = Array.from(parts.values()).every((obj, i, arr) => {
        return Object.keys(obj)[0] === Object.keys(arr[0])[0];
    });

    if (!h) {
        throw new Error(`Illegal evaluation set - ${eval_path} is non-homogeneous`);
    }

    const found_hashes = Array.from(parts.keys());
    const unresolved = Array.from(ev.set.values()).filter(node_hash => !found_hashes.includes(node_hash));
    
    return {
        resolved: Array.from(parts.values()),
        unresolved: unresolved,
        total_evals: ev.set.size,
        total_nodes: n
    };
}


/**
* Initialize this instance of Gcapp. Must be executed before a new Gcapp object is ready for use
*/
Gcapp.prototype.init = async function() {
    Gclog.log(`[GCAPP] Initializing Ground Control kernel ${this.id}...`);
    await Promise.all(this.data_modules.map(module => module.init()));
}

/**
* Return a list of the data modules associated with this instance of Gacpp
* @returns {Array.<Gcstore>} a list of data modules
*/
Gcapp.prototype.get_data_modules = function() {
    return this.data_modules;
}

module.exports = Gcapp;
