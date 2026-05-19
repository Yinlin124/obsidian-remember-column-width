import { Plugin } from "obsidian";

import { registerCommands } from "./commands/register-commands";
import { registerEvents } from "./events/register-events";
import { DEFAULT_SETTINGS, RememberWidthSettingTab } from "./settings";
import { WidthStore } from "./storage/width-store";
import { StatusBarSlider } from "./ui/status-bar-slider";
import { WidthApplier } from "./ui/width-applier";
import { WidthInputModal } from "./ui/width-input-modal";
import type { RememberWidthSettings } from "./utils/types";

export default class RememberWidthPlugin extends Plugin {
	settings!: RememberWidthSettings;
	store!: WidthStore;
	widthApplier!: WidthApplier;
	statusBar: StatusBarSlider | null = null;

	async onload(): Promise<void> {
		await this.loadSettings();

		this.store = new WidthStore(this);
		this.widthApplier = new WidthApplier(this);

		const statusBarEl = this.addStatusBarItem();
		this.statusBar = new StatusBarSlider(this, statusBarEl);

		this.addSettingTab(new RememberWidthSettingTab(this.app, this));

		registerEvents(this);
		registerCommands(this);

		this.app.workspace.onLayoutReady(() => {
			this.refreshAll();
		});
	}

	onunload(): void {
		this.store?.flush();
		this.widthApplier?.clearAll();
	}

	async loadSettings(): Promise<void> {
		const loaded = (await this.loadData()) as Partial<RememberWidthSettings> | null;
		this.settings = {
			...DEFAULT_SETTINGS,
			...(loaded ?? {}),
			fileWidths: { ...(loaded?.fileWidths ?? {}) },
		};
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}

	refreshAll(): void {
		if (this.settings.enabled) {
			this.widthApplier.applyToAll();
		} else {
			this.widthApplier.clearAll();
		}
		this.statusBar?.refresh();
	}

	openWidthInputModal(path: string): void {
		const current = this.store.get(path);
		const { minWidth, maxWidth } = this.settings;
		new WidthInputModal(this.app, current, minWidth, maxWidth, (w) => {
			this.store.set(path, w);
			this.widthApplier.applyToFile(path);
			this.statusBar?.refresh();
		}).open();
	}
}
