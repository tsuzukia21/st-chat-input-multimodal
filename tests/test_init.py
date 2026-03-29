import base64
import hashlib

import pytest

from st_chat_input_multimodal import (
    _build_session_state_key,
    _decode_audio_data,
    _get_transcription_error_message,
    _get_transcription_request,
    _get_transcription_request_fingerprint,
    _is_positive_integer,
    _validate_component_parameters,
    _TRANSCRIPTION_FALLBACK_MESSAGE,
    _TRANSCRIPTION_INVALID_AUDIO_MESSAGE,
    _TRANSCRIPTION_NOT_AVAILABLE_MESSAGE,
    _TRANSCRIPTION_REQUEST_TYPE,
    _TRANSCRIPTION_TEMPORARY_FAILURE_MESSAGE,
)

# --- _is_positive_integer ---


def test_is_positive_integer_with_positive():
    assert _is_positive_integer(1) is True
    assert _is_positive_integer(100) is True


def test_is_positive_integer_with_zero():
    assert _is_positive_integer(0) is False


def test_is_positive_integer_with_negative():
    assert _is_positive_integer(-1) is False


def test_is_positive_integer_with_bool():
    assert _is_positive_integer(True) is False
    assert _is_positive_integer(False) is False


def test_is_positive_integer_with_float():
    assert _is_positive_integer(1.0) is False
    assert _is_positive_integer(3.5) is False


def test_is_positive_integer_with_string():
    assert _is_positive_integer("1") is False
    assert _is_positive_integer("abc") is False


# --- _validate_component_parameters ---


def _valid_params(**overrides):
    defaults = dict(
        max_chars=None,
        max_file_size_mb=10,
        max_files=5,
        max_recording_time=60,
        voice_recognition_method="web_speech",
    )
    defaults.update(overrides)
    return defaults


def test_validate_valid_params():
    _validate_component_parameters(**_valid_params())
    _validate_component_parameters(**_valid_params(max_chars=100))


def test_validate_invalid_max_chars():
    with pytest.raises(ValueError, match="max_chars"):
        _validate_component_parameters(**_valid_params(max_chars=0))
    with pytest.raises(ValueError, match="max_chars"):
        _validate_component_parameters(**_valid_params(max_chars=-1))
    with pytest.raises(ValueError, match="max_chars"):
        _validate_component_parameters(**_valid_params(max_chars=True))


def test_validate_invalid_max_file_size_mb():
    with pytest.raises(ValueError, match="max_file_size_mb"):
        _validate_component_parameters(**_valid_params(max_file_size_mb=0))
    with pytest.raises(ValueError, match="max_file_size_mb"):
        _validate_component_parameters(**_valid_params(max_file_size_mb=-1))


def test_validate_invalid_max_files():
    with pytest.raises(ValueError, match="max_files"):
        _validate_component_parameters(**_valid_params(max_files=0))
    with pytest.raises(ValueError, match="max_files"):
        _validate_component_parameters(**_valid_params(max_files=-5))


def test_validate_invalid_max_recording_time():
    with pytest.raises(ValueError, match="max_recording_time"):
        _validate_component_parameters(**_valid_params(max_recording_time=0))
    with pytest.raises(ValueError, match="max_recording_time"):
        _validate_component_parameters(**_valid_params(max_recording_time=301))
    with pytest.raises(ValueError, match="max_recording_time"):
        _validate_component_parameters(**_valid_params(max_recording_time=True))


def test_validate_invalid_voice_recognition_method():
    with pytest.raises(ValueError, match="voice_recognition_method"):
        _validate_component_parameters(
            **_valid_params(voice_recognition_method="invalid")
        )
    with pytest.raises(ValueError, match="voice_recognition_method"):
        _validate_component_parameters(**_valid_params(voice_recognition_method=""))


# --- _decode_audio_data ---


def test_decode_audio_data_empty_string():
    with pytest.raises(ValueError, match="audio_data is required"):
        _decode_audio_data("")


def test_decode_audio_data_valid_base64_with_data_uri():
    raw = b"hello audio"
    encoded = base64.b64encode(raw).decode()
    data_uri = f"data:audio/mp4;base64,{encoded}"
    audio_bytes, mime_type = _decode_audio_data(data_uri)
    assert audio_bytes == raw
    assert mime_type == "audio/mp4"


def test_decode_audio_data_valid_base64_without_data_uri():
    raw = b"raw audio bytes"
    encoded = base64.b64encode(raw).decode()
    audio_bytes, mime_type = _decode_audio_data(encoded)
    assert audio_bytes == raw
    assert mime_type == "audio/webm"  # default


def test_decode_audio_data_invalid_base64():
    with pytest.raises(ValueError, match="audio_data is invalid"):
        _decode_audio_data("not-valid-base64!!!")


def test_decode_audio_data_malformed_data_uri():
    with pytest.raises(ValueError, match="audio_data is invalid"):
        _decode_audio_data("data:audio/mp4;base64")


# --- _get_transcription_error_message ---


def test_error_message_value_error():
    assert (
        _get_transcription_error_message(ValueError("bad"))
        == _TRANSCRIPTION_INVALID_AUDIO_MESSAGE
    )


def test_error_message_import_error():
    assert (
        _get_transcription_error_message(ImportError("no module"))
        == _TRANSCRIPTION_NOT_AVAILABLE_MESSAGE
    )


def test_error_message_status_400():
    exc = Exception("bad request")
    exc.status_code = 400  # type: ignore[attr-defined]
    assert _get_transcription_error_message(exc) == _TRANSCRIPTION_INVALID_AUDIO_MESSAGE


def test_error_message_status_401():
    exc = Exception("unauthorized")
    exc.status_code = 401  # type: ignore[attr-defined]
    assert _get_transcription_error_message(exc) == _TRANSCRIPTION_NOT_AVAILABLE_MESSAGE


def test_error_message_status_408():
    exc = Exception("timeout")
    exc.status_code = 408  # type: ignore[attr-defined]
    assert (
        _get_transcription_error_message(exc)
        == _TRANSCRIPTION_TEMPORARY_FAILURE_MESSAGE
    )


def test_error_message_status_500_plus():
    exc = Exception("server error")
    exc.status_code = 500  # type: ignore[attr-defined]
    assert (
        _get_transcription_error_message(exc)
        == _TRANSCRIPTION_TEMPORARY_FAILURE_MESSAGE
    )

    exc2 = Exception("server error")
    exc2.status_code = 503  # type: ignore[attr-defined]
    assert (
        _get_transcription_error_message(exc2)
        == _TRANSCRIPTION_TEMPORARY_FAILURE_MESSAGE
    )


def test_error_message_connection_error():
    assert (
        _get_transcription_error_message(ConnectionError())
        == _TRANSCRIPTION_TEMPORARY_FAILURE_MESSAGE
    )


def test_error_message_timeout_error():
    assert (
        _get_transcription_error_message(TimeoutError())
        == _TRANSCRIPTION_TEMPORARY_FAILURE_MESSAGE
    )


def test_error_message_generic_exception():
    assert (
        _get_transcription_error_message(Exception("unknown"))
        == _TRANSCRIPTION_FALLBACK_MESSAGE
    )


# --- _get_transcription_request ---


def test_get_transcription_request_non_dict():
    assert _get_transcription_request("string") is None
    assert _get_transcription_request(42) is None
    assert _get_transcription_request(None) is None


def test_get_transcription_request_dict_without_type():
    assert _get_transcription_request({"audio_data": "abc"}) is None


def test_get_transcription_request_dict_wrong_type():
    assert _get_transcription_request({"type": "wrong"}) is None


def test_get_transcription_request_dict_correct_type():
    req = {"type": _TRANSCRIPTION_REQUEST_TYPE, "audio_data": "abc"}
    assert _get_transcription_request(req) is req


# --- _get_transcription_request_fingerprint ---


def test_fingerprint_with_request_id():
    result = _get_transcription_request_fingerprint({"request_id": "abc123"})
    assert result == "abc123"


def test_fingerprint_without_request_id_with_audio_data():
    audio = "some_audio_data"
    expected = hashlib.sha256(audio.encode("utf-8")).hexdigest()
    result = _get_transcription_request_fingerprint({"audio_data": audio})
    assert result == expected


def test_fingerprint_without_request_id_or_audio_data():
    req = {"foo": "bar"}
    expected = hashlib.sha256(repr(req).encode("utf-8")).hexdigest()
    result = _get_transcription_request_fingerprint(req)
    assert result == expected


# --- _build_session_state_key ---


def test_build_session_state_key():
    result = _build_session_state_key("my_key", "suffix")
    assert result == "_st_chat_input_multimodal_suffix_my_key"
