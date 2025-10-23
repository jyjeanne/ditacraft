const vscode = require('vscode');

function activate(context) {
    console.log('TEST EXTENSION ACTIVATED!');
    vscode.window.showInformationMessage('DitaCraft Test Extension Activated!');

    let disposable = vscode.commands.registerCommand('ditacraftTest.hello', function () {
        vscode.window.showInformationMessage('Hello from DitaCraft Test!');
    });

    context.subscriptions.push(disposable);
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
};
