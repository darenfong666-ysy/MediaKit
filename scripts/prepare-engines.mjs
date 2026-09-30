import { createWriteStream, promises as fs } from "node:fs";
import https from "node:https";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const cacheDir = path.join(root, ".engine-cache");
const enginesDir = path.join(root, "engines");

const packages = [
  {
    key: "waifu2x",
    url: "https://github.com/nihui/waifu2x-ncnn-vulkan/releases/download/20250915/waifu2x-ncnn-vulkan-20250915-windows.zip",
    zip: "waifu2x-ncnn-vulkan-20250915-windows.zip",
    exe: "waifu2x-ncnn-vulkan.exe"
  },
  {
    key: "realesrgan",
    url: "https://github.com/xinntao/Real-ESRGAN-ncnn-vulkan/releases/download/v0.2.0/realesrgan-ncnn-vulkan-v0.2.0-windows.zip",
    zip: "realesrgan-ncnn-vulkan-v0.2.0-windows.zip",
    exe: "realesrgan-ncnn-vulkan.exe"
  },
  {
    key: "rife",
    url: "https://github.com/nihui/rife-ncnn-vulkan/releases/download/20221029/rife-ncnn-vulkan-20221029-windows.zip",
    zip: "rife-ncnn-vulkan-20221029-windows.zip",
    exe: "rife-ncnn-vulkan.exe"
  }
];

const files = [
  {
    key: "realesrgan-x4plus.param",
    url: "https://huggingface.co/edgetools/realesrgan/resolve/main/realesrgan-x4plus.param",
    target: "engines/realesrgan/models/realesrgan-x4plus.param"
  },
  {
    key: "realesrgan-x4plus.bin",
    url: "https://huggingface.co/edgetools/realesrgan/resolve/main/realesrgan-x4plus.bin",
    target: "engines/realesrgan/models/realesrgan-x4plus.bin"
  },
  {
    key: "realesrgan-x4plus-anime.param",
    url: "https://raw.githubusercontent.com/genie-design/ESRGAN-ncnn-models/main/realesrgan-x4plus-anime/realesrgan-x4plus-anime.param",
    target: "engines/realesrgan/models/realesrgan-x4plus-anime.param"
  },
  {
    key: "realesrgan-x4plus-anime.bin",
    url: "https://raw.githubusercontent.com/genie-design/ESRGAN-ncnn-models/main/realesrgan-x4plus-anime/realesrgan-x4plus-anime.bin",
    target: "engines/realesrgan/models/realesrgan-x4plus-anime.bin"
  },
  {
    key: "realesr-animevideov3-x2.param",
    url: "https://huggingface.co/edgetools/realesrgan/resolve/main/realesr-animevideov3-x2.param",
    target: "engines/realesrgan/models/realesr-animevideov3-x2.param"
  },
  {
    key: "realesr-animevideov3-x2.bin",
    url: "https://huggingface.co/edgetools/realesrgan/resolve/main/realesr-animevideov3-x2.bin",
    target: "engines/realesrgan/models/realesr-animevideov3-x2.bin"
  },
  {
    key: "realesr-animevideov3-x3.param",
    url: "https://huggingface.co/edgetools/realesrgan/resolve/main/realesr-animevideov3-x3.param",
    target: "engines/realesrgan/models/realesr-animevideov3-x3.param"
  },
  {
    key: "realesr-animevideov3-x3.bin",
    url: "https://huggingface.co/edgetools/realesrgan/resolve/main/realesr-animevideov3-x3.bin",
    target: "engines/realesrgan/models/realesr-animevideov3-x3.bin"
  },
  {
    key: "realesr-animevideov3-x4.param",
    url: "https://huggingface.co/edgetools/realesrgan/resolve/main/realesr-animevideov3-x4.param",
    target: "engines/realesrgan/models/realesr-animevideov3-x4.param"
  },
  {
    key: "realesr-animevideov3-x4.bin",
    url: "https://huggingface.co/edgetools/realesrgan/resolve/main/realesr-animevideov3-x4.bin",
    target: "engines/realesrgan/models/realesr-animevideov3-x4.bin"
  },
  {
    key: "u2net.onnx",
    url: "https://github.com/danielgatis/rembg/releases/download/v0.0.0/u2net.onnx",
    target: "engines/rembg/models/u2net.onnx"
  },
  {
    key: "u2netp.onnx",
    url: "https://github.com/danielgatis/rembg/releases/download/v0.0.0/u2netp.onnx",
    target: "engines/rembg/models/u2netp.onnx"
  },
  {
    key: "isnet-general-use.onnx",
    url: "https://github.com/danielgatis/rembg/releases/download/v0.0.0/isnet-general-use.onnx",
    target: "engines/rembg/models/isnet-general-use.onnx"
  },
  {
    key: "isnet-anime.onnx",
    url: "https://github.com/danielgatis/rembg/releases/download/v0.0.0/isnet-anime.onnx",
    target: "engines/rembg/models/isnet-anime.onnx"
  },
  {
    key: "birefnet.onnx",
    url: "https://github.com/danielgatis/rembg/releases/download/v0.0.0/BiRefNet-general-epoch_244.onnx",
    target: "engines/rembg/models/birefnet.onnx"
  },
  {
    key: "birefnet-lite.onnx",
    url: "https://github.com/danielgatis/rembg/releases/download/v0.0.0/BiRefNet-general-bb_swin_v1_tiny-epoch_232.onnx",
    target: "engines/rembg/models/birefnet-lite.onnx"
  }
];

function request(url, redirects = 0) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { "user-agent": "kepler-engine-preparer" } }, (res) => {
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
        res.resume();
        if (redirects > 8) reject(new Error(`Too many redirects for ${url}`));
        else resolve(request(new URL(res.headers.location, url).toString(), redirects + 1));
        return;
      }
      if (res.statusCode !== 200) {
        res.resume();
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        return;
      }
      resolve(res);
    });
    req.on("error", reject);
  });
}

async function download(pkg) {
  await fs.mkdir(cacheDir, { recursive: true });
  const target = path.join(cacheDir, pkg.zip);
  try {
    const stat = await fs.stat(target);
    if (stat.size > 1024 * 1024) {
      console.log(`${pkg.key}: cached ${pkg.zip}`);
      return target;
    }
  } catch {}

  console.log(`${pkg.key}: downloading ${pkg.url}`);
  const res = await request(pkg.url);
  const total = Number(res.headers["content-length"] || 0);
  let done = 0;
  await new Promise((resolve, reject) => {
    const out = createWriteStream(target);
    res.on("data", (chunk) => {
      done += chunk.length;
      if (total) process.stdout.write(`\r${pkg.key}: ${Math.round((done / total) * 100)}%`);
    });
    res.pipe(out);
    out.on("finish", () => {
      process.stdout.write("\n");
      resolve();
    });
    out.on("error", reject);
  });
  return target;
}

async function downloadFile(file) {
  const target = path.join(root, file.target);
  try {
    const stat = await fs.stat(target);
    if (stat.size > 1024) {
      console.log(`${file.key}: ready`);
      return;
    }
  } catch {}

  await fs.mkdir(path.dirname(target), { recursive: true });
  console.log(`${file.key}: downloading ${file.url}`);
  const res = await request(file.url);
  const total = Number(res.headers["content-length"] || 0);
  let done = 0;
  await new Promise((resolve, reject) => {
    const out = createWriteStream(target);
    res.on("data", (chunk) => {
      done += chunk.length;
      if (total) process.stdout.write(`\r${file.key}: ${Math.round((done / total) * 100)}%`);
    });
    res.pipe(out);
    out.on("finish", () => {
      process.stdout.write("\n");
      resolve();
    });
    out.on("error", reject);
  });
}

function expand(zip, destination) {
  return new Promise((resolve, reject) => {
    const ps = spawn("powershell", [
      "-NoProfile",
      "-Command",
      "Expand-Archive -LiteralPath $env:KEPLER_ZIP -DestinationPath $env:KEPLER_DEST -Force"
    ], {
      stdio: "inherit",
      windowsHide: true,
      env: { ...process.env, KEPLER_ZIP: zip, KEPLER_DEST: destination }
    });
    ps.on("exit", (code) => code === 0 ? resolve() : reject(new Error(`Expand failed: ${zip}`)));
  });
}

async function findRoot(dir, exe) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const location = path.join(dir, entry.name);
    if (entry.isFile() && entry.name.toLowerCase() === exe.toLowerCase()) return dir;
    if (entry.isDirectory()) {
      const found = await findRoot(location, exe);
      if (found) return found;
    }
  }
  return null;
}

async function copyDir(source, destination) {
  await fs.rm(destination, { recursive: true, force: true });
  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.cp(source, destination, { recursive: true });
}

async function install(pkg) {
  const installedExe = path.join(enginesDir, pkg.key, pkg.exe);
  try {
    const stat = await fs.stat(installedExe);
    if (stat.isFile()) {
      console.log(`${pkg.key}: executable ready`);
      return;
    }
  } catch {}

  const zip = await download(pkg);
  const expanded = path.join(cacheDir, `${pkg.key}-expanded`);
  await fs.rm(expanded, { recursive: true, force: true });
  await fs.mkdir(expanded, { recursive: true });
  console.log(`${pkg.key}: extracting`);
  await expand(zip, expanded);
  const rootDir = await findRoot(expanded, pkg.exe);
  if (!rootDir) throw new Error(`${pkg.key}: executable not found after extraction`);
  await copyDir(rootDir, path.join(enginesDir, pkg.key));
  console.log(`${pkg.key}: ready`);
}

await fs.mkdir(enginesDir, { recursive: true });
for (const pkg of packages) await install(pkg);
for (const file of files) await downloadFile(file);
console.log("all selected engines are ready");
