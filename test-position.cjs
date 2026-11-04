const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const ctx={window:{}};vm.createContext(ctx);vm.runInContext(fs.readFileSync(__dirname+'/day-life.js','utf8'),ctx);
let checks=0;
for(const reduced of [false,true])for(const clock of [3,10,24,28,32]){
 const style={setProperty(){}};
 const day=Object.create(ctx.window.EgorDay.prototype);
 Object.assign(day,{calmButton:{hidden:true},active:true,scene:['coffee','Coffee',72,25,'Intro','During','End'],clock,arrival:2.4,phase:-1,fromX:61,root:{dataset:{},classList:{toggle(){}}},fill:{style:{}},prop:{style:{},setAttribute(){}},artwork:{style},say(){},stop(){this.active=false;},motion:{active:false,reduced:{matches:reduced},targetX:()=>120,x:61,scale:1,baseX:0,baseY:0,w:500,h:500,pose(){}}});
 day.update(.01);assert.equal(day.motion.x,reduced?61:120);checks++;
}
console.log(`${checks} position checks passed (mocked director; not browser QA).`);
