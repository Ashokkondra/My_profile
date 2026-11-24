# Interactive 3D models — V10

This website preserves all existing V9 Pages CMS content, project galleries and artwork. An interactive viewer appears **only** on project pages whose Pages CMS project record contains a valid GLB model path.

## Updating a model without coding
1. Open https://app.pagescms.org/ and choose Ashokkondra/My_profile.
2. Open **02 · Projects** and select an existing project.
3. In **Interactive 3D model (GLB; optional)**, upload an optimized `.glb` file.
4. Optionally add a caption and an original CAD archive (ZIP/STEP/etc.).
5. Save. Pages CMS commits the new file and JSON path to GitHub.
6. Visit the public project page at https://ashokkondra.github.io/My_profile/ and refresh if needed. Click **Load interactive model**.
7. To replace or remove a model, edit/clear the same field and save. A cleared field hides the entire 3D viewer, preserving the existing gallery.

## Preparing Creo / CAD assemblies
- Keep your original Creo assembly/part source in your project's GitHub repository or as a ZIP.
- Export your assembled geometry (with its components) into a format your conversion software supports, such as OBJ, STEP, or glTF, and generate a single self-contained GLB.
- Before uploading, check the model's orientation, geometry, material appearance, and units. Large assemblies should be simplified by reducing polygon density and removing unnecessary hidden geometry.
- Try to keep web models small (e.g. under 10–20 MB) for mobile visitors. GitHub has single-file upload limits. GLB is a **viewer export**, not an editable Creo assembly.
- Do not represent a geometry-only GLB as a validated FEA visualization. Reference actual reports for numerical results.

The website downloads the 3D viewer component lazily using the pinned Google model-viewer v4.4.0 CDN. If network access or WebGL prevents viewing, the existing image/PDF/video gallery and repository links still work.

## Technical notes
- Pages CMS field: `model_3d` in each object of `content/projects.json`.
- Public file output prefix: `/My_profile/assets/uploads/models`; website normalization is handled by `PortfolioCMS.media()`.
- Optional CMS fields: `model_caption`, `original_cad_file`.
- Viewer UI is loaded in `project-3d.js`; style rules are appended to `project.css`.
- No other content JSON entries are modified by this deployment.
