import os
import streamlit.components.v1 as components
from typing import Optional, List, Dict, Any
import streamlit as st

# Create a _RELEASE constant. We'll set this to False while we're developing
# the component, and True when we're ready to package and distribute it.
# (This is, of course, optional - there are innumerable ways to manage your
# release process.)
_RELEASE = True

# Declare a Streamlit component. `declare_component` returns a function
# that is used to create instances of the component. We're naming this
# function "_component_func", with an underscore prefix, because we don't want
# to expose it directly to users. Instead, we'll create a custom wrapper
# function, below, that will serve as our component's public API.

# It's worth noting that this call will import `my_component.frontend.build`,
# so you'll need to have the component built first.

if not _RELEASE:
    _component_func = components.declare_component(
        "st_chat_input_multimodal",
        url="http://localhost:3000",
    )
else:
    # When we're distributing a production version of the component, we'll
    # replace the `url` param with `path`, and point it to to the component's
    # build directory:
    parent_dir = os.path.dirname(os.path.abspath(__file__))
    build_dir = os.path.join(parent_dir, "frontend/build")
    _component_func = components.declare_component(
        "st_chat_input_multimodal",
        path=build_dir
    )


def multimodal_chat_input(
    placeholder: str = "Type your message here...",
    max_chars: Optional[int] = None,
    disabled: bool = False,
    accepted_file_types: Optional[List[str]] = None,
    max_file_size_mb: int = 10,
    enable_voice_input: bool = False,
    voice_recognition_method: str = "web_speech",
    openai_api_key: Optional[str] = None,
    voice_language: str = "ja-JP",
    max_recording_time: int = 60,
    key: Optional[str] = None,
) -> Optional[Dict[str, Any]]:
    """
    Multimodal chat input component
    
    Provides a chat input UI that supports text input, image file uploads, and voice input.
    Similar to st.chat_input, it returns a value once when submitted, then automatically returns None.
    This component is automatically pinned to the bottom of the page like st.chat_input.
    
    Parameters
    ----------
    placeholder : str
        Placeholder text for the input field
    max_chars : int, optional
        Maximum character limit
    disabled : bool
        Flag to disable the component
    accepted_file_types : list of str, optional
        List of acceptable file extensions (e.g., ["jpg", "png", "gif"])
        Defaults to all image file types
    max_file_size_mb : int
        Maximum file size in MB
    enable_voice_input : bool
        Whether to enable voice input functionality
    voice_recognition_method : str
        Voice recognition method: "web_speech" or "openai_whisper"
    openai_api_key : str, optional
        OpenAI API key (required when openai_whisper is selected)
        If not provided, will attempt to use OPENAI_API_KEY environment variable
    voice_language : str
        Voice recognition language (e.g., "ja-JP", "en-US")
    max_recording_time : int
        Maximum recording time in seconds
    key : str, optional
        Unique key for the component
        
    Returns
    -------
    dict or None
        Dictionary in the following format when submitted, None when not submitted:
        {
            "text": str,                    # Input text (including voice-to-text conversion results)
            "files": [                      # Uploaded files
                {
                    "name": str,            # File name
                    "type": str,            # MIME type  
                    "size": int,            # File size in bytes
                    "data": str             # base64 encoded file data
                }
            ],
            "audio_metadata": {             # Voice input metadata
                "used_voice_input": bool,           # Whether voice input was used
                "transcription_method": str,        # Transcription method
                "recording_duration": float,        # Recording duration in seconds
                "confidence": float,                # Recognition accuracy (if available)
                "language": str                     # Voice recognition language used
            }
        }
    """
    
    # Check for OpenAI API key from environment variable if not provided
    if openai_api_key is None and voice_recognition_method == "openai_whisper":
        openai_api_key = os.getenv("OPENAI_API_KEY")
    
    # Default accepted file types
    if accepted_file_types is None:
        accepted_file_types = ["jpg", "jpeg", "png", "gif", "webp"]
    
    # Track "previous value" to achieve 
    if key is None:
        key = "multimodal_chat_input_default"
    
    # Key to track previous value
    last_value_key = f"_last_multimodal_value_{key}"
    
    # Always use st._bottom to fix to the bottom of the screen
    with st._bottom:
        component_value = _component_func(
            placeholder=placeholder,
            max_chars=max_chars,
            disabled=disabled,
            accepted_file_types=accepted_file_types,
            max_file_size_mb=max_file_size_mb,
            enable_voice_input=enable_voice_input,
            voice_recognition_method=voice_recognition_method,
            openai_api_key=openai_api_key,
            voice_language=voice_language,
            max_recording_time=max_recording_time,
            key=key,
            default=None
        )
    
    # Return the value only once when it changes
    if component_value is not None:
        # Compare with previous value (including timestamp to allow duplicate content)
        last_value = st.session_state.get(last_value_key, None)
        
        # Return only when value has changed (timestamp ensures uniqueness)
        if component_value != last_value:
            st.session_state[last_value_key] = component_value
            
            # Remove internal timestamp before returning to user
            result = component_value.copy()
            if '_timestamp' in result:
                del result['_timestamp']
            return result
        
        # Return None if same value
        return None
    
    return None
