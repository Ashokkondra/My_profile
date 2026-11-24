# Interactive 3D Portfolio — GLB Only

The interactive project viewer supports **GLB models only**. It retains the existing V10 viewer, project galleries, project thumbnails, project case studies, resume, contact details and Pages CMS editing.

## Update a 3D model in Pages CMS

1. Visit https://app.pagescms.org/ and select Ashokkondra/My_profile.
2. Open **02 · Projects** and choose a project.
3. In **Interactive 3D Model (GLB; optional)**, select or upload a `.glb` file.
4. Optionally edit the **3D model description**.
5. Click **Save**. Pages CMS commits the GLB selection and updated project JSON.
6. Open the matching project page at https://ashokkondra.github.io/My_profile/ and click **Load interactive model**.
7. Replace the file through the same field, or clear it to hide the 3D section.

The viewer supports rotate, zoom, auto-rotate, reset and fullscreen. It downloads the model on demand. If the GLB file cannot load, existing images and PDF/video gallery previews remain available.

The original engineering CAD files may still be linked from each project's **Original GitHub project URL**, and project repositories remain unchanged.

## Notes

- Only GLB uploads are configured for the interactive 3D section; STEP/STP, STL, OBJ and ZIP CAD upload fields have been removed from Pages CMS.
- The main portfolio files are unchanged outside the 3D viewer and its CMS configuration.
- Large GLB files may trigger upload limits at hosted Pages CMS. Optimize the viewer export if necessary.
- A GLB is a visualization export, not the native Creo source geometry.
