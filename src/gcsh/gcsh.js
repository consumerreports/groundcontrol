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
    ["lstd", _lstd],
    ["fvalid", _fvalid]
]);

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
    console.log("COMMAND\t\t\t\tRESULT");
    console.log("clear\t\t\t\tClear screen"); 
    console.log("fvalid [path] [schema ID]\tValidate an external standard file (in YAML format) against a standard schema");
    console.log("lstd\t\t\t\tList all available standard schemas");
    console.log("quit\t\t\t\tExit");
}

// TODO: in "the future," lstd would query some method at the data I/O layer to retrieve all the standard schemas in the currently
// defined data store... for this demo, we're faking a world where there's one standard schema in the data store and its ID is 'ds'
function _lstd() {
    console.log("ID\t\t\t\t\t\t\tNAME");
    console.log("ds\t\t\t\t\t\t\tCR Digital Standard Schema");
}

function _fvalid(path, id) {
    if (!path) {
        console.log("Error: invalid path");
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
