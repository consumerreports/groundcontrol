"use strict";

// In the future, gcsh should call high level API functions from gcapp, which should call lower level
// functions from gcstd and gctax... but since we're not implementing a data I/O layer for the prototype,
// we're not really implementing any of the modules the way they're meant to be implemented. so all
// the gcsh functions are just stubs that will need to be replaced...

const readline = require("readline");
const util = require("util");
const yaml = require("js-yaml");
const fs = require("fs");
const Validator = require("jsonschema").Validator;
const ds_schema = require("../../temp/schemas/ds.js");

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

function _lstd() {
    console.log("ID\t\t\t\t\t\t\tNAME");
    console.log("ds\t\t\t\t\t\t\tCR Digital Standard Schema");
}

function _fvalid() {
     
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
