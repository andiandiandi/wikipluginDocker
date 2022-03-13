"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const wikipagePanel_1 = require("./wikipagePanel");
const sessionManagement_1 = require("./management/sessionManagement");
const pathManagement_1 = require("./management/pathManagement");
const debug_1 = require("./management/debug");
const vscodeUtility_1 = require("./management/vscodeUtility");
const searchHandler_1 = require("./management/handler/searchHandler");
const vscode = require("vscode");
const path = require("path");
const { spawn } = require("child_process");
function activate(context) {
    context.subscriptions.push(vscode.commands.registerCommand("personalWikiPlugin.QuickstartWiki", () => {
        if (sessionManagement_1.SessionManager.wikiServerRunning) {
            debug_1.Logger.Instance.print("wiki-server is already running", "quickstartWiki-command");
            vscode.commands.executeCommand("personalWikiPlugin.ConnectWikiserver");
            vscode.commands.executeCommand("personalWikiPlugin.InitializeWikiserver");
            return;
        }
        const wikiServerPath = pathManagement_1.PathManager.Instance.FilepathToPosix(path.join(context.extensionPath, "wikiBackend", "socketServer.py"));
        debug_1.Logger.Instance.print(wikiServerPath, "quickstartWiki-command");
        let pythonCommand = "";
        if (path.sep === "\\") {
            pythonCommand = "python";
        }
        else {
            pythonCommand = "python3";
        }
        const pythonProcessServer = spawn(pythonCommand, [wikiServerPath]);
        pythonProcessServer.connected;
        pythonProcessServer.stdout.on("data", function (data) {
            vscode.window.showInformationMessage("Received log-data from Wiki-Server");
            sessionManagement_1.SessionManager.wikiServerRunning = true;
        });
        pythonProcessServer.stdout.on("close", function (code) {
            sessionManagement_1.SessionManager.wikiServerRunning = false;
            vscode.window.showInformationMessage("Wiki-Server terminated");
            vscode.commands.executeCommand("personalWikiPlugin.DisconnectWikiserver");
        });
        pythonProcessServer.stdout.on("error", function (data) {
            vscode.window.showInformationMessage("Error from Wiki-Server: " + data.toString());
            sessionManagement_1.SessionManager.wikiServerRunning = false;
        });
        setTimeout(() => {
            if (sessionManagement_1.SessionManager.wikiServerRunning)
                vscode.commands.executeCommand("personalWikiPlugin.QuickstartWiki");
        }, 1500);
    }));
    context.subscriptions.push(vscode.commands.registerCommand("personalWikiPlugin.SpawnWikiserver", () => {
        const wikiServerPath = pathManagement_1.PathManager.Instance.FilepathToPosix(path.join(context.extensionPath, "wikiBackend", "socketServer.py"));
        debug_1.Logger.Instance.print(wikiServerPath, "spawnWikiServer-command");
        let pythonCommand = "";
        if (path.sep === "\\") {
            pythonCommand = "python";
        }
        else {
            pythonCommand = "python3";
        }
        const pythonProcessServer = spawn(pythonCommand, [wikiServerPath]);
        pythonProcessServer.stdout.on("data", function (data) {
            vscode.window.showInformationMessage("Received log-data from Wiki-Server");
            sessionManagement_1.SessionManager.wikiServerRunning = true;
        });
        pythonProcessServer.stdout.on("close", function (code) {
            sessionManagement_1.SessionManager.wikiServerRunning = false;
            vscode.window.showInformationMessage("Wiki-Server terminated");
            vscode.commands.executeCommand("personalWikiPlugin.DisconnectWikiserver");
        });
        pythonProcessServer.stdout.on("error", function (data) {
            vscode.window.showInformationMessage("Error from start Wiki-Server: " + data.toString());
            sessionManagement_1.SessionManager.wikiServerRunning = false;
        });
    }));
    context.subscriptions.push(vscode.commands.registerCommand("personalWikiPlugin.ConnectWikiserver", () => {
        var _a;
        const rootFolder = pathManagement_1.PathManager.Instance.getDocumentWorkspaceFolder();
        if (rootFolder) {
            const rootFolderPosix = pathManagement_1.PathManager.Instance.FilepathToPosix(rootFolder);
            if (sessionManagement_1.SessionManager.Instance.getConnection(rootFolderPosix)) {
                debug_1.Logger.Instance.print("connection-obj already exists in sessionManager: " +
                    ((_a = sessionManagement_1.SessionManager.Instance.getConnection(rootFolderPosix)) === null || _a === void 0 ? void 0 : _a.rootFolder), "connectToWikiserver-command");
                return;
            }
            const connection = sessionManagement_1.SessionManager.Instance.createConnection(rootFolderPosix, context.extensionUri);
            debug_1.Logger.Instance.print("connection-rootfolder : " + connection.rootFolder, "connectToWikiserver-command");
            debug_1.Logger.Instance.print("extensionURI: " + context.extensionUri, "connectToWikiserver-command");
            sessionManagement_1.SessionManager.Instance.add(connection);
        }
    }));
    context.subscriptions.push(vscode.commands.registerCommand("personalWikiPlugin.InitializeWikiserver", () => {
        const rootFolder = pathManagement_1.PathManager.Instance.getDocumentWorkspaceFolder();
        if (rootFolder) {
            debug_1.Logger.Instance.print("rootFolder: " + rootFolder, "initialize-command");
            const rootFolderPosix = pathManagement_1.PathManager.Instance.FilepathToPosix(rootFolder);
            debug_1.Logger.Instance.print("rootFolder-posix: " + rootFolderPosix, "initialize-command");
            const connection = sessionManagement_1.SessionManager.Instance.getConnection(rootFolderPosix);
            debug_1.Logger.Instance.print("found connection-obj: " + (connection === null || connection === void 0 ? void 0 : connection.rootFolder), "initialize-command");
            if (connection) {
                if (connection.isConnected()) {
                    debug_1.Logger.Instance.print("connection-obj: " +
                        connection.rootFolder +
                        " already connected", "initialize-command");
                }
                else {
                    debug_1.Logger.Instance.print("trying to connect " +
                        connection.rootFolder +
                        " to wiki-server", "initialize-command");
                    connection.connect();
                }
            }
            else
                debug_1.Logger.Instance.print("connect to wiki-server first", "initialize-command");
        }
        else
            debug_1.Logger.Instance.print("no active wikipage open in editor", "initialize-command");
    }));
    context.subscriptions.push(vscode.commands.registerCommand("personalWikiPlugin.DisconnectWikiserver", () => {
        const rootFolder = pathManagement_1.PathManager.Instance.getDocumentWorkspaceFolder();
        if (rootFolder) {
            const rootFolderPosix = pathManagement_1.PathManager.Instance.FilepathToPosix(rootFolder);
            const connection = sessionManagement_1.SessionManager.Instance.getConnection(rootFolderPosix);
            if (connection && connection.isConnected()) {
                const fullFilepath = pathManagement_1.PathManager.Instance.rootFolderFull();
                if (fullFilepath) {
                    const fullFilepathPosix = pathManagement_1.PathManager.Instance.FilepathToPosix(fullFilepath);
                    connection.disconnect();
                    debug_1.Logger.Instance.print(fullFilepathPosix, "DisconnectWikiserver-command");
                }
            }
            else
                debug_1.Logger.Instance.print("connect to wiki-server first");
        }
        else
            debug_1.Logger.Instance.print("no active wikipage open in editor", "DisconnectWikiserver-command");
    }));
    context.subscriptions.push(vscode.commands.registerCommand("personalWikiPlugin.SelWikiContent", () => {
        try {
            const rootFolder = pathManagement_1.PathManager.Instance.getDocumentWorkspaceFolder();
            if (rootFolder) {
                debug_1.Logger.Instance.print("non-posix: " + rootFolder, "selContent-command");
                const rootFolderPosix = pathManagement_1.PathManager.Instance.FilepathToPosix(rootFolder);
                debug_1.Logger.Instance.print("posix: " + rootFolderPosix, "selContent-command");
                const connection = sessionManagement_1.SessionManager.Instance.getConnection(rootFolderPosix);
                debug_1.Logger.Instance.print(connection === null || connection === void 0 ? void 0 : connection.rootFolder, "selContent-command");
                if (connection && connection.isConnected()) {
                    debug_1.Logger.Instance.print("inside condition", "selContent-command");
                    connection.sendDEBUGselContent();
                }
            }
            else
                debug_1.Logger.Instance.print("no active wikipage open in editor", "selContent-command");
        }
        catch (e) {
            debug_1.Logger.Instance.print(e);
        }
    }));
    context.subscriptions.push(vscode.commands.registerCommand("personalWikiPlugin.SelWikiFiles", () => {
        try {
            const rootFolder = pathManagement_1.PathManager.Instance.getDocumentWorkspaceFolder();
            if (rootFolder) {
                debug_1.Logger.Instance.print("non-posix: " + rootFolder, "selFiles-command");
                const rootFolderPosix = pathManagement_1.PathManager.Instance.FilepathToPosix(rootFolder);
                debug_1.Logger.Instance.print("posix: " + rootFolderPosix, "selFiles-command");
                const connection = sessionManagement_1.SessionManager.Instance.getConnection(rootFolderPosix);
                debug_1.Logger.Instance.print(connection === null || connection === void 0 ? void 0 : connection.rootFolder, "selFiles-command");
                if (connection && connection.isConnected()) {
                    debug_1.Logger.Instance.print("inside condition", "selFiles-command");
                    connection.sendDEBUGselFiles();
                }
            }
            else
                debug_1.Logger.Instance.print("no active wikipage open in editor", "selFiles-command");
        }
        catch (e) {
            debug_1.Logger.Instance.print(e);
        }
    }));
    context.subscriptions.push(vscode.commands.registerCommand("personalWikiPlugin.RenderWikipage", () => {
        try {
            const fullFilepath = pathManagement_1.PathManager.Instance.rootFolderFull();
            if (fullFilepath) {
                const rootFolder = pathManagement_1.PathManager.Instance.getDocumentWorkspaceFolder();
                if (rootFolder) {
                    debug_1.Logger.Instance.print("non-posix: " + rootFolder, "renderWikipage-command");
                    const rootFolderPosix = pathManagement_1.PathManager.Instance.FilepathToPosix(rootFolder);
                    debug_1.Logger.Instance.print("posix: " + rootFolderPosix, "renderWikipage-command");
                    const connection = sessionManagement_1.SessionManager.Instance.getConnection(rootFolderPosix);
                    debug_1.Logger.Instance.print(connection === null || connection === void 0 ? void 0 : connection.rootFolder, "renderWikipage-command");
                    if (connection && connection.isConnected()) {
                        debug_1.Logger.Instance.print("inside condition", "renderWikipage-command");
                        const definitelyPosix = pathManagement_1.PathManager.Instance.FilepathToPosix(fullFilepath);
                        debug_1.Logger.Instance.print(definitelyPosix, "renderWikipage");
                        debug_1.Logger.Instance.print(connection.sid, "renderWikipage");
                        wikipagePanel_1.WikipagePanel.createOrShow(context.extensionUri, connection.sid, definitelyPosix);
                    }
                    else
                        debug_1.Logger.Instance.print("connect to wiki-server first");
                }
            }
            else
                debug_1.Logger.Instance.print("no active wikipage open in editor", "renderWikipage-command");
        }
        catch (e) {
            debug_1.Logger.Instance.print(e);
        }
    }));
    context.subscriptions.push(vscode.commands.registerCommand("personalWikiPlugin.WordCount", () => {
        const rootFolder = pathManagement_1.PathManager.Instance.getDocumentWorkspaceFolder();
        if (rootFolder) {
            const rootFolderPosix = pathManagement_1.PathManager.Instance.FilepathToPosix(rootFolder);
            const connection = sessionManagement_1.SessionManager.Instance.getConnection(rootFolderPosix);
            if (connection && connection.isConnected()) {
                const fullFilepath = pathManagement_1.PathManager.Instance.rootFolderFull();
                if (fullFilepath) {
                    const fullFilepathPosix = pathManagement_1.PathManager.Instance.FilepathToPosix(fullFilepath);
                    connection.sendWordCount(fullFilepathPosix);
                    debug_1.Logger.Instance.print(fullFilepathPosix, "wordcount-command");
                }
            }
            else
                debug_1.Logger.Instance.print("connect to wiki-server first");
        }
        else
            debug_1.Logger.Instance.print("no active wikipage open in editor", "wordcount-command");
    }));
    context.subscriptions.push(vscode.commands.registerCommand("personalWikiPlugin.WordCountWholeWiki", () => {
        const rootFolder = pathManagement_1.PathManager.Instance.getDocumentWorkspaceFolder();
        if (rootFolder) {
            const rootFolderPosix = pathManagement_1.PathManager.Instance.FilepathToPosix(rootFolder);
            const connection = sessionManagement_1.SessionManager.Instance.getConnection(rootFolderPosix);
            if (connection && connection.isConnected())
                connection.sendWordCount();
            else
                debug_1.Logger.Instance.print("connect to wiki-server first");
        }
        else
            debug_1.Logger.Instance.print("no active wikipage open in editor", "wordcountWholeWiki-command");
    }));
    context.subscriptions.push(vscode.commands.registerCommand("personalWikiPlugin.OpenWikipage", () => {
        /*
        const userInput = vscode.window.showInputBox();
        userInput.then((userInputSearchQuery) => {
          if (userInputSearchQuery) {
            Logger.Instance.print(
              "Got openWikipage from user: " + userInputSearchQuery,
              "openWikipage-command"
            );
            vscode.workspace.openTextDocument(userInputSearchQuery).then((a) => {
              vscode.window.showTextDocument(a, 1, false);
              vscode.window.activeTextEditor?.selections
            });
          } else
            Logger.Instance.print(
              "user cancelled input box for openWikipage-command",
              "openWikipage-command"
            );
        });
        */
        const panel = vscode.window.createWebviewPanel("catCoding", "Cat Coding", vscode.ViewColumn.One, {});
        function getWebviewContent() {
            return `<!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Cat Coding</title>
      </head>
      <body>
          <img src="https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif" width="300" />
      </body>
      </html>`;
        }
        // And set its HTML content
        panel.webview.html = getWebviewContent();
    }));
    context.subscriptions.push(vscode.commands.registerCommand("personalWikiPlugin.SearchQuery", () => {
        const rootFolder = pathManagement_1.PathManager.Instance.getDocumentWorkspaceFolder();
        if (rootFolder) {
            const rootFolderPosix = pathManagement_1.PathManager.Instance.FilepathToPosix(rootFolder);
            const connection = sessionManagement_1.SessionManager.Instance.getConnection(rootFolderPosix);
            if (connection && connection.isConnected())
                searchHandler_1.SearchHandler.getUserInput(connection.sendSearchQuery.bind(connection));
            else
                debug_1.Logger.Instance.print("connect to wiki-server first");
        }
        else
            debug_1.Logger.Instance.print("no active wikipage open in editor", "searchQuery-command");
    }));
    context.subscriptions.push(vscode.commands.registerCommand("personalWikiPlugin.Wikilink", () => {
        const rootFolder = pathManagement_1.PathManager.Instance.getDocumentWorkspaceFolder();
        if (rootFolder) {
            const rootFolderPosix = pathManagement_1.PathManager.Instance.FilepathToPosix(rootFolder);
            const connection = sessionManagement_1.SessionManager.Instance.getConnection(rootFolderPosix);
            if (connection && connection.isConnected()) {
                const filename = pathManagement_1.PathManager.Instance.rootFolderFull();
                if (filename) {
                    const posix = pathManagement_1.PathManager.Instance.FilepathToPosix(filename);
                    const selectedWord = vscodeUtility_1.getTextOfCursorSelection();
                    let data;
                    if (selectedWord)
                        data = { type: "toggle", word: selectedWord, srcPath: posix };
                    else
                        data = { type: "imagelink", srcPath: posix };
                    connection.sendWikilink(data);
                    debug_1.Logger.Instance.print(selectedWord ? selectedWord : "nothing was selected for wikilink", "wikilink-command");
                }
            }
            else
                debug_1.Logger.Instance.print("connect to wiki-server first");
        }
        else
            debug_1.Logger.Instance.print("no active wikipage open in editor", "wikilink-command");
    }));
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map