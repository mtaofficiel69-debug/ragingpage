/* =====================================================================
   RAGING DRAW — STOCKAGE
   Tout reste dans le navigateur (IndexedDB : les images y tiennent sans
   la limite de 5 Mo du localStorage). Si IndexedDB est indisponible
   (navigation privée stricte…), on garde tout en mémoire et on prévient.
===================================================================== */
const DB_NAME = 'ragingdraw', DB_VER = 1;
let _db = null, _dbFailed = false;
const _mem = { docs:{}, meta:{} };

function dbOpen(){
  if(_db || _dbFailed) return Promise.resolve(_db);
  return new Promise(resolve => {
    let req;
    try{ req = indexedDB.open(DB_NAME, DB_VER); }catch(e){ _dbFailed = true; return resolve(null); }
    req.onupgradeneeded = () => {
      const db = req.result;
      if(!db.objectStoreNames.contains('docs')) db.createObjectStore('docs', {keyPath:'id'});
      if(!db.objectStoreNames.contains('meta')) db.createObjectStore('meta', {keyPath:'id'});
    };
    req.onsuccess = () => { _db = req.result; resolve(_db); };
    req.onerror = () => { _dbFailed = true; resolve(null); };
    req.onblocked = () => { _dbFailed = true; resolve(null); };
  });
}
function _tx(store, mode, fn){
  return dbOpen().then(db => new Promise((resolve, reject) => {
    if(!db){ resolve(fn(null)); return; }
    let out;
    const tx = db.transaction(store, mode);
    const st = tx.objectStore(store);
    const r = fn(st);
    if(r && 'onsuccess' in r){ r.onsuccess = () => { out = r.result; }; }
    tx.oncomplete = () => resolve(out);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  }));
}
const Store = {
  available(){ return !_dbFailed; },
  listMeta(){
    return _tx('meta', 'readonly', st => st ? st.getAll() : null).then(r => r || Object.values(_mem.meta));
  },
  getDoc(id){
    return _tx('docs', 'readonly', st => st ? st.get(id) : null).then(r => r || _mem.docs[id] || null);
  },
  putDoc(doc, meta){
    if(_dbFailed || !_db){ _mem.docs[doc.id] = deepClone(doc); _mem.meta[meta.id] = meta; }
    return _tx('docs', 'readwrite', st => st ? st.put(doc) : null)
      .then(() => _tx('meta', 'readwrite', st => st ? st.put(meta) : null));
  },
  remove(id){
    delete _mem.docs[id]; delete _mem.meta[id];
    return _tx('docs', 'readwrite', st => st ? st.delete(id) : null)
      .then(() => _tx('meta', 'readwrite', st => st ? st.delete(id) : null));
  }
};
