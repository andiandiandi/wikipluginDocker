import {
  FulltextSearchData,
  FulltextSearchResponse,
  TagSearchData,
  TagSearchResponse,
} from "./management/handler/searchHandler";
import * as vscode from "vscode";
var http = require("http");
var base64 = require("base-64");
import { Logger } from "./management/debug";

export class SearchOutputPanel {
  /**
   * Track the currently panel. Only allow a single panel to exist at a time.
   */
  public static currentPanel: SearchOutputPanel | undefined;

  public static readonly viewType = "Wiki-SearchOutput";

  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];
  public static SearchQueryResponse: FulltextSearchResponse | TagSearchResponse;

  public static createOrShow(
    extensionUri: vscode.Uri,
    fulltextSearchResponse: FulltextSearchResponse | TagSearchResponse
  ) {
    Logger.Instance.print("createOrShow", "searchOutputPanel");
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
    const panel = vscode.window.createWebviewPanel(
      SearchOutputPanel.viewType,
      "Wiki-SearchOutput",
      //column ||
      { viewColumn: vscode.ViewColumn.Two, preserveFocus: true },
      {
        // Enable javascript in the webview
        enableScripts: true,
        // And restrict the webview to only loading content from our extension's `media` directory.
        // localResourceRoots: [
        //   vscode.Uri.joinPath(extensionUri, "media"),
        //   vscode.Uri.joinPath(extensionUri, "out/*"),
        // ],
      }
    );

    SearchOutputPanel.currentPanel = new SearchOutputPanel(panel, extensionUri);
  }

  public static kill() {
    SearchOutputPanel.currentPanel?.dispose();
    SearchOutputPanel.currentPanel = undefined;
  }

  public static revive(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    SearchOutputPanel.currentPanel = new SearchOutputPanel(panel, extensionUri);
  }

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this._panel = panel;
    this._extensionUri = extensionUri;

    // Set the webview's initial html content
    Logger.Instance.print("before Update");
    this._update();
    Logger.Instance.print("after Update");

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

  public dispose() {
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

  private async _update() {
    Logger.Instance.print(
      "updating: " + JSON.stringify(SearchOutputPanel.SearchQueryResponse),
      "searchoutputpanel"
    );
    let html = "";
    if (SearchOutputPanel.SearchQueryResponse["type"] === "fulltextsearch") {
      html = this.createHtmlFulltextsearch();
    } else if (SearchOutputPanel.SearchQueryResponse["type"] === "tagsearch") {
      html = this.createHtmlTagsearch();
    }
    this._panel.webview.html = html;
  }

  private createHtmlFulltextsearch(): string {
    const data = SearchOutputPanel.SearchQueryResponse[
      "data"
    ] as FulltextSearchData[];
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

  private createHtmlTagsearch(): string {
    const data = SearchOutputPanel.SearchQueryResponse[
      "data"
    ] as TagSearchData[];
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
