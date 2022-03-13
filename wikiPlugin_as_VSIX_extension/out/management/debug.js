"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
const vscode = require("vscode");
class Logger {
    constructor() {
        this.debugTerminal = vscode.window.createOutputChannel("wikiplugin");
    }
    static get Instance() {
        return this._instance || (this._instance = new this());
    }
    print(message, prefix = "all") {
        this.debugTerminal.appendLine(prefix + ": " + message);
    }
}
exports.Logger = Logger;
//# sourceMappingURL=debug.js.map