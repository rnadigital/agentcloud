'use strict';

const fileTypes = {
	'.csv': 'csv',
	'.json': 'json',
	'.pdf': 'pdf',
	'.jsonl': 'jsonl',
	'.txt': 'text',
	'.xls': 'excel', // For older Excel files
	'.xlsx': 'excel', // For newer Excel files
	'.xlsm': 'excel', // For macro-enabled Excel files
	'.xlsb': 'excel_binary',
	'.feather': 'feather',
	'.parquet': 'parquet',
	'.yaml': 'yaml',
	'.yml': 'yaml', // .yml is also used for YAML files
	'.eml': 'email', // For email message files
	'.msg': 'email', // For Outlook message files
	'.p7s': 'signature', // For PKCS #7 signature files
	'.epub': 'ebook', // For ePub eBook files
	'.html': 'html',
	'.htm': 'html', // Alternative for HTML files
	'.bmp': 'image_bmp', // Bitmap image
	'.heic': 'image_heic', // High-Efficiency Image File
	'.jpeg': 'image_jpeg', // JPEG image
	'.jpg': 'image_jpeg', // JPEG image alternative extension
	'.png': 'image_png', // PNG image
	'.tiff': 'image_tiff', // TIFF image
	'.md': 'markdown', // Markdown files
	'.org': 'org_mode', // Org mode files (specific to Emacs)
	'.odt': 'opendocument_text', // OpenDocument Text files
	'.ppt': 'powerpoint', // PowerPoint presentation files
	'.pptx': 'powerpoint', // PowerPoint presentation files
	'.rst': 'restructuredtext', // reStructuredText files
	'.rtf': 'rich_text', // Rich Text Format files
	'.tsv': 'tab_separated_values', // Tab-separated values files
	'.doc': 'word', // Word document files
	'.docx': 'word', // Word document files
	'.xml': 'xml' // XML files
};

export default function getFileFormat(extension) {
	return fileTypes[extension.toLowerCase()];
}
