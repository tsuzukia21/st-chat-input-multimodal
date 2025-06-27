# Streamlit Multimodal Chat Input

A multimodal chat input component for Streamlit that supports text input, image upload, and voice input.

## Features

- 📝 **Text Input**: Same usability as st.chat_input
- 🖼️ **Image File Upload**: Supports jpg, png, gif, webp
- 🎤 **Voice Input**: Web Speech API / OpenAI Whisper API support
- 🎨 **Streamlit Standard Theme**: Fully compatible design
- 🔄 **Drag & Drop**: File drag and drop support
- ⌨️ **Ctrl+V**: Paste images from clipboard
- ⚙️ **Customizable**: Rich configuration options

## Installation

```bash
pip install st-chat-input-multimodal
```

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
            base64_data = file['data'].split(',')[1]
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

# Using OpenAI Whisper API
result = multimodal_chat_input(
    enable_voice_input=True,
    voice_recognition_method="openai_whisper",
    openai_api_key="sk-your-api-key",
    voice_language="ja-JP"
)
```

### Custom Configuration

```python
result = multimodal_chat_input(
    placeholder="Please enter your message...",
    max_chars=500,
    accepted_file_types=["jpg", "png", "gif", "webp"],
    max_file_size_mb=10,
    disabled=False,
    key="custom_chat_input"
)
```

## License

MIT License

## Author

tsuzukia21