/**
* Schema for {@link module:gcstd_eval~Gcstd_eval}
* @constant
*/
const gcstd_eval_schema = {
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

module.exports = gcstd_eval_schema;
