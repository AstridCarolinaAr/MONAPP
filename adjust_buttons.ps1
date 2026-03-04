# Script para ajustar botones específicamente

function Adjust-Buttons {
    param([string]$FilePath)
    $content = Get-Content $FilePath -Raw
    
    # Reducir botones de acciones de tablas a 24-26px
    $replacements = @{
        'width: 32px;' = 'width: 24px;'
        'height: 32px;' = 'height: 24px;'
    }
    
    foreach ($key in $replacements.Keys) {
        $content = $content -replace [regex]::Escape($key), $replacements[$key]
    }
    
    Set-Content $FilePath $content
    Write-Host "Botones ajustados: $FilePath"
}

# Aplicar a todos los archivos CSS
Get-ChildItem -Path . -Filter '*.css' -Recurse | ForEach-Object {
    Adjust-Buttons -FilePath $_.FullName
}

Write-Host "¡Ajuste de botones completado!"
