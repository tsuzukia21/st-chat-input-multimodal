# Repository Guidelines

## Project Structure & Module Organization
`st_chat_input_multimodal/__init__.py` is the Python entry point and contains the public API, parameter validation, and Whisper transcription flow. `st_chat_input_multimodal/frontend/src/` contains the React/Vite frontend, organized into `components/`, `hooks/`, `utils/`, `types/`, and `constants.ts`. Use `example.py` for local manual testing, `docs/` for reference material, and `.github/workflows/` for CI and release automation. Treat `st_chat_input_multimodal/frontend/build/` as generated output.

## Build, Test, and Development Commands
- `pip install -e ".[dev]"`: install the package with Python dev tools.
- `cd st_chat_input_multimodal/frontend && npm ci`: install frontend dependencies.
- `streamlit run example.py`: launch the demo app locally.
- `cd st_chat_input_multimodal/frontend && npm run build`: run `tsc` and build the Vite bundle.
- `cd st_chat_input_multimodal/frontend && npx tsc --noEmit`: run frontend type checks without emitting files.
- `black --check . && flake8 . && mypy st_chat_input_multimodal/ && pytest --cov=st_chat_input_multimodal --cov-report=xml`: match the Python CI checks.

## Coding Style & Naming Conventions
Python uses 4-space indentation, Black formatting, 88-character lines, and explicit typing on functions (`mypy` disallows untyped defs). Keep Streamlit-facing validation and backend integration in Python. TypeScript/TSX follows the existing 2-space style and Prettier settings in `frontend/.prettierrc` (`semi: false`, `trailingComma: es5`, `endOfLine: lf`). Use PascalCase for React components (`VoiceButton.tsx`), `useXxx` for hooks, camelCase for utilities, and keep Python-facing argument names aligned with Streamlit payload keys.

## Testing Guidelines
Place Python tests under `tests/` using `test_*.py` or `*_test.py`, matching the module under test. Prioritize regression coverage for parameter validation, file upload handling, and transcription error paths. There is no dedicated frontend test runner yet, so every frontend change should at minimum pass `npx tsc --noEmit` and `npm run build`.

## Commit & Pull Request Guidelines
Follow the existing Conventional Commit style seen in history, for example `feat(ui): ...`, `fix(recording): ...`, or `refactor: ...`. Keep PRs focused, describe user-visible behavior, link related issues, and include screenshots or a short GIF for UI changes. Before opening a PR, run the relevant Python checks and the frontend type-check/build locally.

## Security & Configuration Tips
Voice and image features require HTTPS or `localhost`. Never hardcode secrets; use environment variables such as `OPENAI_API_KEY` for local development and CI.
