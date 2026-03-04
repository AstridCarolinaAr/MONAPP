#!/usr/bin/env python
# Script to fix git conflict in servicios/views.py

with open(r'Z:\Proyecto final\MONAPP\servicios\views.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find conflict markers
conflict_start = None
conflict_middle = None
conflict_end = None

for i, line in enumerate(lines):
    if line.startswith('<<<<<<< HEAD'):
        conflict_start = i
    elif line.startswith('=======') and conflict_start is not None and conflict_middle is None:
        conflict_middle = i
    elif line.startswith('>>>>>>>') and conflict_middle is not None:
        conflict_end = i

if conflict_start is not None and conflict_middle is not None and conflict_end is not None:
    # Build the resolved version by keeping the incoming code (after =======)
    resolved_lines = lines[:conflict_start]
    
    # Add incoming code (between ======= and >>>>>>>)
    resolved_lines.extend(lines[conflict_middle + 1:conflict_end])
    
    # Add everything after the conflict
    resolved_lines.extend(lines[conflict_end + 1:])
    
    # Write back
    with open(r'Z:\Proyecto final\MONAPP\servicios\views.py', 'w', encoding='utf-8') as f:
        f.writelines(resolved_lines)
    
    print(f"✓ Conflict in servicios/views.py resolved!")
    print(f"  - Removed conflict markers at lines {conflict_start+1}, {conflict_middle+1}, {conflict_end+1}")
    print(f"  - Kept incoming code from the merged branch")
else:
    print("No conflict markers found or conflict structure invalid")
