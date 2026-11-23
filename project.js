'use strict';
/* Project pages read Pages CMS projects.json, plus optional live GitHub previews. */
(() => {
  const $=id=>document.getElementById(id);
  const cms=window.PortfolioCMS;
  const set=(id,value)=>{if($(id) && value!==undefined && value!==null) $(id).textContent=String(value);};
  const selectedId=new URLSearchParams(location.search).get('id');
  const ext=path=>String(path).split(/[?#]/)[0].split('.').pop().toLowerCase();
  const type=path=>{
    if (['png','jpg','jpeg','gif','webp','svg','avif'].includes(ext(path))) return 'image';
    if (ext(path)==='pdf') return 'pdf';
    if (['mp4','webm','ogg'].includes(ext(path))) return 'video';
    return 'other';
  };
  const encodePath=path=>String(path).split('/').map(encodeURIComponent).join('/');
  const repoInfo=p=>{
    if (!p || typeof p.repo_url!=='string') return null;
    try {
      const u=new URL(p.repo_url);
      const parts=u.pathname.split('/').filter(Boolean);
      if(u.protocol!=='https:' || u.hostname.toLowerCase()!=='github.com' || parts.length!==2) return null;
      if(!parts.every(s=>/^[a-z0-9._-]+$/i.test(s))) return null;
      return {owner:parts[0],repo:parts[1],url:`https://github.com/${parts.map(encodeURIComponent).join('/')}`};
    } catch (_) { return null; }
  };
  const fileName=path=>decodeURIComponent(String(path).split('/').pop() || 'File');
  const modal=$('preview-dialog');
  if(modal){
    $('modal-close').addEventListener('click',()=>modal.close());
    modal.addEventListener('click',event=>{if(event.target===modal) modal.close();});
    modal.addEventListener('close',()=>$('modal-body').replaceChildren());
  }
  function openPreview(kind,src,title,original){
    const body=$('modal-body');body.replaceChildren();set('modal-title',title);$('modal-original').href=original;
    let el;
    if(kind==='image'){el=document.createElement('img');el.alt=title;el.src=src;}
    else if(kind==='pdf'){el=document.createElement('iframe');el.src=src;el.title=`PDF preview: ${title}`;}
    else{el=document.createElement('video');el.src=src;el.controls=true;el.preload='metadata';}
    body.append(el);
    if(modal && typeof modal.showModal==='function') modal.showModal();
    else window.open(original,'_blank','noopener,noreferrer');
  }
  function previewCard(kind,src,name,original){
    const card=document.createElement('article');card.className='preview-card';
    const action=document.createElement('button');action.type='button';action.className='preview-open';
    action.setAttribute('aria-label',`Preview ${name}`);
    const visual=document.createElement('div');visual.className='preview-media';
    if(kind==='image'){
      const img=document.createElement('img');img.src=src;img.alt=`Project image: ${name}`;img.loading='lazy';
      img.addEventListener('error',()=>{visual.replaceChildren();const t=document.createElement('span');t.className='preview-file-icon';t.textContent='IMG';visual.append(t);});
      visual.append(img);
    } else {
      const t=document.createElement('span');t.className='preview-file-icon';t.textContent=kind==='pdf'?'PDF':'▶';visual.append(t);
    }
    action.append(visual);
    action.addEventListener('click',()=>openPreview(kind,src,name,original));
    const detail=document.createElement('div');detail.className='preview-detail';
    const title=document.createElement('p');title.className='preview-name';title.textContent=name;
    const format=document.createElement('span');format.className='preview-type';format.textContent=kind.toUpperCase();
    detail.append(title,format);card.append(action,detail);
    return card;
  }
  function updatedCount(){
    const total=$('previews').querySelectorAll('.preview-card').length;
    set('preview-count',`${total} ${total===1?'PREVIEW':'PREVIEWS'}`);
    return total;
  }
  const normalizeList=value=>typeof value==='string'?[value]:Array.isArray(value)?value:[];
  function renderUploadedGallery(p){
    let added=0;
    const gallery=[...normalizeList(p.gallery_images),...normalizeList(p.gallery_documents),...normalizeList(p.gallery_videos)];
    const urls=new Set();
    for(const item of gallery){
      const src=cms.media(typeof item==='string'?item:item?.src || item?.url || '');
      if(!src || urls.has(src)) continue;
      const kind=type(src);
      if(!['image','pdf','video'].includes(kind)) continue;
      urls.add(src);
      $('previews').append(previewCard(kind,src,fileName(src),src));added++;
    }
    updatedCount();return added;
  }
  function displayNotFound(message){
    document.title='Project not found — Engineering Portfolio';
    set('project-title','Project not found');
    set('summary',message);
    set('preview-status','No project is available for this link.');
    $('repo-link').hidden=true;
    set('preview-count','0 PREVIEWS');
  }
  function renderProject(p,projects){
    const index=projects.indexOf(p);
    const no=String(index+1).padStart(2,'0');
    document.title=`${p.title||p.short} — Engineering Portfolio`;
    const texts={
      'project-title':p.title,'project-counter':`PROJECT ${no} / ${String(projects.length).padStart(2,'0')}`,
      category:p.category_label||p.category,summary:p.summary,overview:p.overview,
      approach:p.approach,takeaway:p.takeaway,discipline:p.discipline,
      'art-index':no,'spec-index':no,'case-art-footer':p.art_footer,
      'breadcrumb-name':p.short||p.card_title||p.title
    };
    for(const [id,value] of Object.entries(texts)) set(id,value||'');
    const info=repoInfo(p);
    for(const linkId of ['repo-link']){
      const link=$(linkId);if(!link) continue;
      link.hidden=!info;
      if(info) link.href=info.url;
    }
    set('case-repo-name',info?`${info.owner} / ${info.repo}`:'PORTFOLIO GALLERY');
    const art=$('case-art');
    [...art.classList].filter(x=>/^art-(blue|peach|slate|sand)$/.test(x)).forEach(x=>art.classList.remove(x));
    art.classList.add('art-'+(['blue','peach','slate','sand'].includes(p.card_theme)?p.card_theme:'blue'));
    const path=cms.media(p.thumbnail);
    const image=$('case-illustration');
    image.src=path||'assets/hero-mechanism.svg';
    image.alt=`${p.card_title||p.title} project cover image`;
    art.classList.toggle('has-custom-thumbnail',Boolean(path));
    $('case-repo-photo').hidden=true;
    const toolBox=$('tools');toolBox.replaceChildren();
    (Array.isArray(p.tools)?p.tools:[]).forEach(tool=>{const el=document.createElement('span');el.textContent=tool;toolBox.append(el);});
    const next=projects[(index+1)%projects.length];
    $('next-project-link').href=`project.html?id=${encodeURIComponent(next.id)}`;
    set('next-project-name',next.short||next.card_title||next.title);
    const local=renderUploadedGallery(p);
    if(info) loadRepository(info,local);
    else{
      set('preview-status',local?'Uploaded project previews are shown below.':'No gallery files uploaded yet. Add images, PDFs or short videos in Pages CMS.');
      $('preview-status').hidden=Boolean(local);
    }
  }
  async function fetchJSON(url){
    const r=await fetch(url,{headers:{Accept:'application/vnd.github+json'}});
    if(!r.ok){
      if([403,429].includes(r.status)) throw new Error('GitHub API rate limit reached.');
      if(r.status===404) throw new Error('Public GitHub repository not found.');
      throw new Error(`GitHub returned HTTP ${r.status}.`);
    }
    return r.json();
  }
  async function loadRepository(repo,curatedCount){
    const api=`https://api.github.com/repos/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.repo)}`;
    try{
      set('preview-status',curatedCount?'Loading additional public repository previews…':'Retrieving available previews from GitHub…');
      $('preview-status').hidden=false;
      const meta=await fetchJSON(api);
      const branch=meta.default_branch;
      if(!branch) throw new Error('Repository branch was unavailable.');
      const branchMeta=await fetchJSON(`${api}/branches/${encodeURIComponent(branch)}`);
      const sha=branchMeta?.commit?.sha;
      if(!sha) throw new Error('Repository contents could not be retrieved.');
      const tree=await fetchJSON(`${api}/git/trees/${encodeURIComponent(sha)}?recursive=1`);
      if(!Array.isArray(tree.tree)) throw new Error('No file listing was returned.');
      const all=tree.tree.filter(f=>f.type==='blob' && ['image','pdf','video'].includes(type(f.path)));
      const prioritize=a=>/isometric|overview|default.?orientation|result|stress|deformation|assembly|final/i.test(a.path)?0:1;
      all.sort((a,b)=>prioritize(a)-prioritize(b)||a.path.localeCompare(b.path));
      const images=all.filter(f=>type(f.path)==='image').slice(0,9);
      const pdfs=all.filter(f=>type(f.path)==='pdf').slice(0,4);
      const videos=all.filter(f=>type(f.path)==='video').slice(0,2);
      for(const f of [...images,...pdfs,...videos]){
        const src=`https://raw.githubusercontent.com/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.repo)}/${encodePath(branch)}/${encodePath(f.path)}`;
        const original=`${repo.url}/blob/${encodePath(branch)}/${encodePath(f.path)}`;
        $('previews').append(previewCard(type(f.path),src,f.path,original));
      }
      const total=updatedCount();
      if(tree.truncated) set('preview-status','GitHub returned a partial file listing; some previews may be missing.');
      else if(!total) set('preview-status','No previewable images, PDFs or videos found. Open the project repository for source files.');
      else $('preview-status').hidden=true;
    }catch(error){
      updatedCount();
      set('preview-status',curatedCount?`Uploaded gallery files are available; repository previews could not load (${error.message}).`:`Project gallery unavailable: ${error.message} You can still open the source repository.`);
      $('preview-status').hidden=false;
    }
  }
  if(!cms || !selectedId){
    displayNotFound('This project link is missing an ID. Return to the Work section.');
    return;
  }
  cms.data('projects').then(projects=>{
    if(!Array.isArray(projects) || !projects.length) return displayNotFound('No projects are currently published.');
    const p=projects.find(x=>x && x.id===selectedId);
    if(!p) return displayNotFound('This project has been removed or its ID has changed. Return to the Work section.');
    renderProject(p,projects);
  }).catch(error=>displayNotFound(`Project information could not be loaded: ${error.message}. Check your connection and try again.`));
})();
