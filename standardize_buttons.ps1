# Script para estandarizar botones en toda la aplicación

function Standardize-Buttons {
    param([string]$FilePath)
    $content = Get-Content $FilePath -Raw
    
    # Reemplazos para botones consistentes
    $replacements = @{
        '.btn-sm {' = '.btn-sm { width: 32px; height: 32px; border-radius: 4px; display: inline-flex; align-items: center; justify-content: center; font-size: 14px; padding: 0; '
        '.btn-info {' = '.btn-info { background: linear-gradient(135deg, #4fc3f7, #039be5); border: none; font-size: 14px; '
        '.btn-danger {' = '.btn-danger { background: rgba(224,122,122,.15); border: 1px solid rgba(224,122,122,.35); font-size: 14px; '
        '.btn-primary {' = '.btn-primary { background: linear-gradient(135deg, #b39ddb, #9575cd); border: none; font-size: 14px; '
        '.btn-warning {' = '.btn-warning { background: #f9a825; border: none; font-size: 14px; '
        '.btn-success {' = '.btn-success { background: linear-gradient(135deg, #3b2f2f, #6d5c5c); border: none; border-radius: 995px; padding: 8px 20px; font-weight: 600; font-size: 12px; '
    }
    
    foreach ($key in $replacements.Keys) {
        if ($content -match [regex]::Escape($key)) {
            $content = $content -replace [regex]::Escape($key), $replacements[$key]
        }
    }
    
    Set-Content $FilePath $content
    Write-Host "Botones estandarizados: $FilePath"
}

# Aplicar a todos los archivos CSS
Get-ChildItem -Path . -Filter '*.css' -Recurse | ForEach-Object {
    Standardize-Buttons -FilePath $_.FullName
}

Write-Host "¡Estandarización de botones completada!"
