import { MarkdownView, Notice } from "obsidian";
import type RememberWidthPlugin from "../main";

export function registerCommands(plugin: RememberWidthPlugin): void {
	plugin.addCommand({
		id: "reset-width-for-current-file",
		name: "Reset width for this file",
		checkCallback: (checking) => {
			const view = plugin.app.workspace.getActiveViewOfType(MarkdownView);
			const file = view?.file;
			if (!file) return false;
			if (!checking) {
				plugin.store.reset(file.path);
				plugin.widthApplier.applyToFile(file.path);
				plugin.statusBar?.refresh();
				new Notice(`Width reset to default for ${file.basename}`);
			}
			return true;
		},
	});

	plugin.addCommand({
		id: "set-width-for-current-file",
		name: "Set width for this file...",
		checkCallback: (checking) => {
			const view = plugin.app.workspace.getActiveViewOfType(MarkdownView);
			const file = view?.file;
			if (!file) return false;
			if (!checking) {
				plugin.openWidthInputModal(file.path);
			}
			return true;
		},
	});
}
