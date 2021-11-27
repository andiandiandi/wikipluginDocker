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
exports.WikipagePanel = void 0;
const vscode = require("vscode");
var http = require("http");
var base64 = require("base-64");
const debug_1 = require("./management/debug");
class WikipagePanel {
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
    static createOrShow(extensionUri, sid, filepath) {
        debug_1.Logger.Instance.print("createOrShow", "wikipagePanel");
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
        const panel = vscode.window.createWebviewPanel(WikipagePanel.viewType, "Wikipage", 
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
        WikipagePanel.currentPanel = new WikipagePanel(panel, extensionUri);
    }
    static kill() {
        var _a;
        (_a = WikipagePanel.currentPanel) === null || _a === void 0 ? void 0 : _a.dispose();
        WikipagePanel.currentPanel = undefined;
    }
    static revive(panel, extensionUri) {
        WikipagePanel.currentPanel = new WikipagePanel(panel, extensionUri);
    }
    static updateCurrentFileIfExists() {
        debug_1.Logger.Instance.print("updateCurrentFileIfExists", "wikipagePanel");
        if (WikipagePanel.currentPanel != undefined)
            WikipagePanel.currentPanel._update();
    }
    dispose() {
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
    _update() {
        return __awaiter(this, void 0, void 0, function* () {
            const webview = this._panel.webview;
            if (WikipagePanel.filepath != undefined) {
                debug_1.Logger.Instance.print("FiLePATH IN UPDATE: " + WikipagePanel.filepath + "\n", "wikipagePanel");
                debug_1.Logger.Instance.print("FiLePATH IN UPDATE: " + base64.encode(WikipagePanel.filepath) + "\n", "wikipagePanel");
                const path = "/sid/" +
                    WikipagePanel.sid +
                    "/filepath/" +
                    base64.encode(WikipagePanel.filepath);
                var options = {
                    host: "localhost",
                    port: 9000,
                    path: path,
                    method: "GET", // do GET
                };
                var request = http.request(options, (res) => {
                    var data = "";
                    res.on("data", (chunk) => {
                        data += chunk;
                    });
                    res.on("end", () => {
                        debug_1.Logger.Instance.print("got html-data for wikipagePanel", "wikipagePanel");
                        this._panel.webview.html = data;
                    });
                });
                request.on("error", (e) => {
                    debug_1.Logger.Instance.print("got error: " + e.toString());
                    console.log("error " + e);
                });
                request.end();
            }
            else {
                debug_1.Logger.Instance.print("filepath is undeifned!");
            }
            webview.onDidReceiveMessage((data) => __awaiter(this, void 0, void 0, function* () {
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
                    //case "tokens": {
                    //  await Util.globalState.update(accessTokenKey, data.accessToken);
                    //  await Util.globalState.update(refreshTokenKey, data.refreshToken);
                    //  break;
                    //}
                }
            }));
        });
    }
    getNonce() {
        let text = "";
        const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }
    _getHtmlForWebview(webview) {
        // // And the uri we use to load this script in the webview
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "out", "compiled/swiper.js"));
        // Local path to css styles
        const styleResetPath = vscode.Uri.joinPath(this._extensionUri, "media", "reset.css");
        const stylesPathMainPath = vscode.Uri.joinPath(this._extensionUri, "media", "vscode.css");
        // Uri to load styles into webview
        const stylesResetUri = webview.asWebviewUri(styleResetPath);
        const stylesMainUri = webview.asWebviewUri(stylesPathMainPath);
        const cssUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "out", "compiled/swiper.css"));
        // Use a nonce to only allow specific scripts to be run
        const nonce = this.getNonce();
        //const html = getHTML('http://localhost:9000');
        const html = "a";
        return html;
        /*
        return `<!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <!--
                        Use a content security policy to only allow loading images from https or from our extension directory,
                        and only allow scripts that have a specific nonce.
            -->
            <meta http-equiv="Content-Security-Policy" content="img-src https: data:; style-src 'unsafe-inline' ${webview.cspSource}; script-src 'nonce-${nonce}';">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <link href="${stylesResetUri}" rel="stylesheet">
                    <link href="${stylesMainUri}" rel="stylesheet">
            <link href="${cssUri}" rel="stylesheet">
            <script nonce="${nonce}">
            </script>
                </head>
          <body>
          <h1 id="a">asdf</h1>
          <script>
          function getPage(url, from, to) {
            var cached=sessionStorage[url];
            if(!from){from="body";} // default to grabbing body tag
            if(to && to.split){to=document.querySelector(to);} // a string TO turns into an element
            if(!to){to=document.querySelector(from);} // default re-using the source elm as the target elm
            if(cached){return to.innerHTML=cached;} // cache responses for instant re-use re-use
        
            var XHRt = new XMLHttpRequest; // new ajax
            XHRt.responseType='document';  // ajax2 context and onload() event
            XHRt.onload= function() { sessionStorage[url]=to.innerHTML= XHRt.response.querySelector(from).innerHTML;};
            XHRt.open("GET", url, true);
            XHRt.send();
            return XHRt;
          }
          document.getElementById("a").innerHtml = "a";
          const h = getPage("http://localhost:9000");
          document.getElementsByTagName('body')[0].innerHTML = h;
          alert(h);
      </script>
                </body>
                </html>`;
          */
    }
}
exports.WikipagePanel = WikipagePanel;
WikipagePanel.viewType = "Wikipage";
//# sourceMappingURL=wikipagePanel.js.map