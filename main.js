'use strict';
const electron = require('electron');
const Dropbox = require('dropbox');
const fs = require('fs');
const path = require('path');
const ajax = require('superagent');
const ipc = electron.ipcMain;
const CLIENT_ID = 'v9wt185d6c3xbza';
const app = electron.app;

// adds debug features like hotkeys for triggering dev tools and reload
require('electron-debug')();

// prevent window being garbage collected
let mainWindow;
let authWindow;
let dbx;
let user;
let token;

ipc.on('INIT', initDropbox);
ipc.on('LINK_CLICKED', openAuthWindow);
ipc.on('AUTH_TOKEN_RECEIVED', authTokenReceived);
ipc.on('UPLOAD_TEST_FILE', uploadTestFile);

function onClosed() {
	// dereference the window
	// for multiple windows store them in an array
	mainWindow = null;
}

function createMainWindow() {
	const win = new electron.BrowserWindow({
		show: false,
		height: 720,
		width: 1080,
	});

	// win.maximize();
	// win.openDevTools();

	win.once('ready-to-show', function() {
		win.show()
	});

	win.loadURL(`file://${__dirname}/index.html`);
	win.on('closed', onClosed);

	return win;
}

function initDropbox(event) {
	dbx = new Dropbox({ clientId: CLIENT_ID });
	const authUrl = dbx.getAuthenticationUrl('http://localhost:3333/auth');
	event.sender.send('AUTH_URL_FETCHED', authUrl);
}

function authTokenReceived(event, params) {
	token = params;
	console.log(token);
	dbx = new Dropbox({accessToken: params.access_token});
	authWindow.close();

	getUserInfo();
}

function openAuthWindow(event, link) {
	authWindow = new electron.BrowserWindow({
		alwaysOnTop: true,
		minimizable: false,
		height: 480,
		width: 720,
		frame: false,
		show: false
	});

	authWindow.loadURL(link);
	authWindow.once('ready-to-show', function(){
		authWindow.show();
	});
}

function getUserInfo(){
	mainWindow.webContents.send('FETCHING_USER_INFO');
	ajax
	.post('https://api.dropboxapi.com/2/users/get_current_account')
	.set('Authorization', 'Bearer ' + token.access_token)
	.accept('json')
	.end(function(err, res) {
		if(res.status === 200) {
			user = res.body;
			mainWindow.webContents.send('USER_INFO_FETCHED', user);
		}
	});
}

function listFiles(){
	mainWindow.webContents.send('SYNCING_FILES');
	dbx.filesListFolder({ path: '' })
	.then(function (response) {
		mainWindow.webContents.send('FILES_FETCHED', response.entries);
	})
	.catch(function (err) {
		console.log(err);
	});
}

function uploadTestFile(){
	uploadFile(path.join(__dirname, '/readme.md'),'/readme.md');
}

function uploadFile(src, dest){
	dbx = new Dropbox({accessToken: token.access_token});
	fs.readFile(src, 'utf8', function (err, contents) {
		if (err) {
			console.log('Error: ', err);
		}

		dbx.filesUpload({ path: dest, contents: contents })
		.then(function (response) {
			mainWindow.webContents.send('FILE_UPLOADED');
			listFiles();
		})
		.catch(function (err) {
			console.log(err);
		});
	});
}

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

app.on('activate', () => {
	if (!mainWindow) {
		mainWindow = createMainWindow();
	}
});

app.on('ready', () => {
	mainWindow = createMainWindow();
});
