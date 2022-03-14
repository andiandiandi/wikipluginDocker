import { WikilinkHandler } from "./handler/wikilinkHandler";
import { SearchHandler } from "./handler/searchHandler";
import { WikipagePanel } from "../wikipagePanel";
import { getLocalIP } from "./vscodeUtility";
import { Logger } from "./debug";

import * as vscode from "vscode";
import { connected } from "process";
const ioclient = require("socket.io-client");

export class SessionManager {
  private static _instance: SessionManager;
  private _connections: Map<string, Connection>;
  public static wikiServerRunning = false;
  public get connections(): Map<string, Connection> {
    return this._connections;
  }
  private constructor() {
    this._connections = new Map();
  }
  public static get Instance() {
    return this._instance || (this._instance = new this());
  }
  createConnection(rootFolder: string, extensionURI: vscode.Uri) {
    return new Connection(rootFolder, extensionURI);
  }

  hasProject(rootFolder: string) {
    return rootFolder in this._connections;
  }

  getConnection(rootFolder: string) {
    return this._connections.get(rootFolder);
  }

  add(connection: Connection) {
    this._connections.set(connection.rootFolder, connection);
  }

  remove(connection: Connection) {
    this._connections.delete(connection.rootFolder);
  }
}

class Connection {
  private socketClient: any;
  private _rootFolder: string;
  public get rootFolder(): string {
    return this._rootFolder;
  }
  private _extensionURI: vscode.Uri;
  public get extensionURI(): vscode.Uri {
    return this._extensionURI;
  }
  public get sid() {
    return this.socketClient?.id;
  }
  private wikilinkHandler: WikilinkHandler;
  private searchHandler: SearchHandler;

  constructor(rootFolder: string, extensionURI: vscode.Uri) {
    this._rootFolder = rootFolder;
    this._extensionURI = extensionURI;
    Logger.Instance.print(
      "init connection-obj with rootfolder: " + this.rootFolder,
      "connection"
    );

    this.wikilinkHandler = new WikilinkHandler();
    this.searchHandler = new SearchHandler();
  }

  connect() {
    try {
      this.socketClient = ioclient(`http://${getLocalIP()}:9000`, {
        reconnection: false,
      });
      this.socketClient.io.on("connect_error", (error: any) => {
        Logger.Instance.print(
          "could not connect to wiki-server, wiki-server not running? " + error,
          "connection"
        );
      });
      this.socketClient.io.on("error", (error: any) => {
        Logger.Instance.print(
          "error while connecting to wiki-server: " + error,
          "connection"
        );
      });
      this.socketClient.on("connect", this.onConnectEvent.bind(this));
      this.socketClient.on("disconnect", this.onDisconnectEvent.bind(this));
      this.socketClient.on(
        "project_initialized",
        this.projectInitializeResponse
      );
      this.socketClient.on(
        "files_changed",
        this.filesChangedResponse.bind(this)
      );
      //this.socketClient.on("open_browser", this.openBrowserResponse.bind(this));
      this.socketClient.on("word_count", this.wordCountResponse.bind(this));
      //this.socketClient.on("saved_search_query", this.savedSearchQueryResponse.bind(this));
      this.socketClient.on(
        "create_wikilink",
        this.wikilinkHandler.handleResponse.bind(
          this.wikilinkHandler,
          this.sendWikilink.bind(this)
        )
      );
      this.socketClient.on(
        "search_query",
        this.searchHandler.handleResponse.bind(
          this.searchHandler,
          this.extensionURI
        )
      );
      this.socketClient.on("sel_files", this.selectFilesResponse.bind(this));
      this.socketClient.on(
        "sel_content",
        this.selectContentResponse.bind(this)
      );
    } catch (e: unknown) {
      Logger.Instance.print(
        "error while connecting to wiki-server: " + e,
        "connection"
      );
    }
  }

  isConnected() {
    Logger.Instance.print(
      "is connected? : " + this.socketClient?.connected,
      "connection"
    );
    return this.socketClient?.connected;
  }

  disconnect() {
    this.socketClient.disconnect();
  }

  sendWikilink(data: {
    type: string;
    word?: string;
    srcPath: string;
    template?: string;
    folder?: string;
    filename?: string;
  }) {
    Logger.Instance.print("emmiting: " + JSON.stringify(data), "connection");
    this.socketClient.emit("create_wikilink", JSON.stringify(data));
  }

  sendSearchQuery(searchQuery: String) {
    this.socketClient.emit("search_query", searchQuery);
  }

  sendWordCount(rootFolder = "") {
    this.socketClient.emit("word_count", rootFolder);
  }

  sendDEBUGselContent() {
    this.socketClient.emit("sel_content", "");
  }

  selectContentResponse(arg0: string, selContentResponse: any) {
    Logger.Instance.print("selContent: " + arg0, "connection");
  }

  sendDEBUGselFiles() {
    this.socketClient.emit("sel_files", "");
  }

  selectFilesResponse(arg0: string, selFilesResponse: any) {
    Logger.Instance.print("selFiles: " + arg0, "connection");
  }

  wordCountResponse(arg0: string, wordCountResponse: any) {
    const wordCountObj: {
      words: number;
      chars: number;
      readtimeInSeconds: number;
    } = JSON.parse(arg0);
    vscode.window.showInformationMessage(
      "words: " +
        wordCountObj.words +
        "  chars: " +
        wordCountObj.chars +
        "  readtime (seconds): " +
        wordCountObj.readtimeInSeconds
    );
    Logger.Instance.print("wordcount: " + arg0, "connection");
  }

  sendInitializeProject(rootFolder: string) {
    this.socketClient.emit("initialize_project", rootFolder);
    this.socketClient.on("initialize_project", () => {
      Logger.Instance.print("project initialized", "connection");
    });
  }

  projectInitializeResponse(arg0: string, projectInitializeResponse: any) {
    vscode.window.showInformationMessage("Wiki initialized");
    Logger.Instance.print("received projectInitializedEvent", "connection");
  }

  filesChangedResponse(arg0: string, filesChangedResponse: any) {
    Logger.Instance.print("received filesChangedEvent: " + arg0, "connection");
    WikipagePanel.updateCurrentFileIfExists();
  }

  onConnectEvent() {
    vscode.window.showInformationMessage("Connected to Wiki-Server");
    SessionManager.wikiServerRunning = true;
    Logger.Instance.print("onConnectEvent with sid: " + this.sid, "connection");
    this.sendInitializeProject(this.rootFolder);
  }

  onDisconnectEvent() {
    vscode.window.showInformationMessage("Disconnected from Wiki-Server");
    SessionManager.wikiServerRunning = false;
    SessionManager.Instance.remove(this);
    Logger.Instance.print("onDisconnectEvent", "connection");
  }
}
