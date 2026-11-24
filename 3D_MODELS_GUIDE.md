# Multi-format viewer (V11)

Open Pages CMS → My_profile → 02 Projects to upload GLB, STEP/STP or OBJ files separately. Upload files to the matching per-format field and save. The public project page shows available format tabs automatically. GLB remains the default, while STEP and OBJ load only when selected. The project gallery, thumbnails, resume and original repository links remain unchanged.

STEP processing uses occt-import-js 0.0.23 in a worker and is tessellated for browser viewing, not feature-level CAD editing. OBJ is mesh-only and its external MTL materials are not loaded. Both use Three.js 0.181.0. Keep optimized copies for smooth mobile viewing. Files may be replaced or removed using Pages CMS; clearing a field removes that viewing option. If no 3D model remains, the 3D viewer is hidden.

Existing original Creo files can still be shared via the Original CAD field. Large STEP files may require simplified exports. See GitHub Pages media limits and browser memory constraints.

## Large STEP file uploads through Pages CMS

If a direct STEP/STP upload fails with HTTP 413, the hosted Pages CMS request is too large. This cannot be fixed by website HTML/CSS or .pages.yml settings.

Use compressed STEP upload:
1. On Windows, right-click a single STEP (.step or .stp) file → Compress to ZIP (or Send to → Compressed ZIP folder). Put just **one STEP file** inside; avoid nesting multiple STEP models.
2. Check the compressed ZIP size. Aim below ~3 MB for reliable uploads to hosted Pages CMS; the exact server-side limit is outside this website's control. If the ZIP also gets 413, simplify/export a smaller model. This feature cannot bypass the server limit.
3. In app.pagescms.org → My_profile → 02 · Projects, select your project and find **Compressed STEP / STP (ZIP)**.
4. Upload the ZIP through Pages CMS, click Save. The existing STEP field may remain blank.
5. Open the public project case study, choose STEP, then Load STEP model. The website will decompress the ZIP inside a browser worker and display the geometry.
6. To replace it later, select a new ZIP and Save. Removing the ZIP will revert to the ordinary STEP field if populated.

This ZIP route compresses the CAD source without substituting a mesh export. The GLB and OBJ options remain unchanged. The STEP viewer is for geometry inspection, not feature-history editing.
