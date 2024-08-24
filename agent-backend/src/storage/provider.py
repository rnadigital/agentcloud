class StorageProvider:
    async def init(self):
        raise NotImplementedError('init method not implemented')

    async def upload_local_file(self, filename, is_public=False):
        raise NotImplementedError('upload_local_file method not implemented')

    async def delete_file(self, filename, is_public=False):
        raise NotImplementedError('delete_file method not implemented')
