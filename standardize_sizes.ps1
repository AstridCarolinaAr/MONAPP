# Script para estandarizar tamaños CSS en toda la aplicación

function Standardize-CSSsizes {
    param([string]$FilePath)
    $content = Get-Content $FilePath -Raw
    
    # Reemplazos para estandarización (sin duplicados)
    $replacements = @{
        'font-size: 3px' = 'font-size: 12px'
        'font-size: 4px' = 'font-size: 12px'
        'font-size: 5px' = 'font-size: 12px'
        'font-size: 6px' = 'font-size: 12px'
        'font-size: 7px' = 'font-size: 11px'
        'font-size: 8px' = 'font-size: 11px'
        'font-size: 9px' = 'font-size: 12px'
        'font-size: 10px' = 'font-size: 11px'
        'padding: 3px 3px' = 'padding: 10px 12px'
        'padding: 3px 11px' = 'padding: 8px 20px'
        'padding: 5px 5px' = 'padding: 10px 12px'
        'padding: 5px 9px' = 'padding: 10px 12px'
        'padding: 6px 9px' = 'padding: 10px 12px'
        'padding: 6px 6px' = 'padding: 10px 12px'
    }
    
    foreach ($key in $replacements.Keys) {
        $content = $content -replace [regex]::Escape($key), $replacements[$key]
    }
    
    Set-Content $FilePath $content
    Write-Host "Estandarizado: $FilePath"
}

# Aplicar a todos los archivos CSS
Get-ChildItem -Path . -Filter '*.css' -Recurse | ForEach-Object {
    Standardize-CSSsizes -FilePath $_.FullName
}

Write-Host "¡Estandarización completada!"
