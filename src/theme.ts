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
    [key: string]: any;
  } = {};

  rules.forEach(
    (rule: { selectors: string[]; selector: string; nodes: any[] }) => {
      const selectors = rule.selectors || [rule.selector];

      interface Declaration {
        property: string;
        value: string;
      }

      const declarations: Array<Declaration> = rule.nodes.filter(
        (node: { type: string }) => node.type === "decl"
      );

      selectors.forEach((selector: string) => {
        declarations.forEach(({ property, value }) => {
          if (mappingSelectorsRules[selector]) {
            mappingSelectorsRules[selector][property] = value;
          } else {
            mappingSelectorsRules[selector] = { [property]: value };
          }
        });
      });
    }
  );

  return mappingSelectorsRules;
}

export { listThemes, getTheme };
