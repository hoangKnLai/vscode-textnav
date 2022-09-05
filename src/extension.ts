// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";


// function getEditor() {
//   let editor = vscode.window.activeTextEditor;
//   if (editor === undefined) {
//     console.error("Unable to access Active Text Editor");
//     return;
//   }
//   return editor;
// }


// ------- Support -------
function selectText(
  editor: vscode.TextEditor,
  lineNum: number,
  start: number,
  stop: number
) {
  let anchor = editor.selection.start.with(lineNum, start);
  let active = editor.selection.start.with(lineNum, stop);
  editor.selection.anchor = anchor;
  editor.selection.active = active;
  // let selection = new vscode.Selection(anchor, active);
  // editor.revealRange(
  //   selection.with(),
  //   vscode.TextEditorRevealType.InCenterIfOutsideViewport
  // );
}

function selectWord() {
  // Get the line from active document at cursor
  let editor = vscode.window.activeTextEditor;
  if (editor === undefined) {
    console.error("Unable to access Active Text Editor");
    return;
  }

  let lineNum = editor.selection.start.line;
  let line = editor.document.lineAt(lineNum);

  // Find the index of space nearest cursor
  if (line.isEmptyOrWhitespace) {
    return;
  }

  let loc = editor.selection.start.character;
  let stop = line.text.length - 1;
  let start = 0;

  for (let ii = loc; ii < line.text.length; ii++) {
    if (line.text.charAt(ii).match(/[\s]{1}/)) {
      stop = ii;
      break;
    }
  }

  for (let ii = loc; ii > 0; ii--) {
    if (line.text.charAt(ii).match(/[\s]{1}/)) {
      start = ii;
      break;
    }
  }
  selectText(editor, lineNum, start, stop);
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('+"texnav" activated');

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand("texnav.helloWorld", () => {
    // The code you place here will be executed every time your command is executed
    // Display a message box to the user
    vscode.window.showInformationMessage("Hello World from texnav!");
  });

  context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
