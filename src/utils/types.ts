export interface FileWidthMap {
	[path: string]: number;
}

export interface RememberWidthSettings {
	globalDefault: number;
	minWidth: number;
	maxWidth: number;
	enabled: boolean;
	fileWidths: FileWidthMap;
	savedReadableLineLength?: boolean;
}
