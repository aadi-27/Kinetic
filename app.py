"""
Kinetic Registration Site
Flask backend: serves landing page, accepts registrations, stores to CSV.
Run:  python3 app.py
"""

import csv
import os
from datetime import datetime, timezone
from flask import Flask, render_template, request, redirect, url_for, flash, jsonify

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "dev-secret-change-in-production")

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
REGISTRATIONS_CSV = os.path.join(DATA_DIR, "registrations.csv")
REGISTRATION_HEADERS = ["timestamp", "name", "email", "college", "book1", "book2"]


def ensure_csv():
    os.makedirs(DATA_DIR, exist_ok=True)
    if not os.path.exists(REGISTRATIONS_CSV):
        with open(REGISTRATIONS_CSV, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=REGISTRATION_HEADERS)
            writer.writeheader()


@app.route("/", methods=["GET"])
def index():
    return render_template("index.html")


@app.route("/register", methods=["POST"])
def register():
    ensure_csv()
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

    row = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "name": name,
        "email": email,
        "college": college,
        "book1": book1,
        "book2": book2,
    }

    with open(REGISTRATIONS_CSV, "a", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=REGISTRATION_HEADERS)
        writer.writerow(row)

    flash("Thanks! You're on the Kinetic waitlist. We'll let you know when it launches.", "success")
    return redirect(url_for("index"))


@app.route("/api/stats", methods=["GET"])
def stats():
    """Simple JSON endpoint for a live counter on the landing page."""
    ensure_csv()
    count = 0
    books = {}
    with open(REGISTRATIONS_CSV, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            count += 1
            for b in (row.get("book1", ""), row.get("book2", "")):
                b = b.strip()
                if b:
                    books[b] = books.get(b, 0) + 1
    top_books = sorted(books.items(), key=lambda x: x[1], reverse=True)[:5]
    return jsonify({"registrations": count, "top_books": top_books})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)), debug=True)
