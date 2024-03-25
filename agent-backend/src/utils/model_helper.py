from enum import Enum
from typing import Dict, List, Set
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
    keysets = []
    keys = []
    for arg in args:
        if type(arg) is frozenset:
            keysets.append(arg)
        elif type(arg) is str:
            keys.append(arg)
    set_of_keys = frozenset(keys)
    for single_set in keysets:
        set_of_keys = set_of_keys.union(single_set)
    return set_of_keys


def in_enums(enums: List[Enum] | Enum, value):
    if enums.__iter__:
        for enum in enums:
            if value in enum.__members__.values():
                return True
        return False # went through entire loop
    elif enums.__members__ and value in enums.__members__.values():
        return True
    else:
        return False


def get_enum_key_from_value(enum: Enum, value: str):
    for _i, (enum_key, enum_value) in enumerate(enum.__members__.items()):
        if enum_value.value == value:
            return enum_key
    return None


def get_enum_value_from_str_key(enum: Enum, key: str):
    return dict(enum.__members__)[key].value

def match_key(elements_dict: Dict[Set[str], any], key: Set[str], exact=False):
    for k, v in elements_dict.items():
        if exact and key == k:
            return v
        elif key.issubset(k):
            return v
    return None

def search_subordinate_keys(elements_dict: Dict[Set[str], any], key: Set[str]):
    results = dict()
    for k, v in elements_dict.items():
        if key.issubset(k) and key != k:
            results[k] = v
    return results
