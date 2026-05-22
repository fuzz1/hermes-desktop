# Hermes Desktop Architecture Remediation

This document tracks the nine architecture issues found in the desktop review,
the intended fix for each one, and the evidence required before considering the
item closed.

## Scope

The target architecture is:

- The renderer only talks to a narrow, typed preload API.
- The main process owns secrets, filesystem access, and process control.
- Normal chat uses the Hermes Gateway API contract. CLI execution is reserved
  for install, update, diagnostics, and explicit maintenance tasks.
- Hermes Agent file formats are accessed through small, tested adapters so
  schema changes are localized.

## Remediation Matrix

| # | Issue | Fix | Verification |
|---|---|---|---|
| 1 | Desktop depends directly on Hermes Agent internals | Concentrate agent paths, commands, and gateway contract in main-process adapters. Backend URL/mode resolution now lives in `src/main/hermes-backend.ts`; YAML mutation lives in `src/main/yaml-edit.ts`; secrets are mediated by `config.ts` public/private APIs. | `tests/hermes-backend.test.ts`, `tests/yaml-edit.test.ts`, and full `npm test`. |
| 2 | Main process has too many responsibilities | Move high-risk behavior behind service boundaries: config/secrets, backend transport, chat abort management, YAML editing, and gateway runtime state. `index.ts` still owns IPC registration, but the stateful/high-risk pieces are delegated. | `tests/chat-aborts.test.ts`, `tests/hermes-backend.test.ts`, `tests/yaml-edit.test.ts`, plus IPC surface tests. |
| 3 | Gateway API and CLI fallback behave differently | Make Gateway API the normal chat path. Do not silently fall back to CLI for chat because attachments, history, and sessions differ. | Tests prove local chat reports gateway unavailability instead of spawning CLI unless explicitly enabled. |
| 4 | Secrets exposed to renderer | Expose redacted env values to renderer. Keep full values in the main process. Avoid writing redacted placeholders back to disk. | Tests prove public env contains no raw key and redacted values are not persisted. |
| 5 | YAML writes use fragile string surgery | Isolate scalar YAML editing in `src/main/yaml-edit.ts`, remove the old duplicated config writer path, and keep model/platform-specific writers covered by existing tests. | `tests/yaml-edit.test.ts`, `tests/config-value-paths.test.ts`, `tests/config-model-block.test.ts`, full `npm test`. |
| 6 | Gateway process lifecycle is fragile | Track gateway process ownership in a runtime state object with app-owned flag, profile, startedAt, process presence, pid-file validation, and profile-scoped API health cache. | `tests/remote-mode-url-and-spawn.test.ts`, full `npm test`. |
| 7 | Profile isolation is incomplete | Key gateway health by backend/profile and key chat abort handles by profile/session via `ChatAbortRegistry`. | `tests/hermes-backend.test.ts`, `tests/chat-aborts.test.ts`, full `npm test`. |
| 8 | Installer depends on unpinned remote scripts | Pin the agent install source to a version/ref and expose the ref in code. Support override for development. | Tests assert installer URL uses the pinned ref, not a floating `main` URL. |
| 9 | Electron attack surface remains broad | Keep sandbox/contextIsolation. Prefer HTTPS external links and constrain webview usage to loopback development surfaces. | Security tests for URL allowlists and webview hardening. |

## Implementation Evidence

The remediation pass closes the highest-risk runtime items:

- public env reads are redacted before crossing IPC;
- redacted placeholders are ignored by env writers;
- credential-pool secrets are redacted before crossing IPC;
- chat no longer silently changes behavior by falling back to CLI when the
  local Gateway is unavailable;
- the installer script ref is centralized so it can be pinned and audited.
- backend mode/URL/cache-key resolution is centralized in `hermes-backend`;
- chat aborts are scoped to profile/session instead of one global handle;
- YAML scalar edits are centralized in `yaml-edit`;
- Electron tests use a Vitest Electron mock so main-process unit tests do not
  depend on a downloaded Electron binary.

Verification commands:

```powershell
npm run typecheck
npm test
```
