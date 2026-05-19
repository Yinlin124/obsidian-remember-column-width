export interface DebouncedFn {
	(): void;
	flush(): void;
	cancel(): void;
}

export function makeDebounced(fn: () => void, delay: number): DebouncedFn {
	let timer: number | null = null;

	const trigger = (() => {
		if (timer !== null) window.clearTimeout(timer);
		timer = window.setTimeout(() => {
			timer = null;
			fn();
		}, delay);
	}) as DebouncedFn;

	trigger.flush = () => {
		if (timer !== null) {
			window.clearTimeout(timer);
			timer = null;
			fn();
		}
	};

	trigger.cancel = () => {
		if (timer !== null) {
			window.clearTimeout(timer);
			timer = null;
		}
	};

	return trigger;
}
