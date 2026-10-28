/* Progressive enhancement: retain the original images, labels and layout.
   No scroll coordinates, traveller, canvas, timers or JS animation loop. */
(() => {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const poses = {
    seated: {x:311, y:215, duration:8.6, arm:{x:411, y:311, points:'405,308 404,232 444,232 444,326 417,314', radius:4}},
    confident: {x:314, y:183, duration:10.8},
    guide: {x:307, y:190, duration:9.4, arm:{x:418, y:279, points:'409,272 466,183 497,183 497,268 427,288', radius:4.5}},
    curious: {x:305, y:211, duration:12.2}
  };
  const node = (tag, attrs = {}) => {
    const element = document.createElementNS(NS, tag);
    for (const [key, value] of Object.entries(attrs)) element.setAttribute(key, value);
    return element;
  };
  const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    for (const entry of entries) entry.target.classList.toggle('idle-visible', entry.isIntersecting);
  }, {threshold:0.05}) : null;
  document.querySelectorAll('.pose-stage>img,.token-host>img,.guide-disc>img,.curious-host>img,.farewell-lockup>img').forEach((image, index) => {
    const shell = document.createElement('span');
    shell.className = 'idle-shell';
    image.before(shell);
    shell.append(image);
    image.classList.add('idle-source');
    if (observer) observer.observe(shell);
    else shell.classList.add('idle-visible');
    function build() {
      shell.classList.remove('idle-ready');
      shell.querySelector('svg')?.remove();
      if (!image.complete || !image.naturalWidth) return;
      const pose = image.getAttribute('src').match(/egor-(seated|confident|guide|curious)\.webp(?:[?#].*)?$/)?.[1];
      if (!poses[pose]) return;
      const {x,y,duration,arm:joint} = poses[pose];
      shell.dataset.pose = pose;
      shell.style.setProperty('--neck-x', `${x / 6.4}%`);
      shell.style.setProperty('--neck-y', `${y / 6.4}%`);
      shell.style.setProperty('--idle-duration', `${duration + index * 0.7}s`);
      // Negative phases start alive immediately, without synchronized clones.
      shell.style.setProperty('--idle-delay', `${-index * 1.3}s`);
      shell.style.setProperty('--gesture-delay', `${-index * 0.47}s`);
      if (joint) {
        shell.style.setProperty('--elbow-x', `${joint.x / 6.4}%`);
        shell.style.setProperty('--elbow-y', `${joint.y / 6.4}%`);
      }
      const svg = node('svg', {viewBox:'0 0 640 640', class:'idle-figure', 'aria-hidden':'true', focusable:'false'});
      const defs = node('defs');
      const prefix = `egor-idle-${index}`;
      const headClip = node('clipPath', {id:`${prefix}-head`});
      headClip.append(node('rect', {x:0,y:0,width:640,height:y + 1}));
      const mask = node('mask', {id:`${prefix}-body`, maskUnits:'userSpaceOnUse', x:0,y:0,width:640,height:640});
      mask.append(node('rect', {x:0,y:y,width:640,height:640-y,fill:'white'}));
      if (joint) {
        mask.append(node('polygon', {points:joint.points,fill:'black'}));
        const armClip = node('clipPath', {id:`${prefix}-arm`});
        armClip.append(node('polygon', {points:joint.points}));
        defs.append(armClip);
      }
      defs.append(headClip, mask);
      svg.append(defs);
      const layer = () => node('image', {href:image.currentSrc || image.src,width:640,height:640});
      const body = layer();
      body.setAttribute('mask', `url(#${prefix}-body)`);
      svg.append(body);
      const head = node('g', {class:'idle-head'});
      const headImage = layer();
      headImage.setAttribute('clip-path', `url(#${prefix}-head)`);
      head.append(headImage);
      svg.append(head);
      if (joint) {
        const arm = node('g', {class:'idle-gesture'});
        const armImage = layer();
        armImage.setAttribute('clip-path', `url(#${prefix}-arm)`);
        arm.append(armImage);
        svg.append(arm);
        // A tiny stationary ink joint hides antialias seams at either extreme.
        svg.append(node('circle', {cx:joint.x,cy:joint.y,r:joint.radius,fill:'#071215'}));
      }
      shell.append(svg);
      shell.classList.add('idle-ready');
    }
    image.addEventListener('load', build);
    image.addEventListener('error', () => {
      shell.classList.remove('idle-ready');
      shell.querySelector('svg')?.remove();
    });
    // Mood selection keeps its original accessible image and updates these layers.
    new MutationObserver(build).observe(image, {attributes:true, attributeFilter:['src']});
    build();
  });
})();
