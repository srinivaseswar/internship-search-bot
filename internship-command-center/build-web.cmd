@echo off
rem Builds the frontend production bundle into artifacts\internship-command-center\dist\public
cd /d "%~dp0artifacts\internship-command-center"
set "PORT=19384"
set "BASE_PATH=/"
echo Building web app ...
pnpm exec vite build --config vite.config.ts