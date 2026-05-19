import { App, Notice, PluginSettingTab, Setting } from "obsidian";
import type RememberWidthPlugin from "./main";
import { DEFAULTS } from "./utils/constants";
import type { RememberWidthSettings } from "./utils/types";

export const DEFAULT_SETTINGS: RememberWidthSettings = {
	globalDefault: DEFAULTS.globalDefault,
	minWidth: DEFAULTS.minWidth,
	maxWidth: DEFAULTS.maxWidth,
	enabled: DEFAULTS.enabled,
	fileWidths: {},
};

export class RememberWidthSettingTab extends PluginSettingTab {
	plugin: RememberWidthPlugin;

	constructor(app: App, plugin: RememberWidthPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName("Default width (px)")
			.setDesc("Used when a file has no saved width.")
			.addText((t) => {
				t.inputEl.type = "number";
				t.setValue(String(this.plugin.settings.globalDefault));
				t.onChange(async (v) => {
					const n = Number(v);
					if (!Number.isFinite(n)) return;
					this.plugin.settings.globalDefault = this.clampToBounds(n);
					await this.plugin.saveSettings();
					this.plugin.refreshAll();
				});
			});

		new Setting(containerEl)
			.setName("Minimum width (px)")
			.setDesc("Lower bound for the slider and inputs.")
			.addText((t) => {
				t.inputEl.type = "number";
				t.setValue(String(this.plugin.settings.minWidth));
				t.onChange(async (v) => {
					const n = Number(v);
					if (!Number.isFinite(n) || n <= 0) return;
					this.plugin.settings.minWidth = Math.round(n);
					if (this.plugin.settings.maxWidth < this.plugin.settings.minWidth) {
						this.plugin.settings.maxWidth = this.plugin.settings.minWidth;
					}
					await this.plugin.saveSettings();
					this.plugin.refreshAll();
				});
			});

		new Setting(containerEl)
			.setName("Maximum width (px)")
			.setDesc("Upper bound for the slider and inputs.")
			.addText((t) => {
				t.inputEl.type = "number";
				t.setValue(String(this.plugin.settings.maxWidth));
				t.onChange(async (v) => {
					const n = Number(v);
					if (!Number.isFinite(n) || n <= 0) return;
					this.plugin.settings.maxWidth = Math.round(n);
					if (this.plugin.settings.maxWidth < this.plugin.settings.minWidth) {
						this.plugin.settings.minWidth = this.plugin.settings.maxWidth;
					}
					await this.plugin.saveSettings();
					this.plugin.refreshAll();
				});
			});

		new Setting(containerEl)
			.setName("Clear all saved widths")
			.setDesc("Remove every per-file width override.")
			.addButton((b) =>
				b
					.setButtonText("Clear all")
					.setWarning()
					.onClick(async () => {
						this.plugin.store.clearAll();
						this.plugin.store.flush();
						this.plugin.refreshAll();
						new Notice("All saved widths cleared.");
						this.display();
					}),
			);

		this.renderFileList(containerEl);
	}

	private renderFileList(containerEl: HTMLElement): void {
		const list = containerEl.createDiv({ cls: "rcw-file-list" });
		list.createEl("h3", { text: "Customized files" });

		const entries = Object.entries(this.plugin.settings.fileWidths);
		if (entries.length === 0) {
			list.createEl("p", {
				text: "No file-specific widths saved yet.",
				cls: "setting-item-description",
			});
			return;
		}

		entries.sort((a, b) => a[0].localeCompare(b[0]));

		for (const [path, width] of entries) {
			const row = list.createDiv({ cls: "rcw-file-row" });
			row.createSpan({ cls: "rcw-file-row-path", text: path });

			const input = row.createEl("input", {
				cls: "rcw-file-row-input",
				attr: { type: "number", inputmode: "numeric" },
			});
			input.min = String(this.plugin.settings.minWidth);
			input.max = String(this.plugin.settings.maxWidth);
			input.value = String(width);

			const commit = () => {
				const n = Number(input.value);
				if (!Number.isFinite(n)) {
					input.value = String(this.plugin.settings.fileWidths[path] ?? width);
					return;
				}
				const clamped = this.clampToBounds(n);
				if (clamped !== n) input.value = String(clamped);
				this.plugin.store.set(path, clamped);
				this.plugin.store.flush();
				this.plugin.widthApplier.applyToFile(path);
				this.plugin.statusBar?.refresh();
			};
			input.addEventListener("change", commit);
			input.addEventListener("keydown", (e) => {
				if (e.key === "Enter") {
					e.preventDefault();
					input.blur();
				}
			});

			row.createSpan({ cls: "rcw-file-row-unit", text: "px" });

			const resetBtn = row.createEl("button", { text: "Reset default" });
			resetBtn.addEventListener("click", () => {
				this.plugin.store.reset(path);
				this.plugin.store.flush();
				this.plugin.widthApplier.applyToFile(path);
				this.plugin.statusBar?.refresh();
				this.display();
			});
		}
	}

	private clampToBounds(n: number): number {
		const { minWidth, maxWidth } = this.plugin.settings;
		return Math.max(minWidth, Math.min(maxWidth, Math.round(n)));
	}
}
