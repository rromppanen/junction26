# junction26

> **Punchline:** _TBD (one sentence a judge remembers)_

Our Junction 2026 project (Hype Arena, Espoo, 13–15 Nov 2026).
Theme: *European Tech Renaissance*, where idealism meets caution in shaping tomorrow's technology and society.

## Submission fields

Keep this section current. On Sunday morning it becomes the submission form text.

| Field | Value |
| --- | --- |
| Name | _TBD_ |
| Punchline | _TBD_ |
| Challenge(s) | _TBD (one project can go to several challenges)_ |
| Technologies | _TBD_ |
| Demo link | _TBD_ |
| Source link | https://github.com/rromppanen/junction26 |
| Pitch deck (PDF) | [`docs/pitch/`](docs/pitch/) |
| Pitch video (max 2:00) | _TBD_ |

## Description

_TBD: problem, who is affected, what we built, how it works, what's next._

## Run locally

_TBD once the stack is chosen. Add the exact commands and note them in [`.agents/repository-map.md`](.agents/repository-map.md)._

## Scopus (academic literature) via MCP

[`.mcp.json`](.mcp.json) connects Claude Code to Elsevier Scopus through [scopus-mcp](https://github.com/qwe4559999/scopus-mcp) (MIT license). Tools: `search_scopus`, `get_abstract_details`, `get_author_profile`, `get_citing_papers`, `get_quota_status`.

1. Install [`uv`](https://docs.astral.sh/uv/).
2. Get an API key at <https://dev.elsevier.com/>. A university email works best, and full abstracts may need the Aalto network or VPN.
3. Run `cp .env.example .env` and set `SCOPUS_API_KEY` in `.env`.
4. Start Claude Code in this folder and approve the `scopus` server when it asks.

The config pins a reviewed commit and pins `mcp<2`, because the server crashes with MCP SDK 2.x. Responses are cached in `~/.cache/scopus-mcp`.

## Team

_TBD: names and roles._

## Plan

Deadlines, task split and the submission checklist live in [`docs/PLAN.md`](docs/PLAN.md).

## License

[MIT](LICENSE). Junction requires all code to be MIT-licensed and written during the event.
