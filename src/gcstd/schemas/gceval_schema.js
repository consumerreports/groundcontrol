const gceval_schema = {
    "id": "/gceval_schema",
    "type": "object",
    "properties": {
        "eval": {
            "required": true,
            "type": "string"
        },
        "notes": {
            "required": true,
            "type": "string"
        },
        "set": {
            "required": true,
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "hash": {
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

module.exports = gceval_schema;
