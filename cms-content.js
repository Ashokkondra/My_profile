'use strict';
/* Public-site content loader. Pages CMS edits content/*.json in GitHub. */
(() => {
  const $ = id => document.getElementById(id);
  const set = (id, value) => { const el = $(id); if (el && value !== undefined && value !== null) el.textContent = String(value); };
  const fallback = (value, alternative = '') => String(value ?? alternative);
  const projectsPath = 'content/projects.json';
  const data = async name => {
    const response = await fetch(`content/${name}.json`, {cache: 'no-store'});
    if (!response.ok) throw new Error(`Content ${name} unavailable (${response.status})`);
    return response.json();
  };

  // Github Pages project-site URLs use a /My_profile/ prefix, while local
  // preview and the site HTML use normal relative paths. Handle both safely.
  const media = value => {
    if (typeof value !== 'string' || !value.trim()) return '';
    const input = value.trim();
    if (/^https:\/\//i.test(input)) return input;
    if (/^[a-z]+:/i.test(input) || input.startsWith('//') || input.includes('\\')) return '';
    const clean = input.replace(/^\/My_profile\//i, '').replace(/^\/+/, '');
    if (!clean.startsWith('assets/') || clean.split('/').includes('..')) return '';
    return encodeURI(clean);
  };
  const https = url => {
    if (typeof url !== 'string') return '';
    try { const u = new URL(url); return u.protocol === 'https:' ? u.href : ''; } catch (_) { return ''; }
  };
  const span = (className, text) => { const el = document.createElement('span'); el.className = className; el.textContent = text; return el; };
  const tags = arr => {
    const holder = document.createElement('div'); holder.className = 'micro-tags';
    (Array.isArray(arr) ? arr : []).slice(0,7).forEach(v => holder.append(span('', String(v))));
    return holder;
  };

  function applyProfile(p) {
    if (!p || typeof p !== 'object') return;
    const fullName = `${fallback(p.first_name, 'Ashok')} ${fallback(p.last_name, 'Chakravarti')}`.trim();
    set('brand-name', fullName.toUpperCase());
    set('brand-title', `MECHANICAL ENGINEERING · ${fallback(p.graduation_year, '2027')}`);
    set('first-name', p.first_name);
    if ($('last-name') && p.last_name) {
      $('last-name').replaceChildren(document.createTextNode(p.last_name), span('hero-fullstop', '.'));
    }
    const heroStatus = $('hero-status');
    if (heroStatus) {
      heroStatus.replaceChildren(span('status-pulse',''),document.createTextNode(` ENGINEERING PORTFOLIO / CLASS OF ${fallback(p.graduation_year,'2027')}`));
    }
    set('hero-role', p.headline_role);
    set('hero-summary', p.hero_summary);
    set('about-para-one', p.about_paragraph_one);
    set('about-para-two', p.about_paragraph_two);
    set('about-year', p.graduation_year);
    set('contact-education', `${fallback(p.college,'CVR College of Engineering')} · CLASS OF ${fallback(p.graduation_year,'2027')}`.toUpperCase());
    const link = $('github-profile-link');
    if (link) { const href = https(p.github_profile); if (href) link.href = href; }
    document.title = fullName + (document.body.classList.contains('project-page') ? ' — Engineering Project' : ' — Mechanical Design & Analysis');
  }

  function applyContact(p) {
    if (!p || typeof p !== 'object') return;
    set('contact-introduction',p.opportunity_message);
    set('contact-location',fallback(p.location).toUpperCase());
    const email = fallback(p.email).trim();
    const emailEl = $('contact-email');
    if (emailEl) {
      emailEl.hidden = !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      if (!emailEl.hidden) { emailEl.href = 'mailto:'+email; set('contact-email-text',email); }
    }
    const phone = fallback(p.phone).trim();
    const phoneEl = $('contact-phone');
    if (phoneEl) {
      const dial = phone.replace(/[^+\d]/g,'');
      phoneEl.hidden = !/^\+?\d{7,16}$/.test(dial);
      if (!phoneEl.hidden) { phoneEl.href='tel:'+dial; set('contact-phone-text',phone); }
    }
    const linkedin = $('linkedin-contact');
    if (linkedin) {
      const url = https(p.linkedin_url);
      const valid = url && new URL(url).hostname.toLowerCase().match(/(^|\.)linkedin\.com$/);
      linkedin.hidden = !valid;
      if (valid) linkedin.href = url;
    }
  }

  function applyResume(r) {
    if (!r || typeof r !== 'object') return;
    set('resume-description',r.description);
    // Editable title, preserving the distinctive italic final word.
    const heading = $('resume-heading');
    if (heading && r.title) {
      const words = String(r.title).trim().split(/\s+/);
      const last = words.pop() || '';
      const emph = span('ital', last);
      heading.replaceChildren(document.createTextNode(words.join(' ') + (words.length ? ' ' : '')), emph);
    }
    const doc = media(r.pdf_file);
    const actions = $('resume-actions');
    if (!actions) return;
    actions.hidden = !doc || !/\.pdf(?:$|[?#])/i.test(doc);
    if ($('resume-empty')) $('resume-empty').hidden = !actions.hidden;
    if (!actions.hidden) {
      $('resume-view').href=doc;
      $('resume-download').href=doc;
      // `download` from a same-origin GitHub Pages URL works in most browsers.
    }
  }

  function applyExpertise(items) {
    if (!Array.isArray(items) || !$('capability-grid')) return;
    const grid = $('capability-grid');
    const fragment = document.createDocumentFragment();
    items.forEach((entry, i) => {
      if (!entry || !entry.title) return;
      const card = document.createElement('div'); card.className='capability-card reveal';
      const ico=document.createElement('span'); ico.className='cap-icon';
      ico.append(document.createTextNode(String(i+1).padStart(2,'0')+' '), span('', ['⌁','◎','✳'][i%3]));
      const title=document.createElement('h3');title.textContent=entry.title;
      const desc=document.createElement('p'); desc.textContent=fallback(entry.description);
      const toolList=document.createElement('div'); toolList.className='cap-tools';
      (Array.isArray(entry.tools)?entry.tools:[]).forEach(t=>toolList.append(span('',t)));
      card.append(ico,title,desc,toolList); fragment.append(card);
    });
    if (fragment.childNodes.length) {grid.replaceChildren(fragment); window.portfolioRevealNew?.();}
  }

  function buildProjectCard(p, i) {
    const id = fallback(p.id).trim();
    if (!/^[a-z0-9][a-z0-9-]*$/i.test(id)) return null;
    const no=String(i+1).padStart(2,'0');
    const href=`project.html?id=${encodeURIComponent(id)}`;
    const cat = p.category==='analysis' ? 'analysis' : 'design';
    const size = p.card_size==='large'?'large':'small';
    const theme = ['blue','peach','slate','sand'].includes(p.card_theme)?p.card_theme:'blue';
    const card = document.createElement('article'); card.className=`project-card card-${size} reveal`;card.dataset.category=cat;
    const art=document.createElement('a');art.className=`project-art art-${theme}`;art.href=href;art.setAttribute('aria-label',`Explore ${fallback(p.card_title,p.title)}`);
    art.append(span('art-serial',`${no} / ${cat==='analysis'?'ANALYSIS':'CAD STUDY'}`));
    const artwork=document.createElement('div');artwork.className='art-artwork';
    const path=media(p.thumbnail);
    if(path){art.classList.add('has-custom-thumbnail');const img=document.createElement('img');img.className='project-thumbnail';img.src=path;img.alt=`${fallback(p.card_title,p.title)} cover artwork`;img.loading='lazy';img.decoding='async';artwork.append(img);}
    else {const icon=document.createElement('span');icon.className='preview-file-icon';icon.textContent='CAD';artwork.append(icon);}
    const corner=span('art-corner','↗');corner.setAttribute('aria-hidden','true');
    const foot=span('art-footer',fallback(p.art_footer,'MECHANICAL STUDY')+' ');
    foot.append(span('',`FIG. ${no}`));
    art.append(artwork,corner,foot);
    const bottom=document.createElement('div');bottom.className='project-bottom';
    const textHolder=document.createElement('div');
    const type=span('project-type',fallback(p.card_type,p.category_label));
    const h3=document.createElement('h3'); const hlink=document.createElement('a');hlink.href=href;
    hlink.append(document.createTextNode(fallback(p.card_title,p.title)+' '),span('',fallback(p.card_subtitle)));
    h3.append(hlink);
    const desc=document.createElement('p');desc.textContent=fallback(p.card_description,p.summary);
    textHolder.append(type,h3,desc);
    bottom.append(textHolder,span('project-number',no));
    card.append(art,bottom,tags(p.tools));
    return card;
  }

  function applyProjects(items) {
    if (!Array.isArray(items) || !$('project-list')) return;
    const root=$('project-list');const fragment=document.createDocumentFragment();
    items.forEach((p,i)=>{const card=buildProjectCard(p,i);if(card) fragment.append(card);});
    if (fragment.childNodes.length===0) return;
    const count=String(fragment.childNodes.length).padStart(2,'0');
    root.replaceChildren(fragment);
    set('about-project-count',count);
    set('work-count',count);
    set('all-filter-count',count);
    // Existing filters still work because script.js queries cards on click.
    const filter=document.querySelector('.filter-chip.active');
    if(filter && filter.dataset.filter!=='all') root.querySelectorAll('.project-card').forEach(card=>card.hidden=card.dataset.category!==filter.dataset.filter);
    window.portfolioRevealNew?.();
  }

  // Also consumed by project.js on project pages.
  window.PortfolioCMS = {data, media, https, set, projectsPath};
  data('profile').then(applyProfile).catch(err=>console.warn('Profile CMS data:',err.message));
  if ($('project-list')) {
    Promise.allSettled([data('projects'),data('expertise'),data('contact'),data('resume')])
      .then(results=>{
        const handlers=[applyProjects,applyExpertise,applyContact,applyResume];
        results.forEach((result,i)=>{
          if(result.status==='fulfilled') handlers[i](result.value);
          else console.warn('CMS content unavailable:',result.reason?.message);
        });
      });
  }
})();
