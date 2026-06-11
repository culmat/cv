# CV Site (11ty + Bun)

## Commands

```bash
bun i
bun validate:content
bun dev
```

## Build and print smoke test

```bash
bun run build
bun print:smoke
```

The web CV is available at `/` and the print optimized version at `/print/`.

## Link checking

- `bun run check:links` — internal links/assets against built `dist/` (resolves the
  `/cv` path prefix). Fast, deterministic, offline. **Blocking** locally and in CI.
- `bun run check:links:external` — reachability of `http(s)` URLs found in `dist/`.
  Network-dependent; run **locally** (residential IP avoids the bot-blocking that
  datacenter CI IPs hit). Edit `IGNORED_HOSTS` in
  [scripts/check-links-external.mjs](scripts/check-links-external.mjs) for hosts that
  block bots (LinkedIn, Stack Overflow, …).

Run the whole local suite with `bun run check`.

## Validation: where each check runs

| Check | Ad hoc | Pre-push hook | CI (deploy) |
| --- | --- | --- | --- |
| `bun test` | ✓ | ✓ | — |
| `validate:content` | ✓ | ✓ | ✓ |
| `check:links` (internal) | ✓ | ✓ (blocking) | ✓ |
| `check:links:external` | ✓ | ✓ (warn-only) | — (datacenter IPs get bot-blocked) |
| `print:smoke` | ✓ | — (needs Chromium) | ✓ |

Enable the pre-push hook once (it lives in `.githooks/` and is excluded by default):

```bash
git config core.hooksPath .githooks
```
