"use strict";

const Gcntree_node = require("./gcntree_node.js");

/**
* N-ary (k-way) tree
* @constructor
* @param {Object} config - configuration
* @param {Gcntree_node} config.root - node to set as root
*/
function Gcntree({root = null} = {}) {
    this.root = root;
}

/**
* Factory function to create a Gcntree from the JSON representation of a YAML document.
* Not to be confused with {@link Gcntree.from_json}
* @static
* @param {Object} obj - a JSON object representing a YAML document
* @param {function} trans - transformer function - one of {@link Gcntree.trans}
* @returns {Gcntree}
*/
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

/**
* Transformer functions for {@link Gcntree.from_json_doc}. 
* A transformer function describes how to transform a (key, value) pair 
* in a JSON object to data in a {@link Gcntree_node}
* @namespace Gcntree.trans
*/
Gcntree.trans = {
    /**
    * Transform to simple object 
    * @memberof Gcntree.trans
    * @param {string} key - key
    * @param {any} val - value
    * @returns {Object} as {key: val}
    */
    to_obj: (key, val) => {
        const obj = {};
        obj[key] = val;
        return obj;
    }
};

/**
* Deserialize a {@link Gcntree} that was previously serialized using {@link Gcntree.toJSON}
* @static
* @param {string} json - a serialized {@link Gcntree}
* @returns {Gcntree}
*/
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

/**
* Depth first search
* @param {Gcntree~dfs_cb} pre - preorder visitation callback
* @param {Gcntree~dfs_cb} post - postorder visitation callback
* @param {Array} data - this array will be returned upon termination, useful for accumulation, etc.
* @returns {Array} the data array
*/
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

/**
* Depth first search visitation callback
* @callback Gcntree~dfs_cb
* @param {Gcntree_node} node - reference to the currently visited node
* @param {Array} data - reference to the data array
*/

/**
* Fetch a node from this tree by node number as enumerated by {@link Gcntree#dfs} preorder traversal
* @param {number} node_num - the node number
* @returns {Gcntree_node}
*/
Gcntree.prototype.get_node = function(node_num) {
    let n = 0;

    return this.dfs((node, data) => {
        if (n === node_num) {
            data.push(node)
        }
        
        n += 1;
    })[0];
}

/**
* Serialize this {@link Gcntree}. This method serializes trees as linear arrays of {@link Gcntree_node} objects
* with null sentinels indicating "end of children"
* @see https://www.geeksforgeeks.org/serialize-deserialize-n-ary-tree/
* @returns {string} the serialized tree
*/
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
