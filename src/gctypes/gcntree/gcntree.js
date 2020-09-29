"use strict";

const Gcntree_node = require("./gcntree_node.js");

function Gcntree({root = null} = {}) {
    this.root = root;
}

Gcntree.from_json = function(obj) {
    function _traverse(obj, p) {
        Object.entries(obj).forEach((entry) => {
            if (!Array.isArray(entry[1])) {
                p.add_child(new Gcntree_node({data: entry, parent: p})); 
                return;
            }
            
            const new_p = p.add_child(new Gcntree_node({data: entry[0], parent: p}));

            entry[1].forEach((elem) => {
                _traverse(elem, new_p);
            });
        });
    }
    
    const tree = new Gcntree({root: new Gcntree_node()});
    _traverse(obj, tree.root);
    return tree;
}

Gcntree.prototype.dfs = function(cb, node = this.root, data = []) {
    cb(node, data);

    const children = node.get_all_children();

    node.get_all_children().forEach((child) => {
        data = this.dfs(cb, child, data); 
    });

    return data;
}

module.exports = Gcntree;
