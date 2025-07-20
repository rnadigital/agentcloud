import fs from 'fs';
import StorageProvider from 'lib/storage/provider';
import path from 'path';
import util from 'util';
import { createLogger } from 'utils/logger';

const log = createLogger('webapp:storage:local');

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
		if (typeof fs?.mkdir !== 'function') {
			return;
		}
		this.#basePath = process.env.UPLOADS_BASE_PATH || './uploads';
		this.init();
	}

	async init() {
		try {
			await mkdir(this.#basePath, { recursive: true });
		} catch (e) {
			log.error(`Failed to create base directory: ${e.message}`);
			throw e;
		}
	}

	async uploadLocalFile(filename, uploadedFile, contentType, isPublic = false) {
		const filePath = path.join(this.#basePath, filename);
		try {
			await writeFile(filePath, uploadedFile.data);
			log.info(`File '${filename}' uploaded successfully.`);
		} catch (e) {
			log.error(`Failed to upload file: ${e.message}`);
			throw e;
		}
	}

	async uploadBuffer(
		filename: string,
		content: Buffer,
		contentType: string,
		isPublic = false
	): Promise<any> {
		const filePath = path.join(this.#basePath, filename);
		try {
			await writeFile(filePath, content);
			log.info(`Buffer uploaded to '${filename}' successfully.`);
		} catch (e) {
			log.error(`Failed to upload buffer: ${e.message}`);
			throw e;
		}
	}

	async cloneFile(sourceFilename: string, destinationFilename: string): Promise<any> {
		const sourceFilePath = path.join(this.#basePath, sourceFilename);
		const destinationFilePath = path.join(this.#basePath, destinationFilename);

		try {
			// Read the source file
			const fileContent = await util.promisify(fs.readFile)(sourceFilePath);

			// Write the content to the destination file
			await writeFile(destinationFilePath, fileContent);

			log.info(`File cloned successfully from '${sourceFilename}' to '${destinationFilename}'`);

			return destinationFilePath;
		} catch (err) {
			log.error(`Failed to clone file: ${err.message}`);
			throw err;
		}
	}

	async deleteFile(filename) {
		const filePath = path.join(this.#basePath, filename);
		try {
			await unlink(filePath);
			log.info(`File '${filename}' deleted successfully.`);
		} catch (e) {
			if (!LocalStorageProvider.allowedDeleteErorCodes.includes(e?.code)) {
				log.error(`Failed to delete file: ${e.message}`);
				throw e;
			}
		}
	}

	getBasePath() {
		return '/static';
	}
}

export default new LocalStorageProvider();
