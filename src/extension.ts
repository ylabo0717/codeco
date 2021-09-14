import * as vscode from 'vscode';

// this method is called when vs code is activated
export function activate(context: vscode.ExtensionContext) {
	let timeout: NodeJS.Timer | undefined = undefined;

	// create a decorator type that we use to decorate end of line
	const eolDecoration = vscode.window.createTextEditorDecorationType({});
	const lfColor = { id: 'codeco.lfColor' };
	const crlfColor = { id: 'codeco.crlfColor' };
	const crColor = { id: 'codeco.crColor' };

	// create a decorator type that we use to decorate full-width space
	const fullWidthSpaceDecorationType = vscode.window.createTextEditorDecorationType({
		cursor: 'crosshair',
		backgroundColor: { id: 'codeco.fullWidthSpaceBackground' }
	});

	// Get Config
	const updateDelay = vscode.workspace.getConfiguration('codeco')['updateDelay'];
	const displayEOL = vscode.workspace.getConfiguration('codeco')['displayEOL'];
	const displayFullWidthSpace = vscode.workspace.getConfiguration('codeco')['displayFullWidthSpace'];

	let activeEditor = vscode.window.activeTextEditor;

	function updateDecorations() {
		if (!activeEditor) {
			return;
		}
		const text = activeEditor.document.getText();
		const regEx = /(\u3000)|(\r(?!\n))|(\r?\n)/g;
		const fullWidthSpace: vscode.DecorationOptions[] = [];
		const eol: vscode.DecorationOptions[] = [];
		let match;
		while ((match = regEx.exec(text))) {
			if (/\u3000/g.test(match[0]) && displayFullWidthSpace) {
				const startPos = activeEditor.document.positionAt(match.index);
				const endPos = activeEditor.document.positionAt(match.index + match[0].length);
				const decoration = { range: new vscode.Range(startPos, endPos) };
				fullWidthSpace.push(decoration);
			} else if (/(\r(?!\n))|(\r?\n)/g.test(match[0]) && displayEOL) {
				const decorationText = getEolDecorationInfo(match[0]);
				const decTxt = decorationText[0];
				const decColor = decorationText[1];
				const startPos = activeEditor.document.positionAt(match.index);
				const endPos = activeEditor.document.positionAt(match.index);
				const decoration = {
					range: new vscode.Range(startPos, endPos),
					renderOptions: {
						after: {
							contentText: decTxt,
							color: decColor
						}
					}
				};
				eol.push(decoration);
			}
		}
		activeEditor.setDecorations(fullWidthSpaceDecorationType, fullWidthSpace);
		activeEditor.setDecorations(eolDecoration, eol);
	}

	function triggerUpdateDecorations() {
		if (timeout) {
			clearTimeout(timeout);
			timeout = undefined;
		}
		timeout = setTimeout(updateDecorations, updateDelay);
	}

	if (activeEditor) {
		triggerUpdateDecorations();
	}

	vscode.window.onDidChangeActiveTextEditor(editor => {
		activeEditor = editor;
		if (editor) {
			triggerUpdateDecorations();
		}
	}, null, context.subscriptions);

	vscode.workspace.onDidChangeTextDocument(event => {
		if (activeEditor && event.document === activeEditor.document) {
			triggerUpdateDecorations();
		}
	}, null, context.subscriptions);

	var getEolDecorationInfo = function(match: string) : [string, {id: string}] {
		switch (match) {
			case '\n':       // LF
				return ['↓', lfColor];
			case '\r\n':     // CR+LF
				return ['↵', crlfColor];
			case '\r':       // CR
				return ['←', crColor];
			default:
				return ['', {id: ''}];
		}
	};
}

