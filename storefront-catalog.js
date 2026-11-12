'use strict';
(async()=>{
try{
 const response=await fetch('./data/catalog.json',{cache:'no-store'});if(!response.ok)throw Error('Catalog unavailable');
 const state=TFCatalog.readState(await response.json());const merged=TFCatalog.merge(products,state);products.splice(0,products.length,...merged);cleanCart();render();save();
}catch(error){/* Keep the existing catalog available if an update cannot be loaded. */}
})();
