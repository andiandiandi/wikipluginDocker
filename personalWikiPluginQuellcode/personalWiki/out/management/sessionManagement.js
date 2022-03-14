"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionManager = void 0;
const wikilinkHandler_1 = require("./handler/wikilinkHandler");
const searchHandler_1 = require("./handler/searchHandler");
const wikipagePanel_1 = require("../wikipagePanel");
const vscodeUtility_1 = require("./vscodeUtility");
const debug_1 = require("./debug");
const vscode = require("vscode");
const ioclient = require("socket.io-client");
class SessionManager {
    constructor() {
        this._connections = new Map();
    }
    get connections() {
        return this._connections;
    }
    static get Instance() {
        return this._instance || (this._instance = new this());
    }
    createConnection(rootFolder, extensionURI) {
        return new Connection(rootFolder, extensionURI);
    }
    hasProject(rootFolder) {
        return rootFolder in this._connections;
    }
    getConnection(rootFolder) {
        return this._connections.get(rootFolder);
    }
    add(connection) {
        this._connections.set(connection.rootFolder, connection);
    }
    remove(connection) {
        this._connections.delete(connection.rootFolder);
    }
}
exports.SessionManager = SessionManager;
SessionManager.wikiServerRunning = false;
class Connection {
    constructor(rootFolder, extensionURI) {
        this._rootFolder = rootFolder;
        this._extensionURI = extensionURI;
        debug_1.Logger.Instance.print("init connection-obj with rootfolder: " + this.rootFolder, "connection");
        this.wikilinkHandler = new wikilinkHandler_1.WikilinkHandler();
        this.searchHandler = new searchHandler_1.SearchHandler();
    }
    get rootFolder() {
        return this._rootFolder;
    }
    get extensionURI() {
        return this._extensionURI;
    }
    get sid() {
        var _a;
        return (_a = this.socketClient) === null || _a === void 0 ? void 0 : _a.id;
    }
    connect() {
        try {
            this.socketClient = ioclient(`http://${vscodeUtility_1.getLocalIP()}:9000`, {
                reconnection: false,
            });
            this.socketClient.io.on("connect_error", (error) => {
                debug_1.Logger.Instance.print("could not connect to wiki-server, wiki-server not running? " + error, "connection");
            });
            this.socketClient.io.on("error", (error) => {
                debug_1.Logger.Instance.print("error while connecting to wiki-server: " + error, "connection");
            });
            this.socketClient.on("connect", this.onConnectEvent.bind(this));
            this.socketClient.on("disconnect", this.onDisconnectEvent.bind(this));
            this.socketClient.on("project_initialized", this.projectInitializeResponse);
            this.socketClient.on("files_changed", this.filesChangedResponse.bind(this));
            //this.socketClient.on("open_browser", this.openBrowserResponse.bind(this));
            this.socketClient.on("word_count", this.wordCountResponse.bind(this));
            //this.socketClient.on("saved_search_query", this.savedSearchQueryResponse.bind(this));
            this.socketClient.on("create_wikilink", this.wikilinkHandler.handleResponse.bind(this.wikilinkHandler, this.sendWikilink.bind(this)));
            this.socketClient.on("search_query", this.searchHandler.handleResponse.bind(this.searchHandler, this.extensionURI));
            this.socketClient.on("sel_files", this.selectFilesResponse.bind(this));
            this.socketClient.on("sel_content", this.selectContentResponse.bind(this));
        }
        catch (e) {
            debug_1.Logger.Instance.print("error while connecting to wiki-server: " + e, "connection");
        }
    }
    isConnected() {
        var _a, _b;
        debug_1.Logger.Instance.print("is connected? : " + ((_a = this.socketClient) === null || _a === void 0 ? void 0 : _a.connected), "connection");
        return (_b = this.socketClient) === null || _b === void 0 ? void 0 : _b.connected;
    }
    disconnect() {
        this.socketClient.disconnect();
    }
    sendWikilink(data) {
        debug_1.Logger.Instance.print("emmiting: " + JSON.stringify(data), "connection");
        this.socketClient.emit("create_wikilink", JSON.stringify(data));
    }
    sendSearchQuery(searchQuery) {
        this.socketClient.emit("search_query", searchQuery);
    }
    sendWordCount(rootFolder = "") {
        this.socketClient.emit("word_count", rootFolder);
    }
    sendDEBUGselContent() {
        this.socketClient.emit("sel_content", "");
    }
    selectContentResponse(arg0, selContentResponse) {
        debug_1.Logger.Instance.print("selContent: " + arg0, "connection");
    }
    sendDEBUGselFiles() {
        this.socketClient.emit("sel_files", "");
    }
    selectFilesResponse(arg0, selFilesResponse) {
        debug_1.Logger.Instance.print("selFiles: " + arg0, "connection");
    }
    wordCountResponse(arg0, wordCountResponse) {
        const wordCountObj = JSON.parse(arg0);
        vscode.window.showInformationMessage("words: " +
            wordCountObj.words +
            "  chars: " +
            wordCountObj.chars +
            "  readtime (seconds): " +
            wordCountObj.readtimeInSeconds);
        debug_1.Logger.Instance.print("wordcount: " + arg0, "connection");
    }
    sendInitializeProject(rootFolder) {
        this.socketClient.emit("initialize_project", rootFolder);
        this.socketClient.on("initialize_project", () => {
            debug_1.Logger.Instance.print("project initialized", "connection");
        });
    }
    projectInitializeResponse(arg0, projectInitializeResponse) {
        vscode.window.showInformationMessage("Wiki initialized");
        debug_1.Logger.Instance.print("received projectInitializedEvent", "connection");
    }
    filesChangedResponse(arg0, filesChangedResponse) {
        debug_1.Logger.Instance.print("received filesChangedEvent: " + arg0, "connection");
        wikipagePanel_1.WikipagePanel.updateCurrentFileIfExists();
    }
    onConnectEvent() {
        vscode.window.showInformationMessage("Connected to Wiki-Server");
        SessionManager.wikiServerRunning = true;
        debug_1.Logger.Instance.print("onConnectEvent with sid: " + this.sid, "connection");
        this.sendInitializeProject(this.rootFolder);
    }
    onDisconnectEvent() {
        vscode.window.showInformationMessage("Disconnected from Wiki-Server");
        SessionManager.wikiServerRunning = false;
        SessionManager.Instance.remove(this);
        debug_1.Logger.Instance.print("onDisconnectEvent", "connection");
    }
}
//# sourceMappingURL=sessionManagement.js.map