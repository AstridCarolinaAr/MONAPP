# Script para reducir tamaños CSS más agresivamente (×0.75)

function Reduce-CSSsizesMore {
    param([string]$FilePath)
    $content = Get-Content $FilePath -Raw
    
    # Mapeo más agresivo: reduce 25% más
    $replacements = @{
        '54px' = '40px'
        '40px' = '30px'
        '80px' = '60px'
        '64px' = '48px'
        '48px' = '36px'
        '32px' = '24px'
        '24px' = '18px'
        '22px' = '17px'
        '20px' = '15px'
        '19px' = '14px'
        '18px' = '13px'
        '17px' = '13px'
        '16px' = '12px'
        '15px' = '11px'
        '14px' = '11px'
        '13px' = '10px'
        '12px' = '9px'
        '11px' = '8px'
        '10px' = '7px'
        '9px' = '7px'
        '8px' = '6px'
        '7px' = '5px'
        '6px' = '4px'
        '5px' = '4px'
        '4px' = '3px'
        '3px' = '2px'
        '2px' = '2px'
        '161px' = '121px'
        '201px' = '151px'
        '137px' = '103px'
        '35px' = '26px'
        '139px' = '104px'
        '37px' = '28px'
        '38px' = '28px'
    }
    
    foreach ($key in $replacements.Keys) {
        $content = $content -replace [regex]::Escape($key), $replacements[$key]
    }
    
    Set-Content $FilePath $content
    Write-Host "Reducido: $FilePath"
}

# Aplicar a todos los archivos CSS
Get-ChildItem -Path . -Filter '*.css' -Recurse | ForEach-Object {
    Reduce-CSSsizesMore -FilePath $_.FullName
}

Write-Host "¡Reducción extra completada!"
