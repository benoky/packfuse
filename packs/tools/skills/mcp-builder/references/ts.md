# TypeScript implementation checks

- Read the current official MCP TypeScript SDK documentation for the installed major version: https://github.com/modelcontextprotocol/typescript-sdk.
- Use explicit tool schemas and validate before side effects. Reuse SDK types instead of casting unknown input into trusted objects.
- Keep tool handlers separate from transport startup so contract tests need no live server.
- Map expected domain errors into useful tool results; sanitize unexpected errors and logs.
- Implement cancellation and timeouts for downstream work. Keep stdout clean for stdio transport.
- Test initialize, tool discovery, valid/invalid calls, unauthorized calls, and transport shutdown.
