"use strict";

function Gcntree_node({data = null, parent = null, children = []} = {}) {
    this.data = data;
    this.parent = parent;
    this.children = children;
}

Gcntree_node.prototype.add_child = function(node) {
    this.children.push(node);
    return node;
}

Gcntree_node.prototype.delete_child = function(node) {
    return this.children.splice(this.children.indexOf(node), 1)[0];
}

Gcntree_node.prototype.get_all_children = function() {
    return [...this.children];
}

Gcntree_node.prototype.degree = function() {
    return this.children.length;
}

module.exports = Gcntree_node;
