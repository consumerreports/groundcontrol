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
                "type": "object",
                "properties": {
                    "vec": {
                        "required": true,
                        "type": "string"
                    }
                }
            },
            "minItems": 1
        }
    },
    "additionalProperties": false
};

module.exports = gctent_schema;
