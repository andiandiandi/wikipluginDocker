import { Logger } from "./debug";
import * as vscode from "vscode";
import config from "../config";

const ifs = require("os").networkInterfaces();

export const getLocalIP = () => {
  Logger.Instance.print(config.externalIP);
  Logger.Instance.print(config.localIP);
  if (config.externalIP) return config.externalIP;
  if (config.localIP) return config.localIP;

  const ip = Object.keys(ifs)
    .map(
      (key) =>
        ifs[key].filter(
          (key: { family: string; internal: any }) =>
            key.family === "IPv4" && !key.internal
        )[0]
    )
    .filter((x) => x)[0].address;

  Logger.Instance.print(ip);
  return ip;
};

export const getTextOfCursorSelection = (): string | undefined => {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return undefined;

  if (editor.selection.isEmpty) {
    const position = editor.selection.active;
    Logger.Instance.print(position.line + "", "wikilinkHandler");
    Logger.Instance.print(position.character + "", "wikilinkHandler");
    return undefined;
  } else {
    const selectionStart = editor.selection.start;
    const selectionEnd = editor.selection.end;
    Logger.Instance.print(editor.selection.start.line + "", "wikilinkHandler");
    Logger.Instance.print(
      editor!.selection.start.character + "",
      "wikilinkHandler"
    );
    Logger.Instance.print(editor.selection.end.line + "", "wikilinkHandler");
    Logger.Instance.print(
      editor!.selection.end.character + "",
      "wikilinkHandler"
    );
    const text = editor.document.getText(
      new vscode.Range(selectionStart, selectionEnd)
    );
    Logger.Instance.print(text!);
    return text;
  }
};

export const getRangeOfCursorSelection = (): vscode.Range | undefined => {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return undefined;

  const selectionStart = editor.selection.start;
  const selectionEnd = editor.selection.end;
  Logger.Instance.print(editor.selection.start.line + "", "wikilinkHandler");
  Logger.Instance.print(
    editor!.selection.start.character + "",
    "wikilinkHandler"
  );
  Logger.Instance.print(editor.selection.end.line + "", "wikilinkHandler");
  Logger.Instance.print(
    editor!.selection.end.character + "",
    "wikilinkHandler"
  );
  return new vscode.Range(selectionStart, selectionEnd);
};
