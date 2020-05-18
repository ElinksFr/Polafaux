// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import path = require("path");
import fs = require("fs");

import { listThemes, getTheme } from "./theme"
import { getDefaultOptions, generateSVG } from "./generator"

const P_TITLE = "PolaFaux 📸, 📊";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
  const htmlPath = path.resolve(context.extensionPath, "webview/index.html");
  let panel: vscode.WebviewPanel;

  const themeNames = await listThemes()
  const options = await getDefaultOptions()

  let svg: string
  vscode.window.registerWebviewPanelSerializer("polafaux", {
    async deserializeWebviewPanel(_panel, state) {
      panel = _panel;
      panel.webview.html = await getHtmlContent(htmlPath);
      panel.webview.postMessage({
        type: "restore",
        innerHTML: state.innerHTML,
        bgColor: context.globalState.get("polafaux.bgColor", "#2e3440"),
      });
      panel.webview.postMessage({
        type: "themeNames",
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
              Images: ["png"],
            },
          })

          if (savePath) {
            await fs.promises.writeFile(savePath.toString(), data)
            vscode.window.showInformationMessage("SVG successfuly saved")
          }
          break;
        case "updateOptions":
          panel.webview.postMessage({
            type: "restoreBgColor",
            bgColor: context.globalState.get("polafaux.bgColor", "#2e3440"),
          });

          break;
      }
    });
  }
  function setupSelectionSync() {
    return vscode.window.onDidChangeTextEditorSelection((event) => {
      const { selections, textEditor } = event
      if (selections[0] && !selections[0].isEmpty) {
        const { document } = textEditor

        const language = document.languageId
        const text = document.getText(textEditor.selection)

        svg = generateSVG(text, { ...options, language })
        panel.webview.postMessage({
          type: "update",
          svg
        });
      }
    });
  }
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "polafaux" is now active!');

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand(
    "polafaux.helloWorld",
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

      const fontFamily = vscode.workspace.getConfiguration("editor").fontFamily;
      const bgColor = context.globalState.get("polafaux.bgColor", "#2e3440");
      panel.webview.postMessage({
        type: "init",
        fontFamily,
        bgColor,
      });

    }
  );

  context.subscriptions.push(disposable);
}

async function getHtmlContent(htmlPath: string) {
  const htmlContent = await fs.promises.readFile(htmlPath, "utf-8");
  return htmlContent.replace(/script src="([^"]*)"/g, (match, src) => {
    const realSource = "vscode-resource:" + path.resolve(htmlPath, "..", src);
    return `script src="${realSource}"`;
  });
}

// this method is called when your extension is deactivated
export function deactivate() { }
