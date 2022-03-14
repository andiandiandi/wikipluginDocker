import * as vscode from "vscode";
export class Logger {
  private static _instance: Logger;
  private debugTerminal: vscode.OutputChannel;
  private constructor() {
    this.debugTerminal = vscode.window.createOutputChannel("wikiplugin");
  }
  public static get Instance() {
    return this._instance || (this._instance = new this());
  }
  
  print(message : string, prefix : string = "all"){
      this.debugTerminal.appendLine(prefix + ": " + message);
  }
}
