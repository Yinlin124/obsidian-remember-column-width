import { MarkdownView } from "obsidian";
import type RememberWidthPlugin from "../main";
import {
	STATUS_BAR_CLS,
	STATUS_BAR_LABEL_CLS,
	STATUS_BAR_SLIDER_CLS,
} from "../utils/constants";

export class StatusBarSlider {
	private plugin: RememberWidthPlugin;
	private root: HTMLElement;
	private slider: HTMLInputElement;
	private label: HTMLElement;
	private currentPath: string | null = null;

	constructor(plugin: RememberWidthPlugin, statusBarItem: HTMLElement) {
		this.plugin = plugin;
		this.root = statusBarItem;
		this.root.addClass(STATUS_BAR_CLS);

		this.label = this.root.createSpan({ cls: STATUS_BAR_LABEL_CLS });
		this.label.setAttr("aria-label", "Click to enter a value");

		this.slider = this.root.createEl("input", {
			cls: STATUS_BAR_SLIDER_CLS,
			attr: { type: "range", step: "10" },
		});

		this.applyRangeFromSettings();

		plugin.registerDomEvent(this.slider, "input", () => {
			const w = Number(this.slider.value);
			if (!Number.isFinite(w) || !this.currentPath) return;
			this.updateLabel(w);
			this.plugin.store.set(this.currentPath, w);
			this.plugin.widthApplier.applyToFile(this.currentPath);
		});

		plugin.registerDomEvent(this.label, "click", () => {
			if (!this.currentPath) return;
			this.plugin.openWidthInputModal(this.currentPath);
		});

		this.hide();
	}

	refresh(): void {
		const view = this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
		const path = view?.file?.path ?? null;
		this.currentPath = path;

		if (!path) {
			this.hide();
			return;
		}

		this.show();
		this.applyRangeFromSettings();
		const w = this.plugin.store.get(path);
		this.slider.value = String(w);
		this.updateLabel(w);
	}

	private applyRangeFromSettings(): void {
		this.slider.min = String(this.plugin.settings.minWidth);
		this.slider.max = String(this.plugin.settings.maxWidth);
	}

	private updateLabel(w: number): void {
		this.label.setText(`${w}px`);
	}

	private show(): void {
		this.root.style.display = "";
	}

	private hide(): void {
		this.root.style.display = "none";
	}
}
