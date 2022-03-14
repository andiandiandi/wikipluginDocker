import * as vscode from "vscode";
var http = require("http");
var base64 = require("base-64");
import { Logger } from "./management/debug";
import { getLocalIP } from "./management/vscodeUtility";

interface RestObj {
  sid: string;
  filepath: string;
}

export class WikipagePanel {
  /**
   * Track the currently panel. Only allow a single panel to exist at a time.
   */
  public static currentPanel: WikipagePanel | undefined;

  public static readonly viewType = "Wikipage";

  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];
  public static sid: string;
  public static filepath: string;

  public static createOrShow(
    extensionUri: vscode.Uri,
    sid: string,
    filepath: string
  ) {
    Logger.Instance.print("createOrShow", "wikipagePanel");
    WikipagePanel.sid = sid;
    WikipagePanel.filepath = filepath;
    const column = vscode.ViewColumn.Two;
    /*
    vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;
    */
    // If we already have a panel, show it.
    if (WikipagePanel.currentPanel) {
      WikipagePanel.currentPanel._panel.reveal(column);
      WikipagePanel.currentPanel._update();
      return;
    }

    // Otherwise, create a new panel.
    const panel = vscode.window.createWebviewPanel(
      WikipagePanel.viewType,
      "Wikipage",
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

    WikipagePanel.currentPanel = new WikipagePanel(panel, extensionUri);
  }

  public static kill() {
    WikipagePanel.currentPanel?.dispose();
    WikipagePanel.currentPanel = undefined;
  }

  public static revive(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    WikipagePanel.currentPanel = new WikipagePanel(panel, extensionUri);
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

  public static updateCurrentFileIfExists() {
    Logger.Instance.print("updateCurrentFileIfExists", "wikipagePanel");
    if (WikipagePanel.currentPanel != undefined)
      WikipagePanel.currentPanel._update();
  }

  public dispose() {
    Logger.Instance.print("DISPOSING wikipagePanel")
    WikipagePanel.currentPanel = undefined;

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
    const webview = this._panel.webview;
    this._panel.webview.html = "<body><p>hello</p></body>";
    Logger.Instance.print("UPDATED wikipagePanel")
    return
    Logger.Instance.print(getLocalIP() + "");
    if (WikipagePanel.filepath != undefined) {
      Logger.Instance.print(
        "FiLePATH IN UPDATE: " + WikipagePanel.filepath + "\n",
        "wikipagePanel"
      );
      Logger.Instance.print(
        "FiLePATH IN UPDATE: " + base64.encode(WikipagePanel.filepath) + "\n",
        "wikipagePanel"
      );
      const path =
        "/sid/" +
        WikipagePanel.sid +
        "/filepath/" +
        base64.encode(WikipagePanel.filepath);
      var options = {
        host: getLocalIP(),
        port: 9000,
        path: path, // the rest of the url with parameters if needed
        method: "GET", // do GET
      };
      var request = http.request(options, (res: any) => {
        var data = "";
        res.on("data", (chunk: any) => {
          data += chunk;
        });
        res.on("end", () => {
          Logger.Instance.print(
            "got html-data for wikipagePanel",
            "wikipagePanel"
          );
          this._panel.webview.html = "<body><p>asdf</p></body>";
        });
      });
      request.on("error", (e: any) => {
        Logger.Instance.print("got error: " + e.toString());
        console.log("error " + e);
      });
      request.end();
    } else {
      Logger.Instance.print("filepath is undeifned!");
    }

    webview.onDidReceiveMessage(async (data) => {
      switch (data.type) {
        case "onInfo": {
          if (!data.value) {
            return;
          }
          break;
        }
        case "onError": {
          if (!data.value) {
            return;
          }
          vscode.window.showErrorMessage(data.value);
          break;
        }
      }
    });
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    // // And the uri we use to load this script in the webview
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "out", "compiled/swiper.js")
    );

    // Local path to css styles
    const styleResetPath = vscode.Uri.joinPath(
      this._extensionUri,
      "media",
      "reset.css"
    );
    const stylesPathMainPath = vscode.Uri.joinPath(
      this._extensionUri,
      "media",
      "vscode.css"
    );

    // Uri to load styles into webview
    const stylesResetUri = webview.asWebviewUri(styleResetPath);
    const stylesMainUri = webview.asWebviewUri(stylesPathMainPath);
    const cssUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "out", "compiled/swiper.css")
    );

    const html = "test";
    return html;
  }
}
