@echo off
title WeatherGPT GitHub Uploader
echo ========================================================
echo 🌤️ Pushing WeatherGPT Code to GitHub:
echo https://github.com/devvrajawat0/weather-gpt-updated
echo ========================================================
echo.
cd /d "C:\Users\HP\.gemini\antigravity\scratch\weather-gpt"
"C:\Users\HP\mingit\cmd\git.exe" remote set-url origin https://github.com/devvrajawat0/weather-gpt-updated.git
"C:\Users\HP\mingit\cmd\git.exe" branch -M main
"C:\Users\HP\mingit\cmd\git.exe" push -u origin main
echo.
echo ========================================================
echo ✅ Push Complete! Share link with your group mates:
echo https://github.com/devvrajawat0/weather-gpt-updated
echo ========================================================
pause
