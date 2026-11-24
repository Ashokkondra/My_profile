# Multi-format viewer (V11)

Open Pages CMS → My_profile → 02 Projects to upload GLB, STEP/STP or OBJ files separately. Upload files to the matching per-format field and save. The public project page shows available format tabs automatically. GLB remains the default, while STEP and OBJ load only when selected. The project gallery, thumbnails, resume and original repository links remain unchanged.

STEP processing uses occt-import-js 0.0.23 in a worker and is tessellated for browser viewing, not feature-level CAD editing. OBJ is mesh-only and its external MTL materials are not loaded. Both use Three.js 0.181.0. Keep optimized copies for smooth mobile viewing. Files may be replaced or removed using Pages CMS; clearing a field removes that viewing option. If no 3D model remains, the 3D viewer is hidden.

Existing original Creo files can still be shared via the Original CAD field. Large STEP files may require simplified exports. See GitHub Pages media limits and browser memory constraints.
