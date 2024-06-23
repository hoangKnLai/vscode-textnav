// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import * as util from './utility';
import * as navi from './navigate';


/**
 * Activate extension
 * 
 * @param context of this extension
 */
export function activate(context: vscode.ExtensionContext) {  
  util.consoleLog("Activated");

  // NOTE: make sure all configuration are loaded and mapping are done FIRST!
  util.updateConfig();

  // Callbacks
  util.registerConfigCallbacks(context);
  navi.registerSectionNavigator(context);
  navi.registerSectionFolding(context);

  // Commands
  navi.registerCommands(context);  
}

// this method is called when your extension is deactivated
export function deactivate() {}
