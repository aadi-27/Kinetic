"""Debug script to verify Google Sheets access."""
import json
import os
import sys

from google.oauth2.service_account import Credentials
import gspread

CREDENTIALS_FILE = "credentials.json"
SHEET_ID = "1HfsZCupnFxEoxY9o4Z5ZWsnka7B8JARToIR672sc0uw"

print("=== Step 1: Check credentials.json exists ===")
if not os.path.exists(CREDENTIALS_FILE):
    print(f"FAIL: {CREDENTIALS_FILE} not found in {os.getcwd()}")
    sys.exit(1)
print(f"OK: {CREDENTIALS_FILE} found")

with open(CREDENTIALS_FILE) as f:
    info = json.load(f)
print(f"Service account email: {info.get('client_email')}")
print(f"Project ID: {info.get('project_id')}")

print("\n=== Step 2: Try to authorize ===")
try:
    creds = Credentials.from_service_account_file(CREDENTIALS_FILE, scopes=["https://www.googleapis.com/auth/spreadsheets"])
    client = gspread.authorize(creds)
    print("OK: Authorized successfully")
except Exception as e:
    print(f"FAIL: Authorization failed: {e}")
    sys.exit(1)

print("\n=== Step 3: List spreadsheets visible to this service account ===")
try:
    spreadsheets = client.list_spreadsheet_files()
    if not spreadsheets:
        print("WARN: No spreadsheets found shared with this service account")
        print("  -> You need to share your sheet with: " + info.get('client_email'))
    else:
        print(f"OK: Found {len(spreadsheets)} spreadsheet(s):")
        for s in spreadsheets:
            print(f"  - {s.get('name')} (id: {s.get('id')})")
except Exception as e:
    print(f"FAIL: Could not list spreadsheets: {e}")
    print("  -> Google Sheets API may not be enabled in your GCP project")

print("\n=== Step 4: Try to open your sheet by ID ===")
try:
    spreadsheet = client.open_by_key(SHEET_ID)
    print(f"OK: Opened spreadsheet: {spreadsheet.title}")
    try:
        sheet = spreadsheet.worksheet("Registrations")
        print(f"OK: Worksheet 'Registrations' found")
    except gspread.WorksheetNotFound:
        print("WARN: Worksheet 'Registrations' not found (will be created on first submission)")
except gspread.exceptions.SpreadsheetNotFound:
    print(f"FAIL: SpreadsheetNotFound for ID {SHEET_ID}")
    print("  -> The service account does not have access to this sheet")
    print("  -> Share the sheet with: " + info.get('client_email'))
except Exception as e:
    print(f"FAIL: {e}")

print("\n=== Done ===")
