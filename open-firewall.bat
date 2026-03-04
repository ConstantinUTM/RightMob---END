@echo off
echo ========================================
echo  Configurare Windows Firewall pentru Vite
echo ========================================
echo.

echo Adaug reguli firewall pentru port 5173 si 3001...
echo.

netsh advfirewall firewall add rule name="Vite Dev Server" dir=in action=allow protocol=TCP localport=5173
netsh advfirewall firewall add rule name="Node Backend Server" dir=in action=allow protocol=TCP localport=3001

echo.
echo ========================================
echo  Reguli adaugate cu succes!
echo ========================================
echo.
echo Acum poti accesa site-ul de pe telefon la:
echo http://192.168.1.2:5173/
echo.
pause
