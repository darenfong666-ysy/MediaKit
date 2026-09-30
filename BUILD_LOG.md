# kepler 从 0 到 1复刻记录

## 阶段 1：观察参考项目

实际执行：

- 打开公开仓库页面，读取 README、文件结构和功能说明。
- 拉取参考源码到隔离目录，只用于分析产品结构。
- 检查本地桌面快捷方式，发现快捷方式目标指向另一个用户目录，当前环境无法直接控制已安装界面。
- 检查本机 .NET 环境，确认只有运行时，没有 SDK，无法在当前机器直接编译 WinUI 项目。

推导结论：

- 这是一个 Windows 本地媒体处理工具，不是云端服务。
- 产品从 0 到 1 的合理路径是：先做图片增强单页，再把外部引擎抽象成统一任务执行器，然后逐步加入背景移除、视频管线、重复帧整理、音频处理和安全渲染。
- 作者与 AI 的沟通大概率是“按功能页分阶段迭代”的方式：先让 AI 生成页面和参数表，再让 AI 封装命令行引擎调用，遇到显卡、运行库、临时目录、长任务卡顿等真实问题后继续修补。
- 真正复杂的部分不在按钮，而在长任务队列、临时文件、显存/内存保护、外部引擎失败恢复、批量任务状态和用户可理解的中文提示。

## 阶段 2：确定合规重做路线

实际沟通：

- 我向 AI 明确新作者身份：新项目名为 `kepler`，不复制参考源码，不沿用参考项目的项目名、作者名、命名空间、临时文件前缀、安装脚本和品牌资源。
- 我要求 AI 只根据公开功能表现和工程常识重建一个独立工具壳。

AI 规划：

- 使用零依赖 Node 本地服务，降低当前环境对 .NET SDK 的依赖。
- 前端做成工具工作台：左侧功能导航、顶部执行按钮、中间参数表、右侧任务队列和引擎状态。
- 后端做成统一任务规划器：根据模式和参数生成命令；如果引擎存在则启动子进程；如果引擎缺失则只返回执行计划。
- 所有新文件只使用 `kepler` 命名，避免把参考项目痕迹带进交付目录。

## 阶段 3：实现工具壳

实际执行：

- 创建 `outputs/kepler`。
- 编写 `package.json`，提供 `npm start` 和语法检查命令。
- 编写 `server.js`，实现静态页面服务、引擎检测、任务计划、任务启动、任务停止和日志记录。
- 编写 `src/index.html`、`src/styles.css`、`src/app.js`，实现中文界面、功能切换、参数表单、引擎状态和任务日志。
- 编写 `README.md`，说明运行方式、引擎目录约定、模块范围和后续桌面封装路线。

## 阶段 4：AI 执行策略

AI 实际采用的执行拆分：

1. 产品骨架：先把页面区域稳定下来，确保每个模块都有清晰入口。
2. 参数模型：把每个功能页抽象成字段数组，避免重复写表单。
3. 引擎适配：为每类任务声明候选可执行文件路径。
4. 命令计划：输入路径、输出目录和参数合成任务计划。
5. 真实执行：引擎存在时启动子进程，不存在时返回可读计划。
6. 验证闭环：检查 Node 语法、扫描交付目录，确认没有参考项目品牌词残留。

## 当前边界

- 当前交付是可运行的独立工具壳，不附带模型和第三方引擎。
- 当前环境缺少 .NET SDK，因此没有生成 WinUI 桌面 exe。
- 浏览器拖拽文件时，部分浏览器不会暴露完整本地路径；生产桌面版应使用 Electron/Tauri/.NET 的原生文件选择器。

## 阶段 5：做一版可实测效果

用户追加要求：

- 先做一版可以直接实测效果的版本。

实际沟通：

- 我向 AI 重新约束目标：不要等模型包和大型引擎，先把最容易本地验证的图片处理链路做成真实可用。
- AI 判断当前机器没有系统 `ffmpeg`，视频和音频无法马上实测真实处理，因此优先实现图片实测。

AI 规划：

- 在图片放大和背景移除模块下增加实测区。
- 使用浏览器 Canvas 直接读取用户选择的图片。
- 图片放大使用高清重采样、轻量降噪和锐化。
- 背景移除使用角落背景色估算透明区域，适合纯色或接近纯色背景先验收交互与基础效果。
- 增加结果下载按钮，方便对比输出。

实际执行：

- 修改 `src/index.html`，增加原图/处理后双画布和图片选择按钮。
- 修改 `src/styles.css`，增加实测区、预览画布、下载按钮和移动端布局。
- 修改 `src/app.js`，增加图片载入、Canvas 处理、透明背景预览和 PNG 下载。

## 阶段 6：把路径输入改成选择文件

用户反馈：

- 不应该让用户手输路径，工具应该通过选择文件导入素材。

实际沟通：

- 我要求 AI 改掉路径输入思路：前端所有模块都使用文件选择器，浏览器选中文件后上传到本地后端工作区。
- AI 识别到浏览器不能把原始磁盘完整路径交给网页脚本，因此采用“本地上传副本”的方式让后端获得可执行路径。

AI 规划：

- 后端新增 `/api/uploads`，接收 multipart 文件并保存到 `uploads/`。
- 前端文件选择后立即导入本地工作区，并保存后端返回的 `uploadedPath`。
- 任务计划和开始处理优先使用 `uploadedPath`，用户不再填写素材路径。
- 去掉界面上的输出目录输入，默认输出到本地工作区。

实际执行：

- 修改 `server.js`，新增 multipart 解析、文件名清理、上传保存和计划输入切换。
- 修改 `src/app.js`，把所有素材字段改成文件选择，选择后自动上传。
- 修改 `src/index.html` 和 `src/styles.css`，去掉重复选择按钮，增加更清晰的文件选择控件。
- 使用一个测试 PNG 调用上传接口，再调用计划接口，确认后端已拿到本地副本路径并能生成图片处理计划。

## 阶段 7：补齐可预览队列体验

实际沟通：

- 我继续要求 AI 不停留在图片演示，而是让视频和音频模块也能在没有引擎时验证素材读取体验。

AI 规划：

- 视频选择后展示播放器、文件大小、类型、时长和分辨率。
- 音频选择后展示播放器、文件大小、类型和时长。
- 增加队列状态卡，真实引擎接入后可自动刷新运行状态。

实际执行：

- 修改 `src/index.html`，增加素材预览区和队列状态列表。
- 修改 `src/styles.css`，增加媒体预览、元信息卡和任务状态卡样式。
- 修改 `src/app.js`，增加视频/音频预览、元信息读取、任务列表轮询。
- 重新执行 `server.js` 和 `app.js` 语法检查，并扫描交付目录，未发现参考项目品牌词。

## 阶段 8：桌面化与 exe 打包

实际沟通：

- 我要求 AI 继续向桌面工具靠近，不停在浏览器网页阶段。
- AI 判断最快路径是 Electron：保留当前 Node 后端和 Web UI，加一个桌面主进程与原生文件选择器。

AI 规划：

- 安装 Electron 和 electron-builder。
- 新增桌面主进程，启动本地服务并打开独立窗口。
- 新增 preload 桥，让前端可以调用系统文件选择器。
- 后端增加本地路径导入接口，桌面选择文件后复制到本地工作区。
- 运行打包命令，输出 Windows portable exe。

实际执行：

- 使用项目内 npm 缓存安装 Electron 依赖，避免写入受限的用户缓存目录。
- 新增 `desktop-main.js` 和 `desktop-preload.cjs`。
- 修改 `package.json`，新增 `desktop`、`dist` 脚本和 electron-builder 配置。
- 修改 `server.js`，让上传、日志和引擎目录支持桌面可写数据目录。
- 新增 `/api/import-path`，支持桌面原生选择文件后导入。
- 第一次打包因 electron-builder 默认缓存写入用户目录失败；随后改用项目内 `.builder-cache` 重新打包成功。
- 生成 `dist/kepler-0.1.0-x64.exe`，并实际启动该 exe；进程列表确认 `kepler` 正在运行。

## 阶段 9：应用图标与交付清理

实际沟通：

- 我继续检查打包日志，发现 Windows 包仍提示默认 Electron 图标。
- AI 判断需要生成独立图标并让窗口与打包配置同时引用。

AI 规划：

- 生成 `assets/kepler.png` 和 `assets/kepler.ico`。
- 修改 Electron 窗口配置使用 PNG 图标。
- 修改 electron-builder Windows 配置使用 ICO 图标。
- 重新打包 portable exe。
- 删除打包器产生的调试文件，避免其中记录本机绝对路径。

实际执行：

- 使用本地绘图能力生成绿色底白色 K 的独立图标。
- 修改 `desktop-main.js` 和 `package.json`。
- 重跑打包，过程中旧 exe 被已启动进程短暂占用；停止旧进程后打包继续并成功。
- 新生成 `dist/kepler-0.1.0-x64.exe`，大小约 100 MB，更新时间为 2026-09-08 10:13。

## 阶段 10：内置基础 ffmpeg 能力

实际沟通：

- 我继续把工具从“能预览”推进到“能真实处理”，优先选择体积和接入成本较低的基础媒体能力。
- AI 判断视频基础转码、重复帧整理和音频增强都可以先由 ffmpeg 承担，AI 专用超分/补帧/抠图模型后续再接入。

AI 规划：

- 安装 `ffmpeg-static`，作为内置基础媒体引擎。
- 修改引擎解析逻辑，优先使用内置 ffmpeg，再搜索用户放入的 `engines/`。
- 修正 PATH 检测，避免把不存在的裸命令误报为可用。
- 用一个真实 WAV 文件跑音频增强任务，验证队列状态从 running 进入 done。
- 增加第三方许可说明。

实际执行：

- 安装 `ffmpeg-static`，无漏洞提示。
- 修改 `server.js`，导入内置 ffmpeg 路径。
- 修复 `ffprobe`、`demucs` 的误报问题。
- 启动新后端，确认引擎状态中 `ffmpeg` 为可用，其他未安装引擎为缺少。
- 生成 1 秒测试 WAV，导入后调用 `audio-enhance`，ffmpeg 子进程执行成功，队列返回 `done`。
- 新增 `THIRD_PARTY_NOTICES.txt`，记录内置 ffmpeg 和可选外部引擎说明。
- 重新打包 portable exe，确认打包产物中包含内置 ffmpeg。
- 实际启动最终 exe，请求其本地引擎接口，确认 packaged 版本中 `ffmpeg` 可用，并识别到系统 `ffprobe`。

## 下一阶段建议

## 阶段 11：对齐目标模型与真实 AI 引擎

用户追加要求：

- 模型应用需要和目标工具的模型保持一致。

实际沟通：

- 我要求 AI 回到参考行为层重新核对模型列表，而不是继续使用通用“照片/动漫/平衡”这种抽象选项。
- AI 重新整理出图片超分、视频超分、RIFE 补帧、抠图和音频模型入口，并把界面和服务端参数映射改成同一组模型名。

AI 规划：

1. 图片与视频超分使用 Real-ESRGAN / waifu2x 的同款模型名。
2. 视频补帧使用 RIFE 系列模型名。
3. 抠图入口保留 BiRefNet、IS-Net、U2-Net 系列模型名。
4. 下载官方 Windows 执行器和公开 ncnn 权重。
5. 视频任务改为拆帧、AI 处理帧、重新合成视频，不能把视频文件直接传给图片目录执行器。

实际执行：

- 新增 `scripts/prepare-engines.mjs`，下载并准备 waifu2x、Real-ESRGAN、RIFE。
- 修复 PowerShell 解压参数传递问题。
- 增加 Real-ESRGAN ncnn 权重下载，包括 `realesrgan-x4plus`、`realesrgan-x4plus-anime` 和 `realesr-animevideov3` 的 x2/x3/x4 权重。
- 修改 `src/app.js`，把图片、视频和抠图模型下拉项改成目标模型名。
- 修改 `server.js`，按模型名选择 waifu2x、Real-ESRGAN 或 RIFE 执行器。
- 视频超分和补帧改为三段式管线：ffmpeg 拆帧、AI 引擎处理帧、ffmpeg 合成结果。
- 安装并接入 `ffprobe-static`，用于读取视频原始帧率。
- 取消图片任务的 Canvas 短路，让顶部“开始处理”调用真实模型；Canvas 保留为实测区快速预览。

验证结果：

- `npm run prepare-engines` 已能幂等检查执行器和模型文件。
- 使用 Real-ESRGAN 对 kepler 图标执行 2x 图片超分，输出成功。
- 通过后端 `/api/jobs` 启动图片超分任务，队列状态进入 `done`。
- 生成极短 MP4 测试样本，通过后端启动视频超分任务，队列状态进入 `done`。
- 使用 RIFE v4.6 对测试样本执行 2x 补帧，队列状态进入 `done`。
- 修复 packaged 环境下 `ffmpeg-static` 和 `ffprobe-static` 指向 `app.asar` 的问题，自动改写到 `app.asar.unpacked`。
- 修复 packaged 环境下引擎查找路径，增加 `resources/engines` 搜索。
- 重新生成 `dist/win-unpacked`，并启动该桌面版读取 `/api/engines`，确认 ffmpeg、ffprobe、waifu2x、Real-ESRGAN、RIFE 都可用。
- 通过 `dist/win-unpacked` 桌面版 API 启动 Real-ESRGAN 图片超分，队列状态进入 `done`。
- 尝试重新生成单文件 portable，electron-builder 在当前机器的 portable 压缩阶段长时间停留在 0 字节临时包，因此本阶段以已验证的目录式桌面包作为可用交付。

## 阶段 12：用户素材自测与状态修正

用户追加要求：

- 测试目录中已有图片和视频，需要自行自检、发现问题并解决。
- 用户指出图片刚选择后界面就像显示处理完成，实际不合理。

实际沟通：

- 我要求 AI 不只做代码静态检查，而是用用户给的真实图片和视频走完整任务接口。
- AI 先定位界面状态问题：素材选择时右侧结果画布直接显示原图，并写入 ready 状态，导致“导入完成”和“模型处理完成”混在一起。
- AI 再检查真实模型链路，遇到模型文件命名误判后修复检测规则，并调整默认补帧模型到已随包可用的 RIFE v4.6。

AI 规划：

1. 导入素材只显示原图，结果区保持等待状态。
2. 顶部“开始处理”才创建真实模型任务。
3. 图片任务完成后自动把真实输出图加载到结果区。
4. 本地导入大文件改用文件复制，避免整段读入内存。
5. 对模型文件做提前检查，并让缺失模型给出清晰提示。
6. 用用户图片跑 Real-ESRGAN，用用户视频抽取短片跑视频超分和 RIFE 补帧，再用原视频跑 ffmpeg 类处理。

实际执行：

- 修改 `src/app.js`，图片导入后只绘制原图，结果区显示“等待处理”。
- 增加结果状态标记，没有真实预览或模型输出时不允许下载占位画布。
- 修改任务轮询逻辑，图片任务进入 `done` 后自动加载真实输出图。
- 修改 `src/index.html`，把实测区文字改成更清晰的导入、预览、模型处理状态。
- 修改 `server.js`，本地导入改为 `fs.copyFile`，降低视频导入内存压力。
- 增加视频、音频和 WebP 的 MIME 类型，方便预览与结果读取。
- 增加安全路径判断，替代简单字符串前缀判断。
- 增加模型存在性检查；修复 `realesr-animevideov3` 实际权重为 x2/x3/x4 文件名导致的误判。
- 将补帧默认模型从当前包缺少的版本切到 `rife-v4.6`，同时保留目标模型列表中的其他 RIFE 版本选项。

验证结果：

- 使用用户提供的 PNG 导入成功，文件大小约 1.7 MB。
- 使用用户提供的 MP4 导入成功，文件大小约 22.1 MB，原视频为 1080 x 1620、60fps、13.89 秒。
- Real-ESRGAN 图片 2x 超分任务进入 `running` 后约 10 秒完成，输出尺寸为 2026 x 3600。
- 从用户 MP4 抽取 1 秒短片，视频超分输出为 720 x 1080、60fps、1 秒。
- 同一短片 RIFE v4.6 2x 补帧输出为 360 x 540、120fps、1 秒。
- 原始 MP4 的视频去重任务完成，中文文件名、空格和括号路径正常。
- 原始 MP4 的音频增强任务完成，输出 WAV 正常。
- 对缺少的 `rife-v4.13` 做计划测试，接口返回明确的缺模型错误。
- 重新生成目录式桌面包后启动 `kepler.exe`，读取打包版 `/api/engines`，确认 ffmpeg、ffprobe、waifu2x、Real-ESRGAN、RIFE 均从打包资源路径可用。
- 在打包版 API 上再次导入用户 PNG 并执行 Real-ESRGAN 2x 图片超分，任务进入 `done`，输出尺寸为 2026 x 3600。
- `node --check server.js` 和 `node --check src/app.js` 均通过。

## 阶段 13：抠图与音轨分离内置化

用户追加要求：

- 模型准备要达到真正可用的程度，模型应用需要和目标工具保持一致。

实际沟通：

- 我让 AI 检查本机是否有 Python、pip、rembg、demucs，结果均不可用。
- AI 判断不能依赖用户外部 Python 环境，抠图改用 Node ONNX 运行时，音轨分离改用 JS/ONNX Demucs。
- AI 在真实执行中发现 RGBA PNG 输入会让抠图归一化报错，于是把推理输入改为 RGB，输出仍保持透明 PNG。

AI 规划：

1. 抠图模型按目标模型名准备：`birefnet-lite`、`birefnet`、`isnet-general-use`、`isnet-anime`、`u2net`、`u2netp`。
2. 服务端抠图从外部命令占位改成内置 `onnxruntime-node` 和 `sharp` 管线。
3. 音轨分离使用本地 HTDemucs ONNX 权重，先用 ffmpeg 转为 44.1kHz 双声道 WAV，再执行分离。
4. 两轨模式输出 `vocals.wav` 和 `accompaniment.wav`，四轨模式输出 `drums.wav`、`bass.wav`、`other.wav`、`vocals.wav`。
5. 队列 UI 支持一个任务显示多个下载结果。

实际执行：

- 安装 `@tugrul/rembg`，用于 Node 端背景移除。
- 修改 `scripts/prepare-engines.mjs`，下载 6 个抠图 ONNX 模型。
- 下载完成后确认模型文件存在，其中 `birefnet` 约 928 MB，`birefnet-lite` 约 214 MB。
- 修改 `server.js`，让 `rembg` 引擎状态根据 Node 运行时判断可用。
- 修改 `server.js`，新增 `cutout` 管线，按模型名加载本地 ONNX 文件执行推理。
- 修复 RGBA PNG 输入导致的通道错误，模型输入使用 RGB，输出使用 PNG alpha。
- 安装 JS/ONNX `demucs` 包，使用随包 HTDemucs 权重。
- 修改 `server.js`，新增 `audio-separate` 管线，先转 WAV，再分离并写出目标音轨文件。
- 修改 `src/app.js`，队列中支持多个结果文件下载。
- 更新 `THIRD_PARTY_NOTICES.txt`，记录抠图模型、Node ONNX 抠图运行时和 JS/ONNX Demucs。

验证结果：

- `/api/engines` 显示 ffmpeg、ffprobe、waifu2x、Real-ESRGAN、RIFE、rembg、demucs 均可用。
- 使用用户提供的 PNG 跑 `birefnet-lite` 抠图，任务进入 `done`，输出 PNG 为 1013 x 1800、4 通道并带 alpha。
- 使用用户提供的 MP4 跑两轨音频分离，任务进入 `done`，输出 `vocals.wav` 和 `accompaniment.wav`。
- 两个音轨输出均为 44.1kHz、双声道、13.885533 秒，与源视频音频时长一致。
- npm 审计发现 `sharp <0.35.0` 的 libvips 相关高危提示；通过 npm overrides 升级到 `sharp 0.35.4` 后，生产依赖审计为 0 vulnerabilities。
- 使用升级后的 `sharp` 复测 `u2netp` 抠图，任务进入 `done`。
- `node --check server.js` 和 `node --check src/app.js` 均通过。

## 下一阶段建议

1. 将 Demucs 长任务拆到独立 worker 进程，避免长音频推理期间队列刷新变慢。
2. 增加任务暂停、恢复、批量排序和完成后清理策略。
3. 加入 GPU/CPU 检测和安全渲染策略。

## 阶段 14：打包版真实可用性自检

用户继续要求：

- 使用 `C:\Users\99791\Desktop\新建文件夹\9` 里的图片和视频自行测试。
- 自己发现问题并解决问题，尤其确认“上传后立即显示处理完成”的问题已经修复。

实际沟通：

- AI 判断这次必须以打包后的桌面程序为准，而不是只测开发服务器。
- AI 先重新构建目录式 Windows 桌面包，再启动 `kepler.exe`，通过本地 API 做黑盒测试。
- AI 将验证标准定为：模型状态必须来自打包资源路径；任务必须先进入 `running`，模型执行结束后才能进入 `done`；输出文件必须用尺寸、帧率、采样率等可测数据证明。

实际执行：

- 重新运行 Electron Builder，生成新的 `dist/win-unpacked/kepler.exe`。
- 启动打包后的 `kepler.exe`，读取 `/api/engines`。
- 导入用户提供的 PNG，提交 Real-ESRGAN 2x 图片超分任务。
- 导入同一张 PNG，提交 `u2netp` 抠图任务。
- 导入用户提供的 MP4，提交 Demucs 两轨音频分离任务。
- 从用户 MP4 裁出 1 秒 360 x 540 测试片段，提交 RIFE v4.6 2x 补帧任务。

验证结果：

- 打包版 `/api/engines` 显示 ffmpeg、ffprobe、waifu2x、Real-ESRGAN、RIFE、rembg、demucs 均为 available。
- 图片超分任务先返回 `running`，完成后返回 `done`；原图 1013 x 1800，输出 2026 x 3600，文件大小约 6.15 MB。
- 抠图任务先返回 `running`，完成后返回 `done`；输出为 1013 x 1800、4 通道、带 alpha 的 PNG。
- 音轨分离任务先返回 `running`，完成后返回 `done`；输出 `vocals.wav` 和 `accompaniment.wav`。
- 两个音轨输出均为 44.1kHz、双声道、13.885533 秒。
- RIFE 补帧任务先返回 `running`，完成后返回 `done`；输入 60fps、60 帧，输出 120fps、120 帧。
- 再次运行 `node --check server.js`、`node --check src/app.js` 和生产依赖审计，结果均通过。

## 阶段 15：图片放大点击后无明显反馈修复

用户反馈：

- 图片放大点击“开始处理”之后好像没反应。

实际排查：

- AI 读取应用工作区日志，发现点击后后端实际已经启动 Real-ESRGAN，并生成了输出文件。
- 日志显示源 PNG 带 alpha，用户选择 JPG 输出时，Real-ESRGAN 会把真实输出改写为 `*.jpg.png`。
- 原任务计划仍指向 `*.jpg`，导致前端结果预览和下载找不到真实输出，看起来像没有反应。
- 同时发现前端提交任务缺少异常捕获，接口异常时也会表现得不够明确。

实际执行：

- 修改 `server.js`，任务成功退出后检查计划输出是否存在。
- 如果计划输出不存在，自动探测模型实际生成的候选文件，例如 `*.jpg.png`，并把任务结果路径改为真实文件。
- 修改 `src/app.js`，点击“开始处理”后立即写入“任务已提交”日志。
- 修改 `src/app.js`，给任务提交增加异常捕获，接口错误会显示在日志区。
- 重新打包目录式 Windows 桌面版。

验证结果：

- 用用户 PNG 复现 JPG 输出场景，任务先进入 `running`，完成后进入 `done`。
- 计划输出从 `*_up2x.jpg` 自动修正为真实存在的 `*_up2x.jpg.png`。
- 打包版复测同一场景通过，预览接口返回 200。
- 输出图片尺寸为 2026 x 3600，文件大小约 6.15 MB。

## 阶段 16：图片放大对比查看器

用户新增要求：

- 图片放大后，希望可以点开原图和处理后的图，并在两张图之间切换对比放大效果。

AI 规划：

1. 保留现有实测区布局，让原图和处理后两个预览框可点击。
2. 新增一个图片查看弹窗，用同一个大图区域展示当前图片。
3. 弹窗顶部使用“原图 / 处理后”切换按钮，方便在同一视野里对比。
4. 原图加载后记录真实预览地址和尺寸；模型输出完成后记录真实结果地址和尺寸。
5. 如果处理结果尚未生成，仍可打开原图；结果生成后切换按钮立即可用。

实际执行：

- 修改 `src/index.html`，将原图和处理后 canvas 包装为可点击按钮。
- 新增 `imageViewer` 弹窗结构，包含标题、尺寸信息、切换按钮和大图区域。
- 修改 `src/styles.css`，增加可点击预览框、弹窗、分段切换按钮和大图舞台样式。
- 修改 `src/app.js`，维护 `sourcePreview` 与 `resultPreview` 状态。
- 修改 `src/app.js`，支持点击预览框打开查看器、切换原图/处理后、点击遮罩或按 Esc 关闭。
- 浏览器预览和模型真实输出都会写入处理后图片状态，方便同一套对比逻辑使用。
- 重新打包目录式 Windows 桌面版。

验证结果：

- `node --check src/app.js` 和 `node --check server.js` 均通过。
- 新打包的 `kepler.exe` 启动后 `/api/engines` 正常返回，所有模型状态保持可用。

## 阶段 17：小截图放大伪影修复

用户反馈：

- 图片放大后像被裁成一小块，并且有明显拼贴痕迹。

实际排查：

- AI 读取用户本机应用工作区中的原图和结果图，确认原图为 232 x 183，模型结果为 464 x 366，文件尺寸本身没有被裁短。
- 直接检查结果图发现，异常来自 Real-ESRGAN 对小尺寸截图、文字和 UI 海报类素材的重绘伪影。
- 这类素材不适合默认用照片/插画超分模型直接推理，因为模型会把文字、线条和纹理当成可生成细节，导致局部放大、拼贴块和伪文字。

AI 规划：

1. 保留 Real-ESRGAN 和 waifu2x，继续用于照片、插画、动漫类素材。
2. 为截图、文字图、广告小图新增一条不重绘的安全放大路线。
3. 将图片放大的默认模型切到安全路线，避免普通用户一上来得到破坏性结果。
4. 调整预览 canvas，使其按图片真实比例显示，减少界面层面的裁切错觉。

实际执行：

- 修改 `src/app.js`，在图片放大的模型选项首位新增“截图文字安全放大”，并作为默认选项。
- 修改 `server.js`，新增 `sharp-upscale` 管线。
- `sharp-upscale` 使用 Lanczos3 重采样、轻量中值降噪和轻锐化，不做 AI 重绘。
- JPG 输出会先铺白底，PNG 输出保留 PNG 格式。
- 修改 `src/styles.css`，取消预览 canvas 固定 4:3 显示，改为按真实图片比例显示。
- 重新打包目录式 Windows 桌面版。

验证结果：

- 用用户反馈中对应的小截图复测，安全放大输出为 464 x 366，完整保留全图。
- 新输出没有 Real-ESRGAN 结果中的大块拼贴和局部重绘痕迹。
- 打包版 `kepler.exe` 复测同一素材，任务进入 `done`，输出为 464 x 366 PNG。
- `node --check server.js` 和 `node --check src/app.js` 均通过。

## 阶段 18：Real-ESRGAN 人物图分块错位修复

用户纠正：

- 不是只有小截图会出问题，正常人物图放大后也明显错误，画面出现大块错位和拼贴。

实际排查：

- AI 检查用户本机应用工作区里的人物原图和结果图，原图为 1080 x 1920，错误输出为 2160 x 3840，说明尺寸正确但像素块拼接错误。
- 读取 Real-ESRGAN 日志，确认任务调用的是 `realesrgan-x4plus`，并直接以 `-s 2` 输出。
- 对同一人物图做多组对照：
  - 强制单 GPU 与去 alpha 后，直接 `-s 2` 仍然出现错块。
  - 固定 tile size 后，直接 `-s 2` 仍然出现错块。
  - 使用 x4plus 模型按原生 `-s 4` 输出，再由本地图像库下采样到 2x，画面正常。
- 结论：问题不是素材类型，也不是前端显示；是 x4plus/x4plus-anime 这类原生 4x 模型直接用 2x/3x 输出时，在当前 ncnn/Vulkan 调用链上会产生分块拼接错误。

实际执行：

- 修改 `server.js`，图片放大中的 Real-ESRGAN 照片模型改为专用 `image-upscale-photo` 管线。
- 对 `realesrgan-x4plus` 和 `realesrgan-x4plus-anime`，内部固定用原生 4x 推理。
- 如果用户选择 1x、2x 或 3x，推理完成后再使用 Lanczos3 下采样到目标倍率。
- 输入图片先转为 RGB，避免 alpha 通道参与模型推理带来额外不确定性。
- waifu2x 和安全放大路线不受影响。
- 重新打包目录式 Windows 桌面版。

验证结果：

- 用用户人物图复测 `realesrgan-x4plus` 2x，输出为 2160 x 3840，预览无分块错位。
- 打包版 `kepler.exe` 复测同一人物图，任务进入 `done`，输出仍为 2160 x 3840，预览正常。
- `node --check server.js` 和 `node --check src/app.js` 均通过。

## 阶段 19：图片放大界面细节调整

用户新增要求：

- “处理中”文字太小，需要改大。
- 输出格式默认跟随待放大图片的原始格式。
- 去掉“截图文字安全放大”这个模型功能。
- 图片预览框内增加图片大小信息。

实际执行：

- 修改 `src/app.js`，移除图片放大模型列表中的“截图文字安全放大”选项。
- 修改 `server.js`，移除该功能的计划入口和旧执行分支。
- 图片放大输出格式增加 `WEBP` 选项。
- 选择图片后按文件后缀自动设置输出格式：PNG 默认 PNG，JPG/JPEG 默认 JPG，WEBP 默认 WEBP。
- 修改预览区标题，原图和处理后均显示尺寸与文件大小。
- 服务端任务完成后记录输出文件大小，前端读取任务状态时显示到处理后预览框。
- 将“处理中”占位文字改为按画布尺寸动态放大，避免大图预览时文字过小。
- 重新打包目录式 Windows 桌面版。

验证结果：

- `node --check server.js` 和 `node --check src/app.js` 均通过。
- API 计划测试确认 WEBP 输入/选择会生成 `.webp` 输出路径。
- 打包版 `kepler.exe` 启动后 `/api/engines` 正常返回，模型状态保持可用。

## 阶段 20：图片查看器显示文件大小

用户新增要求：

- 点开图片后的大图查看界面也要显示图片大小。

实际执行：

- 修改 `src/app.js`，图片查看器顶部信息改为复用预览框的图片信息。
- 原图和处理后大图查看器都会显示：图片名称、宽高、文件大小。
- 重新打包目录式 Windows 桌面版；原 `dist/win-unpacked` 曾被 Windows 占用，先构建到并行目录，再覆盖回原路径。

验证结果：

- `node --check src/app.js` 和 `node --check server.js` 均通过。
- 原路径 `dist/win-unpacked/kepler.exe` 启动后 `/api/engines` 正常返回。

## 阶段 21：移除调试型按钮

用户新增要求：

- “浏览器预览”按钮如果没用就去掉。
- “生成计划”按钮如果没用就去掉。

实际执行：

- 移除顶部“生成计划”按钮，正常流程只保留“开始处理”。
- 移除图片实测区“浏览器预览”按钮，避免和真实模型结果混淆。
- 删除前端对应的本地 Canvas 临时预览函数和事件绑定。
- 重新打包目录式 Windows 桌面版。

验证结果：

- 扫描确认 `生成计划`、`浏览器预览`、`planBtn`、`processImageBtn` 等引用已移除。
- `node --check src/app.js` 和 `node --check server.js` 均通过。
- 打包版 `kepler.exe` 启动后 `/api/engines` 正常返回。

## 阶段 22：下载入口整理

用户新增要求：

- 下载结果不要放到左侧实测区，只放右侧任务队列。
- 点开图片后的大图查看器也需要下载按钮。

实际执行：

- 移除左侧实测区的“下载结果”按钮及其 Canvas 下载逻辑。
- 右侧任务队列继续保留每个完成任务的下载入口，并将下载入口样式调整为按钮形态。
- 图片查看器顶部新增“下载”按钮。
- 图片查看器下载会根据当前查看对象下载原图或处理后图片；处理后图片使用真实结果文件接口。
- 重新打包目录式 Windows 桌面版。

验证结果：

- 扫描确认左侧下载按钮相关引用已移除。
- `node --check src/app.js` 和 `node --check server.js` 均通过。
- 打包版 `kepler.exe` 启动后 `/api/engines` 正常返回。

## 阶段 23：修复抠图结果不透明

用户反馈：

- 使用 BiRefNet 抠图后，处理后的图片仍然像原图，没有真正去掉背景。

实际执行：

- 先读取最近一次抠图输出的 PNG alpha 通道，确认输出虽然任务显示完成，但 alpha 最小值和最大值都为 255，整张图完全不透明。
- 检查本地 `@tugrul/rembg` 包装逻辑后，改为在 `server.js` 中直接调用本地 ONNX 模型，手动完成：读取图片、按模型输入尺寸预处理、执行 BiRefNet、生成 mask、按前景/背景阈值转换为 alpha、再写出透明 PNG。
- 发现 BiRefNet 输出是 logits，不能用整图 min/max 拉伸；改为 sigmoid 转 alpha，使界面中的前景阈值 240、背景阈值 10 真正参与抠图。
- 发现 `sharp().removeAlpha().joinChannel()` 会写成普通 RGB PNG，导致透明通道丢失；改为 `ensureAlpha().toColourspace("rgb").joinChannel(...)`，确保输出文件 `hasAlpha=true`。
- 顺带修复导入素材文件名过长时，Windows 输出路径过长导致任务失败的问题：保存上传文件时截短主体名并保留扩展名。

验证结果：

- 用真实 API 流程导入测试图并提交 BiRefNet 任务，任务状态为 `done`。
- 输出 PNG 元数据为 4 通道，`hasAlpha=true`。
- alpha 分布验证：最小 0，最大 255，透明像素 3,057,571，半透明像素 35,311，完全前景像素 1,134,190。
- `node --check server.js` 和 `node --check src/app.js` 均通过。
- 重新打包 `dist/win-unpacked/kepler.exe` 后，用打包版服务再次提交 BiRefNet 抠图任务，alpha 分布与源码服务一致。

## 阶段 24：模型说明与图片批量任务

用户新增要求：

- `Real-ESR AnimeVideo v3` 在图片放大里继续保留。
- 模型选择时增加简单说明，辅助选择。
- 图片放大支持批量处理。
- AI 抠图支持批量处理。

实际执行：

- 图片放大、视频超分和 AI 抠图的模型下拉文本改为“适用场景 · 模型名（体积 · 速度/倾向）”。
- 图片放大继续保留 `Real-ESR AnimeVideo v3`，并标注为动漫/插画快速路线。
- 桌面文件选择器在图片放大和 AI 抠图模式下支持多选。
- 前端导入逻辑从单文件扩展为多文件数组；单选时保持原来的预览和实测区行为，多选时预览第一张。
- 服务端 `/api/jobs` 支持 `uploadedPaths` 批量字段；图片放大和 AI 抠图会拆成多个独立任务，右侧队列逐个显示、逐个下载。

验证结果：

- `node --check server.js`、`node --check src/app.js`、`node --check desktop-main.js` 均通过。
- 用临时服务提交 2 张图的批量 AI 抠图任务，服务端返回 `batch-submitted`，拆分出 2 个独立任务。
- 两个批量抠图子任务均完成，输出文件均生成并记录大小。
- 重新打包 `dist/win-unpacked/kepler.exe` 后，用打包版服务再次提交 2 张图批量抠图，返回 `batch-submitted` 且 2 个子任务均完成。

## 阶段 25：启动冲突与历史结果误预览修复

用户反馈：

- 再次打开 exe 时出现 `listen EADDRINUSE 127.0.0.1:4879` 的 JavaScript 主进程错误。
- 刚进入图片放大页面、还没有选择素材，处理后区域却显示了上一轮抠图结果。

实际执行：

- 在 Electron 主进程中加入单实例锁；如果已有 kepler 正在运行，第二次打开会聚焦已有窗口，不再启动第二个本地服务抢占 4879 端口。
- 修改任务刷新逻辑：右侧任务队列仍显示历史任务和下载入口，但实测区只会预览当前已选择素材对应的输出。
- 刚打开软件且未选择图片时，原图保持“未选择”，处理后保持“等待处理”，不会自动加载历史输出。

验证结果：

- `node --check desktop-main.js`、`node --check src/app.js`、`node --check server.js` 均通过。

## 阶段 26：强化单实例启动保护

用户继续反馈：

- 重复打开 exe 仍然会出现 `listen EADDRINUSE 127.0.0.1:4879` 弹窗。

实际执行：

- 将 Electron 主进程的单实例逻辑改为硬退出：拿不到单实例锁时立即 `app.exit(0)`。
- 将 `second-instance`、文件选择 IPC、`whenReady` 启动服务等逻辑整体包进单实例锁分支，避免第二个进程继续注册启动流程。
- 给本地 HTTP 服务增加 `EADDRINUSE` 错误处理；即使端口被占用，也不会变成未捕获异常弹窗。

验证结果：

- `node --check desktop-main.js` 和 `node --check server.js` 均通过。

## 阶段 27：校准模型辅助说明

用户反馈：

- 模型后面的辅助介绍必须和真实模型对应，不能只是写着好看。

实际执行：

- 检查本地模型文件名和体积：`birefnet-lite.onnx` 约 224MB，`birefnet.onnx` 约 973MB，`u2netp.onnx` 约 4.6MB；Real-ESRGAN 和 waifu2x 模型也按本地模型目录确认大小层级。
- 修正抠图模型说明：`BiRefNet Lite` 改为“均衡推荐 · 较快”，`BiRefNet 完整版` 改为“复杂背景 · 较慢”，避免把 Lite 错写成高精度。
- 图片放大和视频超分模型说明改为保守表述：用途方向 + 模型名 + 小/中/大模型和速度倾向，不再写容易被误解的精确 MB。

验证结果：

- `node --check src/app.js` 通过。

## 阶段 43：图片放大区合并原图列表与处理后列表

用户判断：

- 现有“图片放大”区域和右侧“图片列表”职责重复。
- “图片放大”中的原图部分本质就是图片列表；处理完成后应形成处理后的图片列表。

实际执行：

- 移除右侧独立图片列表面板。
- 将“图片放大”区域改成左右两列：左侧“原图列表”，右侧“处理后列表”。
- 原图列表沿用原来的添加、拖入、选择、批量下载、批量改名、删除、清空能力。
- 新增处理后列表，模型任务完成后自动把输出图片加入右侧列表。
- 处理后列表支持点击查看；清空处理后列表不会影响原图列表。
- 保留隐藏 canvas 作为内部预览缓存，避免重写底层图片处理与结果预览逻辑。

验证结果：

- `node --check src/app.js` 通过。

## 阶段 42：图片列表纯查看、批量下载和素材区简化

用户反馈：

- 从图片列表打开图片查看时，不需要原图/处理后切换和下载等多余按钮，只是查看图片。
- 图片列表选中图片后需要支持批量下载。
- 选择文件按钮下方的文件状态和提示区域需要去掉。

实际执行：

- 为图片查看器增加纯查看模式：从图片列表打开时隐藏“原图/处理后”和“下载”，只保留关闭。
- 实验区原图/处理后打开仍保留原来的对比和下载能力。
- 图片列表选中工具栏新增“批量下载”，按选中图片逐个触发下载。
- 图片放大和 AI 抠图的素材文件区域不再显示选择文件下方的文件状态条和说明提示。

验证结果：

- `node --check src/app.js` 通过。

## 阶段 41：图片列表查看和元信息增强

用户反馈：

- 图片列表中希望双击或选中后再点一次即可打开图片查看。
- 批量改名弹窗中不需要显示“例如 A”。
- 每张图名称后面需要显示分辨率、尺寸比例和图片大小。

实际执行：

- 将图片卡片点击逻辑调整为：第一次普通点击选中；已选中状态下再次普通点击打开图片查看。
- 保留 Ctrl/Shift 等多选点击逻辑，不触发查看。
- 图片列表卡片异步读取预览图真实宽高，并显示 `宽 x 高 · 比例 · 大小`。
- 查看器顶部信息也同步显示分辨率、比例和文件大小。
- 移除批量改名输入框中的示例占位文字。

验证结果：

- `node --check src/app.js` 通过。

## 阶段 40：图片追加导入和批量改名弹窗修复

用户反馈：

- 图片列表里已有图片后，无法继续添加图片。
- 点击批量改名没有反应，需要弹出命名框，并按此前规则批量命名。

实际执行：

- 图片模式下，顶部选择文件、图片列表右上角“添加图片”和拖入文件均改为追加到现有图片列表。
- 修复外部文件拖到已有缩略图上时只触发排序、不触发导入的问题。
- 视频和音频模式继续保持单素材替换逻辑。
- 将批量改名从浏览器原生 `prompt` 改为应用内弹窗。
- 批量改名规则保持为：输入 `A` 后依次为 `A`、`A1`、`A2`；输入 `1` 后依次为 `1`、`11`、`12`。

验证结果：

- `node --check src/app.js` 通过。

## 阶段 39：图片列表比例和选中工具栏调整

用户反馈：

- 图片列表在整体 UI 中占比需要更大。
- 选中图片后，取消选择、批量改名、删除选中需要和计数、清空处在同一行。
- 清空只保留一个按钮。

实际执行：

- 将主内容区右侧图片列表列宽从窄固定列调整为更宽的响应式列。
- 提高图片列表面板和列表区域的最小高度，让图片列表在当前画面中占比更大。
- 将选中工具栏合并到图片列表标题右侧，按“共 n 张 · 已选 x / 取消选择 / 批量改名 / 删除选中 / 清空”的顺序横排。
- 删除第二个清空按钮及其 JS 绑定，保留右上角唯一清空入口。
- 增加中等窗口断点，宽度不足时左右区域自动上下排列。

验证结果：

- `node --check src/app.js` 通过。

## 阶段 38：图片列表空态文字组居中修复

用户反馈：

- 图片列表未添加图片时，空态文字仍然偏在面板左上方，没有在版面中居中。

实际执行：

- 检查后确认空态容器虽然已经改成单列网格，但内部多行文案仍按默认行组从顶部排布。
- 将空态文案容器改为 `align-content: center` 和 `justify-items: center`，让图标、主文案、辅助文案和格式提示作为一组在图片列表面板内水平、垂直居中。

验证结果：

- `node --check src/app.js` 通过。

## 阶段 28：复核图片放大模型说明

用户新增要求：

- 单独检查图片放大模型的辅助说明是否和模型真实用途对应，不准确就修正。

实际执行：

- 阅读本地 `engines/realesrgan/README.md` 和 `engines/waifu2x/README.md`，对照 Real-ESRGAN 与 waifu2x 的模型名称、默认模型、用途描述和本地模型目录。
- 保留 `Real-ESR AnimeVideo v3` 为动漫/插画快速路线；该模型是 Real-ESRGAN ncnn 的可选模型，也可处理单张图片。
- 保留 `Real-ESRGAN x4plus` 为通用/照片路线，`x4plus-anime` 为动漫/插画路线。
- 将 `waifu2x cunet` 从“插画/线稿降噪”改为“二次元/插画 · 降噪放大”，避免把默认 waifu2x 模型误限定成线稿模型。
- `waifu2x upconv_7 anime` 和 `waifu2x upconv_7 photo` 的说明保持与模型目录名一致。

验证结果：

- `node --check src/app.js` 通过。

## 阶段 29：修复点击 exe 无明显响应

用户反馈：

- 点击 `kepler.exe` 后看起来没有反应。

实际执行：

- 检查发现后台已有多个 `kepler` 进程，4879 服务实际在响应，但主窗口没有被正常拉到前台。
- 这类情况会让新的启动请求被单实例逻辑转给隐藏主实例，用户侧看起来像“没反应”。
- 修改 Electron 窗口唤醒逻辑：创建窗口和第二次启动时都执行 `show`、`restore`、`center`、`focus`，并短暂置顶再取消置顶，确保窗口能被拉到前台。

验证结果：

- 清理旧进程后重新打包。
- 正常启动打包版 `kepler.exe`，检测到主窗口句柄，窗口标题为 `kepler`。
- `/api/engines` 正常返回，说明本地服务可用。

## 阶段 30：模型名称前置

用户新增要求：

- 下拉选项里模型名称必须放在最前面，辅助说明放在后面。

实际执行：

- 调整图片放大、AI 抠图、视频超分的模型下拉文案。
- 格式统一为：`模型名称（用途 · 速度/体积提示）`。
- 原有模型用途说明保留，但不再把“动漫/照片/通用”放在模型名前面。

验证结果：

- `node --check src/app.js` 通过。

## 阶段 31：抠图模型名称改为原始标识

用户新增要求：

- 抠图模型名称以模型原有名称为准。

实际执行：

- 根据本地模型文件和服务端调用参数，将抠图下拉首位名称改为原始模型标识：`birefnet-lite`、`birefnet`、`isnet-general-use`、`isnet-anime`、`u2net`、`u2netp`。
- 中文/英文展示名只作为括号内辅助说明，不再替代原始模型名。

验证结果：

- `node --check src/app.js` 通过。

## 阶段 32：按指定名称简化抠图模型显示

用户新增要求：

- 抠图模型名称按指定显示：`BiRefNet Lite`、`BiRefNet`、`ISNet-general-use`、`ISNet-anime`、`U²-Net`、`U²-Netp`。
- 名称不需要在括号里重复。

实际执行：

- 调整 AI 抠图模型下拉文案，模型名放最前面。
- 括号内只保留用途/速度提示，例如“均衡较快”“大模型较慢”“通用”“动漫/插画”。

验证结果：

- `node --check src/app.js` 通过。

## 阶段 33：完成批量图片放大、批量抠图和多图拖入

用户新增要求：

- 真正完成批量图片放大功能。
- 真正完成批量图片抠图功能。
- 增加可拖入图片的地方，支持多张图片拖入，不必只能点击选择文件。

实际执行：

- 将右侧“添加素材”拖拽区改为支持多张图片拖入。
- 图片放大和 AI 抠图模式下，拖入多张图片会批量导入；视频/音频模式仍保持单文件。
- 拖拽区增加高亮状态，拖入时有视觉反馈。
- 前端拖拽逻辑从只读取第一张 `files[0]` 改为读取完整文件列表，并按当前模式过滤图片类型。
- 选择文件和拖拽文件统一使用同一套多文件导入逻辑。
- 服务端已有的 `uploadedPaths` 批量分发继续作为批量执行入口：一次提交会拆成多个独立任务，右侧任务队列逐个显示、逐个下载。

验证结果：

- `node --check src/app.js`、`node --check server.js`、`node --check desktop-main.js` 均通过。
- 使用临时服务提交 2 张测试图的批量图片放大任务，返回 `batch-submitted`，2 个子任务均完成并生成输出。
- 使用临时服务提交 2 张测试图的批量 AI 抠图任务，返回 `batch-submitted`，2 个子任务均完成并生成输出。

## 阶段 34：图片列表与批量管理面板

用户新增要求：

- “实测区”改为“图片放大”。
- 任务队列移动到图片放大区域下方。
- 原任务队列区域改成图片列表，并作为多图拖入区域。
- 图片列表显示总张数，可清空。
- 支持点击选择、拖拽框选多张、取消选择、批量改名、删除选中、清空。
- 图片列表中的图片支持拖动调整顺序。

实际执行：

- 调整 `src/index.html` 布局：左侧表单与图片预览下方显示任务队列；右侧改为图片列表面板。
- 图片列表顶部显示 `共 n 张`，选中时显示 `共 n 张 · 已选 x`。
- 增加图片列表工具栏：取消选择、批量改名、删除选中、清空。
- 批量改名规则按用户要求实现：输入 `A` 时生成 `A`、`A1`、`A2`；输入 `1` 时生成 `1`、`11`、`12`。
- 图片列表条目可拖动排序，排序后的 `uploadedFiles` 顺序会影响批量提交顺序。
- 右侧拖入区域支持多张图片，拖入时高亮反馈。

验证结果：

- `node --check src/app.js`、`node --check server.js`、`node --check desktop-main.js` 均通过。
- 临时服务 `/api/engines` 正常返回，服务端保持可用。

## 阶段 35：图片列表空态调整

用户新增要求：

- 图片列表未添加图片时显示大面积拖入空态。
- 空列表时不显示 `共 n 张` 和 `清空`。

实际执行：

- 图片列表右上角计数与清空按钮在空列表时自动隐藏。
- 空列表区域改为深色大拖入面板，显示“拖入图片到此处(支持多张)”“鼠标拖拽可框选多张”和格式提示。
- 拖入图片的类型过滤扩展为 PNG/JPG/JPEG/BMP/TIF/TIFF/GIF/WebP/HEIC。

验证结果：

- `node --check src/app.js` 通过。

## 阶段 36：恢复图片列表空态颜色

用户修正要求：

- 不要改变图片列表区域颜色，只需要把空态文字标注放进去并居中显示。

实际执行：

- 保留空态说明文字和居中布局。
- 将空态背景、边框和文字颜色恢复为工具原本的浅色面板风格。

验证结果：

- `node --check src/app.js` 通过。

## 阶段 37：移除重复添加素材框

用户反馈：

- 图片列表空态里已经有拖入提示，不需要上方再出现“添加素材”框。

实际执行：

- 删除右侧图片列表上方独立的“添加素材”拖入框。
- 将拖入事件绑定到图片列表面板本身。
- 保留原本浅色风格，空态说明居中显示在图片列表面板内。

验证结果：

- `node --check src/app.js` 通过。

## 阶段 44：图片放大输出格式与处理后列表空态调整

用户反馈：

- 图片放大的输出格式只需要 JPG、PNG、原格式。
- 选择“原格式”时，原图是什么格式，输出就是什么格式。
- 处理后列表空态中不需要图标和说明文案。
- 处理后列表的格式提示要和原图列表支持格式一致。

实际执行：

- 前端输出格式下拉改为 `JPG`、`PNG`、`原格式`。
- 图片导入后默认使用“原格式”，批量处理时每张图按自己的原始扩展名生成输出。
- 后端新增 `original` 格式处理，按输入扩展名生成输出扩展名。
- 照片路线和 waifu2x 路线都改成内部管线：先稳定生成中间图，再按最终格式写出。
- 对 BMP 原格式输出增加 ffmpeg 转换兜底，避免只改文件名但真实编码不匹配。
- 处理后列表空态移除图标、主说明和辅助说明，仅保留支持格式提示。
- 处理后列表格式提示同步为 `PNG / JPG / JPEG / BMP / TIF / TIFF / GIF / WebP / HEIC`。

验证结果：

- `node --check src/app.js` 通过。
- `node --check server.js` 通过。

## 阶段 45：原图与处理后图片配对对比查看

用户反馈：

- 点开处理后的图片，需要能切换到原图进行对比。
- 点开原图时，如果已有对应处理后图片，也需要能切换到处理后的图进行对比。
- 点开后需要支持下载，恢复之前查看器的对比和下载能力。

实际执行：

- 在处理结果对象中保存 `sourcePath`，把每张处理后图片和对应原图按输入路径绑定。
- 从原图列表打开图片时，会查找同源处理结果；如果存在，查看器可在原图/处理后之间切换。
- 从处理后列表打开图片时，会查找对应原图；查看器默认显示处理后，同时可切换回原图。
- 列表打开不再使用纯查看隐藏按钮模式，查看器保留切换按钮和下载按钮。

验证结果：

- `node --check src/app.js` 通过。

## 阶段 46：修复处理后图片切换原图串图问题

用户反馈：

- 点开处理后的图片后切换到原图，显示成了别的图片的原图。
- 原图和处理后的图必须一一对应，不能混用。

实际执行：

- 修复处理后图片打开逻辑：如果找不到 `sourcePath` 对应的原图，则清空 `sourcePreview`，不再沿用上一次查看器残留的原图。
- 修复查看器切换逻辑：点击“原图”或“处理后”时只显示指定侧的图片，不再自动 fallback 到另一侧。
- 根据当前配对状态禁用不存在的一侧切换按钮，避免无配对时误切换。

验证结果：

- `node --check src/app.js` 通过。

## 阶段 47：修复对比按钮误禁用

用户反馈：

- 原图和处理后的图点击切换时，按钮点不下去。

实际执行：

- 检查后确认 `loadProcessedImage` 接收了 `sourcePath`，但没有把它保存进处理后图片对象，导致处理后图无法匹配原图，切换按钮被禁用。
- 为处理后图片对象补写 `sourcePath`。
- 增加路径归一化比较，统一斜杠和大小写，避免 Windows 路径细微差异导致匹配失败。
- 保持严格一一对应：只启用确实存在的对应原图/处理后图按钮。

验证结果：

- `node --check src/app.js` 通过。

## 阶段 48：功能页切换保留当前页图片状态

用户反馈：

- 在图片放大中上传并处理图片后，切到抠图再切回图片放大，原图和处理后图片都消失了。
- 切换功能不应清掉已上传图片和处理结果，除非关闭 exe 或用户主动清空。

实际执行：

- 移除导航切换时直接 `clearSelection()` 的行为。
- 为每个功能页增加独立状态缓存，切走前保存当前页状态，切回时恢复。
- 保存内容包括：上传原图列表、处理后列表、选中项、当前预览对象、处理状态和表单参数。
- 切换到尚未访问过的功能页时仍保持干净初始状态。
- 关闭 exe 后不持久化，符合本轮要求。

验证结果：

- `node --check src/app.js` 通过。
- `node --check server.js` 通过。

## 阶段 49：处理后列表增加处理中占位和状态计数

用户反馈：

- 处理后列表中，如果图片还在处理中，需要有写着“处理中”的占位。
- 处理后列表计数需要从“共 n 张”改为“共 n 张 · a 张已处理 · b 张处理中”。

实际执行：

- 提交图片任务后，按当前原图列表为每张图片生成一个 `pending` 占位卡。
- 占位卡缩略图区域居中显示“处理中”。
- 任务完成后，按 `sourcePath` 用真实处理结果替换对应的 pending 卡。
- 处理后列表计数改为总数、已处理数、处理中数三段显示。
- 完成结果标记为 `done`，处理中结果标记为 `pending`。

验证结果：

- `node --check src/app.js` 通过。
- `node --check server.js` 通过。

## 阶段 50：抠图模型默认参数与可调参数优化

用户反馈：

- 抠图参数需要用户可以自行设置。
- 点选不同模型后，需要按该模型的通用预设自动填充参数。
- 先优化一版看看效果。

实际执行：

- 为 6 个抠图模型增加内置默认参数：前景阈值、背景阈值、边缘羽化、边缘风格、输出背景、Alpha 平滑、小碎边清理、边缘收缩/扩张、输出蒙版。
- 抠图页新增可调参数：边缘风格、输出背景、前景阈值、背景阈值、边缘羽化、Alpha 平滑、小碎边清理、边缘收缩/扩张、输出蒙版。
- 用户切换模型时，自动把参数填充为该模型对应的默认值。
- 用户仍可手动修改参数。
- 后端接入新增参数，使它们实际参与抠图处理：边缘平滑、羽化、清理、收缩/扩张、白/黑/透明背景、输出蒙版。

验证结果：

- `node --check src/app.js` 通过。
- `node --check server.js` 通过。

## 阶段 51：抠图页隐藏参数并按模型自动套用预设

用户提出：AI 抠图不再让用户理解和填写前景阈值、背景阈值、边缘柔化等参数，只保留模型选择；选择不同模型后，系统内部使用对应模型更通用的默认参数。同时，下方图片工作区标题在抠图功能中应显示为“AI 抠图”，而不是“图片放大”。

实际和 AI 沟通后的执行：
1. 保留各抠图模型的内部参数预设表，但从 `AI 抠图` 表单配置中移除所有参数字段，只显示“素材文件”和“模型”。
2. 在任务提交时根据当前选择的模型调用 `cutoutDefaultsFor(model)`，把该模型的默认参数注入到任务 options 中，用户界面不再展示这些参数。
3. 将下方图片工作区标题改为动态标题：图片放大页面显示“图片放大”，AI 抠图页面显示“AI 抠图”，并切换对应说明文案。
4. 运行 `node --check src/app.js` 和 `node --check server.js`，确认脚本语法通过。

验证结果：
- 抠图页面不会再出现可自定义参数项，降低选择成本。
- 模型仍会真实带入各自预设参数执行，不是只改界面文字。
- 下方图片列表区域标题可随功能板块切换。

## 阶段 52：修复 BiRefNet 批量抠图时真人图失败

用户反馈：AI 抠图上传两张图并选择同一个 BiRefNet 模型时，动漫图可以抠出来，但真人图抠不出来。

排查过程：
1. 使用用户提供的两张图片在本机复现，先用同模型批量提交任务。
2. 查看任务错误，失败信息为 ONNX Runtime 在 `Mul` 节点申请约 822MB 中间缓冲失败。
3. 单独使用 BiRefNet 处理真人图，任务可以完成，说明不是 BiRefNet 不能处理真人，也不是图片内容本身无法抠图。
4. 继续检查后端批量逻辑，发现图片放大和 AI 抠图共用批量启动逻辑，多张抠图会并发启动。BiRefNet 完整模型接近 973MB，并发时内存占用叠加，导致大图任务失败。

实际执行：
1. 在后端增加 AI 抠图串行队列 `cutoutQueue`。
2. 抠图任务进入列表后可以保持可见，但实际 ONNX 推理按顺序一个接一个执行，避免多个 BiRefNet 同时占用大量内存。
3. 图片放大等其他管线保持原逻辑，不受抠图串行限制影响。
4. 重新打包独立目录 `C:\Users\99791\Documents\kepler` 下的桌面版。

验证结果：
- 使用两张测试图同时提交批量 AI 抠图，模型选择 BiRefNet。
- 动漫图和真人图均成功完成，真人图输出文件大小约 2.5 MB。
- 新版 exe 路径：`C:\Users\99791\Documents\kepler\dist\win-unpacked\kepler.exe`。

## 阶段 53：图片放大批量任务纳入图像模型串行队列

用户追问：图片放大功能是否也可能出现类似 AI 抠图的并发内存问题，并希望一起修复。

判断：
1. 图片放大里的 Real-ESRGAN 和 waifu2x 同样属于本地图像模型推理，会占用 GPU / 显存 / 内存。
2. 原批量逻辑会同时启动多张图片任务，如果多张图一起使用大模型，可能出现显存不足、某张处理失败、结果未生成或处理不稳定。
3. 因此应与 AI 抠图一样纳入串行队列，但保留批量提交和任务列表显示。

实际执行：
1. 将原来的 `cutoutQueue` 扩展为 `imageModelQueue`。
2. 新增 `usesImageModelQueue(plan)`，覆盖 `cutout`、`image-upscale-photo`、`image-upscale-waifu`。
3. 上述图像模型任务提交后先进入 `queued`，实际推理按顺序执行，避免多个图像模型任务同时抢资源。
4. 视频、音频等其他管线不受这条图像模型队列限制。
5. 重新打包并启动新版 exe，确认引擎接口正常。

验证结果：
- `node --check server.js` 通过。
- 新版桌面端启动后，ffmpeg、waifu2x、Real-ESRGAN、RIFE、rembg、demucs 均显示可用。
- 新版 exe 路径：`C:\Users\99791\Documents\kepler\dist\win-unpacked\kepler.exe`。

## 阶段 54：修复 AI 抠图输出 PNG 丢失透明通道的真正原因

用户反馈：只上传一张真人图并选择 BiRefNet，仍然看起来没有抠图，因此前一次“并发内存”判断不完整，需要重新排查。

重新排查过程：
1. 查看最近任务状态，真人图任务为 `done`，并且生成了输出文件，说明不是任务失败。
2. 检查真人图输出 PNG 的 alpha 通道，发现 `min=255 max=255 transparentPct=0%`，整张图完全不透明，所以视觉上等同于没抠图。
3. 对同一张真人图测试 BiRefNet、BiRefNet Lite、ISNet、U²-Net、U²-Netp，输出均全不透明，说明不是某个模型单独失效。
4. 直接统计模型原始 mask，发现 BiRefNet 原始 mask 是正常的：背景和前景有明显差异，说明模型实际识别出了主体。
5. 继续逐步复刻后处理，发现 `alphaBuffer` 在 resize、median、blur 后仍然正常；但最终 `sharp().joinChannel(...).png()` 写出的 PNG 变成 3 通道，`hasAlpha=false`。真正原因是最终合成 PNG 时 alpha 通道没有被可靠写入。

实际执行：
1. 不再依赖 `joinChannel` 写 alpha。
2. 改为读取原图 RGB raw buffer，并将模型生成的 `alphaBuffer` 手动交织成 RGBA 四通道 buffer。
3. 使用 `sharp(rgbaBuffer, { raw: { channels: 4 } })` 写 PNG，确保输出一定包含透明通道。
4. 修正 sharp 色彩空间为 `srgb`，避免 `no known route from srgb to rgb`。
5. 重新打包桌面版。

验证结果：
- 使用真人图 `9月15日 (1).png`，模型选择 BiRefNet，任务完成。
- 输出 PNG metadata 为 `channels=4`、`hasAlpha=true`。
- 透明区域约 `50.56%`，不透明区域约 `47.02%`，说明真人图已真正完成透明背景抠图。
- 新版 exe 路径：`C:\Users\99791\Documents\kepler\dist\win-unpacked\kepler.exe`。

## 阶段 55：修复批量抠图结果列表有一张卡在处理中

用户反馈：上传一张动漫图和一张真人图，两张后端实际都抠完了，但前端处理后列表只显示动漫图，真人图仍显示“处理中”。

排查：
1. 读取 `/api/jobs`，确认两张任务状态均为 `done`，且都有输出文件与 outputSizes。
2. 问题不在模型和后端产物，而在前端把 pending 占位替换为真实结果的逻辑。
3. 旧逻辑存在三个脆弱点：
   - `shouldPreviewJob` 依赖 `sourcePreview`，主预览状态变化可能影响批量结果同步。
   - 路径匹配使用普通字符串等号，未使用规范化路径比较。
   - 结果图片开始加载前就写入 `renderedOutputs`，如果加载时机不对或第一次失败，后续刷新不会重试，pending 会一直留下。

实际执行：
1. `shouldPreviewJob` 改为只依赖当前上传列表，并使用 `samePath()` 做规范化路径匹配。
2. 刷新任务时遍历所有 outputs，对对应 sourcePath 仍有 pending 的结果允许重试加载。
3. `renderedOutputs` 标记移动到图片真正 `onload` 成功之后，避免失败后不重试。
4. 重新打包桌面版。

验证结果：
- `node --check src/app.js` 通过。
- 新版桌面端启动后本地引擎接口正常。
- 新版 exe 路径：`C:\Users\99791\Documents\kepler\dist\win-unpacked\kepler.exe`。

## 阶段 56：图片查看器增加上一张/下一张切换

用户提出：点开原图或处理后的图对比时，希望可以在弹窗里直接切换上一张/下一张，不需要关闭窗口再打开其他图片。图片放大和 AI 抠图两个功能板块都需要支持。

实际执行：
1. 在图片查看器的预览区域左右两侧增加上一张、下一张按钮。
2. 翻页顺序以当前功能板块的原图列表顺序为准。
3. 当前正在看“处理后”时，切到下一张会优先显示下一张对应的处理后结果；如果下一张还没有结果，则自动显示原图。
4. 当前正在看“原图”时，切到上一张/下一张会继续显示对应原图。
5. 增加键盘左右方向键：左键上一张，右键下一张。
6. 第一张禁用“上一张”，最后一张禁用“下一张”；只有多张图片时显示翻页按钮。
7. 该查看器由图片放大和 AI 抠图共用，因此两个板块一起生效。

验证结果：
- `node --check src/app.js` 通过。
- 新版桌面端启动后本地引擎接口正常。
- 新版 exe 路径：`C:\Users\99791\Documents\kepler\dist\win-unpacked\kepler.exe`。

## 阶段 57：修复图片查看器上一张/下一张按钮未显示

用户反馈：新版打开图片查看器后没有看到上一张/下一张按钮。

排查：
1. 查看器按钮 DOM 和基础样式已经存在，但 `previewFromSourceFile()` 和 `previewFromProcessedFile()` 没有把 `path/sourcePath` 写入预览对象。
2. 查看器依赖 `sourcePath/path` 判断当前图片在原图列表中的位置；缺少路径后 `currentViewerSourceIndex()` 返回 -1，导致按钮被隐藏。
3. 同时发现 `.viewer-stage` 缺少 `position: relative`，即使按钮显示也可能定位不稳定。

实际执行：
1. 给原图预览对象补入 `path` 和 `sourcePath`。
2. 给处理后预览对象补入 `path` 和 `sourcePath`。
3. `currentViewerSourceIndex()` 增加文件名兜底匹配，避免路径偶发不一致时完全无法翻页。
4. `.viewer-stage` 增加 `position: relative`，保证左右按钮固定在图片预览区域中间。
5. 重新打包并启动新版 exe，确认服务正常。

验证结果：
- `node --check src/app.js` 通过。
- 新版桌面端启动后本地引擎接口正常。
- 新版 exe 路径：`C:\Users\99791\Documents\kepler\dist\win-unpacked\kepler.exe`。

## 阶段 58：视频超分复用通用功能板块结构

用户要求：把图片放大/AI 抠图已经稳定下来的通用功能板块结构复用到“视频超分”功能里，包含顶部标题区、参数设置区、左侧素材列表、右侧结果列表和任务队列，并要求素材列表支持添加、拖入、多选、框选、批量改名、删除、清空、批量下载、查看；结果列表按素材一一生成“处理中”占位，完成后按 sourcePath/sourceId 替换对应结果，切换功能页保留状态。

实际执行：
1. 将前端原先只服务图片的列表工作流抽象为素材工作流：`image-upscale`、`cutout`、`video-upscale` 共用同一套列表、选择、拖入、框选、重排、批量改名、删除、清空和下载逻辑。
2. 视频超分进入通用板块后，左侧标题自动显示“原视频列表”，添加按钮显示“添加视频”，空态提示改为支持 MP4 / MOV / MKV / AVI / WebM / M4V。
3. 右侧结果列表支持视频任务的“处理中”占位，计数显示为“共 n 个 · a 个已处理 · b 个处理中”。
4. 任务完成刷新时，结果加载从图片专用 `loadProcessedImage()` 扩展为 `loadProcessedAsset()`：图片继续走图片预览，视频走 `loadProcessedVideo()`，并按 `sourcePath` 替换对应占位，避免串结果。
5. 查看器从图片专用扩展为图片/视频通用：点击原视频或处理后视频可以打开播放器查看，支持“原图/处理后”切换、下载、上一张/下一张导航，并保持与对应素材一一匹配。
6. 桌面文件选择器为 `video-upscale` 开启多选，浏览器选择和拖入也支持视频多文件追加，不再因为列表已有素材而无法继续添加。
7. 后端批量任务逻辑增加 `video-upscale`，多视频会拆成多个独立任务；视频超分加入模型队列，避免多个超分任务同时抢占本地模型/GPU 资源。
8. 由于旧版 `kepler.exe` 仍在运行并占用 `dist\win-unpacked`，首次打包失败。实际关闭 4 个旧 kepler 进程后重新打包，`win-unpacked` 版本成功生成；portable 单文件生成阶段卡住，但解包版 exe 已更新可用。

验证结果：
- `node --check src/app.js` 通过。
- `node --check server.js` 通过。
- `node --check desktop-main.js` 通过。
- 启动新版 `dist\win-unpacked\kepler.exe` 后，`/api/engines` 返回 ffmpeg、ffprobe、waifu、photo、rife、rembg、demucs 全部 available。
- 使用测试目录视频 `C:\Users\99791\Desktop\新建文件夹\9\RELX Essential竖版(无字幕).mp4` 调用 `/api/import-path` 和 `/api/plan`，成功生成 `video-upscale` 计划与输出路径。
- 新版 exe 路径：`C:\Users\99791\Documents\kepler\dist\win-unpacked\kepler.exe`。

## 阶段 59：整合视频处理功能为单一流水线

用户要求：视频相关能力不再分散为多个功能页，而是整合在一起，包含视频去重、视频降噪、视频补帧、视频超分。每个功能只有打开启用开关后才执行；如果同时启用多个功能，固定按“视频去重 → 视频降噪 → 视频补帧 → 视频超分”的顺序处理。支持多个视频进入任务队列，但视频模型任务必须串行执行，不能同时抢占本地模型/GPU 资源。

实际执行：
1. 前端将原来的“视频超分 / 视频补帧 / 视频去重”三个入口整合为一个“视频处理”入口。
2. 视频处理板块增加四个启用开关：视频去重、视频降噪、视频补帧、视频超分。
3. 视频降噪只暴露“弱 / 中 / 强”三个强度选项，不暴露其他复杂参数。
4. 视频超分只保留模型、放大倍率和自定义分辨率；倍率包含 1x、2x、3x、4x、自定义分辨率，不再显示编码、封装、CRF 等参数。
5. 视频补帧保留倍率和模型选择；视频去重使用内置智能参数，不要求用户手动理解阈值。
6. 前端表单新增 toggle 控件类型和联动逻辑：开关关闭时自动隐藏并禁用对应参数，自定义分辨率只在选择“自定义分辨率”时显示。
7. 后端保持 `video-upscale` mode 作为兼容入口，但生成新的 `video-suite` pipeline。
8. `video-suite` 按固定顺序逐步执行：dedup、denoise、interpolate、upscale；中间产物写入任务 workDir，最终只把最后结果作为输出。
9. 新增 `runVideoDedupStep()`、`runVideoDenoiseStep()`、`runVideoSuite()`；补帧和超分复用已有 RIFE/超分逐帧管线。
10. 视频超分函数增加自定义分辨率输出支持，在最终封装阶段通过 ffmpeg scale 到目标宽高。
11. 视频任务加入同一模型队列，批量视频会一个个处理，避免多个超分/补帧任务同时运行。
12. 构建改为 `electron-builder --win dir --x64` 生成解包版，避免 portable 单文件打包长时间卡住。

验证结果：
- `node --check src/app.js` 通过。
- `node --check server.js` 通过。
- `node --check desktop-main.js` 通过。
- 使用测试视频生成计划，返回 `pipeline=video-suite`。
- 计划步骤顺序为 `dedup → denoise → interpolate → upscale`。
- 新版 exe 启动后 `/api/engines` 全部 available。
- 新版 exe 自检计划摘要为：`视频处理 · 去重 → 降噪弱 → 补帧2x → 超分到1280x720`。
- 新版 exe 路径：`C:\Users\99791\Documents\kepler\dist\win-unpacked\kepler.exe`。

## 阶段 60：调整视频处理分块与补帧/超分参数位置

用户要求：去掉视频去重功能；界面中视频超分放最前面，随后是视频降噪，接着是视频补帧；如果启用多个功能，任务执行逻辑仍按“视频降噪 → 视频补帧 → 视频超分”的顺序执行。视频降噪保留弱、中、强；补帧自定义帧数和超分自定义分辨率不要写示例，并放在下拉选项菜单下方；各小功能标题重复，保留一个标题即可。

实际执行：
1. 从视频处理主界面移除“视频去重”分块。
2. 调整视频功能分块显示顺序为：视频超分、视频降噪、视频补帧。
3. 后端 `video-suite` 生成步骤时只保留降噪、补帧、超分，并保持执行顺序为：denoise、interpolate、upscale。
4. 视频降噪继续保留弱、中、强三档。
5. 补帧自定义帧数、超分自定义宽度/高度去掉“例如”提示。
6. 自定义帧数和自定义分辨率输入框改为占满整行，显示在对应下拉菜单下方。
7. 隐藏功能块内部开关字段的重复标题，只保留卡片标题。

验证结果：
- `node --check src/app.js` 通过。
- `node --check server.js` 通过。
- 使用测试视频生成计划，返回 `pipeline=video-suite`。
- 同时启用降噪、补帧、超分时，计划步骤为 `denoise → interpolate → upscale`。
- 计划摘要为：`视频处理 · 降噪强 → 补帧到50fps → 超分2x`。
- 新版 exe 路径：`C:\Users\99791\Documents\kepler\dist\win-unpacked\kepler.exe`。

## 阶段 61：校验视频处理模型不是摆设

用户提醒：视频处理三个小功能必须真的能跑，不能只是显示模型名；选择 A 模型时不能实际跑 B 模型。

实际检查：
1. 检查前端字段链路：补帧模型字段为 `interpolateModel`，超分模型字段为 `upscaleModel`，降噪强度字段为 `denoiseStrength`，都会进入 `/api/plan` payload。
2. 检查后端计划链路：`interpolateModel` 写入 `steps[].model`，`upscaleModel` 写入 `steps[].model`，`denoiseStrength` 写入 `steps[].strength`。
3. 检查执行链路：补帧执行时使用 `modelDir(rife, plan.model)` 作为 RIFE `-m` 参数；超分执行时 Real-ESRGAN 使用 `-n plan.model`，waifu2x 使用 `-m modelDir(engine, plan.model)`；降噪使用不同的 `hqdn3d` 滤镜参数。
4. 逐个调用 `/api/plan` 验证模型选择和计划模型一致。
5. 发现 `rife-v4.13` 和 `rife-v4.26` 当前本机模型目录不存在，计划会报错；为避免“界面展示但不可用”，已从前端补帧模型下拉和后端白名单移除。

验证结果：
- 补帧保留并验证通过：`rife-v4.6`、`rife-anime`、`rife-HD`、`rife-UHD`、`rife-v2.3`。
- 超分保留并验证通过：`realesr-animevideov3`、`realesrgan-x4plus-anime`、`realesrgan-x4plus`、`models-cunet`、`models-upconv_7_anime_style_art_rgb`、`models-upconv_7_photo`。
- 降噪弱/中/强分别生成 `weak`、`medium`、`strong` 计划。
- `node --check src/app.js` 通过。
- `node --check server.js` 通过。
- 新版 exe 路径：`C:\Users\99791\Documents\kepler\dist\win-unpacked\kepler.exe`。

## Stage 62 - 2026-09-21 RIFE model completion and video feature verification

- Corrected the earlier shortcut: missing RIFE models are now supplied instead of removed.
- Downloaded RIFE ncnn Vulkan EX v1.0.1 Windows package and installed `engines/rife/rife-ncnn-vulkan-ex.exe` as the preferred RIFE engine.
- Restored `rife-v4.13` and `rife-v4.26` in both the UI model list and backend whitelist.
- Replaced/confirmed local `rife-v4.13` and `rife-v4.26` model folders from the compatible EX release.
- Fixed interpolation args: only RIFE v4 models receive custom `-n` target-frame arguments; legacy RIFE models run without `-n`, preventing the EX engine error `only rife-v4 model support custom numframe and timestep`.
- Smoke tested project engine path with `rife-v4.13`, `rife-v4.26`, `rife-v4.6`, and `rife-anime`; all produced output frames.
- Plan-checked all interpolation models: `rife-v4.6`, `rife-v4.13`, `rife-v4.26`, `rife-anime`, `rife-HD`, `rife-UHD`, `rife-v2.3`; selected model matched planned model.
- Plan-checked all video upscaling models and smoke tested 2-frame output for: `realesr-animevideov3`, `realesrgan-x4plus-anime`, `realesrgan-x4plus`, `models-cunet`, `models-upconv_7_anime_style_art_rgb`, `models-upconv_7_photo`.
- Smoke tested video denoise weak/medium/strong presets with bundled ffmpeg.
- Rebuilt `dist/win-unpacked/kepler.exe` with `npx electron-builder --win dir --x64`.

## Stage 63 - 2026-09-21 Video parameter effectiveness fixes

- Verified video settings are not UI-only:
  - Super-resolution scale enters the ncnn engine `-s` argument and/or final ffmpeg `scale=` filter.
  - Denoise strength maps to different `hqdn3d` filters: weak `1.5:1.5:4:4`, medium `2.5:2.5:7:7`, strong `4:4:10:10`.
  - Interpolation target fps changes actual output fps/frame count.
- Fixed interpolation target fps behavior when target fps is lower than or equal to source fps: use ffmpeg `fps=` conversion to preserve duration instead of incorrectly rewrapping frames at a lower frame rate.
- Fixed legacy non-v4 RIFE behavior: legacy models can run up to 2x then ffmpeg converts to requested fps; requests beyond stable legacy capability now fail clearly instead of producing misleading output.
- Fixed video super-resolution `1x` behavior: engines without x1 model now run 2x enhancement internally and downscale back to original size, so `1x` is an actual enhancement pass rather than a missing-model failure.
- Smoke checks:
  - fps outputs from a 60fps sample: 30fps -> 30 frames/1s, 50fps -> 50 frames/1s, 60fps -> 60 frames/1s.
  - denoise weak/medium/strong generated distinct filter commands and outputs.
  - upscale sample 160x240: 1x -> 160x240, 2x -> 320x480, 3x -> 480x720, custom -> 640x960.
- Rebuilt `dist/win-unpacked/kepler.exe` with `npx electron-builder --win dir --x64 --publish never`.

## Stage 64 - 2026-09-21 Video failure feedback and thumbnails

- Added readable process failure mapping for model engine errors. Memory/VRAM allocation failures now report: `处理失败：内存或显存不足。请关闭其他占用内存/GPU 的程序，降低放大倍率或自定义分辨率后重新处理。`
- Failed jobs now update both the task queue card and the corresponding result placeholder, so the UI no longer leaves that item stuck at `处理中`.
- Result list counting now includes failed items when present: `共 n 个 · a 个已处理 · b 个处理中 · c 个失败`.
- Uploaded video items now try to capture a first-frame poster and show it in the素材列表/结果列表 thumbnail.
- If Chromium cannot decode a frame for thumbnail capture, the UI shows a clear `VIDEO` fallback instead of a blank card.
- Verification:
  - `node --check src/app.js` passed.
  - `node --check server.js` passed.
  - Rebuilt `dist/win-unpacked/kepler.exe` with `npx electron-builder --win dir --x64 --publish never`.
  - New exe timestamp: `2026-09-21 17:57:29`.

## Stage 65 - 2026-09-21 Stable video thumbnails and video board cleanup

- Removed the repeated board description area from the video processing asset board, leaving the original video list and result list as the visible working area.
- Added backend video poster extraction during upload/import. Imported videos now get a generated `.poster.jpg` next to the copied upload and return `posterUrl` to the UI.
- Added a frontend fallback video thumbnail node. If a generated poster is unavailable, the card uses `<video preload="metadata">` for the first visible frame; if decoding fails, it shows a clear `VIDEO` fallback instead of a broken image icon.
- Verified with the RELX test upload copy:
  - `/api/import-path` returned a non-empty `posterUrl`.
  - `/api/preview` for the generated poster returned `200 image/jpeg`.
- Verification:
  - `node --check server.js` passed.
  - `node --check src/app.js` passed.
  - Rebuilt `dist/win-unpacked/kepler.exe` with `npx electron-builder --win dir --x64 --publish never`.
  - New exe timestamp: `2026-09-21 18:03:56`.

## Stage 66 - 2026-09-21 Fix broken poster overlay in video list

- Fixed a UI issue where a failing `<video poster>` image could render as a broken-image icon and cover the thumbnail fallback.
- Video cards now show the `VIDEO` fallback immediately, then switch to the generated poster only after the poster image has loaded successfully.
- The live `<video preload="metadata">` fallback is also hidden until an actual frame is available, preventing broken media UI from covering the card.
- Verification:
  - `node --check src/app.js` passed.
  - `node --check server.js` passed.
  - Rebuilt `dist/win-unpacked/kepler.exe` with `npx electron-builder --win dir --x64 --publish never`.
  - New exe timestamp: `2026-09-21 18:09:26`.

## Stage 67 - 2026-09-21 Avoid stale local service and update video copy

- Root cause found for repeated “still old UI” behavior: the desktop app used a fixed local port, while `server.js` treated `EADDRINUSE` as ready. A newly opened exe could therefore display an old already-running local service.
- Changed `desktop-main.js` to allocate a free localhost port on each launch before importing `server.js`.
- Changed `server.js` so port binding errors reject startup instead of silently reusing an existing service.
- Updated the video processing subtitle to remove deduplication and put super-resolution first: `把超分、降噪、补帧合并成一条本地视频流水线。`
- Verification:
  - `node --check desktop-main.js` passed.
  - `node --check server.js` passed.
  - `node --check src/app.js` passed.
  - Rebuilt `dist/win-unpacked/kepler.exe` with `npx electron-builder --win dir --x64 --publish never`.
  - New exe timestamp: `2026-09-21 18:15:31`.
