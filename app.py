"""
Kinetic Registration Site — Google Sheets backend
"""

import os
from datetime import datetime, timezone
from collections import Counter

from flask import Flask, render_template, request, redirect, url_for, flash, jsonify
import gspread
from google.oauth2.service_account import Credentials

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "dev-secret-change-in-production")

SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]
CREDENTIALS_FILE = os.environ.get("GOOGLE_CREDENTIALS_FILE", "credentials.json")
SHEET_ID = "1HfsZCupnFxEoxY9o4Z5ZWsnka7B8JARToIR672sc0uw"

HEADERS = ["timestamp", "name", "email", "college", "book1", "book2"]


def get_sheet():
    creds = Credentials.from_service_account_file(CREDENTIALS_FILE, scopes=SCOPES)
    client = gspread.authorize(creds)
    spreadsheet = client.open_by_key(SHEET_ID)
    try:
        sheet = spreadsheet.worksheet("Registrations")
    except gspread.WorksheetNotFound:
        sheet = spreadsheet.add_worksheet(title="Registrations", rows=1000, cols=6)
        sheet.append_row(HEADERS)
    return sheet


def ensure_headers(sheet):
    try:
        first_row = sheet.row_values(1)
    except Exception:
        first_row = []
    if not first_row or first_row != HEADERS:
        sheet.insert_row(HEADERS, 1)


@app.route("/", methods=["GET"])
def index():
    return render_template("index.html")


@app.route("/register", methods=["POST"])
def register():
    name = request.form.get("name", "").strip()
    email = request.form.get("email", "").strip()
    college = request.form.get("college", "").strip()
    book1 = request.form.get("book1", "").strip()
    book2 = request.form.get("book2", "").strip()

    if not name or not email or not college:
        flash("Name, email, and college are required.", "error")
        return redirect(url_for("index"))

    if "@" not in email:
        flash("Please enter a valid email address.", "error")
        return redirect(url_for("index"))

    sheet = get_sheet()
    ensure_headers(sheet)

    row = [
        datetime.now(timezone.utc).isoformat(),
        name,
        email,
        college,
        book1,
        book2,
    ]
    sheet.append_row(row)

    flash("Thanks! You're on the Kinetic waitlist. We'll let you know when it launches.", "success")
    return redirect(url_for("index"))


@app.route("/api/stats", methods=["GET"])
def stats():
    sheet = get_sheet()
    records = sheet.get_all_records()
    count = len(records)

    books = Counter()
    for r in records:
        for b in (r.get("book1", ""), r.get("book2", "")):
            b = b.strip()
            if b:
                books[b] += 1

    top_books = [[book, count] for book, count in books.most_common(5)]
    return jsonify({"registrations": count, "top_books": top_books})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)), debug=True)
