import { Logger } from "../debug";
import * as vscode from "vscode";
import { SearchOutputPanel } from "../../searchOutputPanel";

export interface FulltextSearchData {
  lines: number[];
  rating: number;
  fullphrase: string;
  filepath: string;
}

export interface TagSearchData {
  filepath: string;
  lines: number[];
}

export interface FulltextSearchResponse {
  type: string;
  data: FulltextSearchData[];
}

export interface TagSearchResponse {
  type: string;
  data: TagSearchData[];
}

export class SearchHandler {
  constructor() {}

  handleResponse(extensionURI: vscode.Uri, res: string, searchResponse: any) {
    Logger.Instance.print(res, "searchHandler");
    let parsedRes: any = JSON.parse(res);

    if ("type" in parsedRes) {
      if (parsedRes["type"] === "fulltextsearch") {
        let fulltextSearchResponse: FulltextSearchResponse = <
          FulltextSearchResponse
        >parsedRes;
        SearchOutputPanel.createOrShow(extensionURI, fulltextSearchResponse);
      } else if (parsedRes["type"] === "tagsearch") {
        let tagSearchResponse: TagSearchResponse = <TagSearchResponse>parsedRes;
        SearchOutputPanel.createOrShow(extensionURI, tagSearchResponse);
      } else if (parsedRes["type"] === "deleted") {
      }
    }
  }

  static getUserInput(emittingFuction: (searchQuery: string) => void) {
    const userInput = vscode.window.showInputBox();
    userInput.then((userInputSearchQuery) => {
      if (userInputSearchQuery) {
        Logger.Instance.print(
          "Got searchquery from user: " + userInputSearchQuery,
          "searchHandler"
        );
        emittingFuction(userInputSearchQuery);
      } else
        Logger.Instance.print(
          "user cancelled input box for searchquery",
          "searchHandler"
        );
    });
  }
}
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
