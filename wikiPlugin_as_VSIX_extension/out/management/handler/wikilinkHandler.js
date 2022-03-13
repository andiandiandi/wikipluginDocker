"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WikilinkHandler = void 0;
const debug_1 = require("../debug");
const pathManagement_1 = require("../pathManagement");
const vscodeUtility_1 = require("../vscodeUtility");
const vscode = require("vscode");
vscodeUtility_1.getRangeOfCursorSelection;
//1.let pick template
//2.send create wikipage
/*const userInput = vscode.window.showInputBox({
          placeHolder: "myplaceholder",
          prompt: "Here is the prompt",
        });
        */
class WikilinkHandler {
    constructor() { }
    handleResponse(cb, res, wikilinkResponse) {
        debug_1.Logger.Instance.print("wikilink: " + res, "wikilinkHandler");
        let parsedRes = JSON.parse(res);
        if ("type" in parsedRes) {
            if (parsedRes["type"] === "create") {
                let wikilinkResponse = parsedRes;
                const userInputTemplates = vscode.window.showQuickPick(["no template", ...wikilinkResponse.templates], {
                    canPickMany: false,
                    placeHolder: "Welches Template soll verwendet werden?",
                });
                userInputTemplates.then((templatePicked) => {
                    if (templatePicked) {
                        const userInputDestinationFolder = vscode.window.showQuickPick(wikilinkResponse.folders, {
                            canPickMany: false,
                            placeHolder: "Wo soll die Wikiseite erstellt werden?",
                        });
                        templatePicked === "no template"
                            ? userInputDestinationFolder.then(this.createWikilinkAndWikipage.bind(this, wikilinkResponse, cb, ""))
                            : userInputDestinationFolder.then(this.createWikilinkAndWikipage.bind(this, wikilinkResponse, cb, templatePicked));
                    }
                });
            }
            if (parsedRes["type"] === "directlink") {
                const direktLinkResponse = parsedRes;
                debug_1.Logger.Instance.print(JSON.stringify(direktLinkResponse), "wikilinkHandler");
                this.createDirectWikiOrImagelink(direktLinkResponse["type"], direktLinkResponse.files[0].title, direktLinkResponse.files[0].link);
            }
            if (parsedRes["type"] === "directimagelink") {
                let directLinkResponse = (parsedRes);
                const userInputTemplates = vscode.window.showQuickPick(directLinkResponse.files.map((f) => f.tooltip), {
                    canPickMany: false,
                    placeHolder: "Für welche Grafik soll ein Link erstellt werden?",
                });
                userInputTemplates.then((fullpathOfImage) => {
                    if (fullpathOfImage) {
                        const pickedFileResponse = directLinkResponse.files.filter((f) => f.tooltip === fullpathOfImage)[0];
                        this.createDirectWikiOrImagelink(directLinkResponse["type"], pickedFileResponse.title, pickedFileResponse.link);
                    }
                });
            }
            if (parsedRes["type"] === "createimagelink") {
                this.createEmptyImagelink();
            }
        }
    }
    createWikilinkAndWikipage(wikilinkResponse, cb, templatePicked, folder) {
        if (folder) {
            debug_1.Logger.Instance.print("folder: " + folder, "wikilinkHandler");
            debug_1.Logger.Instance.print(templatePicked, "wikilinkHandler");
            debug_1.Logger.Instance.print("response: " + wikilinkResponse.filename, "wikilinkHandler");
            cb({
                type: "create",
                template: templatePicked,
                folder: folder,
                filename: wikilinkResponse.filename,
                srcPath: pathManagement_1.PathManager.Instance.FilepathToPosix(pathManagement_1.PathManager.Instance.rootFolderFull()),
            });
        }
        else {
            debug_1.Logger.Instance.print("no input", "wikilinkHandler");
            debug_1.Logger.Instance.print(templatePicked, "wikilinkHandler");
        }
    }
    createDirectWikiOrImagelink(type, title, link) {
        const textEditor = vscode.window.activeTextEditor;
        if (textEditor) {
            const rangeOfCursorSelection = vscodeUtility_1.getRangeOfCursorSelection();
            if (rangeOfCursorSelection) {
                if (type === "directlink") {
                    textEditor.edit(function (editBuilder) {
                        editBuilder.replace(rangeOfCursorSelection, `[${title}](${link})`);
                    });
                }
                else if (type === "directimagelink") {
                    textEditor.edit(function (editBuilder) {
                        editBuilder.replace(rangeOfCursorSelection, `![${title}](${link})`);
                    });
                }
            }
        }
        else
            debug_1.Logger.Instance.print("no input", "wikilinkHandler");
    }
    createEmptyImagelink() {
        const textEditor = vscode.window.activeTextEditor;
        if (textEditor) {
            const rangeOfCursorSelection = vscodeUtility_1.getRangeOfCursorSelection();
            if (rangeOfCursorSelection) {
                textEditor.edit(function (editBuilder) {
                    editBuilder.replace(rangeOfCursorSelection, `![]()`);
                });
            }
        }
    }
}
exports.WikilinkHandler = WikilinkHandler;
/*
if d["type"] == "directlink":
                files = d["files"]
                localApi.runWindowCommand(self.root_folder,"create_wikilink",args={"files":files})
            elif d["type"] == "create":
                templates = d["templates"]
                folders = d["folders"]
                filename = d["filename"]
                localApi.runWindowCommand(self.root_folder,"show_wikilink_options",args={"templates":templates,"folders":folders,"filename":filename})
            elif d["type"] == "directimagelink":
                files = d["files"]
                localApi.runWindowCommand(self.root_folder,"create_imagelink",args={"files":files})
            elif d["type"] == "createimagelink":
                localApi.runWindowCommand(self.root_folder,"create_imagelink")
*/
/*
{"type": "create",
 "filename": "second",
  "templates": ["headerTemplate"],
  "folders": [
    "c:/Users/PC/Desktop/asdf",
    "c:/Users/PC/Desktop/asdf\\test",
    "c:/Users/PC/Desktop/asdf\\test\\lol"
    ]
}
*/
/*
{"type": "directimagelink",
"files": [
        {
            "title": "",
            "link": "..\\..\\CompanyLogo.png",
            "tooltip": "c:/Users/PC/Desktop/asdf/CompanyLogo.png"
        }
    ]
}
*/
/*
{"type": "createimagelink"}
*/
//# sourceMappingURL=wikilinkHandler.js.map