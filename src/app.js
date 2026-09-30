
const cutoutModelDefaults = {
  "birefnet-lite": { foreground: 240, background: 10, feather: 2, edge: "standard", backgroundMode: "transparent", smoothAlpha: "on", cleanup: "on", edgeShift: 0, outputMask: "off" },
  birefnet: { foreground: 238, background: 8, feather: 2, edge: "standard", backgroundMode: "transparent", smoothAlpha: "on", cleanup: "on", edgeShift: 0, outputMask: "off" },
  "isnet-general-use": { foreground: 245, background: 12, feather: 1, edge: "sharp", backgroundMode: "transparent", smoothAlpha: "on", cleanup: "on", edgeShift: -1, outputMask: "off" },
  "isnet-anime": { foreground: 248, background: 8, feather: 0, edge: "sharp", backgroundMode: "transparent", smoothAlpha: "off", cleanup: "on", edgeShift: 0, outputMask: "off" },
  u2net: { foreground: 235, background: 15, feather: 2, edge: "soft", backgroundMode: "transparent", smoothAlpha: "on", cleanup: "on", edgeShift: 0, outputMask: "off" },
  u2netp: { foreground: 230, background: 18, feather: 2, edge: "soft", backgroundMode: "transparent", smoothAlpha: "on", cleanup: "off", edgeShift: 0, outputMask: "off" }
};
const modules = {
  "image-upscale": {
    icon: "IMG",
    title: "图片放大",
    subtitle: "批量增强图片清晰度，使用照片、动漫和插画专用路线。",
    fields: [
      ["inputPath", "素材文件", "file", "wide", ""],
      ["model", "模型", "select", "", [
        ["realesr-animevideov3", "Real-ESR AnimeVideo v3（动漫/插画 · 小模型 · 快）"],
        ["realesrgan-x4plus-anime", "Real-ESRGAN x4plus-anime（动漫/插画 · 中模型）"],
        ["realesrgan-x4plus", "Real-ESRGAN x4plus（通用/照片 · 大模型 · 慢）"],
        ["models-cunet", "waifu2x cunet（二次元/插画 · 降噪放大）"],
        ["models-upconv_7_anime_style_art_rgb", "waifu2x upconv_7 anime（动漫/插画 · 小模型 · 快）"],
        ["models-upconv_7_photo", "waifu2x upconv_7 photo（照片 · 小模型 · 快）"]
      ]],
      ["scale", "放大倍率", "select", "", [["1", "1x 清晰化"], ["2", "2x"], ["3", "3x"], ["4", "4x"]]],
      ["noise", "降噪强度", "select", "", [["0", "关闭"], ["1", "弱"], ["2", "中"], ["3", "强"]]],
      ["format", "输出格式", "select", "", [["original", "原格式"], ["jpg", "JPG"], ["png", "PNG"]]]
    ]
  },
  cutout: {
    icon: "CUT",
    title: "AI 抠图",
    subtitle: "本地模型移除背景，输出透明 PNG。",
    fields: [
      ["inputPath", "素材文件", "file", "wide", ""],
      ["model", "模型", "select", "", [
        ["birefnet-lite", "BiRefNet Lite（均衡较快）"],
        ["birefnet", "BiRefNet（大模型较慢）"],
        ["isnet-general-use", "ISNet-general-use（通用）"],
        ["isnet-anime", "ISNet-anime（动漫/插画）"],
        ["u2net", "U²-Net（通用经典）"],
        ["u2netp", "U²-Netp（轻量快速）"]
      ]]
    ]
  },
  "video-upscale": {
    icon: "VID",
    title: "视频处理",
    subtitle: "把超分、降噪、补帧合并成一条本地视频流水线。",
    fields: [
      ["inputPath", "视频文件", "file", "wide", ""],
["denoiseEnabled", "视频降噪", "toggle", "", "开启后进行画面降噪"],
      ["denoiseStrength", "降噪强度", "select", "video-option video-denoise-option", [["weak", "弱"], ["medium", "中"], ["strong", "强"]]],
      ["interpolateEnabled", "视频补帧", "toggle", "", "开启后提升帧率流畅度"],
      ["interpolateFps", "目标帧率", "select", "video-option video-interpolate-option", [["30", "30 帧"], ["50", "50 帧"], ["60", "60 帧"], ["custom", "自定义帧数"]]],
      ["customFps", "自定义帧数", "number", "video-option video-interpolate-option video-custom-fps", ""],
      ["interpolateModel", "补帧模型", "select", "video-option video-interpolate-option", [
        ["rife-v4.6", "RIFE v4.6（通用稳定）"],
        ["rife-v4.13", "RIFE v4.13（通用增强）"],
        ["rife-v4.26", "RIFE v4.26（新版）"],
        ["rife-anime", "RIFE Anime（动漫）"],
        ["rife-HD", "RIFE HD（高清）"],
        ["rife-UHD", "RIFE UHD（超清）"],
        ["rife-v2.3", "RIFE v2.3（兼容）"]
      ]],
      ["upscaleEnabled", "视频超分", "toggle", "", "开启后逐帧增强并放大"],
      ["upscaleModel", "超分模型", "select", "video-option video-upscale-option", [
        ["realesr-animevideov3", "Real-ESR AnimeVideo v3（动漫视频帧 · 小模型 · 快）"],
        ["realesrgan-x4plus-anime", "Real-ESRGAN x4plus-anime（动漫视频帧 · 中模型）"],
        ["realesrgan-x4plus", "Real-ESRGAN x4plus（通用/真人视频帧 · 大模型 · 慢）"],
        ["models-cunet", "waifu2x cunet（二次元/插画帧 · 降噪放大）"],
        ["models-upconv_7_anime_style_art_rgb", "waifu2x upconv_7 anime（动漫/插画帧 · 小模型 · 快）"],
        ["models-upconv_7_photo", "waifu2x upconv_7 photo（照片/真人帧 · 小模型 · 快）"]
      ]],
      ["upscaleScale", "放大倍率", "select", "video-option video-upscale-option", [["1", "1x 清晰化"], ["2", "2x"], ["3", "3x"], ["4", "4x"], ["custom", "自定义分辨率"]]],
      ["customWidth", "自定义宽度", "number", "video-option video-upscale-option video-custom-resolution", ""],
      ["customHeight", "自定义高度", "number", "video-option video-upscale-option video-custom-resolution", ""],
      ["outputFormat", "输出格式", "select", "wide", [["original", "原格式"], ["mp4", "MP4（通用）"], ["mkv", "MKV"]]]
    ]
  },
  "audio-separate": {
    icon: "SEP",
    title: "音频分离",
    subtitle: "调用本地分离引擎拆分人声与伴奏。",
    fields: [
      ["inputPath", "素材文件", "file", "wide", ""],
      ["stem", "输出内容", "select", "wide", [["vocals", "仅保留人声"], ["accompaniment", "仅保留背景声"]]],
      ["format", "输出格式", "select", "wide", [["original", "原格式"], ["mp3", "MP3（推荐、兼容）"], ["wav", "WAV（无损）"], ["flac", "FLAC（无损）"]]]
    ]
  },
  compression: {
    icon: "ZIP",
    title: "文件压缩",
    subtitle: "压缩视频、音频、PDF 和图片，尽量减小文件体积。",
    fields: [
      ["inputPath", "素材文件", "file", "wide", ""],
      ["compressionLevel", "压缩程度", "select", "wide", [["standard", "标准压缩"], ["high", "高压缩"]]]
    ]
  }
};

let activeMode = "image-upscale";
const nav = document.querySelector("#nav");
const form = document.querySelector("#jobForm");
const log = document.querySelector("#log");
const jobList = document.querySelector("#jobList");
const labPanel = document.querySelector("#labPanel");
const mediaPanel = document.querySelector("#mediaPanel");
const mediaPreview = document.querySelector("#mediaPreview");
const mediaMeta = document.querySelector("#mediaMeta");
const sourceCanvas = document.querySelector("#sourceCanvas");
const resultCanvas = document.querySelector("#resultCanvas");
const sourceInfo = document.querySelector("#sourceInfo");
const resultInfo = document.querySelector("#resultInfo");
const openSourceBtn = document.querySelector("#openSourceBtn");
const openResultBtn = document.querySelector("#openResultBtn");
const imageViewer = document.querySelector("#imageViewer");
const viewerImage = document.querySelector("#viewerImage");
const viewerVideo = document.querySelector("#viewerVideo");
const viewerTitle = document.querySelector("#viewerTitle");
const viewerMeta = document.querySelector("#viewerMeta");
const viewSourceBtn = document.querySelector("#viewSourceBtn");
const viewResultBtn = document.querySelector("#viewResultBtn");
const viewerDownloadBtn = document.querySelector("#viewerDownloadBtn");
const viewerPrevBtn = document.querySelector("#viewerPrevBtn");
const viewerNextBtn = document.querySelector("#viewerNextBtn");
const viewerCloseBtn = document.querySelector("#viewerCloseBtn");
const imageList = document.querySelector("#imageList");
const sourceListTitle = document.querySelector("#sourceListTitle");
const imageListActions = document.querySelector("#imageListActions");
const imageListCount = document.querySelector("#imageListCount");
const imageToolbar = document.querySelector("#imageToolbar");
const addImagesBtn = document.querySelector("#addImagesBtn");
const clearImagesBtn = document.querySelector("#clearImagesBtn");
const deselectImagesBtn = document.querySelector("#deselectImagesBtn");
const downloadImagesBtn = document.querySelector("#downloadImagesBtn");
const renameImagesBtn = document.querySelector("#renameImagesBtn");
const deleteImagesBtn = document.querySelector("#deleteImagesBtn");
const resultImageList = document.querySelector("#resultImageList");
const resultListActions = document.querySelector("#resultListActions");
const resultListCount = document.querySelector("#resultListCount");
const clearResultImagesBtn = document.querySelector("#clearResultImagesBtn");
const renameDialog = document.querySelector("#renameDialog");
const renameInput = document.querySelector("#renameInput");
const renameCancelBtn = document.querySelector("#renameCancelBtn");
const renameConfirmBtn = document.querySelector("#renameConfirmBtn");
const runBtn = document.querySelector("#runBtn");
let loadedImage = null;
let pickedFile = null;
let uploadedFile = null;
let pickedFiles = [];
let uploadedFiles = [];
let processedFiles = [];
let selectedImageIds = new Set();
let dragImageId = null;
let selectionBox = null;
let selectionStart = null;
let sourcePreview = null;
let resultPreview = null;
let activeViewerSide = "source";
let viewerSimpleMode = false;
let resultReady = false;
const renderedOutputs = new Set();
const notifiedFailureJobs = new Set();
const modeStates = new Map();

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key === "class") node.className = value;
    else if (key === "text") node.textContent = value;
    else node.setAttribute(key, value);
  }
  for (const child of children) node.append(child);
  return node;
}

function currentFormValues() {
  const values = {};
  for (const element of form.elements) {
    if (!element.name || element.type === "file") continue;
    values[element.name] = element.type === "checkbox" ? element.checked : element.value;
  }
  return values;
}

function applyFormValues(values = {}) {
  for (const [name, value] of Object.entries(values)) {
    const element = form.elements[name];
    if (!element || element.type === "file") continue;
    if (element.type === "checkbox") element.checked = value === true || value === "true" || value === "on";
    else element.value = value;
  }
}
function saveModeState(mode = activeMode) {
  modeStates.set(mode, {
    pickedFile,
    uploadedFile,
    pickedFiles: [...pickedFiles],
    uploadedFiles: [...uploadedFiles],
    processedFiles: [...processedFiles],
    selectedImageIds: new Set(selectedImageIds),
    sourcePreview,
    resultPreview,
    activeViewerSide,
    resultReady,
    formValues: currentFormValues()
  });
}

function restoreModeState(mode = activeMode) {
  const state = modeStates.get(mode);
  if (!state) {
    pickedFile = null;
    uploadedFile = null;
    pickedFiles = [];
    uploadedFiles = [];
    processedFiles = [];
    selectedImageIds = new Set();
    sourcePreview = null;
    resultPreview = null;
    activeViewerSide = "source";
    resultReady = false;
    loadedImage = null;
    return {};
  }
  pickedFile = state.pickedFile || null;
  uploadedFile = state.uploadedFile || null;
  pickedFiles = [...(state.pickedFiles || [])];
  uploadedFiles = [...(state.uploadedFiles || [])];
  processedFiles = [...(state.processedFiles || [])];
  selectedImageIds = new Set(state.selectedImageIds || []);
  sourcePreview = state.sourcePreview || null;
  resultPreview = state.resultPreview || null;
  activeViewerSide = state.activeViewerSide || "source";
  resultReady = Boolean(state.resultReady);
  loadedImage = null;
  return state.formValues || {};
}
function renderNav() {
  nav.innerHTML = "";
  for (const [key, item] of Object.entries(modules)) {
    const button = el("button", { class: `nav-btn ${key === activeMode ? "active" : ""}`, type: "button" }, [
      el("span", { text: item.title })
    ]);
    button.addEventListener("click", () => {
      if (key === activeMode) return;
      saveModeState(activeMode);
      activeMode = key;
      const values = restoreModeState(activeMode);
      render(values);
      closeViewer();
    });
    nav.append(button);
  }
}

function fieldControl(field) {
  const [name, label, type, wide, meta] = field;
  const wrap = el("label", { class: `field ${wide}` });
  wrap.dataset.fieldName = name;
  wrap.append(el("span", { text: label }));

  if (type === "file") {
    const accept = isCompressionMode()
      ? ".mp4,.mov,.mkv,.avi,.webm,.m4v,.wav,.mp3,.flac,.aac,.m4a,.ogg,.pdf,.png,.jpg,.jpeg,.webp,.bmp,.tif,.tiff,.gif,.heic"
      : activeMode.startsWith("video") ? "video/*" : activeMode.startsWith("audio") ? "audio/*" : "image/*";
    const pickerAttrs = { name, type: "file", accept };
    if (isAssetBoardMode()) pickerAttrs.multiple = "";
    const picker = el("input", pickerAttrs);
    const button = el("label", { class: "file-btn" }, [
      el("span", { text: "选择文件" }),
      picker
    ]);
    const display = el("div", { class: "picked-file", text: pickedFile ? pickedFile.name : "未选择文件" });
    picker.addEventListener("change", async () => {
      const files = [...(picker.files || [])];
      if (!files.length) return;
      await selectFiles(files, display);
      picker.value = "";
    });
    if (window.keplerDesktop) {
      button.addEventListener("click", async (event) => {
        event.preventDefault();
        await selectNativeFile(display);
      });
    }
    wrap.append(button);
    if (!isAssetBoardMode()) wrap.append(display);
  } else if (type === "toggle") {
    wrap.classList.add("toggle-field", "feature-toggle-field");
    const input = el("input", { name, type: "checkbox", value: "true" });
    wrap.append(el("span", { class: "toggle-control" }, [input, el("span", { class: "toggle-track" })]));
  } else if (type === "select") {
    const select = el("select", { name });
    for (const [value, text] of meta) select.append(el("option", { value, text }));
    wrap.append(select);
  } else if (type === "textarea") {
    wrap.append(el("textarea", { name, rows: "5" }));
  } else {
    wrap.append(el("input", { name, type, placeholder: meta || "" }));
  }

  if (typeof meta === "string" && meta) wrap.append(el("small", { class: "hint", text: meta }));
  return wrap;
}


const videoFeatureGroups = [
  {
    title: "视频超分",
    desc: "逐帧增强清晰度，可选择模型、倍率或自定义分辨率。",
    fields: ["upscaleEnabled", "upscaleModel", "upscaleScale", "customWidth", "customHeight"]
  },
  {
    title: "视频降噪",
    desc: "降低画面噪点，可选择弱、中、强三档。",
    fields: ["denoiseEnabled", "denoiseStrength"]
  },
  {
    title: "视频补帧",
    desc: "提升运动流畅度，选择 RIFE 模型和目标帧率。",
    fields: ["interpolateEnabled", "interpolateModel", "interpolateFps", "customFps"]
  }
]

function renderVideoForm(item) {
  const fields = new Map(item.fields.map((field) => [field[0], field]));
  const inputField = fields.get("inputPath");
  if (inputField) form.append(fieldControl(inputField));

  const grid = el("div", { class: "video-feature-grid" });
  for (const group of videoFeatureGroups) {
    const controls = el("div", { class: "video-feature-controls" });
    for (const name of group.fields) {
      const field = fields.get(name);
      if (field) controls.append(fieldControl(field));
    }
    grid.append(el("section", { class: "video-feature-card" }, [
      el("div", { class: "video-feature-copy" }, [
        el("strong", { text: group.title }),
        el("small", { text: group.desc })
      ]),
      controls
    ]));
  }
  form.append(grid);
  const outputFormat = fields.get("outputFormat");
  if (outputFormat) form.append(fieldControl(outputFormat));
}
function cutoutDefaultsFor(model) {
  return { ...(cutoutModelDefaults[model] || cutoutModelDefaults["birefnet-lite"] || {}) };
}

function applyCutoutModelDefaults(model, { force = false } = {}) {
  if (activeMode !== "cutout") return;
  const defaults = cutoutDefaultsFor(model);
  if (!defaults) return;
  for (const [name, value] of Object.entries(defaults)) {
    const element = form.elements[name];
    if (!element) continue;
    if (force || element.dataset.touched !== "true") element.value = String(value);
  }
}

function bindCutoutControls() {
  if (activeMode !== "cutout") return;
  const modelSelect = form.elements.model;
  if (!modelSelect) return;
  for (const element of form.elements) {
    if (!element.name || element.type === "file") continue;
    element.addEventListener("input", () => {
      if (element.name !== "model") element.dataset.touched = "true";
    });
    element.addEventListener("change", () => {
      if (element.name !== "model") element.dataset.touched = "true";
    });
  }
  modelSelect.addEventListener("change", () => {
    for (const element of form.elements) {
      if (element.name && element.name !== "model") delete element.dataset.touched;
    }
    applyCutoutModelDefaults(modelSelect.value, { force: true });
  });
  applyCutoutModelDefaults(modelSelect.value, { force: false });
}
function bindVideoControls() {
  if (activeMode !== "video-upscale") return;
  const groups = [
    ["denoiseEnabled", ".video-denoise-option"],
    ["interpolateEnabled", ".video-interpolate-option"],
    ["upscaleEnabled", ".video-upscale-option"]
  ];
  const update = () => {
    for (const [toggleName, selector] of groups) {
      const enabled = Boolean(form.elements[toggleName]?.checked);
      for (const field of form.querySelectorAll(selector)) {
        if (field.classList.contains("video-custom-resolution")) continue;
        field.classList.toggle("disabled-field", !enabled);
        for (const control of field.querySelectorAll("input, select")) control.disabled = !enabled;
      }
    }
    const customFps = Boolean(form.elements.interpolateEnabled?.checked) && form.elements.interpolateFps?.value === "custom";
    for (const field of form.querySelectorAll(".video-custom-fps")) {
      field.classList.toggle("hidden", !customFps);
      field.classList.toggle("disabled-field", !customFps);
      for (const control of field.querySelectorAll("input")) control.disabled = !customFps;
    }
    const custom = Boolean(form.elements.upscaleEnabled?.checked) && form.elements.upscaleScale?.value === "custom";
    for (const field of form.querySelectorAll(".video-custom-resolution")) {
      field.classList.toggle("hidden", !custom);
      field.classList.toggle("disabled-field", !custom);
      for (const control of field.querySelectorAll("input")) control.disabled = !custom;
    }
  };
  for (const element of form.elements) {
    if (!element.name) continue;
    if (["denoiseEnabled", "interpolateEnabled", "interpolateFps", "upscaleEnabled", "upscaleScale"].includes(element.name)) {
      element.addEventListener("change", update);
    }
  }
  if (!form.elements.interpolateFps?.value) form.elements.interpolateFps.value = "30";
  if (!form.elements.upscaleScale?.value) form.elements.upscaleScale.value = "2";
  update();
}
function renderForm(savedValues = {}) {
  const item = modules[activeMode];
  document.querySelector("#panelTitle").textContent = item.title;
  document.querySelector("#panelSubtitle").textContent = item.subtitle;
  form.innerHTML = "";
  if (activeMode === "video-upscale") renderVideoForm(item);
  else for (const field of item.fields) form.append(fieldControl(field));
  applyFormValues(savedValues);
  const labTitle = document.querySelector("#labTitle");
  const labSubtitle = document.querySelector("#labSubtitle");
  labPanel.classList.toggle("hide-board-head", isVideoBoardMode() || isAudioBoardMode());
  if (labTitle) labTitle.textContent = item.title;
  if (sourceListTitle) sourceListTitle.textContent = isVideoBoardMode() ? "原视频列表" : isAudioBoardMode() ? "原音频列表" : isCompressionMode() ? "待压缩文件列表" : "原图列表";
  if (addImagesBtn) addImagesBtn.textContent = isVideoBoardMode() ? "添加视频" : isAudioBoardMode() ? "添加音频" : isCompressionMode() ? "添加文件" : "添加图片";
  if (labSubtitle) {
    labSubtitle.textContent = activeMode === "cutout"
      ? "左侧管理待抠图原图，任务完成后右侧显示透明背景结果。"
      : isVideoBoardMode()
        ? "左侧管理待处理视频，任务完成后右侧显示处理后的视频列表。"
        : isAudioBoardMode()
          ? "左侧管理待处理音频，任务完成后右侧显示处理后的音频列表。"
          : "左侧管理待处理原图，任务完成后右侧显示处理后的图片列表。";
  }
  bindCutoutControls();
  bindVideoControls();
  labPanel.classList.toggle("hidden", !isAssetBoardMode());
  const hasMediaPreview = activeMode.startsWith("video") || activeMode.startsWith("audio");
  mediaPanel.classList.toggle("hidden", isAssetBoardMode() || !hasMediaPreview);
  if (isAssetBoardMode() || !hasMediaPreview) {
    mediaPreview.innerHTML = "";
    mediaMeta.innerHTML = "";
  }
  syncRunButton();
}

function syncRunButton() {
  if (!runBtn) return;
  const hasMaterial = uploadedFiles.length > 0 || Boolean(uploadedFile?.path);
  runBtn.disabled = !hasMaterial;
  runBtn.setAttribute("aria-disabled", String(!hasMaterial));
  runBtn.title = hasMaterial ? "开始处理当前素材" : "请先上传素材";
}

async function refreshEngines() {
  const box = document.querySelector("#engineStatus");
  const descriptions = {
    ffmpeg: "视频、音频转换和处理",
    ffprobe: "读取视频、音频信息",
    waifu: "动漫图片放大",
    photo: "照片图片放大",
    rife: "视频补帧",
    rembg: "AI 抠图",
    demucs: "人声与背景声分离",
    ghostscript: "PDF 压缩"
  };
  try {
    const data = await fetch("/api/engines").then((r) => r.json());
    box.innerHTML = "";
    for (const [key, info] of Object.entries(data)) {
      const label = descriptions[key] ? `${key}：${descriptions[key]}` : key;
      const download = info.download;
      const downloadable = ["photo", "waifu", "rife", "rembg", "demucs"].includes(key);
      const downloading = download?.status === "downloading";
      const button = el("button", {
        class: `badge engine-action ${info.available ? "ok" : ""}`,
        text: info.available ? "可用" : downloading ? `下载 ${download.progress || 0}%` : download?.status === "failed" ? "重试" : downloadable ? "下载" : "系统"
      });
      button.disabled = info.available || downloading || !downloadable;
      button.title = info.available ? "已就绪" : downloadable ? "下载此引擎及其基础文件" : "由系统或应用依赖提供";
      if (downloadable && !info.available && !downloading) {
        button.addEventListener("click", async () => {
          button.disabled = true;
          button.textContent = "下载中";
          try {
            await fetch(`/api/engines/${encodeURIComponent(key)}/download`, { method: "POST" });
          } finally {
            refreshEngines();
          }
        });
      }
      box.append(el("div", { class: "engine-row" }, [
        el("span", { class: "engine-label", text: label, title: label }),
        button
      ]));
    }
  } catch {
    box.textContent = "状态读取失败";
  }
}

async function refreshJobs() {
  try {
    const jobs = await fetch("/api/jobs").then((r) => r.json());
    jobList.innerHTML = "";
    for (const job of jobs.slice().reverse()) {
      const statusText = job.status === "failed" ? "处理失败" : job.status || "unknown";
      const card = el("article", { class: `job-card ${job.status || ""}` }, [
        el("strong", { text: job.plan?.summary || "任务" }),
        el("div", { class: "status", text: statusText }),
        el("small", { text: job.plan?.output || "" })
      ]);
      if (job.status === "failed") {
        const message = jobFailureMessage(job);
        card.append(el("p", { class: "job-message", text: message }));
        markResultFailed(job);
      }
      if (job.status === "done" && job.plan?.output) {
        const outputs = Array.isArray(job.plan.outputs) ? job.plan.outputs : [job.plan.output];
        for (const output of outputs) {
          if (/\.(wav|mp3|flac|m4a|aac|ogg)$/i.test(output)) {
            card.append(el("audio", { class: "job-audio-player", controls: "", preload: "metadata", src: `/api/audio-preview?path=${encodeURIComponent(output)}` }));
          }
          card.append(el("a", { href: `/api/result?path=${encodeURIComponent(output)}`, text: `下载 ${output.split(/[\\/]/).pop() || "结果"}` }));
        }
        if (shouldPreviewJob(job)) {
          for (const output of outputs) {
            const outputKey = comparablePath(output);
            const hasPending = processedFiles.some((file) => file.status === "pending" && samePath(file.sourcePath, job.plan.input));
            if (!renderedOutputs.has(outputKey) || hasPending) {
              loadProcessedAsset(output, job.plan.summary || "处理结果", job.plan.outputSizes?.[output], job.plan.input);
            }
          }
        }
      }
      jobList.append(card);
    }
  } catch {
    jobList.innerHTML = "";
  }
}

function shouldPreviewJob(job) {
  if (!isAssetBoardMode()) return false;
  if (!uploadedFiles.length) return false;
  if (!job.plan?.input) return false;
  if (job.plan.pipeline !== "audio-separate" && !isPreviewableOutput(job.plan.output)) return false;
  return uploadedFiles.some((file) => samePath(file.path, job.plan.input));
}

function failureAdvice(message = "") {
  if (/内存|显存|memory|allocate|bad_alloc|vkAllocateMemory/i.test(message)) {
    return "建议：关闭其他占用 GPU/内存的软件，降低放大倍率或自定义分辨率后重新处理。";
  }
  if (/缺少|missing/i.test(message)) return "建议：检查对应引擎和模型文件是否完整。";
  return "建议：查看任务队列日志，调整参数后重新处理。";
}

function jobFailureMessage(job) {
  const message = String(job?.message || "处理失败，任务已停止。").trim();
  return `${message}${message.endsWith("。") ? "" : "。"}\n${failureAdvice(message)}`;
}

function markResultFailed(job) {
  if (!shouldPreviewJob(job)) return;
  const source = uploadedFiles.find((file) => samePath(file.path, job.plan.input));
  const message = jobFailureMessage(job);
  const failed = {
    id: `failed-${job.id || job.plan.input}`,
    sourcePath: job.plan.input,
    name: source ? displayName(source) : (job.plan.input || "处理任务"),
    size: source?.size,
    width: source?.width,
    height: source?.height,
    duration: source?.duration,
    mediaType: source ? mediaTypeFor(source) : "video",
    status: "failed",
    message
  };
  const index = processedFiles.findIndex((file) => samePath(file.sourcePath, job.plan.input));
  if (index >= 0) processedFiles[index] = { ...processedFiles[index], ...failed };
  else processedFiles.push(failed);
  resultReady = false;
  resultInfo.textContent = "处理失败";
  resetResultCanvas("处理失败");
  renderResultImageList();
  if (!notifiedFailureJobs.has(job.id)) {
    notifiedFailureJobs.add(job.id);
    writeLog("任务处理失败", `${failed.name}\n${message}`, "处理失败");
  }
}
function payload() {
  const data = new FormData(form);
  const options = {};
  for (const [key, value] of data.entries()) {
    if (key === "inputPath" || key === "outputDir") continue;
    options[key] = value === "true" ? "true" : value;
  }
  if (activeMode === "cutout") Object.assign(options, cutoutDefaultsFor(options.model));
  return {
    mode: activeMode,
    inputPath: typeof data.get("inputPath") === "string" ? data.get("inputPath") : "",
    uploadedPath: uploadedFile?.path || "",
    uploadedPaths: uploadedFiles.map((file) => file.path),
    uploadedName: uploadedFile ? displayName(uploadedFile) : "",
    uploadedNames: uploadedFiles.map(displayName),
    browserFileName: pickedFile?.name || "",
    outputDir: "",
    options
  };
}

function writeLog(title, detail, status = "") {
  const item = el("article", { class: "log-item" }, [
    el("strong", { text: title }),
    el("div", { class: "status", text: status }),
    el("code", { text: typeof detail === "string" ? detail : JSON.stringify(detail, null, 2) })
  ]);
  log.prepend(item);
}

function displayName(file) {
  return file.displayName || file.name || "image";
}

function gcd(a, b) {
  a = Math.abs(Math.round(a || 0));
  b = Math.abs(Math.round(b || 0));
  while (b) [a, b] = [b, a % b];
  return a || 1;
}

function aspectLabel(width, height) {
  if (!width || !height) return "";
  const divisor = gcd(width, height);
  return `${Math.round(width / divisor)}:${Math.round(height / divisor)}`;
}

function imageMetaText(file) {
  if (mediaTypeFor(file) === "document") {
    return Number.isFinite(file.size) ? formatBytes(file.size) : "PDF 文件";
  }
  if (mediaTypeFor(file) === "audio") {
    const duration = Number.isFinite(file.duration) ? formatDuration(file.duration) : "读取中";
    const size = Number.isFinite(file.size) ? formatBytes(file.size) : "";
    return [duration, size].filter(Boolean).join(" · ");
  }
  if (mediaTypeFor(file) === "video") {
    const dimensions = file.width && file.height ? `${file.width} x ${file.height}` : "读取中";
    const ratio = file.width && file.height ? aspectLabel(file.width, file.height) : "";
    const duration = Number.isFinite(file.duration) ? formatDuration(file.duration) : "读取中";
    const size = Number.isFinite(file.size) ? formatBytes(file.size) : "";
    return [dimensions, ratio, duration, size].filter(Boolean).join(" · ");
  }
  const dimensions = file.width && file.height ? `${file.width} x ${file.height}` : "读取中";
  const ratio = file.width && file.height ? aspectLabel(file.width, file.height) : "";
  const size = Number.isFinite(file.size) ? formatBytes(file.size) : "";
  return [dimensions, ratio, size].filter(Boolean).join(" · ");
}

function captureVideoPoster(file, video) {
  if (!file || file.posterUrl || file.posterLoading || !video.videoWidth || !video.videoHeight) return;
  file.posterLoading = true;
  const finish = () => {
    file.posterLoading = false;
    renderImageList();
    renderResultImageList();
  };
  const grab = () => {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      file.posterUrl = canvas.toDataURL("image/jpeg", 0.82);
    } catch {
      // Some codecs may not expose a drawable frame in Chromium; keep the metadata-only fallback.
    } finally {
      finish();
    }
  };
  video.addEventListener("seeked", grab, { once: true });
  video.addEventListener("loadeddata", () => {
    if (Number.isFinite(video.duration) && video.duration > 0.2) video.currentTime = 0.1;
    else grab();
  }, { once: true });
}

function hydrateVideoMeta(file) {
  if (!file || ((file.width || file.height) && file.posterUrl) || file.metaLoading) return;
  const url = file.previewUrl || file.url;
  if (!url) return;
  file.metaLoading = true;
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";
  video.onloadedmetadata = () => {
    file.width = video.videoWidth;
    file.height = video.videoHeight;
    file.duration = video.duration;
    file.metaLoading = false;
    captureVideoPoster(file, video);
    renderImageList();
    renderResultImageList();
  };
  video.onerror = () => {
    file.metaLoading = false;
  };
  video.src = url;
}

function hydrateImageMeta(file) {
  if (!file || file.width || file.height || file.metaLoading) return;
  const url = file.previewUrl || file.url;
  if (!url) return;
  if (mediaTypeFor(file) === "video") {
    hydrateVideoMeta(file);
    return;
  }
  if (mediaTypeFor(file) === "audio") {
    file.metaLoading = true;
    const audio = document.createElement("audio");
    audio.preload = "auto";
    audio.onloadedmetadata = () => {
      file.duration = audio.duration;
      file.metaLoading = false;
      renderImageList();
      renderResultImageList();
    };
    audio.onerror = () => { file.metaLoading = false; };
    audio.src = url;
    audio.load();
    return;
  }
  file.metaLoading = true;
  const image = new Image();
  image.onload = () => {
    file.width = image.naturalWidth;
    file.height = image["natural" + "Height"];
    file.metaLoading = false;
    renderImageList();
    renderResultImageList();
  };
  image.onerror = () => {
    file.metaLoading = false;
  };
  image.src = url;
}
function syncPrimaryImage() {
  uploadedFile = uploadedFiles[0] || null;
  pickedFile = pickedFiles[0] || (uploadedFile ? { name: displayName(uploadedFile), size: uploadedFile.size || 0, type: "" } : null);
}

function videoPreviewNode(file) {
  const url = file.previewUrl || file.url || "";
  const box = el("div", { class: "video-preview-stack" }, [
    el("div", { class: "video-thumb-fallback" }, [
      el("span", { text: "VIDEO" }),
      el("small", { text: file.metaLoading || file.posterLoading ? "读取封面" : "视频预览" })
    ])
  ]);
  if (!url && !file.posterUrl) return box;
  if (file.posterUrl) {
    const poster = el("img", { class: "video-poster", src: file.posterUrl, alt: "" });
    poster.addEventListener("load", () => box.classList.add("has-poster"), { once: true });
    poster.addEventListener("error", () => {
      poster.remove();
      box.classList.add("poster-failed");
    }, { once: true });
    box.append(poster);
  }
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.preload = "metadata";
  video.draggable = false;
  if (url) video.src = url;
  const showVideo = () => box.classList.add("has-video-frame");
  video.addEventListener("loadeddata", () => {
    showVideo();
    if (Number.isFinite(video.duration) && video.duration > 0.2) {
      try {
        video.currentTime = 0.1;
      } catch {
        // Keep the loaded frame if seeking is not supported for this file.
      }
    }
  }, { once: true });
  video.addEventListener("seeked", showVideo, { once: true });
  video.addEventListener("error", () => {
    box.classList.add("video-failed");
    const fallback = box.querySelector("small");
    if (fallback) fallback.textContent = file.posterUrl ? "封面读取失败" : "暂不支持预览";
  }, { once: true });
  box.append(video);
  return box;
}

function assetPreviewNode(file) {
  const mediaType = mediaTypeFor(file);
  if (mediaType === "document") {
    return el("div", { class: "file-type-preview" }, [
      el("strong", { text: "PDF" }),
      el("small", { text: "文档预览" })
    ]);
  }
  const url = mediaType === "audio" && file.path
    ? `/api/audio-preview?path=${encodeURIComponent(file.path)}&t=${Date.now()}`
    : file.previewUrl || file.url || "";
  if (mediaType === "video") {
    return videoPreviewNode(file);
  }
  if (mediaType === "audio") {
    const audio = new Audio();
    audio.preload = "auto";
    let sourcePromise = null;
    const ensureSource = async () => {
      if (audio.src) return;
      if (!sourcePromise) {
        sourcePromise = fetch(url, { cache: "no-store" }).then(async (response) => {
          if (!response.ok) throw new Error(`音频读取失败（${response.status}）`);
          const blob = await response.blob();
          audio.src = URL.createObjectURL(blob);
          audio.load();
        });
      }
      await sourcePromise;
    };
    const play = el("button", { class: "audio-play", type: "button", text: "▶", ariaLabel: "播放" });
    const progress = el("input", { class: "audio-progress", type: "range", min: "0", max: "100", value: "0", step: "0.1", ariaLabel: "播放进度" });
    const time = el("span", { class: "audio-time", text: "0:00 / --:--" });
    const player = el("div", { class: "audio-player" }, [audio, play, progress, time]);
    const formatTime = (value) => {
      if (!Number.isFinite(value)) return "--:--";
      const total = Math.max(0, Math.round(value));
      return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
    };
    const updateTime = () => {
      progress.value = audio.duration ? String((audio.currentTime / audio.duration) * 100) : "0";
      time.textContent = `${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`;
    };
    play.addEventListener("click", (event) => {
      event.stopPropagation();
      if (audio.paused) {
        ensureSource().then(() => audio.play()).catch(() => {
          play.disabled = true;
          time.textContent = "无法播放";
        });
      } else audio.pause();
    });
    progress.addEventListener("click", (event) => event.stopPropagation());
    progress.addEventListener("input", () => {
      if (audio.duration) audio.currentTime = audio.duration * Number(progress.value) / 100;
    });
    audio.addEventListener("loadedmetadata", () => {
      updateTime();
    });
    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("play", () => { play.textContent = "❚❚"; play.setAttribute("aria-label", "暂停"); });
    audio.addEventListener("pause", () => { play.textContent = "▶"; play.setAttribute("aria-label", "播放"); });
    audio.addEventListener("ended", () => { play.textContent = "▶"; progress.value = "0"; });
    audio.addEventListener("error", () => {
      file.metaLoading = false;
      play.disabled = true;
      time.textContent = "无法播放";
    });
    return player;
  }
  return el("img", { src: url, alt: displayName(file), draggable: "false" });
}

function assetThumbNode(file) {
  const isAudio = mediaTypeFor(file) === "audio";
  const attrs = { class: `image-thumb${isAudio ? " audio-thumb" : ""}` };
  if (mediaTypeFor(file) === "video" && file.width && file.height) {
    attrs.style = `aspect-ratio: ${file.width} / ${file.height}`;
  }
  return el("div", attrs, [assetPreviewNode(file)]);
}

function renderImageList() {
  selectedImageIds = new Set([...selectedImageIds].filter((id) => uploadedFiles.some((file) => file.id === id)));
  const total = uploadedFiles.length;
  const selected = selectedImageIds.size;
  const unit = assetUnit();
  const kind = assetKindName();
  imageListActions.classList.toggle("hidden", total === 0);
  imageListCount.textContent = `共 ${total} ${unit}${selected ? ` · 已选 ${selected}` : ""}`;
  imageToolbar.classList.toggle("hidden", selected === 0);
  clearImagesBtn.disabled = total === 0;
  downloadImagesBtn.disabled = selected === 0;
  deleteImagesBtn.disabled = selected === 0;
  renameImagesBtn.disabled = selected === 0;
  deselectImagesBtn.disabled = selected === 0;

  imageList.innerHTML = "";
  imageList.classList.toggle("empty", total === 0);
  if (!total) {
    imageList.append(el("div", { class: "empty-drop" }, [
      el("div", { class: "empty-drop-icon", text: "->|" }),
      el("strong", { text: `拖入${kind}到此处(支持多${unit})` }),
      el("span", { text: `鼠标拖拽可框选多${unit}` }),
      el("small", { text: assetFormatsLabel() })
    ]));
    return;
  }

  for (const file of uploadedFiles) {
    hydrateImageMeta(file);
    const item = el("article", {
      class: `image-item ${selectedImageIds.has(file.id) ? "selected" : ""}`,
      draggable: "true",
      "data-id": file.id,
      title: displayName(file)
    }, [
      assetThumbNode(file),
      el("div", { class: "image-caption" }, [
        el("div", { class: "image-name", text: displayName(file) }),
        el("div", { class: "image-meta", text: imageMetaText(file) })
      ])
    ]);
    item.addEventListener("click", (event) => toggleImageSelection(file.id, event));
    item.addEventListener("dragstart", () => {
      dragImageId = file.id;
      item.classList.add("dragging");
    });
    item.addEventListener("dragend", () => {
      dragImageId = null;
      item.classList.remove("dragging");
    });
    item.addEventListener("dragover", (event) => event.preventDefault());
    item.addEventListener("drop", async (event) => {
      event.preventDefault();
      const files = filesForActiveMode(event.dataTransfer.files || []);
      if (files.length) {
        imageList.classList.remove("dragging");
        await selectFiles(files, form.querySelector(".picked-file"));
        return;
      }
      reorderImage(dragImageId, file.id);
    });
    imageList.append(item);
  }
}

function renderResultImageList() {
  const total = processedFiles.length;
  const unit = assetUnit();
  resultListActions.classList.toggle("hidden", total === 0);
  const done = processedFiles.filter((file) => file.status === "done").length;
  const pending = processedFiles.filter((file) => file.status === "pending").length;
  const failed = processedFiles.filter((file) => file.status === "failed").length;
  resultListCount.textContent = `共 ${total} ${unit} · ${done} ${unit}已处理 · ${pending} ${unit}处理中${failed ? ` · ${failed} ${unit}失败` : ""}`;
  resultImageList.innerHTML = "";
  resultImageList.classList.toggle("empty", total === 0);

  if (!total) {
    resultImageList.append(el("div", { class: "empty-drop" }, [
      el("strong", { text: "处理完成后显示在这里" }),
      el("small", { text: assetFormatsLabel() })
    ]));
    return;
  }

  for (const file of processedFiles) {
    const isPending = file.status === "pending";
    const isFailed = file.status === "failed";
    if (!isPending && !isFailed) hydrateImageMeta(file);
    const statusText = isFailed ? "处理失败" : "处理中";
    const metaText = isPending ? "处理中" : isFailed ? (file.message || "处理失败") : imageMetaText(file);
    const item = el("article", {
      class: `image-item ${isPending ? "pending" : ""} ${isFailed ? "failed" : ""}`,
      title: isFailed ? `${displayName(file)}\n${file.message || "处理失败"}` : displayName(file)
    }, [
      isPending || isFailed
        ? el("div", { class: "image-thumb" }, [el("div", { class: `processing-card ${isFailed ? "failed" : ""}`, text: statusText })])
        : assetThumbNode(file),
      el("div", { class: "image-caption" }, [
        el("div", { class: "image-name", text: displayName(file) }),
        el("div", { class: "image-meta", text: metaText })
      ])
    ]);
    if (!isPending && !isFailed && !["audio", "document"].includes(mediaTypeFor(file))) item.addEventListener("click", () => openProcessedImage(file));
    resultImageList.append(item);
  }
}
function markResultPending(files = uploadedFiles) {
  processedFiles = files.map((file) => ({
    id: `pending-${file.path || file.id || file.name}`,
    sourcePath: file.path || "",
    name: displayName(file),
    size: file.size,
    mediaType: mediaTypeFor(file),
    status: "pending"
  }));
  renderResultImageList();
}

function toggleImageSelection(id, event) {
  if (!id) return;
  const isMultiSelect = event.ctrlKey || event.metaKey || event.shiftKey;
  if (!isMultiSelect && selectedImageIds.has(id)) {
    const file = uploadedFiles.find((item) => item.id === id);
    if (file && mediaTypeFor(file) === "audio") {
      imageList.querySelector(`[data-id="${CSS.escape(String(id))}"] .audio-play`)?.click();
    } else if (file && mediaTypeFor(file) !== "document") {
      openListImage(file);
    }
    return;
  }
  if (!isMultiSelect) selectedImageIds.clear();
  if (selectedImageIds.has(id)) selectedImageIds.delete(id);
  else selectedImageIds.add(id);
  renderImageList();
}

function previewFromSourceFile(file) {
  const url = file?.previewUrl || file?.url;
  if (!file || !url) return null;
  return {
    url,
    path: file.path || "",
    sourcePath: file.path || "",
    downloadUrl: file.path ? `/api/result?path=${encodeURIComponent(file.path)}` : url,
    name: displayName(file),
    width: file.width,
    height: file.height,
    duration: file.duration,
    size: file.size,
    mediaType: mediaTypeFor(file)
  };
}

function previewFromProcessedFile(file) {
  const url = file?.previewUrl || file?.url;
  if (!file || !url) return null;
  return {
    url,
    path: file.path || "",
    sourcePath: file.sourcePath || "",
    downloadUrl: file.downloadUrl || (file.path ? `/api/result?path=${encodeURIComponent(file.path)}` : url),
    name: displayName(file),
    width: file.width,
    height: file.height,
    duration: file.duration,
    size: file.size,
    mediaType: mediaTypeFor(file)
  };
}
function comparablePath(value) {
  return String(value || "").replace(/\\/g, "/").replace(/^file:\/\//i, "").toLowerCase();
}

function samePath(a, b) {
  const left = comparablePath(a);
  const right = comparablePath(b);
  return Boolean(left && right && left === right);
}

function matchingProcessedForSource(file) {
  return processedFiles.find((item) => samePath(item.sourcePath, file.path)) || null;
}

function matchingSourceForProcessed(file) {
  return uploadedFiles.find((item) => samePath(item.path, file.sourcePath)) || null;
}

function openListImage(file) {
  const source = previewFromSourceFile(file);
  if (!source) return;
  sourcePreview = source;
  const paired = matchingProcessedForSource(file);
  resultPreview = paired ? previewFromProcessedFile(paired) : null;
  if (source.mediaType !== "video" && (!sourcePreview.width || !sourcePreview.height)) {
    const image = new Image();
    image.onload = () => {
      file.width = image.naturalWidth;
      file.height = image["natural" + "Height"];
      sourcePreview.width = file.width;
      sourcePreview.height = file.height;
      openViewer("source");
      renderImageList();
    };
    image.src = source.url;
    return;
  }
  openViewer("source");
}

function openProcessedImage(file) {
  const result = previewFromProcessedFile(file);
  if (!result) return;
  resultPreview = result;
  const paired = matchingSourceForProcessed(file);
  sourcePreview = paired ? previewFromSourceFile(paired) : null;
  openViewer("result");
}
function clearResultImages() {
  processedFiles = [];
  resultPreview = null;
  resultReady = false;
  resultInfo.textContent = "等待处理";
  clearCanvas(resultCanvas);
  renderResultImageList();
}

function reorderImage(fromId, toId) {
  if (!fromId || !toId || fromId === toId) return;
  const from = uploadedFiles.findIndex((file) => file.id === fromId);
  const to = uploadedFiles.findIndex((file) => file.id === toId);
  if (from < 0 || to < 0) return;
  const [item] = uploadedFiles.splice(from, 1);
  uploadedFiles.splice(to, 0, item);
  syncPrimaryImage();
  renderImageList();
}

function clearImages() {
  uploadedFiles = [];
  pickedFiles = [];
  processedFiles = [];
  selectedImageIds.clear();
  syncPrimaryImage();
  sourcePreview = null;
  resultPreview = null;
  sourceInfo.textContent = "未选择";
  resultInfo.textContent = "等待处理";
  clearCanvas(sourceCanvas);
  clearCanvas(resultCanvas);
  const display = form.querySelector(".picked-file");
  if (display) display.textContent = "未选择文件";
  renderImageList();
  renderResultImageList();
  syncRunButton();
}

function setImagesDisplay(display, busyText = "") {
  if (!display) return;
  if (busyText) {
    display.textContent = busyText;
    return;
  }
  if (!uploadedFiles.length) {
    display.textContent = "未选择文件";
    return;
  }
  display.textContent = uploadedFiles.length > 1
    ? `${uploadedFiles.length} 个文件 · ${formatBytes(uploadedFiles.reduce((total, file) => total + (file.size || 0), 0))}`
    : `${uploadedFiles[0].name} · ${formatBytes(uploadedFiles[0].size)}`;
}

function deleteSelectedImages() {
  if (!selectedImageIds.size) return;
  uploadedFiles = uploadedFiles.filter((file) => !selectedImageIds.has(file.id));
  pickedFiles = pickedFiles.filter((file) => !selectedImageIds.has(file.id));
  selectedImageIds.clear();
  syncPrimaryImage();
  if (uploadedFile?.previewUrl) loadPreviewImageUrl(uploadedFile.previewUrl, displayName(uploadedFile), uploadedFile.size);
  else {
    sourcePreview = null;
    resultPreview = null;
    clearCanvas(sourceCanvas);
    clearCanvas(resultCanvas);
  }
  renderImageList();
}

function downloadFile(file) {
  const source = file.path
    ? `/api/result?path=${encodeURIComponent(file.path)}`
    : (file.previewUrl || file.url);
  if (!source) return;
  const link = document.createElement("a");
  link.download = displayName(file);
  link.href = source;
  document.body.append(link);
  link.click();
  link.remove();
}

async function downloadSelectedImages() {
  const targets = uploadedFiles.filter((file) => selectedImageIds.has(file.id));
  for (const file of targets) {
    downloadFile(file);
    await new Promise((resolve) => setTimeout(resolve, 120));
  }
  writeLog("批量下载", `已触发 ${targets.length} ${assetUnit()}${assetKindName()}下载。`, "下载中");
}

function askRenamePrefix() {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      renameDialog.classList.add("hidden");
      renameConfirmBtn.removeEventListener("click", onConfirm);
      renameCancelBtn.removeEventListener("click", onCancel);
      renameDialog.removeEventListener("click", onDialogClick);
      renameInput.removeEventListener("keydown", onKeyDown);
      resolve(value);
    };
    const onConfirm = () => finish(renameInput.value);
    const onCancel = () => finish(null);
    const onDialogClick = (event) => {
      if (event.target === renameDialog) finish(null);
    };
    const onKeyDown = (event) => {
      if (event.key === "Enter") finish(renameInput.value);
      if (event.key === "Escape") finish(null);
    };

    renameInput.value = "";
    renameDialog.classList.remove("hidden");
    renameConfirmBtn.addEventListener("click", onConfirm);
    renameCancelBtn.addEventListener("click", onCancel);
    renameDialog.addEventListener("click", onDialogClick);
    renameInput.addEventListener("keydown", onKeyDown);
    requestAnimationFrame(() => renameInput.focus());
  });
}

async function renameSelectedImages() {
  if (!selectedImageIds.size) return;
  const prefix = await askRenamePrefix();
  if (prefix === null) return;
  const targets = uploadedFiles.filter((file) => selectedImageIds.has(file.id));
  targets.forEach((file, index) => {
    const ext = (file.name?.match(/\.[^.]+$/) || [""])[0];
    file.displayName = `${prefix}${index === 0 ? "" : index}${ext}`;
  });
  renderImageList();
}

function rectsIntersect(a, b) {
  return a.left <= b.right && a.right >= b.left && a.top <= b.bottom && a.bottom >= b.top;
}

function updateSelectionBox(event) {
  if (!selectionStart || !selectionBox) return;
  const left = Math.min(selectionStart.x, event.clientX);
  const top = Math.min(selectionStart.y, event.clientY);
  const width = Math.abs(event.clientX - selectionStart.x);
  const height = Math.abs(event.clientY - selectionStart.y);
  Object.assign(selectionBox.style, {
    left: `${left}px`,
    top: `${top}px`,
    width: `${width}px`,
    height: `${height}px`
  });
  const box = selectionBox.getBoundingClientRect();
  selectedImageIds.clear();
  for (const item of imageList.querySelectorAll(".image-item")) {
    if (rectsIntersect(box, item.getBoundingClientRect())) selectedImageIds.add(item.dataset.id);
  }
  for (const item of imageList.querySelectorAll(".image-item")) {
    item.classList.toggle("selected", selectedImageIds.has(item.dataset.id));
  }
  imageListCount.textContent = `共 ${uploadedFiles.length} ${assetUnit()}${selectedImageIds.size ? ` · 已选 ${selectedImageIds.size}` : ""}`;
  imageToolbar.classList.toggle("hidden", selectedImageIds.size === 0);
}

function startBoxSelection(event) {
  if (event.button !== 0 || event.target.closest(".image-item")) return;
  if (!uploadedFiles.length) return;
  selectionStart = { x: event.clientX, y: event.clientY };
  selectionBox = el("div", { class: "selection-box" });
  document.body.append(selectionBox);
  updateSelectionBox(event);
  window.addEventListener("pointermove", updateSelectionBox);
  window.addEventListener("pointerup", finishBoxSelection, { once: true });
}

function finishBoxSelection() {
  window.removeEventListener("pointermove", updateSelectionBox);
  selectionBox?.remove();
  selectionBox = null;
  selectionStart = null;
  renderImageList();
}

function imageFormatFromName(name) {
  const ext = String(name || "").split(".").pop()?.toLowerCase();
  if (ext === "jpg" || ext === "jpeg") return "jpg";
  if (ext === "webp") return "webp";
  return "png";
}

function syncOutputFormat(name) {
  if (activeMode !== "image-upscale") return;
  const select = form.querySelector('select[name="format"]');
  if (!select) return;
  const next = "original";
  if ([...select.options].some((option) => option.value === next)) select.value = next;
}

function isImageMode() {
  return activeMode === "image-upscale" || activeMode === "cutout";
}

function isVideoBoardMode() {
  return activeMode === "video-upscale";
}

function isAudioBoardMode() {
  return activeMode === "audio-separate";
}

function isCompressionMode() {
  return activeMode === "compression";
}

function isAssetBoardMode() {
  return isImageMode() || isVideoBoardMode() || isAudioBoardMode() || isCompressionMode();
}

function assetUnit() {
  return isVideoBoardMode() || isAudioBoardMode() || isCompressionMode() ? "个" : "张";
}

function assetKindName() {
  if (isVideoBoardMode()) return "视频";
  if (isAudioBoardMode()) return "音频";
  if (isCompressionMode()) return "文件";
  return "图片";
}

function assetFormatsLabel() {
  if (isVideoBoardMode()) return "MP4 / MOV / MKV / AVI / WebM / M4V";
  if (isAudioBoardMode()) return "WAV / MP3 / FLAC / AAC / M4A / OGG";
  if (isCompressionMode()) return "MP4 / MOV / MP3 / PDF / PNG / JPG / JPEG / GIF";
  return "PNG / JPG / JPEG / BMP / TIF / TIFF / GIF / WebP / HEIC";
}

function isImageFile(file) {
  return file?.type?.startsWith("image/") || /\.(png|jpe?g|webp|bmp|tiff?|gif|heic)$/i.test(file?.name || "");
}

function isVideoFile(file) {
  return file?.type?.startsWith("video/") || /\.(mp4|mov|mkv|avi|webm|m4v)$/i.test(file?.name || "");
}

function isAudioFile(file) {
  return file?.type?.startsWith("audio/") || /\.(wav|mp3|flac|aac|m4a|ogg)$/i.test(file?.name || "");
}

function isCompressionFile(file) {
  return isImageFile(file) || isVideoFile(file) || isAudioFile(file) || file?.type === "application/pdf" || /\.pdf$/i.test(file?.name || "");
}

function filesForActiveMode(files) {
  const items = [...files];
  if (isImageMode()) return items.filter(isImageFile);
  if (isVideoBoardMode()) return items.filter(isVideoFile);
  if (isAudioBoardMode()) return items.filter(isAudioFile);
  if (isCompressionMode()) return items.filter(isCompressionFile);
  return items.slice(0, 1);
}

function isVideoOutput(output) {
  return /\.(mp4|mov|mkv|avi|webm|m4v)$/i.test(String(output || ""));
}

function isAudioOutput(output) {
  return /\.(wav|mp3|flac|m4a|aac|ogg)$/i.test(String(output || ""));
}

function isPdfOutput(output) {
  return /\.pdf$/i.test(String(output || ""));
}

function mediaTypeFor(value) {
  const name = typeof value === "string" ? value : `${value?.name || ""} ${value?.path || ""} ${value?.url || ""} ${value?.previewUrl || ""} ${value?.type || ""}`;
  if (isPdfOutput(name) || value?.type === "application/pdf") return "document";
  if (isVideoOutput(name) || value?.type?.startsWith?.("video/")) return "video";
  if (isAudioOutput(name) || value?.type?.startsWith?.("audio/")) return "audio";
  if (typeof value !== "string" && value?.mediaType === "video") return "video";
  if (typeof value !== "string" && value?.mediaType === "audio") return "audio";
  return "image";
}

function isPreviewableOutput(output) {
  return isImageOutput(output) || isVideoOutput(output) || isAudioOutput(output) || isPdfOutput(output);
}
function previewInfo(info) {
  if (!info) return "";
  const size = Number.isFinite(info.size) ? ` · ${formatBytes(info.size)}` : "";
  const dimensions = info.width && info.height ? `${info.width} x ${info.height}` : "";
  const ratio = info.mediaType === "video" ? "" : (info.width && info.height ? ` · ${aspectLabel(info.width, info.height)}` : "");
  const duration = info.mediaType === "video" && Number.isFinite(info.duration) ? ` · ${formatDuration(info.duration)}` : "";
  return `${dimensions}${ratio}${duration}${size}`;
}
function imageInfo(side) {
  return side === "result" ? resultPreview : sourcePreview;
}

function currentViewerSourceIndex() {
  const sourcePath = sourcePreview?.sourcePath || sourcePreview?.path || resultPreview?.sourcePath || "";
  const byPath = uploadedFiles.findIndex((file) => samePath(file.path, sourcePath));
  if (byPath >= 0) return byPath;
  const name = sourcePreview?.name || resultPreview?.name || "";
  return uploadedFiles.findIndex((file) => displayName(file) === name);
}

function updateViewerNavigation() {
  const index = currentViewerSourceIndex();
  const canNavigate = !viewerSimpleMode && uploadedFiles.length > 1;
  viewerPrevBtn.classList.toggle("hidden", !canNavigate);
  viewerNextBtn.classList.toggle("hidden", !canNavigate);
  viewerPrevBtn.disabled = !canNavigate || index <= 0;
  viewerNextBtn.disabled = !canNavigate || index >= uploadedFiles.length - 1;
}

function navigateViewer(delta) {
  const index = currentViewerSourceIndex();
  if (index < 0) return;
  const nextIndex = index + delta;
  if (nextIndex < 0 || nextIndex >= uploadedFiles.length) return;
  const nextFile = uploadedFiles[nextIndex];
  const nextSource = previewFromSourceFile(nextFile);
  if (!nextSource) return;
  sourcePreview = nextSource;
  const paired = matchingProcessedForSource(nextFile);
  resultPreview = paired ? previewFromProcessedFile(paired) : null;
  const preferredSide = activeViewerSide === "result" && resultPreview ? "result" : "source";
  updateViewer(preferredSide);
}

function updateViewer(side = activeViewerSide) {
  const info = imageInfo(side);
  viewSourceBtn.disabled = !sourcePreview;
  viewResultBtn.disabled = !resultPreview;
  document.querySelector(".viewer-controls .segmented").classList.toggle("hidden", viewerSimpleMode);
  viewerDownloadBtn.classList.toggle("hidden", viewerSimpleMode);
  if (!info) {
    writeLog("素材查看", side === "source" ? "当前处理结果没有匹配到对应原素材。" : "当前原素材还没有对应处理结果。", "无配对素材");
    return false;
  }
  activeViewerSide = side;
  const mediaType = mediaTypeFor(info);
  const isVideo = mediaType === "video";
  viewerImage.classList.toggle("hidden", isVideo);
  viewerVideo.classList.toggle("hidden", !isVideo);
  if (isVideo) {
    if (viewerVideo.getAttribute("src") !== info.url) viewerVideo.src = info.url;
    viewerImage.removeAttribute("src");
  } else {
    viewerVideo.pause();
    viewerVideo.removeAttribute("src");
    viewerImage.src = info.url;
  }
  viewerImage.alt = mediaType === "video" ? "视频预览" : mediaType === "audio" ? "音频预览" : "图片预览";
  const sourceLabel = mediaType === "video" ? "原视频" : mediaType === "audio" ? "原音频" : "原图";
  const resultLabel = mediaType === "video" ? "处理后视频" : mediaType === "audio" ? "处理后音频" : "处理后";
  viewerTitle.textContent = activeViewerSide === "result" ? resultLabel : sourceLabel;
  viewSourceBtn.textContent = sourceLabel;
  viewResultBtn.textContent = resultLabel;
  viewerMeta.textContent = [info.name, previewInfo(info)].filter(Boolean).join(" · ");
  viewSourceBtn.classList.toggle("active", activeViewerSide === "source");
  viewResultBtn.classList.toggle("active", activeViewerSide === "result");
  viewerDownloadBtn.disabled = !info.url;
  updateViewerNavigation();
  return true;
}

function openViewer(side, options = {}) {
  viewerSimpleMode = Boolean(options.simple);
  if (!updateViewer(side)) return;
  imageViewer.classList.remove("hidden");
}

function closeViewer() {
  imageViewer.classList.add("hidden");
  viewerVideo.pause();
  viewerSimpleMode = false;
}

function downloadViewerImage() {
  const info = imageInfo(activeViewerSide);
  if (!info?.url) {
    writeLog("下载失败", "当前没有可下载的素材。", "等待结果");
    return;
  }
  const link = document.createElement("a");
  link.download = info.name || `MediaKit-${mediaTypeFor(info)}-${Date.now()}`;
  link.href = info.downloadUrl || info.url;
  link.click();
}
async function submit(endpoint) {
  const batchCount = uploadedFiles.length || (uploadedFile ? 1 : 0);
  if (endpoint === "/api/jobs") writeLog("任务已提交", `正在创建 ${batchCount > 1 ? `${batchCount} 个` : "本地"}模型任务，请稍候查看右侧任务队列。`, "提交中");
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload())
    });
    const data = await response.json();
    if (!response.ok) {
      writeLog("请求失败", data.error || "未知错误", "需要补充信息");
      return;
    }
    const args = data.plan?.args || data.args || [];
    const exe = data.plan?.exe || data.exe || "(engine missing)";
    const detail = data.jobs ? data.jobs.map((job) => `${job.status} · ${job.plan?.summary || "任务"}`).join("\n") : `${exe}\n${args.join(" ")}`;
    writeLog(data.summary || data.plan?.summary || "任务", detail, data.status || "planned");
    if (endpoint === "/api/jobs" && isAssetBoardMode()) {
      resultInfo.textContent = "处理中";
      resetResultCanvas("处理中");
      markResultPending();
    }
    refreshJobs();
  } catch (error) {
    writeLog("请求失败", error.message || "本地服务无响应", "接口异常");
  }
}

function canvasSizeFor(image, scale = 1) {
  const maxSide = 1800;
  const sourceH = image["natural" + "Height"];
  const ratio = Math.min(1, maxSide / Math.max(image.naturalWidth, sourceH));
  return {
    width: Math.max(1, Math.round(image.naturalWidth * ratio * scale)),
    height: Math.max(1, Math.round(sourceH * ratio * scale))
  };
}

function drawImageTo(canvas, image, scale = 1) {
  const size = canvasSizeFor(image, scale);
  canvas.width = size.width;
  canvas.height = size.height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.clearRect(0, 0, size.width, size.height);
  ctx.drawImage(image, 0, 0, size.width, size.height);
  return ctx;
}

function loadPreviewImage(file) {
  const image = new Image();
  const url = URL.createObjectURL(file);
  image.onload = () => {
    loadedImage = image;
    sourcePreview = { url, downloadUrl: url, name: file.name, width: image.naturalWidth, height: image["natural" + "Height"], size: file.size };
    resultPreview = null;
    drawImageTo(sourceCanvas, image, 1);
    sourceInfo.textContent = previewInfo(sourcePreview);
    resultInfo.textContent = "等待处理";
    resetResultCanvas("等待处理");
    writeLog("素材已载入", `${file.name}\n${image.naturalWidth} x ${image["natural" + "Height"]}`, "等待处理");
  };
  image.src = url;
}

function loadPreviewImageUrl(url, name, size) {
  const image = new Image();
  image.onload = () => {
    loadedImage = image;
    sourcePreview = { url, downloadUrl: url, name, width: image.naturalWidth, height: image["natural" + "Height"], size };
    resultPreview = null;
    drawImageTo(sourceCanvas, image, 1);
    sourceInfo.textContent = previewInfo(sourcePreview);
    resultInfo.textContent = "等待处理";
    resetResultCanvas("等待处理");
    writeLog("素材已载入", `${name}\n${image.naturalWidth} x ${image["natural" + "Height"]}`, "等待处理");
  };
  image.src = url;
}

function isImageOutput(output) {
  return /\.(png|jpe?g|webp|bmp|tiff?|gif|heic)$/i.test(String(output || ""));
}

function loadProcessedImage(output, label, size, sourcePath = "") {
  const image = new Image();
  const url = `/api/preview?path=${encodeURIComponent(output)}&t=${Date.now()}`;
  image.onload = () => {
    renderedOutputs.add(comparablePath(output));
    resultPreview = {
      id: output,
      path: output,
      sourcePath,
      url,
      previewUrl: url,
      downloadUrl: `/api/result?path=${encodeURIComponent(output)}`,
      name: output.split(/[\\/]/).pop() || label,
      width: image.naturalWidth,
      height: image["natural" + "Height"],
      size,
      status: "done"
    };
    drawImageTo(resultCanvas, image, 1);
    resultReady = true;
    resultInfo.textContent = previewInfo(resultPreview);
    const index = processedFiles.findIndex((file) => samePath(file.path, output) || samePath(file.sourcePath, sourcePath));
    if (index >= 0) processedFiles[index] = resultPreview;
    else processedFiles.push(resultPreview);
    renderResultImageList();
    if (!imageViewer.classList.contains("hidden")) updateViewer("result");
    writeLog("处理结果已生成", `${label}\n${image.naturalWidth} x ${image["natural" + "Height"]}`, "完成");
  };
  image.onerror = () => writeLog("结果预览失败", output, "可下载查看");
  image.src = url;
}


function loadProcessedVideo(output, label, size, sourcePath = "") {
  const video = document.createElement("video");
  const url = `/api/preview?path=${encodeURIComponent(output)}&t=${Date.now()}`;
  video.preload = "auto";
  video.onloadedmetadata = () => {
    renderedOutputs.add(comparablePath(output));
    resultPreview = {
      id: output,
      path: output,
      sourcePath,
      url,
      previewUrl: url,
      downloadUrl: `/api/result?path=${encodeURIComponent(output)}`,
      name: output.split(/[\\/]/).pop() || label,
      width: video.videoWidth,
      height: video.videoHeight,
      duration: video.duration,
      size,
      mediaType: "video",
      status: "done"
    };
    resultReady = true;
    resultInfo.textContent = previewInfo(resultPreview);
    const index = processedFiles.findIndex((file) => samePath(file.path, output) || samePath(file.sourcePath, sourcePath));
    if (index >= 0) processedFiles[index] = resultPreview;
    else processedFiles.push(resultPreview);
    renderResultImageList();
    if (!imageViewer.classList.contains("hidden")) updateViewer("result");
    writeLog("处理结果已生成", `${label}\n${video.videoWidth} x ${video.videoHeight}`, "完成");
  };
  video.onerror = () => writeLog("结果预览失败", output, "可下载查看");
  video.src = url;
}

function loadProcessedAudio(output, label, size, sourcePath = "") {
  const audio = document.createElement("audio");
  const url = `/api/audio-preview?path=${encodeURIComponent(output)}&t=${Date.now()}`;
  audio.preload = "metadata";
  audio.onloadedmetadata = () => {
    renderedOutputs.add(comparablePath(output));
    resultPreview = {
      id: output,
      path: output,
      sourcePath,
      url,
      previewUrl: url,
      downloadUrl: `/api/result?path=${encodeURIComponent(output)}`,
      name: output.split(/[\\/]/).pop() || label,
      duration: audio.duration,
      size,
      mediaType: "audio",
      status: "done"
    };
    resultInfo.textContent = previewInfo(resultPreview);
    const index = processedFiles.findIndex((file) => samePath(file.path, output) || samePath(file.sourcePath, sourcePath));
    if (index >= 0) processedFiles[index] = resultPreview;
    else processedFiles.push(resultPreview);
    renderResultImageList();
    writeLog("处理结果已生成", `${label}\n${formatDuration(audio.duration)}`, "完成");
  };
  audio.onerror = () => writeLog("结果预览失败", output, "可下载查看");
  audio.src = url;
}

function loadProcessedDocument(output, label, size, sourcePath = "") {
  const result = {
    id: output,
    path: output,
    sourcePath,
    downloadUrl: `/api/result?path=${encodeURIComponent(output)}`,
    name: output.split(/[\\/]/).pop() || label,
    size,
    mediaType: "document",
    status: "done"
  };
  renderedOutputs.add(comparablePath(output));
  const index = processedFiles.findIndex((file) => samePath(file.path, output) || samePath(file.sourcePath, sourcePath));
  if (index >= 0) processedFiles[index] = result;
  else processedFiles.push(result);
  renderResultImageList();
}

function loadProcessedAsset(output, label, size, sourcePath = "") {
  if (isVideoOutput(output)) loadProcessedVideo(output, label, size, sourcePath);
  else if (isAudioOutput(output)) loadProcessedAudio(output, label, size, sourcePath);
  else if (isPdfOutput(output)) loadProcessedDocument(output, label, size, sourcePath);
  else loadProcessedImage(output, label, size, sourcePath);
}
function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

function formatDuration(seconds) {
  if (!Number.isFinite(seconds)) return "读取中";
  const total = Math.round(seconds);
  const m = Math.floor(total / 60);
  const s = String(total % 60).padStart(2, "0");
  return `${m}:${s}`;
}

function renderMediaMeta(items) {
  mediaMeta.innerHTML = "";
  for (const [label, value] of items) {
    mediaMeta.append(el("div", { class: "meta-card" }, [
      el("span", { text: label }),
      el("strong", { text: value })
    ]));
  }
}

function loadMediaPreview(file) {
  mediaPreview.innerHTML = "";
  mediaMeta.innerHTML = "";
  const url = URL.createObjectURL(file);
  const common = [["文件", file.name], ["大小", formatBytes(file.size)], ["类型", file.type || "未知"]];

  if (file.type.startsWith("video/")) {
    const video = el("video", { controls: "", src: url });
    video.addEventListener("loadedmetadata", () => {
      renderMediaMeta([
        ...common,
        ["时长", formatDuration(video.duration)],
        ["分辨率", `${video.videoWidth} x ${video.videoHeight}`]
      ]);
    });
    mediaPreview.append(video);
    renderMediaMeta(common);
    return;
  }

  if (file.type.startsWith("audio/")) {
    const audio = el("audio", { controls: "", src: url });
    audio.addEventListener("loadedmetadata", () => {
      renderMediaMeta([...common, ["时长", formatDuration(audio.duration)]]);
    });
    mediaPreview.append(audio);
    renderMediaMeta(common);
    return;
  }

  mediaPreview.textContent = "当前文件类型暂不支持预览";
  renderMediaMeta(common);
}

function loadMediaPreviewUrl(info, typeHint) {
  mediaPreview.innerHTML = "";
  mediaMeta.innerHTML = "";
  const common = [["文件", info.name], ["大小", formatBytes(info.size)], ["来源", "本地导入"]];

  if (typeHint.startsWith("video")) {
    const video = el("video", { controls: "", src: info.previewUrl });
    video.addEventListener("loadedmetadata", () => {
      renderMediaMeta([...common, ["时长", formatDuration(video.duration)], ["分辨率", `${video.videoWidth} x ${video.videoHeight}`]]);
    });
    mediaPreview.append(video);
    renderMediaMeta(common);
    return;
  }

  if (typeHint.startsWith("audio")) {
    const src = info.path
      ? `/api/audio-preview?path=${encodeURIComponent(info.path)}&t=${Date.now()}`
      : info.previewUrl;
    const audio = el("audio", { controls: "", src });
    audio.addEventListener("loadedmetadata", () => {
      renderMediaMeta([...common, ["时长", formatDuration(audio.duration)]]);
    });
    mediaPreview.append(audio);
    renderMediaMeta(common);
  }
}

function clearCanvas(canvas) {
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  canvas.width = 300;
  canvas.height = 180;
}

function resetResultCanvas(status = "等待处理") {
  resultReady = false;
  resultCanvas.width = sourceCanvas.width || 300;
  resultCanvas.height = sourceCanvas.height || 180;
  const ctx = resultCanvas.getContext("2d");
  ctx.clearRect(0, 0, resultCanvas.width, resultCanvas.height);
  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(0, 0, resultCanvas.width, resultCanvas.height);
  ctx.strokeStyle = "#d8e2ef";
  ctx.setLineDash([8, 8]);
  ctx.strokeRect(8, 8, Math.max(1, resultCanvas.width - 16), Math.max(1, resultCanvas.height - 16));
  ctx.setLineDash([]);
  ctx.fillStyle = "#50647f";
  const fontSize = Math.max(48, Math.round(Math.min(resultCanvas.width, resultCanvas.height) * 0.08));
  ctx.font = `700 ${fontSize}px system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(status, resultCanvas.width / 2, resultCanvas.height / 2);
}

function clearSelection() {
  pickedFile = null;
  uploadedFile = null;
  pickedFiles = [];
  uploadedFiles = [];
  processedFiles = [];
  selectedImageIds.clear();
  loadedImage = null;
  sourcePreview = null;
  resultPreview = null;
  activeViewerSide = "source";
  resultReady = false;
  closeViewer();
  sourceInfo.textContent = "未选择";
  resultInfo.textContent = "等待处理";
  clearCanvas(sourceCanvas);
  clearCanvas(resultCanvas);
  mediaPreview.innerHTML = "";
  mediaMeta.innerHTML = "";
  renderImageList();
  renderResultImageList();
}

async function uploadFile(file) {
  const formData = new FormData();
  formData.append("file", file, file.name);
  const response = await fetch("/api/uploads", { method: "POST", body: formData });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "上传失败");
  return data;
}

async function selectFile(file, display) {
  if (isAssetBoardMode()) return selectFiles([file], display);

  pickedFile = file;
  pickedFiles = [file];
  uploadedFile = null;
  uploadedFiles = [];
  selectedImageIds.clear();
  syncOutputFormat(file.name);
  if (display) display.textContent = `${file.name}，正在导入...`;
  if (file.type.startsWith("image/")) loadPreviewImage(file);
  if (file.type.startsWith("video/") || file.type.startsWith("audio/")) loadMediaPreview(file);

  try {
    uploadedFile = await uploadFile(file);
    uploadedFile.displayName = uploadedFile.name;
    uploadedFiles = [uploadedFile];
    const size = Math.round(uploadedFile.size / 1024);
    if (display) display.textContent = `${uploadedFile.name} · ${size} KB`;
    writeLog("素材已导入", `${uploadedFile.name}\n${uploadedFile.path}`, "local copy ready");
    renderImageList();
    syncRunButton();
  } catch (error) {
    if (display) display.textContent = file.name;
    writeLog("导入失败", error.message, "upload failed");
  }
}

async function selectFiles(files, display) {
  if (!files.length) return;
  if (!isAssetBoardMode()) return selectFile(files[0], display);

  const previousCount = uploadedFiles.length;
  pickedFiles = isAssetBoardMode() ? [...pickedFiles, ...files] : files;
  pickedFile = files[0];
  selectedImageIds.clear();
  syncOutputFormat(files[0].name);
  setImagesDisplay(display, `${previousCount + files.length} 个文件，正在导入...`);
  if (files[0].type.startsWith("image/")) loadPreviewImage(files[0]);

  try {
    const added = [];
    for (const file of files) {
      const uploaded = await uploadFile(file);
      uploaded.displayName = uploaded.name;
      added.push(uploaded);
      uploadedFiles.push(uploaded);
    }
    uploadedFile = uploadedFiles[0] || null;
    setImagesDisplay(display);
    writeLog(added.length > 1 ? "批量素材已导入" : "素材已导入", added.map((file) => file.name).join("\n"), "local batch ready");
    renderImageList();
    syncRunButton();
  } catch (error) {
    setImagesDisplay(display);
    writeLog("批量导入失败", error.message, "upload failed");
  }
}

async function importNativePath(filePath) {
  const response = await fetch("/api/import-path", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ path: filePath })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "导入失败");
  return data;
}

async function selectNativeFile(display) {
  const paths = await window.keplerDesktop.chooseFiles(activeMode);
  if (!paths.length) return;
  selectedImageIds.clear();
  pickedFile = { name: paths[0].split(/[\\/]/).pop(), size: 0, type: "" };
  if (!isAssetBoardMode()) {
    uploadedFile = null;
    uploadedFiles = [];
    pickedFiles = [];
  }
  pickedFiles = [...pickedFiles, ...paths.map((item) => ({ name: item.split(/[\\/]/).pop(), size: 0, type: "" }))];
  syncOutputFormat(pickedFile.name);
  setImagesDisplay(display, paths.length > 1 ? `${uploadedFiles.length + paths.length} 个文件，正在导入...` : `${pickedFile.name}，正在导入...`);

  try {
    const added = [];
    for (const item of paths) {
      const uploaded = await importNativePath(item);
      uploaded.displayName = uploaded.name;
      added.push(uploaded);
      uploadedFiles.push(uploaded);
    }
    uploadedFile = uploadedFiles[0] || null;
    setImagesDisplay(display);
    writeLog(added.length > 1 ? "批量素材已导入" : "素材已导入", added.map((file) => `${file.name}\n${file.path}`).join("\n"), "native file ready");
    if (isImageMode()) loadPreviewImageUrl(uploadedFile.previewUrl, uploadedFile.name, uploadedFile.size);
    if (!isAssetBoardMode() && (activeMode.startsWith("video") || activeMode.startsWith("audio"))) loadMediaPreviewUrl(uploadedFile, activeMode);
    renderImageList();
    syncRunButton();
  } catch (error) {
    if (display) display.textContent = pickedFile.name;
    writeLog("导入失败", error.message, "native import failed");
  }
}

async function addImagesFromList() {
  const display = form.querySelector(".picked-file");
  if (window.keplerDesktop) {
    await selectNativeFile(display);
    return;
  }

  const input = el("input", {
    type: "file",
    accept: isCompressionMode()
      ? ".mp4,.mov,.mkv,.avi,.webm,.m4v,.wav,.mp3,.flac,.aac,.m4a,.ogg,.pdf,.png,.jpg,.jpeg,.webp,.bmp,.tif,.tiff,.gif,.heic"
      : isVideoBoardMode() ? "video/*" : isAudioBoardMode() ? "audio/*" : "image/*",
    multiple: ""
  });
  input.addEventListener("change", async () => {
    const files = [...(input.files || [])];
    if (files.length) await selectFiles(files, display);
  }, { once: true });
  input.click();
}

function render(savedValues = {}) {
  renderNav();
  renderForm(savedValues);
  renderImageList();
  renderResultImageList();
}

runBtn.addEventListener("click", () => submit("/api/jobs"));
document.querySelector("#clearLog").addEventListener("click", () => { log.innerHTML = ""; });
addImagesBtn.addEventListener("click", addImagesFromList);
clearImagesBtn.addEventListener("click", clearImages);
clearResultImagesBtn.addEventListener("click", clearResultImages);
deselectImagesBtn.addEventListener("click", () => {
  selectedImageIds.clear();
  renderImageList();
});
downloadImagesBtn.addEventListener("click", downloadSelectedImages);
renameImagesBtn.addEventListener("click", renameSelectedImages);
deleteImagesBtn.addEventListener("click", deleteSelectedImages);
imageList.addEventListener("pointerdown", startBoxSelection);
openSourceBtn.addEventListener("click", () => openViewer("source"));
openResultBtn.addEventListener("click", () => openViewer("result"));
viewSourceBtn.addEventListener("click", () => updateViewer("source"));
viewResultBtn.addEventListener("click", () => updateViewer("result"));
viewerDownloadBtn.addEventListener("click", downloadViewerImage);
viewerPrevBtn.addEventListener("click", () => navigateViewer(-1));
viewerNextBtn.addEventListener("click", () => navigateViewer(1));
viewerCloseBtn.addEventListener("click", closeViewer);
imageViewer.addEventListener("click", (event) => {
  if (event.target === imageViewer) closeViewer();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeViewer();
  if (imageViewer.classList.contains("hidden")) return;
  if (event.key === "ArrowLeft") navigateViewer(-1);
  if (event.key === "ArrowRight") navigateViewer(1);
});
imageList.addEventListener("dragover", (event) => {
  event.preventDefault();
  imageList.classList.add("dragging");
});
imageList.addEventListener("dragleave", () => imageList.classList.remove("dragging"));
imageList.addEventListener("drop", async (event) => {
  event.preventDefault();
  imageList.classList.remove("dragging");
  const files = filesForActiveMode(event.dataTransfer.files || []);
  if (!files.length) {
    writeLog("拖入失败", isAssetBoardMode() ? `请拖入支持的${assetKindName()}：${assetFormatsLabel()}。` : "当前模式只接收一个对应类型文件。", "文件类型不匹配");
    return;
  }
  const display = form.querySelector(".picked-file");
  await selectFiles(files, display);
});

render();
refreshEngines();
refreshJobs();
setInterval(refreshEngines, 8000);
setInterval(refreshJobs, 3000);

























































