// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import path = require("path");
import fs = require("fs");

import { listThemes, getTheme } from "./theme"
import { generateSVG, GeneratorOptions } from "./generator"
import { debounce } from './utils'


const P_TITLE = "PolaFaux 📊";

async function getOptionsFromConfig(): Promise<GeneratorOptions> {
  const config = vscode.workspace.getConfiguration('polafaux')
  const theme = await getTheme(config.themeName)

  return {
    theme,
    themeName: config.themeName,
    fontSize: config.fontSize,
    leading: config.leading,
    lineCap: config.lineCap,
    margin: config.margin,
    lineNumbers: config.lineNumbers,
    lineNumberOffset: config.lineNumberOffset
  }
}


// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
  const htmlPath = path.resolve(context.extensionPath, "webview/index.html");
  let panel: vscode.WebviewPanel;

  const themeNames = await listThemes()
  const options = await getOptionsFromConfig();

  let svg: string
  let text: string
  let language: string
  vscode.window.registerWebviewPanelSerializer("polafaux", {
    async deserializeWebviewPanel(_panel, state) {
      panel = _panel;
      panel.webview.html = await getHtmlContent(htmlPath);
      panel.webview.postMessage({
        type: "restore",
        ...state,
        themeNames
      });
      const selectionListener = setupSelectionSync();
      panel.onDidDispose(() => {
        selectionListener.dispose();
      });
      setupMessageListeners();
    },
  });
  function setupMessageListeners() {
    panel.webview.onDidReceiveMessage(async (message) => {
      const { type, data } = message
      switch (type) {
        case "shoot":
          const savePath = await vscode.window.showSaveDialog({
            filters: {
              Images: ["svg"],
            },
          })

          if (savePath) {
            await fs.promises.writeFile(savePath.toString(), data)
            vscode.window.showInformationMessage("SVG successfuly saved")
          }
          break;
        case "updateOptions":
          Object.assign(options, data.options)

          svg = generateSVG(text, { ...options, language })
          panel.webview.postMessage({
            type: "update",
            svg
          })

          break;
        case "changeTheme":
          const { targetTheme } = data

          options.themeName = targetTheme
          options.theme = await getTheme(targetTheme)

          svg = generateSVG(text, { ...options, language })
          panel.webview.postMessage({
            type: "update",
            svg
          })

          break;
      }
    });
  }

  function sendSvg(event: vscode.TextEditorSelectionChangeEvent) {
    const { selections, textEditor } = event
    if (selections[0] && !selections[0].isEmpty) {
      const { document } = textEditor

      language = document.languageId
      text = document.getText(textEditor.selection)

      svg = generateSVG(text, { ...options, language })
      panel.webview.postMessage({
        type: "update",
        svg
      })
    }
  }

  const debounceSend = debounce(sendSvg, 200)

  function setupSelectionSync() {
    return vscode.window.onDidChangeTextEditorSelection((event) => {
      debounceSend(event)
      // sendSvg(event)
    });
  }


  async function getHtmlContent(htmlPath: string) {
    const htmlContent = await fs.promises.readFile(htmlPath, "utf-8");
    return htmlContent.replace(/script src="([^"]*)"/g, (match, src) => {
      const onDisk = vscode.Uri.file(path.resolve(htmlPath, "..", src))
      const realSource = panel.webview.asWebviewUri(onDisk);

      return `script src="${realSource}"`;
    });
  }


  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand(
    "polafaux.activate",
    async () => {
      // The code you place here will be executed every time your command is executed

      // Display a message box to the user
      vscode.window.showInformationMessage("Hello World from PolaFaux!");

      panel = vscode.window.createWebviewPanel("polafaux", P_TITLE, 2, {
        enableScripts: true,
        localResourceRoots: [
          vscode.Uri.file(path.join(context.extensionPath, "webview")),
        ],
      });

      panel.webview.html = await getHtmlContent(htmlPath);

      const selectionListener = setupSelectionSync();
      panel.onDidDispose(() => {
        selectionListener.dispose();
      });

      setupMessageListeners();

      panel.webview.postMessage({
        type: "init",
        themeNames,
        options
      })
    }
  );

  context.subscriptions.push(disposable);
}

async function getHtmlContent(htmlPath: string) {
  const htmlContent = await fs.promises.readFile(htmlPath, "utf-8");
  return htmlContent.replace(/script src="([^"]*)"/g, (match, src) => {
    const realSource = path.resolve(htmlPath, "..", src);

    return `script src="${realSource}"`;
  });
}

// this method is called when your extension is deactivated
export function deactivate() { }
