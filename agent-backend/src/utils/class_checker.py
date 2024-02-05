from typing import Any, Type


def check_instance_of_class(instance: Any, class_type: Type[Any]) -> Any:
    if not isinstance(instance, class_type):
        raise AssertionError(
            f"Expected instance of {class_type.__name__}, got {type(instance).__name__}"
        )
    return instance
