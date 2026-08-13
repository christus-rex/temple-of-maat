(function(){
  function memoryStorage(){
    const data=Object.create(null);
    return {getItem(k){return Object.prototype.hasOwnProperty.call(data,k)?data[k]:null;},setItem(k,v){data[k]=String(v);},removeItem(k){delete data[k];},clear(){for(const k in data)delete data[k];},key(i){return Object.keys(data)[i]||null;},get length(){return Object.keys(data).length;}};
  }
  function safeStorage(name){
    try{
      const s=window[name];
      const key='__temple_probe__';
      s.setItem(key,'1'); s.removeItem(key);
      return s;
    }catch(e){ return memoryStorage(); }
  }
  window.__templeLocal=safeStorage('localStorage');
  window.__templeSession=safeStorage('sessionStorage');
})();
