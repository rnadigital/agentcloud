class StorageProvider:
    async def init(self):
        raise NotImplementedError('init method not implemented')

    async def upload_local_file(self, filename, uploaded_file, content_type, is_public=False):
        raise NotImplementedError('upload_local_file method not implemented')

    async def upload_buffer(self, filename, content, content_type, is_public=False):
        raise NotImplementedError('upload_buffer method not implemented')

    async def delete_file(self, filename, is_public=False):
        raise NotImplementedError('delete_file method not implemented')

    def get_base_path(self):
        raise NotImplementedError('get_base_path method not implemented.')