import * as vscode from "vscode";
const path = require("path");

export class PathManager {
  private static _instance: PathManager;
  private constructor() {}
  public static get Instance() {
    return this._instance || (this._instance = new this());
  }

  rootFolderFull() : string | undefined{
    return vscode.window.activeTextEditor?.document.uri.fsPath;
  }

  rootFolder(): string {
    return path.parse(this.rootFolderFull()).dir;
  }

  FilepathToPosix(filepath: string): string {
    if(!filepath)
      return ""
    return filepath.toString().split(path.sep).join(path.posix.sep);
  }

  dir(filepath: string): string {
    return path.parse(filepath).dir;
  }

  getDocumentWorkspaceFolder(): string | undefined {
    const fileName = vscode.window.activeTextEditor?.document.fileName;
    return vscode.workspace.workspaceFolders
      ?.map((folder) => folder.uri.fsPath)
      .filter((fsPath) => fileName?.startsWith(fsPath))[0];
  }
}
