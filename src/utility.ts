/**
 * Convenient utility functions ONLY
 */
import * as vscode from 'vscode';
import { homedir } from 'os';

import * as cst from './constants';

// FIXME: move configuration related to config.ts
export let config = vscode.workspace.getConfiguration('textnav');
// export let WORK_FOLDER: string = '';
export let SECTION_MARKER_PATTERN: RegExp | undefined;
export let SECTION_LEVEL_PATTERN: RegExp | undefined;
export let LANGUAGE_PATTERN: RegExp | undefined;
export let LANGUAGES: string[] = [];
export let TRACK_OPTION: string;

// export let MAX_ACTIVE_DOCUMENT = 0;
// export let TRACKER: tracker.ActiveDocument = new tracker.ActiveDocument(2);


// TODO: store temporary files for deletion when deactivated
export let tempfiles = new Set<vscode.Uri>();

/**
 * @returns a unique identifier
 */
export function createUniqueId() {
    let suffix = Math.floor(4294967296 * Math.random()).toString(36);
    let prefix = Date.now().toString(36);
    let uid =  prefix + suffix;
    return uid;
}

/**
 * Add escape characters to string for use with regular expression.
 * @param str a string intended for use in a regular expression
 * @returns string with regular expression special character escaped
 */
export function escapeRegex(str: string) {
    return str.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&');
}

/**
 * Update configuration per changes in user settings.json of extension
 */
export function updateConfig() {
    config = vscode.workspace.getConfiguration('textnav');

    // let baseDir = config.get('workFolderBase') as string;

    // // -- Base directory of work folder
    // if (baseDir === '') {
    //     baseDir = homedir();
    // }

    // let workFolder: string;
    // if (!fs.existsSync(baseDir)) {
    //     workFolder = path.join(homedir(), cst.RELATIVE_WORKFOLDER);
    //     vscode.window.showWarningMessage(`textnav: invalid workFolder, default to ${workFolder}`);
    // } else {
    //     workFolder = path.join(baseDir, cst.RELATIVE_WORKFOLDER);
    // }
    // WORK_FOLDER = workFolder;

    // -- Section Regular Expression
    let tags = config.get('SectionTag') as string[];
    tags = tags.map(
        (item) => {
            // Capture the expression inside /{expression}/, exclude //
            let match = item.match('\/(.+)\/');
            if (match !== null) {
                let expression = match[1];  // captured expression
                return `(${expression})`;
            }
            let literal = escapeRegex(item);
            return `(^[\\t ]*(${literal}))`;
        }
    );
    // NOTE: should be non-capture matching alternates
    //  (^[\\t ]*(literal))|(...)|(expression)|...
    let pattern = tags.join('|');
    SECTION_MARKER_PATTERN = RegExp(pattern, 'gm');

    let tag = config.get('SectionLevelTag') as string;
    SECTION_LEVEL_PATTERN = RegExp(`^(${tag}+)`);

    // -- File Extension Regular Expression
    // let extensions = config.get('navigatorFileExtension') as string[];
    // tags = extensions.map(
    //     (ext) => `(${escapeRegex(ext)})$`  // end of path string
    // );
    // pattern = '(?:' + tags.join('|') + ')';
    // FILE_EXT = RegExp(pattern);

    // -- File Language IDs
    LANGUAGES = config.get('navigatorLanguageId') as string[];
    tags = LANGUAGES.map(
        (str) => `(${escapeRegex(str)})`
    );
    pattern = '(?:' + tags.join('|') + ')';
    LANGUAGE_PATTERN = RegExp(pattern);

    // -- Document Tracker
    TRACK_OPTION = config.get('navigatorTrackingOption') as string;
    // MAX_ACTIVE_DOCUMENT = config.get('navigatorMaxActiveFiles') as number;
    // TRACKER.maxActiveDocument = config.get('navigatorMaxActiveFiles') as number;
}


/**
 * Get extension configuration.
 *
 * @param name - configuration name
 * @returns - configuration value
 */
export function getConfig(name: string) {
    return config.get(name);
}


/**
 * Register configuration handling.
 * @param context of extension
 */
export function registerConfigCallbacks(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration(
            (event) => {
                if (event.affectsConfiguration('textnav')) {
                    updateConfig();
                }
            }
        )
    );

    // TRACKER.register(context);
}


/**
 * Log message to console.
 *
 * @param message - added to console
 */
export function consoleLog(message: string) {
    if (cst.DEBUG) { console.log(message); };
}

/**
 * Find newline used by editor.
 *
 * @returns newLine - current editor newline
 */
export function getNewLine() {
    // \x0A is hex code for `Enter` key which might be better than `\n` ?!
    // let enterKey: string = "\x0A";
    // let enterKey:string = newLine;

    let newLine: string = "\n"; // default to eol === 1
    let editor = vscode.window.activeTextEditor;
    if (editor !== undefined) {
        let eol = editor.document.eol;
        if (eol === 2) {
            newLine = "\r\n";
        }
    }
    return newLine;
}

/**
 *
 * @returns tabSize in number of spaces of active editor.
 * Default is 4, if unresolved.
 */
export function getTabSize() {
    let tabSize = 4;  // spaces

    let editor = vscode.window.activeTextEditor;
    let editorTabSize: string | number | undefined = undefined;
    if (editor) {
        editorTabSize = editor.options.tabSize;
    }
    if (editorTabSize !== undefined && typeof editorTabSize === 'number') {
        tabSize = editorTabSize;
    }
    return tabSize;
}

/**
 * Replace tab with space.
 *
 * @param str - a string
 * @param n - number of spaces
 * @returns str - with tab replaced with spaces
 */
export function replaceTabWithSpace(str: string, n = 4) {
    return str.replace(/\t/gy, " ".repeat(n));
}


/**
 * System wait.
 *
 * @param msec - milliseconds
 * @returns Promise - system waited
 */
export function wait(msec: number = 1000) {
    return new Promise<boolean>(
        (resolve) => setTimeout(
            () => resolve(true),
            msec,
        )
    );
}


/**
 * Remove empty lines, left trim greatest common spaces, trim ends.
 *
 * @param lines - of strings
 * @returns trimLines - trimmed line of string
 */
export function leftAdjustTrim(lines: string[]) {
    lines = lines.filter((item) => item.trim().length > 0);

    let start = 0;
    let isFirst = true;
    let isNewBlock = true;
    let trimLines: string[] = new Array();
    for (let line of lines) {
        // Ensure tab are handled
        line = replaceTabWithSpace(line);
        let begin = line.search(/\S|$/); // index of first non-whitespace
        isNewBlock = begin < start;
        if (isFirst) {
            // First line has hanging spaces
            start = begin;
            isFirst = false;
        }
        if (isNewBlock && !isFirst) {
            start = begin;
        }

        trimLines.push(line.substring(start).trimEnd());
    }
    return trimLines;
}


//-- TEXT
// let word = `a-zA-Z0-9_`;
// let group = `\(\)\{\}\<\>\/\/`;
// /**
//  * Find the matching pattern per character.
//  *
//  * @param str - a line of text
//  * @param expr - input forwarding to string.match()
//  * @param start - starting position to iterated toward finding the match
//  * @param forward - the direction of the iteration
//  * @returns - location of first match or length of text if forward, 0 otherwise.
//  */
// function findRegExp(
//     str: string,
//     expr: string | RegExp,
//     start: number = 0,
//     forward: boolean = true
//   ) {
//     if (forward){
//       for (let i=start; i < str.length; i++){
//         if (str.charAt(i).match(expr)){
//           return i;
//         }
//       }
//       return str.length - 1;
//     } else{
//       for (let i=start; i > 0; i--){
//         if (str.charAt(i).match(expr)){
//           return i;
//         }
//       }
//       return 0;
//     }
//   }
  
//   /**
//    *
//    * @returns - [lineNum, start, stop] useable with setSelection.
//    */
//   function findWord(editor: vscode.TextEditor){
//     // Get the line from active document at cursor
//     let lineNum = editor.selection.start.line;
//     let line = editor.document.lineAt(lineNum);
//     let loc = editor.selection.start.character;
  
//     if (line.isEmptyOrWhitespace) {
//       return[lineNum, loc, loc];
//     }
  
//     let start = loc;
//     if (line.text.charAt(loc).match(/\s/)){  // cursor on a space character
//       start = findRegExp(line.text, /\S/, loc, false);  // find non-space
//     }
//     start = findRegExp(line.text, `\\s|[^${word}]`, start, false);  // find start of word
//     if (start > 0){
//       start += 1;
//     }
//     let stop = findRegExp(line.text, `[^${word}]`, start + 1, true);
//     return [lineNum, start, stop] as const;
//   }
  
  
//   /**
//    * Change editor selection to position [start, stop)
//    *
//    * @param editor - default to vscode.window.activeTextEditor
//    * @param lineNum
//    * @param start
//    * @param stop
//    */
//   function setSelection(
//     editor: vscode.TextEditor | undefined,
//     lineNum: number,
//     start: number,
//     stop: number,
//   ) {
//     if (editor === undefined){
//       editor = vscode.window.activeTextEditor;
//       if (editor === undefined){
//         console.error('Fail to retrieve Active Editor');
//         return;
//       }
//     }
  
//     console.log(`Line: ${lineNum}, char: ${start}-${stop}`);
//     let anchor = editor.selection.start.with(lineNum, start);
//     let active = editor.selection.start.with(lineNum, stop);
//     let selection = new vscode.Selection(anchor, active);
//     editor.selection = selection;
// }
