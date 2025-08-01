"""Pytest configuration and fixtures for testing."""

import pytest
from unittest.mock import Mock, patch


@pytest.fixture
def mock_streamlit():
    """Fixture that provides a mocked streamlit module."""
    with patch("st_chat_input_multimodal.st") as mock_st:
        # Mock _bottom context manager
        mock_st._bottom = Mock()
        mock_st._bottom.__enter__ = Mock(return_value=Mock())
        mock_st._bottom.__exit__ = Mock(return_value=None)
        
        # Mock session_state
        mock_st.session_state = {}
        
        yield mock_st


@pytest.fixture
def mock_component_func():
    """Fixture that provides a mocked component function."""
    with patch("st_chat_input_multimodal._component_func") as mock_func:
        mock_func.return_value = None
        yield mock_func


@pytest.fixture
def sample_component_data():
    """Fixture that provides sample component return data."""
    return {
        "text": "Hello, world!",
        "files": [
            {
                "name": "test.jpg",
                "type": "image/jpeg",
                "size": 12345,
                "data": "data:image/jpeg;base64,/9j/4AAQSkZJRgABA..."
            }
        ],
        "audio_metadata": {
            "used_voice_input": True,
            "transcription_method": "web_speech",
            "recording_duration": 2.5,
            "confidence": 0.95,
            "language": "en-US"
        },
        "_timestamp": 1640995200000
    }