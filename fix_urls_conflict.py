#!/usr/bin/env python
# Script to fix git conflict in MONAPP/urls.py

with open(r'Z:\Proyecto final\MONAPP\MONAPP\urls.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find conflict markers
conflict_start = None
conflict_middle = None
conflict_end = None

for i, line in enumerate(lines):
    if line.startswith('<<<<<<< HEAD'):
        conflict_start = i
    elif line.startswith('======='):
        conflict_middle = i
    elif line.startswith('>>>>>>>'):
        conflict_end = i

if conflict_start is not None and conflict_middle is not None and conflict_end is not None:
    # Build the resolved version
    resolved_lines = lines[:conflict_start]
    
    # Add all URL patterns from both branches
    resolved_lines.append("    path('gestion-alisados/', include('gestion_alisados.urls')),\n")
    resolved_lines.append("    path('productos-web/', include('productos_web.urls')),\n")
    resolved_lines.append("    path(\"compras/\", include(\"compras.urls\")),\n")
    resolved_lines.append("    path('gestion-datos/', include('gestion_datos.urls')),\n")
    resolved_lines.append("    path('promociones/', include('promociones.urls')),\n")
    resolved_lines.append("    path('gestion/', include('Gestion.urls')),\n")
    
    # Add everything after the conflict
    resolved_lines.extend(lines[conflict_end + 1:])
    
    # Write back
    with open(r'Z:\Proyecto final\MONAPP\MONAPP\urls.py', 'w', encoding='utf-8') as f:
        f.writelines(resolved_lines)
    
    print(f"✓ Conflict in urls.py resolved!")
    print(f"  - Removed conflict markers at lines {conflict_start+1}, {conflict_middle+1}, {conflict_end+1}")
    print(f"  - Kept all URL patterns from both branches")
else:
    print("No conflict markers found in urls.py")
