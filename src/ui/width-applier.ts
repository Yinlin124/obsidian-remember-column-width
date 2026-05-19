import { MarkdownView } from "obsidian";
import type RememberWidthPlugin from "../main";
import { CSS_VAR_NAME, DATA_ATTR_MANAGED } from "../utils/constants";

export class WidthApplier {
	private plugin: RememberWidthPlugin;

	constructor(plugin: RememberWidthPlugin) {
		this.plugin = plugin;
	}

	applyToView(view: MarkdownView, width: number): void {
		const el = view.contentEl;
		el.setAttribute(DATA_ATTR_MANAGED, "true");
		el.style.setProperty(CSS_VAR_NAME, `${width}px`, "important");
	}

	clearFromView(view: MarkdownView): void {
		const el = view.contentEl;
		el.removeAttribute(DATA_ATTR_MANAGED);
		el.style.removeProperty(CSS_VAR_NAME);
	}

	applyToFile(path: string): void {
		const width = this.plugin.store.get(path);
		for (const view of this.viewsForFile(path)) {
			this.applyToView(view, width);
		}
	}

	applyToAll(): void {
		this.plugin.app.workspace.getLeavesOfType("markdown").forEach((leaf) => {
			const view = leaf.view;
			if (view instanceof MarkdownView && view.file) {
				const w = this.plugin.store.get(view.file.path);
				this.applyToView(view, w);
			}
		});
	}

	clearAll(): void {
		this.plugin.app.workspace.getLeavesOfType("markdown").forEach((leaf) => {
			const view = leaf.view;
			if (view instanceof MarkdownView) {
				this.clearFromView(view);
			}
		});
	}

	private viewsForFile(path: string): MarkdownView[] {
		const out: MarkdownView[] = [];
		this.plugin.app.workspace.getLeavesOfType("markdown").forEach((leaf) => {
			const v = leaf.view;
			if (v instanceof MarkdownView && v.file?.path === path) {
				out.push(v);
			}
		});
		return out;
	}
}
