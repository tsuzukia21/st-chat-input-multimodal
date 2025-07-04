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

with st.expander("Usage"):
    st.code("""
import streamlit as st
from st_chat_input_multimodal import multimodal_chat_input

# Usage with voice input features
result = multimodal_chat_input(
    enable_voice_input=True,
    voice_recognition_method="web_speech",  # or "openai_whisper"
    voice_language="ja-JP",
    max_recording_time=60
)

if result:
    # Display text message (including speech-to-text conversion results)
    if result['text']:
        st.write(f"Message: {result['text']}")
    
    # Display voice input information
    if result['audio_metadata']['used_voice_input']:
        st.write(f"Recognition method: {result['audio_metadata']['transcription_method']}")
        st.write(f"Recording time: {result['audio_metadata']['recording_duration']} seconds")
    
    # Display image files
    if result['files']:
        for file in result['files']:
            # Restore image from base64 data
            import base64
            base64_data = file['data'].split(',')[1]
            image_bytes = base64.b64decode(base64_data)
            st.image(image_bytes, caption=file['name'])
    """, language="python")

with st.expander("API Specification"):
    st.markdown("""
    ```python
    multimodal_chat_input(
        placeholder="Enter message...",                  # Placeholder text
        max_chars=None,                                  # Maximum character count
        disabled=False,                                  # Disabled flag
        accepted_file_types=["jpg", "png", ...],         # Accepted file formats
        max_file_size_mb=10,                             # Maximum file size
        enable_voice_input=False,                        # Enable voice input feature
        voice_recognition_method="web_speech",           # Voice recognition method ("web_speech" or "openai_whisper")
        openai_api_key=None,                             # OpenAI API key (required when using whisper, or set OPENAI_API_KEY env var)
        voice_language="ja-JP",                          # Voice recognition language
        max_recording_time=60,                           # Maximum recording time (seconds)
        key=None                                         # Component key
    )
    ```
    
    **Return value:**
    ```python
    {
        "text": "Input text (including speech-to-text conversion results)",
        "files": [
            {
                "name": "File name",
                "type": "MIME type", 
                "size": "File size",
                "data": "Base64 encoded data"
            }
        ],
        "audio_metadata": {
            "used_voice_input": "Whether voice input was used (bool)",
            "transcription_method": "Voice recognition method (str)",
            "recording_duration": "Recording time in seconds (float)",
            "confidence": "Recognition accuracy (if available) (float)",
            "language": "Voice recognition language used (str)"
        }
    }
    ```
    """)


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


