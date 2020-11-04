const gctent_schema = {
    "id": "/gctent_schema",
    "type": "object",
    "properties": {
        "tent": {
            "required": true,
            "type": "string"
        },
        "notes": {
            "required": true,
            "type": "string"
        },
        "vecs": {
            "required": true,
            "type": "array",
            "items": {
                "type": "string"
            },
            "minItems": 1
        }
    },
    "additionalProperties": false
}

module.exports.gctent_schema = gctent_schema;
