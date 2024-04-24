from abc import ABC, abstractmethod


class BaseToolRetriever(ABC):
    @abstractmethod
    def run(self, query):
        pass
