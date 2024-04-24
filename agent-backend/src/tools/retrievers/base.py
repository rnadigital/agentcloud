from abc import ABC, abstractmethod


class BaseRetriever(ABC):
    @abstractmethod
    def run(self, query):
        pass
