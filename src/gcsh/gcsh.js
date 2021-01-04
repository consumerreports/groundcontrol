


// In the future, gcsh should call high level API functions from Gcapp, which should call lower level
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
const gcgroup_schema = require("../gctax/schemas/gcgroup_schema.js");
const gctent_schema = require("../gctax/schemas/gctent_schema.js");

const gc = require("../gcutil/gcconfig.js");
const Gcapp = require("../gcapp/gcapp.js");
const gcutil = require("../gcutil/gcutil.js");
const gcstd = require("../gcstd/gcstd.js");
const gctax = require("../gctax/gctax.js");
const Gcntree = require("../gctypes/gcntree/gcntree.js");
const Gceval = require("../gcstd/gceval.js");
const Gcvec_map = require("../gctax/gcvec_map.js");

const Gcstore_gs = require("../gcdata/store/gcstore_gs.js");

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
    ["checkset", _checkset],
    ["clear", _clear],
    ["fnum", _fnum],
    ["grinfo", _grinfo],
    ["help", _help],
    ["io", _io],
    ["leval", _leval],
    ["lent", _lent],
    ["lsch", _lsch],
    ["lstd", _lstd],
    ["fvalid", _fvalid],
    ["fcmp", _fcmp],
    ["parts", _parts],
    ["testplan", _testplan],
    ["vecs", _vecs],
    ["debug", _debug] // TODO: Delete me!
]);

// Terminal colors
const C = {
    BRIGHT: "\x1b[1m",
    RESET: "\x1b[0m"
};

// Construct + init a new instance of the API, make it use the google sheets I/O module
const app = new Gcapp({data_modules: [new Gcstore_gs()]});
let rl = null;

app.init().then(() => {
    rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: PROMPT
    });

    rl.on("line", input_handler);

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
});

// TODO: delete me
// here we're just making some Gceval objects in the global scope that we can use to simulate having some in a data store
const doc = fs.readFileSync("../../temp/ds_103020.yml", {encoding: "utf8"});
const ymldoc = yaml.safeLoad(doc, "utf8");
const doc_tree = Gcntree.from_json_doc(ymldoc, Gcntree.trans.to_obj);
const data_security_eval = new Gceval({name: "Data Security", std: doc_tree, nums: [333, 336, 339, 342, 345, 348, 352, 355, 358, 361, 364, 369, 372, 375, 378, 386, 394, 404, 412, 415, 418, 421, 424, 427, 435]});

// And here we're creating a vector map that we can use to simulate having a vector map loaded in the data store
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
		console.log(`Error: ${err.message}`);
	}
}

// TODO: delete me!
async function _debug() {
    // https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets/sheets#Sheet

    // https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets/cells#CellData

    // https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets/other#ExtendedValue

     const val = {
        properties: {
            title: "Hi i'm a test spreadsheet"
        }, 
        sheets: [
            {
                properties: {
                    title: "i'm a test sheet title"
                },
                data: [
                    {
                        startRow: 0,
                        startColumn: 0,
                        rowData: [
                            {
                                values: [
                                    {userEnteredValue: {stringValue: "Test cell foo"}},
                                    {userEnteredValue: {stringValue: "Test cell bar"}},
                                    {userEnteredValue: {stringValue: "Test cell baz"}} 
                                ]
                            },
                            {
                                values: [
                                    {userEnteredValue: {numberValue: 31337}},
                                    {userEnteredValue: {numberValue: 0.31337}},
                                    {userEnteredValue: {numberValue: 31337.31337}}
                                ]
                            }
                        ],
                        rowMetadata: [
                            {
                            
                            }
                        ],
                        columnMetadata: [
                            {

                            }
                        ]
                    }
                ]
            }
        ]
     };

    const res = await app.data_modules[0].put("imakey", val);
}

// Display the meaningful parts of a given standard schema. These are the parts you reference for fnum, and eventually
// when creating a Gceval object...
function _parts(id) {
    // Lol... since we're faking this one standard schema (ID: 'ds'), every other schema ID is currently not found
    if (id !== "ds") {
        throw new Error("Invalid schema ID");
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
        throw new Error("Missing path");
    }
    
    // Lol... since we're faking this one standard schema (ID: 'ds'), every other schema ID is currently not found
    if (sch_id !== "ds") {
        throw new Error("Invalid schema ID");
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
        // we should prob wrap this in an API layer function like Gcapp.enumerate_nodes()
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
        throw new Error(err.message);
    }
}

function _io() {
    app.get_data_modules().forEach((module, i) => {
        console.log(`${i}: ${module.type}`);
    });   
}

async function _testplan(subj_path, std_path, eval_id) {
    // TODO: This function should prob let you specify a vector mapping? The help text currently says it
    // uses the default vector mapping... for now, let's just load the vector map we created in the global scope for testing
    const vec_map = cr_vec_map;
    
    if (!subj_path || !std_path) {
        throw new Error("Missing path");
    }

    // TODO: lol, we only have one evaluation set, so if the eval_id doesn't match it, be an error
    if (eval_id !== "datasec") {
        throw new Error("Invalid evaluation set ID");
    }
    
    // Load the test evaluation set we created in the global scope
    const eval_set = data_security_eval;
    
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
            if (eval_set.set.has(node_hash)) {
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
    
    if (is_group) {
        console.log(`\nGROUP: '${subj.name}' (${subj.tents.map(tent => tent.name).join(", ")})`);
    } else {
        console.log(`\nENTITY: '${subj.name}'`);
    }

    console.log(`EVALUATION SET: '${eval_set.name}'`);
    console.log(`STANDARD: ${std_path}`);
    
    console.log(`VECTORS: ${vecs_to_evaluate.length} ${is_group ? "in common" : ""}`);
    // console.log(`TOTAL EVALUATIONS REQUIRED: ${total_evals}\n`);

    console.log(`Evaluation set '${eval_set.name}' selects ${selected_evals} of ${total_evals} possible evaluations:\n`); 
    
    vecs_to_evaluate.forEach((vec, i) => {
        console.log(`${vec} => ${vec_coverage[i].reduce((acc, bool) => { return acc + (bool ? 1 : 0)}, 0)}/${vec_coverage[i].length}`);
    });

    console.log(`\n'${eval_set.name}' includes ${Array.from(eval_set.set.values()).length - selected_evals} evaluations which do not apply to '${subj.name}'`);
       
    // Associate selected hashes with their vec names   
    const a = new Map(vecs_to_evaluate.map((vec) => {
        return vec_map.get_links(vec).filter((hash) => {
            return eval_set.set.has(hash);
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
    
    if (unfound.length === 0) {
        console.log(`\nSUCCESS: All ${a.size} links were resolved in ${std_path}\n`);
    } else {
        console.log(`\nWARNING: ${unfound.length} links were not resolved in ${std_path}\n`);
    }
    
    console.log("Press any key to view the test plan...");
    await press_any_key();

    console.log("*************");
    console.log("* TEST PLAN *");
    console.log("*************");

    Array.from(b.entries()).forEach((keyval) => {
        console.log(`\n${keyval[0]}`);

        keyval[1].forEach((node_info) => {
            console.log(node_info.node_num);
            console.log(node_info.std_txt);
        });
    });
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

function _grinfo(path) {
    if (!path) {
        throw new Error("Missing path");
    }

    const group = Gcapp.load_group_ext(path);

    console.log(`${group.name}`);
    console.log(`(${group.notes})\n`);
    
    group.tents.forEach((tent, i) => {
        console.log(`${i}: ${tent.name}`);
        console.log(`(${tent.vecs.length} vectors)\n`);
    });
    
    const common = gctax.get_common_vecs(group.tents);
    console.log(`This group contains ${group.tents.length} testable entities which share ${common.length} common vectors:\n`);
    common.forEach(str => console.log(str));
}

// TODO: it'd be cool if the GRAMMAR hashmap kept a lil help string for each token, and so we could automatically build the help menu by
// iterating through the map instead of hardcoding it here
function _help() {
    console.log("+-----------+");
    console.log("| gsch help |");
    console.log("+-----------+\n");
    console.log(`${C.BRIGHT}checkset [eval ID] [path]\n${C.RESET}Apply an evaluation set against an external standard file (in YAML format) and show resolved links\n\n`);
    console.log(`${C.BRIGHT}clear\n${C.RESET}Clear screen\n\n`);  
    
    console.log(`${C.BRIGHT}fnum [path] [schema ID] [part ID]\n${C.RESET}Show the enumerations for part of an external standard file (in YAML format)\n\n`);
    
    console.log(`${C.BRIGHT}fcmp [path1] [path2] [schema ID]\n${C.RESET}Compare two external standard files (in YAML format) and display the diff if any\n\n`);
    
    console.log(`${C.BRIGHT}fvalid [path] [schema ID]\n${C.RESET}Validate an external standard file (in YAML format) against a standard schema\n\n`); 
    
    console.log(`${C.BRIGHT}grinfo [path]\n${C.RESET}Show info for an external group file (in YAML format)\n\n`);
    
    console.log(`${C.BRIGHT}io\n${C.RESET}Display the data I/O modules associated with the running instance of Ground Control\n\n`);
    
    console.log(`${C.BRIGHT}leval\n${C.RESET}List all available evaluation sets\n\n`);
    
    console.log(`${C.BRIGHT}lent\n${C.RESET}List all available testable entities\n\n`);
    
    console.log(`${C.BRIGHT}lsch\n${C.RESET}List all available standard schemas\n\n`);
    
    console.log(`${C.BRIGHT}lstd\n${C.RESET}List all available standards\n\n`);
    
    console.log(`${C.BRIGHT}parts [schema ID]\n${C.RESET}Display the meaningful parts of a given standard schema\n\n`);
    
    console.log(`${C.BRIGHT}quit\n${C.RESET}Exit\n\n`);
    
    console.log(`${C.BRIGHT}testplan [subject path] [std path] [eval ID]\n${C.RESET}Show the suite of evaluations that must be performed for a given test subject (either a group or a single testable entity), standard, and evaluation set (using the default vector mapping)\n\n`);
    
    console.log(`${C.BRIGHT}vecs\n${C.RESET}Display the vector names known to this version of Ground Control\n\n`);
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
        throw new Error("Missing path");
    }
    
    // Lol... since we're faking this one standard schema (ID: 'ds'), every other schema ID is currently not found
    if (id !== "ds") {
        throw new Error("Invalid schema ID");
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
        throw new Error(err.message);
    }
}

function _fvalid(path, id) {
    if (!path) {
        throw new Error("Missing path");
    }
    
    // Lol... since we're faking this one standard schema (ID: 'ds'), every other schema ID is currently not found
    if (id !== "ds") {
        throw new Error("Invalid schema ID");
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
        throw new Error(err.message);
    }
}

function _checkset(id, path) {
    if (!path) {
        throw new Error("Missing path");
    }

    // Lol, we're faking this one evaluation set, so every other evaluation set ID is currently not found
    if (id !== "datasec") {
        throw new Error("Invalid evaluation set ID");
    }
    
    // TODO: the data_security_eval object is defined in the global scope for demo purposes,
    // it's the Gceval object we imagine being associated with the ID 'datasec'
    const ev = data_security_eval;
    
    try {
        const doc = fs.readFileSync(path, {encoding: "utf8"});
        const doctree = Gcntree.from_json_doc(yaml.safeLoad(doc, "utf8"), Gcntree.trans.to_obj);
        
        const parts = new Map();
        let n = 0;

        doctree.dfs((node, data) => {
            const node_hash = gc.DEFAULT_HASH(node.data);

            if (ev.set.has(node_hash)) {
                parts.set(node_hash, node.data);
            }

            n += 1
        });
        
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
        
        // unresolved holds any node hashes specified by the evaluation set that we didn't find in the standard
        const found_hashes = Array.from(parts.keys());
        const unresolved = Array.from(ev.set.values()).filter(node_hash => !found_hashes.includes(node_hash));

        if (unresolved.length === 0) {
            console.log(`SUCCESS: All ${ev.set.size} links were resolved in ${path}!`);
        } else {
            console.log(`WARNING: ${unresolved} links could not be resolved in ${path}!`);
        }
    } catch(err) {
        throw new Error(err.message);
    }
}

async function input_handler(input) {
    if (input.length > 0) {
        await _on_input(input);  
    }

    rl.prompt();
}

function press_any_key() {
    return new Promise((resolve, reject) => {
        rl.removeListener("line", input_handler);
        
        rl.once("line", () => {
            rl.on("line", input_handler);
            resolve();
        });
    });
}
