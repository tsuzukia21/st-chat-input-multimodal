# Streamlit Multimodal Chat Input

Streamlitのマルチモーダル対応チャット入力コンポーネントです。テキスト入力、画像アップロード、音声入力が可能です。

## 特徴

- 📝 **テキスト入力**: st.chat_inputと同様の操作性
- 🖼️ **画像ファイルアップロード**: jpg, png, gif, webp対応
- 🎤 **音声入力**: Web Speech API / OpenAI Whisper API対応
- 🎨 **Streamlit標準テーマ**: 完全対応デザイン
- 🔄 **Drag & Drop**: ファイルのドラッグ&ドロップ対応
- ⌨️ **Ctrl+V**: クリップボードからの画像貼り付け
- ⚙️ **カスタマイズ可能**: 豊富な設定オプション

## インストール

```bash
pip install st-chat-input-multimodal
```

## 基本的な使用方法

```python
import streamlit as st
from st_chat_input_multimodal import multimodal_chat_input

# 基本的な使用法
result = multimodal_chat_input()

if result:
    # テキスト表示
    if result['text']:
        st.write(f"テキスト: {result['text']}")
    
    # アップロードされたファイルを表示
    if result['files']:
        for file in result['files']:
            import base64
            base64_data = file['data'].split(',')[1]
            image_bytes = base64.b64decode(base64_data)
            st.image(image_bytes, caption=file['name'])
    
    # 音声入力メタデータの表示
    if result.get('audio_metadata'):
        st.write(f"音声入力使用: {result['audio_metadata']['used_voice_input']}")
```

## 高度な使用方法

### 音声入力機能

```python
# 音声入力を有効化
result = multimodal_chat_input(
    enable_voice_input=True,
    voice_recognition_method="web_speech",  # or "openai_whisper"
    voice_language="ja-JP",
    max_recording_time=60
)

# OpenAI Whisper APIを使用する場合
result = multimodal_chat_input(
    enable_voice_input=True,
    voice_recognition_method="openai_whisper",
    openai_api_key="sk-your-api-key",
    voice_language="ja-JP"
)
```

### カスタム設定

```python
result = multimodal_chat_input(
    placeholder="メッセージを入力してください...",
    max_chars=500,
    accepted_file_types=["jpg", "png", "gif", "webp"],
    max_file_size_mb=10,
    disabled=False,
    key="custom_chat_input"
)
```

## ライセンス

MIT License

## 作者

tsuzukia21