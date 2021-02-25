"use strict";

// A Gcapp_tp_res object represents the result of running Gcapp.testplan_ext
// TODO: this class is a prototype-era way to pass state around while we figure out how to model
// test results, both completed and in-progress

/**
* A testplan results object. Note: Gcapp_tp_res is a prototype-era data structure used to pass state from {@link module:gcapp~Gcapp.testplan_ext}, but should be deprecated when Ground Control has a strategy for immutable data storage
* @constructor
*/
function Gcapp_tp_res({
    map, 
    subj, 
    is_group,
    eval_set, 
    std_path, 
    vecs_to_evaluate, 
    selected_evals, 
    total_evals, 
    vec_coverage,
    num_links,
    num_unfound
} = {}) {
    return {
        map: map,
        subj: subj,
        is_group: is_group,
        eval_set: eval_set,
        std_path: std_path,
        vecs_to_evaluate: vecs_to_evaluate,
        selected_evals: selected_evals,
        total_evals: total_evals,
        vec_coverage: vec_coverage,
        num_links: num_links,
        num_unfound: num_unfound
    };
}

module.exports = Gcapp_tp_res;
