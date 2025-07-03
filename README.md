# Vocal Player

A modern video player built with Vue.js 3 and Electron, featuring subtitle support, a modern UI, and the ability to read subtitles out loud using text-to-speech (TTS).

Build for those who can't or don't want to read subtitles, this player uses your system's Romanian voice to automatically speak subtitle lines, making videos more accessible.
## Features

- **Reads subtitles out loud (TTS)**: Automatically speaks subtitle lines using your system's Romanian voice, making videos accessible for those who can't or don't want to read subtitles.
- Video playback with support for multiple formats (MP4, AVI, MKV, MOV, WMV, FLV, WebM, M4V)
- Subtitle support (SRT, VTT, ASS, SSA, SUB)
- Modern, responsive UI with hover effects
- Playback controls (play/pause, rewind, fast forward)
- Volume control with mute functionality
- Progress bar with click-to-seek
- Fullscreen support
- File selection overlay for video and subtitle files

## Development

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

This will start both the Vite development server and Electron app concurrently.

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run dev:vite` - Start only the Vite development server
- `npm run dev:electron` - Start only the Electron app
- `npm run build` - Build for production and package with Electron
- `npm run build:web` - Build only the web version
- `npm run preview` - Preview the built web version
- `npm start` - Start the Electron app (requires built files)

## Compiling the application

To build the application for distribution:

```bash
npm run build
npm run dist
```

This will:
1. Build the Vue application using Vite
2. Package the application with Electron for Windows

The built application will be available in the `dist` folder.

## License

MIT License
