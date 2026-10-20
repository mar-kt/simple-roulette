import * as XLSX from 'xlsx';
import { RouletteItem } from './types';

export interface ExcelParseResult {
  items: RouletteItem[];
  skippedHeader?: string;
  totalRows: number;
}

/**
 * Procesa un archivo Excel (.xlsx, .xls, .csv) y extrae una lista limpia de RouletteItem.
 * Devuelve un reporte claro para saber si se omitió la primera fila como título.
 */
export async function parseExcelFile(file: File): Promise<ExcelParseResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        const workbook = XLSX.read(buffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];

        if (!firstSheetName) {
          throw new Error('El archivo Excel no contiene ninguna hoja.');
        }

        const worksheet = workbook.Sheets[firstSheetName];
        const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];

        if (!rawRows || rawRows.length === 0) {
          resolve({ items: [], totalRows: 0 });
          return;
        }

        // Detectar si la primera fila parece ser un encabezado
        const hasHeader = rawRows.length > 1 && isLikelyHeader(rawRows[0]);
        const skippedHeader = hasHeader && rawRows[0] && rawRows[0][0] !== undefined 
          ? String(rawRows[0][0]).trim() 
          : undefined;

        const dataRows = hasHeader ? rawRows.slice(1) : rawRows;
        const items: RouletteItem[] = [];
        let indexCounter = 1;

        for (const row of dataRows) {
          if (!row || !Array.isArray(row)) continue;

          const col0 = row[0] !== undefined && row[0] !== null ? String(row[0]).trim() : '';
          if (!col0) continue; // Si la celda está vacía, ignorar fila

          const col1 = row[1] !== undefined && row[1] !== null ? String(row[1]).trim() : undefined;
          const col2 = row[2] !== undefined && row[2] !== null ? String(row[2]).trim() : undefined;

          let metadata: Record<string, unknown> | undefined;
          if (row.length > 3) {
            metadata = {};
            for (let i = 3; i < row.length; i++) {
              if (row[i] !== undefined && row[i] !== null) {
                metadata[`col_${i + 1}`] = row[i];
              }
            }
          }

          items.push({
            id: indexCounter++,
            label: col0,
            subtitle: col1,
            url: col2 && isValidUrl(col2) ? col2 : undefined,
            metadata,
          });
        }

        resolve({
          items,
          skippedHeader,
          totalRows: rawRows.length,
        });
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = () => reject(new Error('Error al leer el archivo en el navegador.'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Convierte un texto plano en una lista de RouletteItem.
 */
export function parseTextInput(text: string): RouletteItem[] {
  const lines = text.split('\n');
  const items: RouletteItem[] = [];
  let id = 1;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    if (line.includes('|')) {
      const parts = line.split('|').map((p) => p.trim());
      items.push({
        id: id++,
        label: parts[0],
        subtitle: parts[1] || undefined,
        url: parts[2] && isValidUrl(parts[2]) ? parts[2] : undefined,
      });
    } else {
      items.push({
        id: id++,
        label: line,
      });
    }
  }

  return items;
}

function isLikelyHeader(row: unknown[]): boolean {
  if (!row || row.length === 0) return false;
  const firstCell = String(row[0]).toLowerCase();
  const commonHeaderKeywords = ['nombre', 'name', 'item', 'usuario', 'participante', 'display', 'título', 'title'];
  return commonHeaderKeywords.some((keyword) => firstCell.includes(keyword));
}

function isValidUrl(val: string): boolean {
  return val.startsWith('http://') || val.startsWith('https://');
}

export interface ExportResultsOptions {
  title: string;
  winners: RouletteItem[];
  discarded: RouletteItem[];
  remainingCount: number;
  itemLabelName?: string;
  subtitleLabelName?: string;
}

/**
 * Exporta el acta oficial del sorteo con Ganadores, Descartados y Resumen a un archivo Excel (.xlsx).
 */
export function exportResultsToExcel(options: ExportResultsOptions): void {
  const wb = XLSX.utils.book_new();
  const timestamp = new Date().toLocaleString();

  // 1. Hoja de Ganadores (en orden cronológico 1º, 2º, etc.)
  const chronologicalWinners = [...options.winners].reverse();
  const itemCol = options.itemLabelName || 'Elemento / Ganador';
  const subCol = options.subtitleLabelName || 'Detalle';

  const winnersData = chronologicalWinners.map((item, idx) => ({
    'Lugar': `${idx + 1}º Ganador`,
    [itemCol]: item.label,
    [subCol]: item.subtitle || '-',
    'Enlace': item.url || '-',
  }));

  const wsWinners = XLSX.utils.json_to_sheet(
    winnersData.length > 0 ? winnersData : [{ 'Estado': 'No se registraron ganadores' }]
  );
  XLSX.utils.book_append_sheet(wb, wsWinners, 'Ganadores');

  // 2. Hoja de Descartados (si los hay)
  if (options.discarded.length > 0) {
    const chronologicalDiscarded = [...options.discarded].reverse();
    const discardedData = chronologicalDiscarded.map((item, idx) => ({
      'Tiro': `${idx + 1}º Descarte`,
      [itemCol]: item.label,
      [subCol]: item.subtitle || '-',
    }));
    const wsDiscarded = XLSX.utils.json_to_sheet(discardedData);
    XLSX.utils.book_append_sheet(wb, wsDiscarded, 'Descartados');
  }

  // 3. Hoja de Resumen / Auditoría
  const summaryData = [
    { 'Parámetro': 'Título del Sorteo', 'Valor': options.title },
    { 'Parámetro': 'Fecha y Hora de Emisión', 'Valor': timestamp },
    { 'Parámetro': 'Total Ganadores Registrados', 'Valor': options.winners.length },
    { 'Parámetro': 'Total Descartados ("Al agua")', 'Valor': options.discarded.length },
    { 'Parámetro': 'Participantes Restantes en Ruleta', 'Valor': options.remainingCount },
  ];
  const wsSummary = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen');

  // Guardar archivo
  const cleanTitle = (options.title || 'sorteo')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  const dateStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `acta_${cleanTitle}_${dateStr}.xlsx`);
}

