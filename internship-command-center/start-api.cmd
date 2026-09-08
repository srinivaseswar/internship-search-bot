@echo off
rem Starts the API server in local demo mode (no database required).
cd /d "%~dp0artifacts\api-server"
set "PORT=8080"
set "DEMO_MODE=true"
set "NODE_ENV=development"
echo Starting API server on http://localhost:8080 ...
node --enable-source-maps dist\index.mjs >> "%~dp0..\api.log" 2>&1
