import { suite, test } from "mocha";
import { assert } from "chai";

import { listThemes, getTheme } from "../../theme";

suite("Extension Test Suite", () => {
  test("listTheme should return a non-empty list of string", async () => {
    const themes = await listThemes();

    assert.isArray(themes);
    assert.isNotEmpty(themes);
  });

  test("getTheme should only containst class starting with .hljs", async () => {
    const themes = await listThemes();

    const theme = getTheme(themes[Math.floor(Math.random() * themes.length)]);

    for (const key in theme) {
      assert.equal(key.slice(0, 4), ".hljs");
    }
  });
});
