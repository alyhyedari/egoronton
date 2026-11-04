const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const ctx={window:{}};vm.createContext(ctx);vm.runInContext(fs.readFileSync(__dirname+'/day-life.js','utf8'),ctx);
let checks=0;
for(const requested of [false,true]){
 const day=Object.create(ctx.window.EgorDay.prototype),classes=new Set();
 Object.assign(day,{active:true,requested,scene:['mischief','Purple',55,26,'Intro','During','End'],clock:35,arrival:3,phase:-1,fromX:61,calmButton:{hidden:true},root:{dataset:{},classList:{toggle(k,v){v?classes.add(k):classes.delete(k);}}},fill:{style:{}},prop:{style:{},setAttribute(){}},artwork:{style:{setProperty(){}}},say(){},stop(){this.active=false;},motion:{active:false,reduced:{matches:false},targetX:()=>120,x:61,scale:1,baseX:0,baseY:0,w:500,h:500,pose(){}}});
 day.update(.01);assert.equal(day.active,false);assert.equal(day.cooldown,requested?1:5);assert.equal(day.motion.x,120);assert.equal(classes.has('purple-mischief'),false);checks+=4;
}
console.log(`${checks} mocked finish/queue/costume checks passed; not browser QA.`);
