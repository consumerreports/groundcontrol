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

const gcutil = require("../gcutil/gcutil.js");
const Gcntree = require("../gctypes/gcntree/gcntree.js");
const Gceval = require("../gcstd/gceval.js");

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
    ["help", _help],
    ["leval", _leval],
    ["lsch", _lsch],
    ["fvalid", _fvalid],
    ["fcmp", _fcmp],
    ["procs", _procs],
    ["whatset", _whatset]
]);

// TODO: delete me
// here we're just making some Gceval objects in the global scope that we can use to simulate having some in a data store
const doc = fs.readFileSync("../../temp/ds_unified.yml", {encoding: "utf8"});
const ymldoc = yaml.safeLoad(doc, "utf8");
const doc_tree = Gcntree.from_json_doc(ymldoc, Gcntree.trans.to_obj);
const data_security_eval = new Gceval({std: doc_tree, nums: [44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59]});

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

// Enumerate the procedures for a given standard and display the result
// these numbers are what you'll want to reference when creating a Gceval object
function _procs(path) {
    try {
        const doc = fs.readFileSync(path, {encoding: "utf8"});
        const ymldoc = yaml.safeLoad(doc, "utf8");
        const doc_tree = Gcntree.from_json_doc(ymldoc, Gcntree.trans.to_obj);
    
        let num = 0
        
        // TODO: this is a brittle and bad way to determine whether a node is a procedure
        // we should prob introduce a thin wrapper class for nodes with an enum for types
        doc_tree.dfs((node, data) => {
            if (node.parent && node.parent.data === "procedures") {
                console.log(num);
                console.log(node.data);
                console.log();
                num += 1;
            }
        });
    } catch(err) {
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

// TODO: it'd be cool if the GRAMMAR hashmap kept a lil help string for each token, and so we could automatically build the help menu by
// iterating through the map instead of hardcoding it here
function _help() {
    console.log("+-----------+");
    console.log("| gsch help |");
    console.log("+-----------+\n");
    console.log("COMMAND\t\t\t\t\tRESULT");
    console.log("clear\t\t\t\t\tClear screen\n"); 
    console.log("fcmp [path1] [path2] [schema ID]\tCompare two external standard files (in YAML format) and return the diff if any\n");
    console.log("fvalid [path] [schema ID]\t\tValidate an external standard file (in YAML format) against a standard schema\n");
    console.log("leval\t\t\t\t\tList all available evaluation sets\n");
    console.log("lsch\t\t\t\t\tList all available standard schemas\n");
    console.log("procs\t\t\t\t\tDisplay the procedure numbers for an external standard file (in YAML format)\n");
    console.log("quit\t\t\t\t\tExit\n");
    console.log("whatset [path] [eval ID]\t\tShow procedures for a given evaluation set and external standard file (in YAML format)");
}

// TODO: in "the future," leval would grab all the evaluation sets in the currently defined data store... for now, we're just
// faking some by creating some Gceval objects in the global scope
function _leval() {
    console.log("ID\t\t\t\t\t\t\tNAME");
    console.log("datasec\t\t\t\t\t\t\tData Security");
}

// TODO: in "the future," lsch would query some method at the data I/O layer to retrieve all the standard schemas in the currently
// defined data store... for this demo, we're faking a world where there's one standard schema in the data store and its ID is 'ds'
function _lsch() {
    console.log("ID\t\t\t\t\t\t\tNAME");
    console.log("ds\t\t\t\t\t\t\tCR Digital Standard Schema");
}

// Compare two Gcntrees and return an array of the nodes found in tree a that were not found in tree b (node order is irrelevant)
// TODO: this is O(a * b), right? and it's always worst case because we don't have a mechanism to terminate DFS early
// here's a way we could beat that:  create a binary search tree of the hashes of each of the nodes in tree b -- now by hashing 
// each node in tree a, you can check if that node is in tree b in O(h) -- maybe setup costs ain't worth it tho...
function _tree_node_compare(a, b) {
    const bad_nodes = [];

    a.dfs((node, data) => {
        const hasha = gcutil.sha256(JSON.stringify(node.data));
        let found = false;
        
        b.dfs((node, data) => {
            const hashb = gcutil.sha256(JSON.stringify(node.data));
            
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
            
        const hash1 = gcutil.sha256(JSON.stringify(doca_tree));
        const hash2 = gcutil.sha256(JSON.stringify(docb_tree));

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

function _whatset() {

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
