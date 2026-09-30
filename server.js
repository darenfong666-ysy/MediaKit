import { createServer } from "node:http";
import { createReadStream, promises as fs } from "node:fs";
import { execFile, spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";
import ffmpegStatic from "ffmpeg-static";
import ffprobeStatic from "ffprobe-static";
import { promisify } from "node:util";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = __dirname;
const resourceRoot = process.resourcesPath || root;
const publicDir = path.join(root, "src");
const dataRoot = process.env.KEPLER_DATA_DIR || root;
const logsDir = path.join(dataRoot, "logs");
const uploadsDir = path.join(dataRoot, "uploads");
const audioPreviewDir = path.join(uploadsDir, ".audio-previews");
const jobs = new Map();
let imageModelQueue = Promise.resolve();
const execFileAsync = promisify(execFile);
function usesImageModelQueue(plan) {
  return ["cutout", "image-upscale-photo", "image-upscale-waifu", "video-upscale", "video-interpolate", "video-suite"].includes(plan?.pipeline);
}

function executablePath(location) {
  return location ? location.replace(`${path.sep}app.asar${path.sep}`, `${path.sep}app.asar.unpacked${path.sep}`) : null;
}

const builtInFfmpeg = executablePath(ffmpegStatic) ? [executablePath(ffmpegStatic)] : [];
const builtInFfprobe = executablePath(ffprobeStatic?.path) ? [executablePath(ffprobeStatic.path)] : [];

const mime = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".webp", "image/webp"],
  [".svg", "image/svg+xml"],
  [".mp4", "video/mp4"],
  [".webm", "video/webm"],
  [".mov", "video/quicktime"],
  [".mkv", "video/x-matroska"],
  [".wav", "audio/wav"],
  [".mp3", "audio/mpeg"],
  [".flac", "audio/flac"],
  [".m4a", "audio/mp4"],
  [".aac", "audio/aac"],
  [".ogg", "audio/ogg"],
  [".pdf", "application/pdf"]
]);

const engineCandidates = {
  ffmpeg: [...builtInFfmpeg, "engines/ffmpeg/ffmpeg.exe", "engines/ffmpeg.exe", "ffmpeg"],
  ffprobe: [...builtInFfprobe, "engines/ffmpeg/ffprobe.exe", "engines/ffprobe.exe", "ffprobe"],
  waifu: ["engines/waifu2x/waifu2x-ncnn-vulkan.exe", "engines/waifu2x-ncnn-vulkan.exe"],
  photo: ["engines/realesrgan/realesrgan-ncnn-vulkan.exe", "engines/realesrgan-ncnn-vulkan.exe"],
  rife: ["engines/rife/rife-ncnn-vulkan-ex.exe", "engines/rife/rife-ncnn-vulkan.exe", "engines/rife-ncnn-vulkan.exe"],
  rembg: ["engines/rembg/rembg.exe", "engines/rembg.exe"],
  demucs: ["engines/demucs/demucs.exe", "engines/demucs.exe", "demucs"],
  ghostscript: ["engines/ghostscript/gswin64c.exe", "engines/ghostscript/gswin32c.exe", "gswin64c", "gswin32c", "gs"]
};

const waifuModels = new Set([
  "models-cunet",
  "models-upconv_7_anime_style_art_rgb",
  "models-upconv_7_photo"
]);

const esrganModels = new Set([
  "realesr-animevideov3",
  "realesrgan-x4plus-anime",
  "realesrgan-x4plus"
]);

const nativeFourScaleModels = new Set([
  "realesrgan-x4plus-anime",
  "realesrgan-x4plus"
]);

const cutoutModels = new Set([
  "birefnet-lite",
  "birefnet",
  "isnet-general-use",
  "isnet-anime",
  "u2net",
  "u2netp"
]);

const rifeModels = new Set([
  "rife-v4.6",
  "rife-v4.13",
  "rife-v4.26",
  "rife-anime",
  "rife-HD",
  "rife-UHD",
  "rife-v2.3"
]);

const supportedImageOutputExts = new Set([".png", ".jpg", ".jpeg", ".bmp", ".tif", ".tiff", ".gif", ".webp", ".heic"]);
const supportedVideoExts = new Set([".mp4", ".webm", ".mov", ".mkv", ".avi", ".m4v"]);
const supportedAudioExts = new Set([".wav", ".mp3", ".flac", ".aac", ".m4a", ".ogg"]);
const supportedCompressionExts = new Set([
  ...supportedImageOutputExts,
  ...supportedVideoExts,
  ...supportedAudioExts,
  ".pdf"
]);

function isVideoPath(filePath) {
  return supportedVideoExts.has(path.extname(filePath).toLowerCase());
}

function isAudioPath(filePath) {
  return supportedAudioExts.has(path.extname(filePath).toLowerCase());
}

function isPdfPath(filePath) {
  return path.extname(filePath).toLowerCase() === ".pdf";
}

function compressionOutputExtension(input) {
  const ext = path.extname(input).toLowerCase();
  return ext === ".wav" ? ".mp3" : ext;
}

function videoOutputExtension(format, input = "") {
  if (format === "mp4") return ".mp4";
  if (format === "mkv") return ".mkv";
  const ext = path.extname(input).toLowerCase();
  return supportedVideoExts.has(ext) ? ext : ".mp4";
}

async function makeVideoPoster(filePath) {
  if (!isVideoPath(filePath)) return "";
  const ffmpeg = await resolveEngine("ffmpeg");
  if (!ffmpeg) return "";
  const ext = path.extname(filePath);
  const posterPath = filePath.slice(0, -ext.length) + ".poster.jpg";
  const attempts = [
    ["-y", "-ss", "0.3", "-i", filePath, "-frames:v", "1", "-q:v", "3", posterPath],
    ["-y", "-i", filePath, "-frames:v", "1", "-q:v", "3", posterPath]
  ];
  for (const args of attempts) {
    try {
      await execFileAsync(ffmpeg, args, { windowsHide: true, timeout: 15000 });
      const stat = await fs.stat(posterPath);
      if (stat.isFile() && stat.size > 0) return posterPath;
    } catch {
      // Some containers cannot seek early; try the next extraction form.
    }
  }
  return "";
}

function imageFormat(value) {
  return value === "jpg" || value === "original" ? value : "png";
}

function imageExtension(format, input = "") {
  if (format === "jpg") return ".jpg";
  if (format === "original") {
    const ext = path.extname(input).toLowerCase();
    return supportedImageOutputExts.has(ext) ? ext : ".png";
  }
  return ".png";
}

function engineImageFormat(format, input = "") {
  const ext = imageExtension(format, input);
  if (ext === ".jpg" || ext === ".jpeg") return "jpg";
  if (ext === ".webp") return "webp";
  return "png";
}

function finalImageFormat(format, input = "") {
  const ext = imageExtension(format, input);
  if (ext === ".jpg" || ext === ".jpeg") return "jpg";
  if (ext === ".webp") return "webp";
  if (ext === ".bmp") return "bmp";
  if (ext === ".tif" || ext === ".tiff") return "tiff";
  if (ext === ".gif") return "gif";
  if (ext === ".heic") return "heif";
  return "png";
}

function applySharpImageFormat(output, finalFormat, flatten = false) {
  let next = output;
  if (flatten) next = next.flatten({ background: "#ffffff" });
  if (finalFormat === "jpg") return next.jpeg({ quality: 95, mozjpeg: true });
  if (finalFormat === "webp") return next.webp({ quality: 95 });
  if (finalFormat === "tiff") return next.tiff({ quality: 95 });
  if (finalFormat === "gif") return next.gif();
  if (finalFormat === "heif") return next.heif({ quality: 95 });
  return next.png({ compressionLevel: 9, adaptiveFiltering: true });
}

async function saveSharpImage(output, target, finalFormat, { flatten = false, workDir = path.dirname(target), log, job } = {}) {
  if (finalFormat === "bmp") {
    const pngTarget = path.join(workDir, `${path.basename(target)}.source.png`);
    await applySharpImageFormat(output, "png", flatten).toFile(pngTarget);
    const ffmpeg = await resolveEngine("ffmpeg");
    await spawnStep(ffmpeg, ["-y", "-i", pngTarget, target], log, job);
    return;
  }
  await applySharpImageFormat(output, finalFormat, flatten).toFile(target);
}

function sendJson(res, status, data) {
  const body = JSON.stringify(data, null, 2);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store"
  });
  res.end(body);
}

async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

function sanitizeName(name) {
  const clean = String(name || "asset.bin")
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "_")
    .replace(/\s+/g, " ")
    .trim() || "asset.bin";
  const ext = path.extname(clean).slice(0, 12);
  const base = path.basename(clean, ext).slice(0, 64) || "asset";
  return `${base}${ext || ".bin"}`;
}

async function readMultipartFile(req) {
  const type = req.headers["content-type"] || "";
  const match = type.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
  if (!match) throw new Error("缺少上传边界。");

  const boundary = Buffer.from(`--${match[1] || match[2]}`);
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const body = Buffer.concat(chunks);
  const start = body.indexOf(boundary);
  if (start < 0) throw new Error("上传内容不完整。");

  const headerStart = start + boundary.length + 2;
  const headerEnd = body.indexOf(Buffer.from("\r\n\r\n"), headerStart);
  if (headerEnd < 0) throw new Error("上传头信息不完整。");

  const header = body.subarray(headerStart, headerEnd).toString("utf8");
  const filename = sanitizeName((header.match(/filename="([^"]*)"/i) || [])[1]);
  const dataStart = headerEnd + 4;
  const nextBoundary = body.indexOf(Buffer.from(`\r\n--${match[1] || match[2]}`), dataStart);
  if (nextBoundary < 0) throw new Error("上传文件内容不完整。");

  return { filename, data: body.subarray(dataStart, nextBoundary) };
}

async function saveUpload(req) {
  const file = await readMultipartFile(req);
  await fs.mkdir(uploadsDir, { recursive: true });
  return saveAsset(file.filename, file.data);
}

function uploadedTarget(filename) {
  const id = crypto.randomUUID();
  const cleanName = sanitizeName(filename);
  const ext = path.extname(cleanName);
  const base = path.basename(cleanName, ext);
  const savedName = `${id}-${base}${ext}`;
  return { id, cleanName, savedPath: path.join(uploadsDir, savedName) };
}

async function saveAsset(filename, data) {
  await fs.mkdir(uploadsDir, { recursive: true });
  const { id, cleanName, savedPath } = uploadedTarget(filename);
  await fs.writeFile(savedPath, data);
  const posterPath = await makeVideoPoster(savedPath);
  return {
    id,
    name: cleanName,
    size: data.length,
    path: savedPath,
    type: mime.get(path.extname(savedPath)) || "application/octet-stream",
    mediaType: isVideoPath(savedPath) ? "video" : isAudioPath(savedPath) ? "audio" : "image",
    previewUrl: isAudioPath(savedPath)
      ? `/api/audio-preview?path=${encodeURIComponent(savedPath)}`
      : `/api/preview?path=${encodeURIComponent(savedPath)}`,
    posterUrl: posterPath ? `/api/preview?path=${encodeURIComponent(posterPath)}` : ""
  };
}

async function saveLocalFile(source) {
  await fs.mkdir(uploadsDir, { recursive: true });
  const { id, cleanName, savedPath } = uploadedTarget(path.basename(source));
  await fs.copyFile(source, savedPath);
  const stat = await fs.stat(savedPath);
  const posterPath = await makeVideoPoster(savedPath);
  return {
    id,
    name: cleanName,
    size: stat.size,
    path: savedPath,
    type: mime.get(path.extname(savedPath)) || "application/octet-stream",
    mediaType: isVideoPath(savedPath) ? "video" : isAudioPath(savedPath) ? "audio" : "image",
    previewUrl: isAudioPath(savedPath)
      ? `/api/audio-preview?path=${encodeURIComponent(savedPath)}`
      : `/api/preview?path=${encodeURIComponent(savedPath)}`,
    posterUrl: posterPath ? `/api/preview?path=${encodeURIComponent(posterPath)}` : ""
  };
}

async function importLocalPath(payload) {
  const source = path.normalize(String(payload.path || ""));
  const stat = await fs.stat(source);
  if (!stat.isFile()) throw new Error("请选择文件。");
  return saveLocalFile(source);
}

async function ensureAudioPreview(source) {
  await fs.mkdir(audioPreviewDir, { recursive: true });
  const key = crypto.createHash("sha1").update(source).digest("hex");
  const target = path.join(audioPreviewDir, `${key}.wav`);
  try {
    const stat = await fs.stat(target);
    if (stat.size > 44) return target;
  } catch {}
  const ffmpeg = await resolveEngine("ffmpeg");
  if (!ffmpeg) throw new Error("缺少 FFmpeg，无法生成音频预览。");
  await execFileAsync(ffmpeg, [
    "-y", "-i", source, "-vn", "-ac", "2", "-ar", "44100", "-c:a", "pcm_s16le", target
  ], { windowsHide: true });
  return target;
}

async function streamMediaFile(req, res, target, { download = false } = {}) {
  const stat = await fs.stat(target);
  if (!stat.isFile()) throw new Error("Not a file");
  const contentType = mime.get(path.extname(target)) || "application/octet-stream";
  const range = String(req.headers.range || "");
  const headers = {
    "content-type": contentType,
    "accept-ranges": "bytes",
    "cache-control": "no-cache"
  };
  if (download) headers["content-disposition"] = `attachment; filename="${encodeURIComponent(path.basename(target))}"`;
  if (!range) {
    res.writeHead(200, { ...headers, "content-length": stat.size });
    return createReadStream(target).pipe(res);
  }
  const match = /^bytes=(\d*)-(\d*)$/i.exec(range);
  if (!match) {
    res.writeHead(416, { "content-range": `bytes */${stat.size}` });
    return res.end();
  }
  const start = match[1] ? Number(match[1]) : Math.max(0, stat.size - Number(match[2] || 0));
  const end = match[2] ? Number(match[2]) : stat.size - 1;
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || start > end || end >= stat.size) {
    res.writeHead(416, { "content-range": `bytes */${stat.size}` });
    return res.end();
  }
  res.writeHead(206, {
    ...headers,
    "content-length": end - start + 1,
    "content-range": `bytes ${start}-${end}/${stat.size}`
  });
  return createReadStream(target, { start, end }).pipe(res);
}

async function exists(candidate) {
  try {
    await fs.access(candidate);
    return true;
  } catch {
    return false;
  }
}

async function isFile(candidate) {
  try {
    return (await fs.stat(candidate)).isFile();
  } catch {
    return false;
  }
}

async function findOnPath(command) {
  try {
    const lookup = process.platform === "win32" ? "where.exe" : "command";
    const args = process.platform === "win32" ? [command] : ["-v", command];
    const { stdout } = await execFileAsync(lookup, args, { windowsHide: true });
    return stdout.split(/\r?\n/).map((line) => line.trim()).find(Boolean) || null;
  } catch {
    return null;
  }
}

async function resolveEngine(key) {
  if (key === "rembg") {
    const runtime = path.join(root, "node_modules", "@tugrul", "rembg", "dist", "index.js");
    return await exists(runtime) ? runtime : null;
  }

  if (key === "demucs") {
    const runtime = path.join(root, "node_modules", "demucs", "dist", "apply.js");
    return await exists(runtime) ? runtime : null;
  }

  if (key === "ghostscript") {
    const roots = [
      "C:\\Program Files\\gs",
      "C:\\Program Files (x86)\\gs",
      "D:\\gs10.08.0",
      "D:\\gs",
      "E:\\gs10.08.0",
      "E:\\gs"
    ];
    for (const rootPath of roots) {
      const direct = path.join(rootPath, "bin", "gswin64c.exe");
      if (await isFile(direct)) return direct;
      const direct32 = path.join(rootPath, "bin", "gswin32c.exe");
      if (await isFile(direct32)) return direct32;
      try {
        const entries = await fs.readdir(rootPath, { withFileTypes: true });
        for (const entry of entries.filter((item) => item.isDirectory())) {
          const candidate = path.join(rootPath, entry.name, "bin", "gswin64c.exe");
          if (await isFile(candidate)) return candidate;
          const candidate32 = path.join(rootPath, entry.name, "bin", "gswin32c.exe");
          if (await isFile(candidate32)) return candidate32;
        }
      } catch {}
    }
  }

  for (const candidate of engineCandidates[key] ?? []) {
    if (path.isAbsolute(candidate)) {
      if (key === "ghostscript" ? await isFile(candidate) : await exists(candidate)) return candidate;
      continue;
    }

    if (!candidate.includes("/") && !candidate.includes("\\")) {
      const found = await findOnPath(candidate);
      if (found) return found;
      continue;
    }

    const locations = [
      path.join(dataRoot, candidate),
      path.join(resourceRoot, candidate),
      path.join(root, candidate)
    ];
    for (const location of locations) {
      if (key === "ghostscript" ? await isFile(location) : await exists(location)) return location;
    }
  }
  return null;
}

const ghostscriptProbeCache = new Map();

async function isGhostscriptUsable(executable) {
  if (!executable) return false;
  if (ghostscriptProbeCache.has(executable)) return ghostscriptProbeCache.get(executable);
  try {
    await execFileAsync(executable, [
      "-q", "-dNODISPLAY", "-dBATCH", "-dNOPAUSE",
      "-sDEVICE=pdfwrite", "-c", "quit"
    ], { windowsHide: true, timeout: 5000 });
    ghostscriptProbeCache.set(executable, true);
    return true;
  } catch {
    ghostscriptProbeCache.set(executable, false);
    return false;
  }
}

async function engineStatus() {
  const entries = await Promise.all(
    Object.keys(engineCandidates).map(async (key) => {
      const value = await resolveEngine(key);
      const usable = key === "ghostscript" ? await isGhostscriptUsable(value) : Boolean(value);
      return [key, usable ? value : null];
    })
  );
  const status = Object.fromEntries(entries.map(([key, value]) => [key, { available: Boolean(value), path: value }]));
  return status;
}

function outputFor(input, outputDir, suffix, ext) {
  const parsed = path.parse(input);
  return path.join(outputDir || parsed.dir, `${parsed.name}_${suffix}${ext || parsed.ext}`);
}

function modelDir(exe, model) {
  return path.join(path.dirname(exe || root), model);
}

function esrganModelDir(exe) {
  return path.join(path.dirname(exe || root), "models");
}

async function cutoutModelPath(model) {
  const filename = `${model}.onnx`;
  const locations = [
    path.join(dataRoot, "engines", "rembg", "models", filename),
    path.join(resourceRoot, "engines", "rembg", "models", filename),
    path.join(root, "engines", "rembg", "models", filename)
  ];
  for (const location of locations) {
    if (await exists(location)) return location;
  }
  return null;
}

function pathInside(target, container) {
  const relative = path.relative(container, target);
  return Boolean(relative) && !relative.startsWith("..") && !path.isAbsolute(relative);
}

async function modelAvailable(exe, model, grouped = false) {
  const dir = grouped ? esrganModelDir(exe) : modelDir(exe, model);
  if (grouped) {
    if (model === "realesr-animevideov3") {
      return exists(path.join(dir, "realesr-animevideov3-x2.bin"))
        && exists(path.join(dir, "realesr-animevideov3-x2.param"));
    }
    return exists(path.join(dir, `${model}.bin`)) && exists(path.join(dir, `${model}.param`));
  }
  return exists(dir);
}

async function videoFps(input) {
  const exe = await resolveEngine("ffprobe");
  if (!exe) return 30;
  try {
    const { stdout } = await execFileAsync(exe, [
      "-v", "error",
      "-select_streams", "v:0",
      "-show_entries", "stream=avg_frame_rate",
      "-of", "default=noprint_wrappers=1:nokey=1",
      input
    ], { windowsHide: true });
    const raw = stdout.trim();
    if (raw.includes("/")) {
      const [num, den] = raw.split("/").map(Number);
      if (num > 0 && den > 0) return num / den;
    }
    const value = Number(raw);
    if (value > 0) return value;
  } catch {}
  return 30;
}

async function countFrames(dir) {
  const entries = await fs.readdir(dir);
  return entries.filter((name) => /\.(png|jpg|jpeg|webp)$/i.test(name)).length;
}

async function fileExists(target) {
  try {
    const stat = await fs.stat(target);
    return stat.isFile();
  } catch {
    return false;
  }
}

async function reconcileOutput(plan, log) {
  if (!plan.output || await fileExists(plan.output)) return;
  const candidates = [
    `${plan.output}.png`,
    `${plan.output}.jpg`,
    `${plan.output}.webp`
  ];
  const parsed = path.parse(plan.output);
  candidates.push(
    path.join(parsed.dir, `${parsed.name}.png`),
    path.join(parsed.dir, `${parsed.name}.jpg`),
    path.join(parsed.dir, `${parsed.name}.webp`)
  );

  for (const candidate of [...new Set(candidates)]) {
    if (await fileExists(candidate)) {
      await log.appendFile(`\nresolved output: ${candidate}\n`).catch(() => {});
      plan.output = candidate;
      plan.outputs = [candidate];
      return;
    }
  }
}

async function attachOutputSizes(plan) {
  const outputs = Array.isArray(plan.outputs) ? plan.outputs : plan.output ? [plan.output] : [];
  const sizes = {};
  for (const output of outputs) {
    try {
      const stat = await fs.stat(output);
      if (stat.isFile()) sizes[output] = stat.size;
    } catch {}
  }
  if (Object.keys(sizes).length) plan.outputSizes = sizes;
}

async function planJob(payload) {
  const input = String(payload.uploadedPath || payload.inputPath || "").trim();
  const outputDir = String(payload.outputDir || "").trim();
  const mode = String(payload.mode || "");
  const options = payload.options || {};

  if (!input) throw new Error("请选择素材文件。");

  if (mode === "image-upscale") {
    const model = String(options.model || "realesrgan-x4plus");
    const scale = String(options.scale || "2");
    const format = imageFormat(options.format);
    const kind = waifuModels.has(model) ? "waifu" : "photo";
    if (kind === "photo" && !esrganModels.has(model)) throw new Error("请选择有效的图片模型。");
    const exe = await resolveEngine(kind);
    if (exe && !(await modelAvailable(exe, model, kind === "photo"))) throw new Error(`缺少模型文件：${model}`);
    const noise = String(options.noise || "1");
    const out = outputFor(input, outputDir, `up${scale}x`, imageExtension(format, input));
    if (kind === "photo") {
      return {
        pipeline: "image-upscale-photo",
        required: "photo",
        input,
        output: out,
        scale,
        model,
        format,
        args: ["pipeline", "photo", model, scale],
        summary: `图片增强 ${scale}x · ${model}`
      };
    }
    return {
      pipeline: "image-upscale-waifu",
      required: "waifu",
      input,
      output: out,
      scale,
      noise,
      model,
      format,
      args: ["pipeline", "waifu", model, scale],
      summary: `图片增强 ${scale}x · ${model}`
    };
  }

  if (mode === "cutout") {
    const model = String(options.model || "birefnet-lite");
    if (!cutoutModels.has(model)) throw new Error("请选择有效的抠图模型。");
    const modelPath = await cutoutModelPath(model);
    if (!modelPath) throw new Error(`缺少模型文件：${model}`);
    const out = outputFor(input, outputDir, "cutout", ".png");
    return {
      pipeline: "cutout",
      required: "rembg",
      input,
      output: out,
      model,
      modelPath,
      foreground: Number(options.foreground || 240),
      background: Number(options.background || 10),
      feather: Number(options.feather || 0),
      edge: String(options.edge || "standard"),
      backgroundMode: String(options.backgroundMode || "transparent"),
      smoothAlpha: String(options.smoothAlpha || "on") === "on",
      cleanup: String(options.cleanup || "on") === "on",
      edgeShift: Number(options.edgeShift || 0),
      outputMask: String(options.outputMask || "off") === "on",
      args: ["node-rembg", model],
      summary: `背景移除 · ${model}`
    };
  }

  if (mode === "video-upscale") {
    const denoiseEnabled = options.denoiseEnabled === true || options.denoiseEnabled === "true";
    const interpolateEnabled = options.interpolateEnabled === true || options.interpolateEnabled === "true";
    const upscaleEnabled = options.upscaleEnabled === true || options.upscaleEnabled === "true";
    const steps = [];
    const required = new Set(["ffmpeg"]);

    if (denoiseEnabled) {
      const strength = ["weak", "medium", "strong"].includes(String(options.denoiseStrength)) ? String(options.denoiseStrength) : "medium";
      steps.push({ type: "denoise", strength, label: `降噪${strength === "weak" ? "弱" : strength === "strong" ? "强" : "中"}` });
    }
    if (interpolateEnabled) {
      const fpsMode = String(options.interpolateFps || "30");
      const targetFps = fpsMode === "custom"
        ? Math.max(1, Math.round(Number(options.customFps || 0)))
        : Math.max(1, Math.round(Number(fpsMode || 30)));
      if (!targetFps) throw new Error("请填写有效的补帧目标帧数。");
      const model = String(options.interpolateModel || "rife-v4.6");
      if (!rifeModels.has(model)) throw new Error("请选择有效的补帧模型。");
      const exe = await resolveEngine("rife");
      if (exe && !(await modelAvailable(exe, model))) throw new Error(`缺少模型文件：${model}`);
      required.add("rife");
      steps.push({ type: "interpolate", targetFps, model, codec: "libx264", crf: "18", label: `补帧到${targetFps}fps` });
    }
    if (upscaleEnabled) {
      const model = String(options.upscaleModel || "realesr-animevideov3");
      const kind = waifuModels.has(model) ? "waifu" : "photo";
      if (kind === "photo" && !esrganModels.has(model)) throw new Error("请选择有效的视频超分模型。");
      const exe = await resolveEngine(kind);
      if (exe && !(await modelAvailable(exe, model, kind === "photo"))) throw new Error(`缺少模型文件：${model}`);
      required.add(kind);
      const scaleMode = String(options.upscaleScale || "2");
      const custom = scaleMode === "custom";
      const customWidth = Math.max(0, Math.round(Number(options.customWidth || 0)));
      const customHeight = Math.max(0, Math.round(Number(options.customHeight || 0)));
      if (custom && !customWidth && !customHeight) throw new Error("请填写自定义宽度或高度。");
      steps.push({
        type: "upscale",
        requiredEngine: kind,
        model,
        scale: custom ? "2" : (["1", "2", "3", "4"].includes(scaleMode) ? scaleMode : "2"),
        customWidth,
        customHeight,
        noise: "1",
        codec: "libx264",
        crf: "18",
        label: custom ? `超分到${customWidth || "自适应"}x${customHeight || "自适应"}` : `超分${scaleMode}x`
      });
    }

    if (!steps.length) throw new Error("请至少开启一个视频处理功能。");
    const outputFormat = ["mp4", "mkv"].includes(String(options.outputFormat)) ? String(options.outputFormat) : "original";
    const out = outputFor(input, outputDir, "video_processed", videoOutputExtension(outputFormat, input));
    return {
      pipeline: "video-suite",
      required: [...required],
      input,
      output: out,
      outputFormat,
      steps,
      summary: `视频处理 · ${steps.map((step) => step.label).join(" → ")}`,
      args: ["pipeline", "video-suite", ...steps.map((step) => step.type)]
    };
  }
  if (mode === "video-interpolate") {
    const multiplier = String(options.multiplier || "2");
    const model = String(options.model || "rife-v4.6");
    if (!rifeModels.has(model)) throw new Error("请选择有效的补帧模型。");
    const exe = await resolveEngine("rife");
    if (exe && !(await modelAvailable(exe, model))) throw new Error(`缺少模型文件：${model}`);
    const out = outputFor(input, outputDir, `rife${multiplier}x`, ".mp4");
    return {
      pipeline: "video-interpolate",
      required: ["rife", "ffmpeg"],
      input,
      output: out,
      multiplier,
      model,
      codec: "libx264",
      crf: "18",
      summary: `补帧 ${multiplier}x · ${model}`,
      args: ["pipeline", "rife", model, multiplier]
    };
  }

  if (mode === "video-dedup") {
    const exe = await resolveEngine("ffmpeg");
    const fps = String(options.contentFps || "24");
    const out = outputFor(input, outputDir, "dedup", ".mp4");
    return { exe, args: ["-y", "-i", input, "-vf", `mpdecimate,setpts=N/${fps}/TB`, "-r", fps, out], output: out, required: "ffmpeg", summary: `重复帧整理 ${fps}fps` };
  }

  if (mode === "audio-separate") {
    const parsed = path.parse(input);
    const outDir = outputDir || path.join(parsed.dir, `${parsed.name}_stems`);
    const stem = options.stem === "accompaniment" ? "accompaniment" : "vocals";
    const requestedFormat = String(options.format || "original");
    const format = requestedFormat === "original"
      ? (supportedAudioExts.has(parsed.ext.toLowerCase()) ? parsed.ext.toLowerCase() : ".wav")
      : (supportedAudioExts.has(`.${requestedFormat}`) ? `.${requestedFormat}` : ".wav");
    return {
      pipeline: "audio-separate",
      required: ["demucs", "ffmpeg"],
      input,
      output: outDir,
      stem,
      format,
      args: ["demucs-js", stem],
      summary: stem === "vocals" ? "音频分离 · 仅保留人声" : "音频分离 · 仅保留背景声"
    };
  }

  if (mode === "compression") {
    const ext = path.extname(input).toLowerCase();
    if (!supportedCompressionExts.has(ext)) throw new Error("当前文件格式不支持压缩。");
    const level = ["standard", "high"].includes(String(options.compressionLevel))
      ? String(options.compressionLevel)
      : "standard";
    const outputExt = compressionOutputExtension(input);
    const out = outputFor(input, outputDir, "compressed", outputExt);
    return {
      pipeline: "compression",
      required: isPdfPath(input) ? ["ghostscript"] : [],
      input,
      output: out,
      compressionLevel: level,
      inputExt: ext,
      outputExt,
      summary: `文件压缩 · ${path.basename(input)}`,
      args: ["pipeline", "compression", level]
    };
  }

  throw new Error("未知任务类型。");
}

async function missingRequired(plan) {
  const keys = Array.isArray(plan.required) ? plan.required : [plan.required];
  const pairs = await Promise.all(keys.filter(Boolean).map(async (key) => [key, await resolveEngine(key)]));
  return pairs.filter(([, exe]) => !exe).map(([key]) => key);
}

function readableProcessFailure(code, detail) {
  const text = String(detail || "");
  if (/out of memory|not enough memory|cannot allocate|failed to allocate|bad_alloc|vkAllocateMemory|显存|内存/i.test(text)) {
    return `处理失败：内存或显存不足。请关闭其他占用内存/GPU 的程序，降低放大倍率或自定义分辨率后重新处理。`;
  }
  const clean = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(-6)
    .join("\n");
  return clean ? `处理失败：步骤退出码 ${code}\n${clean}` : `处理失败：步骤退出码 ${code}`;
}

function spawnStep(exe, args, log, job) {
  return new Promise((resolve, reject) => {
    const child = spawn(exe, args, { windowsHide: true });
    const chunks = [];
    const remember = (data) => {
      const text = data.toString();
      chunks.push(text);
      while (chunks.join("").length > 12000) chunks.shift();
      return text;
    };
    job.currentChild = child;
    log.appendFile(`\n$ ${exe} ${args.join(" ")}\n`).catch(() => {});
    child.stdout.on("data", (data) => log.appendFile(remember(data)));
    child.stderr.on("data", (data) => log.appendFile(remember(data)));
    child.on("error", (error) => reject(new Error(readableProcessFailure("启动失败", error.message))));
    child.on("exit", (code) => {
      job.currentChild = null;
      if (code === 0) resolve();
      else reject(new Error(readableProcessFailure(code, chunks.join(""))));
    });
  });
}

async function runPhotoUpscale(plan, workDir, log, job) {
  const engine = await resolveEngine("photo");
  const sharpModule = await import("sharp");
  const sharp = sharpModule.default;
  const meta = await sharp(plan.input).metadata();
  const targetScale = Math.max(1, Math.min(4, Number(plan.scale || 2)));
  const engineScale = nativeFourScaleModels.has(plan.model) ? 4 : targetScale;
  const rgbInput = path.join(workDir, "photo-input-rgb.png");
  const nativeOutput = path.join(workDir, `photo-native-${engineScale}x.png`);
  const targetWidth = Math.max(1, Math.round((meta.width || 1) * targetScale));
  const targetHeight = Math.max(1, Math.round((meta.height || 1) * targetScale));

  await sharp(plan.input)
    .rotate()
    .flatten({ background: "#ffffff" })
    .png()
    .toFile(rgbInput);

  const args = [
    "-i", rgbInput,
    "-o", nativeOutput,
    "-s", String(engineScale),
    "-m", esrganModelDir(engine),
    "-n", plan.model,
    "-f", "png"
  ];
  await spawnStep(engine, args, log, job);

  let output = sharp(nativeOutput).resize({
    width: targetWidth,
    height: targetHeight,
    fit: "fill",
    kernel: sharp.kernel.lanczos3
  });

  await saveSharpImage(output, plan.output, finalImageFormat(plan.format, plan.input), { workDir, log, job });
  await log.appendFile(`output: ${plan.output}\n`);
}

async function writeSharpOutput(source, plan, workDir, log, job) {
  const sharpModule = await import("sharp");
  const sharp = sharpModule.default;
  let output = sharp(source).rotate();
  const finalFormat = finalImageFormat(plan.format, plan.input);
  await saveSharpImage(output, plan.output, finalFormat, { flatten: finalFormat === "jpg", workDir, log, job });
}

async function runWaifuUpscale(plan, workDir, log, job) {
  const engine = await resolveEngine("waifu");
  const nativeFormat = engineImageFormat(plan.format, plan.input);
  const nativeOutput = path.join(workDir, `waifu-native.${nativeFormat === "jpg" ? "jpg" : nativeFormat === "webp" ? "webp" : "png"}`);
  const args = ["-i", plan.input, "-o", nativeOutput, "-s", plan.scale, "-n", plan.noise, "-m", modelDir(engine, plan.model), "-f", nativeFormat];
  await spawnStep(engine, args, log, job);
  await writeSharpOutput(nativeOutput, plan, workDir, log, job);
  await log.appendFile(`output: ${plan.output}\n`);
}

async function runVideoUpscale(plan, workDir, log, job) {
  const ffmpeg = await resolveEngine("ffmpeg");
  const engine = await resolveEngine(plan.requiredEngine);
  const inputFrames = path.join(workDir, "input-frames");
  const outputFrames = path.join(workDir, "output-frames");
  await fs.mkdir(inputFrames, { recursive: true });
  await fs.mkdir(outputFrames, { recursive: true });
  const fps = await videoFps(plan.input);

  await spawnStep(ffmpeg, ["-y", "-i", plan.input, path.join(inputFrames, "frame_%08d.png")], log, job);
  const requestedScale = String(plan.scale || "2");
  const engineScale = nativeFourScaleModels.has(plan.model)
    ? "4"
    : (requestedScale === "1" ? "2" : requestedScale);
  const enhanceArgs = plan.requiredEngine === "waifu"
    ? ["-i", inputFrames, "-o", outputFrames, "-s", engineScale, "-n", plan.noise || "1", "-m", modelDir(engine, plan.model), "-f", "png"]
    : ["-i", inputFrames, "-o", outputFrames, "-s", engineScale, "-m", esrganModelDir(engine), "-n", plan.model, "-f", "png"];
  await spawnStep(engine, enhanceArgs, log, job);
  const scaleRatio = Number(requestedScale) / Number(engineScale);
  const scaleFilter = plan.customWidth || plan.customHeight
    ? [`scale=${plan.customWidth || -2}:${plan.customHeight || -2}`]
    : (scaleRatio !== 1
      ? [`scale=trunc(iw*${scaleRatio}/2)*2:trunc(ih*${scaleRatio}/2)*2`]
      : []);
  await spawnStep(ffmpeg, [
    "-y",
    "-framerate", String(fps),
    "-i", path.join(outputFrames, "frame_%08d.png"),
    "-i", plan.input,
    "-map", "0:v:0",
    "-map", "1:a?",
    ...(scaleFilter.length ? ["-vf", scaleFilter.join(",")] : []),
    "-c:v", plan.codec || "libx264",
    "-crf", String(plan.crf || 18),
    "-pix_fmt", "yuv420p",
    "-c:a", "copy",
    "-shortest",
    plan.output
  ], log, job);
}
async function runVideoInterpolate(plan, workDir, log, job) {
  const ffmpeg = await resolveEngine("ffmpeg");
  const rife = await resolveEngine("rife");
  const inputFrames = path.join(workDir, "input-frames");
  const outputFrames = path.join(workDir, "output-frames");
  await fs.mkdir(inputFrames, { recursive: true });
  await fs.mkdir(outputFrames, { recursive: true });
  const fps = await videoFps(plan.input);
  const targetFps = Math.max(0, Number(plan.targetFps || 0));
  const multiplier = Math.max(2, Number(plan.multiplier || 2));
  const isRifeV4 = /^rife-v4/.test(String(plan.model || ""));

  if (targetFps > 0 && targetFps <= fps) {
    await spawnStep(ffmpeg, [
      "-y",
      "-i", plan.input,
      "-vf", `fps=${targetFps}`,
      "-c:v", plan.codec || "libx264",
      "-crf", String(plan.crf || 18),
      "-pix_fmt", "yuv420p",
      "-c:a", "copy",
      plan.output
    ], log, job);
    return;
  }

  if (!isRifeV4 && targetFps > fps * 2) {
    throw new Error(`当前补帧模型 ${plan.model} 最高只能稳定输出约 ${Math.round(fps * 2)}fps，请改用 RIFE v4 系列模型。`);
  }

  await spawnStep(ffmpeg, ["-y", "-i", plan.input, path.join(inputFrames, "frame_%08d.png")], log, job);
  const frameCount = await countFrames(inputFrames);
  const outputFps = targetFps > 0 && isRifeV4 ? targetFps : fps * multiplier;
  const finalFpsFilter = targetFps > 0 && !isRifeV4 && targetFps !== outputFps ? [`fps=${targetFps}`] : [];
  const targetFrames = targetFps > 0 && isRifeV4 && frameCount > 0
    ? Math.max(frameCount, Math.round(frameCount * (targetFps / Math.max(1, fps))))
    : (multiplier !== 2 && frameCount > 0 ? frameCount * multiplier : 0);
  const rifeArgs = [
    "-i", inputFrames,
    "-o", outputFrames,
    "-m", modelDir(rife, plan.model),
    "-f", "frame_%08d.png"
  ];
  if (isRifeV4 && targetFrames > 0) rifeArgs.push("-n", String(targetFrames));
  if (plan.model !== "rife-v4.26") rifeArgs.push("-x", "-z");
  await spawnStep(rife, rifeArgs, log, job);
  await spawnStep(ffmpeg, [
    "-y",
    "-framerate", String(outputFps),
    "-i", path.join(outputFrames, "frame_%08d.png"),
    "-i", plan.input,
    "-map", "0:v:0",
    "-map", "1:a?",
    ...(finalFpsFilter.length ? ["-vf", finalFpsFilter.join(",")] : []),
    "-c:v", plan.codec || "libx264",
    "-crf", String(plan.crf || 18),
    "-pix_fmt", "yuv420p",
    "-c:a", "copy",
    "-shortest",
    plan.output
  ], log, job);
}
function videoDenoiseFilter(strength) {
  if (strength === "weak") return "hqdn3d=1.5:1.5:4:4";
  if (strength === "strong") return "hqdn3d=4:4:10:10";
  return "hqdn3d=2.5:2.5:7:7";
}

async function runVideoDenoiseStep(plan, log, job) {
  const ffmpeg = await resolveEngine("ffmpeg");
  await spawnStep(ffmpeg, [
    "-y",
    "-i", plan.input,
    "-vf", videoDenoiseFilter(plan.strength),
    "-c:v", "libx264",
    "-crf", "18",
    "-pix_fmt", "yuv420p",
    "-c:a", "copy",
    plan.output
  ], log, job);
}

async function runCompression(plan, workDir, log, job) {
  const ext = plan.inputExt;
  const level = plan.compressionLevel === "high" ? "high" : "standard";
  await fs.mkdir(path.dirname(plan.output), { recursive: true });

  if (supportedImageOutputExts.has(ext)) {
    const sharpModule = await import("sharp");
    const sharp = sharpModule.default;
    const quality = level === "high" ? 58 : 78;
    let image = sharp(plan.input, { animated: ext === ".gif" }).rotate();
    if (ext === ".jpg" || ext === ".jpeg") image = image.jpeg({ quality, mozjpeg: true });
    else if (ext === ".png") image = image.png({ compressionLevel: 9, adaptiveFiltering: true, palette: level === "high" });
    else if (ext === ".webp") image = image.webp({ quality });
    else if (ext === ".gif") image = image.gif();
    else if (ext === ".tif" || ext === ".tiff") image = image.tiff({ quality });
    else image = image.png({ compressionLevel: 9, adaptiveFiltering: true });
    await image.toFile(plan.output);
    return;
  }

  const ffmpeg = await resolveEngine("ffmpeg");
  if (isPdfPath(plan.input)) {
    const ghostscript = await resolveEngine("ghostscript");
    if (!ghostscript) throw new Error("缺少 Ghostscript，无法压缩 PDF。请安装 Ghostscript 后重试。");
    await spawnStep(ghostscript, [
      "-sDEVICE=pdfwrite",
      "-dCompatibilityLevel=1.4",
      `-dPDFSETTINGS=${level === "high" ? "/screen" : "/ebook"}`,
      "-dNOPAUSE", "-dQUIET", "-dBATCH",
      `-sOutputFile=${plan.output}`,
      plan.input
    ], log, job);
    const [inputStat, outputStat] = await Promise.all([fs.stat(plan.input), fs.stat(plan.output)]);
    if (outputStat.size >= inputStat.size) {
      await fs.copyFile(plan.input, plan.output);
      await log.appendFile("PDF 已经是较小体积，保留原文件以避免压缩后变大。\n");
    }
    return;
  }

  if (isVideoPath(plan.input)) {
    const videoArgs = ["-y", "-i", plan.input, "-map", "0:v:0", "-map", "0:a?"];
    if (path.extname(plan.output).toLowerCase() === ".webm") {
      videoArgs.push("-c:v", "libvpx-vp9", "-crf", level === "high" ? "38" : "32", "-b:v", "0", "-c:a", "libopus", "-b:a", level === "high" ? "80k" : "112k");
    } else {
      videoArgs.push("-c:v", "libx264", "-preset", "medium", "-crf", level === "high" ? "30" : "26", "-c:a", "aac", "-b:a", level === "high" ? "96k" : "128k", "-pix_fmt", "yuv420p");
      if ([".mp4", ".mov", ".m4v"].includes(path.extname(plan.output).toLowerCase())) videoArgs.push("-movflags", "+faststart");
    }
    videoArgs.push(plan.output);
    await spawnStep(ffmpeg, videoArgs, log, job);
    return;
  }

  if (isAudioPath(plan.input)) {
    const outputExt = path.extname(plan.output).toLowerCase();
    const args = ["-y", "-i", plan.input, "-vn"];
    if (outputExt === ".flac") args.push("-c:a", "flac", "-compression_level", "8");
    else if (outputExt === ".ogg") args.push("-c:a", "libopus", "-b:a", level === "high" ? "80k" : "112k");
    else if (outputExt === ".m4a" || outputExt === ".aac") args.push("-c:a", "aac", "-b:a", level === "high" ? "96k" : "128k");
    else args.push("-c:a", "libmp3lame", "-b:a", level === "high" ? "96k" : "128k");
    args.push(plan.output);
    await spawnStep(ffmpeg, args, log, job);
    return;
  }

  throw new Error("当前文件格式不支持压缩。");
}

async function runVideoSuite(plan, workDir, log, job) {
  let current = plan.input;
  const outputs = [];
  for (let index = 0; index < plan.steps.length; index++) {
    const step = plan.steps[index];
    const isLast = index === plan.steps.length - 1;
    const output = isLast ? plan.output : path.join(workDir, `${String(index + 1).padStart(2, "0")}-${step.type}.mp4`);
    const stepWorkDir = path.join(workDir, `${String(index + 1).padStart(2, "0")}-${step.type}-work`);
    await fs.mkdir(stepWorkDir, { recursive: true });
    await log.appendFile(`\n# ${step.label}\n`);
    if (step.type === "denoise") await runVideoDenoiseStep({ input: current, output, strength: step.strength }, log, job);
    if (step.type === "interpolate") await runVideoInterpolate({ input: current, output, targetFps: step.targetFps, model: step.model, codec: step.codec, crf: step.crf }, stepWorkDir, log, job);
    if (step.type === "upscale") await runVideoUpscale({
      input: current,
      output,
      requiredEngine: step.requiredEngine,
      model: step.model,
      scale: step.scale,
      customWidth: step.customWidth,
      customHeight: step.customHeight,
      noise: step.noise,
      codec: step.codec,
      crf: step.crf
    }, stepWorkDir, log, job);
    current = output;
    outputs.push(output);
  }
  plan.outputs = [plan.output];
  await log.appendFile(`output: ${plan.output}\n`);
}
function shiftAlphaMask(alpha, width, height, amount) {
  const steps = Math.min(5, Math.abs(Math.round(amount || 0)));
  if (!steps) return alpha;
  let current = alpha;
  for (let step = 0; step < steps; step++) {
    const next = new Uint8Array(current.length);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let value = amount > 0 ? 0 : 255;
        for (let yy = -1; yy <= 1; yy++) {
          for (let xx = -1; xx <= 1; xx++) {
            const nx = Math.min(width - 1, Math.max(0, x + xx));
            const ny = Math.min(height - 1, Math.max(0, y + yy));
            const sample = current[ny * width + nx];
            value = amount > 0 ? Math.max(value, sample) : Math.min(value, sample);
          }
        }
        next[y * width + x] = value;
      }
    }
    current = next;
  }
  return current;
}
async function runCutout(plan, log) {
  const [ort, sharpModule] = await Promise.all([
    import("onnxruntime-node"),
    import("sharp")
  ]);
  const sharp = sharpModule.default;
  await log.appendFile(`\n$ node-rembg ${plan.model}\n`);
  const session = await ort.InferenceSession.create(plan.modelPath);
  const source = sharp(plan.input).rotate();
  const meta = await source.metadata();
  const originalWidth = meta.width || 1;
  const originalHeight = meta.height || 1;
  const inputShape = session.inputMetadata[0]?.shape || [];
  const inputHeight = Number(inputShape[2]) > 0 ? Number(inputShape[2]) : 1024;
  const inputWidth = Number(inputShape[3]) > 0 ? Number(inputShape[3]) : inputHeight;

  const { data, info } = await source
    .clone()
    .removeAlpha()
    .resize(inputWidth, inputHeight, { fit: "fill" })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const mean = [0.485, 0.456, 0.406];
  const std = [0.229, 0.224, 0.225];
  const normalized = new Float32Array(3 * info.width * info.height);
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      for (let c = 0; c < 3; c++) {
        const sourceIndex = (y * info.width + x) * info.channels + c;
        const targetIndex = c * info.width * info.height + y * info.width + x;
        normalized[targetIndex] = (data[sourceIndex] / 255 - mean[c]) / std[c];
      }
    }
  }

  const tensor = new ort.Tensor("float32", normalized, [1, 3, info.height, info.width]);
  const results = await session.run({ [session.inputNames[0]]: tensor });
  const output = results[session.outputNames[0]];
  const dims = output.dims;
  const maskHeight = Number(dims[dims.length - 2]);
  const maskWidth = Number(dims[dims.length - 1]);
  const maskPixels = maskWidth * maskHeight;
  const offset = output.data.length >= maskPixels ? output.data.length - maskPixels : 0;
  const rawMask = output.data.subarray(offset, offset + maskPixels);

  const alpha = new Uint8Array(maskPixels);
  const bg = Math.max(0, Math.min(255, Number(plan.background || 10)));
  const fg = Math.max(bg + 1, Math.min(255, Number(plan.foreground || 240)));

  for (let i = 0; i < maskPixels; i++) {
    const value = Math.round((1 / (1 + Math.exp(-rawMask[i]))) * 255);
    alpha[i] = value <= bg ? 0 : value >= fg ? 255 : Math.round(((value - bg) / (fg - bg)) * 255);
  }

  let borderSum = 0;
  let borderCount = 0;
  let centerSum = 0;
  let centerCount = 0;
  const x1 = Math.floor(maskWidth * 0.25);
  const x2 = Math.ceil(maskWidth * 0.75);
  const y1 = Math.floor(maskHeight * 0.25);
  const y2 = Math.ceil(maskHeight * 0.75);
  for (let y = 0; y < maskHeight; y++) {
    for (let x = 0; x < maskWidth; x++) {
      const value = alpha[y * maskWidth + x];
      if (x === 0 || y === 0 || x === maskWidth - 1 || y === maskHeight - 1) {
        borderSum += value;
        borderCount++;
      }
      if (x >= x1 && x < x2 && y >= y1 && y < y2) {
        centerSum += value;
        centerCount++;
      }
    }
  }
  if (borderCount && centerCount && borderSum / borderCount > centerSum / centerCount) {
    for (let i = 0; i < alpha.length; i++) alpha[i] = 255 - alpha[i];
  }

  const edgeShift = Math.max(-5, Math.min(5, Number(plan.edgeShift || 0)));
  const shiftedAlpha = shiftAlphaMask(alpha, maskWidth, maskHeight, edgeShift);

  let alphaImage = sharp(Buffer.from(shiftedAlpha), {
    raw: { width: maskWidth, height: maskHeight, channels: 1 }
  })
    .resize(originalWidth, originalHeight, { fit: "fill" })
    .greyscale();
  let feather = Math.max(0, Math.min(8, Number(plan.feather || 0)));
  if (plan.edge === "soft") feather = Math.max(feather, 3);
  if (plan.edge === "sharp") feather = Math.min(feather, 1);
  if (plan.cleanup) alphaImage = alphaImage.median(3);
  if (plan.smoothAlpha && feather <= 0) alphaImage = alphaImage.blur(0.3);
  if (feather > 0) alphaImage = alphaImage.blur(feather);
  const alphaBuffer = await alphaImage.greyscale().raw().toBuffer();

  if (plan.outputMask) {
    const parsed = path.parse(plan.output);
    await sharp(alphaBuffer, { raw: { width: originalWidth, height: originalHeight, channels: 1 } })
      .png()
      .toFile(path.join(parsed.dir, `${parsed.name}_mask.png`));
  }

  const { data: rgbBuffer, info: rgbInfo } = await source
    .clone()
    .removeAlpha()
    .toColourspace("srgb")
    .raw()
    .toBuffer({ resolveWithObject: true });
  const rgbaBuffer = Buffer.alloc(originalWidth * originalHeight * 4);
  const rgbChannels = rgbInfo.channels || 3;
  for (let i = 0, rgb = 0, rgba = 0; i < originalWidth * originalHeight; i++, rgb += rgbChannels, rgba += 4) {
    rgbaBuffer[rgba] = rgbBuffer[rgb];
    rgbaBuffer[rgba + 1] = rgbBuffer[rgb + 1];
    rgbaBuffer[rgba + 2] = rgbBuffer[rgb + 2];
    rgbaBuffer[rgba + 3] = alphaBuffer[i];
  }
  let finalImage = sharp(rgbaBuffer, {
    raw: { width: originalWidth, height: originalHeight, channels: 4 }
  });
  if (plan.backgroundMode === "white") finalImage = finalImage.flatten({ background: "#ffffff" });
  if (plan.backgroundMode === "black") finalImage = finalImage.flatten({ background: "#000000" });
  await finalImage.png().toFile(plan.output);
  await log.appendFile(`output: ${plan.output}\n`);
}

function mixTracks(tracks, names) {
  const first = tracks[names[0]];
  const mixed = first.channelData.map((channel) => new Float32Array(channel.length));
  for (const name of names) {
    const track = tracks[name];
    for (let c = 0; c < mixed.length; c++) {
      for (let i = 0; i < mixed[c].length; i++) mixed[c][i] += track.channelData[c][i];
    }
  }
  return { channelData: mixed, sampleRate: first.sampleRate };
}

async function runAudioSeparate(plan, workDir, log, job) {
  const ffmpeg = await resolveEngine("ffmpeg");
  const demucsEntry = await resolveEngine("demucs");
  const demucsRoot = path.resolve(path.dirname(demucsEntry), "..");
  const wavInput = path.join(workDir, "input.wav");
  await fs.mkdir(plan.output, { recursive: true });

  await spawnStep(ffmpeg, [
    "-y",
    "-i", plan.input,
    "-vn",
    "-ac", "2",
    "-ar", "44100",
    "-acodec", "pcm_s16le",
    wavInput
  ], log, job);

  const [
    { separateTracks },
    { ONNXHTDemucs },
    { wavToSamples, samplesToWav }
  ] = await Promise.all([
    import("demucs/dist/apply.js"),
    import("demucs/dist/onnx-htdemucs.js"),
    import("demucs/dist/wav-utils.js")
  ]);

  await log.appendFile("\n$ demucs-js htdemucs\n");
  const weights = await fs.readFile(path.join(demucsRoot, "htdemucs.onnx"));
  const model = await ONNXHTDemucs.init(weights.buffer.slice(weights.byteOffset, weights.byteOffset + weights.byteLength));
  const audio = wavToSamples(new Uint8Array(await fs.readFile(wavInput)));
  const tracks = await separateTracks(model, audio, (step, total) => {
    log.appendFile(`segment ${step}/${total}\n`).catch(() => {});
  }, 0.25);

  const outputs = [];
  const writeTrack = async (name, samples) => {
    const wavPath = path.join(workDir, `${name}.wav`);
    await fs.writeFile(wavPath, Buffer.from(samplesToWav(samples.channelData, samples.sampleRate)));
    const extension = plan.format || ".wav";
    const target = path.join(plan.output, `${name}${extension}`);
    if (extension === ".wav") await fs.copyFile(wavPath, target);
    else await spawnStep(ffmpeg, ["-y", "-i", wavPath, target], log, job);
    outputs.push(target);
  };

  if (plan.stem === "vocals") {
    await writeTrack("vocals", tracks.vocals);
  } else {
    await writeTrack("accompaniment", mixTracks(tracks, ["drums", "bass", "other"]));
  }

  plan.outputs = outputs;
  await log.appendFile(outputs.map((item) => `output: ${item}`).join("\n") + "\n");
}

async function startPipelineJob(plan) {
  const missing = await missingRequired(plan);
  if (missing.length) {
    const id = crypto.randomUUID();
    jobs.set(id, {
      id,
      plan,
      status: "missing-engine",
      message: `缺少 ${missing.join(", ")} 引擎，已生成执行计划。`,
      startedAt: new Date().toISOString()
    });
    return { id, status: "missing-engine", message: `缺少 ${missing.join(", ")} 引擎，已生成执行计划。`, plan };
  }

  await fs.mkdir(logsDir, { recursive: true });
  const id = crypto.randomUUID();
  const logPath = path.join(logsDir, `${id}.log`);
  const workDir = path.join(dataRoot, "work", id);
  const log = await fs.open(logPath, "a");
  const job = {
    id,
    plan,
    status: usesImageModelQueue(plan) ? "queued" : "running",
    queuedAt: new Date().toISOString(),
    startedAt: usesImageModelQueue(plan) ? null : new Date().toISOString(),
    logPath,
    workDir
  };
  jobs.set(id, job);

  const runPipeline = async () => {
    try {
      job.status = "running";
      job.startedAt = new Date().toISOString();
      await fs.mkdir(workDir, { recursive: true });
      if (plan.pipeline === "image-upscale-photo") await runPhotoUpscale(plan, workDir, log, job);
      if (plan.pipeline === "image-upscale-waifu") await runWaifuUpscale(plan, workDir, log, job);
      if (plan.pipeline === "cutout") await runCutout(plan, log, job);
      if (plan.pipeline === "audio-separate") await runAudioSeparate(plan, workDir, log, job);
      if (plan.pipeline === "compression") await runCompression(plan, workDir, log, job);
      if (plan.pipeline === "video-upscale") await runVideoUpscale(plan, workDir, log, job);
      if (plan.pipeline === "video-interpolate") await runVideoInterpolate(plan, workDir, log, job);
      if (plan.pipeline === "video-suite") await runVideoSuite(plan, workDir, log, job);
      await attachOutputSizes(plan);
      job.status = "done";
      job.endedAt = new Date().toISOString();
    } catch (error) {
      job.status = "failed";
      job.message = error.message;
      job.endedAt = new Date().toISOString();
      await log.appendFile(`\n${error.stack || error.message}\n`).catch(() => {});
    } finally {
      await log.close().catch(() => {});
    }
  };

  if (usesImageModelQueue(plan)) {
    imageModelQueue = imageModelQueue.catch(() => {}).then(runPipeline);
  } else {
    runPipeline();
  }

  return { id, status: job.status, plan, logPath };
}

async function startJob(payload) {
  const uploadedPaths = Array.isArray(payload.uploadedPaths)
    ? payload.uploadedPaths.map((item) => String(item || "").trim()).filter(Boolean)
    : [];
  if ((payload.mode === "image-upscale" || payload.mode === "cutout" || payload.mode === "video-upscale" || payload.mode === "audio-separate" || payload.mode === "compression") && uploadedPaths.length > 1) {
    const jobsStarted = [];
    for (const uploadedPath of uploadedPaths) {
      jobsStarted.push(await startJob({ ...payload, uploadedPaths: [], uploadedPath }));
    }
    return {
      status: "batch-submitted",
        summary: `批量任务已提交 · ${jobsStarted.length} 个文件`,
      jobs: jobsStarted,
      plan: {
        summary: `批量${payload.mode === "cutout" ? "抠图" : payload.mode === "video-upscale" ? "视频超分" : payload.mode === "audio-separate" ? "音频分离" : payload.mode === "compression" ? "文件压缩" : "图片放大"} · ${jobsStarted.length} 个文件`
      }
    };
  }

  const plan = await planJob(payload);
  if (plan.pipeline) return startPipelineJob(plan);

  const missing = await missingRequired(plan);
  if (missing.length) {
    const id = crypto.randomUUID();
    jobs.set(id, {
      id,
      plan,
      status: "missing-engine",
      message: `缺少 ${missing.join(", ")} 引擎，已生成执行计划。`,
      startedAt: new Date().toISOString()
    });
    return {
      id,
      status: "missing-engine",
      message: `缺少 ${missing.join(", ")} 引擎，已生成执行计划。`,
      plan
    };
  }

  await fs.mkdir(logsDir, { recursive: true });
  const id = crypto.randomUUID();
  const logPath = path.join(logsDir, `${id}.log`);
  const log = await fs.open(logPath, "a");
  const job = { id, plan, status: "running", startedAt: new Date().toISOString(), logPath };
  const child = spawn(plan.exe, plan.args, { windowsHide: true });
  job.child = child;
  jobs.set(id, job);

  child.stdout.on("data", (data) => log.appendFile(data));
  child.stderr.on("data", (data) => log.appendFile(data));
  child.on("exit", async (code) => {
    const job = jobs.get(id);
    if (job) {
      if (code === 0) await reconcileOutput(job.plan, log);
      if (code === 0) await attachOutputSizes(job.plan);
      job.status = code === 0 ? "done" : "failed";
      job.code = code;
      job.endedAt = new Date().toISOString();
    }
    await log.close().catch(() => {});
  });

  return { id, status: "running", plan, logPath };
}

async function route(req, res) {
  const url = new URL(req.url, "http://127.0.0.1");

  if (req.method === "GET" && url.pathname === "/api/engines") {
    return sendJson(res, 200, await engineStatus());
  }

  if (req.method === "GET" && url.pathname === "/api/jobs") {
    return sendJson(res, 200, [...jobs.values()].map(({ child, currentChild, ...job }) => job));
  }

  if (req.method === "GET" && url.pathname === "/api/result") {
    const target = path.normalize(String(url.searchParams.get("path") || ""));
    const allowed = pathInside(target, uploadsDir) || pathInside(target, logsDir);
    if (!allowed) return sendJson(res, 403, { error: "Forbidden" });
    try {
      return await streamMediaFile(req, res, target, { download: true });
    } catch {
      return sendJson(res, 404, { error: "Not found" });
    }
  }

  if (req.method === "GET" && url.pathname === "/api/preview") {
    const target = path.normalize(String(url.searchParams.get("path") || ""));
    if (!pathInside(target, uploadsDir)) return sendJson(res, 403, { error: "Forbidden" });
    try {
      return await streamMediaFile(req, res, target);
    } catch {
      return sendJson(res, 404, { error: "Not found" });
    }
  }

  if (req.method === "GET" && url.pathname === "/api/audio-preview") {
    const target = path.normalize(String(url.searchParams.get("path") || ""));
    if (!pathInside(target, uploadsDir) || !isAudioPath(target)) return sendJson(res, 403, { error: "Forbidden" });
    try {
      const preview = await ensureAudioPreview(target);
      return await streamMediaFile(req, res, preview);
    } catch {
      return sendJson(res, 404, { error: "音频预览生成失败" });
    }
  }

  if (req.method === "POST" && url.pathname === "/api/uploads") {
    try {
      return sendJson(res, 200, await saveUpload(req));
    } catch (error) {
      return sendJson(res, 400, { error: error.message });
    }
  }

  if (req.method === "POST" && url.pathname === "/api/import-path") {
    try {
      return sendJson(res, 200, await importLocalPath(await readJson(req)));
    } catch (error) {
      return sendJson(res, 400, { error: error.message });
    }
  }

  if (req.method === "POST" && url.pathname === "/api/plan") {
    try {
      return sendJson(res, 200, await planJob(await readJson(req)));
    } catch (error) {
      return sendJson(res, 400, { error: error.message });
    }
  }

  if (req.method === "POST" && url.pathname === "/api/jobs") {
    try {
      return sendJson(res, 200, await startJob(await readJson(req)));
    } catch (error) {
      return sendJson(res, 400, { error: error.message });
    }
  }

  if (req.method === "POST" && url.pathname.startsWith("/api/jobs/") && url.pathname.endsWith("/stop")) {
    const id = url.pathname.split("/")[3];
    const job = jobs.get(id);
    if (!job) return sendJson(res, 404, { error: "任务不存在。" });
    (job.child || job.currentChild)?.kill();
    job.status = "stopped";
    return sendJson(res, 200, { id, status: "stopped" });
  }

  const requested = url.pathname === "/" ? "/index.html" : url.pathname;
  const file = path.normalize(path.join(publicDir, requested));
  if (!pathInside(file, publicDir) && file !== publicDir) return sendJson(res, 403, { error: "Forbidden" });

  try {
    const stat = await fs.stat(file);
    if (!stat.isFile()) throw new Error("Not a file");
    res.writeHead(200, { "content-type": mime.get(path.extname(file)) || "application/octet-stream" });
    createReadStream(file).pipe(res);
  } catch {
    sendJson(res, 404, { error: "Not found" });
  }
}

const server = createServer((req, res) => {
  route(req, res).catch((error) => sendJson(res, 500, { error: error.message }));
});

const port = Number(process.env.PORT || 4877);
export const serverReady = new Promise((resolve, reject) => {
  server.once("listening", resolve);
  server.once("error", (error) => {
    reject(error);
  });
});
server.on("error", (error) => {
  throw error;
});
server.listen(port, "127.0.0.1", () => {
  console.log(`MediaKit is running at http://127.0.0.1:${port}`);
});























