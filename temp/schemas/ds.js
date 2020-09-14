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
            "item": {
                "anyOf": [
                    {"$ref": "/ds_label"},
                    {"$ref": "/ds_eval"}
                ]
            },
            "minItems": 1
        }
    } 
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
            "item": {"$ref": "/ds_crit"},
            "minItems": 1
        },
        "readinessFlag": {
            "required": true,
            "type": "integer",
            "minimum": 1,
            "maximum": 3
        }
    }
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
            "item": {"$ref": "/ds_ind"}
            "minItems": 1
        }
    }
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
            "item": {"$ref": "/ds_proc"},
            "minItems": 1
        }
    }
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
    }
}

// Digital Standard
const ds = {
    "id": "/ds",
    "type": "object",
    "properties": {
        "labels": {
            "required": true,
            "type": "array",
            "item": {"$ref": "/ds_label"}
            "minItems": 1
        }
    }
}
