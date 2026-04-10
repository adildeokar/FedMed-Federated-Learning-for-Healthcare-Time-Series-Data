# Start FedMed Backend
Set-Location "$PSScriptRoot\backend"
Write-Host "Starting FedMed Backend on http://localhost:8000" -ForegroundColor Cyan
python main.py
