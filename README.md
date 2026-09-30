# MediaKit

MediaKit 是一个本地媒体增强工作台，覆盖图片放大、背景移除、视频放大、视频补帧、重复帧整理和音频分离等流程。

当前版本是独立重做的工具壳与执行控制台，已内置 ffmpeg / ffprobe，并可通过 `npm run prepare-engines` 准备 waifu2x、Real-ESRGAN、RIFE 及对应模型文件。抠图与音频分离模型已保留同款入口，运行时还需要继续接入。

所有模块都使用“选择文件”作为素材入口。选择后文件会导入到本地 `uploads/` 工作区，后端会用这个本地副本生成处理计划；图片放大和背景移除模块还带可实测的浏览器本地预览区，不需要模型即可预览并下载 PNG 结果。

## 运行

开发/浏览器模式：

```bash
npm start
```

打开控制台输出的本地地址，默认是：

```text
http://127.0.0.1:4877
```

桌面模式：

```bash
npm run desktop
```

打包 Windows portable exe：

```bash
npm run dist
```

准备本地 AI 执行器：

```bash
npm run prepare-engines
```

已验证生成物：

```text
dist/MediaKit-0.1.0-x64.exe
```

该 exe 已配置独立应用图标。

## 引擎目录约定

```text
engines/
  ffmpeg/ffmpeg.exe
  ffmpeg/ffprobe.exe
  waifu2x/waifu2x-ncnn-vulkan.exe
  realesrgan/realesrgan-ncnn-vulkan.exe
  realesrgan/models/*.param
  realesrgan/models/*.bin
  rife/rife-ncnn-vulkan.exe
  rembg/rembg.exe
  demucs/demucs.exe
```

没有引擎时可以正常生成执行计划；检测到引擎后，点击“开始处理”会启动本地子进程并把日志写入 `logs/`。

## 模块

- 图片放大：Real-ESRGAN、waifu2x、动漫路线、照片路线、倍率、降噪、输出格式。
- 背景移除：多模型选项、阈值和边缘参数入口。
- 视频超分：Real-ESRGAN / waifu2x 模型、倍率、编码、封装、CRF。
- 视频补帧：RIFE 模型和补帧倍率。
- 视频去重：智能、动漫节奏和手动参数入口。
- 音频分离：仅保留人声或仅保留背景声。

## 可实测版本说明

- 图片放大：点击顶部“开始处理”会调用真实 AI 执行器；实测区仍保留浏览器 Canvas 快速预览。
- 背景移除：使用图片角落背景色估算透明区域，适合纯色或接近纯色背景的快速验证。
- 视频和音频：选择文件后会显示本地预览、时长、大小和分辨率等信息；视频超分/补帧采用拆帧、AI 处理、合成视频的管线，音频分离使用本地 Demucs 模型执行。

## 后续封装

这个版本可以继续封装为桌面应用：

- Electron：已接入，可打开独立桌面窗口并生成 portable exe。
- Tauri：保留前端，把执行层迁移到 Rust command。
- .NET：按当前模块拆分为页面、任务队列服务和引擎适配服务。
