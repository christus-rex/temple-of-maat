(function(){
  function tune(root){
    const scope=root||document;
    scope.querySelectorAll('img').forEach((img,i)=>{
      if(!img.hasAttribute('decoding')) img.decoding='async';
      if(!img.closest('.temple-intro-image') && !img.closest('.temple-feature-image') && !img.hasAttribute('loading')) img.loading='lazy';
    });
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>tune(document)); else tune(document);
  const obs=new MutationObserver(muts=>muts.forEach(m=>m.addedNodes.forEach(n=>{if(n.nodeType===1)tune(n);}))); obs.observe(document.documentElement,{childList:true,subtree:true});
})();
