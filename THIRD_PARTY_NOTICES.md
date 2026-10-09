# Third-party notices

Packfuse does not copy vendor skill repositories into this tree. Procedures were adapted.

| Item | Upstream | License (check upstream for current terms) | How we use it |
| --- | --- | --- | --- |
| brainstorming, writing-plans, TDD, debugging, verification-before-completion, requesting/receiving-code-review, finishing-a-development-branch, using-git-worktrees, SDD | [obra/superpowers](https://github.com/obra/superpowers) | MIT | Procedure only |
| frontend-design, webapp-testing, mcp-builder | [anthropics/skills](https://github.com/anthropics/skills) | See that repository | Procedure only; no vendor source files |
| pdf, docx, pptx, xlsx | [anthropics/skills](https://github.com/anthropics/skills) | Source-available; see that repository | Not copied. `docs` pack runs `npx skills add` for these names |
| react-best-practices, web-design-guidelines | [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) | See that repository | Wrapper / official install |
| figma-design-to-code | Figma official skill | See Figma | Wrapper |

js-tiktoken, commander, and yaml are npm dependencies with their own licenses.
