const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("keplerDesktop", {
  chooseFiles: (mode) => ipcRenderer.invoke("choose-files", mode)
});
