<div align="center">
  <img src="https://via.placeholder.com/128/EE5325/FFFFFF?text=LMR](https://raw.githubusercontent.com/rxxddy/my-video-resumer/refs/heads/main/icon128.png" alt="Local Media Resumer Logo" width="100" height="100">
  
  # Local Media Resumer
  
  **Smart playback history for local files in your browser.**
  
  ![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
  ![License](https://img.shields.io/badge/license-MIT-green.svg)
  ![Platform](https://img.shields.io/badge/platform-Chromium-orange.svg)
</div>

---

## 🚀 Overview

**Local Media Resumer** is a lightweight, privacy-focused browser extension designed for students and researchers. It automatically saves the playback position of local video files (`file://`) and the scroll position of local PDFs.

Unlike standard players, it features a modern **Glassmorphism UI** that can be dragged anywhere on the screen, includes precise speed controls, and offers a "stealth" incognito mode.

## ✨ Features

- **📂 Universal Resume:** Remembers exactly where you left off for both Videos and PDFs.
- **💎 Glassmorphism UI:** sleek, semi-transparent control bar with blur effects (`backdrop-filter`).
- **🕹 Draggable Interface:** Move the controls anywhere on the screen to avoid blocking subtitles.
- **⚡️ Precision Speed Control:** Horizontal slider to adjust playback speed from `0.5x` to `3.0x` (with `0.25x` steps).
- **🕵️‍♂️ Incognito Mode:** Toggle button to temporarily stop tracking history for sensitive content.
- **🔒 Privacy First:** No data leaves your machine. Everything is stored in `chrome.storage.local`.
- **⌨️ Keyboard Shortcuts:** Full support for YouTube-style hotkeys.

## 🛠 Installation

Since this extension works with local files, it requires manual installation (Developer Mode):

1.  Clone or download this repository.
2.  Open your browser (Chrome/Edge/Brave) and navigate to `chrome://extensions`.
3.  Enable **Developer mode** (toggle in the top right corner).
4.  Click **Load unpacked** and select the folder containing this extension.
5.  **Important:** In the extension details, scroll down and enable **"Allow access to file URLs"**.

## 🎮 Controls & Hotkeys

The interface is designed to be intuitive and mouse-free friendly.

| Key | Action |
| :--- | :--- |
| `Space` / `K` | Play / Pause |
| `J` | Rewind **5 sec** |
| `L` | Forward **5 sec** |
| `←` / `→` | Seek **5 sec** |
| `F` | Toggle Fullscreen |
| `I` | Toggle **Incognito Mode** |

## ⚙️ Configuration

Click the extension icon in the browser toolbar to open the **Manager Popup**:

- **History List:** View and manage your recently played files.
- **One-Click Resume:** Click any file in the list to open it immediately.
- **Settings:** Toggle visibility of specific UI elements (Rewind buttons, Speed slider, etc.).
- **Clear Data:** Wipe all history with a single click.

## 🛡 Privacy & Security

As a cybersecurity enthusiast project, data minimization is a core principle:
* **0 External Requests:** The extension functions completely offline.
* **Local Storage:** Playback data is stored only within your browser's local profile.
* **Permissions:** Minimal permissions used (`storage`, `tabs`, and access to local file schemes).

## 📄 License

Distributed under the MIT License.
---
<div align="center">
  <sub>Built by <a href="https://github.com/rxxddy">rxxddy</a></sub>
</div>
