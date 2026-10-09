# Python implementation checks

- Read the current official MCP Python SDK documentation for the installed version: https://github.com/modelcontextprotocol/python-sdk.
- Validate inputs using the project's typed schema conventions before filesystem, network, or database effects.
- Separate handlers from transport setup. Avoid blocking calls in async handlers unless isolated appropriately.
- Return stable structured results and sanitized errors; keep secrets out of exception text and logs.
- Bound downstream requests and support cancellation. For stdio, use stderr for logs.
- Test discovery, input errors, authorization, result schemas, and graceful shutdown with a compatible client.
