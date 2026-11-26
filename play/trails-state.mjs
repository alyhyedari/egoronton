export const TRAILS=Object.freeze([
 {id:'foot',name:'Footwork circuit',fa:'مدار قدم‌های سریع',mode:'foot',points:[[56,-42],[96,-42],[96,6],[56,6],[56,-42]],note:'Link your hops, then release jump and stop inside the final gate',faNote:'پرش‌ها را زنجیره کن و در دروازه آخر آرام بگیر'},
 {id:'bicycle',name:'Golden pedal loop',fa:'حلقه رکاب طلایی',mode:'bicycle',points:[[56,-42],[96,-42],[96,6],[56,6],[56,-42]],note:'Save your sprint for the long straight and brake before corners',faNote:'انرژی را برای مسیر مستقیم نگه دار و پیش از پیچ ترمز کن'},
 {id:'horse',name:'Willow and the listening hills',fa:'ویلو و تپه‌های شنوا',mode:'horse',points:[[16,-221],[-60,-265],[-140,-330],[-50,-360],[120,-355],[80,-280],[16,-221]],note:'A long ridge journey with room to rest between gallops',faNote:'سفری بلند روی تپه‌ها با فرصت استراحت بین چهارنعل‌ها'},
 {id:'motorcycle',name:'Bluebird country run',fa:'سفر جاده‌ای بلوبرد',mode:'motorcycle',points:[[96,-42],[140,-69],[151,-111],[124,-141],[76,-177],[56,-145],[56,-42],[96,-42]],note:'Weather changes grip — a clean line beats full throttle',faNote:'هوا چسبندگی را تغییر می‌دهد — خط درست از گاز کامل مهم‌تر است'},
 {id:'car',name:'The long way home',fa:'راه بلند خانه',mode:'car',points:[[56,-42],[96,-42],[96,-91],[62,-130],[76,-177],[16,-221],[-43,-194],[-64,-151],[-28,-118],[0,-110]],note:'Follow the roads from Motor Works into the remembering woods',faNote:'از موتورورکس در امتداد جاده به جنگل خاطره‌ها برو'}
]);
export const VISTAS=Object.freeze([
 ['town',50,-48,'The spare key','کلید یدک','A mechanic left a spare key for a stranger — trust begins small','مکانیک برای یک غریبه کلید یدک گذاشت — اعتماد از کارهای کوچک شروع می‌شود'],
 ['grove',-48,-190,'Room for a quiet day','جای یک روز آرام','Nobody charges rent for this patch of shade','اینجا برای این تکه سایه اجاره نمی‌گیرند'],
 ['ridge',22,-217,'The courier’s promise','قول پیک','The route was longer than the message — she delivered it anyway','مسیر از پیام طولانی‌تر بود — اما پیک آن را رساند'],
 ['bend',148,-105,'A turn worth taking','پیچی که ارزشش را داشت','A bicycle bell answered the wind — no notification needed','زنگ دوچرخه پاسخ باد را داد — بدون نیاز به اعلان'],
 ['lake',-149,-326,'The unposted photograph','عکس منتشرنشده','Some moments are worth keeping without an audience','بعضی لحظه‌ها حتی بدون تماشاگر ارزش نگه‌داشتن دارند'],
 ['station',115,-350,'Forecast: uncertain','پیش‌بینی: نامطمئن','The weather reader wrote: confidence is not certainty','هواشناس نوشت: اعتمادبه‌نفس با قطعیت فرق دارد'],
 ['observatory',-65,-460,'The patient listener','شنونده صبور','A receiver with no signal still taught someone to listen','گیرنده‌ای بی‌سیگنال هم به کسی گوش‌دادن یاد داد'],
 ['crossing',-85,-704,'Two roads, one campfire','دو راه، یک آتش','Rivals shared a meal before they shared a destination','رقیب‌ها پیش از هم‌مسیرشدن یک وعده غذا شریک شدند'],
 ['lodge',-215,-615,'Willow waits','ویلو منتظر است','The ranger says a good rider knows when to walk','جنگلبان می‌گوید سوار خوب می‌داند چه وقت قدم برود'],
 ['east',264,-535,'The slow lane','مسیر آهسته','The fastest courier stopped to repair someone else’s wheel','سریع‌ترین پیک ایستاد تا چرخ دیگری را تعمیر کند'],
 ['vault',170,-751,'Light under the door','نور زیر در','You do not have to solve every shadow tonight','لازم نیست امشب راز همه سایه‌ها را حل کنی'],
 ['return',108,-405,'A map with room left','نقشه‌ای با جای خالی','The blank space is an invitation, not a missing achievement','جای خالی دعوت است، نه دستاوردی که کم داری']
]);
export function normalizeTrails(raw={}){const r=raw&&typeof raw==='object'?raw:{};return {found:VISTAS.map(v=>v[0]).filter(id=>Array.isArray(r.found)&&r.found.includes(id)),records:Object.fromEntries(TRAILS.filter(t=>Number.isFinite(r.records?.[t.id])&&r.records[t.id]>0).map(t=>[t.id,Math.min(86400,r.records[t.id])])),finishes:Math.max(0,Math.min(100000,Number.isInteger(r.finishes)?r.finishes:0))};}
export function startTrail(id){return TRAILS.some(t=>t.id===id)?{id,index:0,elapsed:0,started:false,complete:false}:null;}
export function stepTrail(s,pos,mode,dt){if(!s||s.complete)return false;const trail=TRAILS.find(t=>t.id===s.id);if(!trail)return false;if(s.started)s.elapsed+=Math.max(0,Math.min(.1,Number.isFinite(dt)?dt:0));const [x,z]=trail.points[s.index];if(mode!==trail.mode||Math.hypot(pos.x-x,pos.z-z)>5||pos.altitude>2)return false;s.started=true;s.index++;if(s.index===trail.points.length)s.complete=true;return true;}
