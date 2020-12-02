const gcgroup_schema = {
    "id": "/gcgroup_schema",
    "type": "object",
    "properties": {
        "group": {
            "required": true,
            "type": "string"
        },
        "notes": {
            "required": true,
            "type": "string"
        },
        "tent_paths": {
            "required": true,
            "type": "array",
            "items": {
                "type": "string"
            },
            "minItems": 1
        }
    },
    "additionalProperties": false
};

module.exports.gcgroup_schema = gcgroup_schema;
