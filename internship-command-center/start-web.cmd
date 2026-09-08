@echo off
rem Serves the built frontend (production bundle) on port 19384 and proxies /api to the API server.
rem Run build-web.cmd first if src changed.
cd /d "%~dp0artifacts\internship-command-center"
set "PORT=19384"
set "BASE_PATH=/"
set "API_URL=http://localhost:8080"
echo Starting web app (production preview) on http://localhost:19384 ...
pnpm exec vite preview --config vite.config.ts >> "%~dp0..\web.log" 2>&1