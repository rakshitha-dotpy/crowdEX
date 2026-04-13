@echo off
cd backend
call venv\Scripts\activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000
pause
