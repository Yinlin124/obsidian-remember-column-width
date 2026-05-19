import { App, Modal, Notice, Setting } from "obsidian";

export class WidthInputModal extends Modal {
	private current: number;
	private min: number;
	private max: number;
	private onSubmit: (width: number) => void;
	private value: number;

	constructor(
		app: App,
		current: number,
		min: number,
		max: number,
		onSubmit: (width: number) => void,
	) {
		super(app);
		this.current = current;
		this.min = min;
		this.max = max;
		this.value = current;
		this.onSubmit = onSubmit;
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.createEl("h3", { text: "Set width for this file" });

		new Setting(contentEl)
			.setName("Width (px)")
			.setDesc(`Allowed range: ${this.min} – ${this.max}`)
			.addText((text) => {
				text.inputEl.type = "number";
				text.inputEl.min = String(this.min);
				text.inputEl.max = String(this.max);
				text.setValue(String(this.current));
				text.onChange((v) => {
					const n = Number(v);
					if (Number.isFinite(n)) this.value = n;
				});
				text.inputEl.addEventListener("keydown", (e) => {
					if (e.key === "Enter") {
						e.preventDefault();
						this.submit();
					}
				});
			});

		new Setting(contentEl)
			.addButton((btn) =>
				btn.setButtonText("Cancel").onClick(() => this.close()),
			)
			.addButton((btn) =>
				btn
					.setCta()
					.setButtonText("Save")
					.onClick(() => this.submit()),
			);
	}

	private submit(): void {
		if (!Number.isFinite(this.value)) {
			new Notice("Please enter a valid number.");
			return;
		}
		if (this.value < this.min || this.value > this.max) {
			new Notice(`Width must be between ${this.min} and ${this.max}.`);
			return;
		}
		this.onSubmit(Math.round(this.value));
		this.close();
	}

	onClose(): void {
		this.contentEl.empty();
	}
}
