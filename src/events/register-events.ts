import { TAbstractFile, TFile } from "obsidian";
import type RememberWidthPlugin from "../main";

export function registerEvents(plugin: RememberWidthPlugin): void {
	plugin.registerEvent(
		plugin.app.workspace.on("file-open", () => {
			applyIfEnabled(plugin);
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
			applyIfEnabled(plugin);
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

/**
 * Respect the user's enable switch. When disabled we must clear our markers
 * from any views Obsidian just opened, otherwise stale `data-rcw-managed`
 * attributes keep our CSS active.
 */
function applyIfEnabled(plugin: RememberWidthPlugin): void {
	if (plugin.settings.enabled) {
		plugin.widthApplier.applyToAll();
	} else {
		plugin.widthApplier.clearAll();
	}
}
