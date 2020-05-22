import { suite, test, before } from "mocha";
import { assert } from "chai";

import * as isSvg from "is-svg";

import {
  getDefaultOptions,
  Generator,
  GeneratorOptions,
} from "../../generator";

import { getTheme } from "../../theme";

suite("Extension Test Suite", () => {
  let defaultOptions: GeneratorOptions;

  before(async () => {
    defaultOptions = await getDefaultOptions();
  });

  test("Should return a valid svg with defaultOptions and empty code", async () => {
    const svg = new Generator("", defaultOptions).generateSvg();
    assert.isTrue(isSvg(svg));
  });

  test("Should return a valid svg with defaultOptions and cpp code", async () => {
    const cppCode = `// Your First C++ Program

#include <iostream>

int main() {
    std::cout << "Hello World!";
    return 0;
}`;

    const svg = new Generator(cppCode, defaultOptions).generateSvg();
    assert.isTrue(isSvg(svg));
  });

  test("Should return a valid svg with defaultOptions and python code", async () => {
    const pyCode = `import numpy as np

print("coucou")

def sxdsd(arg1):
    arg1.do_something()`;
    const svg = new Generator(pyCode, defaultOptions).generateSvg();
    assert.isTrue(isSvg(svg));
  });

  test("Should return a valid svg with defaultOptions and malformed cpp code", async () => {
    // missing ">" and ";"
    const cppCode = `// Your First malformed C++ Program

#include <iostream

int main() {
    std::cout << "Hello World!";
    return 0
}`;
    const svg = new Generator(cppCode, defaultOptions).generateSvg();
    assert.isTrue(isSvg(svg));
  });

  test("Should return a valid svg with madeup and empty code", async () => {
    const theme = await getTheme("github");

    const options: GeneratorOptions = {
      theme,
      fontSize: 5,
      leading: 12,
      lineCap: "round",
      lineNumberOffset: -5,
      lineNumbers: false,
      margin: 30,
    };

    const svg = new Generator("", options).generateSvg();
    assert.isTrue(isSvg(svg));
  });

  test("Should return a valid svg with madeup and cpp code", async () => {
    const theme = await getTheme("github");

    const options: GeneratorOptions = {
      theme,
      fontSize: 5,
      leading: 12,
      lineCap: "round",
      lineNumberOffset: -5,
      lineNumbers: false,
      margin: 30,
    };
    const cppCode = `// Your First C++ Program

#include <iostream>

int main() {
    std::cout << "Hello World!";
    return 0;
}`;

    const svg = new Generator(cppCode, options).generateSvg();
    assert.isTrue(isSvg(svg));
  });

  test("Should return a valid svg with madeup and python code", async () => {
    const theme = await getTheme("github");

    const options: GeneratorOptions = {
      theme,
      fontSize: 5,
      leading: 12,
      lineCap: "round",
      lineNumberOffset: -5,
      lineNumbers: false,
      margin: 30,
    };
    const pyCode = `import numpy as np

print("coucou")

def sxdsd(arg1):
    arg1.do_something()`;

    const svg = new Generator(pyCode, options).generateSvg();
    assert.isTrue(isSvg(svg));
  });

  test("Should be faster if the language is specified", async () => {
    const theme = await getTheme("github");

    const options: GeneratorOptions = {
      theme,
      fontSize: 5,
      leading: 12,
      lineCap: "round",
      lineNumberOffset: -5,
      lineNumbers: false,
      margin: 30,
    };
    const pyCode = `import numpy as np

print("coucou")

def sxdsd(arg1):
    arg1.do_something()`;
    const startNoLang = Date.now();
    new Generator(pyCode, defaultOptions).generateSvg();
    const endNoLang = Date.now();

    options.language = "python";
    const startWithLang = Date.now();
    new Generator(pyCode, defaultOptions).generateSvg();
    const endWithLang = Date.now();

    assert.isTrue(endNoLang - startNoLang > endWithLang - startWithLang);
  });
});
