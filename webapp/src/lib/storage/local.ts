import debug from 'debug';
import fs from 'fs';
import StorageProvider from 'lib/storage/provider';
import path from 'path';
import util from 'util';

const log = debug('webapp:storage:local');

let mkdir, unlink, writeFile;
if (typeof fs?.mkdir === 'function') {
	mkdir = util.promisify(fs.mkdir);
	unlink = util.promisify(fs.unlink);
	writeFile = util.promisify(fs.writeFile);
}

class LocalStorageProvider extends StorageProvider {

	static allowedDeleteErorCodes: string[] = ['ENOENT'];

	#basePath: string;

	constructor() {
		super();
		if (typeof fs?.mkdir !== 'function') { return; }
		this.#basePath = process.env.UPLOADS_BASE_PATH || './uploads';
		this.init();
	}

	async init() {
		try {
			await mkdir(this.#basePath, { recursive: true });
		} catch (e) {
			log(`Failed to create base directory: ${e.message}`);
			throw e;
		}
	}

	async uploadLocalFile(filename, uploadedFile, contentType, isPublic = false) {
		const filePath = path.join(this.#basePath, filename);
		try {
			await writeFile(filePath, uploadedFile.data);
			log(`File '${filename}' uploaded successfully.`);
		} catch (e) {
			log(`Failed to upload file: ${e.message}`);
			throw e;
		}
	}

	async deleteFile(filename) {
		const filePath = path.join(this.#basePath, filename);
		try {
			await unlink(filePath);
			log(`File '${filename}' deleted successfully.`);
		} catch (e) {
			if (!LocalStorageProvider.allowedDeleteErorCodes.includes(e?.code)) {
				log(`Failed to delete file: ${e.message}`);
				throw e;
			}
		}
	}

	getBasePath() {
		return '/static';
	}

}

export default new LocalStorageProvider();

