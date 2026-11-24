'use strict';
/* STEP conversion runs off the main browser thread. */
const CDN='https://cdn.jsdelivr.net/npm/occt-import-js@0.0.23/dist/';
let enginePromise;
async function getEngine() {
  if(!enginePromise) {
    importScripts(CDN+'occt-import-js.js');
    if(typeof self.occtimportjs!=='function')throw new Error('STEP engine unavailable.');
    enginePromise=self.occtimportjs({locateFile:name=>CDN+name});
  }
  return enginePromise;
}
self.onmessage=async event=>{
  try {
    const engine=await getEngine();
    const result=engine.ReadStepFile(new Uint8Array(event.data.buffer),null);
    if(!result?.success||!Array.isArray(result.meshes)||!result.meshes.length)
      throw new Error('STEP file has no supported solids.');
    const meshes=[],transfer=[];
    let count=0;
    for(const m of result.meshes) {
      const src=m.attributes?.position?.array;
      if(!src?.length)continue;
      count+=src.length;
      if(count>18000000)throw new Error('STEP assembly too complex for browser viewing; simplify it first.');
      const position=new Float32Array(src);
      const normal=m.attributes?.normal?.array?.length===src.length?new Float32Array(m.attributes.normal.array):null;
      const index=m.index?.array?.length?new Uint32Array(m.index.array):null;
      meshes.push({name:m.name||'',position,normal,index,color:Array.isArray(m.color)?m.color:null});
      transfer.push(position.buffer);
      if(normal)transfer.push(normal.buffer);
      if(index)transfer.push(index.buffer);
    }
    if(!meshes.length)throw new Error('STEP model could not be triangulated.');
    self.postMessage({meshes},transfer);
  } catch(e) {self.postMessage({error:e?.message||'STEP conversion failed.'});}
};
