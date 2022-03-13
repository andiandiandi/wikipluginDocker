"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRangeOfCursorSelection = exports.getTextOfCursorSelection = exports.getLocalIP = void 0;
const debug_1 = require("./debug");
const vscode = require("vscode");
const config_1 = require("../config");
const ifs = require("os").networkInterfaces();
const getLocalIP = () => {
    debug_1.Logger.Instance.print(config_1.default.externalIP);
    debug_1.Logger.Instance.print(config_1.default.localIP);
    if (config_1.default.externalIP)
        return config_1.default.externalIP;
    if (config_1.default.localIP)
        return config_1.default.localIP;
    const ip = Object.keys(ifs)
        .map((key) => ifs[key].filter((key) => key.family === "IPv4" && !key.internal)[0])
        .filter((x) => x)[0].address;
    debug_1.Logger.Instance.print(ip);
    return ip;
};
exports.getLocalIP = getLocalIP;
const getTextOfCursorSelection = () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor)
        return undefined;
    if (editor.selection.isEmpty) {
        const position = editor.selection.active;
        debug_1.Logger.Instance.print(position.line + "", "wikilinkHandler");
        debug_1.Logger.Instance.print(position.character + "", "wikilinkHandler");
        return undefined;
    }
    else {
        const selectionStart = editor.selection.start;
        const selectionEnd = editor.selection.end;
        debug_1.Logger.Instance.print(editor.selection.start.line + "", "wikilinkHandler");
        debug_1.Logger.Instance.print(editor.selection.start.character + "", "wikilinkHandler");
        debug_1.Logger.Instance.print(editor.selection.end.line + "", "wikilinkHandler");
        debug_1.Logger.Instance.print(editor.selection.end.character + "", "wikilinkHandler");
        const text = editor.document.getText(new vscode.Range(selectionStart, selectionEnd));
        debug_1.Logger.Instance.print(text);
        return text;
    }
};
exports.getTextOfCursorSelection = getTextOfCursorSelection;
const getRangeOfCursorSelection = () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor)
        return undefined;
    const selectionStart = editor.selection.start;
    const selectionEnd = editor.selection.end;
    debug_1.Logger.Instance.print(editor.selection.start.line + "", "wikilinkHandler");
    debug_1.Logger.Instance.print(editor.selection.start.character + "", "wikilinkHandler");
    debug_1.Logger.Instance.print(editor.selection.end.line + "", "wikilinkHandler");
    debug_1.Logger.Instance.print(editor.selection.end.character + "", "wikilinkHandler");
    return new vscode.Range(selectionStart, selectionEnd);
};
exports.getRangeOfCursorSelection = getRangeOfCursorSelection;
//# sourceMappingURL=vscodeUtility.js.map