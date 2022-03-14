import { Logger } from "../debug";
import { PathManager } from "../pathManagement";
import { getRangeOfCursorSelection } from "../vscodeUtility";

import * as vscode from "vscode";
getRangeOfCursorSelection;
interface WikilinkResponse {
  type: string;
  filename: string;
  templates: string[];
  folders: string[];
}

interface FileResponse {
  title: string;
  link: string;
  tooltip: string;
}

interface DirektLinkResponse {
  type: string;
  files: FileResponse[];
}

//1.let pick template
//2.send create wikipage
/*const userInput = vscode.window.showInputBox({
          placeHolder: "myplaceholder",
          prompt: "Here is the prompt",
        });
        */

export class WikilinkHandler {
  constructor() {}

  handleResponse(
    cb: (data: {
      type: string;
      word?: string;
      srcPath: string;
      template?: string;
      folder?: string;
      filename?: string;
    }) => void,
    res: string,
    wikilinkResponse: any
  ) {
    Logger.Instance.print("wikilink: " + res, "wikilinkHandler");
    let parsedRes: any = JSON.parse(res);

    if ("type" in parsedRes) {
      if (parsedRes["type"] === "create") {
        let wikilinkResponse: WikilinkResponse = <WikilinkResponse>parsedRes;
        const userInputTemplates = vscode.window.showQuickPick(
          ["no template", ...wikilinkResponse.templates],
          {
            canPickMany: false,
            placeHolder: "Welches Template soll verwendet werden?",
          }
        );
        userInputTemplates.then((templatePicked) => {
          if (templatePicked) {
            const userInputDestinationFolder = vscode.window.showQuickPick(
              wikilinkResponse.folders,
              {
                canPickMany: false,
                placeHolder: "Wo soll die Wikiseite erstellt werden?",
              }
            );

            templatePicked === "no template"
              ? userInputDestinationFolder.then(
                  this.createWikilinkAndWikipage.bind(
                    this,
                    wikilinkResponse,
                    cb,
                    ""
                  )
                )
              : userInputDestinationFolder.then(
                  this.createWikilinkAndWikipage.bind(
                    this,
                    wikilinkResponse,
                    cb,
                    templatePicked
                  )
                );
          }
        });
      }

      if (parsedRes["type"] === "directlink") {
        const direktLinkResponse = parsedRes as DirektLinkResponse;
        Logger.Instance.print(
          JSON.stringify(direktLinkResponse),
          "wikilinkHandler"
        );
        this.createDirectWikiOrImagelink(
          direktLinkResponse["type"],
          direktLinkResponse.files[0].title,
          direktLinkResponse.files[0].link
        );
      }

      if (parsedRes["type"] === "directimagelink") {
        let directLinkResponse: DirektLinkResponse = <DirektLinkResponse>(
          parsedRes
        );
        const userInputTemplates = vscode.window.showQuickPick(
          directLinkResponse.files.map((f) => f.tooltip),
          {
            canPickMany: false,
            placeHolder: "Für welche Grafik soll ein Link erstellt werden?",
          }
        );
        userInputTemplates.then((fullpathOfImage) => {
          if (fullpathOfImage) {
            const pickedFileResponse = directLinkResponse.files.filter(
              (f) => f.tooltip === fullpathOfImage
            )[0];
            this.createDirectWikiOrImagelink(
              directLinkResponse["type"],
              pickedFileResponse.title,
              pickedFileResponse.link
            );
          }
        });
      }

      if (parsedRes["type"] === "createimagelink") {
        this.createEmptyImagelink();
      }
    }
  }

  private createWikilinkAndWikipage(
    wikilinkResponse: WikilinkResponse,
    cb: (data: {
      type: string;
      word?: string;
      srcPath: string;
      template?: string;
      folder?: string;
      filename?: string;
    }) => void,
    templatePicked: string,
    folder: string | undefined
  ) {
    if (folder) {
      Logger.Instance.print("folder: " + folder, "wikilinkHandler");
      Logger.Instance.print(templatePicked, "wikilinkHandler");
      Logger.Instance.print(
        "response: " + wikilinkResponse.filename,
        "wikilinkHandler"
      );
      cb({
        type: "create",
        template: templatePicked,
        folder: folder,
        filename: wikilinkResponse.filename,
        srcPath: PathManager.Instance.FilepathToPosix(
          PathManager.Instance.rootFolderFull()!
        ),
      });
    } else {
      Logger.Instance.print("no input", "wikilinkHandler");
      Logger.Instance.print(templatePicked, "wikilinkHandler");
    }
  }

  private createDirectWikiOrImagelink(
    type: string,
    title: string,
    link: string
  ) {
    const textEditor = vscode.window.activeTextEditor;
    if (textEditor) {
      const rangeOfCursorSelection = getRangeOfCursorSelection();
      if (rangeOfCursorSelection) {
        if (type === "directlink") {
          textEditor.edit(function (editBuilder) {
            editBuilder.replace(rangeOfCursorSelection, `[${title}](${link})`);
          });
        } else if (type === "directimagelink") {
          textEditor.edit(function (editBuilder) {
            editBuilder.replace(rangeOfCursorSelection, `![${title}](${link})`);
          });
        }
      }
    } else Logger.Instance.print("no input", "wikilinkHandler");
  }

  private createEmptyImagelink() {
    const textEditor = vscode.window.activeTextEditor;
    if (textEditor) {
      const rangeOfCursorSelection = getRangeOfCursorSelection();
      if (rangeOfCursorSelection) {
        textEditor.edit(function (editBuilder) {
          editBuilder.replace(rangeOfCursorSelection, `![]()`);
        });
      }
    }
  }
}

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
