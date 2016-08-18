const ipc = require('electron').ipcRenderer;
const {shell} = require('electron');

const titleEl = document.getElementById('welcome');
const linkEl = document.getElementById('authAnchor');
const authenticatedEl = document.getElementById('authenticated');
const uploadEl = document.getElementById('uploadTestFile');
const listEl = document.getElementById('fileList');

linkEl.onclick = function(e){
	// shell.openExternal(this.href);
	ipc.send('LINK_CLICKED', this.href);

	e.preventDefault();
	return false;
};

uploadEl.onclick = function(e){
	uploadEl.disabled = "disabled";
	uploadEl.textContent = 'Uploading..';
	ipc.send('UPLOAD_TEST_FILE');
}

ipc.once('AUTH_URL_FETCHED', function(event, authUrl){
	linkEl.href = authUrl;
});

ipc.on('FETCHING_USER_INFO', function(event, entries){
	linkEl.disabled = 'disabled';
	linkEl.textContent = 'Logging in..';
});

ipc.on('USER_INFO_FETCHED', function(event, user){
	linkEl.style.display = 'none';
	titleEl.textContent = 'Welcome ' + user.name.display_name;
	authenticatedEl.style.display = 'block';
});

ipc.on('FILE_UPLOADED', function(){
	titleEl.textContent = 'File Uploaded Successfully!';
	uploadEl.removeAttribute('disabled');
	uploadEl.textContent = 'Upload Test File';
});

ipc.on('SYNCING_FILES', function(){
	listEl.textContent = 'Syncing..'
});

ipc.on('FILES_FETCHED', function(event, entries){
	titleEl.textContent = 'Files Synced!';
	listEl.textContent = '';
	entries.map(function(entry){
		var fileEl = document.createElement('div');
		fileEl.textContent = entry.name;

		listEl.appendChild(fileEl);
	});
})

ipc.send('INIT');