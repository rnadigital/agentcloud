def exclude_items(dictionary: dict, keys_to_exclude: list) -> dict:
    return {k: v for k, v in dictionary.items() if k not in keys_to_exclude}
