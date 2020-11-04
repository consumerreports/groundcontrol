"use strict";

// In the future, gcsh should call high level API functions from gcapp, which should call lower level
// functions from gcstd and gctax... but since we're not implementing a data I/O layer for the prototype,
// we're not really implementing any of the modules the way they're meant to be implemented. so all
// the gcsh functions are just stubs that will need to be replaced...
// ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Put another way, this is just a demo for what gcsh could eventually become...

const readline = require("readline");
const util = require("util");
const yaml = require("js-yaml");
const fs = require("fs");
const Validator = require("jsonschema").Validator;
const ds_schema = require("../../temp/schemas/ds.js");

const gc = require("../gcutil/gcconfig.js");
const gcapp = require("../gcapp/gcapp.js");
const gcutil = require("../gcutil/gcutil.js");
const gcstd = require("../gcstd/gcstd.js");
const gctax = require("../gctax/gctax.js");
const Gcntree = require("../gctypes/gcntree/gcntree.js");
const Gceval = require("../gcstd/gceval.js");
const Gcvec_map = require("../gctax/gcvec_map.js");

const v = new Validator();

// register all the split schemas with the validator
v.addSchema(ds_schema.ds_label, "/ds_label");
v.addSchema(ds_schema.ds_eval, "/ds_eval");
v.addSchema(ds_schema.ds_crit, "/ds_crit");
v.addSchema(ds_schema.ds_ind, "/ds_ind");
v.addSchema(ds_schema.ds_proc, "/ds_proc");

const PROMPT = "gcsh > ";

const GRAMMAR = new Map([
    ["quit", _quit],
    ["clear", _clear],
    ["fnum", _fnum],
    ["help", _help],
    ["leval", _leval],
    ["lent", _lent],
    ["lsch", _lsch],
    ["lstd", _lstd],
    ["fvalid", _fvalid],
    ["fcmp", _fcmp],
    ["parts", _parts],
    ["vecs", _vecs],
    ["whatset", _whatset],
    ["debug", _debug] // TODO: Delete me!
]);

// TODO: delete me
// here we're just making some Gceval objects in the global scope that we can use to simulate having some in a data store
const doc = fs.readFileSync("../../temp/ds_103020.yml", {encoding: "utf8"});
const ymldoc = yaml.safeLoad(doc, "utf8");
const doc_tree = Gcntree.from_json_doc(ymldoc, Gcntree.trans.to_obj);
const data_security_eval = new Gceval({std: doc_tree, nums: [333, 336, 339, 342, 345, 348, 352, 355, 358, 361, 364, 369, 372, 375, 378, 386, 394, 404, 412, 415, 418, 421, 424, 427, 435]});

// And here we're creating a vector map that we can use to simulate having a vector map loaded in the data store
const cr_vec_map = new Gcvec_map({name: "Consumer Reports Privacy & Security Testing"});
cr_vec_map.add_link(gc.VECTORS.UI_AUTH, gcapp.get_node_hash(doc_tree, 311));
cr_vec_map.add_link(gc.VECTORS.PW_COMPLEXITY, gcapp.get_node_hash(doc_tree, 357));
cr_vec_map.add_link(gc.VECTORS.PW_COMPLEXITY, gcapp.get_node_hash(doc_tree, 360));
cr_vec_map.add_link(gc.VECTORS.PW_COMPLEXITY, gcapp.get_node_hash(doc_tree, 363));
cr_vec_map.add_link(gc.VECTORS.UI_AUTH, gcapp.get_node_hash(doc_tree, 342));
cr_vec_map.add_link(gc.VECTORS.PW_COMPLEXITY, gcapp.get_node_hash(doc_tree, 352));
cr_vec_map.add_link(gc.VECTORS.NOTIFICATION_MECHANISM, gcapp.get_node_hash(doc_tree, 369));
cr_vec_map.add_link(gc.VECTORS.NOTIFICATION_MECHANISM, gcapp.get_node_hash(doc_tree, 372));
cr_vec_map.add_link(gc.VECTORS.ATTACK_PROTECTION, gcapp.get_node_hash(doc_tree, 378));
cr_vec_map.add_link(gc.VECTORS.ENCRYPTION, gcapp.get_node_hash(doc_tree, 386));
cr_vec_map.add_link(gc.VECTORS.KNOWN_VULNERABILITY_CVE_CHECKS, gcapp.get_node_hash(doc_tree, 394));
cr_vec_map.add_link(gc.VECTORS.AUTO_SECURITY_UPDATES, gcapp.get_node_hash(doc_tree, 418));
cr_vec_map.add_link(gc.VECTORS.SECURITY_UPDATE_NOTIFICATION, gcapp.get_node_hash(doc_tree, 421));

// Below is a case where an indicator actually has multiple indicators concatenated together as one long string; node #386 holds
// indicators that cover DS parts S.4.1.2 and S.4.1.1 and it looks like a few more -- not sure what to do with these, so 
// we're just skipping them
// cr_vec_map.add_link(gc.VECTORS.ENCRYPTION_SI_STORAGE, gcapp.get_node_hash(doc_tree, 386));  

async function _on_input(input) {
	const tok = input.trim().split(" ");
	const f = GRAMMAR.get(tok[0]);

	if (!f) {
		console.log(`Bad command ${tok[0]}`);
		return;
	}

	try {
		await f(...tok.slice(1));
	} catch (err) {
		console.log(`Fatal error ${err}`);
	}
}

// TODO: delete me!
function _debug() {
    const doc = fs.readFileSync("/home/noah/work/groundcontrol/temp/ds_unified.yml", {encoding: "utf8"});
    const ymldoc = yaml.safeLoad(doc, "utf8");
    const doc_tree = Gcntree.from_json_doc(ymldoc, Gcntree.trans.to_obj);
    
    

    let n = 0;

    doc_tree.dfs((node, data) => {
        if (n === 445) {
            while (node !== null) {
                console.log(gcutil.inspect(node), 100);
                node = node.parent;
            }
        }

        n += 1;
    });
}

// Display the meaningful parts of a given standard schema. These are the parts you reference for fnum, and eventually
// when creating a Gceval object...
function _parts(id) {
    // Lol... since we're faking this one standard schema (ID: 'ds'), every other schema ID is currently not found
    if (id !== "ds") {
        console.log("Error: invalid schema ID");
        return;
    }
    
    // TODO: to avoid presenting the user with every single part of a standard schema, we  hypothesize that the 
    // "meaningful" parts of a standard schema are its nonscalar values, see get_nonscalar_keys for a deeper discussion
    const keys = gcstd.get_nonscalar_keys(ds_schema);
    
    if (keys.length === 0) {
        console.log("No meaningful parts found!");
        return;
    }
    
    keys.forEach((key, i) => {
        console.log(`${i}: ${key}`);
    });
}

// Display the enumerations for only part of an external standard file, where the part is defined using the method in
// the 'parts' command
function _fnum(path, sch_id, part_id) {
    if (!path) {
        console.log("Error: missing path");
        return;
    }
    
    // Lol... since we're faking this one standard schema (ID: 'ds'), every other schema ID is currently not found
    if (sch_id !== "ds") {
        console.log("Error: invalid schema ID");
        return;
    }
    
    try {
        // First get the prop name for the part code we're interested in
        const keys = gcstd.get_nonscalar_keys(ds_schema);
        
        if (part_id < 0 || part_id > keys.length - 1) {
            throw new Error(`Part ID out of range for standard schema ${sch_id}`);
        }

        const prop = keys[part_id];

        // Now load the standard file and transform to a Gcntree
        const doc = fs.readFileSync(path, {encoding: "utf8"});
        const ymldoc = yaml.safeLoad(doc, "utf8");
        const doc_tree = Gcntree.from_json_doc(ymldoc, Gcntree.trans.to_obj);
        
        // TODO: we've decided that a standard's nodes are canonically enumerated using DFS preorder traversal
        // we should prob wrap this in an API layer function like gcapp.enumerate_nodes()
        let tnodes = 0;
        let snodes = 0;
        
        doc_tree.dfs((node, data) => {
            // TODO: this is a brittle and bad way to discern between different kinds of nodes
            // We really need a wrapper class for nodes which lets them reflect their type,
            // and the set of node types is determined by the standard schema (that means that
            // we need a higher order function for constructing a Gcntree from a ymldoc AND a standard schema)
            if (node.parent && node.parent.data === prop && typeof node.data !== "string") {
                const path = [];
                let pnode = node.parent;

                while (pnode !== null) {
                    if (pnode.parent && keys.includes(pnode.parent.data)) {
                        path.push(pnode.data);
                    }

                    pnode = pnode.parent;
                }
                
                // TODO: we make a gross assumption that all the node.data we've collected will be formatted
                // as an object as specified by Gcntree.trans.to_obj -- this is brittle and bad. This can be
                // eliminated if we implement a wrapper class for Gcntree node data...
                let pathstr = "VIA: ";

                path.reverse().forEach((hop) => {
                    pathstr += `${Object.values(hop)[0]} / `;
                });
                
                console.log(tnodes);
                console.log(node.data);
                console.log(`${pathstr.substr(0, pathstr.length - 2)}\n\n`);
                snodes += 1;
            }

            tnodes += 1;
        });

        console.log(`Done! ${path} has ${snodes} '${prop}' (part ID ${part_id}) out of ${tnodes} total nodes.`);
    } catch (err) {
        console.log(`Error: ${err.message}`);
    }
}

function _quit() {
    console.log("Bye!");
    process.exit();
}

function _clear() {
    console.clear();
}

function _vecs() {
    gctax.get_vector_names().forEach((vec) => {
        console.log(vec);
    });
}

// TODO: it'd be cool if the GRAMMAR hashmap kept a lil help string for each token, and so we could automatically build the help menu by
// iterating through the map instead of hardcoding it here
function _help() {
    console.log("+-----------+");
    console.log("| gsch help |");
    console.log("+-----------+\n");
    console.log("COMMAND\t\t\t\t\tRESULT");
    console.log("clear\t\t\t\t\tClear screen\n"); 
    console.log("fnum [path] [schema ID] [part ID]\tShow the enumerations for part of an external standard file (in YAML format)\n")
    console.log("fcmp [path1] [path2] [schema ID]\tCompare two external standard files (in YAML format) and display the diff if any\n");
    console.log("fvalid [path] [schema ID]\t\tValidate an external standard file (in YAML format) against a standard schema\n"); 
    console.log("leval\t\t\t\t\tList all available evaluation sets\n");
    console.log("lent\t\t\t\t\tList all available testable entities\n");
    console.log("lsch\t\t\t\t\tList all available standard schemas\n");
    console.log("lstd\t\t\t\t\tList all available standards\n");
    console.log("parts [schema ID]\t\t\tDisplay the meaningful parts of a given standard schema\n");
    console.log("quit\t\t\t\t\tExit\n");
    console.log("vecs\t\t\t\t\tDisplay the vector names known to this version of Ground Control\n");
    console.log("whatset [path] [eval ID]\t\tShow what set of parts applies for a given evaluation set and external standard file (in YAML format)");
}

// TODO: in "the future," leval would grab all the evaluation sets in the currently defined data store... for now, we're just
// faking some by creating some Gceval objects in the global scope
function _leval() {
    console.log("ID\t\t\t\t\t\t\tNAME");
    console.log("datasec\t\t\t\t\t\t\tData Security");
}

function _lent() {
    console.log("Oops! I don't do anything yet. Email noah.levenson@consumer.org about this!");
}

// TODO: in "the future," lsch would query some method at the data I/O layer to retrieve all the standard schemas in the currently
// defined data store... for this demo, we're faking a world where there's one standard schema in the data store and its ID is 'ds'
function _lsch() {
    console.log("ID\t\t\t\t\t\t\tNAME");
    console.log("ds\t\t\t\t\t\t\tCR Digital Standard Schema");
}

function _lstd() {
    console.log("Oops! I don't do anything yet. Email noah.levenson@consumer.org about this!");
}
// Compare two Gcntrees and return an array of the nodes found in tree a that were not found in tree b (node order is irrelevant)
// TODO: this is O(a * b), right? and it's always worst case because we don't have a mechanism to terminate DFS early
// here's a way we could beat that:  create a binary search tree of the hashes of each of the nodes in tree b -- now by hashing 
// each node in tree a, you can check if that node is in tree b in O(h) -- maybe setup costs ain't worth it tho...
function _tree_node_compare(a, b) {
    const bad_nodes = [];

    a.dfs((node, data) => {
        const hasha = gc.DEFAULT_HASH(node.data);
        let found = false;
        
        b.dfs((node, data) => {
            const hashb = gc.DEFAULT_HASH(node.data);
            
            if (hasha === hashb) {
                found = true;
            }
        });
        
        if (!found) {
            bad_nodes.push(node.data);
        }
    });

    return bad_nodes;
}

function _fcmp(path1, path2, id) {
    if (!path1 || !path2) {
        console.log("Error: missing path");
        return;
    }
    
    // Lol... since we're faking this one standard schema (ID: 'ds'), every other schema ID is currently not found
    if (id !== "ds") {
        console.log("Error: invalid schema ID");
        return;
    }

    try {
        const doca = fs.readFileSync(path1, {encoding: "utf8"});
        const docb = fs.readFileSync(path2, {encoding: "utf8"});
        const ymldoca = yaml.safeLoad(doca, "utf8");
        const ymldocb = yaml.safeLoad(docb, "utf8");

        const resa = v.validate(ymldoca, ds_schema.ds, {nestedErrors: true});
        
        if (resa.errors.length !== 0) {
            throw new Error(`file ${path1} is not a correct instance of standard schema ${id}. Run fvalid.`);
        }

        const resb = v.validate(ymldocb, ds_schema.ds, {nestedErrors: true});

        if (resb.errors.length !== 0) {
            throw new Error(`file ${path2} is not a correct instance of standard schema ${id}. Run fvalid.`);
        }
        
        const doca_tree = Gcntree.from_json_doc(ymldoca, Gcntree.trans.to_obj);
        const docb_tree = Gcntree.from_json_doc(ymldocb, Gcntree.trans.to_obj);
            
        const hash1 = gc.DEFAULT_HASH(doca_tree);
        const hash2 = gc.DEFAULT_HASH(docb_tree);

         if (hash1 === hash2) {
            console.log(`Files are identical! SHA256: ${hash1}`);
            return;
        }
       
        // This is asymptotically stupid -- we can write a much more optimal algorithm that compares both trees simultaneously
        const bada = _tree_node_compare(doca_tree, docb_tree);
        const badb = _tree_node_compare(docb_tree, doca_tree);
        
        // It's currently assumed that the order of procedures is irrelevant -- that is, every test is a discrete
        // action that can be performed before or after any other test. Accordingly, the sequence of tests belonging
        // to a standard can be permuted without having any effect on their results -- so even in the rare case that
        // a procedure is reassigned under a different indicator, it shouldn't be considered a "change" in the test suite.
        // This assumption informs the design of fcmp: to minimize noise, we only tell the user which nodes are disjoint.
        // If two trees are sequential permutations of an identical set of nodes, we alert the user but show no diff.
        // TODO: We may discover through use that this is not desirable; users may more often want to see when and how parts of
        // a standard have been rearranged, if not actually edited for content.
        
        if (bada.length === 0 && badb.length === 0) {
            console.log(`Permutation: file ${path1} has the same nodes as file ${path2}, but in a different order.`);
            return;
        }

        bada.forEach((node) => {
            console.log(`File ${path2} did not have this node:`);
            console.log(node);
        });

        badb.forEach((node) => {
            console.log(`\nFile ${path1} did not have this node:`);
            console.log(node);
        });
    } catch(err) {
        console.log(`Error: ${err.message}`);
    }
}

function _fvalid(path, id) {
    if (!path) {
        console.log("Error: missing path");
        return;
    }
    
    // Lol... since we're faking this one standard schema (ID: 'ds'), every other schema ID is currently not found
    if (id !== "ds") {
        console.log("Error: invalid schema ID");
        return;
    }

    try {
        const doc = fs.readFileSync(path, {encoding: "utf8"});
        const ymldoc = yaml.safeLoad(doc, "utf8");

        // TODO: in "the future," we'd want a simple abstraction around jsonschema so we're not so tightly coupled to it
        const res = v.validate(ymldoc, ds_schema.ds, {nestedErrors: true});    
        
        if (res.errors.length === 0) {
            console.log(`VALID: ${path} is a correct instance of standard schema ${id}!`);
        } else {
            console.log(`INVALID: ${path} has errors:\n\n${res.errors}`);
        }
    } catch(err) {
        console.log(`Error: ${err.message}`);
    }
}

function _whatset(path, id) {
    if (!path) {
        console.log("Error: missing path");
        return;
    }

    // Lol, we're faking this one evaluation set, so every other evaluation set ID is currently not found
    if (id !== "datasec") {
        console.log("Error: invalid evaluation set ID");
        return;
    }
    
    // TODO: the data_security_eval object is defined in the global scope for demo purposes,
    // it's the Gceval object we imagine being associated with the ID 'datasec'
    const ev = data_security_eval;
    
    try {
        const doc = fs.readFileSync(path, {encoding: "utf8"});
        const doctree = Gcntree.from_json_doc(yaml.safeLoad(doc, "utf8"), Gcntree.trans.to_obj);
        
        const parts = new Set();
        let n = 0;

        doctree.dfs((node, data) => {
            if (ev.set.has(gc.DEFAULT_HASH(node.data))) {
                parts.add(node.data);
            }

            n += 1
        });
        
        if (parts.size !== ev.set.size) {
            throw new Error(`Evaluation set ${id} is a mismatch for ${path}`); 
        }
            
        const homogeneous = Array.from(parts.values()).every((obj, i, arr) => {
            return Object.keys(obj)[0] === Object.keys(arr[0])[0]
        });
        
        if (!homogeneous) {
            throw new Error(`Illegal evaluation set -- ${id} is non-homogeneous`);
        }

        Array.from(parts.values()).forEach((part) => {
            console.log(part);
        });
        
        console.log(`${id} selects ${parts.size} of ${n} total nodes in ${path}`);
    } catch(err) {
        console.log(`Error: ${err.message}`);
    }
}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: PROMPT
});

rl.on("line", async (input) => {
	if (input.length > 0) {
		await _on_input(input);
	}
	
	rl.prompt();
});

console.log("                                 _                   _             _ ");
console.log("                                | |                 | |           | |");
console.log("  __ _ _ __ ___  _   _ _ __   __| |   ___ ___  _ __ | |_ _ __ ___ | |");
console.log(" / _` | '__/ _ \\| | | | '_ \\ / _` |  / __/ _ \\| '_ \\| __| '__/ _ \\| |");
console.log("| (_| | | | (_) | |_| | | | | (_| | | (_| (_) | | | | |_| | | (_) | |");
console.log(" \\__, |_|  \\___/ \\__,_|_| |_|\\__,_|  \\___\\___/|_| |_|\\__|_|  \\___/|_|");
console.log("  __/ |                                                              ");
console.log(" |___/                                                               ");
console.log("                 Welcome to gcsh. Type 'help' for a list of commands.\n");
rl.prompt();
