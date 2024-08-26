class StorageProvider:
    def init(self):
        raise NotImplementedError('init method not implemented')

    def upload_local_file(self, filename, file_folder, is_public=False):
        raise NotImplementedError('upload_local_file method not implemented')

    def delete_file(self, filename, file_folder, is_public=False):
        raise NotImplementedError('delete_file method not implemented')
