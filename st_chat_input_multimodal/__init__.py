import base64
import binascii
import hashlib
import logging
import os
from io import BytesIO
from typing import Any, Dict, List, Optional, Tuple

import streamlit as st
import streamlit.components.v1 as components

# Create a _RELEASE constant. We'll set this to False while we're developing
# the component, and True when we're ready to package and distribute it.
# (This is, of course, optional - there are innumerable ways to manage your
# release process.)
_RELEASE = True

_DEFAULT_ACCEPTED_FILE_TYPES = ["jpg", "jpeg", "png", "gif", "webp"]
_DEFAULT_MAX_FILES = 5
_MIN_RECORDING_TIME = 1
_MAX_RECORDING_TIME = 300
_TRANSCRIPTION_REQUEST_TYPE = "transcription_request"
_VALID_VOICE_RECOGNITION_METHODS = {"web_speech", "openai_whisper"}
_AUDIO_FILENAME_BY_MIME_TYPE = {
    "audio/mp4": "recording.m4a",
    "audio/mpeg": "recording.mp3",
    "audio/ogg": "recording.ogg",
    "audio/wav": "recording.wav",
    "audio/webm": "recording.webm",
    "audio/x-m4a": "recording.m4a",
    "audio/x-wav": "recording.wav",
}
_TRANSCRIPTION_NOT_AVAILABLE_MESSAGE = "Voice transcription is not available in this app."
_TRANSCRIPTION_INVALID_AUDIO_MESSAGE = (
    "Recorded audio could not be processed. Please try recording again."
)
_TRANSCRIPTION_TEMPORARY_FAILURE_MESSAGE = (
    "Voice transcription is temporarily unavailable. Please try again."
)
_TRANSCRIPTION_FALLBACK_MESSAGE = "Voice transcription failed. Please try again."
_TRANSCRIPTION_INVALID_AUDIO_STATUS_CODES = {400, 413, 415, 422}
_TRANSCRIPTION_NOT_AVAILABLE_STATUS_CODES = {401, 403, 404}
_TRANSCRIPTION_TEMPORARY_STATUS_CODES = {408, 409, 429}

_LOGGER = logging.getLogger(__name__)

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


def _build_session_state_key(key: str, suffix: str) -> str:
    return f"_st_chat_input_multimodal_{suffix}_{key}"


def _get_transcription_request(value: Any) -> Optional[Dict[str, Any]]:
    if not isinstance(value, dict):
        return None

    if value.get("type") != _TRANSCRIPTION_REQUEST_TYPE:
        return None

    return value


def _get_transcription_request_fingerprint(request: Dict[str, Any]) -> str:
    request_id = str(request.get("request_id", "")).strip()
    if request_id:
        return request_id

    audio_data = request.get("audio_data")
    if not isinstance(audio_data, str) or not audio_data:
        return hashlib.sha256(repr(request).encode("utf-8")).hexdigest()

    return hashlib.sha256(audio_data.encode("utf-8")).hexdigest()


def _decode_audio_data(audio_data: str) -> Tuple[bytes, str]:
    if not audio_data:
        raise ValueError("audio_data is required for transcription")

    mime_type = "audio/webm"
    encoded_audio = audio_data

    if audio_data.startswith("data:"):
        header, separator, encoded_audio = audio_data.partition(",")
        if not separator or not encoded_audio:
            raise ValueError("audio_data is invalid")

        mime_type = header[5:].split(";")[0] or mime_type

    try:
        return base64.b64decode(encoded_audio), mime_type.lower()
    except (ValueError, binascii.Error) as exc:
        raise ValueError("audio_data is invalid") from exc


def _transcribe_audio(
    audio_data: str,
    language: str,
    openai_api_key: str,
) -> str:
    from openai import OpenAI

    audio_bytes, mime_type = _decode_audio_data(audio_data)
    audio_buffer = BytesIO(audio_bytes)
    audio_buffer.name = _AUDIO_FILENAME_BY_MIME_TYPE.get(mime_type, "recording.webm")

    language_code = language.split("-")[0].strip() if language else ""
    client = OpenAI(api_key=openai_api_key)
    response = client.audio.transcriptions.create(
        model="whisper-1",
        file=audio_buffer,
        language=language_code or None,
    )

    return response.text.strip()


def _get_transcription_error_message(exc: Exception) -> str:
    if isinstance(exc, ValueError):
        return _TRANSCRIPTION_INVALID_AUDIO_MESSAGE

    if isinstance(exc, (ImportError, ModuleNotFoundError)):
        return _TRANSCRIPTION_NOT_AVAILABLE_MESSAGE

    status_code = getattr(exc, "status_code", None)
    if status_code in _TRANSCRIPTION_INVALID_AUDIO_STATUS_CODES:
        return _TRANSCRIPTION_INVALID_AUDIO_MESSAGE

    if status_code in _TRANSCRIPTION_NOT_AVAILABLE_STATUS_CODES:
        return _TRANSCRIPTION_NOT_AVAILABLE_MESSAGE

    if status_code in _TRANSCRIPTION_TEMPORARY_STATUS_CODES:
        return _TRANSCRIPTION_TEMPORARY_FAILURE_MESSAGE

    if isinstance(status_code, int) and status_code >= 500:
        return _TRANSCRIPTION_TEMPORARY_FAILURE_MESSAGE

    if isinstance(exc, (ConnectionError, TimeoutError, OSError)):
        return _TRANSCRIPTION_TEMPORARY_FAILURE_MESSAGE

    return _TRANSCRIPTION_FALLBACK_MESSAGE


def _set_transcription_feedback(
    *,
    processed_request_key: str,
    request_fingerprint: str,
    transcription_result_key: str,
    transcription_error_key: str,
    transcription_feedback_id_key: str,
    transcription_result: Optional[str] = None,
    transcription_error: Optional[str] = None,
) -> None:
    st.session_state[processed_request_key] = request_fingerprint
    st.session_state[transcription_feedback_id_key] = request_fingerprint

    if transcription_result is None:
        st.session_state.pop(transcription_result_key, None)
    else:
        st.session_state[transcription_result_key] = transcription_result

    if transcription_error is None:
        st.session_state.pop(transcription_error_key, None)
    else:
        st.session_state[transcription_error_key] = transcription_error


def _is_positive_integer(value: Any) -> bool:
    return isinstance(value, int) and not isinstance(value, bool) and value > 0


def _validate_component_parameters(
    max_chars: Optional[int],
    max_file_size_mb: int,
    max_files: int,
    max_recording_time: int,
    voice_recognition_method: str,
) -> None:
    if max_chars is not None and not _is_positive_integer(max_chars):
        raise ValueError("max_chars must be a positive integer")

    if not _is_positive_integer(max_file_size_mb):
        raise ValueError("max_file_size_mb must be a positive integer")

    if not _is_positive_integer(max_files):
        raise ValueError("max_files must be a positive integer")

    if (
        not isinstance(max_recording_time, int)
        or isinstance(max_recording_time, bool)
        or not _MIN_RECORDING_TIME <= max_recording_time <= _MAX_RECORDING_TIME
    ):
        raise ValueError("max_recording_time must be between 1 and 300")

    if (
        not isinstance(voice_recognition_method, str)
        or voice_recognition_method not in _VALID_VOICE_RECOGNITION_METHODS
    ):
        raise ValueError(
            "voice_recognition_method must be 'web_speech' or 'openai_whisper'"
        )


def multimodal_chat_input(
    placeholder: str = "Type your message here...",
    max_chars: Optional[int] = None,
    disabled: bool = False,
    accepted_file_types: Optional[List[str]] = None,
    max_file_size_mb: int = 10,
    max_files: int = _DEFAULT_MAX_FILES,
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
    max_files : int
        Maximum number of uploaded files
    enable_voice_input : bool
        Whether to enable voice input functionality
    voice_recognition_method : str
        Voice recognition method: "web_speech" or "openai_whisper"
    openai_api_key : str, optional
        OpenAI API key used only on the Python side when openai_whisper is selected.
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

    _validate_component_parameters(
        max_chars=max_chars,
        max_file_size_mb=max_file_size_mb,
        max_files=max_files,
        max_recording_time=max_recording_time,
        voice_recognition_method=voice_recognition_method,
    )
    
    # Check for OpenAI API key from environment variable if not provided
    if openai_api_key is None and voice_recognition_method == "openai_whisper":
        openai_api_key = os.getenv("OPENAI_API_KEY")
    
    # Default accepted file types
    if accepted_file_types is None:
        accepted_file_types = _DEFAULT_ACCEPTED_FILE_TYPES.copy()
    
    # Track "previous value" to achieve 
    if key is None:
        key = "multimodal_chat_input_default"
    
    # Key to track previous value
    last_value_key = f"_last_multimodal_value_{key}"
    transcription_result_key = _build_session_state_key(key, "transcription_result")
    transcription_error_key = _build_session_state_key(key, "transcription_error")
    transcription_feedback_id_key = _build_session_state_key(
        key, "transcription_feedback_id"
    )
    processed_request_key = _build_session_state_key(key, "processed_transcription")
    transcription_result = st.session_state.pop(transcription_result_key, None)
    transcription_error = st.session_state.pop(transcription_error_key, None)
    transcription_feedback_id = st.session_state.pop(transcription_feedback_id_key, None)

    # Always use st._bottom to fix to the bottom of the screen
    with st._bottom:
        component_value = _component_func(
            placeholder=placeholder,
            max_chars=max_chars,
            disabled=disabled,
            accepted_file_types=accepted_file_types,
            max_file_size_mb=max_file_size_mb,
            max_files=max_files,
            enable_voice_input=enable_voice_input,
            voice_recognition_method=voice_recognition_method,
            voice_language=voice_language,
            max_recording_time=max_recording_time,
            transcription_result=transcription_result,
            transcription_error=transcription_error,
            transcription_feedback_id=transcription_feedback_id,
            key=key,
            default=None
        )

    transcription_request = _get_transcription_request(component_value)
    if transcription_request is not None:
        request_fingerprint = _get_transcription_request_fingerprint(
            transcription_request
        )
        processed_request = st.session_state.get(processed_request_key)

        if processed_request == request_fingerprint:
            return None

        if voice_recognition_method != "openai_whisper":
            _set_transcription_feedback(
                processed_request_key=processed_request_key,
                request_fingerprint=request_fingerprint,
                transcription_result_key=transcription_result_key,
                transcription_error_key=transcription_error_key,
                transcription_feedback_id_key=transcription_feedback_id_key,
                transcription_error=_TRANSCRIPTION_NOT_AVAILABLE_MESSAGE,
            )
            st.rerun()

        if not openai_api_key:
            _set_transcription_feedback(
                processed_request_key=processed_request_key,
                request_fingerprint=request_fingerprint,
                transcription_result_key=transcription_result_key,
                transcription_error_key=transcription_error_key,
                transcription_feedback_id_key=transcription_feedback_id_key,
                transcription_error=_TRANSCRIPTION_NOT_AVAILABLE_MESSAGE,
            )
            st.rerun()

        try:
            transcription_text = _transcribe_audio(
                audio_data=str(transcription_request.get("audio_data", "")),
                language=str(transcription_request.get("language", voice_language)),
                openai_api_key=openai_api_key,
            )
        except Exception as exc:
            _LOGGER.exception("Voice transcription failed")
            _set_transcription_feedback(
                processed_request_key=processed_request_key,
                request_fingerprint=request_fingerprint,
                transcription_result_key=transcription_result_key,
                transcription_error_key=transcription_error_key,
                transcription_feedback_id_key=transcription_feedback_id_key,
                transcription_error=_get_transcription_error_message(exc),
            )
            st.rerun()

        _set_transcription_feedback(
            processed_request_key=processed_request_key,
            request_fingerprint=request_fingerprint,
            transcription_result_key=transcription_result_key,
            transcription_error_key=transcription_error_key,
            transcription_feedback_id_key=transcription_feedback_id_key,
            transcription_result=transcription_text,
        )
        st.rerun()

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
