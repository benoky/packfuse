# Third-party notices

Packfuse does not copy vendor skill repositories into this tree. Official skills are installed with `npx skills add` and uninstalled with `npx skills remove`.

| Item | Upstream | License (check upstream for current terms) | How we use it |
| --- | --- | --- | --- |
| brainstorming, writing-plans, TDD, debugging, verification-before-completion, requesting/receiving-code-review, finishing-a-development-branch, using-git-worktrees, SDD | [obra/superpowers](https://github.com/obra/superpowers) | MIT | Relay (`item.relay`) |
| frontend-design, webapp-testing, mcp-builder | [anthropics/skills](https://github.com/anthropics/skills) | See that repository | Relay (`item.relay`) |
| pdf, docx, pptx, xlsx | [anthropics/skills](https://github.com/anthropics/skills) | Source-available; see that repository | Pack relay. `docs` pack runs `npx skills add` for these names |
| react-best-practices, web-design-guidelines | [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) | See that repository | Relay (`item.relay`; React skill id `vercel-react-best-practices`) |
| figma-design-to-code | [figma/mcp-server-guide](https://github.com/figma/mcp-server-guide) | See that repository | Relay (`item.relay`) |

commander and yaml are npm dependencies with their own licenses.
