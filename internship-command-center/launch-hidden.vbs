' Detached launcher: starts API + web + tunnel in hidden windows that
' survive terminal/editor cleanup (not attached to any console).
Set shell = CreateObject("WScript.Shell")
base = Replace(WScript.ScriptFullName, "\launch-hidden.vbs", "")
shell.Run "cmd /c """ & base & "\start-api.cmd""", 0, False
shell.Run "cmd /c """ & base & "\start-web.cmd""", 0, False
shell.Run "cmd /c """ & base & "\start-tunnel.cmd""", 0, False