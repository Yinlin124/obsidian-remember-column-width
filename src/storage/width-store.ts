import type RememberWidthPlugin from "../main";
import { SAVE_DEBOUNCE_MS } from "../utils/constants";
import { makeDebounced, type DebouncedFn } from "../utils/debounce";

export class WidthStore {
	private plugin: RememberWidthPlugin;
	private debouncedSave: DebouncedFn;

	constructor(plugin: RememberWidthPlugin) {
		this.plugin = plugin;
		this.debouncedSave = makeDebounced(
			() => void this.plugin.saveSettings(),
			SAVE_DEBOUNCE_MS,
		);
	}

	get(path: string): number {
		const v = this.plugin.settings.fileWidths[path];
		if (typeof v === "number" && Number.isFinite(v)) {
			return this.clamp(v);
		}
		return this.plugin.settings.globalDefault;
	}

	has(path: string): boolean {
		return typeof this.plugin.settings.fileWidths[path] === "number";
	}

	set(path: string, width: number): void {
		this.plugin.settings.fileWidths[path] = this.clamp(width);
		this.debouncedSave();
	}

	reset(path: string): void {
		if (this.has(path)) {
			delete this.plugin.settings.fileWidths[path];
			this.debouncedSave();
		}
	}

	rename(oldPath: string, newPath: string): void {
		const v = this.plugin.settings.fileWidths[oldPath];
		if (typeof v === "number") {
			this.plugin.settings.fileWidths[newPath] = v;
			delete this.plugin.settings.fileWidths[oldPath];
			this.debouncedSave();
		}
	}

	delete(path: string): void {
		if (this.has(path)) {
			delete this.plugin.settings.fileWidths[path];
			this.debouncedSave();
		}
	}

	clearAll(): void {
		this.plugin.settings.fileWidths = {};
		this.debouncedSave();
	}

	flush(): void {
		this.debouncedSave.flush();
	}

	private clamp(w: number): number {
		const { minWidth, maxWidth } = this.plugin.settings;
		return Math.max(minWidth, Math.min(maxWidth, Math.round(w)));
	}
}
