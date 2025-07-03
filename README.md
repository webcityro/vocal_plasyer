# Vocal Player - Vue.js Version

A video player application built with Vue.js 3 and Electron, featuring subtitle support and a modern UI.

## Features

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

## Project Structure

```
vocal_player/
├── src/
│   ├── App.vue          # Main Vue component
│   ├── main.js          # Vue app entry point
│   ├── index.html       # HTML template
│   └── player.css       # Styles
├── main.js              # Electron main process
├── package.json         # Dependencies and scripts
├── vite.config.js       # Vite configuration
└── README.md           # This file
```

## Technology Stack

- **Frontend**: Vue.js 3 with Composition API
- **Build Tool**: Vite
- **Desktop**: Electron
- **Styling**: CSS3 with modern features
- **File Handling**: Electron dialog API with fallback to HTML file input

## Migration from Vanilla JS

This project was converted from a vanilla JavaScript implementation to Vue.js 3. Key changes:

1. **Component-based architecture**: All functionality is now contained in a single Vue component
2. **Reactive state management**: Using Vue's reactive system instead of manual DOM manipulation
3. **Event handling**: Vue event system instead of addEventListener
4. **Template syntax**: Vue template syntax for conditional rendering and data binding
5. **Computed properties**: For derived state like progress percentage and formatted time

## Building for Production

To build the application for distribution:

```bash
npm run build
```

This will:
1. Build the Vue application using Vite
2. Package the application with Electron for Windows

The built application will be available in the `dist` folder.

## License

MIT License
