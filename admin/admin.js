'use strict';
(() => {
const OWNER='mperez84',REPO='Treasue-Finds',BRANCH='main',ROOT=`/repos/${OWNER}/${REPO}`;
const $=id=>document.getElementById(id),C=window.TFCatalog;
let key='',base=[],state={version:1,products:[],deletedIds:[]},head='',tree='',editing=null,pendingPhoto=null,dirty=false,busy=false;
const setup=new URL('https://github.com/settings/personal-access-tokens/new');setup.searchParams.set('name','Treasure Finds Dashboard');setup.searchParams.set('description','Publish Treasure Finds products from my owner dashboard');setup.searchParams.set('target_name',OWNER);setup.searchParams.set('contents','write');$('key-link').href=setup.href;
for(const [id,name] of Object.entries(C.categories)){const option=document.createElement('option');option.value=id;option.textContent=name;$('category').append(option);}
function status(message,type=''){const box=$('status');box.textContent=message;box.className='status '+type;box.hidden=false;}
function lock(value){busy=value;for(const el of document.querySelectorAll('button,input,select,textarea'))el.disabled=value;}
async function api(path,method='GET',body,raw=false){
 const response=await fetch('https://api.github.com'+path,{method,cache:'no-store',credentials:'omit',headers:{Accept:raw?'application/vnd.github.raw+json':'application/vnd.github+json',Authorization:'Bearer '+key,'X-GitHub-Api-Version':'2022-11-28',...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});
 if(!response.ok){const error=new Error(response.status===401?'Your access key is invalid or expired. Disconnect and use a new key.':response.status===403?'GitHub refused this change. Check that your key has Contents: Read and write for Treasue-Finds, or try again if GitHub has temporarily limited requests.':response.status===409||response.status===422?'Your shop changed in another tab or session. Reconnect to load the latest products before trying again.':'GitHub could not complete the request ('+response.status+'). Your current live shop has not been replaced.');error.status=response.status;throw error;}
 return raw?response.text():response.status===204?null:response.json();
}
async function snapshot(){
 const ref=await api(ROOT+'/git/ref/heads/'+BRANCH);const revision=ref.object.sha;const commit=await api(ROOT+'/git/commits/'+revision);
 const html=await api(ROOT+'/contents/index.html?ref='+revision,'GET',undefined,true);
 let catalog;try{catalog=JSON.parse(await api(ROOT+'/contents/data/catalog.json?ref='+revision,'GET',undefined,true));}catch(e){if(e.status!==404)throw e;catalog={version:1,products:[],deletedIds:[]};}
 base=C.parseBase(html);state=C.readState(catalog);head=revision;tree=commit.tree.sha;
}
$('connect-form').addEventListener('submit',async event=>{event.preventDefault();key=$('access-key').value.trim();$('access-key').value='';if(!key)return;lock(true);status('Connecting securely to your shop…');
 try{const user=await api('/user');if(user.login.toLowerCase()!==OWNER.toLowerCase())throw Error('Connect with the GitHub account mperez84, which owns this shop.');await snapshot();$('connect-panel').hidden=true;$('workspace').hidden=false;renderList();newProduct(true);status('Connected. Choose a product to edit, or add a new find.','success');}
 catch(e){key='';status(e.message,'error');}finally{lock(false);}
});
function all(){return C.merge(base,state);}
function renderList(){const list=$('product-list');list.replaceChildren();const term=$('product-search').value.trim().toLowerCase();const products=all();$('product-count').textContent=products.length+' products in your shop';for(const p of products.filter(p=>p.name.toLowerCase().includes(term))){const row=document.createElement('button');row.type='button';row.className='product-row'+(p.id===editing?' active':'');const img=document.createElement('img');img.src=new URL(p.image,location.href.replace(/admin\/.*$/,'')).href;img.alt='';img.loading='lazy';const text=document.createElement('span');text.className='row-copy';const name=document.createElement('strong');name.textContent=p.name;const meta=document.createElement('small');meta.textContent=(p.price==null?'Ask for price':'BZ$'+p.price.toFixed(2))+' · '+(p.soldOut?'Sold out':C.categories[p.category||'party']);text.append(name,meta);const arrow=document.createElement('span');arrow.className='arrow';arrow.textContent='›';row.append(img,text,arrow);row.addEventListener('click',()=>editProduct(p.id));list.append(row);}if(!list.children.length){const empty=document.createElement('p');empty.textContent='No products found.';list.append(empty);}}
function canLeave(){return !dirty||confirm('Discard the changes you have not published?');}
function setPhoto(src){$('photo-preview').hidden=!src;$('photo-prompt').hidden=!!src;if(src)$('photo-preview').src=new URL(src,location.href.replace(/admin\/.*$/,'')).href;else $('photo-preview').removeAttribute('src');}
function newProduct(skip=false){if(!skip&&!canLeave())return;editing=null;pendingPhoto=null;dirty=false;$('product-form').reset();$('category').value='party';$('unit').value='item';$('editor-title').textContent='Add a new find';$('publish').textContent='Publish product';$('remove').hidden=true;setPhoto('');renderList();}
function editProduct(id){if(!canLeave())return;const p=all().find(p=>p.id===id);editing=id;pendingPhoto=null;dirty=false;$('product-form').reset();$('product-name').value=p.name;$('price').value=p.price==null?'':p.price;$('category').value=p.category||'party';$('unit').value=p.unit;$('options').value=p.options.join('\n');$('description').value=p.description||'';$('sold-out').checked=!!p.soldOut;$('editor-title').textContent='Edit your find';$('publish').textContent='Publish changes';$('remove').hidden=false;setPhoto(p.image);renderList();if(matchMedia('(max-width:800px)').matches)$('editor-title').scrollIntoView({behavior:'smooth',block:'start'});}
$('product-search').addEventListener('input',renderList);$('new-product').addEventListener('click',()=>newProduct());$('product-form').addEventListener('input',()=>{dirty=true;});
$('photo').addEventListener('change',async()=>{const file=$('photo').files[0];if(!file)return;lock(true);status('Preparing your photo…');try{
 if(file.size>25*1024*1024)throw Error('Choose a photo smaller than 25 MB.');
 if(!/^image\/(jpeg|png|webp|heic|heif)$/.test(file.type)&&! /\.(jpe?g|png|webp|hei[cf])$/i.test(file.name))throw Error('Choose a JPEG, PNG or WebP photo.');
 const url=URL.createObjectURL(file),img=new Image();try{img.src=url;await img.decode();const scale=Math.min(1,1600/Math.max(img.naturalWidth,img.naturalHeight));const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);pendingPhoto=canvas.toDataURL('image/jpeg',.88);setPhoto(pendingPhoto);dirty=true;status('Photo ready. Add your details, then publish.','success');}finally{URL.revokeObjectURL(url);}
 }catch(e){status(e.message.includes('decode')||e.name==='EncodingError'?'This photo format could not be opened. Please choose a JPEG or a screenshot from your iPhone.':e.message,'error');$('photo').value='';}finally{lock(false);}
});
async function publishState(next,photo,id,message){
 const latest=await api(ROOT+'/git/ref/heads/'+BRANCH);if(latest.object.sha!==head)throw Error('Your shop changed since you connected. Disconnect and reconnect to load the latest products; then apply your changes again.');
 const entries=[];if(photo){const blob=await api(ROOT+'/git/blobs','POST',{content:photo.split(',')[1],encoding:'base64'});const path='assets/products/'+id+'-'+crypto.randomUUID()+'.jpg';entries.push({path,mode:'100644',type:'blob',sha:blob.sha});next.products.find(p=>p.id===id).image=path;}
 C.readState(next);entries.push({path:'data/catalog.json',mode:'100644',type:'blob',content:JSON.stringify(next,null,2)+'\n'});
 const newTree=await api(ROOT+'/git/trees','POST',{base_tree:tree,tree:entries});const commit=await api(ROOT+'/git/commits','POST',{message,tree:newTree.sha,parents:[head]});
 // Never force-push: a simultaneous edit must be reloaded, never overwritten.
 try{await api(ROOT+'/git/refs/heads/'+BRANCH,'PATCH',{sha:commit.sha,force:false});}catch(error){
  // A network interruption can happen after GitHub accepts the write.
  let observed;try{observed=await api(ROOT+'/git/ref/heads/'+BRANCH);}catch(ignored){}
  if(observed?.object.sha!==commit.sha)throw error;
 }
 state=next;head=commit.sha;tree=newTree.sha;dirty=false;pendingPhoto=null;renderList();$('save-summary').textContent='Last saved '+new Date().toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})+'. Website update is processing.';
 status('Saved to your shop. GitHub is updating the live website; allow a few minutes, then refresh your shop to see the change.','success');
}
$('product-form').addEventListener('submit',async event=>{event.preventDefault();if(!key||busy)return;lock(true);status('Publishing your product…');try{
 const existing=editing?all().find(p=>p.id===editing):null;const id=editing||'find-'+crypto.randomUUID();const options=$('options').value.split('\n').map(x=>x.trim()).filter(Boolean);if(!options.length)options.push('As pictured');
 const p={...(existing||{}),id,name:$('product-name').value.trim(),price:$('price').value.trim()===''?null:Number($('price').value),category:$('category').value,unit:$('unit').value.trim(),options,description:$('description').value.trim(),soldOut:$('sold-out').checked,image:pendingPhoto||existing?.image||''};
 if(pendingPhoto){delete p.designImages;delete p.originalImage;delete p.imageSources;delete p.imageSource;delete p.defaultDesign;}else if(p.defaultDesign&&!options.includes(p.defaultDesign))p.defaultDesign=options[0];
 C.validate(p);const next=structuredClone(state);next.products=next.products.filter(x=>x.id!==id);next.products.unshift(p);next.deletedIds=next.deletedIds.filter(x=>x!==id);await publishState(next,pendingPhoto,id,'Update shop product: '+p.name);editing=id;$('editor-title').textContent='Edit your find';$('publish').textContent='Publish changes';$('remove').hidden=false;renderList();
 }catch(e){status(e.message,'error');}finally{lock(false);}
});
$('remove').addEventListener('click',async()=>{if(!editing||busy)return;const p=all().find(p=>p.id===editing);if(!confirm('Remove “'+p.name+'” from the website?'))return;lock(true);status('Removing product…');try{const next=structuredClone(state);next.products=next.products.filter(p=>p.id!==editing);if(!next.deletedIds.includes(editing))next.deletedIds.push(editing);await publishState(next,null,editing,'Remove shop product: '+p.name);newProduct(true);}catch(e){status(e.message,'error');}finally{lock(false);}});
$('disconnect').addEventListener('click',()=>{if(busy||!canLeave())return;key='';pendingPhoto=null;dirty=false;editing=null;base=[];state={version:1,products:[],deletedIds:[]};$('product-form').reset();setPhoto('');$('product-list').replaceChildren();$('workspace').hidden=true;$('connect-panel').hidden=false;status('Disconnected. Your published products stay on your website.');});
window.addEventListener('beforeunload',event=>{if(dirty||busy){event.preventDefault();event.returnValue='';}});
})();
