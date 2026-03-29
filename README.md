[English](README.md) | [日本語](README-ja_JP.md)

# Demo

![Demo](./demo.gif)

# Streamlit Multimodal Chat Input

A multimodal chat input component for Streamlit that supports text input, image upload, and voice input.

> **Note**: Voice and image features require HTTPS or localhost environment to function properly.

## Features

- 📝 **Text Input**: Same usability as st.chat_input
- 🖼️ **Image File Upload**: Supports jpg, png, gif, webp
- 🎤 **Voice Input**: Web Speech API / server-side OpenAI Whisper support
- 🔒 **Input Validation**: File count, file size, MIME/content, and parameter validation
- 🎨 **Streamlit Standard Theme**: Fully compatible design
- 🔄 **Drag & Drop**: File drag and drop support
- ⌨️ **Ctrl+V**: Paste images from clipboard
- 🚨 **Inline Errors**: User-safe inline messages
- ⚙️ **Customizable**: Rich configuration options

## Installation

```bash
pip install st-chat-input-multimodal
```

## Development

```bash
uv sync
uv run streamlit run example.py

cd st_chat_input_multimodal/frontend
npm ci
npm run build
```

`uv` manages the Python virtual environment in `.venv` and uses `uv.lock` for reproducible installs.

## Basic Usage

```python
import streamlit as st
from st_chat_input_multimodal import multimodal_chat_input

# Basic usage
result = multimodal_chat_input()

if result:
    # Display text
    if result['text']:
        st.write(f"Text: {result['text']}")
    
    # Display uploaded files
    if result['files']:
        for file in result['files']:
            import base64
            base64_data = file['data'].split(',')[1] if ',' in file['data'] else file['data']
            image_bytes = base64.b64decode(base64_data)
            st.image(image_bytes, caption=file['name'])
    
    # Display voice input metadata
    if result.get('audio_metadata'):
        st.write(f"Voice input used: {result['audio_metadata']['used_voice_input']}")
```

## Advanced Usage

### Voice Input Features

```python
# Enable voice input
result = multimodal_chat_input(
    enable_voice_input=True,
    voice_recognition_method="web_speech",  # or "openai_whisper"
    voice_language="ja-JP",
    max_recording_time=60
)

# Using OpenAI Whisper on the server side
# Preferred: set OPENAI_API_KEY in the Python environment
result = multimodal_chat_input(
    enable_voice_input=True,
    voice_recognition_method="openai_whisper",
    voice_language="ja-JP"
)
```

When `openai_whisper` is selected, recorded audio is sent to the Python backend for transcription. The API key is used only on the server side and is never forwarded to the browser.

#### Voice Transcription Error Handling

Runtime voice-transcription failures are converted into user-safe inline messages instead of exposing raw backend exception details.

- `Voice transcription is not available in this app.`: Whisper is not available for the current app configuration.
- `Recorded audio could not be processed. Please try recording again.`: The recorded audio payload was invalid or unreadable.
- `Voice transcription is temporarily unavailable. Please try again.`: Temporary API or network issue.
- `Voice transcription failed. Please try again.`: Final fallback for unexpected runtime errors.

Developer-facing parameter validation still raises `ValueError` during `multimodal_chat_input(...)` initialization so configuration mistakes fail fast.

### Custom Configuration

```python
result = multimodal_chat_input(
    placeholder="Please enter your message...",
    max_chars=500,
    accepted_file_types=["jpg", "png", "gif", "webp"],
    max_file_size_mb=10,
    max_files=5,
    disabled=False,
    key="custom_chat_input"
)
```

`max_chars`, `max_file_size_mb`, and `max_files` must be positive integers. `max_recording_time` must be between `1` and `300`, and `voice_recognition_method` must be either `"web_speech"` or `"openai_whisper"`.
Uploaded images are validated by extension and file signature, and displayed filenames are sanitized before rendering.

### Chat Usage

```python
import streamlit as st
import base64
from st_chat_input_multimodal import multimodal_chat_input

# Page configuration
st.set_page_config(
    page_title="Multimodal Chat Input Demo",
    page_icon="💬",
    layout="wide"
)

st.subheader("💭 Multimodal Chat Input Demo")
st.markdown("Simulate a chat application with voice input and file upload.")

# Manage history in session state
if "chat_history" not in st.session_state:
    st.session_state.chat_history = []

# Input for new messages
chat_result = multimodal_chat_input(
    placeholder="Enter chat message...",
    enable_voice_input=True,  # Enable voice input for chat as well
    key="chat_input"
)
if chat_result:
    st.session_state.chat_history.append(chat_result)

# Display chat history
if st.session_state.chat_history:
    for i, message in enumerate(st.session_state.chat_history):
        with st.chat_message("user"):
            if message.get("text"):
                st.write(message["text"])
            
            if message.get("files"):
                for file in message["files"]:
                    try:
                        base64_data = file['data'].split(',')[1] if ',' in file['data'] else file['data']
                        image_bytes = base64.b64decode(base64_data)
                        st.image(image_bytes, caption=file['name'], width=200)
                    except:
                        st.write(f"📎 {file['name']}")
            
            # Display voice input information
            if message.get("audio_metadata") and message["audio_metadata"]["used_voice_input"]:
                st.caption(f"🎤 Voice input ({message['audio_metadata']['transcription_method']})")


# Clear history
if st.button("Clear History"):
    st.session_state.chat_history = []
    st.rerun()

```

### Example Chat App

[streamlit-chatbot example](https://github.com/tsuzukia21/streamlit-chatbot)

## License

MIT License

## Author

tsuzukia21
