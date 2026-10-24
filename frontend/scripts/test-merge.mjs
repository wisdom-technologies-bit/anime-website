import assert from "node:assert/strict";
const { mergeEpisodes } = await import("../app/lib/anivexa/merge.ts");
const base = (providers) => ({ mappings:{title:"Fixture"}, providers, hasAnyEpisode:true, isNotFound:false });
const ep = (id, number, extra={}) => ({id,number,title:`Episode ${number}`,...extra});
assert.equal(mergeEpisodes(base({ reanime:{sub:[ep("a",1,{duration:20})],dub:[]}, animegg:{sub:[],dub:[ep("b",1)]} }), 1)[0].sub_providers.length, 1);
assert.equal(mergeEpisodes(base({ reanime:{sub:[ep("m",1,{title:"Complete Movie"})],dub:[]} }), 2)[0].episode_number, 1);
assert.equal(mergeEpisodes(base({ kaa:{sub:[],dub:[ep("d",1)]} }), 3)[0].dub_providers.length, 1);
assert.equal(mergeEpisodes({mappings:{title:"Fixture"},providers:{mkissa:{sub:[],dub:[]}},hasAnyEpisode:false,isNotFound:false}, 4).length, 0);
console.log("merge fixtures passed");
