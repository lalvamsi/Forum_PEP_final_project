@echo off
echo Pushing changes to GitHub repository...

:: Navigate to the script's directory (the forums folder)
cd /d "%~dp0"

:: Add all changes
git add .

:: Commit the changes
git commit -m "Added file upload feature"

:: Ensure the main branch is used
git branch -M main

:: Set the remote URL just in case
git remote set-url origin https://github.com/lalvamsi/Forum_PEP_final_project.git
git remote add origin https://github.com/lalvamsi/Forum_PEP_final_project.git 2>nul

:: Push to GitHub
git push -u origin main

echo.
echo Done! If you see any errors above, let me know.
pause
