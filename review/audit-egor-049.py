#!/usr/bin/env python3
"""Offline SEO, local-link and release audit. No external requests."""
import json, re, subprocess
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, unquote
import xml.etree.ElementTree as ET

ROOT = Path('/mnt/data/egor-world-0.4.9')
ORIGIN = 'https://www.egorverse.xyz'
class Page(HTMLParser):
    def __init__(self, text):
        super().__init__(); self.tags=[]; self.ids=[]; self.schemas=[]; self.schema=None
        self.feed(text)
        self.document_title_count=len(re.findall(r'<title(?:\s[^>]*)?>', text.split('</head>')[0]))
        self.primary_h1_count=len(re.findall(r'<h1(?:\s[^>]*)?>', re.sub(r'<noscript\b.*?</noscript>', '', text, flags=re.S)))
    def handle_starttag(self, tag, attrs):
        a=dict(attrs); self.tags.append((tag,a))
        if 'id' in a: self.ids.append(a['id'])
        if tag=='script' and a.get('type')=='application/ld+json': self.schema=''
    def handle_data(self, data):
        if self.schema is not None: self.schema+=data
    def handle_endtag(self, tag):
        if tag=='script' and self.schema is not None:
            self.schemas.append(json.loads(self.schema)); self.schema=None

pages={p.name:Page(p.read_text()) for p in ROOT.glob('*.html') if not p.name.startswith('google')}
errors=[]; details=[]; links=0
for name,p in pages.items():
    def check(ok,msg):
        if not ok: errors.append(f'{name}: {msg}')
    meta={a.get('name',a.get('property')):a.get('content','') for t,a in p.tags if t=='meta'}
    canonical=[a.get('href') for t,a in p.tags if t=='link' and a.get('rel')=='canonical']
    expected=ORIGIN+('/' if name=='index.html' else '/'+name)
    check(canonical==[expected],'canonical mismatch')
    check(bool(meta.get('description')),'description missing')
    check(meta.get('egor-release')=='0.4.9','release mismatch')
    check(p.document_title_count==1,'document title count')
    check(p.primary_h1_count==1,'primary h1 count (excluding noscript fallback)')
    check(not [i for i,n in Counter(p.ids).items() if n>1],'duplicate IDs')
    check(not 'noindex' in meta.get('robots',''),'noindex present')
    for t,a in p.tags:
        for attr in ('href','src','poster'):
            value=a.get(attr)
            if not value: continue
            u=urlsplit(value)
            if u.scheme or u.netloc:
                if u.scheme not in ('http','https') or u.netloc!='www.egorverse.xyz': continue
            path=unquote(u.path).lstrip('/') or name
            if u.netloc and not u.path.strip('/'): path='index.html'
            target=ROOT/path
            if target.is_dir(): target=target/'index.html'
            check(target.is_file(),f'missing local target {value}'); links+=1
            if u.fragment and target.name in pages:
                check(unquote(u.fragment) in pages[target.name].ids,f'missing anchor {value}')
    details.append({'page':name,'canonical':canonical,'structuredDataBlocks':len(p.schemas),'descriptionLength':len(meta.get('description',''))})
urls=[e.text for e in ET.parse(ROOT/'sitemap.xml').iter('{http://www.sitemaps.org/schemas/sitemap/0.9}loc')]
expected={ORIGIN+('/' if n=='index.html' else '/'+n) for n in pages}
if set(urls)!=expected or len(urls)!=len(expected): errors.append('Sitemap pages mismatch')
if 'Sitemap: '+ORIGIN+'/sitemap.xml' not in (ROOT/'robots.txt').read_text(): errors.append('robots sitemap missing')
syntax=[]
for p in sorted(ROOT.glob('*.js'))+sorted(ROOT.glob('*.mjs')):
    result=subprocess.run(['node','--check',str(p)],capture_output=True,text=True)
    if result.returncode: errors.append(result.stderr)
    syntax.append(p.name)
manifest=subprocess.run(['python',str(ROOT/'update_asset_manifest.py'),'--check'],capture_output=True,text=True)
if manifest.returncode: errors.append(manifest.stderr)
result={'scope':'Offline static audit only; not ranking, live availability or hosting verification','pages':details,'localReferencesChecked':links,'sitemapURLs':urls,'javascriptSyntaxChecked':syntax,'assetManifest':manifest.stdout.strip(),'errors':errors,'passed':not errors}
Path('/mnt/data/EGOR-049-final-audit.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(result,indent=2))
raise SystemExit(bool(errors))
