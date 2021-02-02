"use strict";

const readline = require("readline");
const util = require("util");
const yaml = require("js-yaml");
const fs = require("fs");
const Validator = require("jsonschema").Validator;

const Gcapp = require("../gcapp/gcapp.js");
const gcutil = require("../gcutil/gcutil.js");
const Gcntree = require("../gctypes/gcntree/gcntree.js");
const Gcstd_eval = require("../gcstd/gcstd_eval.js");

const Gcstore_gs = require("../gcdata/store/gcstore_gs.js");

const v = new Validator();

const PROMPT = "gcsh > ";

const GRAMMAR = new Map([
    ["quit", _quit],
    ["checkset", _checkset],
    ["clear", _clear],
    ["esmake", _esmake],
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
async function _debug(path) {
    const res = await Gcapp.load_std_ext("/home/noah/work/groundcontrol/temp/ds_103020.yml", "/home/noah/work/groundcontrol/temp/schemas/ds.js");

    console.log(res);
}

async function _esmake(std_path, ...nums) {
    if (!std_path) {
        throw new Error("Missing path");
    }
    
    const doc_tree = await Gcapp.load_std_ext(std_path);
    const es = Gcapp.make_eval_set(doc_tree, nums.map(num => parseInt(num)), "Untitled Evaluation Set");
    console.log(`Success! Output: ${Gcapp.write_eval_set_ext(es, "Created by gcsh esmake")}`);
}

// Display the meaningful parts of a given standard schema. These are the parts you reference for fnum, and eventually
// when creating a Gcstd_eval object...
async function _parts(path) {
    if (!path) {
        throw new Error("Missing path");
    }
    
    const schema = await Gcapp.load_schema_ext(path);

    // TODO: to avoid presenting the user with every single part of a standard schema, we hypothesize that the 
    // "meaningful" parts of a standard schema are its nonscalar values, see get_nonscalar_keys for a deeper discussion
    const keys = Gcapp.get_nonscalar_keys(schema);
    
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
async function _fnum(path, sch_path, part_id) {
    if (!path || !sch_path) {
        throw new Error("Missing path");
    }
    
    try {
        // First get the prop name for the part code we're interested in
        const ds_schema = await Gcapp.load_schema_ext(sch_path);
        const keys = Gcapp.get_nonscalar_keys(ds_schema);
        
        if (part_id < 0 || part_id > keys.length - 1) {
            throw new Error(`Part ID out of range for standard schema ${sch_path}`);
        }

        const prop = keys[part_id];

        // Now load the standard file and transform to a Gcntree
        const doc_tree = await Gcapp.load_std_ext(path);

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

async function _testplan(subj_path, std_path, eval_path) {
    const res = Gcapp.testplan_ext(subj_path, std_path, eval_path);
    
    if (res.is_group) {
        console.log(`\nGROUP: '${res.subj.name}' (${res.subj.tents.map(tent => tent.name).join(", ")})`);
    } else {
        console.log(`\nENTITY: '${res.subj.name}'`);
    }

    const es_name = !eval_path ? "None" : "'" + res.eval_set.name + "'";
    const es_no_apply = !eval_path ? 0 : Array.from(res.eval_set.set.values()).length - res.selected_evals;

    console.log(`EVALUATION SET: ${es_name}`);
    console.log(`STANDARD: ${res.std_path}`);
    
    console.log(`VECTORS: ${res.vecs_to_evaluate.length} ${res.is_group ? "in common" : ""}`);
    // console.log(`TOTAL EVALUATIONS REQUIRED: ${total_evals}\n`);

    console.log(`\nEvaluation set ${es_name} selects ${res.selected_evals} of ${res.total_evals} possible evaluations:\n`); 
    
    res.vecs_to_evaluate.forEach((vec, i) => {
        console.log(`${vec} => ${res.vec_coverage[i].reduce((acc, bool) => { return acc + (bool ? 1 : 0)}, 0)}/${res.vec_coverage[i].length}`);
    });

    console.log(`\nEvaluation set ${es_name} includes ${es_no_apply} evaluations which do not apply to '${res.subj.name}'`);
    
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
                if (Gcapp.dhash(node.data) === Gcapp.dhash(pnode.data)) {
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
    
    const five_space = Array(5).fill({userEnteredValue: {stringValue: ""}});
    
    // TODO: These labels are a subset of the labels present in the example workbook, because the example
    // workbook has additional labels that are clearly specific to wireless routers (protocol, mesh, etc.) 
    // What's the complete set of evergreen labels to include?
    rows.unshift(
        {values: five_space.concat([{userEnteredValue: {stringValue: "Pedigree"}}])},
        {values: five_space.concat([{userEnteredValue: {stringValue: "Sample #"}}])},
        {values: five_space.concat([{userEnteredValue: {stringValue: "Brand & Model"}}].concat(tent_row))},
        {values: five_space.concat([{userEnteredValue: {stringValue: "Availability"}}])},
        {values: five_space.concat([{userEnteredValue: {stringValue: "Status"}}])},
        {values: five_space.concat([{userEnteredValue: {stringValue: "Batch Number"}}])},
        {values: five_space}
    );
    
    // Now build the vertically formatted sheet, which unfortunately is not just a transpose :(
    const ten_space = Array(10).fill({userEnteredValue: {stringValue: ""}});
    
    const labels = [
        {userEnteredValue: {stringValue: "Pedigree"}}, 
        {userEnteredValue: {stringValue: "Sample #"}}, 
        {userEnteredValue: {stringValue: "Brand & Model"}},
        {userEnteredValue: {stringValue: "Availability"}},
        {userEnteredValue: {stringValue: "Status"}},
        {userEnteredValue: {stringValue: "Batch Number"}}
    ];

    const rows_v = [
        {values: ten_space.concat(mat.map(item => {return {userEnteredValue: {numberValue: item[0]}}}))},
        {values: ten_space.concat(mat.map(item => {return {userEnteredValue: {numberValue: item[1]}}}))},
        {values: ten_space.concat(mat.map(item => {return {userEnteredValue: {numberValue: item[2]}}}))},
        {values: ten_space.concat(mat.map(item => {return {userEnteredValue: {stringValue: item[3]}, userEnteredFormat: {wrapStrategy: "WRAP"}}}))},
        {values: ten_space.concat(mat.map(item => {return {userEnteredValue: {stringValue: item[4]}, userEnteredFormat: {wrapStrategy: "WRAP"}}}))},
        {values: ten_space},
        {values: labels} 
    ].concat(tents.map((tent) => {
        return {
            values: [
                {userEnteredValue: {stringValue: ""}},
                {userEnteredValue: {stringValue: ""}},
                {
                    userEnteredValue: {stringValue: tent},
                    userEnteredFormat: {
                        wrapStrategy: "WRAP"
                    }
                }
            ]
        };
    }));

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
            },
            {
                properties: {
                    title: "VERTICAL"
                },
                data: [
                    {
                        startRow: 0,
                        startColumn: 0,
                        rowData: rows_v
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
    Gcapp.get_vector_names().forEach((vec) => {
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
    
    const common = Gcapp.get_common_vecs(group.tents);
    console.log(`This group contains ${group.tents.length} testable entities which share ${common.length} common vectors:\n`);
    common.forEach(str => console.log(str));
}

// TODO: it'd be cool if the GRAMMAR hashmap kept a lil help string for each token, and so we could automatically build the help menu by
// iterating through the map instead of hardcoding it here
function _help() {
    console.log("+-----------+");
    console.log("| gsch help |");
    console.log("+-----------+\n");
    console.log(`${C.BRIGHT}checkset [eval set path] [std path]\n${C.RESET}Apply an evaluation set against an external standard file (in YAML format) and show resolved links\n\n`);
    console.log(`${C.BRIGHT}clear\n${C.RESET}Clear screen\n\n`);  

    console.log(`${C.BRIGHT}esmake [std path] [node1] [node2] [node3] ...\n${C.RESET}Create a new evaluation set and write it to disk in YAML format\n\n`);
    
    console.log(`${C.BRIGHT}fnum [std path] [schema path] [part ID]\n${C.RESET}Show the enumerations for part of an external standard file (in YAML format)\n\n`);
    
    console.log(`${C.BRIGHT}fcmp [path1] [path2] [schema path]\n${C.RESET}Compare two external standard files (in YAML format) and display the diff if any\n\n`);
    
    console.log(`${C.BRIGHT}fvalid [path] [schema path]\n${C.RESET}Validate an external standard file (in YAML format) against a standard schema\n\n`); 
    
    console.log(`${C.BRIGHT}grinfo [path]\n${C.RESET}Show info for an external group file (in YAML format)\n\n`);
    
    console.log(`${C.BRIGHT}io\n${C.RESET}Display the data I/O modules associated with the running instance of Ground Control\n\n`);
    
    console.log(`${C.BRIGHT}leval\n${C.RESET}List all available evaluation sets\n\n`);
    
    console.log(`${C.BRIGHT}lent\n${C.RESET}List all available testable entities\n\n`);
    
    console.log(`${C.BRIGHT}lsch\n${C.RESET}List all available standard schemas\n\n`);
    
    console.log(`${C.BRIGHT}lstd\n${C.RESET}List all available standards\n\n`);
    
    console.log(`${C.BRIGHT}parts [schema path]\n${C.RESET}Display the meaningful parts of an external standard schema\n\n`);
    
    console.log(`${C.BRIGHT}quit\n${C.RESET}Exit\n\n`);
    
    console.log(`${C.BRIGHT}testplan [subject path] [std path] [eval path]\n${C.RESET}Generate the suite of evaluations that must be performed for a given testable entity or group of testable entities, standard, and evaluation set (using the default vector mapping); specifying no evaluation set will apply the entire standard\n\n`);
    
    console.log(`${C.BRIGHT}vecs\n${C.RESET}Display the vector names known to this version of Ground Control\n\n`);
}

// TODO: in "the future," leval would grab all the evaluation sets in the currently defined data store... for now, we're just
// faking some by creating some Gcstd_eval objects in the global scope
function _leval() {
    console.log("Oops! I don't do anything yet. Email noah.levenson@consumer.org about this!");
}

function _lent() {
    console.log("Oops! I don't do anything yet. Email noah.levenson@consumer.org about this!");
}

// TODO: in "the future," lsch would query some method at the data I/O layer to retrieve all the standard schemas in the currently
// defined data store... for this demo, we're faking a world where there's one standard schema in the data store and its ID is 'ds'
function _lsch() {
    console.log("Ooops! I don't do anything yet. Email noah.levenson@consumer.org about this!");
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
        const hasha = Gcapp.dhash(node.data);
        let found = false;
        
        b.dfs((node, data) => {
            const hashb = Gcapp.dhash(node.data);
            
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

async function _fcmp(path1, path2, sch_path) {
    if (!path1 || !path2 || !sch_path) {
        throw new Error("Missing path");
    }
    
    try {
        const doca_tree = await Gcapp.load_std_ext(path1, sch_path);
        const docb_tree = await Gcapp.load_std_ext(path2, sch_path);

        const hash1 = Gcapp.dhash(doca_tree);
        const hash2 = Gcapp.dhash(docb_tree);

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

// TODO: It'd be nice to emit the specific errors found in invalid standards, but we gotta refactor Gcapp.load_std_ext to return em
async function _fvalid(path, sch_path) {
    if (!path || !sch_path) {
        throw new Error("Missing path");
    }
    
    try {
        await Gcapp.load_std_ext(path, sch_path);
        console.log(`VALID: ${path} is a correct instance of standard ${sch_path}`);
    } catch(err) {
        console.log(`INVALID: ${err.message}`);
    }
}

async function _checkset(eval_path, std_path) {
    if (!eval_path || !std_path) {
        throw new Error("Missing path");
    }

    try {
        const ev = Gcapp.load_eval_set_ext(eval_path);
        const doctree = await Gcapp.load_std_ext(std_path);

        const parts = new Map();
        let n = 0;

        doctree.dfs((node, data) => {
            const node_hash = Gcapp.dhash(node.data);

            if (ev.set.has(node_hash)) {
                parts.set(node_hash, node.data);
            }

            n += 1
        });
        
        const homogeneous = Array.from(parts.values()).every((obj, i, arr) => {
            return Object.keys(obj)[0] === Object.keys(arr[0])[0]
        });
        
        if (!homogeneous) {
            throw new Error(`Illegal evaluation set -- ${eval_path} is non-homogeneous`);
        }

        Array.from(parts.values()).forEach((part) => {
            console.log(part);
        });
        
        console.log(`${eval_path} selects ${parts.size} of ${n} total nodes in ${std_path}`);
        
        // unresolved holds any node hashes specified by the evaluation set that we didn't find in the standard
        const found_hashes = Array.from(parts.keys());
        const unresolved = Array.from(ev.set.values()).filter(node_hash => !found_hashes.includes(node_hash));

        if (unresolved.length === 0) {
            console.log(`SUCCESS: All ${ev.set.size} links were resolved in ${std_path}!`);
        } else {
            console.log(`WARNING: ${unresolved} links could not be resolved in ${std_path}!`);
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
