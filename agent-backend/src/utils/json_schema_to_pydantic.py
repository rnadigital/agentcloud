from typing import Any, Dict, List, Type, Union
from pydantic import BaseModel, create_model

TYPE_MAPPING = {
    "string": str,
    "integer": int,
    "number": float,
    "boolean": bool,
    "array": List,
    "object": Dict,
}


def json_schema_to_pydantic(schema: Dict[str, Any], model_name: str = "Model") -> Type[BaseModel]:
    fields = {}

    for property_name, property_schema in schema.get("schema", {}).items():
        field_type = TYPE_MAPPING.get(property_schema["type"])

        if property_schema["type"] == "object":
            nested_model = json_schema_to_pydantic(
                property_schema, property_name.capitalize()
            )
            field_type = nested_model

        if property_schema["type"] == "array":
            item_schema = property_schema["items"]
            item_type = TYPE_MAPPING.get(item_schema["type"])
            if item_schema["type"] == "object":
                item_type = json_schema_to_pydantic(
                    item_schema, property_name.capitalize()
                )
            field_type = List[item_type]

        if property_name in schema.get("required", []):
            fields[property_name] = (field_type, ...)
        else:
            fields[property_name] = (Union[field_type, None], None)
    print(fields)
    return create_model(model_name, **fields, __base__=BaseModel)
