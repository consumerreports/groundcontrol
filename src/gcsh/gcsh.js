"use strict";

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
// We need a reference to a Gcntree representation of a standard so we can create a gceval object for testing
const doc = fs.readFileSync("../../temp/ds_103020.yml", {encoding: "utf8"});
const ymldoc = yaml.safeLoad(doc, "utf8");
const doc_tree = Gcntree.from_json_doc(ymldoc, Gcntree.trans.to_obj);

// Here's a gceval object, "datasec", that we can use for testing
const data_security_eval = new Gceval({name: "Data Security", std: doc_tree, nums: [333, 336, 339, 342, 345, 348, 352, 355, 358, 361, 364, 369, 372, 375, 378, 386, 394, 404, 412, 415, 418, 421, 424, 427, 435]});

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

// TODO: eval_id does nothing here, we always pass the "datasec" test evaluation set
async function _testplan(subj_path, std_path, eval_id) {
    // Just pass the test evaluation set we noobishly created in the global scope
    const eval_set = data_security_eval;
    
    const res = Gcapp.testplan_ext(subj_path, std_path, eval_set);
    
    if (res.is_group) {
        console.log(`\nGROUP: '${res.subj.name}' (${res.subj.tents.map(tent => tent.name).join(", ")})`);
    } else {
        console.log(`\nENTITY: '${res.subj.name}'`);
    }

    console.log(`EVALUATION SET: '${res.eval_set.name}'`);
    console.log(`STANDARD: ${res.std_path}`);
    
    console.log(`VECTORS: ${res.vecs_to_evaluate.length} ${res.is_group ? "in common" : ""}`);
    // console.log(`TOTAL EVALUATIONS REQUIRED: ${total_evals}\n`);

    console.log(`Evaluation set '${res.eval_set.name}' selects ${res.selected_evals} of ${res.total_evals} possible evaluations:\n`); 
    
    res.vecs_to_evaluate.forEach((vec, i) => {
        console.log(`${vec} => ${res.vec_coverage[i].reduce((acc, bool) => { return acc + (bool ? 1 : 0)}, 0)}/${res.vec_coverage[i].length}`);
    });

    console.log(`\n'${res.eval_set.name}' includes ${Array.from(res.eval_set.set.values()).length - res.selected_evals} evaluations which do not apply to '${res.subj.name}'`);
    
    if (res.num_unfound === 0) {
        console.log(`\nSUCCESS: All ${res.num_links} links were resolved in ${res.std_path}\n`);
    } else {
        console.log(`\nWARNING: ${res.num_unfound} links were not resolved in ${res.std_path}\n`);
    }
    
    console.log("Press any key to view the test plan...");
    await press_any_key();

    console.log("*************");
    console.log("* TEST PLAN *");
    console.log("*************");

    Array.from(res.map.entries()).forEach((keyval) => {
        console.log(`\n${keyval[0]}`);

        keyval[1].forEach((node_info) => {
            console.log(node_info.node_num);
            console.log(node_info.std_txt);
        });
    });
    
    // *** GOOGLE SHEETS EXPORT ***
    const gs_api_idxs = app.get_data_modules().map((mod, i) => {
        return {module: mod, idx: i};
    }).filter(module => module.module.type === "GOOGLE SHEETS");
   
    if (gs_api_idxs.length > 0) {
        console.log(`\nExport this test plan to Google Sheets (data I/O module ${gs_api_idxs[0].idx}) Y/N?`);    
        const input = await press_any_key();
        
        if (input.toUpperCase() === "Y") {
            await app.data_modules[0].put("NEW", _testplan_to_gs_workbook(res, std_path));
        }
        
        // TODO: We treat any non-"Y" answer as an "N" -- do we care?
    }
}

// Transform the data structure generated by Gcapp.testplan() into a workbook formatted as a Google sheets resource
// TODO: it's hard to figure out where this function should live; "workbooks" are essentially specically formatted
// exports of test structures (test results without the results yet) that are designed only to live in Google Sheets,
// and are tightly coupled to one version of the Digital Standard. (Since a workbook captures specific parts of the DS,
// beyond just the part of the standard which describes the evaluation to be performed, workbook generation will 
// break if the structure of the DS changes. This also means that workbooks are essentially a feature specific to Consumer
// Reports, and aren't designed to generalize to other standards. Having said all this, we're regarding workbooks 
// a prototype-era escape hatch provided by gcsh while we figure out the right way for Ground Control to structure
// and store test results.
function _testplan_to_gs_workbook(tp, std_path) {
    // Collect all the node numbers in the testplan hashmap into a set
    const node_nums = new Set(Array.from(tp.map.values()).flat().map(obj => obj.node_num));
    
    // Load the standard and transform to a Gcntree 
    const doc = fs.readFileSync(std_path, {encoding: "utf8"});
    const ymldoc = yaml.safeLoad(doc, "utf8");
    const doc_tree = Gcntree.from_json_doc(ymldoc, Gcntree.trans.to_obj);
    
    // Now just DFS inorder traversal through the standard and walk up as necessary to collect our columns
    // Abandon all hope of generality here, we're coupled as tightly as possible to the DS
    let n = 0;
     
    const mat = doc_tree.dfs((node, data) => {
        if (node_nums.has(n)) {
            const uuid = n;
            
            let pnode = node.parent;

            while (Object.keys(pnode.data)[0] !== "evaluation") {
                pnode = pnode.parent;
            }
            
            // Now that we found the parent evaluation, do a DFS inorder traversal to find its node number
            let m = 0;

            const parent_eval_uuid = doc_tree.dfs((node, data) => {
                if (gc.DEFAULT_HASH(node.data) === gc.DEFAULT_HASH(pnode.data)) {
                    data.push(m);
                }

                m += 1;
            })[0]; 

            const parent_eval_name = pnode.data.evaluation;
            const parent_eval_rf = pnode.get_all_children().filter(child => Object.keys(child.data)[0] === "readinessFlag")[0].data.readinessFlag;
            const text = Object.values(node.data)[0];
            data.push([uuid, parent_eval_uuid, parent_eval_rf, parent_eval_name, text]);
        }

        n += 1;
    });

    const rows = mat.map((row) => {
        return {
            values: [
                {userEnteredValue: {numberValue: row[0]}},
                {userEnteredValue: {numberValue: row[1]}},
                {userEnteredValue: {numberValue: row[2]}},
                {userEnteredValue: {stringValue: row[3]}},
                {userEnteredValue: {stringValue: row[4]}}
            ]
        };
    });
    
    // 5 columns: unique ID, unique ID of parent, readiness flag, name of category, text of evaluation
    const column_metadata = [
        {pixelSize: 50},
        {pixelSize: 50},
        {pixelSize: 50},
        {pixelSize: 200},
        {pixelSize: 600}
    ];
     
    // Collect the names of each tent to be tested in this testplan
    const tents = tp.is_group ? tp.subj.tents.map(tent => tent.name) : [tp.subj.name];
    
    // Prepend the names of each tent to the top of the workbook
    const tent_row = tents.map((tent) => {
        return {
            userEnteredValue: {stringValue: tent},
            userEnteredFormat: {
                wrapStrategy: "WRAP"
            }
        };
    });
    
    tent_row.unshift(...(Array(5).fill({userEnteredValue: {stringValue: ""}})));

    rows.unshift([
        {values: []},
        {values: tent_row},
        {values: []},
        {values: []},
        {values: []},
        {values: []},
        {values: []}
    ]);

    const val = {
        properties: {
            title: `Test Plan ${new Date().toLocaleString()}`
        }, 
        sheets: [
            {
                properties: {
                    title: "HORIZONTAL"
                },
                data: [
                    {
                        startRow: 0,
                        startColumn: 0,
                        rowData: rows,
                        rowMetadata: [
                            {
                            
                            }
                        ],
                        columnMetadata: column_metadata
                    }
                ]
            }
        ]
     };

    return val;
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
        
        rl.once("line", (input) => {
            rl.on("line", input_handler);
            resolve(input);
        });
    });
}
