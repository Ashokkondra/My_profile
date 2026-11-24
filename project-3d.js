'use strict';
/* Optional 3D CAD renderer: no 3D library or model download until requested. */
(() => {
  const $ = id => document.getElementById(id);
  const root = $('interactive-model');
  if (!root) return;
  const cms = window.PortfolioCMS;
  let modelPath = '';
  let viewer = null;
  let libraryPromise = null;
  let loaded = false;
  let busy = false;
  const setStatus = (message, error = false) => {
    const el = $('model-status');
    el.hidden = !message;
    el.textContent = message;
    el.classList.toggle('is-error', error);
  };
  const controlsReady = ready => {
    ['model-autorotate', 'model-reset'].forEach(id => { $(id).disabled = !ready; });
    $('model-fullscreen').disabled = !ready || typeof $('model-stage').requestFullscreen !== 'function';
  };
  function loadLibrary() {
    if (window.customElements?.get('model-viewer')) return Promise.resolve();
    if (libraryPromise) return libraryPromise;
    libraryPromise = new Promise((resolve, reject) => {
      if (!window.customElements) return reject(new Error('This browser does not support interactive 3D components.'));
      let done = false;
      const timeout = setTimeout(() => finish(new Error('3D viewer timed out. Check your connection.')), 25000);
      function finish(error) {
        if (done) return;
        done = true;
        clearTimeout(timeout);
        if (error) reject(error);
        else resolve();
      }
      const script = document.createElement('script');
      script.type = 'module';
      script.src = 'https://ajax.googleapis.com/ajax/libs/model-viewer/4.4.0/model-viewer.min.js';
      script.onerror = () => finish(new Error('Unable to load the 3D viewer library.'));
      window.customElements.whenDefined('model-viewer').then(() => finish(), () => finish(new Error('3D viewer could not initialize.')));
      document.head.append(script);
    }).catch(error => { libraryPromise = null; throw error; });
    return libraryPromise;
  }
  function configure(project) {
    // Pages CMS media paths are normalized by the same helper as the image/PDF gallery.
    const path = cms?.media(project?.model_3d);
    if (!path || !/\.glb(?:[?#]|$)/i.test(path)) return;
    modelPath = path;
    root.hidden = false;
    $('model-title').textContent = project.short || project.card_title || project.title || 'Engineering model';
    $('model-caption').textContent = project.model_caption?.trim() || 'Explore the exported CAD geometry. Drag to rotate, scroll or pinch to zoom.';
    $('model-download').href = modelPath;
    $('model-download').hidden = false;
  }
  async function loadModel() {
    if (!modelPath || busy) return;
    busy = true;
    $('model-load-button').disabled = true;
    $('model-cover').hidden = true;
    setStatus('Preparing interactive viewer…');
    try {
      await loadLibrary();
      $('model-canvas').replaceChildren();
      loaded = false;
      controlsReady(false);
      viewer = document.createElement('model-viewer');
      viewer.setAttribute('alt', $('model-title').textContent + ' — interactive 3D CAD model');
      viewer.setAttribute('camera-controls', '');
      viewer.setAttribute('touch-action', 'pan-y');
      viewer.setAttribute('loading', 'eager');
      viewer.setAttribute('shadow-intensity', '0.8');
      viewer.setAttribute('exposure', '1');
      viewer.setAttribute('interaction-prompt', 'auto');
      viewer.addEventListener('load', () => {
        loaded = true;
        busy = false;
        setStatus('');
        controlsReady(true);
      }, {once:true});
      viewer.addEventListener('error', () => {
        busy = false;
        loaded = false;
        controlsReady(false);
        setStatus('This GLB could not be rendered. Please replace it with a valid, optimized GLB in Pages CMS. The original project gallery is still available.', true);
        $('model-load-button').disabled = false;
        $('model-load-button').textContent = 'Retry model ↗';
        $('model-cover').hidden = false;
      }, {once:true});
      $('model-canvas').append(viewer);
      setStatus('Loading 3D geometry…');
      viewer.src = modelPath;
    } catch (error) {
      busy = false;
      controlsReady(false);
      $('model-load-button').disabled = false;
      $('model-load-button').textContent = 'Retry model ↗';
      $('model-cover').hidden = false;
      setStatus(error.message || '3D viewer is unavailable.', true);
    }
  }
  $('model-load-button').addEventListener('click', loadModel);
  $('model-autorotate').addEventListener('click', () => {
    if (!viewer || !loaded) return;
    const rotating = viewer.hasAttribute('auto-rotate');
    viewer.toggleAttribute('auto-rotate', !rotating);
    $('model-autorotate').setAttribute('aria-pressed', String(!rotating));
    $('model-autorotate').textContent = rotating ? 'Start rotation' : 'Pause rotation';
  });
  $('model-reset').addEventListener('click', () => {
    if (!viewer || !loaded) return;
    viewer.removeAttribute('auto-rotate');
    viewer.removeAttribute('camera-orbit');
    viewer.removeAttribute('camera-target');
    viewer.removeAttribute('field-of-view');
    viewer.resetTurntableRotation?.();
    viewer.jumpCameraToGoal?.();
    $('model-autorotate').setAttribute('aria-pressed', 'false');
    $('model-autorotate').textContent = 'Start rotation';
  });
  $('model-fullscreen').addEventListener('click', async () => {
    if (!viewer || !loaded) return;
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await $('model-stage').requestFullscreen();
    } catch (_) { setStatus('Fullscreen is unavailable in this browser.', true); }
  });
  window.portfolio3D = {configure};
})();
