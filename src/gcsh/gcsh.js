"use strict";

const readline = require("readline");
const fs = require("fs");
const Gcapp = require("../gcapp/gcapp.js");
const Gcstore_gs = require("../gcdata/store/gcstore_gs.js");

const PROMPT = "gcsh > ";

// {key: command, val: [function, help parameter list, help copy]]}
const GRAMMAR = new Map([
    ["debug",
        [
            _debug,
            "",
            "Debug function - don't execute unless you know what you're doing"
        ]
    ],
    ["quit", 
        [
            _quit,
            "",
            "Exit"
        ]
    ],
    ["checkset",
        [
            _checkset,
            "[eval set path] [std path]",
            "Apply an evaluation set against an external standard file (in YAML format) and show resolved links"
        ]
    ],
    ["clear",
        [
            _clear,
            "",
            "Clear screen"
        ]
    ],
    ["esmake",
        [
            _esmake,
            "[std path] [node1] [node2] [node3] ...",
            "Create a new evaluation set and write it to disk in YAML format"
        ]
    ],
    ["fnum",
        [
            _fnum,
            "[std path] [schema path] [part ID]",
            "Show the enumerations for part of an external standard file (in YAML format)"
        ]
    ],
    ["grinfo",
        [
            _grinfo,
            "[path]",
            "Show info for an external group file (in YAML format)"
        ]
    ],
    ["help",
        [
            _help,
            "",
            "Display this help info"
        ]
    ],
    ["io",
        [
            _io,
            "",
            "Display the data I/O modules associated with the running instance of Ground Control"
        ]
    ],
    ["leval",
        [
            _leval,
            "",
            "List all available evaluation sets"
        ]
    ],
    ["lent",
        [
            _lent,
            "",
            "List all available testable entities"
        ]
    ],
    ["lsch",
        [
            _lsch,
            "",
            "List all available standard schemas"
        ]
    ],
    ["lstd",
        [
            _lstd,
            "",
            "List all available standards"
        ]
    ],
    ["fvalid",
        [
            _fvalid,
            "[path] [schema path]",
            "Validate an external standard file (in YAML format) against a standard schema"
        ]
    ],
    ["fcmp",
        [
            _fcmp,
            "[path1] [path2] [schema path]",
            "Compare two external standard files (in YAML format) and display the diff if any"
        ]
    ],
    ["parts",
        [
            _parts,
            "[schema path]",
            "Display the meaningful parts of an external standard schema"
        ]
    ],
    ["testplan",
        [
            _testplan,
            "[subject path] [std path] [vec map path] [eval path]",
            "Generate the evaluation suite for a single testable entity or group, standard, evaluation set, and vector map; specifying no evaluation set will apply the entire standard"
        ]
    ],
    ["vecs",
        [
            _vecs,
            "",
            "Display the vector names known to this version of Ground Control"
        ]
    ],
    ["vmake",
        [
            _vmake,
            "[std path]",
            "Interactively create a new vector map and write it to disk in YAML format"
        ]
    ]
]);

// Terminal colors
const C = {
    BRIGHT: "\x1b[1m",
    RESET: "\x1b[0m"
};

// REPL stuff
async function _on_input(input) {
    const tok = input.trim().split(" ");
    const f = GRAMMAR.get(tok[0]);

    if (!f) {
        console.log(`Bad command ${tok[0]}`);
        return;
    }

    try {
        await f[0](...tok.slice(1));
    } catch (err) {
        console.log(`Error: ${err.message}`);
    }
}

async function input_handler(input) {
    if (input.length > 0) {
        await _on_input(input);  
    }

    rl.prompt();
}

function press_any_key(prompt = false) {
    return new Promise((resolve, reject) => {
        rl.removeListener("line", input_handler);
        
        if (prompt) {
            rl.prompt();
        }

        rl.once("line", (input) => {
            rl.on("line", input_handler);
            resolve(input);
        });
    });
}

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



// *** Command handlers, in order of appearance in the grammar ***

async function _debug() {
    // TODO: get rid of the debug function here and in the grammar
    const vec_map = Gcapp.load_vec_map_ext("/home/noah/work/groundcontrol/out/vec_map_1613681180742.yml");
    console.log(vec_map);
}

function _quit() {
    console.log("Bye!");
    process.exit();
}

async function _checkset(eval_path, std_path) {
    if (!eval_path || !std_path) {
        throw new Error("Missing path");
    }
    
    const res = await Gcapp.checkset_ext(eval_path, std_path);
    res.resolved.forEach(part => console.log(part));
    console.log(`${eval_path} selects ${res.resolved.length} of ${res.total_nodes} total nodes in ${std_path}`);

    if (res.unresolved.length === 0) {
        console.log(`SUCCESS: All ${res.total_evals} links were resolved in ${std_path}!`);
    } else {
        console.log(`WARNING: ${res.unresolved.length} links could not be resolved in ${std_path}`);
    }
}

function _clear() {
    console.clear();
}

async function _esmake(std_path, ...nums) {
    if (!std_path) {
        throw new Error("Missing path");
    }
    
    const doc_tree = await Gcapp.load_std_ext(std_path);
    const es = Gcapp.make_eval_set(doc_tree, nums.map(num => parseInt(num)), "Untitled Evaluation Set");
    console.log(`Success! Output: ${Gcapp.write_eval_set_ext(es, "Created by gcsh esmake")}`);
}

async function _fnum(std_path, sch_path, part_id) {
    if (!std_path || !sch_path) {
        throw new Error("Missing path");
    }
    
    if (!part_id) {
        throw new Error("You must specify a part ID");
    }

    const res = await Gcapp.num_ext(std_path, sch_path, part_id);

    res.nodes.forEach((node) => {
        console.log(node[0]);
        console.log(node[1]);
        console.log(`VIA: ${node[2]}\n`)
    });

    console.log(`Done! ${std_path} has ${res.nodes.length} '${res.prop}' (part ID ${res.part_id}) out of ${res.total_nodes} total nodes.`);
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

function _help() {
    console.log("+-----------+");
    console.log("| gsch help |");
    console.log("+-----------+\n");

    Array.from(GRAMMAR.entries()).forEach((command) => {
        console.log(`${C.BRIGHT}${command[0]} ${command[1][1]}\n${C.RESET}${command[1][2]}\n\n`);
    });
}

function _io() {
    app.get_data_modules().forEach((module, i) => {
        console.log(`${i}: ${module.type}`);
    });   
}

function _leval() {
    console.log("Oops! I don't do anything yet. Email noah.levenson@consumer.org about this!");
}

function _lent() {
    console.log("Oops! I don't do anything yet. Email noah.levenson@consumer.org about this!");
}

function _lsch() {
    console.log("Ooops! I don't do anything yet. Email noah.levenson@consumer.org about this!");
}

function _lstd() {
    console.log("Oops! I don't do anything yet. Email noah.levenson@consumer.org about this!");
}

async function _fvalid(path, sch_path) {
    if (!path || !sch_path) {
        throw new Error("Missing path");
    }
    
    if (!fs.existsSync(path) ) {
        throw new Error(`${path} does not exist`);
    }

    if (!fs.existsSync(sch_path)) {
        throw new Error(`${sch_path} does not exist`);
    }

    const res = await Gcapp.valid_ext(path, sch_path);

    if (!res) {
        console.log(`INVALID: ${path} is not a correct instance of standard ${sch_path}`);
        return;
    }

    console.log(`VALID: ${path} is a correct instance of standard ${sch_path}`);
}

async function _fcmp(path1, path2, sch_path) {
    if (!path1 || !path2 || !sch_path) {
        throw new Error("Missing path");
    }
    
    try {
        // TODO: We deserialize and transform the standards unnecessarily here
        // just to check the case where they're identical... maybe instead we can refactor
        // Gcapp.cmp_ext to flag the difference between identical and permuted...
        const doca_tree = await Gcapp.load_std_ext(path1, sch_path);
        const docb_tree = await Gcapp.load_std_ext(path2, sch_path);

        if (Gcapp.dhash(doca_tree) === Gcapp.dhash(docb_tree)) {
            console.log(`Files are identical! SHA256: ${Gcapp.dhash(doca_tree)}`);
            return;
        }
        
        const res = await Gcapp.cmp_ext(path1, path2, sch_path);
        
        if (res.a.length === 0 && res.b.length === 0) {
            console.log(`Permutation: file ${path1} has the same nodes as file ${path2}, but in a different order.`);
            return;
        }

        res.a.forEach((node) => {
            console.log(`File ${path2} did not have this node:`);
            console.log(node);
        });

        res.b.forEach((node) => {
            console.log(`\nFile ${path1} did not have this node:`);
            console.log(node);
        });
    } catch(err) {
        throw new Error(err.message);
    }
}

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

async function _testplan(subj_path, std_path, vec_map_path, eval_path) {
    const res = Gcapp.testplan_ext(subj_path, std_path, vec_map_path, eval_path);
    
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
            await app.data_modules[0].put("NEW", await _testplan_to_gs_workbook(res, std_path));
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
async function _testplan_to_gs_workbook(tp, std_path) {
    // Collect all the node numbers in the testplan hashmap into a set
    const node_nums = new Set(Array.from(tp.map.values()).flat().map(obj => obj.node_num));
    
    const doc_tree = await Gcapp.load_std_ext(std_path);
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

function _vecs() {
    Gcapp.get_vector_names().forEach((vec) => {
        console.log(vec);
    });
}

async function _vmake(std_path) {
    async function _step(vecs, nums = [], i = 0) {
        if (i === vecs.length) {
            return nums;
        }

        console.log(`\nEnter space-separated node numbers for vector ${vecs[i]} (${i + 1}/${vecs.length})`)
        const res = await press_any_key(true);
        
        // TODO: This sanitizer gets rid of extra whitespace but it doesn't handle NaN
        nums.push(res.split(" ").filter(tok => tok.trim().length > 0).map(tok => parseInt(tok)));
        return await _step(vecs, nums, i + 1);
    }

    if (!std_path) {
        throw new Error("Missing path");
    }
    
    const nums = await _step(Gcapp.get_vector_names());
    const doc_tree = await Gcapp.load_std_ext(std_path);
    const vec_map = Gcapp.make_vec_map(doc_tree, nums, "Untitled Vector Map");
    console.log(`Success! Output: ${Gcapp.write_vec_map_ext(vec_map, "Created by gcsh vmake")}`);
}

