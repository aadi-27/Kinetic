# Kinetic — Render Deploy Checklist

## Prerequisites (done once)
1. Google Cloud project with Sheets API enabled
2. Service account JSON key downloaded as `credentials.json`
3. Google Sheet named "Kinetic Registrations" shared with the service account email
4. Sheet ID copied from the URL

## Local test
```bash
cd /home/vajra/physio-llm/website
cp .env.example .env
# Edit .env: add your SHEET_ID and path to credentials.json
.venv/bin/pip install -r requirements.txt
.venv/bin/python app.py
# Open http://127.0.0.1:5000, submit the form, check your Google Sheet
```

## Push to GitHub
```bash
cd /home/vajra/physio-llm/website
git init
git add .
git commit -m "initial"
git remote add origin https://github.com/aadi-27/Kinetic.git
git branch -M main
# Use a Personal Access Token when Git asks for password
git push -u origin main
```

## Render dashboard
1. New Web Service → connect GitHub repo `aadi-27/Kinetic`
2. Runtime: Python 3
3. Build Command: `pip install -r requirements.txt`
4. Start Command: `gunicorn app:app`
5. Environment Variables:
   - `GOOGLE_CREDENTIALS_FILE` = `credentials.json`
   - `GOOGLE_SHEET_ID` = `your_sheet_id`
   - `SECRET_KEY` = anything random
6. Upload `credentials.json` to Render (Secret Files or environment)
7. Deploy

## View responses
Open your Google Sheet → "Registrations" tab. Every signup appears there.
Live stats: `https://your-app.onrender.com/api/stats`
