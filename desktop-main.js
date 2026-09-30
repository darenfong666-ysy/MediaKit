import { app, BrowserWindow, dialog, ipcMain } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promises as fs } from "node:fs";
import { createServer as createNetServer } from "node:net";
import { autoUpdater } from "electron-updater";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BUILD_ID = "2026-09-22.1";
let port = process.env.PORT || "";

let mainWindow;
const gotSingleInstanceLock = app.requestSingleInstanceLock();

if (!gotSingleInstanceLock) {
  app.exit(0);
}

async function startLocalServer() {
  process.env.KEPLER_DATA_DIR = path.join(app.getPath("userData"), "workspace");
  if (!port) port = String(await findFreePort());
  process.env.PORT = port;
  const logFile = path.join(app.getPath("userData"), "startup.log");
  const writeStartupLog = async (message) => {
    const line = `[${new Date().toISOString()}] ${message}\n`;
    await fs.appendFile(logFile, line).catch(() => {});
  };

  await writeStartupLog(`Starting local server (build ${BUILD_ID}).`);
  const serverModule = await Promise.race([
    import("./server.js"),
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error("本地服务启动超过 15 秒，可能卡在模型依赖初始化。")), 15000);
    })
  ]);

  if (serverModule.serverReady) await serverModule.serverReady;
  await writeStartupLog(`Local server ready at http://127.0.0.1:${port} (build ${BUILD_ID}).`);
}

function findFreePort() {
  return new Promise((resolve, reject) => {
    const probe = createNetServer();
    probe.once("error", reject);
    probe.listen(0, "127.0.0.1", () => {
      const address = probe.address();
      const pickedPort = typeof address === "object" && address ? address.port : 0;
      probe.close(() => resolve(pickedPort));
    });
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1220,
    height: 760,
    minWidth: 980,
    minHeight: 640,
    center: true,
    title: "MediaKit",
    icon: path.join(__dirname, "assets", "kepler.png"),
    backgroundColor: "#eef0f2",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, "desktop-preload.cjs")
    }
  });

  mainWindow.removeMenu();
  mainWindow.once("ready-to-show", () => revealWindow());
  mainWindow.loadURL(
    `data:text/html;charset=utf-8,${encodeURIComponent(`
      <!doctype html>
      <html lang="zh-CN">
        <meta charset="utf-8">
        <title>MediaKit</title>
        <body style="margin:0;font-family:system-ui,Segoe UI,sans-serif;background:#f4f7fb;color:#1c2633;display:grid;place-items:center;height:100vh">
          <div style="max-width:520px;padding:32px;text-align:center">
            <h1 style="margin:0 0 12px;font-size:28px">MediaKit 正在启动</h1>
            <p style="margin:0;color:#5d6b7c;line-height:1.6">正在初始化本地服务和模型环境，请稍等。</p>
          </div>
        </body>
      </html>
    `)}`
  );
  revealWindow();
}

function revealWindow() {
  if (!mainWindow) return;
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.center();
  if (!mainWindow.isVisible()) mainWindow.show();
  mainWindow.setAlwaysOnTop(true);
  mainWindow.focus();
  mainWindow.setAlwaysOnTop(false);
}

function showStartupError(error) {
  if (!mainWindow) return;
  const logPath = path.join(app.getPath("userData"), "startup.log");
  mainWindow.loadURL(
    `data:text/html;charset=utf-8,${encodeURIComponent(`
      <!doctype html>
      <html lang="zh-CN">
        <meta charset="utf-8">
        <title>MediaKit 启动失败</title>
        <body style="margin:0;font-family:system-ui,Segoe UI,sans-serif;background:#f4f7fb;color:#1c2633;display:grid;place-items:center;min-height:100vh">
          <main style="max-width:680px;padding:32px">
            <h1 style="margin:0 0 12px;font-size:28px">MediaKit 启动失败</h1>
            <p style="line-height:1.6;color:#435063">${String(error.message || error)}</p>
            <p style="line-height:1.6;color:#5d6b7c">启动日志：${logPath}</p>
          </main>
        </body>
      </html>
    `)}`
  );
}

function setupAutoUpdates() {
  if (!app.isPackaged || !mainWindow) return;

  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on("update-available", async (info) => {
    const result = await dialog.showMessageBox(mainWindow, {
      type: "info",
      title: "MediaKit 有新版本",
      message: `发现新版本 ${info.version}`,
      detail: "是否现在下载更新？下载完成后可以重启安装。",
      buttons: ["下载更新", "暂不更新"],
      defaultId: 0,
      cancelId: 1
    });

    if (result.response === 0) {
      autoUpdater.downloadUpdate().catch(() => {});
    }
  });

  autoUpdater.on("update-downloaded", async () => {
    const result = await dialog.showMessageBox(mainWindow, {
      type: "info",
      title: "MediaKit 更新已下载",
      message: "更新已经准备好。",
      detail: "立即重启即可完成安装，也可以稍后手动重启。",
      buttons: ["立即重启", "稍后"],
      defaultId: 0,
      cancelId: 1
    });

    if (result.response === 0) autoUpdater.quitAndInstall();
  });

  setTimeout(() => {
    autoUpdater.checkForUpdates().catch(() => {});
  }, 6000);
}

if (gotSingleInstanceLock) {
  app.on("second-instance", () => {
    revealWindow();
  });

  ipcMain.handle("choose-files", async (_event, mode) => {
    const filters = mode === "compression"
      ? [{ name: "媒体和文档", extensions: ["mp4", "mov", "mkv", "avi", "webm", "m4v", "wav", "mp3", "flac", "aac", "m4a", "ogg", "pdf", "png", "jpg", "jpeg", "webp", "bmp", "tif", "tiff", "gif", "heic"] }]
      : mode?.startsWith("video")
      ? [{ name: "Video", extensions: ["mp4", "mov", "mkv", "avi", "webm"] }]
      : mode?.startsWith("audio")
        ? [{ name: "Audio", extensions: ["wav", "mp3", "flac", "aac", "m4a", "ogg"] }]
        : [{ name: "Image", extensions: ["png", "jpg", "jpeg", "webp", "bmp"] }];

    const result = await dialog.showOpenDialog(mainWindow, {
      title: "选择素材",
      properties: mode === "image-upscale" || mode === "cutout" || mode === "video-upscale" || mode === "audio-separate" || mode === "compression" ? ["openFile", "multiSelections"] : ["openFile"],
      filters
    });

    return result.canceled ? [] : result.filePaths;
  });

  app.whenReady().then(() => {
    createWindow();
    startLocalServer()
      .then(() => {
        mainWindow?.loadURL(`http://127.0.0.1:${port}`);
        setupAutoUpdates();
      })
      .catch((error) => showStartupError(error));
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
}

