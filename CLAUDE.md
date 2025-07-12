# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Streamlit multimodal chat input component that supports text, image upload, and voice input. It's a hybrid Python/TypeScript project with:

- **Python backend**: Streamlit component wrapper (`st_chat_input_multimodal/__init__.py`)
- **React/TypeScript frontend**: Complete UI implementation in `st_chat_input_multimodal/frontend/`

## Development Commands

### Python Package
```bash
# Install in development mode
pip install -e .

# Install with development dependencies
pip install -e ".[dev]"

# Run tests (if available)
pytest

# Code formatting and linting
black .
flake8 .
mypy .
```

### Frontend Development
```bash
# Navigate to frontend directory
cd st_chat_input_multimodal/frontend

# Install dependencies
npm install

# Development server (hot reload)
npm start
# or
npm run dev

# Production build
npm run build
```

## Architecture

### Component Flow
1. **Python wrapper** (`__init__.py`) exposes `multimodal_chat_input()` function
2. **Release toggle**: `_RELEASE = True` uses built frontend, `False` proxies to dev server
3. **React frontend** (`MyComponent.tsx`) handles all UI interactions
4. **Data flow**: Frontend → Streamlit bridge → Python function return

### Key Frontend Structure
- `MyComponent.tsx`: Main component exported to Streamlit
- `components/`: Reusable UI components (TextInput, VoiceButton, FileUploadButton, FilePreview)
- `hooks/`: Custom React hooks (useFileUpload, useVoiceRecording, useStyles)
- `utils/`: Utility functions (fileUtils, audioUtils)
- `types/`: TypeScript type definitions

### Development Mode Setup
Set `_RELEASE = False` in `__init__.py:10` to develop frontend with hot reload. Frontend dev server runs on `http://localhost:3000`.

## Key Features Implementation

### Voice Input
- Supports Web Speech API (`web_speech`) and OpenAI Whisper API (`openai_whisper`)
- Language configuration via `voice_language` parameter
- Requires HTTPS or localhost for Web Speech API

### File Upload
- Drag & drop, button click, and Ctrl+V clipboard paste
- Base64 encoding for file transfer to Python
- File type and size validation
- Image preview functionality

### Component Lifecycle
- Uses Streamlit session state to track previous values
- Returns data only once when submitted (like `st.chat_input`)
- Automatic bottom positioning via `st._bottom`

## Testing

The project includes pytest configuration with development dependencies:
```bash
pytest>=7.0
pytest-cov>=4.0
```

Run tests with: `pytest`

## Build Process

1. **Frontend build**: `npm run build` creates optimized bundle in `frontend/build/`
2. **Python packaging**: `setup.py` includes frontend build via `include_package_data=True`
3. **Distribution**: Component loads from `frontend/build/` when `_RELEASE = True`