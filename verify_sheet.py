"""Verify what's actually in your Google Sheet."""
import os
import gspread
from google.oauth2.service_account import Credentials

CREDENTIALS_FILE = "credentials.json"
SHEET_ID = "1HfsZCupnFxEoxY9o4Z5ZWsnka7B8JARToIR672sc0uw"

creds = Credentials.from_service_account_file(CREDENTIALS_FILE, scopes=["https://www.googleapis.com/auth/spreadsheets"])
client = gspread.authorize(creds)

spreadsheet = client.open_by_key(SHEET_ID)
print(f"Spreadsheet title: {spreadsheet.title}")
print(f"Spreadsheet URL: {spreadsheet.url}")
print()

print("All worksheets:")
for ws in spreadsheet.worksheets():
    print(f"  - '{ws.title}' (rows: {ws.row_count}, cols: {ws.col_count})")
    try:
        all_vals = ws.get_all_values()
        print(f"    Data rows: {len(all_vals)}")
        if all_vals:
            print(f"    First row: {all_vals[0]}")
            if len(all_vals) > 1:
                print(f"    Second row: {all_vals[1]}")
    except Exception as e:
        print(f"    Error reading: {e}")
    print()
