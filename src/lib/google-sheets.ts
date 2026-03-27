import { google, type sheets_v4 } from "googleapis";

let _sheets: sheets_v4.Sheets | null = null;

export function getSpreadsheetId(): string {
  const id = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  if (!id) throw new Error("GOOGLE_SHEETS_SPREADSHEET_ID env var is required");
  return id;
}

export async function getSheetsClient(): Promise<sheets_v4.Sheets> {
  if (_sheets) return _sheets;

  const email = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
  const rawKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY;

  if (!email || !rawKey) {
    throw new Error(
      "GOOGLE_SHEETS_CLIENT_EMAIL and GOOGLE_SHEETS_PRIVATE_KEY env vars are required"
    );
  }

  // Handle escaped newlines from env vars (Vercel stores them as literal \n)
  const privateKey = rawKey.replace(/\\n/g, "\n");

  const auth = new google.auth.JWT({
    email,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  _sheets = google.sheets({ version: "v4", auth });
  return _sheets;
}

// --- Helpers ---

export async function readSheet(sheetName: string): Promise<string[][]> {
  const sheets = await getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: getSpreadsheetId(),
    range: `${sheetName}!A:Z`,
  });
  return (res.data.values ?? []) as string[][];
}

export async function appendRow(
  sheetName: string,
  values: (string | number | boolean | null)[]
): Promise<void> {
  const sheets = await getSheetsClient();
  await sheets.spreadsheets.values.append({
    spreadsheetId: getSpreadsheetId(),
    range: `${sheetName}!A:Z`,
    valueInputOption: "RAW",
    requestBody: {
      values: [values.map((v) => (v === null ? "" : String(v)))],
    },
  });
}

export async function updateRow(
  sheetName: string,
  rowIndex: number, // 0-based data row (row 0 = header, row 1 = first data row)
  values: (string | number | boolean | null)[]
): Promise<void> {
  const sheets = await getSheetsClient();
  const sheetRow = rowIndex + 1; // 1-based for Sheets API
  await sheets.spreadsheets.values.update({
    spreadsheetId: getSpreadsheetId(),
    range: `${sheetName}!A${sheetRow}:Z${sheetRow}`,
    valueInputOption: "RAW",
    requestBody: {
      values: [values.map((v) => (v === null ? "" : String(v)))],
    },
  });
}

export async function deleteRow(
  sheetName: string,
  sheetId: number, // the numeric sheetId (gid), NOT the spreadsheet ID
  rowIndex: number // 0-based (including header), so data row 1 = index 1
): Promise<void> {
  const sheets = await getSheetsClient();
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: getSpreadsheetId(),
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId,
              dimension: "ROWS",
              startIndex: rowIndex,
              endIndex: rowIndex + 1,
            },
          },
        },
      ],
    },
  });
}

// Look up the numeric sheetId (gid) for a sheet by name
export async function getSheetId(sheetName: string): Promise<number> {
  const sheets = await getSheetsClient();
  const res = await sheets.spreadsheets.get({
    spreadsheetId: getSpreadsheetId(),
    fields: "sheets.properties",
  });

  const sheet = res.data.sheets?.find(
    (s) => s.properties?.title === sheetName
  );
  if (!sheet?.properties?.sheetId && sheet?.properties?.sheetId !== 0) {
    throw new Error(`Sheet "${sheetName}" not found`);
  }
  return sheet.properties.sheetId;
}
