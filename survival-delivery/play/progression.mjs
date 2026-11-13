// Deterministic local progression; independent of rendering and the wall clock.
export const discoveries=[
 ['ribbon','A blue ribbon',-16,-18,'Someone tied a ribbon here to remember the way home.'],
 ['recipe','A folded recipe',30,-20,'Two cups, a little patience, and a place for someone else.'],
 ['seed','A seed envelope',30,-43,'The garden begins with something small enough to lose.'],
 ['sketch','An unfinished sketch',-30,-34,'The empty part belongs to whoever comes next.'],
 ['letter','A letter never sent',-15,-51,'I stayed because the street started to feel like ours.'],
 ['prism','A paper prism',8,-49,'Turn an ordinary shape and it catches another light.'],
 ['ticket','An exhibition ticket',-31,-50,'Admission: bring something you noticed.'],
 ['song','A handwritten melody',15,-30,'A quiet tune for a table near the window.'],
 ['map','A pencilled map',0,-54,'No street is finished while there is still room to wander.']
];
export const commissions=[
 {id:'welcome',title:'A table for a stranger',needs:{cafe:3},find:['recipe'],reward:'Two extra cups appear at the cafe.'},
 {id:'colour',title:'A colour worth keeping',needs:{studio:3},find:['sketch','ribbon'],reward:'Your colour study becomes a public mural.'},
 {id:'green',title:'A garden for everyone',needs:{garden:3},find:['seed'],reward:'New planters bloom along the northern street.'},
 {id:'exhibition',title:'The first small exhibition',needs:{gallery:1,studio:3},find:['ticket'],after:['colour'],reward:'Sculptures join the outdoor exhibition.'},
 {id:'music',title:'A place to pause',needs:{cafe:3},find:['song'],after:['welcome'],reward:'A golden canopy marks the cafe courtyard.'},
 {id:'letter',title:'Someone decided to stay',needs:{garden:3},find:['letter'],after:['green'],reward:'Warm windows appear on the garden wall.'},
 {id:'light',title:'Another way to see',needs:{sculpture:3},find:['prism'],after:['exhibition'],reward:'A ring of light surrounds the turning pencil.'},
 {id:'commons',title:'This place is ours',needs:{},find:['map'],after:['music','letter','light'],reward:'The northern square receives its festival colours.'}
];
export function normalize(raw={},stages={}){
 const object=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{};
 const found=discoveries.map(d=>d[0]).filter(id=>Array.isArray(object.found)&&object.found.includes(id));
 const state={found,built:[],palette:['blue','sunset','sage'].includes(object.palette)?object.palette:'blue'};
 // Only restore rewards whose prerequisites are still valid; never trust stored IDs.
 for(const c of commissions)if(Array.isArray(object.built)&&object.built.includes(c.id)&&!missing(c,state,stages).length)state.built.push(c.id);
 return state;
}
export function missing(c,state,stages){return [...Object.entries(c.needs).filter(([id,n])=>(stages[id]||0)<n).map(([id])=>`Finish ${id}`),...c.find.filter(id=>!state.found.includes(id)).map(id=>`Find ${discoveries.find(d=>d[0]===id)[1]}`),...(c.after||[]).filter(id=>!state.built.includes(id)).map(id=>`Complete “${commissions.find(c=>c.id===id).title}”`)];}
