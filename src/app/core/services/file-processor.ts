import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';

@Injectable({
    providedIn: 'root'
})
export class FileProcessorService {

    /**
     * Reads a File (CSV or Excel) and returns an array of plain objects.
     * The first row is always used as column headers.
     */
    async parseFile(file: File): Promise<Record<string, any>[]> {
        const ext = file.name.split('.').pop()?.toLowerCase();
        if (ext === 'csv') {
            const text = await file.text();
            return this.parseCsv(text);
        }
        if (ext === 'xlsx' || ext === 'xls') {
            return this.parseExcel(file);
        }
        throw new Error(`Formato no soportado: .${ext}. Usa .csv, .xlsx o .xls`);
    }

    /**
     * Parses a CSV string into an array of objects.
     * First row contains headers.
     */
    parseCsv<T = Record<string, any>>(csv: string): T[] {
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
                const val = currentline[j].trim().replace(/^"|"$/g, '');
                obj[headers[j]] = val;
            }
            result.push(obj as T);
        }
        return result;
    }

    /**
     * Parses an Excel file (.xlsx/.xls) using SheetJS.
     * Returns first sheet rows as plain objects (all values as strings for consistency).
     */
    private parseExcel(file: File): Promise<Record<string, any>[]> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target!.result as ArrayBuffer);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const sheetName = workbook.SheetNames[0];
                    const sheet = workbook.Sheets[sheetName];
                    // defval: '' prevents undefined values; raw: false converts dates to strings
                    const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, {
                        defval: '',
                        raw: false,
                    });
                    resolve(rows);
                } catch (err) {
                    reject(new Error('Error al leer el archivo Excel.'));
                }
            };
            reader.onerror = () => reject(new Error('Error al leer el archivo.'));
            reader.readAsArrayBuffer(file);
        });
    }

    /**
     * Helper to split CSV lines respecting quoted fields.
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
