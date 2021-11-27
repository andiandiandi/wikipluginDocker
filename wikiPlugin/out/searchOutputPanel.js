"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchOutputPanel = void 0;
const vscode = require("vscode");
var http = require("http");
var base64 = require("base-64");
const debug_1 = require("./management/debug");
class SearchOutputPanel {
    constructor(panel, extensionUri) {
        this._disposables = [];
        this._panel = panel;
        this._extensionUri = extensionUri;
        // Set the webview's initial html content
        debug_1.Logger.Instance.print("before Update");
        this._update();
        debug_1.Logger.Instance.print("after Update");
        // Listen for when the panel is disposed
        // This happens when the user closes the panel or when the panel is closed programatically
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
        // // Handle messages from the webview
        // this._panel.webview.onDidReceiveMessage(
        //   (message) => {
        //     switch (message.command) {
        //       case "alert":
        //         vscode.window.showErrorMessage(message.text);
        //         return;
        //     }
        //   },
        //   null,
        //   this._disposables
        // );
    }
    static createOrShow(extensionUri, fulltextSearchResponse) {
        debug_1.Logger.Instance.print("createOrShow", "searchOutputPanel");
        SearchOutputPanel.SearchQueryResponse = fulltextSearchResponse;
        const column = vscode.ViewColumn.Two;
        /*
        vscode.window.activeTextEditor
          ? vscode.window.activeTextEditor.viewColumn
          : undefined;
        */
        // If we already have a panel, show it.
        if (SearchOutputPanel.currentPanel) {
            SearchOutputPanel.currentPanel._panel.reveal(column);
            SearchOutputPanel.currentPanel._update();
            return;
        }
        // Otherwise, create a new panel.
        const panel = vscode.window.createWebviewPanel(SearchOutputPanel.viewType, "Wiki-SearchOutput", 
        //column ||
        { viewColumn: vscode.ViewColumn.Two, preserveFocus: true }, {
            // Enable javascript in the webview
            enableScripts: true,
            // And restrict the webview to only loading content from our extension's `media` directory.
            // localResourceRoots: [
            //   vscode.Uri.joinPath(extensionUri, "media"),
            //   vscode.Uri.joinPath(extensionUri, "out/*"),
            // ],
        });
        SearchOutputPanel.currentPanel = new SearchOutputPanel(panel, extensionUri);
    }
    static kill() {
        var _a;
        (_a = SearchOutputPanel.currentPanel) === null || _a === void 0 ? void 0 : _a.dispose();
        SearchOutputPanel.currentPanel = undefined;
    }
    static revive(panel, extensionUri) {
        SearchOutputPanel.currentPanel = new SearchOutputPanel(panel, extensionUri);
    }
    dispose() {
        SearchOutputPanel.currentPanel = undefined;
        // Clean up our resources
        this._panel.dispose();
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }
    _update() {
        return __awaiter(this, void 0, void 0, function* () {
            debug_1.Logger.Instance.print("updating: " + JSON.stringify(SearchOutputPanel.SearchQueryResponse), "searchoutputpanel");
            let html = "";
            if (SearchOutputPanel.SearchQueryResponse["type"] === "fulltextsearch") {
                html = this.createHtmlFulltextsearch();
            }
            else if (SearchOutputPanel.SearchQueryResponse["type"] === "tagsearch") {
                html = this.createHtmlTagsearch();
            }
            this._panel.webview.html = html;
        });
    }
    createHtmlFulltextsearch() {
        const data = SearchOutputPanel.SearchQueryResponse["data"];
        let html = `<head>
          <meta charset="UTF-8">
          <meta http-equiv="X-UA-Compatible" content="IE=edge">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Document</title>
          <style>
              .container {
                  display: flex;
                  flex-direction: column;
                  justify-content: center;
                  align-items: start;
                  gap: 1rem;
              }

              .response-item {
                  display: flex;
                  flex-direction: column;
                  gap: .5rem;
              }

              .info {
                  display: flex;
                  gap: 1rem;
              }

              .linenumber::before {
                  content: "line(s): ";
              }

              .rating::before {
                  content: "rating: ";
              }
              .rating::after {
                  content: "00%";
              }

              .title {
                  margin-bottom: 2rem;
              }
          </style>
      </head>

      <body>
          <h3 class="title">Volltextsuche: ${data.length} Treffer gefunden</h3>
          <div class="container">`;
        let temp = "";
        for (let i = 0; i < data.length; i++) {
            temp += `<div class="response-item">
                      <div class="info">
                          <span class="filepath">${data[i].filepath}</span>
                          <span class="linenumber">${data[i].lines}</span>
                          <span class="rating">${data[i].rating}</span>
                      </div>
                      <div class="content">
                          ${data[i].fullphrase}
                      </div>
                  </div>`;
        }
        html += temp;
        html += `
    </div>
</body>
    `;
        return html;
    }
    createHtmlTagsearch() {
        const data = SearchOutputPanel.SearchQueryResponse["data"];
        const dataLength = data ? data.length : 0;
        let html = `
    <head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
    <style>
        .container {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: start;
            gap: 1rem;
        }

        .response-item {
            display: flex;
            flex-direction: column;
            gap: .5rem;
            border-bottom: 1px solid grey;
        }

        .info {
            display: flex;
            gap: 1rem;
        }

        .linenumber::before {
            content: "line(s): ";
        }

        .title {
            margin-bottom: 2rem;
        }
    </style>
</head>

<body>
    <h3 class="title">Tagsuche: ${dataLength} Tag(s) gefunden:</h3>
    <div class="container">`;
        let temp = "";
        if (data) {
            for (let i = 0; i < data.length; i++) {
                temp += `<div class="response-item">
        <div class="info">
        <span class="filepath">${data[i].filepath}</span>
        <span class="linenumber">${data[i].lines}</span>
                </div>
            </div>`;
            }
        }
        html += temp;
        html +
            `
    </div>
</body>
    `;
        return html;
    }
}
exports.SearchOutputPanel = SearchOutputPanel;
SearchOutputPanel.viewType = "Wiki-SearchOutput";
//# sourceMappingURL=searchOutputPanel.js.map