"use strict";

const Gcntree_node = require("./gcntree_node.js");

function Gcntree({root = null} = {}) {
    this.root = root;
}

// Construct a Gcntree from a "json doc," which is the JSON representation of a YAML document
// not to be confused with from_json() below
// explain trans
Gcntree.from_json_doc = function(obj, trans) {
    function _process_obj(obj, ptr) {
        const keyvals = Object.entries(obj);

        ptr = ptr.add_child(new Gcntree_node({data: trans(keyvals[0][0], keyvals[0][1]), parent: ptr}));
        
        keyvals.slice(1).forEach((keyval) => {
            if (!Array.isArray(keyval[1])) {
                ptr = ptr.add_child(new Gcntree_node({data: trans(keyval[0], keyval[1]), parent: ptr}));
            } else {
                const new_ptr = ptr.add_child(new Gcntree_node({data: keyval[0], parent: ptr}));
                
                keyval[1].forEach((elem) => {
                    _process_obj(elem, new_ptr);
                });
            }
        });
    }

    const tree = new Gcntree({root: new Gcntree_node()});
    _process_obj(obj, tree.root);
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

// Get a node by node number as enumerated by DFS preorder traversal
// This is our "official" systemwide enumeration scheme
Gcntree.prototype.get_node = function(node_num) {
    let n = 0;

    return this.dfs((node, data) => {
        if (n === node_num) {
            data.push(node)
        }
        
        n += 1;
    })[0];
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
