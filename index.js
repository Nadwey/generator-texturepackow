const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require("fs");

function pathHere(_path) {
  return require("path").join(__dirname, _path);
}

function createWindow () {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    minWidth: 300,
    title: "Tworzyciel texture packów",
    frame: false,
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true,
      enableRemoteModule: true
    }
  })

  win.setMenuBarVisibility(false);
  win.loadFile('index.html');
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

let ProgressWin;

ipcMain.on("showProgressWindow", (event) => {
    
    ProgressWin = new BrowserWindow({
        width: 1000,
        height: 350,
        frame: false,
        webPreferences: {
            contextIsolation: false,
            nodeIntegration: true,
            enableRemoteModule: true
        }
    });
    ProgressWin.loadFile(pathHere('pliki/progress.html'));
});


ipcMain.on("setStepProgress", (event, value) => {
    ProgressWin.webContents.send("setStepProgress", value);
});

ipcMain.on("setKomunikat", (event, value) => {
    ProgressWin.webContents.send("setKomunikat", value);
});

ipcMain.on("setTotalProgress", (event, value) => {
    ProgressWin.webContents.send("setTotalProgress", value);
});

ipcMain.on("Zakonczono", (event) => {
    ProgressWin.webContents.send("Zakonczono");
});