import { Plugin } from "obsidian";

import { registerCommands } from "./commands/register-commands";
import { registerEvents } from "./events/register-events";
import { DEFAULT_SETTINGS, RememberWidthSettingTab } from "./settings";
import { WidthStore } from "./storage/width-store";
import { StatusBarSlider } from "./ui/status-bar-slider";
import { WidthApplier } from "./ui/width-applier";
import { WidthInputModal } from "./ui/width-input-modal";
import type { RememberWidthSettings } from "./utils/types";

/** Obsidian's "readable line length" config key. */
const READABLE_LINE_LENGTH_KEY = "readableLineLength";

export default class RememberWidthPlugin extends Plugin {
	settings!: RememberWidthSettings;
	store!: WidthStore;
	widthApplier!: WidthApplier;
	statusBar: StatusBarSlider | null = null;

	async onload(): Promise<void> {
		await this.loadSettings();
		await this.snapshotReadableLineLengthIfNeeded();

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
		this.restoreReadableLineLength();
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
		this.applyReadableLineLengthState();
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

	/**
	 * On the very first run, remember whatever the user had set for
	 * Obsidian's "readable line length" toggle, so we can restore it
	 * when this plugin is disabled.
	 */
	private async snapshotReadableLineLengthIfNeeded(): Promise<void> {
		if (this.settings.savedReadableLineLength !== undefined) return;
		const current = this.getObsidianConfig(READABLE_LINE_LENGTH_KEY);
		// Obsidian's default for this key is `true` when unset.
		this.settings.savedReadableLineLength =
			typeof current === "boolean" ? current : true;
		await this.saveSettings();
	}

	/**
	 * Apply the desired state of Obsidian's "readable line length" toggle:
	 *   plugin enabled  => force OFF (so our per-file widths are the sole
	 *                       authority and never get clamped by the global
	 *                       limit).
	 *   plugin disabled => restore the user's original preference.
	 */
	private applyReadableLineLengthState(): void {
		const target = this.settings.enabled
			? false
			: this.settings.savedReadableLineLength ?? true;
		this.writeReadableLineLength(target);
	}

	private restoreReadableLineLength(): void {
		const saved = this.settings.savedReadableLineLength;
		if (saved === undefined) return;
		this.writeReadableLineLength(saved);
	}

	private writeReadableLineLength(value: boolean): void {
		const current = this.getObsidianConfig(READABLE_LINE_LENGTH_KEY);
		if (current === value) return;
		this.setObsidianConfig(READABLE_LINE_LENGTH_KEY, value);
		this.refreshObsidianOptions();
	}

	private getObsidianConfig(key: string): unknown {
		const vault = this.app.vault as unknown as {
			getConfig?: (k: string) => unknown;
		};
		return typeof vault.getConfig === "function"
			? vault.getConfig(key)
			: undefined;
	}

	private setObsidianConfig(key: string, value: unknown): void {
		const vault = this.app.vault as unknown as {
			setConfig?: (k: string, v: unknown) => void;
		};
		if (typeof vault.setConfig === "function") {
			vault.setConfig(key, value);
		}
	}

	private refreshObsidianOptions(): void {
		const ws = this.app.workspace as unknown as {
			updateOptions?: () => void;
		};
		if (typeof ws.updateOptions === "function") {
			ws.updateOptions();
		}
	}
}
