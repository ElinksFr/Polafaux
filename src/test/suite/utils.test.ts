import { suite, test } from "mocha";
import { assert } from "chai";

import { range } from "../../utils";

suite("Utils Test Suite", () => {
    test("Range should work fine when only the end in provided", async () => {
        const arr = range(10);

        assert.isArray(arr);
        assert.isNotEmpty(arr);
        assert.deepEqual(arr, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
    });

    test("Range should work fine with a custom step", async () => {
        const arr = range(10, { step: 2 });

        assert.isArray(arr);
        assert.isNotEmpty(arr);
        assert.deepEqual(arr, [0, 2, 4, 6, 8])
    });

    test("Range should work fine with a custom start", async () => {
        const arr = range(10, { start: 5 });

        assert.isArray(arr);
        assert.isNotEmpty(arr);
        assert.deepEqual(arr, [5, 6, 7, 8, 9])
    });

    test("Range should work fine with a custom start and step", async () => {
        const arr = range(10, { start: 5, step: 2 });

        assert.isArray(arr);
        assert.isNotEmpty(arr);
        assert.deepEqual(arr, [5, 7, 9])
    });
});
