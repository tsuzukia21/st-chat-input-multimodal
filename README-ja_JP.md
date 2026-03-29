# Demo

![Demo](./demo.gif)

# Streamlit Multimodal Chat Input

Streamlitのマルチモーダル対応チャット入力コンポーネントです。テキスト入力、画像アップロード、音声入力が可能です。

> **注意**: 音声機能と画像機能はHTTPS環境またはlocalhost環境での動作が必要です。

## 特徴

- 📝 **テキスト入力**: st.chat_inputと同様の操作性
- 🖼️ **画像ファイルアップロード**: jpg, png, gif, webp対応
- 🎤 **音声入力**: Web Speech API / OpenAI Whisper API対応
- 🔒 **入力バリデーション**: ファイル数、ファイルサイズ、各種パラメータを検証
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

#### 音声文字起こしエラーハンドリング

実行時の音声文字起こし失敗は、バックエンド例外の詳細をそのまま見せず、インラインの安全なメッセージへ変換されます。

- `Voice transcription is not available in this app.`: 現在のアプリ設定では Whisper 文字起こしを利用できない場合
- `Recorded audio could not be processed. Please try recording again.`: 録音データが不正または読み取れなかった場合
- `Voice transcription is temporarily unavailable. Please try again.`: API またはネットワークの一時的な失敗
- `Voice transcription failed. Please try again.`: 想定外の実行時エラーに対する最終フォールバック

一方で、`multimodal_chat_input(...)` 呼び出し時のパラメータバリデーションは、設定ミスを早く検知できるよう `ValueError` のまま維持しています。

### カスタム設定

```python
result = multimodal_chat_input(
    placeholder="メッセージを入力してください...",
    max_chars=500,
    accepted_file_types=["jpg", "png", "gif", "webp"],
    max_file_size_mb=10,
    max_files=5,
    disabled=False,
    key="custom_chat_input"
)
```

`max_chars`、`max_file_size_mb`、`max_files` は正の整数である必要があります。`max_recording_time` は `1` から `300` の範囲、`voice_recognition_method` は `"web_speech"` または `"openai_whisper"` のみ指定できます。

### Chatでの使用方法


```python
import streamlit as st
import base64
from st_chat_input_multimodal import multimodal_chat_input

# ページ設定
st.set_page_config(
    page_title="マルチモーダルチャット入力デモ",
    page_icon="💬",
    layout="wide"
)

st.subheader("💭 マルチモーダルチャット入力デモ")
st.markdown("音声入力とファイルアップロード機能付きのチャットアプリケーションをシミュレートします。")

# セッション状態でチャット履歴を管理
if "chat_history" not in st.session_state:
    st.session_state.chat_history = []

# 新しいメッセージの入力
chat_result = multimodal_chat_input(
    placeholder="チャットメッセージを入力してください...",
    enable_voice_input=True,  # チャットでも音声入力を有効にする
    key="chat_input"
)
if chat_result:
    st.session_state.chat_history.append(chat_result)

# チャット履歴を表示
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
            
            # 音声入力情報を表示
            if message.get("audio_metadata") and message["audio_metadata"]["used_voice_input"]:
                st.caption(f"🎤 Voice input ({message['audio_metadata']['transcription_method']})")


# 履歴をクリア
if st.button("履歴をクリア"):
    st.session_state.chat_history = []
    st.rerun()

```

### チャットアプリ例

![tsuzukia21/streamlit-chatbot](https://github.com/tsuzukia21/streamlit-chatbot)

## ライセンス

MIT License

## 作者

tsuzukia21
