'use strict';
const catalogRender=render;render=function(){catalogRender();for(const p of products){if(p.gallery&&p.category!=='unique'){const img=document.getElementById('photo-'+p.id);const badge=img?.parentElement.querySelector('.photo-caption');if(badge)badge.textContent='Product photos';}}};

(async()=>{
try{
 const response=await fetch('./data/catalog.json',{cache:'no-store'});if(!response.ok)throw Error('Catalog unavailable');
 const state=TFCatalog.readState(await response.json());
 for(const p of state.products){
  if(p.gallery) p.gallery=p.gallery.map((shot,index)=>typeof shot==='string'?{image:shot,label:p.id.startsWith('fao-')?(index===0?'With case':'Without case'):'Photo '+(index+1)}:shot);
 }
 const merged=TFCatalog.merge(products,state);products.splice(0,products.length,...merged);cleanCart();render();save();
}catch(error){/* Keep the existing catalog available if an update cannot be loaded. */}
})();
