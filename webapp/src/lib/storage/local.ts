import debug from 'debug';
import fs from 'fs';
import StorageProvider from 'lib/storage/provider';
import path from 'path';
import util from 'util';

const log = debug('webapp:storage:local');

class LocalStorageProvider extends StorageProvider {

	#basePath: string;

	constructor() {
		super();
		if (!process.env.UPLOADS_BASE_PATH) {
			throw new Error('Missing process.env.UPLOADS_BASE_PATH');
		}
		this.#basePath = process.env.UPLOADS_BASE_PATH || 'uploads';
		this.init();
	}

	async init() {
		const mkdir = util.promisify(fs.mkdir);
		try {
			await mkdir(this.#basePath, { recursive: true });
		} catch (e) {
			log(`Failed to create base directory: ${e.message}`);
			throw e;
		}
	}

	async addFile(filename, uploadedFile, isPublic = false) {
		const writeFile = util.promisify(fs.writeFile);
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
		const unlink = util.promisify(fs.unlink);
		const filePath = path.join(this.#basePath, filename);
		try {
			await unlink(filePath);
			log(`File '${filename}' deleted successfully.`);
		} catch (e) {
			log(`Failed to delete file: ${e.message}`);
			throw e;
		}
	}

}

export default new LocalStorageProvider();

