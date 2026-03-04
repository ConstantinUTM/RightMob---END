@echo off
echo.
echo ============================================
echo   CREARE CONT ADMIN - GHID RAPID
echo ============================================
echo.
echo PASUL 1: Configureaza Firebase
echo --------------------------------
echo 1. Deschide: https://console.firebase.google.com/
echo 2. Creeaza proiect si activeaza Authentication
echo 3. Din Project Settings -^> Your apps -^> Web
echo 4. Copiaza credentialele (apiKey, authDomain, etc)
echo.
echo PASUL 2: Editeaza fisierele
echo ----------------------------
echo 1. Deschide: create-admin.mjs
echo 2. Inlocuieste YOUR_API_KEY_HERE cu valorile reale
echo 3. Deschide: src\config\firebase.ts
echo 4. Inlocuieste aceleasi valori
echo.
echo PASUL 3: Ruleaza scriptul
echo --------------------------
echo   node create-admin.mjs
echo.
echo Vei fi intrebat:
echo   - Email admin (ex: admin@luxmobila.com)
echo   - Parola (min 6 caractere)
echo.
echo PASUL 4: Actualizeaza codul
echo ----------------------------
echo 1. Deschide: src\contexts\AuthContext.tsx
echo 2. Adauga email-ul in lista ADMIN_EMAILS
echo.
echo ============================================
echo.
pause
