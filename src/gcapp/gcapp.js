"use strict";

const yaml = require("js-yaml");
const fs = require("fs");
const p = require("path");
const gc = require("../gcutil/gcconfig.js");
const gctax = require("../gctax/gctax.js");
const Gcapp_tp_res = require("./gcapp_tp_res.js");
const Gctent = require("../gctax/gctent.js");
const Gcgroup = require("../gctax/gcgroup.js");
const Gcvec_map = require("../gctax/gcvec_map.js");
const Gcntree = require("../gctypes/gcntree/gcntree.js");
const gcgroup_schema = require("../gctax/schemas/gcgroup_schema.js");
const gctent_schema = require("../gctax/schemas/gctent_schema.js");
const Validator = require("jsonschema").Validator;

// Gcapp constructor
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

// Generate a testplan from data provded as external YML files
// Returns a Gcapp_tp_res object which wraps a Map where the keys are vector names and 
// the values are arrays where each element is a part of a standard
// TODO: accept a path to an external evaluation set file, not an actual evaluation set object
Gcapp.testplan_ext = function(subj_path, std_path, eval_set) {
    // TODO: This function should prob let you specify a vector mapping? The help text currently says it
    // uses the default vector mapping... for now, let's just load the vector map we created in the global scope for testing
    const vec_map = cr_vec_map;
    
    if (!subj_path || !std_path) {
        throw new Error("Missing path");
    }

    // Deserialize the file for the test subject and determine if it's a tent or a group
    // TODO: this duplicates the validation that occurs in the group and tent loaders, do we care?
    const subj_doc = fs.readFileSync(subj_path, {encoding: "utf8"});
    const subj_obj = yaml.safeLoad(subj_doc, "utf8");
    const v = new Validator();
    let is_group = true;
    let subj = null;

    if (v.validate(subj_obj, gcgroup_schema).errors.length === 0) {
        subj = Gcapp.load_group_ext(subj_path);
    } else if (v.validate(subj_obj, gctent_schema).errors.length === 0) {
        is_group = false;
        subj = Gcapp.load_tent_ext(subj_path);
    } else {
        throw new Error(`${subj_path} doesn't seem to be a group or a testable entity`);
    }
    
    // Load the standard file and transform to a Gcntree
    const doc = fs.readFileSync(std_path, {encoding: "utf8"});
    const ymldoc = yaml.safeLoad(doc, "utf8");
    const doc_tree = Gcntree.from_json_doc(ymldoc, Gcntree.trans.to_obj);
    
    const vecs_to_evaluate = is_group ? gctax.get_common_vecs(subj.tents) : subj.vecs;
    
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
        const vec_name = a.get(gc.DEFAULT_HASH(node.data));

        if (vec_name) {
            b.get(vec_name).push({std_txt: node.data, node_num: n});
            data.push(gc.DEFAULT_HASH(node.data));
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

// Initialize an instance of a Gcapp object - a new Gcapp object isn't ready to use until this has been executed
Gcapp.prototype.init = async function() {
    console.log(`[GCAPP] Initializing Ground Control kernel ${this.id}...`);
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
const cr_vec_map = new Gcvec_map({name: "Consumer Reports Privacy & Security Testing"});
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
