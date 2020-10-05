"use strict";

const gcutil = require("../gcutil/gcutil.js");

// std must be a Gcntree for a standard
// TODO: we probably shouldn't allow you to derive a Gceval from an incorrect standard...
function Gceval({std = null}) {
    this.sha256 = gcutil.sha256(); 
}

module.exports = Gceval;
