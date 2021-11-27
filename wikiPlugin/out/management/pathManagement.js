"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PathManager = void 0;
const vscode = require("vscode");
const path = require("path");
class PathManager {
    constructor() { }
    static get Instance() {
        return this._instance || (this._instance = new this());
    }
    rootFolderFull() {
        var _a;
        return (_a = vscode.window.activeTextEditor) === null || _a === void 0 ? void 0 : _a.document.uri.fsPath;
    }
    rootFolder() {
        return path.parse(this.rootFolderFull()).dir;
    }
    FilepathToPosix(filepath) {
        if (!filepath)
            return "";
        return filepath.toString().split(path.sep).join(path.posix.sep);
    }
    dir(filepath) {
        return path.parse(filepath).dir;
    }
    getDocumentWorkspaceFolder() {
        var _a, _b;
        const fileName = (_a = vscode.window.activeTextEditor) === null || _a === void 0 ? void 0 : _a.document.fileName;
        return (_b = vscode.workspace.workspaceFolders) === null || _b === void 0 ? void 0 : _b.map((folder) => folder.uri.fsPath).filter((fsPath) => fileName === null || fileName === void 0 ? void 0 : fileName.startsWith(fsPath))[0];
    }
}
exports.PathManager = PathManager;
//# sourceMappingURL=pathManagement.js.map