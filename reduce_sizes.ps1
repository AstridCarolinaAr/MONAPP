# Script para reducir tamaños CSS en 20% (multiplica por 0.80)

function Reduce-CSSsizes {
    param([string]$FilePath)
    $content = Get-Content $FilePath -Raw
    
    # Mapeo de reemplazos (valor_actual -> valor_reducido)
    $replacements = @{
        '50px' = '40px'
        '67px' = '54px'
        '100px' = '80px'
        '20px' = '16px'
        '24px' = '19px'
        '201px' = '161px'
        '15px' = '12px'
        '18px' = '14px'
        '16px' = '13px'
        '14px' = '11px'
        '12px' = '10px'
        '10px' = '8px'
        '9px' = '7px'
        '8px' = '6px'
        '7px' = '6px'
        '6px' = '5px'
        '5px' = '4px'
        '3px' = '2px'
    }
    
    foreach ($key in $replacements.Keys) {
        $content = $content -replace [regex]::Escape($key), $replacements[$key]
    }
    
    Set-Content $FilePath $content
    Write-Host "Actualizado: $FilePath"
}

# Aplicar a todos los archivos CSS
Get-ChildItem -Path . -Filter '*.css' -Recurse | ForEach-Object {
    Reduce-CSSsizes -FilePath $_.FullName
}

Write-Host "¡Reducción completada!"
