import { TAbstractFile, TFile } from "obsidian";
import type RememberWidthPlugin from "../main";

export function registerEvents(plugin: RememberWidthPlugin): void {
	plugin.registerEvent(
		plugin.app.workspace.on("file-open", () => {
			plugin.widthApplier.applyToAll();
			plugin.statusBar?.refresh();
		}),
	);

	plugin.registerEvent(
		plugin.app.workspace.on("active-leaf-change", () => {
			plugin.statusBar?.refresh();
		}),
	);

	plugin.registerEvent(
		plugin.app.workspace.on("layout-change", () => {
			plugin.widthApplier.applyToAll();
			plugin.statusBar?.refresh();
		}),
	);

	plugin.registerEvent(
		plugin.app.vault.on("rename", (file: TAbstractFile, oldPath: string) => {
			if (file instanceof TFile) {
				plugin.store.rename(oldPath, file.path);
				plugin.statusBar?.refresh();
			}
		}),
	);

	plugin.registerEvent(
		plugin.app.vault.on("delete", (file: TAbstractFile) => {
			if (file instanceof TFile) {
				plugin.store.delete(file.path);
			}
		}),
	);
}
