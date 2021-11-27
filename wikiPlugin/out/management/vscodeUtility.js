"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRangeOfCursorSelection = exports.getTextOfCursorSelection = void 0;
const debug_1 = require("./debug");
const vscode = require("vscode");
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