import { WikipagePanel } from "./wikipagePanel";
import { SessionManager } from "./management/sessionManagement";
import { PathManager } from "./management/pathManagement";
import { Logger } from "./management/debug";
import { getTextOfCursorSelection } from "./management/vscodeUtility";
import { SearchHandler } from "./management/handler/searchHandler";
import { getLocalIP } from "./management/vscodeUtility";

import * as vscode from "vscode";
const path = require("path");
const { spawn } = require("child_process");

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand("personalWikiPlugin.QuickstartWiki", () => {
      if (SessionManager.wikiServerRunning) {
        Logger.Instance.print(
          "wiki-server is already running",
          "quickstartWiki-command"
        );
        vscode.commands.executeCommand("personalWikiPlugin.ConnectWikiserver");
        vscode.commands.executeCommand(
          "personalWikiPlugin.InitializeWikiserver"
        );
        return;
      }

      const wikiServerPath = PathManager.Instance.FilepathToPosix(
        path.join(context.extensionPath, "wikiBackend", "socketServer.py")
      );
      Logger.Instance.print(wikiServerPath, "quickstartWiki-command");
      let pythonCommand = "";
      if (path.sep === "\\") {
        pythonCommand = "python";
      } else {
        pythonCommand = "python3";
      }
      const pythonProcessServer = spawn(pythonCommand, [wikiServerPath]);
      pythonProcessServer.connected;
      pythonProcessServer.stdout.on("data", function (data: any) {
        vscode.window.showInformationMessage(
          "Received log-data from Wiki-Server"
        );
        SessionManager.wikiServerRunning = true;
      });
      pythonProcessServer.stdout.on("close", function (code: any) {
        SessionManager.wikiServerRunning = false;
        vscode.window.showInformationMessage("Wiki-Server terminated");
        vscode.commands.executeCommand(
          "personalWikiPlugin.DisconnectWikiserver"
        );
      });
      pythonProcessServer.stdout.on("error", function (data: any) {
        vscode.window.showInformationMessage(
          "Error from Wiki-Server: " + data.toString()
        );
        SessionManager.wikiServerRunning = false;
      });
      setTimeout(() => {
        if (SessionManager.wikiServerRunning)
          vscode.commands.executeCommand("personalWikiPlugin.QuickstartWiki");
      }, 1500);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "personalWikiPlugin.SpawnWikiserver",
      () => {
        const wikiServerPath = PathManager.Instance.FilepathToPosix(
          path.join(context.extensionPath, "wikiBackend", "socketServer.py")
        );
        Logger.Instance.print(wikiServerPath, "spawnWikiServer-command");
        let pythonCommand = "";
        if (path.sep === "\\") {
          pythonCommand = "python";
        } else {
          pythonCommand = "python3";
        }
        const pythonProcessServer = spawn(pythonCommand, [wikiServerPath]);
        pythonProcessServer.stdout.on("data", function (data: any) {
          vscode.window.showInformationMessage(
            "Received log-data from Wiki-Server"
          );
          SessionManager.wikiServerRunning = true;
        });
        pythonProcessServer.stdout.on("close", function (code: any) {
          SessionManager.wikiServerRunning = false;
          vscode.window.showInformationMessage("Wiki-Server terminated");
          vscode.commands.executeCommand(
            "personalWikiPlugin.DisconnectWikiserver"
          );
        });
        pythonProcessServer.stdout.on("error", function (data: any) {
          vscode.window.showInformationMessage(
            "Error from start Wiki-Server: " + data.toString()
          );
          SessionManager.wikiServerRunning = false;
        });
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "personalWikiPlugin.ConnectWikiserver",
      () => {
        const rootFolder = PathManager.Instance.getDocumentWorkspaceFolder();
        if (rootFolder) {
          const rootFolderPosix =
            PathManager.Instance.FilepathToPosix(rootFolder);
          if (SessionManager.Instance.getConnection(rootFolderPosix)) {
            Logger.Instance.print(
              "connection-obj already exists in sessionManager: " +
                SessionManager.Instance.getConnection(rootFolderPosix)
                  ?.rootFolder,
              "connectToWikiserver-command"
            );
            return;
          }
          const connection = SessionManager.Instance.createConnection(
            rootFolderPosix,
            context.extensionUri
          );
          Logger.Instance.print(
            "connection-rootfolder : " + connection.rootFolder,
            "connectToWikiserver-command"
          );
          Logger.Instance.print(
            "extensionURI: " + context.extensionUri,
            "connectToWikiserver-command"
          );
          SessionManager.Instance.add(connection);
        }
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "personalWikiPlugin.InitializeWikiserver",
      () => {
        const rootFolder = PathManager.Instance.getDocumentWorkspaceFolder();
        if (rootFolder) {
          Logger.Instance.print(
            "rootFolder: " + rootFolder,
            "initialize-command"
          );
          const rootFolderPosix =
            PathManager.Instance.FilepathToPosix(rootFolder);
          Logger.Instance.print(
            "rootFolder-posix: " + rootFolderPosix,
            "initialize-command"
          );
          const connection =
            SessionManager.Instance.getConnection(rootFolderPosix);
          Logger.Instance.print(
            "found connection-obj: " + connection?.rootFolder,
            "initialize-command"
          );

          if (connection) {
            if (connection.isConnected()) {
              Logger.Instance.print(
                "connection-obj: " +
                  connection.rootFolder +
                  " already connected",
                "initialize-command"
              );
            } else {
              Logger.Instance.print(
                "trying to connect " +
                  connection.rootFolder +
                  " to wiki-server",
                "initialize-command"
              );
              connection.connect();
            }
          } else
            Logger.Instance.print(
              "connect to wiki-server first",
              "initialize-command"
            );
        } else
          Logger.Instance.print(
            "no active wikipage open in editor",
            "initialize-command"
          );
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "personalWikiPlugin.DisconnectWikiserver",
      () => {
        const rootFolder = PathManager.Instance.getDocumentWorkspaceFolder();

        if (rootFolder) {
          const rootFolderPosix =
            PathManager.Instance.FilepathToPosix(rootFolder);
          const connection =
            SessionManager.Instance.getConnection(rootFolderPosix);

          if (connection && connection.isConnected()) {
            const fullFilepath = PathManager.Instance.rootFolderFull();

            if (fullFilepath) {
              const fullFilepathPosix =
                PathManager.Instance.FilepathToPosix(fullFilepath);
              connection.disconnect();
              Logger.Instance.print(
                fullFilepathPosix,
                "DisconnectWikiserver-command"
              );
            }
          } else Logger.Instance.print("connect to wiki-server first");
        } else
          Logger.Instance.print(
            "no active wikipage open in editor",
            "DisconnectWikiserver-command"
          );
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("personalWikiPlugin.SelWikiContent", () => {
      try {
        const rootFolder = PathManager.Instance.getDocumentWorkspaceFolder();

        if (rootFolder) {
          Logger.Instance.print(
            "non-posix: " + rootFolder,
            "selContent-command"
          );
          const rootFolderPosix =
            PathManager.Instance.FilepathToPosix(rootFolder);
          Logger.Instance.print(
            "posix: " + rootFolderPosix,
            "selContent-command"
          );
          const connection =
            SessionManager.Instance.getConnection(rootFolderPosix);
          Logger.Instance.print(connection?.rootFolder!, "selContent-command");
          if (connection && connection.isConnected()) {
            Logger.Instance.print("inside condition", "selContent-command");
            connection.sendDEBUGselContent();
          }
        } else
          Logger.Instance.print(
            "no active wikipage open in editor",
            "selContent-command"
          );
      } catch (e: any) {
        Logger.Instance.print(e);
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("personalWikiPlugin.SelWikiFiles", () => {
      try {
        const rootFolder = PathManager.Instance.getDocumentWorkspaceFolder();

        if (rootFolder) {
          Logger.Instance.print("non-posix: " + rootFolder, "selFiles-command");
          const rootFolderPosix =
            PathManager.Instance.FilepathToPosix(rootFolder);
          Logger.Instance.print(
            "posix: " + rootFolderPosix,
            "selFiles-command"
          );
          const connection =
            SessionManager.Instance.getConnection(rootFolderPosix);
          Logger.Instance.print(connection?.rootFolder!, "selFiles-command");

          if (connection && connection.isConnected()) {
            Logger.Instance.print("inside condition", "selFiles-command");
            connection.sendDEBUGselFiles();
          }
        } else
          Logger.Instance.print(
            "no active wikipage open in editor",
            "selFiles-command"
          );
      } catch (e: any) {
        Logger.Instance.print(e);
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("personalWikiPlugin.RenderWikipage", () => {
      try {
        const fullFilepath = PathManager.Instance.rootFolderFull();

        if (fullFilepath) {
          const rootFolder = PathManager.Instance.getDocumentWorkspaceFolder();

          if (rootFolder) {
            Logger.Instance.print(
              "non-posix: " + rootFolder,
              "renderWikipage-command"
            );
            const rootFolderPosix =
              PathManager.Instance.FilepathToPosix(rootFolder);
            Logger.Instance.print(
              "posix: " + rootFolderPosix,
              "renderWikipage-command"
            );
            const connection =
              SessionManager.Instance.getConnection(rootFolderPosix);
            Logger.Instance.print(
              connection?.rootFolder!,
              "renderWikipage-command"
            );

            if (connection && connection.isConnected()) {
              Logger.Instance.print(
                "inside condition",
                "renderWikipage-command"
              );
              const definitelyPosix =
                PathManager.Instance.FilepathToPosix(fullFilepath);
              Logger.Instance.print(definitelyPosix, "renderWikipage");
              Logger.Instance.print(connection.sid, "renderWikipage");
              WikipagePanel.createOrShow(
                context.extensionUri,
                connection.sid,
                definitelyPosix
              );
            } else Logger.Instance.print("connect to wiki-server first");
          }
        } else
          Logger.Instance.print(
            "no active wikipage open in editor",
            "renderWikipage-command"
          );
      } catch (e: any) {
        Logger.Instance.print(e);
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("personalWikiPlugin.WordCount", () => {
      const rootFolder = PathManager.Instance.getDocumentWorkspaceFolder();

      if (rootFolder) {
        const rootFolderPosix =
          PathManager.Instance.FilepathToPosix(rootFolder);
        const connection =
          SessionManager.Instance.getConnection(rootFolderPosix);

        if (connection && connection.isConnected()) {
          const fullFilepath = PathManager.Instance.rootFolderFull();

          if (fullFilepath) {
            const fullFilepathPosix =
              PathManager.Instance.FilepathToPosix(fullFilepath);
            connection.sendWordCount(fullFilepathPosix);
            Logger.Instance.print(fullFilepathPosix, "wordcount-command");
          }
        } else Logger.Instance.print("connect to wiki-server first");
      } else
        Logger.Instance.print(
          "no active wikipage open in editor",
          "wordcount-command"
        );
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "personalWikiPlugin.WordCountWholeWiki",
      () => {
        const rootFolder = PathManager.Instance.getDocumentWorkspaceFolder();

        if (rootFolder) {
          const rootFolderPosix =
            PathManager.Instance.FilepathToPosix(rootFolder);
          const connection =
            SessionManager.Instance.getConnection(rootFolderPosix);

          if (connection && connection.isConnected())
            connection.sendWordCount();
          else Logger.Instance.print("connect to wiki-server first");
        } else
          Logger.Instance.print(
            "no active wikipage open in editor",
            "wordcountWholeWiki-command"
          );
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("personalWikiPlugin.OpenWikipage", () => {
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
      const panel = vscode.window.createWebviewPanel(
        "catCoding",
        "Cat Coding",
        vscode.ViewColumn.One,
        {}
      );
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
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("personalWikiPlugin.SearchQuery", () => {
      const rootFolder = PathManager.Instance.getDocumentWorkspaceFolder();
      if (rootFolder) {
        const rootFolderPosix =
          PathManager.Instance.FilepathToPosix(rootFolder);
        const connection =
          SessionManager.Instance.getConnection(rootFolderPosix);

        if (connection && connection.isConnected())
          SearchHandler.getUserInput(
            connection.sendSearchQuery.bind(connection)
          );
        else Logger.Instance.print("connect to wiki-server first");
      } else
        Logger.Instance.print(
          "no active wikipage open in editor",
          "searchQuery-command"
        );
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("personalWikiPlugin.Wikilink", () => {
      const rootFolder = PathManager.Instance.getDocumentWorkspaceFolder();

      if (rootFolder) {
        const rootFolderPosix =
          PathManager.Instance.FilepathToPosix(rootFolder);
        const connection =
          SessionManager.Instance.getConnection(rootFolderPosix);

        if (connection && connection.isConnected()) {
          const filename = PathManager.Instance.rootFolderFull();

          if (filename) {
            const posix = PathManager.Instance.FilepathToPosix(filename);
            const selectedWord = getTextOfCursorSelection();

            let data;
            if (selectedWord)
              data = { type: "toggle", word: selectedWord, srcPath: posix };
            else data = { type: "imagelink", srcPath: posix };

            connection.sendWikilink(data);

            Logger.Instance.print(
              selectedWord ? selectedWord : "nothing was selected for wikilink",
              "wikilink-command"
            );
          }
        } else Logger.Instance.print("connect to wiki-server first");
      } else
        Logger.Instance.print(
          "no active wikipage open in editor",
          "wikilink-command"
        );
    })
  );
}

export function deactivate() {}
