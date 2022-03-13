"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Connection = void 0;
const ioclient = require("socket.io-client");
const vscode = require("vscode");
class Connection {
    constructor(rootFolder) {
        this.rootFolder = rootFolder;
        this.socketClient.on("connect", this.onConnectEvent);
        this.socketClient.on("disconnect", this.onDisconnectEvent);
        this.socketClient.on("project_initialized", this.projectInitializeResponse);
        this.socketClient.on("files_changed", this.filesChangedResponse);
        //this.socketClient.on("open_browser", this.openBrowserResponse);
        this.socketClient.on("word_count", this.wordCountResponse);
        //this.socketClient.on("create_wikilink", this.createWikilinkResponse);
        //this.socketClient.on("saved_search_query", this.savedSearchQueryResponse);
        //this.socketClient.on("search_query", this.searchQueryResponse);
    }
    wordCountResponse(arg0, wordCountResponse) {
        //vscode.window.showErrorMessage("error while trying to connect to wiki-server: " + error);
    }
    filesChangedResponse(arg0, filesChangedResponse) {
        vscode.window.showErrorMessage("files_changed: " + arg0);
    }
    projectInitializeResponse(arg0, projectInitializeResponse) {
        vscode.window.showErrorMessage("project_initialized: " + arg0);
    }
    connect() {
        this.socketClient = ioclient("http://localhost:9000");
        this.socketClient.io.on("error", (error) => {
            vscode.window.showErrorMessage("error while trying to connect to wiki-server: " + error);
        });
    }
    onConnectEvent() {
        this.sid = this.socketClient.id;
        vscode.window.showErrorMessage("connected " + this.sid);
    }
    onDisconnectEvent() {
        vscode.window.showErrorMessage("disconnected ");
    }
}
exports.Connection = Connection;
//# sourceMappingURL=sessionManagement.js.map