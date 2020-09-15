"use strict";

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

try {
    const doc = yaml.safeLoad(fs.readFileSync("/home/noah/work/groundcontrol/temp/ds_test.yml", "utf8"));
    const bad_doc = yaml.safeLoad(fs.readFileSync("/home/noah/work/groundcontrol/temp/ds_test_bad.yml", "utf8"));
    
    const doc_res = v.validate(doc, ds_schema.ds);
    console.log(doc_res);

    const bad_doc_res = v.validate(bad_doc, ds_schema.ds);
    console.log(bad_doc_res);
} catch (err) {
    console.log(err);
}
