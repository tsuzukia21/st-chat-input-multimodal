"""Tests for the multimodal chat input component."""

import os
import pytest
from unittest.mock import Mock, patch, MagicMock
from st_chat_input_multimodal import multimodal_chat_input


class TestMultimodalChatInput:
    """Test class for multimodal_chat_input function."""

    def test_import_success(self):
        """Test that the module can be imported successfully."""
        assert multimodal_chat_input is not None

    @patch("st_chat_input_multimodal.st")
    @patch("st_chat_input_multimodal._component_func")
    def test_basic_functionality(self, mock_component, mock_st):
        """Test basic functionality of the component."""
        # Mock streamlit's _bottom context manager
        mock_st._bottom = MagicMock()
        mock_st.session_state = {}

        # Mock component function return value
        mock_component.return_value = None

        # Call the function with default parameters
        result = multimodal_chat_input()

        # Should return None when component returns None
        assert result is None

    @patch("st_chat_input_multimodal.st")
    @patch("st_chat_input_multimodal._component_func")
    def test_component_return_value(self, mock_component, mock_st):
        """Test that component properly processes return values."""
        # Mock streamlit's _bottom context manager and session state
        mock_st._bottom = MagicMock()
        mock_st.session_state = {}

        # Mock component function return value with timestamp
        test_data = {
            "text": "test message",
            "files": [],
            "audio_metadata": {
                "used_voice_input": False,
                "transcription_method": None,
                "recording_duration": 0,
                "confidence": None,
                "language": "ja-JP"
            },
            "_timestamp": 12345
        }
        mock_component.return_value = test_data

        # Call the function
        result = multimodal_chat_input(key="test_key")

        # Should return data without internal timestamp
        expected_result = test_data.copy()
        del expected_result["_timestamp"]
        assert result == expected_result

    @patch("st_chat_input_multimodal.st")
    @patch("st_chat_input_multimodal._component_func")
    def test_duplicate_submission_handling(self, mock_component, mock_st):
        """Test that duplicate submissions are handled correctly."""
        # Mock streamlit's _bottom context manager and session state
        mock_st._bottom = MagicMock()
        mock_st.session_state = {}

        test_data = {
            "text": "test message",
            "files": [],
            "audio_metadata": {
                "used_voice_input": False,
                "transcription_method": None,
                "recording_duration": 0,
                "confidence": None,
                "language": "ja-JP"
            },
            "_timestamp": 12345
        }
        mock_component.return_value = test_data

        # First call should return the data
        result1 = multimodal_chat_input(key="test_key")
        assert result1 is not None

        # Second call with same data should return None
        result2 = multimodal_chat_input(key="test_key")
        assert result2 is None

    def test_default_file_types(self):
        """Test that default file types are set correctly."""
        with patch("st_chat_input_multimodal.st") as mock_st, \
             patch("st_chat_input_multimodal._component_func") as mock_component:
            
            mock_st._bottom = MagicMock()
            mock_st.session_state = {}
            mock_component.return_value = None

            multimodal_chat_input()

            # Check that component was called with default file types
            args, kwargs = mock_component.call_args
            assert kwargs["accepted_file_types"] == ["jpg", "jpeg", "png", "gif", "webp"]

    def test_openai_api_key_from_env(self):
        """Test OpenAI API key retrieval from environment variable."""
        with patch("st_chat_input_multimodal.st") as mock_st, \
             patch("st_chat_input_multimodal._component_func") as mock_component, \
             patch.dict(os.environ, {"OPENAI_API_KEY": "test_key"}):
            
            mock_st._bottom = MagicMock()
            mock_st.session_state = {}
            mock_component.return_value = None

            multimodal_chat_input(voice_recognition_method="openai_whisper")

            # Check that component was called with API key from environment
            args, kwargs = mock_component.call_args
            assert kwargs["openai_api_key"] == "test_key"

    def test_component_parameters(self):
        """Test that all parameters are passed correctly to the component."""
        with patch("st_chat_input_multimodal.st") as mock_st, \
             patch("st_chat_input_multimodal._component_func") as mock_component:
            
            mock_st._bottom = MagicMock()
            mock_st.session_state = {}
            mock_component.return_value = None

            # Call with custom parameters
            multimodal_chat_input(
                placeholder="Custom placeholder",
                max_chars=500,
                disabled=True,
                accepted_file_types=["jpg", "png"],
                max_file_size_mb=5,
                enable_voice_input=True,
                voice_recognition_method="web_speech",
                voice_language="en-US",
                max_recording_time=30,
                key="custom_key"
            )

            # Verify all parameters were passed correctly
            args, kwargs = mock_component.call_args
            assert kwargs["placeholder"] == "Custom placeholder"
            assert kwargs["max_chars"] == 500
            assert kwargs["disabled"] is True
            assert kwargs["accepted_file_types"] == ["jpg", "png"]
            assert kwargs["max_file_size_mb"] == 5
            assert kwargs["enable_voice_input"] is True
            assert kwargs["voice_recognition_method"] == "web_speech"
            assert kwargs["voice_language"] == "en-US"
            assert kwargs["max_recording_time"] == 30
            assert kwargs["key"] == "custom_key"