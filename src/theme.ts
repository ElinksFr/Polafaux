const fs = require("fs");
const path = require("path");

const postcss = require("postcss");

async function listThemes(): Promise<Array<string>> {
  const directoryPath = path.join(
    __dirname,
    "../node_modules/highlight.js/styles"
  );

  const cssFiles = await fs.promises.readdir(directoryPath);

  return cssFiles.map((name: string) => name.slice(0, -4));
}

async function getTheme(name: string) {
  const filePath = path.join(
    __dirname,
    `../node_modules/highlight.js/styles/${name}.css`
  );

  const file = await fs.promises.readFile(filePath);

  const postParsed = postcss.parse(file);

  const nodes = postParsed.nodes;
  const rules = nodes.filter((node: { type: string }) => node.type === "rule");

  const mappingSelectorsRules: {
    [key: string]: { [property: string]: string };
  } = {};

  rules.forEach(
    (rule: { selectors: string[]; selector: string; nodes: any[] }) => {
      const selectors = rule.selectors || [rule.selector];

      interface Declaration {
        prop: string; // Property such as "color", "font-style", "background"...
        value: string;
      }

      const declarations: Array<Declaration> = rule.nodes.filter(
        (node: { type: string }) => node.type === "decl"
      );

      selectors.forEach((selector: string) => {
        declarations.forEach(({ prop, value }) => {
          if (mappingSelectorsRules[selector]) {
            mappingSelectorsRules[selector][prop] = value;
          } else {
            mappingSelectorsRules[selector] = { [prop]: value };
          }
        });
      });
    }
  );

  return mappingSelectorsRules;
}

export { listThemes, getTheme };
