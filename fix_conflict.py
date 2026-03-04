#!/usr/bin/env python
# Script to fix git conflict in settings.py

with open(r'Z:\Proyecto final\MONAPP\MONAPP\settings.py', 'r', encoding='utf-8') as f:
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
    
    # Add all apps from both branches
    resolved_lines.append("    'gestion_alisados',\n")
    resolved_lines.append("    'productos_web',\n")
    resolved_lines.append("    'compras.apps.ComprasConfig',\n")
    resolved_lines.append("    'bootstrap5',\n")
    resolved_lines.append("    'gestion_datos',\n")
    resolved_lines.append("    'promociones',\n")
    resolved_lines.append("    'Gestion',\n")
    
    # Add everything after the conflict
    resolved_lines.extend(lines[conflict_end + 1:])
    
    # Write back
    with open(r'Z:\Proyecto final\MONAPP\MONAPP\settings.py', 'w', encoding='utf-8') as f:
        f.writelines(resolved_lines)
    
    print(f"✓ Conflict resolved!")
    print(f"  - Removed conflict markers at lines {conflict_start+1}, {conflict_middle+1}, {conflict_end+1}")
    print(f"  - Kept all apps from both branches")
else:
    print("No conflict markers found")
