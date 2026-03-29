# Tasks: コードリファクタリングとセキュリティ強化

**入力**: `/specs/001-code-refactor-security/` の設計ドキュメント
**前提**: plan.md, spec.md, research.md, data-model.md, contracts/component-api.md

**テスト**: 仕様書でテストフレームワークが未導入と記載されているため、テストタスクは含まない。ビルド検証で品質を担保する。

**構成**: タスクはユーザーストーリー単位で整理し、独立した実装・テストを可能にする。

## フォーマット: `[ID] [P?] [Story] 説明`

- **[P]**: 並列実行可能（異なるファイル、依存関係なし）
- **[Story]**: 対応するユーザーストーリー（US1, US2, US3, US4）
- ファイルパスは正確に記載

## Phase 1: セットアップ（共通基盤ファイル作成）

**目的**: 複数のユーザーストーリーが依存する新規ファイルの作成

- [X] T001 [P] 型定義を拡張: Web Speech API型、TranscriptionRequest、ErrorState を `st_chat_input_multimodal/frontend/src/types/index.ts` に追加
- [X] T002 [P] レイアウト定数・設定値モジュールを新規作成 `st_chat_input_multimodal/frontend/src/constants.ts`
- [X] T003 [P] エラーハンドリングユーティリティを新規作成 `st_chat_input_multimodal/frontend/src/utils/errorUtils.ts`（本番ログ抑制含む）
- [X] T004 [P] インラインエラー表示コンポーネントを新規作成 `st_chat_input_multimodal/frontend/src/components/ErrorMessage.tsx`
- [X] T004A [P] Python/TypeScript 境界のコンポーネント設定を camelCase に正規化 `st_chat_input_multimodal/frontend/src/MyComponent.tsx`

**チェックポイント**: 新規ファイルが作成され、TypeScriptコンパイルが通ること

---

## Phase 2: ユーザーストーリー 1 - APIキーの保護 (P1)

**ゴール**: OpenAI APIキーをブラウザに露出させず、サーバー側で文字起こしを処理する

**独立テスト**: ブラウザDevToolsでネットワークタブとJSソースを確認し、APIキーが表示されないことを検証

### 実装

- [X] T005 [US1] `st_chat_input_multimodal/__init__.py` から `openai_api_key` をフロントエンドargsに送信する処理を削除し、Python側のみで保持するよう変更
- [X] T006 [US1] `st_chat_input_multimodal/__init__.py` にサーバー側OpenAI Whisper文字起こし処理を実装（音声データ受信→API呼び出し→結果をargsで返却）
- [X] T007 [US1] `st_chat_input_multimodal/frontend/src/utils/audioUtils.ts` からOpenAI API直接呼び出しを削除し、Base64音声データをsetComponentValue経由で送信するよう変更
- [X] T008 [US1] `st_chat_input_multimodal/frontend/src/hooks/useVoiceRecording.ts` でWhisperモード時にサーバー側文字起こしフローを使用するよう更新
- [X] T009 [US1] `st_chat_input_multimodal/frontend/src/types/index.ts` のComponentArgsから `openaiApiKey` を削除し、`transcriptionResult` と `maxFiles` を追加

**チェックポイント**: 音声文字起こしがサーバー側で動作し、ブラウザにAPIキーが露出しないこと

---

## Phase 3: ユーザーストーリー 2 - 入力バリデーションと安全なデータ処理 (P1)

**ゴール**: ファイルのMIMEタイプ検証、ファイル数制限、ファイル名サニタイズ、パラメータバリデーションを実装

**独立テスト**: 偽装拡張子ファイル、上限超過ファイル数、特殊文字ファイル名、無効パラメータでそれぞれ適切にエラーが返ることを検証

### 実装

- [X] T010 [P] [US2] `st_chat_input_multimodal/frontend/src/utils/fileUtils.ts` にマジックバイト検証関数を追加（JPEG: FF D8 FF、PNG: 89 50 4E 47、GIF: 47 49 46、WebP: 52 49 46 46...57 45 42 50）
- [X] T011 [P] [US2] `st_chat_input_multimodal/frontend/src/utils/fileUtils.ts` にファイル名サニタイズ関数を追加（<, >, ", ', &, /, \, \0 を除去/エスケープ）
- [X] T012 [US2] `st_chat_input_multimodal/frontend/src/hooks/useFileUpload.ts` に `maxFiles` パラメータによるファイル数制限チェックを追加
- [X] T013 [US2] `st_chat_input_multimodal/frontend/src/components/FilePreview.tsx` でファイル名表示時にサニタイズ関数を適用
- [X] T014 [US2] `st_chat_input_multimodal/__init__.py` にパラメータバリデーションを追加（max_chars, max_file_size_mb, max_files, max_recording_time, voice_recognition_method の範囲チェックとValueError）
- [X] T015 [US2] `st_chat_input_multimodal/__init__.py` に `max_files` パラメータを関数シグネチャに追加（デフォルト5、フロントエンドargsに送信）

**チェックポイント**: 各バリデーションが正しく動作し、不正入力が適切なエラーメッセージで拒否されること

---

## Phase 4: ユーザーストーリー 3 - コード保守性の向上 (P2)

**ゴール**: any型の排除、マジックナンバーの定数化、一貫したエラーハンドリングパターンの適用

**独立テスト**: `npx tsc --noEmit` でany型エラーがゼロ、コードレビューでマジックナンバーと`alert()`が存在しないこと

### 実装

- [X] T016 [P] [US3] `st_chat_input_multimodal/frontend/src/hooks/useVoiceRecording.ts` の `any` 型をWeb Speech API適切な型に置換（lines 32, 75等）
- [X] T017 [P] [US3] `st_chat_input_multimodal/frontend/src/utils/audioUtils.ts` の戻り値型 `any` を適切な型に置換（line 20）
- [X] T018 [US3] `st_chat_input_multimodal/frontend/src/MyComponent.tsx` のマジックナンバー（46px, 40px, 45px, 320px, 400px, 5px, 100ms, 150ms等）を `constants.ts` の定数参照に置換
- [X] T019 [US3] `st_chat_input_multimodal/frontend/src/hooks/useStyles.ts` のマジックナンバーを `constants.ts` の定数参照に置換
- [X] T020 [US3] `st_chat_input_multimodal/frontend/src/hooks/useVoiceRecording.ts` の `alert()` 呼び出し（lines 99, 178）をErrorMessageコンポーネント連携に置換
- [X] T021 [US3] `st_chat_input_multimodal/frontend/src/utils/fileUtils.ts` の `alert()` 呼び出し（line 77）をエラーコールバック方式に置換
- [X] T022 [US3] `st_chat_input_multimodal/frontend/src/MyComponent.tsx` にErrorMessageコンポーネントを統合し、エラーステート管理を追加

**チェックポイント**: `npx tsc --noEmit` が成功し、プロダクションコードにany型・マジックナンバー・alert()が存在しないこと

---

## Phase 5: ユーザーストーリー 4 - リソースのクリーンアップとメモリ安全性 (P2)

**ゴール**: コンポーネントアンマウント時にすべてのメディアリソースとタイマーを確実に解放する

**独立テスト**: 音声録音を開始→コンポーネントをアンマウント→マイクアクセスが解放されメディアトラックが残っていないことを確認

### 実装

- [X] T023 [US4] `st_chat_input_multimodal/frontend/src/hooks/useVoiceRecording.ts` にuseEffectクリーンアップ関数を追加（MediaStream全トラック停止、clearInterval、MediaRecorder停止、audioChunksクリア）
- [X] T024 [US4] `st_chat_input_multimodal/frontend/src/hooks/useVoiceRecording.ts` でSpeechRecognitionインスタンスのstop/abortをクリーンアップに追加
- [X] T025 [US4] `st_chat_input_multimodal/frontend/src/utils/errorUtils.ts` に本番ビルド判定によるconsole.error抑制ロジックを実装

**チェックポイント**: コンポーネントのマウント・アンマウントを繰り返してもリソースリークが発生しないこと

---

## Phase 6: 仕上げとクロスカッティング

**目的**: 全ストーリーにまたがる品質確認と最終調整

- [X] T026 [P] TypeScript型チェック実行: `cd st_chat_input_multimodal/frontend && npx tsc --noEmit` でエラーがゼロであることを確認
- [X] T027 [P] フロントエンドビルド実行: `cd st_chat_input_multimodal/frontend && npm run build` が成功することを確認
- [X] T028 未使用のエクスポート・デッドコードを確認し削除
- [X] T029 全ファイルの変更をレビューし、内部システム詳細がユーザーに露出するエラーメッセージがないことを確認
- [X] T030 バージョン管理方針を整理し、`2.0.0` リリースに向けて正本バージョンの管理方法と更新対象（`setup.py`, `st_chat_input_multimodal/frontend/package.json`, `st_chat_input_multimodal/frontend/package-lock.json`）を統一する

---

## 依存関係と実行順序

### フェーズ依存関係

- **Phase 1（セットアップ）**: 依存なし - 即座に開始可能。T001〜T004は全て並列実行可能
- **Phase 2（US1: APIキー保護）**: Phase 1のT001（型定義）に依存
- **Phase 3（US2: 入力バリデーション）**: Phase 1のT001（型定義）に依存。US1と並列実行可能
- **Phase 4（US3: コード保守性）**: Phase 1のT002, T003, T004に依存。US1/US2完了後が望ましい（同一ファイルの競合回避）
- **Phase 5（US4: リソースクリーンアップ）**: Phase 1のT003に依存。US3と並列実行可能（異なる関心事）
- **Phase 6（仕上げ）**: 全ユーザーストーリー完了後

### ユーザーストーリー依存関係

- **US1 (P1)**: Phase 1完了後に開始可能。他ストーリーに依存しない
- **US2 (P1)**: Phase 1完了後に開始可能。US1と独立して実装可能
- **US3 (P2)**: Phase 1完了後に開始可能だが、US1/US2で変更されるファイルと重複するため、US1/US2完了後の実行を推奨
- **US4 (P2)**: Phase 1完了後に開始可能。US3と並列実行可能

### 並列実行の機会

- Phase 1: T001, T002, T003, T004 を全て並列実行
- Phase 2 & 3: US1とUS2は異なるファイルを主に変更するため並列実行可能（ただし`__init__.py`は順次）
- Phase 4: T016とT017は異なるファイルのため並列実行可能
- Phase 6: T026とT027は並列実行可能

---

## 並列実行例: Phase 1

```bash
# セットアップファイル4つを同時に作成:
Task: "型定義を拡張 in types/index.ts"
Task: "定数モジュールを作成 in constants.ts"
Task: "エラーユーティリティを作成 in errorUtils.ts"
Task: "ErrorMessageコンポーネントを作成 in ErrorMessage.tsx"
```

## 並列実行例: US1 + US2（P1ストーリー）

```bash
# US1とUS2を並行して進行:
# US1: audioUtils.ts, useVoiceRecording.ts の変更
# US2: fileUtils.ts, useFileUpload.ts, FilePreview.tsx の変更
# 注意: __init__.py は両ストーリーで変更があるため順次実行
```

---

## 実装戦略

### MVP優先（US1のみ）

1. Phase 1: セットアップ完了
2. Phase 2: US1（APIキー保護）完了
3. **検証**: ブラウザDevToolsでAPIキー露出がないことを確認
4. デプロイ/デモ可能

### 段階的デリバリー

1. Phase 1 完了 → 基盤準備完了
2. US1 完了 → APIキー保護達成（MVP!）
3. US2 完了 → 入力バリデーション達成
4. US3 完了 → コード品質向上
5. US4 完了 → リソース安全性達成
6. Phase 6 完了 → 全体品質確認

### 推奨実行順序（単独開発者）

Phase 1 → US1 → US2 → US3 → US4 → Phase 6

---

## ノート

- [P] タスク = 異なるファイル、依存関係なし
- [Story] ラベルはタスクを特定のユーザーストーリーに紐づける
- 各ユーザーストーリーは独立して完了・テスト可能
- タスクまたは論理的グループごとにコミット
- チェックポイントで独立して検証可能
- `__init__.py` はUS1とUS2の両方で変更があるため、同一ファイルの競合に注意
