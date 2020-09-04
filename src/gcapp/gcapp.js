"use strict";

const util = require("util");
const yaml = require("js-yaml");
const fs = require("fs");

try {
    const doc = yaml.safeLoad(fs.readFileSync('/home/noah/work/groundcontrol/temp/Authentication.yaml', 'utf8'));
    console.log(util.inspect(doc, {showHidden: false, depth: 10, colors: true, compact: 10, breakLength: 200}));
} catch (e) {
    console.log(e);
}
