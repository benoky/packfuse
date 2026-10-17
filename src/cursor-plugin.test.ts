import assert from "node:assert/strict";
import test from "node:test";
import { validateCursorPlugin } from "./validate.js";

test("cursor plugin manifest covers the catalog and leaves ChatGPT packaging separate", () => {
    assert.deepEqual(validateCursorPlugin(), []);
});
