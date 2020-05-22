import { suite, test } from "mocha";
import { assert } from "chai";

import { listThemes, getTheme } from "../../theme";

suite("Extension Test Suite", () => {
  test("listTheme should return a non-empty list of string", async () => {
    const themes = await listThemes();

    assert.isArray(themes);
    assert.isNotEmpty(themes);
  });

  test("getTheme should only contains class starting with .hljs", async () => {
    const themes = await listThemes();

    const theme = await getTheme(themes[Math.floor(Math.random() * themes.length)]);

    for (const key in theme) {
      assert.equal(key.slice(0, 5), ".hljs");
    }
  });

  test("getTheme should only contains class with properties not undefined", async () => {
    const themes = await listThemes();

    const theme = await getTheme(themes[Math.floor(Math.random() * themes.length)]);

    for (const key in theme) {
      for (const property in theme[key]) {
        assert.isDefined(property)
      }
    }
  });
});
