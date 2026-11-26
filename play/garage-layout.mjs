// Physical garage obstacles shared by scenery construction and route tests.
export const GARAGE_SOLIDS=[
 {x:76,z:-18,w:23,d:25,h:.5},
 ...[47,104].flatMap(x=>[-48,-25,-2].map(z=>({x,z:z===-48&&x===104?-36:z,w:.22,d:.22,h:4.8}))),
 ...[50,62].flatMap(x=>[5,15].map(z=>({x,z,w:.3,d:.3,h:4})))
];
export const garageObstacles=()=>GARAGE_SOLIDS.map(o=>({x:o.x,z:o.z,w:o.w/2+.25,d:o.d/2+.25}));
