/* Shared catalog rules. No account credentials belong in catalog data. */
(function(root){
'use strict';
const categories={party:'Party Supplies',toys:'Toys',slippers:'Slippers',home:'Home Décor',household:'Household Items',makeup:'Makeup',hair:'Hair Accessories',jewelry:'Jewelry'};
function safeImage(value){
 if(typeof value!=='string')return '';
 if(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=\s]+$/.test(value))return value;
 if(/^https:\/\//i.test(value))return value;
 if(/^(?:\.\/)?assets\/products\/[a-zA-Z0-9._/-]+$/.test(value)&&!value.includes('..'))return value;
 return '';
}
function validate(p){
 if(!p||typeof p!=='object'||!/^[a-z0-9][a-z0-9-]{0,99}$/.test(p.id))throw Error('Invalid product ID.');
 if(typeof p.name!=='string'||!p.name.trim()||p.name.length>160)throw Error('Enter a product name (up to 160 characters).');
 if(!categories[p.category||'party'])throw Error('Choose a product category.');
 if(p.price!==null&&(!Number.isFinite(p.price)||p.price<0||p.price>1000000))throw Error('Enter a valid price or leave it blank.');
 if(!safeImage(p.image))throw Error('Choose a product photo.');
 if(!Array.isArray(p.options)||!p.options.length||p.options.some(x=>typeof x!=='string'||x.length>200))throw Error('Enter valid product options.');
 if(p.description&& (typeof p.description!=='string'||p.description.length>2000))throw Error('Description is too long.');
 if(typeof p.unit!=='string'||p.unit.length>40)throw Error('Enter a valid selling unit.');
 return p;
}
function readState(value){
 if(!value||value.version!==1||!Array.isArray(value.products)||!Array.isArray(value.deletedIds))throw Error('Product catalog format is not recognized.');
 const seen=new Set();for(const p of value.products){validate(p);if(seen.has(p.id))throw Error('Duplicate product ID.');seen.add(p.id);}
 if(value.deletedIds.some(id=>typeof id!=='string'||!/^[a-z0-9][a-z0-9-]{0,99}$/.test(id)))throw Error('Invalid removed product list.');
 return value;
}
function merge(base,state){const overrides=new Map(state.products.map(p=>[p.id,p]));const removed=new Set(state.deletedIds);const result=base.filter(p=>!removed.has(p.id)).map(p=>overrides.get(p.id)||p);const ids=new Set(base.map(p=>p.id));for(const p of state.products)if(!ids.has(p.id)&&!removed.has(p.id))result.unshift(p);return result;}
function parseBase(html){const start=html.indexOf('const products=');if(start<0)throw Error('Could not read existing shop products.');const end=html.indexOf(';let category=',start);if(end<0)throw Error('Could not read existing shop products.');return JSON.parse(html.slice(start+15,end));}
root.TFCatalog={categories,safeImage,validate,readState,merge,parseBase};
})(typeof window==='undefined'?globalThis:window);
