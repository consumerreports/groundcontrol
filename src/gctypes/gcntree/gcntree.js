"use strict";

const Gcntree_node = require("./gcntree_node.js");

function Gcntree({root = null} = {}) {
    this.root = root;
}

// trans is a transformer function to be called for every (key, val) pair that's a leaf node
// it should return whatever you want your leaf nodes to be -- see below Gcntree.trans.to_obj
// which just turns them into {key: val}
Gcntree.from_json = function(obj, trans) {
    function _traverse(obj, p) {
        Object.entries(obj).forEach((entry) => {
            if (!Array.isArray(entry[1])) {
                p.add_child(new Gcntree_node({data: trans(entry[0], entry[1]), parent: p})); 
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

Gcntree.trans = {
    to_obj: (key, val) => {
        const obj = {};
        obj[key] = val;
        return obj;
    }
};

// Depth first search (preorder traversal)
// Calls visitation callback cb(node, data) for every node in the tree 
Gcntree.prototype.dfs = function(cb, node = this.root, data = []) {
    cb(node, data);

    const children = node.get_all_children();

    node.get_all_children().forEach((child) => {
        data = this.dfs(cb, child, data); 
    });

    return data;
}

module.exports = Gcntree;
