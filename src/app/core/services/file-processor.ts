import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class FileProcessorService {
    /**
     * Parses a CSV string into an array of objects.
     * Assumes the first row contains headers.
     */
    parseCsv<T>(csv: string): T[] {
        const lines = csv.split(/\r?\n/);
        if (lines.length < 2) return [];

        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
        const result: T[] = [];

        for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;

            const currentline = this.splitCsvLine(lines[i]);
            if (currentline.length !== headers.length) continue;

            const obj: any = {};
            for (let j = 0; j < headers.length; j++) {
                let val = currentline[j].trim().replace(/^"|"$/g, '');
                // Basic type conversion
                if (val.toLocaleLowerCase() === 'true') val = 'true';
                else if (val.toLocaleLowerCase() === 'false') val = 'false';
                else if (!isNaN(Number(val)) && val !== '') (obj as any)[headers[j]] = Number(val);
                else obj[headers[j]] = val;
            }
            result.push(obj as T);
        }
        return result;
    }

    /**
     * Helper to split CSV lines correctly handling quotes
     */
    private splitCsvLine(line: string): string[] {
        const result = [];
        let startValueIndex = 0;
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            if (line[i] === '"') {
                inQuotes = !inQuotes;
            } else if (line[i] === ',' && !inQuotes) {
                result.push(line.substring(startValueIndex, i));
                startValueIndex = i + 1;
            }
        }
        result.push(line.substring(startValueIndex));
        return result;
    }
}
