'use strict';
/* V11: optional multi-format CAD viewer. GLB remains the lightweight default. */
(() => {
  const get = id => document.getElementById(id);
  const root = get('interactive-model');
  if (!root) return;
  const cms = window.PortfolioCMS;
  const stage = get('model-stage'), canvas = get('model-canvas');
  const tabs = get('model-format-tabs');
  const specs = [
    {key:'glb',label:'GLB',field:'model_3d',pattern:/\.glb(?:$|[?#])/i},
    {key:'step',label:'STEP',field:'model_step',pattern:/\.(?:step|stp)(?:$|[?#])/i},
    {key:'obj',label:'OBJ',field:'model_obj',pattern:/\.obj(?:$|[?#])/i}
  ];
  let choices=[], selected=null, session=null, generation=0, busy=false;
  let modelViewerPromise=null, threePromise=null, aborter=null, activeWorker=null, cancelWorker=null, cancelGLB=null;
  function note(message,error=false) {
    const el=get('model-status');
    el.hidden=!message; el.textContent=message;
    el.classList.toggle('is-error',error);
  }
  function readyControls(enabled) {
    get('model-autorotate').disabled=!enabled;
    get('model-reset').disabled=!enabled;
    get('model-fullscreen').disabled=!enabled || typeof stage.requestFullscreen!=='function';
  }
  function resetRotate() {
    get('model-autorotate').setAttribute('aria-pressed','false');
    get('model-autorotate').textContent='Start rotation';
  }
  function stopWork() {
    if(aborter){aborter.abort();aborter=null;}
    if(activeWorker){activeWorker.terminate();activeWorker=null;}
    if(cancelWorker){const f=cancelWorker;cancelWorker=null;f(new Error('Cancelled'));}
    if(cancelGLB){const f=cancelGLB;cancelGLB=null;f();}
  }
  function discard() {
    if(session?.kind==='three') {
      const s=session;
      s.renderer.setAnimationLoop(null);
      s.resizeObserver?.disconnect();
      if(s.resizeHandler)window.removeEventListener('resize',s.resizeHandler);
      s.controls.dispose();
      s.root.traverse(node=>{
        node.geometry?.dispose?.();
        const materials=Array.isArray(node.material)?node.material:[node.material];
        materials.forEach(m=>m?.dispose?.());
      });
      s.renderer.dispose();s.renderer.forceContextLoss?.();
    }
    session=null;
    canvas.replaceChildren();
  }
  function clear() {
    generation++;
    stopWork();
    discard();
    busy=false;
    readyControls(false);
    resetRotate();
  }
  function selectFormat(key) {
    const item=choices.find(x=>x.key===key);
    if(!item)return;
    clear();
    selected=item;
    const button=get('model-load-button');
    button.disabled=false;button.textContent='Load '+item.label+' model ↗';
    get('model-cover').hidden=false;
    note('');
    for(const b of tabs.children)b.setAttribute('aria-pressed',String(b.dataset.format===key));
    get('model-download').href=item.url;
    get('model-download').textContent='Download '+item.label+' file ↗';
    get('model-download').hidden=false;
    get('model-disclaimer').textContent=key==='step'
      ? 'STEP geometry is tessellated into a browser preview. For precise solids, dimensions, or editing, download the STEP file and open it in CAD software.'
      : key==='obj'
      ? 'OBJ displays mesh geometry. External MTL files and textures are not loaded by this viewer.'
      : 'The GLB preview shows exported geometry. Check project reports for engineering calculations and results.';
  }
  function configure(p) {
    choices=[];
    for(const spec of specs){
      const url=cms?.media(p?.[spec.field]);
      if(url && spec.pattern.test(url))choices.push({...spec,url});
    }
    if(!choices.length){clear();root.hidden=true;return;}
    root.hidden=false;
    get('model-title').textContent=p.short||p.card_title||p.title||'Engineering model';
    get('model-caption').textContent=p.model_caption?.trim()||'Rotate and zoom your preferred CAD viewing format.';
    const cad=cms?.media(p.original_cad_file);
    get('model-cad-download').hidden=true;
    if(cad && /\.(?:zip|step|stp|stl|iges|igs|prt|asm)(?:$|[?#])/i.test(cad)){
      get('model-cad-download').href=cad;
      get('model-cad-download').hidden=false;
    }
    tabs.replaceChildren();
    for(const spec of choices){
      const button=document.createElement('button');
      button.type='button';button.className='model-format-tab';
      button.dataset.format=spec.key;
      button.setAttribute('aria-pressed','false');
      button.setAttribute('aria-label','View '+spec.label+' model');
      button.textContent=spec.label;
      button.addEventListener('click',()=>selectFormat(spec.key));
      tabs.append(button);
    }
    get('model-format-picker').hidden=choices.length<2;
    selectFormat(choices[0].key);
  }
  function modelViewerLibrary() {
    if(window.customElements?.get('model-viewer'))return Promise.resolve();
    if(modelViewerPromise)return modelViewerPromise;
    modelViewerPromise=new Promise((resolve,reject)=>{
      if(!window.customElements)return reject(new Error('Browser cannot initialize the GLB viewer.'));
      let done=false;
      const timeout=setTimeout(()=>finish(new Error('GLB viewer timed out.')),25000);
      function finish(error) {
        if(done)return;done=true;clearTimeout(timeout);
        if(error)reject(error);else resolve();
      }
      const script=document.createElement('script');
      script.type='module';
      script.src='https://ajax.googleapis.com/ajax/libs/model-viewer/4.4.0/model-viewer.min.js';
      script.onerror=()=>finish(new Error('GLB viewer library unavailable.'));
      window.customElements.whenDefined('model-viewer').then(()=>finish(),()=>finish(new Error('GLB viewer failed to initialize.')));
      document.head.append(script);
    }).catch(e=>{modelViewerPromise=null;throw e;});
    return modelViewerPromise;
  }
  function threeLibraries() {
    if(threePromise)return threePromise;
    threePromise=Promise.all([
      import('three'),
      import('three/addons/controls/OrbitControls.js'),
      import('three/addons/loaders/OBJLoader.js')
    ]).then(([THREE,orbit,obj])=>({THREE,OrbitControls:orbit.OrbitControls,OBJLoader:obj.OBJLoader}))
      .catch(e=>{threePromise=null;throw e;});
    return threePromise;
  }
  async function loadGlb(url,id) {
    await modelViewerLibrary();
    if(generation!==id)return;
    const view=document.createElement('model-viewer');
    view.setAttribute('alt',get('model-title').textContent+' interactive CAD preview');
    view.setAttribute('camera-controls','');
    view.setAttribute('touch-action','pan-y');
    view.setAttribute('loading','eager');
    view.setAttribute('shadow-intensity','0.8');
    view.setAttribute('exposure','1');
    session={kind:'glb',view};
    canvas.replaceChildren(view);
    note('Loading GLB geometry…');
    await new Promise((resolve,reject)=>{
      let done=false;
      const timer=setTimeout(()=>finish(new Error('GLB loading timed out.')),90000);
      function finish(error){if(done)return;done=true;clearTimeout(timer);cancelGLB=null;if(error)reject(error);else resolve();}
      cancelGLB=()=>finish(new Error('Cancelled'));
      view.addEventListener('load',()=>finish(),{once:true});
      view.addEventListener('error',()=>finish(new Error('Could not render this GLB.')),{once:true});
      view.src=url;
    });
  }
  async function fetchModel(url,type,id) {
    aborter=new AbortController();
    const result=await fetch(url,{signal:aborter.signal});
    if(!result.ok)throw new Error(type.toUpperCase()+' download failed (HTTP '+result.status+').');
    const size=Number(result.headers.get('content-length'))||0;
    if(size>100000000)throw new Error('This CAD file is too large for browser preview; download it instead.');
    const data=type==='step'?await result.arrayBuffer():await result.text();
    aborter=null;
    if(generation!==id)throw new Error('Cancelled');
    return data;
  }
  function convertStep(buffer,id) {
    return new Promise((resolve,reject)=>{
      let worker;
      try{worker=new Worker('step-worker.js');}
      catch(e){reject(new Error('STEP conversion worker is unsupported.'));return;}
      activeWorker=worker;
      let done=false;
      const timer=setTimeout(()=>finish(new Error('STEP conversion timed out; try a simplified assembly.')),120000);
      function finish(error,value){
        if(done)return;
        done=true;clearTimeout(timer);
        worker.terminate();
        if(activeWorker===worker)activeWorker=null;
        cancelWorker=null;
        if(error)reject(error);else resolve(value);
      }
      cancelWorker=e=>finish(e);
      worker.onerror=()=>finish(new Error('Unable to start the STEP conversion engine.'));
      worker.onmessage=e=>{
        if(generation!==id)return finish(new Error('Cancelled'));
        if(e.data?.error)return finish(new Error(e.data.error));
        if(!Array.isArray(e.data?.meshes))return finish(new Error('Invalid STEP conversion output.'));
        finish(null,e.data.meshes);
      };
      worker.postMessage({buffer},[buffer]);
    });
  }
  function buildStep(meshes,THREE) {
    const group=new THREE.Group();
    for(const mesh of meshes) {
      if(!mesh.position?.length)continue;
      const geometry=new THREE.BufferGeometry();
      geometry.setAttribute('position',new THREE.BufferAttribute(mesh.position,3));
      if(mesh.index?.length)geometry.setIndex(new THREE.BufferAttribute(mesh.index,1));
      if(mesh.normal?.length===mesh.position.length)geometry.setAttribute('normal',new THREE.BufferAttribute(mesh.normal,3));
      else geometry.computeVertexNormals();
      const color=Array.isArray(mesh.color)&&mesh.color.length===3
        ? new THREE.Color().setRGB(...mesh.color) : new THREE.Color(0x829ba6);
      const material=new THREE.MeshStandardMaterial({color,metalness:0.08,roughness:0.68,side:THREE.DoubleSide});
      const part=new THREE.Mesh(geometry,material);
      part.name=String(mesh.name||'CAD solid');
      group.add(part);
    }
    if(!group.children.length)throw new Error('STEP contained no renderable geometry.');
    return group;
  }
  function buildObj(data,libs) {
    const group=new libs.OBJLoader().parse(data);
    let meshCount=0;
    group.traverse(node=>{
      if(!node.isMesh)return;
      meshCount++;
      const old=Array.isArray(node.material)?node.material:[node.material];
      node.material=new libs.THREE.MeshStandardMaterial({color:0x829ba6,metalness:0.08,roughness:0.68,side:libs.THREE.DoubleSide});
      old.forEach(m=>m?.dispose?.());
      if(!node.geometry.getAttribute('normal'))node.geometry.computeVertexNormals();
    });
    if(!meshCount)throw new Error('OBJ file contains no renderable meshes.');
    return group;
  }
  function mountScene(group,libs,id) {
    if(generation!==id)return;
    const THREE=libs.THREE;
    const scene=new THREE.Scene();
    const camera=new THREE.PerspectiveCamera(42,1,0.001,1000);
    const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
    renderer.outputColorSpace=THREE.SRGBColorSpace;
    const box=new THREE.Box3().setFromObject(group);
    if(box.isEmpty())throw new Error('No visible geometry found.');
    const size=box.getSize(new THREE.Vector3());
    group.position.sub(box.getCenter(new THREE.Vector3()));
    const radius=Math.max(size.x,size.y,size.z,0.01)*0.9;
    camera.near=Math.max(radius/1000,0.0001);camera.far=Math.max(radius*250,100);
    camera.position.set(radius*1.9,radius*1.4,radius*2.1);camera.updateProjectionMatrix();
    scene.add(group);
    scene.add(new THREE.HemisphereLight(0xffffff,0x9aafbd,2.2));
    const key=new THREE.DirectionalLight(0xffffff,3);key.position.set(2,5,4);scene.add(key);
    const fill=new THREE.DirectionalLight(0xc1d4e3,1.2);fill.position.set(-4,0,-3);scene.add(fill);
    canvas.replaceChildren(renderer.domElement);
    const controls=new libs.OrbitControls(camera,renderer.domElement);
    controls.enableDamping=true;
    controls.dampingFactor=0.08;
    controls.minDistance=radius*0.15;controls.maxDistance=radius*40;
    controls.target.set(0,0,0);controls.update();
    const homePosition=camera.position.clone();
    const resize=()=>{
      if(generation!==id)return;
      const w=Math.max(canvas.clientWidth,1),h=Math.max(canvas.clientHeight,1);
      camera.aspect=w/h;camera.updateProjectionMatrix();
      renderer.setSize(w,h,false);
    };
    const observer=typeof ResizeObserver!=='undefined'?new ResizeObserver(resize):null;
    if(observer)observer.observe(canvas);else window.addEventListener('resize',resize);
    resize();
    renderer.setAnimationLoop(()=>{controls.update();renderer.render(scene,camera);});
    session={kind:'three',root:group,renderer,controls,camera,homePosition,resizeObserver:observer,resizeHandler:observer?null:resize};
  }
  async function loadMesh(url,kind,id) {
    note('Fetching '+kind.toUpperCase()+' geometry…');
    const data=await fetchModel(url,kind,id);
    if(generation!==id)return;
    const libs=await threeLibraries();
    if(generation!==id)return;
    let group;
    if(kind==='obj'){group=buildObj(data,libs);}
    else {
      note('Tessellating STEP solids for browser display…');
      const meshes=await convertStep(data,id);
      if(generation!==id)return;
      group=buildStep(meshes,libs.THREE);
    }
    mountScene(group,libs,id);
  }
  async function loadSelected() {
    if(!selected||busy)return;
    const id=++generation;
    busy=true;
    get('model-load-button').disabled=true;
    get('model-cover').hidden=true;
    readyControls(false);
    note('Preparing 3D viewer…');
    try {
      if(selected.key==='glb')await loadGlb(selected.url,id);
      else await loadMesh(selected.url,selected.key,id);
      if(generation!==id)return;
      busy=false;
      note('');
      readyControls(true);
    } catch(e) {
      if(generation!==id)return;
      stopWork();discard();busy=false;
      get('model-cover').hidden=false;
      get('model-load-button').disabled=false;
      get('model-load-button').textContent='Retry '+selected.label+' model ↗';
      readyControls(false);
      note((e?.message||'Model preview unavailable.')+' The project gallery remains available.',true);
    }
  }
  get('model-load-button').addEventListener('click',loadSelected);
  get('model-autorotate').addEventListener('click',()=>{
    if(!session)return;
    const active=session.kind==='glb'?!session.view.hasAttribute('auto-rotate'):!session.controls.autoRotate;
    if(session.kind==='glb')session.view.toggleAttribute('auto-rotate',active);
    else session.controls.autoRotate=active;
    get('model-autorotate').setAttribute('aria-pressed',String(active));
    get('model-autorotate').textContent=active?'Pause rotation':'Start rotation';
  });
  get('model-reset').addEventListener('click',()=>{
    if(!session)return;
    if(session.kind==='glb') {
      session.view.removeAttribute('auto-rotate');
      session.view.removeAttribute('camera-orbit');
      session.view.removeAttribute('camera-target');
      session.view.removeAttribute('field-of-view');
      session.view.resetTurntableRotation?.();session.view.jumpCameraToGoal?.();
    } else {
      session.controls.autoRotate=false;
      session.camera.position.copy(session.homePosition);
      session.controls.target.set(0,0,0);
      session.controls.update();
    }
    resetRotate();
  });
  get('model-fullscreen').addEventListener('click',async()=>{
    if(!session)return;
    try{if(document.fullscreenElement)await document.exitFullscreen();else await stage.requestFullscreen();}
    catch(e){note('Fullscreen is unavailable in this browser.',true);}
  });
  window.addEventListener('pagehide',clear);
  window.portfolio3D={configure};
})();
