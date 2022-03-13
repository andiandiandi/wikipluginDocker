"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchHandler = void 0;
const debug_1 = require("../debug");
const vscode = require("vscode");
const searchOutputPanel_1 = require("../../searchOutputPanel");
class SearchHandler {
    constructor() { }
    handleResponse(extensionURI, res, searchResponse) {
        debug_1.Logger.Instance.print(res, "searchHandler");
        let parsedRes = JSON.parse(res);
        if ("type" in parsedRes) {
            if (parsedRes["type"] === "fulltextsearch") {
                let fulltextSearchResponse = parsedRes;
                searchOutputPanel_1.SearchOutputPanel.createOrShow(extensionURI, fulltextSearchResponse);
            }
            else if (parsedRes["type"] === "tagsearch") {
                let tagSearchResponse = parsedRes;
                searchOutputPanel_1.SearchOutputPanel.createOrShow(extensionURI, tagSearchResponse);
            }
            else if (parsedRes["type"] === "deleted") {
            }
        }
    }
    static getUserInput(emittingFuction) {
        const userInput = vscode.window.showInputBox();
        userInput.then((userInputSearchQuery) => {
            if (userInputSearchQuery) {
                debug_1.Logger.Instance.print("Got searchquery from user: " + userInputSearchQuery, "searchHandler");
                emittingFuction(userInputSearchQuery);
            }
            else
                debug_1.Logger.Instance.print("user cancelled input box for searchquery", "searchHandler");
        });
    }
}
exports.SearchHandler = SearchHandler;
/*
{
"type": "fulltextsearch",
"data": [
            {"lines": [4], "rating": 1.0, "fullphrase": "paas asdf monster", "filepath": "c:/Users/PC/Desktop/asdf/w.md"},
            {"lines": [1], "rating": 1.0, "fullphrase": "HelloWorld w asdf", "filepath": "c:/Users/PC/Desktop/asdf/test/lol/lol.md"}
        ]
}
{
"type": "tagsearch",
"data": [
            {"filepath": "c:/Users/PC/Desktop/asdf/test/lol/lol.md", "lines": [3]}
        ]
}
*/
//# sourceMappingURL=searchHandler.js.map