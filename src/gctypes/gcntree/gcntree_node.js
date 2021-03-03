"use strict";

/**
* A {@link Gcntree} node
* @constructor
* @param {Object} config - configuration
* @param {any} config.data - the data to associate with this node
* @param {Gcntree_node} config.parent - node to assign as this node's parent
* @param {Array.<Gcntree_node>} config.children - nodes to assign as this node's children
*/
function Gcntree_node({data = null, parent = null, children = []} = {}) {
    this.data = data;
    this.parent = parent;
    this.children = children;
}

/**
* Add a child to this node
* @param {Gcntree_node} node - node to add as a child
* @returns {Gcntree_node} the new child node
*/
Gcntree_node.prototype.add_child = function(node) {
    this.children.push(node);
    return node;
}

/**
* Delete a child from this node
* @param {Gcntree_node} node - the node to delete
* @returns {Gcntree_node} the deleted node
*/
Gcntree_node.prototype.delete_child = function(node) {
    return this.children.splice(this.children.indexOf(node), 1)[0];
}

/**
* Fetch all of this node's children
* @returns {Array.<Gcntree_node>} 
*/
Gcntree_node.prototype.get_all_children = function() {
    return [...this.children];
}

/**
* Compute the degree of this node
* @returns {number}
*/
Gcntree_node.prototype.degree = function() {
    return this.children.length;
}

module.exports = Gcntree_node;
