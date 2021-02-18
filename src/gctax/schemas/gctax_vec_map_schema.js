const gctax_vec_map_schema = {
    "id": "/gcvec_map_schema",
    "type": "object",
    "properties": {
        "vec_map": {
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
                    "vec_name": {
                        "required": true,
                        "type": "string"
                    },
                    "hash_list": {
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
                }
            },
            "minItems": 1
        }
    },
    "additionalProperties": false
};

module.exports = gctax_vec_map_schema;
