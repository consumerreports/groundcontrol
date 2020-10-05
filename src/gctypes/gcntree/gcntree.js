"use strict";

const Gcntree_node = require("./gcntree_node.js");

function Gcntree({root = null} = {}) {
    this.root = root;
}

// Construct a Gcntree from a "json doc," which is the JSON representation of a YAML document
// not to be confused with from_json() below
// trans is a transformer function to be called for every (key, val) pair that's a leaf node
// it should return whatever you want your leaf nodes to be -- see below Gcntree.trans.to_obj
// which just turns them into {key: val}
Gcntree.from_json_doc = function(obj, trans) {
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

// Rehydrate a serialized Gcntree from stringified json that was created using Gcntree.toJSON()
Gcntree.from_json = function(json) {
    const arr = JSON.parse(json);
    const tree = new Gcntree({root: new Gcntree_node({data: arr[0]})});
    
    let node = tree.root;

    arr.slice(1).forEach((elem) => {
        if (elem === null) {
            node = node.parent;        
            return; 
        }

        node = node.add_child(new Gcntree_node({data: elem, parent: node}));
    });

    return tree;
}


// Depth first search
// Calls visitation callback pre(node, data) where you'd want it for a preorder traversal, calls post(node, data) postorder
Gcntree.prototype.dfs = function(pre, post, node = this.root, data = []) {
    if (typeof pre === "function") {
        pre(node, data);
    }
    
    const children = node.get_all_children();

    node.get_all_children().forEach((child) => {
        data = this.dfs(pre, post, child, data); 
    });
    
    if (typeof post === "function") {
        post(node, data);
    }

    return data;
}

// JSON serializer
// simple af way to serialize an n-ary tree in a JSON-ish way: keep it as a flat array of nodes with null sentinels 
// to indicate that a given node has no more children (if you're descending from the root, backtrack one node
// for every null sentinel you encounter)
Gcntree.prototype.toJSON = function() {
    const arr = [];

    this.dfs((node, data) => {
        arr.push(node.data);
    }, (node, data) => {
        arr.push(null);
    });
    
    return JSON.stringify(arr);
}

module.exports = Gcntree;
