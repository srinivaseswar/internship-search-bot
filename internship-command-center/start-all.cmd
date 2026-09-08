@echo off
rem Launches API + web servers and the public localtunnel, all detached.
rem Logs are written next to this script's parent folder (api.log, web.log, tunnel.log).

start "internship-api" /min cmd /c "%~dp0start-api.cmd"
start "internship-web" /min cmd /c "%~dp0start-web.cmd"
start "internship-tunnel" /min cmd /c "%~dp0start-tunnel.cmd"

echo All services launched:
echo   API    : http://localhost:8080/api/healthz
echo   Web    : http://localhost:19384
echo   Public : https://internship-command-center.loca.lt
echo.
echo Logs: api.log / web.log / tunnel.log (in the parent folder)