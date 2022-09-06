// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
// import XRegExp = require("xregexp");




// ------- CONFIG -------
// TODO: add word expression to config
let word = `a-zA-Z0-9_`;
let group = `\(\)\{\}\<\>\/\/`;

// function getEditor() {
//   let editor = vscode.window.activeTextEditor;
//   if (editor === undefined) {
//     console.error("Unable to access Active Text Editor");
//     return;
//   }
//   return editor;
// }


// ------- SUPPORT -------
/**
 * Find the matching pattern per character.
 *
 * @param str - a line of text
 * @param expr - input forwarding to string.match()
 * @param start - starting position to iterated toward finding the match
 * @param forward - the direction of the iteration
 * @returns - location of first match or length of text if forward, 0 otherwise.
 */
function findRegExp(
  str: string,
  expr: string | RegExp,
  start: number = 0,
  forward: boolean = true
) {
  if (forward){
    for (let i=start; i < str.length; i++){
      if (str.charAt(i).match(expr)){
        return i;
      }
    }
    return str.length - 1;
  } else{
    for (let i=start; i > 0; i--){
      if (str.charAt(i).match(expr)){
        return i;
      }
    }
    return 0;
  }
}

/**
 *
 * @returns - [lineNum, start, stop] useable with setSelection.
 */
function findWord(editor: vscode.TextEditor){
  // Get the line from active document at cursor
  let lineNum = editor.selection.start.line;
  let line = editor.document.lineAt(lineNum);
  let loc = editor.selection.start.character;

  if (line.isEmptyOrWhitespace) {
    return[lineNum, loc, loc];
  }

  let start = loc;
  if (line.text.charAt(loc).match(/\s/)){  // cursor on a space character
    start = findRegExp(line.text, /\S/, loc, false);  // find non-space
  }
  start = findRegExp(line.text, `\\s|[^${word}]`, start, false);  // find start of word
  if (start > 0){
    start += 1;
  }
  let stop = findRegExp(line.text, `[^${word}]`, start + 1, true);
  return [lineNum, start, stop] as const;
}


/**
 * Change editor selection to position [start, stop)
 *
 * @param editor - default to vscode.window.activeTextEditor
 * @param lineNum
 * @param start
 * @param stop
 */
function setSelection(
  editor: vscode.TextEditor | undefined,
  lineNum: number,
  start: number,
  stop: number,
) {
  if (editor === undefined){
    editor = vscode.window.activeTextEditor;
    if (editor === undefined){
      console.error('Fail to retrieve Active Editor');
      return;
    }
  }

  console.log(`Line: ${lineNum}, char: ${start}-${stop}`);
  let anchor = editor.selection.start.with(lineNum, start);
  let active = editor.selection.start.with(lineNum, stop);
  let selection = new vscode.Selection(anchor, active);
  editor.selection = selection;
}


// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('+"texnav" activated');


  // ----- COMMANDS -----
  function selectWord() {
    let editor = vscode.window.activeTextEditor;
    if (editor === undefined) {
      console.error("Unable to access Active Text Editor");
      return;
    }
    let results = findWord(editor);
    let lineNum = results[0];
    let start = results[1];
    let stop = results[2];
    setSelection(editor, lineNum, start, stop);
  }

  // The commandId string must match the command field in package.json
  context.subscriptions.push(
    vscode.commands.registerCommand("texnav.selectWord", selectWord)
  );
}

// this method is called when your extension is deactivated
export function deactivate() {}
