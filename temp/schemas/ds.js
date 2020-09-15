// Label
const ds_label = {
    "id": "/ds_label",
    "type": "object",
    "properties": {
        "name": {
            "required": true, 
            "type": "string"
        },
        "children": {
            "required": true, 
            "type": "array", 
            "items": {
                "anyOf": [
                    {"$ref": "/ds_label"},
                    {"$ref": "/ds_eval"}
                ]
            },
            "minItems": 1
        }
    },
    "additionalProperties": false
}

// Evaluation (formerly "test")
const ds_eval = {
    "id": "/ds_eval",
    "type": "object",
    "properties": {
        "name": {
            "required": true,
            "type": "string"
        },
        "criterias": {
            "required": true,
            "type": "array",
            "items": {"$ref": "/ds_crit"},
            "minItems": 1
        },
        "readinessFlag": {
            "required": true,
            "type": "integer",
            "minimum": 1,
            "maximum": 3
        }
    },
    "additionalProperties": false
}

// Criteria
const ds_crit = {
    "id": "/ds_crit",
    "type": "object",
    "properties": {
        "name": {
            "required": true,
            "type": "string"
        },
        "indicators": {
            "required": true,
            "type": "array",
            "items": {"$ref": "/ds_ind"},
            "minItems": 1
        }
    },
    "additionalProperties": false
}

// Indicator
const ds_ind = {
    "id": "/ds_ind",
    "type": "object",
    "properties": {
        "name": {
            "required": true,
            "type": "string"
        },
        "procedures": {
            "required": true,
            "type": "array",
            "items": {"$ref": "/ds_proc"},
            "minItems": 1
        }
    },
    "additionalProperties": false
}

// Procedure
const ds_proc = {
    "id": "/ds_proc",
    "type": "object",
    "properties": {
        "desc": {
            "required": true,
            "type": "string"
        }
    },
    "additionalProperties": false
}

// Digital Standard
const ds = {
    "id": "/ds",
    "type": "object",
    "properties": {
        "name": {
            "required": true,
            "type": "string"
        },
        "labels": {
            "required": true,
            "type": "array",
            "items": {"$ref": "/ds_label"},
            "minItems": 1
        }
    },
    "additionalProperties": false
}

module.exports = {
    ds: ds,
    ds_proc: ds_proc,
    ds_ind: ds_ind,
    ds_crit: ds_crit,
    ds_eval: ds_eval,
    ds_label: ds_label
}
