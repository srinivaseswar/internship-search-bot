@echo off
rem Exposes the local web app (port 19384) publicly via localtunnel.
cd /d "%~dp0"
echo Starting tunnel https://internship-command-center.loca.lt ...
npx -y localtunnel --port 19384 --subdomain internship-command-center > "%~dp0..\tunnel.log" 2>&1