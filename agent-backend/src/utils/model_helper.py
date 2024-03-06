from typing import Dict, List
from pydantic import BaseModel


def get_models_attribute_values(models: List[BaseModel], attribute: str):
    """Generates a map function to get attribute from models"""

    def _convert(model: BaseModel):
        if hasattr(model, attribute):
            return getattr(model, attribute)
        else:
            return None

    return list(map(_convert, models))


def convert_dictionaries_to_models(dictionaries: List[Dict], model: BaseModel):
    """Generates a map function to convert a dictionary to a model instance"""

    def _convert(dictionary: Dict):
        return model(**dictionary)

    return list(map(_convert, dictionaries))


def keyset(*args):
    return frozenset(args)
