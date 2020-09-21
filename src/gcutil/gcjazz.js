"use strict";

const yaml = require("js-yaml");
const fs = require("fs");

const PATH = "/home/noah/work/groundcontrol/temp/TheDigitalStandard";
const OUTPUT_PATH = "/home/noah/work/groundcontrol/temp/ds_unified.yml";

function traverse(path) {
    fs.readdir(path, {withFileTypes: true}, (err, dirents) => {
        if (err) {
            console.log(err);
            return;
        }

        dirents.forEach((dirent) => {
            // Base case
            if (dirent.isFile()) {
                if (dirent.name.toUpperCase().endsWith(".YAML")) {
                     parse(`${path}/${dirent.name}`);
                }
                
                return;
            }
            
            // Noobish way to ignore hidden dirs
            if (dirent.name[0] === ".") {
                return;
            }

            traverse(`${path}/${dirent.name}`);
        });
    });
}

function parse(path) {
    try {
        const doc = yaml.safeLoad(fs.readFileSync(path), "utf8");
        console.log(doc);
        
        // Let's define a JSON data structure for the existing schema and then map a transformer function
        // to each field...
    } catch(err) {
        console.log(`\n\n\YAML parse error in file ${path}: ${err.message}\n\n`);
    }
}

traverse(PATH);
