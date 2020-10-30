"use strict";

const yaml = require("js-yaml");
const fs = require("fs");

const PATH = "/home/noah/work/groundcontrol/temp/TheDigitalStandard";
const OUTPUT_PATH = "/home/noah/work/groundcontrol/temp/ds_103020.yml";

// TODO: break complex fields out into modules
function transformer(obj) {
    return {
        "evaluation": obj.testName,
        "readinessFlag": parseInt(obj.readinessFlag),
        "criterias": obj.criterias.map((criteria) => {
            return { 
                "criteria": criteria.criteriaName,
                "indicators": criteria.indicators.map((indicator) => {
                    return {
                        "indicator": indicator.indicator,
                        "procedures": indicator.procedures.map((procedure) => {
                            return {
                                "procedure": procedure 
                            };
                        })
                    };
                })
            };
        })
    };
}

function traverse(path, obj_ptr) {
    const dirents = fs.readdirSync(path, {withFileTypes: true});
    
    dirents.forEach((dirent) => {
        // Base case
        if (dirent.isFile()) {
            if (dirent.name.toUpperCase().endsWith(".YAML")) {
                 parse(`${path}/${dirent.name}`, obj_ptr);
            }
            
            return;
        }
        
        // Noobish way to ignore hidden dirs
        if (dirent.name[0] === ".") {
            return;
        }
        
        traverse(`${path}/${dirent.name}`, add_label(dirent.name, obj_ptr));
    });
}

function add_label(name, obj_ptr) {
    const label = {
        label: name,
        categories: []
    };
    
    obj_ptr.push(label);
    return label.categories; 
}

function parse(path, obj_ptr) {
    try {
        const doc = yaml.safeLoad(fs.readFileSync(path), "utf8");
        obj_ptr.push(transformer(doc));
    } catch(err) {
        console.log(`\n\n\YAML parse error in file ${path}: ${err.message}\n\n`);
    }
}

const output = {
    digital_standard: "My Unified Digital Standard",
    labels: []
};

traverse(PATH, output.labels);
fs.writeFileSync(OUTPUT_PATH, yaml.dump(output));
console.log(`Success! Output: ${OUTPUT_PATH}`);
