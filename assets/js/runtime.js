/* Runtime block 1 */
(function(){function m(a){var h=a.getAttribute("href");if(!h)return;try{var u=new URL(h,document.baseURI);if((u.protocol==="http:"||u.protocol==="https:")&&u.host!==location.host){a.target="_blank";a.rel="noopener noreferrer";}}catch(e){}}function s(){document.querySelectorAll("a[href]").forEach(m);}if(document.readyState!=="loading"){s();}else{document.addEventListener("DOMContentLoaded",s);}document.addEventListener("click",function(e){var a=e.target&&e.target.closest&&e.target.closest("a[href]");if(a){m(a);}},true);})();

/* Runtime block 2 */
(function(){
  const HERO_META = {"01": {"third": "Bifruiah", "angel": "Vehuiah", "daemon": "Bifrons", "office": "Keeper of Remembered Beginnings", "fire": "1", "pillar": "Jachin", "law": "INITIATE WITHOUT ERASURE", "fireName": "Fire of Remembering", "fireColor": "#2563eb", "pillarColor": "#2563eb"}, "02": {"third": "Orialiel", "angel": "Jeliel", "daemon": "Orias", "office": "Steward of Concordant Authority", "fire": "2", "pillar": "Middle", "law": "AUTHORITY SERVES HARMONY", "fireName": "Fire of Concord", "fireColor": "#40e0d0", "pillarColor": "#40e0d0"}, "03": {"third": "Andritael", "angel": "Sitael", "daemon": "Andras", "office": "Warden of Necessary Endings", "fire": "3", "pillar": "Boaz", "law": "END WHAT DEVOURS LIFE", "fireName": "Fire of Severance", "fireColor": "#ef4444", "pillarColor": "#10b981"}, "04": {"third": "Berelmiah", "angel": "Elemiah", "daemon": "Berith", "office": "Keeper of Revalued Direction", "fire": "4", "pillar": "Jachin", "law": "POWER BOWS TO RIGHT ORDER", "fireName": "Fire of Healing", "fireColor": "#10b981", "pillarColor": "#2563eb"}, "05": {"third": "Gamiasiah", "angel": "Mahasiah", "daemon": "Gamigin", "office": "Curator of Healing Memory", "fire": "4", "pillar": "Jachin", "law": "MEMORY HEALS WHEN WITNESSED", "fireName": "Fire of Healing", "fireColor": "#10b981", "pillarColor": "#2563eb"}, "06": {"third": "Vapulahel", "angel": "Lelahel", "daemon": "Vapula", "office": "Artificer of Beneficent Craft", "fire": "5", "pillar": "Middle", "law": "CRAFT WITHOUT DOMINION", "fireName": "Fire of Craft", "fireColor": "#d4af37", "pillarColor": "#40e0d0"}, "07": {"third": "Allochiah", "angel": "Achaiah", "daemon": "Alloces", "office": "Keeper of Patient Understanding", "fire": "2", "pillar": "Jachin", "law": "UNDERSTAND BEFORE NAMING", "fireName": "Fire of Concord", "fireColor": "#40e0d0", "pillarColor": "#2563eb"}, "08": {"third": "Bathietel", "angel": "Cahetel", "daemon": "Bathin", "office": "Blesser of Sacred Work", "fire": "5", "pillar": "Middle", "law": "WORK AS OFFERING", "fireName": "Fire of Craft", "fireColor": "#d4af37", "pillarColor": "#40e0d0"}, "09": {"third": "Belehaziel", "angel": "Haziel", "daemon": "Beleth", "office": "Sovereign of Merciful Intensity", "fire": "6", "pillar": "Boaz", "law": "INTENSITY TEMPERED BY MERCY", "fireName": "Fire of Depth", "fireColor": "#7c3aed", "pillarColor": "#10b981"}, "10": {"third": "Bathiadiah", "angel": "Aladiah", "daemon": "Bathin", "office": "Restorer of Second Paths", "fire": "7", "pillar": "Middle", "law": "SECOND PATH IS NOT FAILURE", "fireName": "Fire of Return", "fireColor": "#f5f1e8", "pillarColor": "#40e0d0"}, "11": {"third": "Valelauviah", "angel": "Lauviah", "daemon": "Valefar", "office": "Guide of Cunning to Wisdom", "fire": "7", "pillar": "Middle", "law": "", "fireName": "Fire of Return", "fireColor": "#f5f1e8", "pillarColor": "#40e0d0"}, "12": {"third": "Dantahaiah", "angel": "Hahaiah", "daemon": "Dantalion", "office": "Sanctuary of True Thoughts", "fire": "6", "pillar": "Boaz", "law": "THOUGHT WITHOUT ENSLAVEMENT", "fireName": "Fire of Depth", "fireColor": "#7c3aed", "pillarColor": "#10b981"}, "13": {"third": "Focazalel", "angel": "Iezalel", "daemon": "Focalor", "office": "Keeper of Deep Covenants", "fire": "6", "pillar": "Boaz", "law": "", "fireName": "Fire of Depth", "fireColor": "#7c3aed", "pillarColor": "#10b981"}, "14": {"third": "Vapubahel", "angel": "Mebahel", "daemon": "Vapula", "office": "Liberator Through Truthful Craft", "fire": "5", "pillar": "Middle", "law": "TRUTH LIBERATES CRAFT", "fireName": "Fire of Craft", "fireColor": "#d4af37", "pillarColor": "#40e0d0"}, "15": {"third": "Berihariel", "angel": "Hariel", "daemon": "Berith", "office": "Purifier of Worth", "fire": "4", "pillar": "Jachin", "law": "WORTH BEYOND PRICE", "fireName": "Fire of Healing", "fireColor": "#10b981", "pillarColor": "#2563eb"}, "16": {"third": "Haagakamiah", "angel": "Hekamiah", "daemon": "Haagenti", "office": "Noble Transmuter", "fire": "3", "pillar": "Middle", "law": "TRANSMUTE WITHOUT DENIAL", "fireName": "Fire of Severance", "fireColor": "#ef4444", "pillarColor": "#40e0d0"}, "17": {"third": "Valelauviah II", "angel": "Lauviah II", "daemon": "Valefar", "office": "Recurrence Doorway", "fire": "7", "pillar": "Middle", "law": "", "fireName": "Fire of Return", "fireColor": "#f5f1e8", "pillarColor": "#40e0d0"}, "18": {"third": "Agacaliel", "angel": "Caliel", "daemon": "Agares", "office": "Swift Justice", "fire": "3", "pillar": "Boaz", "law": "JUSTICE WITHOUT VENGEANCE", "fireName": "Fire of Severance", "fireColor": "#ef4444", "pillarColor": "#10b981"}, "19": {"third": "Asmoleuviah", "angel": "Leuviah", "daemon": "Asmoday", "office": "Keeper of Expansive Craft", "fire": "5", "pillar": "Middle", "law": "EXPAND WITHOUT CONSUMING", "fireName": "Fire of Craft", "fireColor": "#d4af37", "pillarColor": "#40e0d0"}, "20": {"third": "Haagpahaliah", "angel": "Pahaliah", "daemon": "Haagenti", "office": "Redeemer of Sacred Purpose", "fire": "1", "pillar": "Jachin", "law": "PURPOSE REDEEMED", "fireName": "Fire of Remembering", "fireColor": "#2563eb", "pillarColor": "#2563eb"}, "21": {"third": "Paimelkhael", "angel": "Nelkhael", "daemon": "Paimon", "office": "Teacher of Unyielding Learning", "fire": "1", "pillar": "Jachin", "law": "LEARNING AS DEVOTION", "fireName": "Fire of Remembering", "fireColor": "#2563eb", "pillarColor": "#2563eb"}, "22": {"third": "Vapuyeiayel", "angel": "Yeiayel", "daemon": "Vapula", "office": "Crafter of Right Renown", "fire": "5", "pillar": "Middle", "law": "RENOWN WITHOUT INFLATION", "fireName": "Fire of Craft", "fireColor": "#d4af37", "pillarColor": "#40e0d0"}, "23": {"third": "Halmelahel", "angel": "Melahel", "daemon": "Halphas", "office": "Fortified Healer", "fire": "4", "pillar": "Jachin", "law": "HEALING NEEDS BOUNDARY", "fireName": "Fire of Healing", "fireColor": "#10b981", "pillarColor": "#2563eb"}, "24": {"third": "Halhahuiah", "angel": "Hahuiah", "daemon": "Halphas", "office": "Hidden Refuge Fortress", "fire": "4", "pillar": "Jachin", "law": "REFUGE WITHOUT ISOLATION", "fireName": "Fire of Healing", "fireColor": "#10b981", "pillarColor": "#2563eb"}, "25": {"third": "Focanithaiah", "angel": "Nithaiah", "daemon": "Focalor", "office": "Depth Keeper", "fire": "6", "pillar": "Boaz", "law": "DEPTH GUARDS THE LIVING", "fireName": "Fire of Depth", "fireColor": "#7c3aed", "pillarColor": "#10b981"}, "26": {"third": "Vapuhaaiah", "angel": "Haaiah", "daemon": "Vapula", "office": "Artisan of Just Governance", "fire": "5", "pillar": "Middle", "law": "GOVERNANCE AS CRAFT", "fireName": "Fire of Craft", "fireColor": "#d4af37", "pillarColor": "#40e0d0"}, "27": {"third": "Alloyerathel", "angel": "Yerathel", "daemon": "Alloces", "office": "Sower of Light", "fire": "1", "pillar": "Jachin", "law": "LIGHT SOWN, NOT IMPOSED", "fireName": "Fire of Remembering", "fireColor": "#2563eb", "pillarColor": "#2563eb"}, "28": {"third": "Vapuseheiah", "angel": "Seheiah", "daemon": "Vapula", "office": "Weaver of Longevity", "fire": "5", "pillar": "Middle", "law": "LONGEVITY THROUGH BALANCE", "fireName": "Fire of Craft", "fireColor": "#d4af37", "pillarColor": "#40e0d0"}, "29": {"third": "Gremoreyiel", "angel": "Reyiel", "daemon": "Gremory", "office": "Liberator of Treasure", "fire": "3", "pillar": "Boaz", "law": "TREASURE FREED, NOT HOARDED", "fireName": "Fire of Severance", "fireColor": "#ef4444", "pillarColor": "#10b981"}, "30": {"third": "Buromael", "angel": "Omael", "daemon": "Buer", "office": "Healer of Gestation", "fire": "4", "pillar": "Jachin", "law": "GESTATION REQUIRES SAFETY", "fireName": "Fire of Healing", "fireColor": "#10b981", "pillarColor": "#2563eb"}, "31": {"third": "Allolecabel", "angel": "Lecabel", "daemon": "Alloces", "office": "Brilliance Tempered", "fire": "2", "pillar": "Middle", "law": "BRILLIANCE SERVES WHOLESOMENESS", "fireName": "Fire of Concord", "fireColor": "#40e0d0", "pillarColor": "#40e0d0"}, "32": {"third": "Focavasariah", "angel": "Vasariah", "daemon": "Focalor", "office": "Clemency in Depths", "fire": "6", "pillar": "Boaz", "law": "CLEMENCY EVEN IN ABYSS", "fireName": "Fire of Depth", "fireColor": "#7c3aed", "pillarColor": "#10b981"}, "33": {"third": "Paiyehuiah", "angel": "Yehuiah", "daemon": "Paimon", "office": "Right Order Voice", "fire": "2", "pillar": "Middle", "law": "VOICE ALIGNS ORDER", "fireName": "Fire of Concord", "fireColor": "#40e0d0", "pillarColor": "#40e0d0"}, "34": {"third": "Marcholehahiah", "angel": "Lehahiah", "daemon": "Marchosias", "office": "Disciplined Courage", "fire": "3", "pillar": "Boaz", "law": "COURAGE WITH DISCIPLINE", "fireName": "Fire of Severance", "fireColor": "#ef4444", "pillarColor": "#10b981"}, "35": {"third": "Glasyavakiah", "angel": "Chavakiah", "daemon": "Glasya Labolas", "office": "Reconciler After Bloodshed", "fire": "2", "pillar": "Middle", "law": "AFTER BLOOD, RECONCILE", "fireName": "Fire of Concord", "fireColor": "#40e0d0", "pillarColor": "#40e0d0"}, "36": {"third": "Bathimenadel", "angel": "Menadel", "daemon": "Bathin", "office": "Pilgrim of Sacred Labor", "fire": "5", "pillar": "Middle", "law": "LABOR AS PILGRIMAGE", "fireName": "Fire of Craft", "fireColor": "#d4af37", "pillarColor": "#40e0d0"}, "37": {"third": "Camianiel", "angel": "Aniel", "daemon": "Camio", "office": "Keeper of Living Signal", "fire": "1", "pillar": "Jachin", "law": "", "fireName": "Fire of Remembering", "fireColor": "#2563eb", "pillarColor": "#2563eb"}, "38": {"third": "Belhaamiah", "angel": "Haamiah", "daemon": "Belial", "office": "Sovereign Ritual", "fire": "6", "pillar": "Boaz", "law": "RITUAL WITHOUT COERCION", "fireName": "Fire of Depth", "fireColor": "#7c3aed", "pillarColor": "#10b981"}, "39": {"third": "Gusorehael", "angel": "Rehael", "daemon": "Gusoin", "office": "Healer of Lineage", "fire": "4", "pillar": "Jachin", "law": "LINEAGE HEALED FORWARD", "fireName": "Fire of Healing", "fireColor": "#10b981", "pillarColor": "#2563eb"}, "40": {"third": "Bifroyeiazel", "angel": "Yeiazel", "daemon": "Bifrons", "office": "Consoler at Threshold", "fire": "7", "pillar": "Middle", "law": "THRESHOLD HELD WITH CARE", "fireName": "Fire of Return", "fireColor": "#f5f1e8", "pillarColor": "#40e0d0"}, "41": {"third": "Belehahahel", "angel": "Hahahel", "daemon": "Beleth", "office": "Mission of Fierce Calling", "fire": "3", "pillar": "Boaz", "law": "FIERCENESS IN SERVICE", "fireName": "Fire of Severance", "fireColor": "#ef4444", "pillarColor": "#10b981"}, "42": {"third": "Agamikael", "angel": "Mikael", "daemon": "Agares", "office": "Marshal of Right Movement", "fire": "2", "pillar": "Jachin", "law": "", "fireName": "Fire of Concord", "fireColor": "#40e0d0", "pillarColor": "#2563eb"}, "43": {"third": "Asmoveuliah", "angel": "Veuliah", "daemon": "Asmoday", "office": "Abundance Through Hidden Craft", "fire": "5", "pillar": "Middle", "law": "ABUNDANCE THROUGH SUBTLETY", "fireName": "Fire of Craft", "fireColor": "#d4af37", "pillarColor": "#40e0d0"}, "44": {"third": "Gamiyelahiah", "angel": "Yelahiah", "daemon": "Gamigin", "office": "Karmic Memory Warrior", "fire": "1", "pillar": "Jachin", "law": "KARMA REMEMBERED, NOT REPEATED", "fireName": "Fire of Remembering", "fireColor": "#2563eb", "pillarColor": "#2563eb"}, "45": {"third": "Cimisehaliah", "angel": "Sehaliah", "daemon": "Cimeies", "office": "Purifier Through Rhetoric", "fire": "2", "pillar": "Middle", "law": "RHETORIC PURIFIES, NOT MANIPULATES", "fireName": "Fire of Concord", "fireColor": "#40e0d0", "pillarColor": "#40e0d0"}, "46": {"third": "Hauariel", "angel": "Ariel", "daemon": "Haures", "office": "Revealer Through Fire", "fire": "3", "pillar": "Boaz", "law": "FIRE REVEALS, DOES NOT CONSUME WHOLESOME", "fireName": "Fire of Severance", "fireColor": "#ef4444", "pillarColor": "#10b981"}, "47": {"third": "Agaresaliah", "angel": "Asaliah", "daemon": "Agares", "office": "Contemplative Movement", "fire": "2", "pillar": "Middle", "law": "MOVE CONTEMPLATIVELY", "fireName": "Fire of Concord", "fireColor": "#40e0d0", "pillarColor": "#40e0d0"}, "48": {"third": "Leramihael", "angel": "Mihael", "daemon": "Leraye", "office": "Peaceful Arrow", "fire": "2", "pillar": "Middle", "law": "ARROW WITHOUT WAR", "fireName": "Fire of Concord", "fireColor": "#40e0d0", "pillarColor": "#40e0d0"}, "49": {"third": "Vapuvehuel", "angel": "Vehuel", "daemon": "Vapula", "office": "Elevated Craft", "fire": "5", "pillar": "Middle", "law": "CRAFT ELEVATED, NOT ELEVATING EGO", "fireName": "Fire of Craft", "fireColor": "#d4af37", "pillarColor": "#40e0d0"}, "50": {"third": "Bathidaniel", "angel": "Daniel", "daemon": "Bathin", "office": "Eloquent Traveler", "fire": "5", "pillar": "Middle", "law": "TRAVEL WITH ELOQUENCE", "fireName": "Fire of Craft", "fireColor": "#d4af37", "pillarColor": "#40e0d0"}, "51": {"third": "Glasyahasiah", "angel": "Hahasiah", "daemon": "Glasya Labolas", "office": "Alchemist of Hidden Mysteries", "fire": "6", "pillar": "Boaz", "law": "MYSTERY KEPT, NOT WITHHELD", "fireName": "Fire of Depth", "fireColor": "#7c3aed", "pillarColor": "#10b981"}, "52": {"third": "Cimimamiah", "angel": "Imamiah", "daemon": "Cimeies", "office": "Atonement Through Logic", "fire": "2", "pillar": "Middle", "law": "LOGIC ATONES", "fireName": "Fire of Concord", "fireColor": "#40e0d0", "pillarColor": "#40e0d0"}, "53": {"third": "Botinanael", "angel": "Nanael", "daemon": "Botis", "office": "Reconciler of Friends and Foes", "fire": "2", "pillar": "Middle", "law": "RECONCILE WITHOUT FALSE PEACE", "fireName": "Fire of Concord", "fireColor": "#40e0d0", "pillarColor": "#40e0d0"}, "54": {"third": "Procnithael", "angel": "Nithael", "daemon": "Procel", "office": "Youthful Storm Keeper", "fire": "6", "pillar": "Boaz", "law": "STORM KEPT YOUNG, NOT SUPPRESSED", "fireName": "Fire of Depth", "fireColor": "#7c3aed", "pillarColor": "#10b981"}, "55": {"third": "Haagmebahiah", "angel": "Mebahiah", "daemon": "Haagenti", "office": "Lucid Transmuter", "fire": "3", "pillar": "Middle", "law": "LUCID TRANSMUTATION", "fireName": "Fire of Severance", "fireColor": "#ef4444", "pillarColor": "#40e0d0"}, "56": {"third": "Buropoyel", "angel": "Poyel", "daemon": "Buer", "office": "Fortune Through Healing", "fire": "4", "pillar": "Jachin", "law": "FORTUNE FOLLOWS HEALING", "fireName": "Fire of Healing", "fireColor": "#10b981", "pillarColor": "#2563eb"}, "57": {"third": "Glasnemamiah", "angel": "Nemamiah", "daemon": "Glasya Labolas", "office": "Discerner in Battle", "fire": "3", "pillar": "Boaz", "law": "DISCERN IN CONFLICT", "fireName": "Fire of Severance", "fireColor": "#ef4444", "pillarColor": "#10b981"}, "58": {"third": "Procyeialel", "angel": "Yeialel", "daemon": "Procel", "office": "Healer of Mental Storm", "fire": "6", "pillar": "Boaz", "law": "MIND STORM CALMED", "fireName": "Fire of Depth", "fireColor": "#7c3aed", "pillarColor": "#10b981"}, "59": {"third": "Beriharahel", "angel": "Harahel", "daemon": "Berith", "office": "Wealth of Intellect", "fire": "1", "pillar": "Jachin", "law": "INTELLECT WEALTH SHARED", "fireName": "Fire of Remembering", "fireColor": "#2563eb", "pillarColor": "#2563eb"}, "60": {"third": "Murmitzrael", "angel": "Mitzrael", "daemon": "Murmur", "office": "Reparative Music", "fire": "5", "pillar": "Middle", "law": "MUSIC REPAIRS", "fireName": "Fire of Craft", "fireColor": "#d4af37", "pillarColor": "#40e0d0"}, "61": {"third": "Marbumabel", "angel": "Umabel", "daemon": "Marbas", "office": "Friend of Hidden Mechanisms", "fire": "5", "pillar": "Middle", "law": "MECHANISM FRIEND, NOT MASTER", "fireName": "Fire of Craft", "fireColor": "#d4af37", "pillarColor": "#40e0d0"}, "62": {"third": "Fociahhel", "angel": "Iahhel", "daemon": "Focalor", "office": "Seeker in Depths", "fire": "6", "pillar": "Boaz", "law": "SEEK WITHOUT DROWNING", "fireName": "Fire of Depth", "fireColor": "#7c3aed", "pillarColor": "#10b981"}, "63": {"third": "Marbanauel", "angel": "Anauel", "daemon": "Marbas", "office": "Connector of Unity", "fire": "2", "pillar": "Middle", "law": "UNITY THROUGH CONNECTION", "fireName": "Fire of Concord", "fireColor": "#40e0d0", "pillarColor": "#40e0d0"}, "64": {"third": "Belemehiel", "angel": "Mehiel", "daemon": "Beleth", "office": "Vivifier of Intense Love", "fire": "3", "pillar": "Boaz", "law": "LOVE INTENSE, NOT POSSESSIVE", "fireName": "Fire of Severance", "fireColor": "#ef4444", "pillarColor": "#10b981"}, "65": {"third": "Astadamabiah", "angel": "Damabiah", "daemon": "Astaroth", "office": "Treasurer of Sea Wisdom", "fire": "6", "pillar": "Boaz", "law": "SEA WISDOM TREASURED", "fireName": "Fire of Depth", "fireColor": "#7c3aed", "pillarColor": "#10b981"}, "66": {"third": "Andramanakel", "angel": "Manakel", "daemon": "Andras", "office": "Healer of Necessary Severance", "fire": "3", "pillar": "Boaz", "law": "SEVER TO HEAL", "fireName": "Fire of Severance", "fireColor": "#ef4444", "pillarColor": "#10b981"}, "67": {"third": "Andraeyael", "angel": "Eyael", "daemon": "Andras", "office": "Alchemist of Ending", "fire": "3", "pillar": "Boaz", "law": "ENDING AS ALCHEMY", "fireName": "Fire of Severance", "fireColor": "#ef4444", "pillarColor": "#10b981"}, "68": {"third": "Allohabuhiah", "angel": "Habuhiah", "daemon": "Alloces", "office": "Preserver Through Expertise", "fire": "4", "pillar": "Jachin", "law": "EXPERTISE PRESERVES LIFE", "fireName": "Fire of Healing", "fireColor": "#10b981", "pillarColor": "#2563eb"}, "69": {"third": "Belerochel", "angel": "Rochel", "daemon": "Beleth", "office": "Restitution Through Intensity", "fire": "3", "pillar": "Boaz", "law": "RESTITUTION THROUGH FIERCE TRUTH", "fireName": "Fire of Severance", "fireColor": "#ef4444", "pillarColor": "#10b981"}, "70": {"third": "Dantajabamiah", "angel": "Jabamiah", "daemon": "Dantalion", "office": "Alchemist of Thoughts", "fire": "6", "pillar": "Boaz", "law": "THOUGHT ALCHEMIZED", "fireName": "Fire of Depth", "fireColor": "#7c3aed", "pillarColor": "#10b981"}, "71": {"third": "Cimihaiaiel", "angel": "Haiaiel", "daemon": "Cimeies", "office": "Divine Warrior of Rhetoric", "fire": "2", "pillar": "Middle", "law": "WARRIOR OF RIGHT SPEECH", "fireName": "Fire of Concord", "fireColor": "#40e0d0", "pillarColor": "#40e0d0"}, "72": {"third": "Halmumiah", "angel": "Mumiah", "daemon": "Halphas", "office": "Final Fortress of Rebirth", "fire": "7", "pillar": "Middle", "law": "REBIRTH FORTIFIED", "fireName": "Fire of Return", "fireColor": "#f5f1e8", "pillarColor": "#40e0d0"}};
  const FIRE_FALLBACK = '#d4af37';

  function esc(s){
    return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  function hashString(str){
    let h=2166136261>>>0;
    for(let i=0;i<str.length;i++){ h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h>>>0;
  }
  function rngFactory(seed){
    let s = seed>>>0 || 1;
    return function(){ s ^= s << 13; s >>>= 0; s ^= s >>> 17; s >>>= 0; s ^= s << 5; s >>>= 0; return (s>>>0) / 4294967296; };
  }
  function polar(cx, cy, r, a){
    const rad = (a-90) * Math.PI/180;
    return [cx + r*Math.cos(rad), cy + r*Math.sin(rad)];
  }
  function polygonPoints(cx, cy, r, sides, rotation){
    let pts=[];
    for(let i=0;i<sides;i++){
      const a=rotation+i*(360/sides);
      const p=polar(cx,cy,r,a);
      pts.push(p[0].toFixed(2)+','+p[1].toFixed(2));
    }
    return pts.join(' ');
  }
  function sigilPath(seedText, cx, cy, innerR){
    const rand = rngFactory(hashString(seedText));
    const count = 9 + Math.floor(rand()*6);
    let pts=[]; let ang = rand()*360;
    for(let i=0;i<count;i++){
      ang += 25 + rand()*65;
      pts.push(polar(cx, cy, innerR*(0.22 + rand()*0.8), ang));
    }
    let d='';
    pts.forEach((p,idx)=>{
      if(idx===0) d += 'M '+p[0].toFixed(2)+' '+p[1].toFixed(2)+' ';
      else {
        const prev=pts[idx-1];
        const c1x=((prev[0]*2+p[0])/3).toFixed(2), c1y=((prev[1]*2+p[1])/3).toFixed(2);
        const c2x=((prev[0]+p[0]*2)/3).toFixed(2), c2y=((prev[1]+p[1]*2)/3).toFixed(2);
        d += 'C '+c1x+' '+c1y+' '+c2x+' '+c2y+' '+p[0].toFixed(2)+' '+p[1].toFixed(2)+' ';
        if(rand() > 0.66) d += 'm -3 0 l 6 0 m -3 -3 l 0 6 ';
      }
    });
    if(pts.length > 4 && Math.hypot(pts[pts.length-1][0]-pts[0][0], pts[pts.length-1][1]-pts[0][1]) < innerR*0.85) d += 'Z';
    return d;
  }
  function buildEgyptoSolomonicSealSVG(label, num, meta, size){
    const seed = hashString(label + '|' + num + '|' + (meta.fireName || ''));
    const rand = rngFactory(seed);
    const dim = size || 180, cx = dim/2, cy = dim/2;
    const outer = dim*0.36, middle = dim*0.28, inner = dim*0.18;
    const fireColor = meta.fireColor || FIRE_FALLBACK;
    const pillarColor = meta.pillarColor || '#40e0d0';
    const ink = '#2f2417', parchment = '#f5ead0', parchment2 = '#e8d7b2', redInk = '#8c3a2b';
    const uid = 'egsseal'+seed.toString(16)+dim;
    const glyphs = ['𓂀','𓆣','𓇯','𓋹','𓅓','𓏏','𓎛','𓆃'];
    let orbit = '';
    for(let i=0;i<8;i++){
      const p=polar(cx,cy,outer*1.18,i*45 + rand()*20);
      orbit += `<text x="${p[0].toFixed(2)}" y="${(p[1]+4).toFixed(2)}" text-anchor="middle" font-size="${Math.max(10,dim*0.06).toFixed(1)}" fill="${i%2===0?fireColor:pillarColor}" opacity="0.9">${glyphs[i%glyphs.length]}</text>`;
    }
    let rays='';
    for(let i=0;i<12;i++){
      const p1=polar(cx,cy,inner*1.05,i*30), p2=polar(cx,cy,middle*1.08,i*30);
      rays += `<line x1="${p1[0].toFixed(2)}" y1="${p1[1].toFixed(2)}" x2="${p2[0].toFixed(2)}" y2="${p2[1].toFixed(2)}" stroke="${pillarColor}" stroke-width="0.9" opacity="0.45"/>`;
    }
    let petals='';
    for(let i=0;i<8;i++){
      const p=polar(cx,cy,outer*0.72,i*45);
      petals += `<ellipse cx="${p[0].toFixed(2)}" cy="${p[1].toFixed(2)}" rx="${(dim*0.032).toFixed(2)}" ry="${(dim*0.08).toFixed(2)}" transform="rotate(${i*45} ${p[0].toFixed(2)} ${p[1].toFixed(2)})" fill="none" stroke="${fireColor}" stroke-width="0.9" opacity="0.62"/>`;
    }
    const ringText = `${String(num).padStart(2,'0')} • ${(label||'SEAL').toUpperCase().replace(/[^A-Z0-9 ]/g,'').slice(0,22)} •`;
    return `
    <svg viewBox="0 0 ${dim} ${dim}" width="${dim}" height="${dim}" class="egsol-seal-svg" aria-label="Seal of ${esc(label)}">
      <defs>
        <radialGradient id="g${uid}" cx="50%" cy="42%" r="62%"><stop offset="0%" stop-color="${parchment}"/><stop offset="100%" stop-color="${parchment2}"/></radialGradient>
        <path id="${uid}" d="M ${cx} ${cy} m -${(outer*1.07).toFixed(2)},0 a ${(outer*1.07).toFixed(2)},${(outer*1.07).toFixed(2)} 0 1,1 ${(outer*2.14).toFixed(2)},0 a ${(outer*1.07).toFixed(2)},${(outer*1.07).toFixed(2)} 0 1,1 -${(outer*2.14).toFixed(2)},0" />
      </defs>
      <rect x="4" y="4" width="${dim-8}" height="${dim-8}" rx="16" fill="url(#g${uid})" stroke="${pillarColor}" stroke-width="1.35"/>
      <rect x="10" y="10" width="${dim-20}" height="${dim-20}" rx="12" fill="none" stroke="${redInk}" stroke-width="0.8" opacity="0.45"/>
      <path d="M ${cx-outer*1.2} ${cy-outer*1.22} q 18 -10 36 0 M ${cx+outer*1.2} ${cy-outer*1.22} q -18 -10 -36 0 M ${cx-outer*0.34} ${cy-outer*1.28} q ${outer*0.34} -${outer*0.18} ${outer*0.68} 0" fill="none" stroke="${fireColor}" stroke-width="1.3" opacity="0.85"/>
      <circle cx="${cx}" cy="${cy-outer*1.18}" r="${(dim*0.038).toFixed(2)}" fill="none" stroke="${fireColor}" stroke-width="1.25"/>
      <circle cx="${cx}" cy="${cy-outer*1.18}" r="${(dim*0.01).toFixed(2)}" fill="${fireColor}"/>
      ${orbit}
      <circle cx="${cx}" cy="${cy}" r="${outer.toFixed(2)}" fill="none" stroke="${ink}" stroke-width="1.7"/>
      <circle cx="${cx}" cy="${cy}" r="${(outer*0.89).toFixed(2)}" fill="none" stroke="${pillarColor}" stroke-width="1" stroke-dasharray="2.4 3.2" opacity="0.88"/>
      <circle cx="${cx}" cy="${cy}" r="${middle.toFixed(2)}" fill="none" stroke="${ink}" stroke-width="1.1"/>
      ${petals}
      <polygon points="${polygonPoints(cx,cy,middle*0.96,[5,6,7,8][Math.floor(rand()*4)],rand()*360)}" fill="none" stroke="${fireColor}" stroke-width="1.05" opacity="0.7"/>
      <polygon points="${polygonPoints(cx,cy,inner*1.18,[3,4,5,6][Math.floor(rand()*4)],rand()*360)}" fill="none" stroke="${pillarColor}" stroke-width="1.05" opacity="0.7"/>
      ${rays}
      <path d="${sigilPath(label+'-'+num,cx,cy,inner)}" fill="none" stroke="${ink}" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M ${cx} ${cy+outer*0.82} l 0 ${dim*0.08} m -${dim*0.025} -${dim*0.045} l ${dim*0.05} 0 m -${dim*0.025} -${dim*0.04} a ${dim*0.025} ${dim*0.025} 0 1 1 0.1 0" fill="none" stroke="${redInk}" stroke-width="1.2" opacity="0.88"/>
      <text font-size="${Math.max(7,dim*0.04).toFixed(1)}" fill="${ink}" letter-spacing="1.6" opacity="0.95"><textPath href="#${uid}" startOffset="50%" text-anchor="middle">${ringText}</textPath></text>
    </svg>`;
  }

  function removeOldSeals(root){
    (root||document).querySelectorAll('.solomonic-seal-panel,.solomonic-seal-feature,.solomonic-seal-overlay').forEach(el => el.remove());
  }
  function getCardByNum(num){
    return Array.from(document.querySelectorAll('.masonry-item')).find(card => {
      const badge = card.querySelector('.absolute.top-3.left-3');
      const found = ((badge?.textContent || card.textContent || '').match(/\d+/) || [''])[0];
      return String(found).padStart(2,'0') === String(num).padStart(2,'0');
    });
  }
  function getCardInfo(card){
    const badge = card.querySelector('.absolute.top-3.left-3');
    const num = String((((badge?.textContent || card.textContent || '').match(/\d+/) || [''])[0] || '')).padStart(2,'0');
    const body = card.querySelector('.p-4');
    const img = card.querySelector('img');
    const cinzels = Array.from(body.querySelectorAll('.font-cinzel')).map(el => el.textContent.trim()).filter(Boolean);
    const name = cinzels[0] || (HERO_META[num]?.third) || ('Chamber '+num);
    const pairing = cinzels[1] || ((HERO_META[num]?.angel || '') + ' ↔ ' + (HERO_META[num]?.daemon || ''));
    const office = body.querySelector('.italic')?.textContent?.trim() || HERO_META[num]?.office || '';
    const lawTag = Array.from(body.querySelectorAll('span')).map(el => (el.textContent||'').trim()).find(t => t && t.length > 8 && !/^RECURRENCE|TETRAD/.test(t)) || HERO_META[num]?.law || '';
    const meta = Object.assign({}, HERO_META[num] || {});
    return { num, name, pairing, office, law: lawTag, imgSrc: img?.src || '', meta };
  }
  function buildDownloadButton(label){
    const btn = document.createElement('button');
    btn.className = 'egsol-download-btn';
    btn.type = 'button';
    btn.textContent = label || 'Download Collectable';
    return btn;
  }
  function buildSealSection(info, compact){
    const wrap = document.createElement('div');
    wrap.className = compact ? 'egsol-seal-block compact' : 'egsol-seal-block';
    wrap.innerHTML = `
      <div class="egsol-seal-kicker">EGYPTO-SOLOMONIC SEAL</div>
      <div class="egsol-seal-inner">
        <div class="egsol-seal-art">${buildEgyptoSolomonicSealSVG(info.name, info.num, info.meta || {}, compact ? 108 : 180)}</div>
        <div class="egsol-seal-copy">
          <div class="egsol-seal-title">Seal of ${esc(info.name)}</div>
          <div class="egsol-seal-meta"><span>Pillar:</span> ${esc(info.meta?.pillar || '—')} &nbsp;•&nbsp; <span>Fire:</span> ${esc(info.meta?.fireName || '—')}</div>
          <div class="egsol-seal-desc">Separate ritual seal plate — Egypto-Solomonic in style, tuned to Chamber ${esc(info.num)}.</div>
        </div>
      </div>`;
    return wrap;
  }
  function buildCollectibleSVG(info){
    const w = 900, h = 1400;
    const fire = info.meta?.fireColor || FIRE_FALLBACK;
    const pillar = info.meta?.pillarColor || '#40e0d0';
    const imgHref = esc(info.imgSrc || '');
    const title = esc(info.name || ('Chamber '+info.num));
    const pairing = esc(info.pairing || '');
    const office = esc(info.office || '');
    const law = esc(info.law || info.meta?.law || '');
    const fireName = esc(info.meta?.fireName || '');
    const pillarName = esc(info.meta?.pillar || '');
    const seal = buildEgyptoSolomonicSealSVG(info.name, info.num, info.meta || {}, 250);
    return `<?xml version="1.0" encoding="UTF-8"?>
    <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#f5ead0"/><stop offset="100%" stop-color="#e6d6b3"/></linearGradient>
        <linearGradient id="plate" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#fff8eb"/><stop offset="100%" stop-color="#efe0bb"/></linearGradient>
        <clipPath id="heroClip"><rect x="90" y="190" width="720" height="500" rx="26" ry="26"/></clipPath>
      </defs>
      <rect width="${w}" height="${h}" fill="url(#bg)"/>
      <rect x="28" y="28" width="${w-56}" height="${h-56}" rx="34" fill="none" stroke="${pillar}" stroke-width="4"/>
      <rect x="42" y="42" width="${w-84}" height="${h-84}" rx="28" fill="none" stroke="#8c3a2b" stroke-width="2" opacity="0.55"/>
      <text x="${w/2}" y="88" text-anchor="middle" font-family="Cinzel,serif" font-size="34" fill="#6d5421">TEMPLE OF MA'AT</text>
      <text x="${w/2}" y="126" text-anchor="middle" font-family="monospace" font-size="18" letter-spacing="3" fill="${pillar}">COLLECTABLE CHAMBER PLATE</text>
      <g>
        <rect x="90" y="190" width="720" height="500" rx="26" fill="#0f1d24"/>
        <image x="90" y="190" width="720" height="500" preserveAspectRatio="xMidYMid slice" clip-path="url(#heroClip)" href="${imgHref}" xlink:href="${imgHref}"/>
        <rect x="90" y="610" width="720" height="80" fill="rgba(7,13,18,0.72)"/>
        <text x="122" y="655" font-family="Cinzel,serif" font-size="22" fill="#fefcf7">CHAMBER ${esc(info.num)} • ${title}</text>
      </g>
      <rect x="90" y="730" width="720" height="280" rx="26" fill="url(#plate)" stroke="#cfb47b" stroke-width="2"/>
      <g transform="translate(120 760)">${seal.replace(/^<svg[^>]*>|<\/svg>$/g,'')}</g>
      <text x="408" y="790" font-family="Cinzel,serif" font-size="26" fill="#6d5421">Seal of ${title}</text>
      <text x="408" y="826" font-family="monospace" font-size="16" fill="#4d473b">${pairing}</text>
      <text x="408" y="870" font-family="monospace" font-size="15" fill="#4d473b">PILLAR: ${pillarName}   •   FIRE: ${fireName}</text>
      <rect x="90" y="1045" width="720" height="245" rx="26" fill="#fff7e4" stroke="#cfb47b" stroke-width="2"/>
      <text x="118" y="1090" font-family="monospace" font-size="18" fill="${pillar}">OFFICE</text>
      <text x="118" y="1120" font-family="monospace" font-size="18" fill="#2f2417">${office}</text>
      <text x="118" y="1170" font-family="monospace" font-size="18" fill="${fire}">LAW</text>
      <foreignObject x="118" y="1184" width="660" height="70"><div xmlns="http://www.w3.org/1999/xhtml" style="font-family:monospace;font-size:18px;color:#2f2417;line-height:1.3;">${law}</div></foreignObject>
      <text x="${w/2}" y="1335" text-anchor="middle" font-family="monospace" font-size="15" fill="#5c5548">Egypto-Solomonic Chamber Collectable • Temple of Ma'at</text>
    </svg>`;
  }
  function triggerDownload(filename, content){
    const blob = new Blob([content], {type:'image/svg+xml;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  function safeFilePart(value){
    return String(value || 'item').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'') || 'item';
  }
  function setButtonBusy(btn, busy, label){
    if(!btn) return;
    if(busy){
      if(!btn.dataset.originalLabel) btn.dataset.originalLabel = btn.textContent;
      btn.disabled = true;
      btn.textContent = label || 'Preparing…';
    }else{
      btn.disabled = false;
      btn.textContent = btn.dataset.originalLabel || btn.textContent;
    }
  }
  function saveBlob(blob, filename){
    if(!blob) throw new Error('No downloadable file was generated.');
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.rel = 'noopener';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    a.remove();

    // Mobile/WebView fallback: keep a real user-tappable download link alive.
    let fallback = document.getElementById('temple-download-fallback');
    if(!fallback){
      fallback = document.createElement('a');
      fallback.id = 'temple-download-fallback';
      fallback.style.cssText = 'position:fixed;left:12px;right:12px;bottom:max(12px,env(safe-area-inset-bottom));z-index:99999;padding:12px 16px;border-radius:999px;background:#d4af37;color:#071015;font:700 12px ui-monospace,monospace;text-align:center;text-decoration:none;box-shadow:0 8px 26px rgba(0,0,0,.35);';
      document.body.appendChild(fallback);
    }
    fallback.href = url;
    fallback.download = filename;
    fallback.textContent = '⬇ File ready — tap here to save if automatic download was blocked';
    fallback.style.display = 'block';
    clearTimeout(window.__templeDownloadFallbackTimer);
    window.__templeDownloadFallbackTimer = setTimeout(() => {
      fallback.style.display = 'none';
      URL.revokeObjectURL(url);
    }, 45000);
  }
  function makeTransparentSealSvg(info, size){
    let svg = buildEgyptoSolomonicSealSVG(info.name, info.num, info.meta || {}, size || 512);
    // Remove the two parchment/background plate rectangles only.
    svg = svg.replace(/<rect x="4" y="4"[^>]*\/>/i, '');
    svg = svg.replace(/<rect x="10" y="10"[^>]*\/>/i, '');
    return svg;
  }

  function drawSealPolygon(ctx,cx,cy,r,sides,rotation,stroke,lineWidth,alpha){
    ctx.save(); ctx.globalAlpha=alpha==null?1:alpha; ctx.strokeStyle=stroke; ctx.lineWidth=lineWidth; ctx.beginPath();
    for(let i=0;i<sides;i++){
      const a=(rotation+i*(Math.PI*2/sides))-Math.PI/2;
      const x=cx+r*Math.cos(a), y=cy+r*Math.sin(a);
      if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    }
    ctx.closePath(); ctx.stroke(); ctx.restore();
  }
  function drawCircularTextCanvas(ctx,text,cx,cy,r,startAngle,color,fontSize){
    const chars=Array.from(String(text||''));
    if(!chars.length) return;
    ctx.save();
    ctx.fillStyle=color;
    ctx.font=`700 ${fontSize}px ui-monospace, monospace`;
    ctx.textAlign='center'; ctx.textBaseline='middle';
    const span=Math.min(Math.PI*1.55, chars.length*fontSize/r*0.62);
    const step=chars.length>1?span/(chars.length-1):0;
    const start=startAngle-span/2;
    chars.forEach((ch,i)=>{
      const a=start+i*step;
      ctx.save();
      ctx.translate(cx+r*Math.cos(a),cy+r*Math.sin(a));
      ctx.rotate(a+Math.PI/2);
      ctx.fillText(ch,0,0);
      ctx.restore();
    });
    ctx.restore();
  }
  function drawAnkhCanvas(ctx,cx,cy,s,color,alpha){
    ctx.save(); ctx.globalAlpha=alpha==null?1:alpha; ctx.strokeStyle=color; ctx.lineWidth=Math.max(2,s*0.035); ctx.lineCap='round';
    ctx.beginPath(); ctx.ellipse(cx,cy-s*0.24,s*0.17,s*0.22,0,0,Math.PI*2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx,cy-s*0.02); ctx.lineTo(cx,cy+s*0.42); ctx.moveTo(cx-s*0.25,cy+s*0.10); ctx.lineTo(cx+s*0.25,cy+s*0.10); ctx.stroke();
    ctx.restore();
  }
  function drawEyeOfHorusCanvas(ctx,cx,cy,s,color,alpha){
    ctx.save(); ctx.globalAlpha=alpha==null?1:alpha; ctx.strokeStyle=color; ctx.lineWidth=Math.max(2,s*0.028); ctx.lineCap='round'; ctx.lineJoin='round';
    ctx.beginPath();
    ctx.moveTo(cx-s*0.46,cy); ctx.quadraticCurveTo(cx,cy-s*0.26,cx+s*0.46,cy); ctx.quadraticCurveTo(cx,cy+s*0.26,cx-s*0.46,cy); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx,cy,s*0.12,0,Math.PI*2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx+s*0.04,cy+s*0.14); ctx.quadraticCurveTo(cx+s*0.10,cy+s*0.34,cx+s*0.02,cy+s*0.48); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx-s*0.18,cy+s*0.13); ctx.quadraticCurveTo(cx-s*0.30,cy+s*0.29,cx-s*0.40,cy+s*0.36); ctx.stroke();
    ctx.restore();
  }
  function drawEgyptoSolomonicSealCanvas(ctx,info,x,y,size){
    const meta=info.meta||{};
    const fire=meta.fireColor||'#d4af37';
    const pillar=meta.pillarColor||'#40e0d0';
    const ink='#2f2417';
    const red='#8c3a2b';
    const seed=hashString((info.name||'')+'|'+(info.num||'')+'|'+(meta.fireName||''));
    const rand=rngFactory(seed);
    const cx=x+size/2, cy=y+size/2;
    const outer=size*0.39, ring2=size*0.34, ring3=size*0.26, inner=size*0.17;
    ctx.save(); ctx.lineCap='round'; ctx.lineJoin='round';

    // Outer ceremonial rings.
    ctx.strokeStyle=ink; ctx.lineWidth=Math.max(2,size*0.009); ctx.beginPath(); ctx.arc(cx,cy,outer,0,Math.PI*2); ctx.stroke();
    ctx.strokeStyle=pillar; ctx.lineWidth=Math.max(1.5,size*0.005); ctx.setLineDash([size*0.012,size*0.014]); ctx.beginPath(); ctx.arc(cx,cy,ring2,0,Math.PI*2); ctx.stroke(); ctx.setLineDash([]);
    ctx.strokeStyle=red; ctx.globalAlpha=.65; ctx.lineWidth=Math.max(1.3,size*0.004); ctx.beginPath(); ctx.arc(cx,cy,outer*0.91,0,Math.PI*2); ctx.stroke(); ctx.globalAlpha=1;

    // Alternating temple ticks around the circumference.
    for(let i=0;i<24;i++){
      const a=i*Math.PI*2/24-Math.PI/2;
      const r1=outer*0.94, r2=outer*(i%3===0?1.04:1.0);
      ctx.strokeStyle=i%2===0?fire:pillar; ctx.globalAlpha=i%3===0?.9:.58; ctx.lineWidth=Math.max(1.2,size*0.004);
      ctx.beginPath(); ctx.moveTo(cx+r1*Math.cos(a),cy+r1*Math.sin(a)); ctx.lineTo(cx+r2*Math.cos(a),cy+r2*Math.sin(a)); ctx.stroke();
    }
    ctx.globalAlpha=1;

    // Solar disc / Eye of Horus crown.
    ctx.strokeStyle=fire; ctx.lineWidth=Math.max(1.5,size*0.005); ctx.beginPath(); ctx.arc(cx,cy-outer*1.07,size*0.04,0,Math.PI*2); ctx.stroke();
    ctx.fillStyle=fire; ctx.beginPath(); ctx.arc(cx,cy-outer*1.07,size*0.012,0,Math.PI*2); ctx.fill();
    drawEyeOfHorusCanvas(ctx,cx,cy-outer*0.78,size*0.19,fire,.92);

    // Lotus petals.
    for(let i=0;i<8;i++){
      const a=i*Math.PI/4;
      const px=cx+ring3*0.83*Math.cos(a), py=cy+ring3*0.83*Math.sin(a);
      ctx.save(); ctx.translate(px,py); ctx.rotate(a+Math.PI/2); ctx.strokeStyle=fire; ctx.globalAlpha=.58; ctx.lineWidth=Math.max(1.2,size*0.0038); ctx.beginPath(); ctx.ellipse(0,0,size*0.028,size*0.075,0,0,Math.PI*2); ctx.stroke(); ctx.restore();
    }
    ctx.globalAlpha=1;

    // Solomonic polygons vary deterministically per chamber.
    const sidesA=[5,6,7,8][Math.floor(rand()*4)];
    const sidesB=[3,4,5,6][Math.floor(rand()*4)];
    drawSealPolygon(ctx,cx,cy,ring3,sidesA,rand()*Math.PI*2,fire,Math.max(1.5,size*0.005),.78);
    drawSealPolygon(ctx,cx,cy,inner*1.18,sidesB,rand()*Math.PI*2,pillar,Math.max(1.5,size*0.005),.78);

    // Radial architecture.
    const spokes=10+Math.floor(rand()*5);
    for(let i=0;i<spokes;i++){
      const a=i*Math.PI*2/spokes+rand()*0.08;
      ctx.strokeStyle=i%2?pillar:fire; ctx.globalAlpha=.34; ctx.lineWidth=Math.max(1,size*0.003);
      ctx.beginPath(); ctx.moveTo(cx+inner*1.02*Math.cos(a),cy+inner*1.02*Math.sin(a)); ctx.lineTo(cx+ring3*1.05*Math.cos(a),cy+ring3*1.05*Math.sin(a)); ctx.stroke();
    }
    ctx.globalAlpha=1;

    // Unique central sigil, drawn natively with cubic curves.
    const points=[]; let angle=rand()*Math.PI*2; const pointCount=10+Math.floor(rand()*6);
    for(let i=0;i<pointCount;i++){
      angle += .55+rand()*1.1;
      const rr=inner*(.25+rand()*.78);
      points.push([cx+rr*Math.cos(angle),cy+rr*Math.sin(angle)]);
    }
    ctx.strokeStyle=ink; ctx.lineWidth=Math.max(2,size*0.008); ctx.globalAlpha=.98; ctx.beginPath();
    if(points.length){ ctx.moveTo(points[0][0],points[0][1]);
      for(let i=1;i<points.length;i++){
        const p0=points[i-1], p1=points[i];
        const mx=(p0[0]+p1[0])/2, my=(p0[1]+p1[1])/2;
        ctx.quadraticCurveTo(mx,my,p1[0],p1[1]);
        if(rand()>.7){ ctx.moveTo(p1[0]-size*.015,p1[1]); ctx.lineTo(p1[0]+size*.015,p1[1]); ctx.moveTo(p1[0],p1[1]-size*.015); ctx.lineTo(p1[0],p1[1]+size*.015); }
      }
    }
    ctx.stroke(); ctx.globalAlpha=1;
    ctx.fillStyle=fire; ctx.beginPath(); ctx.arc(cx,cy,size*0.015,0,Math.PI*2); ctx.fill();

    // Ankh as lower key.
    drawAnkhCanvas(ctx,cx,cy+outer*0.67,size*0.18,red,.9);

    // Ring label — standard Latin text, no SVG textPath or special glyph dependency.
    drawCircularTextCanvas(ctx,`${String(info.num||'').padStart(2,'0')} • ${(info.name||'SEAL').toUpperCase()} •`,cx,cy,outer*1.09,-Math.PI/2,ink,Math.max(12,size*0.034));
    ctx.restore();
  }
  function sealCanvasToPngBlob(info,pixelSize){
    return new Promise((resolve,reject)=>{
      try{
        const S=Math.max(512,pixelSize||2048);
        const canvas=document.createElement('canvas'); canvas.width=S; canvas.height=S;
        const ctx=canvas.getContext('2d',{alpha:true});
        if(!ctx) return reject(new Error('Canvas rendering is unavailable in this browser.'));
        ctx.clearRect(0,0,S,S);
        drawEgyptoSolomonicSealCanvas(ctx,info,0,0,S);
        canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('PNG encoder returned an empty seal file.')),'image/png',1);
      }catch(err){ reject(err); }
    });
  }
  function svgStringToPngBlob(svgString, logicalSize, scale){
    return new Promise((resolve, reject) => {
      const svgBlob = new Blob([svgString], {type:'image/svg+xml;charset=utf-8'});
      const svgUrl = URL.createObjectURL(svgBlob);
      const img = new Image();
      img.onload = () => {
        try{
          const factor = Math.max(1, scale || 4);
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(logicalSize * factor);
          canvas.height = Math.round(logicalSize * factor);
          const ctx = canvas.getContext('2d', {alpha:true});
          ctx.clearRect(0,0,canvas.width,canvas.height);
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          URL.revokeObjectURL(svgUrl);
          canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('PNG encoder returned an empty file.')), 'image/png', 1);
        }catch(err){
          URL.revokeObjectURL(svgUrl);
          reject(err);
        }
      };
      img.onerror = () => { URL.revokeObjectURL(svgUrl); reject(new Error('The seal artwork could not be rasterized.')); };
      img.src = svgUrl;
    });
  }
  async function downloadSealPng(info, btn){
    try{
      setButtonBusy(btn, true, 'Rendering seal…');
      const blob = await sealCanvasToPngBlob(info, 2048);
      saveBlob(blob, `seal-${info.num}-${safeFilePart(info.name)}-transparent.png`);
    }catch(err){
      console.error('Seal PNG download failed:', err);
      alert('Seal download failed: ' + (err?.message || err));
    }finally{
      setButtonBusy(btn, false);
    }
  }
  function loadCanvasImage(src){
    return new Promise((resolve, reject) => {
      const img = new Image();
      if(src && !src.startsWith('data:') && !src.startsWith('blob:')) img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Hero image could not be loaded for the collectible.'));
      img.src = src;
    });
  }
  function drawImageContain(ctx, img, x, y, w, h){
    const s = Math.min(w/img.naturalWidth, h/img.naturalHeight);
    const dw = img.naturalWidth*s, dh = img.naturalHeight*s;
    ctx.drawImage(img, x+(w-dw)/2, y+(h-dh)/2, dw, dh);
  }
  function roundRectPath(ctx,x,y,w,h,r){
    const rr=Math.min(r,w/2,h/2);
    ctx.beginPath();
    ctx.moveTo(x+rr,y); ctx.arcTo(x+w,y,x+w,y+h,rr); ctx.arcTo(x+w,y+h,x,y+h,rr); ctx.arcTo(x,y+h,x,y,rr); ctx.arcTo(x,y,x+w,y,rr); ctx.closePath();
  }
  function wrapCanvasText(ctx, text, x, y, maxWidth, lineHeight, maxLines){
    const words=String(text||'').split(/\s+/); let line='', lines=[];
    for(const word of words){
      const test=line?line+' '+word:word;
      if(ctx.measureText(test).width>maxWidth && line){ lines.push(line); line=word; }
      else line=test;
    }
    if(line) lines.push(line);
    if(maxLines && lines.length>maxLines){ lines=lines.slice(0,maxLines); let last=lines[lines.length-1]; while(ctx.measureText(last+'…').width>maxWidth && last.length>1) last=last.slice(0,-1); lines[lines.length-1]=last+'…'; }
    lines.forEach((ln,i)=>ctx.fillText(ln,x,y+i*lineHeight));
    return y+lines.length*lineHeight;
  }
  async function buildCollectiblePngBlob(info){
    const W=1200,H=1800;
    const canvas=document.createElement('canvas'); canvas.width=W; canvas.height=H;
    const ctx=canvas.getContext('2d',{alpha:false});
    const fire=info.meta?.fireColor || '#d4af37';
    const pillar=info.meta?.pillarColor || '#40e0d0';
    const bg=ctx.createLinearGradient(0,0,0,H); bg.addColorStop(0,'#f6ecd4'); bg.addColorStop(1,'#e5d2a9'); ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);
    ctx.strokeStyle=pillar; ctx.lineWidth=6; roundRectPath(ctx,34,34,W-68,H-68,36); ctx.stroke();
    ctx.strokeStyle='#8c3a2b'; ctx.lineWidth=2; roundRectPath(ctx,52,52,W-104,H-104,30); ctx.stroke();

    ctx.textAlign='center'; ctx.fillStyle='#6d5421'; ctx.font='700 48px Cinzel, serif'; ctx.fillText("TEMPLE OF MA'AT",W/2,115);
    ctx.fillStyle=pillar; ctx.font='700 22px ui-monospace, monospace'; ctx.fillText('COLLECTABLE CHAMBER PLATE',W/2,160);

    const ix=110,iy=215,iw=980,ih=650;
    ctx.fillStyle='#0c151a'; roundRectPath(ctx,ix,iy,iw,ih,28); ctx.fill();
    try{
      const hero=await loadCanvasImage(info.imgSrc);
      ctx.save(); roundRectPath(ctx,ix,iy,iw,ih,28); ctx.clip(); drawImageContain(ctx,hero,ix,iy,iw,ih); ctx.restore();
    }catch(err){
      console.warn(err); ctx.fillStyle='#18313a'; ctx.fillRect(ix,iy,iw,ih); ctx.fillStyle='#d9d2c5'; ctx.font='24px ui-monospace, monospace'; ctx.fillText('Hero image unavailable in export',W/2,iy+ih/2);
    }
    const shade=ctx.createLinearGradient(0,iy+ih-150,0,iy+ih); shade.addColorStop(0,'rgba(7,13,18,0)'); shade.addColorStop(1,'rgba(7,13,18,.88)'); ctx.fillStyle=shade; ctx.fillRect(ix,iy+ih-170,iw,170);
    ctx.textAlign='left'; ctx.fillStyle='#fffaf0'; ctx.font='700 34px Cinzel, serif'; ctx.fillText(`CHAMBER ${info.num} • ${info.name}`,ix+36,iy+ih-58);
    ctx.fillStyle='#d9d2c5'; ctx.font='22px ui-monospace, monospace'; ctx.fillText(info.pairing||'',ix+36,iy+ih-24);

    // Separate seal plate.
    const sx=110,sy=915,sw=980,sh=410;
    ctx.fillStyle='#fff7e6'; roundRectPath(ctx,sx,sy,sw,sh,28); ctx.fill(); ctx.strokeStyle='#cbb07a'; ctx.lineWidth=2; ctx.stroke();
    drawEgyptoSolomonicSealCanvas(ctx,info,sx+42,sy+48,310);
    ctx.fillStyle='#6d5421'; ctx.font='700 36px Cinzel, serif'; ctx.fillText(`Seal of ${info.name}`,sx+390,sy+78);
    ctx.fillStyle='#4c473d'; ctx.font='21px ui-monospace, monospace';
    wrapCanvasText(ctx,info.pairing||'',sx+390,sy+125,535,30,2);
    ctx.font='19px ui-monospace, monospace';
    ctx.fillText(`PILLAR: ${info.meta?.pillar || '—'}`,sx+390,sy+214);
    ctx.fillStyle=fire; ctx.fillText(`FIRE: ${info.meta?.fireName || '—'}`,sx+390,sy+252);
    ctx.fillStyle='#4c473d'; wrapCanvasText(ctx,info.office||'',sx+390,sy+300,535,27,3);

    const tx=110,ty=1370,tw=980,th=300;
    ctx.fillStyle='#fff7e6'; roundRectPath(ctx,tx,ty,tw,th,28); ctx.fill(); ctx.strokeStyle='#cbb07a'; ctx.lineWidth=2; ctx.stroke();
    ctx.fillStyle=pillar; ctx.font='700 20px ui-monospace, monospace'; ctx.fillText('OFFICE',tx+34,ty+48);
    ctx.fillStyle='#2f2417'; ctx.font='21px ui-monospace, monospace'; let yy=wrapCanvasText(ctx,info.office||'',tx+34,ty+88,tw-68,30,3);
    ctx.fillStyle=fire; ctx.font='700 20px ui-monospace, monospace'; ctx.fillText('LAW',tx+34,yy+32);
    ctx.fillStyle='#2f2417'; ctx.font='21px ui-monospace, monospace'; wrapCanvasText(ctx,info.law||info.meta?.law||'',tx+34,yy+70,tw-68,30,3);
    ctx.textAlign='center'; ctx.fillStyle='#665f52'; ctx.font='18px ui-monospace, monospace'; ctx.fillText("Egypto-Solomonic Chamber Collectable • Temple of Ma'at",W/2,1740);

    return await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('Collectible PNG encoder returned an empty file.')),'image/png',1));
  }
  async function downloadCollectablePng(info, btn){
    try{
      setButtonBusy(btn,true,'Rendering collectable…');
      const blob=await buildCollectiblePngBlob(info);
      saveBlob(blob,`chamber-${info.num}-${safeFilePart(info.name)}-collectable.png`);
    }catch(err){
      console.error('Collectable download failed:',err);
      alert('Collectable download failed: '+(err?.message||err));
    }finally{ setButtonBusy(btn,false); }
  }
  function addCardEnhancements(card){
    if(card.dataset.egsolApplied === '2') return;
    const body = card.querySelector('.p-4');
    if(!body) return;
    body.querySelectorAll('.egsol-seal-block,.egsol-download-wrap').forEach(el => el.remove());
    const info = getCardInfo(card);
    const sealSection = buildSealSection(info, true);
    const tags = body.querySelector('.mt-2');
    if(tags) tags.insertAdjacentElement('beforebegin', sealSection); else body.appendChild(sealSection);

    const sealControls = document.createElement('div');
    sealControls.className = 'egsol-download-wrap';
    const sealBtn = buildDownloadButton('⬇ Transparent Seal PNG');
    sealBtn.addEventListener('click', function(ev){ ev.preventDefault(); ev.stopPropagation(); downloadSealPng(info, sealBtn); });
    sealControls.appendChild(sealBtn);
    sealSection.appendChild(sealControls);

    const wrap = document.createElement('div');
    wrap.className = 'egsol-download-wrap';
    const btn = buildDownloadButton('⬇ Download Collectable PNG');
    btn.addEventListener('click', function(ev){ ev.preventDefault(); ev.stopPropagation(); downloadCollectablePng(info, btn); });
    wrap.appendChild(btn);
    body.appendChild(wrap);
    card.dataset.egsolApplied = '2';
  }
  function addModalEnhancements(modal){
    const content = modal.querySelector('.temple-modal-content');
    if(!content || modal.dataset.egsolModalApplied === '2') return;
    modal.querySelectorAll('.egsol-seal-feature,.egsol-modal-download').forEach(el => el.remove());
    const infoLine = modal.querySelector('.font-mono.text-\\[11px\\]') || modal.querySelector('.font-mono');
    const num = String((((infoLine?.textContent || modal.textContent || '').match(/\d+/) || [''])[0] || '')).padStart(2,'0');
    const fallbackCard = getCardByNum(num);
    const info = fallbackCard ? getCardInfo(fallbackCard) : {
      num,
      name: (modal.querySelector('.font-cinzel')?.textContent || ('Chamber '+num)).trim(),
      pairing: Array.from(modal.querySelectorAll('.font-cinzel')).slice(1,2).map(el=>el.textContent.trim())[0] || '',
      office: HERO_META[num]?.office || '',
      law: HERO_META[num]?.law || '',
      imgSrc: modal.querySelector('img')?.src || '',
      meta: HERO_META[num] || {}
    };
    const feature = document.createElement('div');
    feature.className = 'egsol-seal-feature';
    feature.innerHTML = `
      <div class="egsol-seal-feature-head">
        <div class="egsol-seal-kicker">EGYPTO-SOLOMONIC SEAL PLATE</div>
        <div class="egsol-seal-feature-title">Seal of ${esc(info.name)}</div>
        <div class="egsol-seal-feature-sub">Separate ritual object • transparent PNG export</div>
      </div>
      <div class="egsol-seal-feature-body">
        <div class="egsol-seal-feature-art">${buildEgyptoSolomonicSealSVG(info.name, info.num, info.meta || {}, 196)}</div>
        <div class="egsol-seal-feature-copy">
          <div><strong>Pairing:</strong> ${esc(info.pairing)}</div>
          <div><strong>Pillar:</strong> ${esc(info.meta?.pillar || '—')} &nbsp;•&nbsp; <strong>Fire:</strong> ${esc(info.meta?.fireName || '—')}</div>
          <div><strong>Office:</strong> ${esc(info.office || '')}</div>
          <div><strong>Law:</strong> ${esc(info.law || info.meta?.law || '')}</div>
        </div>
      </div>`;
    const marker = content.querySelector('.font-cinzel.text-\\[12px\\]') || content.firstElementChild;
    if(marker) marker.insertAdjacentElement('afterend', feature); else content.prepend(feature);
    const dl = document.createElement('div');
    dl.className = 'egsol-modal-download';
    const sealBtn = buildDownloadButton('⬇ Transparent Seal PNG');
    sealBtn.addEventListener('click', function(ev){ ev.preventDefault(); ev.stopPropagation(); downloadSealPng(info, sealBtn); });
    const cardBtn = buildDownloadButton('⬇ Download Collectable PNG');
    cardBtn.addEventListener('click', function(ev){ ev.preventDefault(); ev.stopPropagation(); downloadCollectablePng(info, cardBtn); });
    dl.appendChild(sealBtn); dl.appendChild(cardBtn); feature.appendChild(dl);
    modal.dataset.egsolModalApplied = '2';
  }
  function injectStyles(){
    if(document.getElementById('egsol-styles')) return;
    const style = document.createElement('style');
    style.id = 'egsol-styles';
    style.textContent = `
      .solomonic-seal-panel,.solomonic-seal-feature,.solomonic-seal-overlay{display:none !important;}
      .egsol-seal-block{margin:12px 0;padding:12px;border-radius:16px;border:1px solid #d8c49a;background:linear-gradient(180deg,#fbf2de 0%,#efe0b9 100%);box-shadow:inset 0 0 0 1px rgba(255,255,255,.45),0 8px 18px rgba(0,0,0,.08);color:#2f2417;}
      .egsol-seal-kicker{font-family:ui-monospace,monospace;font-size:10px;letter-spacing:.22em;color:#0d9488;text-transform:uppercase;margin-bottom:8px;}
      .egsol-seal-inner{display:flex;gap:12px;align-items:center;}
      .egsol-seal-art{width:108px;min-width:108px;height:108px;display:flex;align-items:center;justify-content:center;border-radius:14px;background:radial-gradient(circle at center,#fff8ea 0%,#f0dfba 100%);border:1px solid rgba(47,36,23,.08);}
      .egsol-seal-svg{display:block;max-width:100%;height:auto;}
      .egsol-seal-copy{min-width:0;display:flex;flex-direction:column;gap:6px;}
      .egsol-seal-title{font-family:Cinzel,serif;font-size:15px;font-weight:700;color:#6e5522;line-height:1.15;}
      .egsol-seal-meta,.egsol-seal-desc{font-family:ui-monospace,monospace;font-size:10px;line-height:1.5;color:#4e493d;}
      .egsol-seal-meta span{color:#0d9488;}
      .egsol-download-wrap{margin-top:10px;display:flex;justify-content:flex-start;}
      .egsol-download-btn{appearance:none;border:1px solid #b8973a;background:linear-gradient(180deg,#fff3c9 0%,#e8c85f 100%);color:#2f2417;border-radius:999px;padding:10px 14px;font-family:ui-monospace,monospace;font-size:11px;font-weight:700;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,.08);}
      .egsol-download-btn:hover{transform:translateY(-1px);box-shadow:0 6px 14px rgba(0,0,0,.12);}.egsol-download-btn:disabled{opacity:.65;cursor:wait;transform:none;}
      .egsol-seal-feature{margin:10px 0 18px;padding:16px;border-radius:18px;border:1px solid #d8c49a;background:linear-gradient(180deg,#fbf2de 0%,#efe0b9 100%);box-shadow:inset 0 0 0 1px rgba(255,255,255,.45),0 8px 18px rgba(0,0,0,.08);color:#2f2417;}
      .egsol-seal-feature-head{display:flex;flex-direction:column;gap:5px;margin-bottom:12px;}
      .egsol-seal-feature-title{font-family:Cinzel,serif;font-size:20px;color:#6e5522;font-weight:700;line-height:1.1;}
      .egsol-seal-feature-sub{font-family:ui-monospace,monospace;font-size:10px;line-height:1.5;color:#5c574b;text-transform:uppercase;letter-spacing:.06em;}
      .egsol-seal-feature-body{display:grid;grid-template-columns:minmax(176px,196px) 1fr;gap:16px;align-items:center;}
      .egsol-seal-feature-art{display:flex;align-items:center;justify-content:center;border-radius:18px;background:radial-gradient(circle at center,#fff8ea 0%,#f0dfba 100%);border:1px solid rgba(47,36,23,.08);padding:8px;}
      .egsol-seal-feature-copy{font-family:ui-monospace,monospace;font-size:11px;line-height:1.6;color:#2f2417;display:flex;flex-direction:column;gap:8px;}
      .egsol-modal-download{margin-top:12px;display:flex;justify-content:flex-start;gap:8px;flex-wrap:wrap;}
      @media (max-width: 768px){
        .egsol-seal-inner{align-items:flex-start;}
        .egsol-seal-art{width:84px;min-width:84px;height:84px;}
        .egsol-seal-feature{padding:12px;}
        .egsol-seal-feature-title{font-size:17px;}
        .egsol-seal-feature-body{grid-template-columns:1fr;gap:12px;}
        .egsol-download-btn{width:100%;justify-content:center;}
      }
    `;
    document.head.appendChild(style);
  }
  function run(){
    injectStyles();
    removeOldSeals(document);
    document.querySelectorAll('.masonry-item').forEach(addCardEnhancements);
    document.querySelectorAll('.temple-detail-modal').forEach(addModalEnhancements);
  }
  let queued = false;
  function scheduleRun(){ if(queued) return; queued = true; requestAnimationFrame(() => { queued = false; run(); }); }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scheduleRun); else scheduleRun();
  const obs = new MutationObserver(() => scheduleRun());
  window.addEventListener('load', scheduleRun);
  obs.observe(document.getElementById('root') || document.body, {subtree:true, childList:true});
  setTimeout(scheduleRun, 600); setTimeout(scheduleRun, 1500);
})();

/* Runtime block 3 */
(function(){
  const PREBUILT_SEAL_PNGS = {"01":"./assets/seals/seal-01-bifruiah-transparent.png","02":"./assets/seals/seal-02-orialiel-transparent.png","03":"./assets/seals/seal-03-andritael-transparent.png","04":"./assets/seals/seal-04-berelmiah-transparent.png","05":"./assets/seals/seal-05-gamiasiah-transparent.png","06":"./assets/seals/seal-06-vapulahel-transparent.png","07":"./assets/seals/seal-07-allochiah-transparent.png","08":"./assets/seals/seal-08-bathietel-transparent.png","09":"./assets/seals/seal-09-belehaziel-transparent.png","10":"./assets/seals/seal-10-bathiadiah-transparent.png","11":"./assets/seals/seal-11-valelauviah-transparent.png","12":"./assets/seals/seal-12-dantahaiah-transparent.png","13":"./assets/seals/seal-13-focazalel-transparent.png","14":"./assets/seals/seal-14-vapubahel-transparent.png","15":"./assets/seals/seal-15-berihariel-transparent.png","16":"./assets/seals/seal-16-haagakamiah-transparent.png","17":"./assets/seals/seal-17-valelauviah-ii-transparent.png","18":"./assets/seals/seal-18-agacaliel-transparent.png","19":"./assets/seals/seal-19-asmoleuviah-transparent.png","20":"./assets/seals/seal-20-haagpahaliah-transparent.png","21":"./assets/seals/seal-21-paimelkhael-transparent.png","22":"./assets/seals/seal-22-vapuyeiayel-transparent.png","23":"./assets/seals/seal-23-halmelahel-transparent.png","24":"./assets/seals/seal-24-halhahuiah-transparent.png","25":"./assets/seals/seal-25-focanithaiah-transparent.png","26":"./assets/seals/seal-26-vapuhaaiah-transparent.png","27":"./assets/seals/seal-27-alloyerathel-transparent.png","28":"./assets/seals/seal-28-vapuseheiah-transparent.png","29":"./assets/seals/seal-29-gremoreyiel-transparent.png","30":"./assets/seals/seal-30-buromael-transparent.png","31":"./assets/seals/seal-31-allolecabel-transparent.png","32":"./assets/seals/seal-32-focavasariah-transparent.png","33":"./assets/seals/seal-33-paiyehuiah-transparent.png","34":"./assets/seals/seal-34-marcholehahiah-transparent.png","35":"./assets/seals/seal-35-glasyavakiah-transparent.png","36":"./assets/seals/seal-36-bathimenadel-transparent.png","37":"./assets/seals/seal-37-camianiel-transparent.png","38":"./assets/seals/seal-38-belhaamiah-transparent.png","39":"./assets/seals/seal-39-gusorehael-transparent.png","40":"./assets/seals/seal-40-bifroyeiazel-transparent.png","41":"./assets/seals/seal-41-belehahahel-transparent.png","42":"./assets/seals/seal-42-agamikael-transparent.png","43":"./assets/seals/seal-43-asmoveuliah-transparent.png","44":"./assets/seals/seal-44-gamiyelahiah-transparent.png","45":"./assets/seals/seal-45-cimisehaliah-transparent.png","46":"./assets/seals/seal-46-hauariel-transparent.png","47":"./assets/seals/seal-47-agaresaliah-transparent.png","48":"./assets/seals/seal-48-leramihael-transparent.png","49":"./assets/seals/seal-49-vapuvehuel-transparent.png","50":"./assets/seals/seal-50-bathidaniel-transparent.png","51":"./assets/seals/seal-51-glasyahasiah-transparent.png","52":"./assets/seals/seal-52-cimimamiah-transparent.png","53":"./assets/seals/seal-53-botinanael-transparent.png","54":"./assets/seals/seal-54-procnithael-transparent.png","55":"./assets/seals/seal-55-haagmebahiah-transparent.png","56":"./assets/seals/seal-56-buropoyel-transparent.png","57":"./assets/seals/seal-57-glasnemamiah-transparent.png","58":"./assets/seals/seal-58-procyeialel-transparent.png","59":"./assets/seals/seal-59-beriharahel-transparent.png","60":"./assets/seals/seal-60-murmitzrael-transparent.png","61":"./assets/seals/seal-61-marbumabel-transparent.png","62":"./assets/seals/seal-62-fociahhel-transparent.png","63":"./assets/seals/seal-63-marbanauel-transparent.png","64":"./assets/seals/seal-64-belemehiel-transparent.png","65":"./assets/seals/seal-65-astadamabiah-transparent.png","66":"./assets/seals/seal-66-andramanakel-transparent.png","67":"./assets/seals/seal-67-andraeyael-transparent.png","68":"./assets/seals/seal-68-allohabuhiah-transparent.png","69":"./assets/seals/seal-69-belerochel-transparent.png","70":"./assets/seals/seal-70-dantajabamiah-transparent.png","71":"./assets/seals/seal-71-cimihaiaiel-transparent.png","72":"./assets/seals/seal-72-halmumiah-transparent.png"};
  const HERO_NAMES = {"01":"Bifruiah","02":"Orialiel","03":"Andritael","04":"Berelmiah","05":"Gamiasiah","06":"Vapulahel","07":"Allochiah","08":"Bathietel","09":"Belehaziel","10":"Bathiadiah","11":"Valelauviah","12":"Dantahaiah","13":"Focazalel","14":"Vapubahel","15":"Berihariel","16":"Haagakamiah","17":"Valelauviah II","18":"Agacaliel","19":"Asmoleuviah","20":"Haagpahaliah","21":"Paimelkhael","22":"Vapuyeiayel","23":"Halmelahel","24":"Halhahuiah","25":"Focanithaiah","26":"Vapuhaaiah","27":"Alloyerathel","28":"Vapuseheiah","29":"Gremoreyiel","30":"Buromael","31":"Allolecabel","32":"Focavasariah","33":"Paiyehuiah","34":"Marcholehahiah","35":"Glasyavakiah","36":"Bathimenadel","37":"Camianiel","38":"Belhaamiah","39":"Gusorehael","40":"Bifroyeiazel","41":"Belehahahel","42":"Agamikael","43":"Asmoveuliah","44":"Gamiyelahiah","45":"Cimisehaliah","46":"Hauariel","47":"Agaresaliah","48":"Leramihael","49":"Vapuvehuel","50":"Bathidaniel","51":"Glasyahasiah","52":"Cimimamiah","53":"Botinanael","54":"Procnithael","55":"Haagmebahiah","56":"Buropoyel","57":"Glasnemamiah","58":"Procyeialel","59":"Beriharahel","60":"Murmitzrael","61":"Marbumabel","62":"Fociahhel","63":"Marbanauel","64":"Belemehiel","65":"Astadamabiah","66":"Andramanakel","67":"Andraeyael","68":"Allohabuhiah","69":"Belerochel","70":"Dantajabamiah","71":"Cimihaiaiel","72":"Halmumiah"};
  function findNumFromContext(el){
    const card=el.closest('.masonry-item');
    if(card){ const badge=card.querySelector('.absolute.top-3.left-3'); const m=(badge?.textContent||'').match(/\d+/); if(m) return String(m[0]).padStart(2,'0'); }
    const modal=el.closest('.temple-detail-modal');
    if(modal){ const m=(modal.textContent||'').match(/(?:CHAMBER\s*)?(\d{1,2})/i); if(m) return String(m[1]).padStart(2,'0'); }
    const title=(el.closest('.egsol-seal-block,.egsol-seal-feature')?.querySelector('.egsol-seal-title,.egsol-seal-feature-title')?.textContent||'').replace(/^Seal of\s+/i,'').trim().toLowerCase();
    for(const [n,name] of Object.entries(HERO_NAMES)){ if(name.toLowerCase()===title) return n; }
    return '';
  }
  async function savePrebuilt(num){
    const asset=PREBUILT_SEAL_PNGS[num];
    if(!asset) throw new Error('Seal PNG asset not found for chamber '+num);
    const response=await fetch(asset,{cache:'force-cache'});
    if(!response.ok) throw new Error('Seal PNG could not be loaded ('+response.status+').');
    const blob=await response.blob();
    const url=URL.createObjectURL(blob);
    const filename=`seal-${num}-${(HERO_NAMES[num]||'seal').toLowerCase().replace(/[^a-z0-9]+/g,'-')}-transparent.png`;
    const a=document.createElement('a'); a.href=url; a.download=filename; a.rel='noopener'; a.style.display='none'; document.body.appendChild(a); a.click(); a.remove();
    let fallback=document.getElementById('temple-download-fallback');
    if(!fallback){ fallback=document.createElement('a'); fallback.id='temple-download-fallback'; fallback.style.cssText='position:fixed;left:12px;right:12px;bottom:max(12px,env(safe-area-inset-bottom));z-index:99999;padding:12px 16px;border-radius:999px;background:#d4af37;color:#071015;font:700 12px ui-monospace,monospace;text-align:center;text-decoration:none;box-shadow:0 8px 26px rgba(0,0,0,.35);'; document.body.appendChild(fallback);}
    fallback.href=url; fallback.download=filename; fallback.textContent='⬇ Seal PNG ready — tap here to save if automatic download was blocked'; fallback.style.display='block';
    clearTimeout(window.__prebuiltSealTimer); window.__prebuiltSealTimer=setTimeout(()=>{ fallback.style.display='none'; URL.revokeObjectURL(url); },60000);
  }
  function refreshVisible(){
    document.querySelectorAll('.egsol-seal-block,.egsol-seal-feature').forEach(block=>{
      const num=findNumFromContext(block); const data=PREBUILT_SEAL_PNGS[num]; if(!data) return;
      const art=block.querySelector('.egsol-seal-art,.egsol-seal-feature-art'); if(!art) return;
      let img=art.querySelector('img.prebuilt-seal-png');
      if(!img){ art.innerHTML=''; img=document.createElement('img'); img.className='prebuilt-seal-png'; img.alt='Transparent Egypto-Solomonic seal PNG'; img.style.cssText='display:block;width:100%;height:100%;object-fit:contain;'; art.appendChild(img); }
      if(img.getAttribute('src')!==data) img.src=data;
      art.dataset.pngSrc=data; art.dataset.pngReady='1';
    });
  }
  document.addEventListener('click',async function(ev){
    const btn=ev.target.closest('.egsol-seal-png-download'); if(!btn) return;
    ev.preventDefault(); ev.stopImmediatePropagation();
    try{ const num=findNumFromContext(btn); if(!num) throw new Error('Could not determine the chamber number.'); await savePrebuilt(num); }
    catch(err){ console.error(err); alert('Seal download failed: '+(err?.message||err)); }
  },true);
  let queued=false; function schedule(){ if(queued)return; queued=true; requestAnimationFrame(()=>{queued=false;refreshVisible();}); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',schedule); else schedule();
  window.addEventListener('load',schedule); new MutationObserver(schedule).observe(document.getElementById('root') || document.body,{childList:true,subtree:true}); setTimeout(schedule,800); setTimeout(schedule,1800);
})();

/* Runtime block 4 */
(function(){
  function applyFaceCentering(root){
    const scope = root || document;
    const selectors = [
      '.masonry-item .relative > img',
      '.temple-modal-image',
      '.temple-feature-image',
      '.temple-intro-image'
    ];
    const position = window.innerWidth <= 768 ? '50% 16%' : '50% 18%';
    selectors.forEach((sel) => {
      scope.querySelectorAll(sel).forEach((img) => {
        img.style.objectPosition = position;
        if (!img.style.background) img.style.background = '#0f1d24';
      });
    });
  }

  let queued = false;
  function schedule(){
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      applyFaceCentering(document);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', schedule);
  else schedule();
  window.addEventListener('load', schedule);
  window.addEventListener('resize', schedule);
  const obs = new MutationObserver(() => schedule());
  obs.observe(document.getElementById('root') || document.body, { childList: true, subtree: true });
  setTimeout(schedule, 500);
  setTimeout(schedule, 1500);
})();

/* Runtime block 5 */
(function(){
  const STORAGE_KEY = 'temple_collected_v2';
  const TETRADS = new Set(['01','07','13','37','42']);
  const FACE_FOCAL_MAP = {"01":{"x":50,"y":34.5},"02":{"x":50,"y":24},"03":{"x":50,"y":28},"04":{"x":50,"y":20.4},"05":{"x":50,"y":21.5},"06":{"x":50,"y":19.0},"07":{"x":50,"y":29.7},"08":{"x":50,"y":18},"09":{"x":50,"y":18.7},"10":{"x":50,"y":21.1},"11":{"x":50,"y":24.0},"12":{"x":50,"y":28},"13":{"x":50,"y":22.7},"14":{"x":50,"y":22.2},"15":{"x":50,"y":24.8},"16":{"x":50,"y":24},"17":{"x":50,"y":26},"18":{"x":57,"y":28},"19":{"x":50,"y":18},"20":{"x":50,"y":19.0},"21":{"x":50,"y":35},"22":{"x":50,"y":28.4},"23":{"x":50,"y":22.4},"24":{"x":50,"y":24.2},"25":{"x":50,"y":18},"26":{"x":50,"y":25},"27":{"x":50,"y":20.0},"28":{"x":50,"y":22.5},"29":{"x":50,"y":30.4},"30":{"x":50,"y":27},"31":{"x":50,"y":22.2},"32":{"x":50,"y":35},"33":{"x":50,"y":25.0},"34":{"x":50,"y":22.4},"35":{"x":50,"y":27},"36":{"x":50,"y":26.7},"37":{"x":50,"y":20.4},"38":{"x":50,"y":26.6},"39":{"x":50,"y":25.3},"40":{"x":50,"y":27.4},"41":{"x":50,"y":25},"42":{"x":50,"y":24.9},"43":{"x":50,"y":29.5},"44":{"x":50,"y":27},"45":{"x":50,"y":19.7},"46":{"x":50,"y":24.7},"47":{"x":50,"y":24.3},"48":{"x":50,"y":27},"49":{"x":50,"y":22.5},"50":{"x":50,"y":26.0},"51":{"x":50,"y":31.0},"52":{"x":50,"y":26.0},"53":{"x":50,"y":25},"54":{"x":50,"y":27},"55":{"x":50,"y":24.1},"56":{"x":50,"y":28},"57":{"x":50,"y":22.7},"58":{"x":50,"y":25.3},"59":{"x":50,"y":23.1},"60":{"x":50,"y":20.2},"61":{"x":50,"y":27},"62":{"x":50,"y":23.1},"63":{"x":50,"y":25.2},"64":{"x":50,"y":35},"65":{"x":50,"y":21.8},"66":{"x":50,"y":28},"67":{"x":50,"y":22.5},"68":{"x":50,"y":23.7},"69":{"x":50,"y":35},"70":{"x":50,"y":27},"71":{"x":50,"y":27},"72":{"x":50,"y":31.2}};
  const state = { cards: [], codexOpen:false, sealsOpen:false, search:'', filter:'all' };
  function storage(){ return window.__templeLocal || window.localStorage; }
  function readCollected(){
    try{ const raw = storage().getItem(STORAGE_KEY); const arr = raw ? JSON.parse(raw) : []; return new Set(Array.isArray(arr)?arr:[]);}catch(e){ return new Set(); }
  }
  function writeCollected(set){ try{ storage().setItem(STORAGE_KEY, JSON.stringify(Array.from(set))); }catch(e){} }
  function collectedSet(){ if(!window.__templeCollectedSet) window.__templeCollectedSet = readCollected(); return window.__templeCollectedSet; }
  function isCollected(num){ return collectedSet().has(String(num).padStart(2,'0')); }
  function setCollected(num,val){ const n = String(num).padStart(2,'0'); const set = collectedSet(); if(val) set.add(n); else set.delete(n); writeCollected(set); renderAll(); }
  function toggleCollected(num){ setCollected(num, !isCollected(num)); }
  function escapeHtml(s){ return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function safeQueryText(root, sel){ const el = root && root.querySelector(sel); return el ? el.textContent.trim() : ''; }
  function numberFromText(text){ const m = String(text||'').match(/\b(\d{1,2})\b/); return m ? String(m[1]).padStart(2,'0') : ''; }
  function tierFor(info){
    if(info.isTetrad) return 'TETRAD';
    if(info.isRecurrence) return 'RECURRENCE';
    if(info.pillar) return info.pillar.toUpperCase();
    return 'CHAMBER';
  }
  function getCardInfo(card){
    const relative = card.querySelector('.relative');
    const body = card.querySelector('.p-4');
    if(!relative || !body) return null;
    const num = numberFromText(safeQueryText(relative, '.absolute.top-3.left-3')) || numberFromText(body.textContent);
    const allCinzel = Array.from(body.querySelectorAll('.font-cinzel')).map(el => el.textContent.trim()).filter(Boolean);
    const name = allCinzel[0] || ('Chamber '+num);
    const pairing = allCinzel[1] || '';
    const office = safeQueryText(body, '.italic');
    const law = safeQueryText(body, '.mt-2 span');
    const chips = Array.from(body.querySelectorAll('.mt-2 span,.tm-chip')).map(el => el.textContent.trim()).filter(Boolean);
    const sealName = chips.find(t => !/RECURRENCE|TETRAD|INITIATE|AUTHORITY|SEVERANCE|HEALING|VIGILANCE|TEMPERANCE|THRESHOLD|JACHIN|BOAZ|MIDDLE/i.test(t)) || '';
    const isRecurrence = chips.some(t => /RECURRENCE/i.test(t));
    const isTetrad = chips.some(t => /TETRAD/i.test(t)) || TETRADS.has(num);
    const fireLabel = safeQueryText(relative, '.absolute.top-3.right-3');
    const sealMeta = safeQueryText(body, '.egsol-seal-meta');
    const pillarMatch = sealMeta.match(/Pillar:\s*([^•]+?)(?:\s*•|$)/i);
    const fireMatch = sealMeta.match(/Fire:\s*(.+)$/i);
    const pillar = pillarMatch ? pillarMatch[1].trim() : '';
    const fire = fireMatch ? fireMatch[1].trim() : fireLabel;
    const img = relative.querySelector('img');
    const sealImg = body.querySelector('.egsol-seal-art img');
    return { num, name, pairing, office, law, sealName, isRecurrence, isTetrad, pillar, fire, imgSrc: img ? img.src : '', sealSrc: sealImg ? sealImg.src : '', card };
  }
  function collectCards(){
    state.cards = Array.from(document.querySelectorAll('.masonry-item')).map(getCardInfo).filter(Boolean);
    return state.cards;
  }
  function applyFaceFocal(root){
    const cards = Array.from((root || document).querySelectorAll('.masonry-item'));
    cards.forEach(card => {
      const info = getCardInfo(card); if(!info) return;
      card.dataset.tmNum = info.num;
      const img = card.querySelector('.relative > img');
      const focal = FACE_FOCAL_MAP[info.num] || {x:50,y:18};
      if(img) img.style.objectPosition = focal.x + '% ' + focal.y + '%';
    });
    const modal = document.querySelector('.temple-detail-modal');
    if(modal){
      const infoLine = safeQueryText(modal, '.font-mono');
      const num = numberFromText(infoLine) || numberFromText(modal.textContent);
      const img = modal.querySelector('.temple-modal-image');
      const focal = FACE_FOCAL_MAP[num] || {x:50,y:18};
      if(img) img.style.objectPosition = focal.x + '% ' + (window.innerWidth <= 768 ? Math.max(14,focal.y-1) : focal.y) + '%';
    }
  }
  function ensureCardEnhancements(){
    collectCards();
    state.cards.forEach(info => {
      const card = info.card; const body = card.querySelector('.p-4'); const tags = body.querySelector('.mt-2'); if(!body) return;
      card.classList.toggle('tm-card-collected', isCollected(info.num));
      let badge = body.querySelector('.tm-card-collectbar');
      if(!badge){
        badge = document.createElement('div');
        badge.className = 'tm-card-collectbar';
        badge.innerHTML = '<div class="tm-card-status"></div><button type="button" class="tm-collect-toggle"></button>';
        body.appendChild(badge);
      }
      const status = badge.querySelector('.tm-card-status');
      const btn = badge.querySelector('.tm-collect-toggle');
      const collected = isCollected(info.num);
      status.innerHTML = collected ? 'Collected in your archive' : 'Not yet collected';
      btn.textContent = collected ? '★ Collected' : '☆ Collect';
      btn.dataset.collected = String(collected);
      btn.onclick = (ev) => { ev.stopPropagation(); ev.preventDefault(); toggleCollected(info.num); };
      if(tags && !tags.querySelector('.tm-tier-chip')){
        const tier = document.createElement('span');
        tier.className = 'tm-chip tier tm-tier-chip';
        tier.textContent = tierFor(info);
        tags.appendChild(tier);
      } else if(tags && tags.querySelector('.tm-tier-chip')) {
        tags.querySelector('.tm-tier-chip').textContent = tierFor(info);
      }
    });
  }
  function findButtonByText(scope, matcher){
    return Array.from(scope.querySelectorAll('button')).find(btn => matcher.test((btn.textContent||'').trim()));
  }
  function ensureArtifactSheet(){
    const modal = document.querySelector('.temple-detail-modal');
    if(!modal) return;
    const content = modal.querySelector('.temple-modal-content');
    if(!content) return;
    const num = numberFromText(modal.textContent);
    const info = state.cards.find(c => c.num === num) || collectCards().find(c => c.num === num);
    if(!info) return;
    const existing = content.querySelector('.tm-artifact-sheet');
    if(existing) existing.remove();
    const card = info.card;
    const sealBtn = card ? findButtonByText(card, /Seal/i) : null;
    const plateBtn = card ? findButtonByText(card, /Collect/i) : null;
    const sheet = document.createElement('div');
    sheet.className = 'tm-artifact-sheet';
    sheet.innerHTML = `
      <div class="tm-kicker">artifact page</div>
      <div class="tm-title">Chamber ${escapeHtml(info.num)} • ${escapeHtml(info.name)}</div>
      <div class="tm-progress-sub" style="margin-top:6px">Dedicated chamber artifact sheet with seal, office, law, archive status, and collectible actions.</div>
      <div class="tm-artifact-grid">
        <div class="tm-artifact-cell"><div class="tm-artifact-label">Pairing</div><div class="tm-artifact-value">${escapeHtml(info.pairing || '—')}</div></div>
        <div class="tm-artifact-cell"><div class="tm-artifact-label">Tier</div><div class="tm-artifact-value">${escapeHtml(tierFor(info))}${info.isRecurrence ? ' • RECURRENCE' : ''}${info.isTetrad ? ' • TETRAD' : ''}</div></div>
        <div class="tm-artifact-cell"><div class="tm-artifact-label">Office</div><div class="tm-artifact-value">${escapeHtml(info.office || '—')}</div></div>
        <div class="tm-artifact-cell"><div class="tm-artifact-label">Law</div><div class="tm-artifact-value">${escapeHtml(info.law || '—')}</div></div>
        <div class="tm-artifact-cell"><div class="tm-artifact-label">Pillar</div><div class="tm-artifact-value">${escapeHtml(info.pillar || '—')}</div></div>
        <div class="tm-artifact-cell"><div class="tm-artifact-label">Fire</div><div class="tm-artifact-value">${escapeHtml(info.fire || '—')}</div></div>
      </div>
      <div class="tm-artifact-actions">
        <button type="button" class="tm-btn tm-artifact-seal">Download Seal</button>
        <button type="button" class="tm-btn tm-artifact-plate">Download Plate</button>
        <button type="button" class="tm-btn tm-ghost tm-artifact-collect">${isCollected(info.num) ? 'Uncollect Chamber' : 'Collect Chamber'}</button>
      </div>`;
    content.appendChild(sheet);
    sheet.querySelector('.tm-artifact-seal').onclick = () => sealBtn && sealBtn.click();
    sheet.querySelector('.tm-artifact-plate').onclick = () => plateBtn && plateBtn.click();
    sheet.querySelector('.tm-artifact-collect').onclick = () => toggleCollected(info.num);
  }
  function ensureUiShell(){
    if(!document.getElementById('tm-commit-deck')){
      const deck = document.createElement('div');
      deck.id = 'tm-commit-deck';
      deck.className = 'tm-commit-deck';
      deck.innerHTML = `
        <div class="tm-commit-card">
          <div class="tm-commit-header"><div class="tm-kicker">transformative work committed</div><div class="tm-title">Temple Archive Console</div></div>
          <div class="tm-progress">
            <div class="tm-progress-main">
              <div class="tm-progress-text">0 / 72 chambers collected</div>
              <div class="tm-progress-sub">Codex access • seal library • collectible archive • chamber progress</div>
              <div class="tm-progress-meter"><span></span></div>
            </div>
            <div class="tm-chip collected tm-progress-chip">0%</div>
          </div>
          <div class="tm-actions">
            <button type="button" class="tm-btn" data-open="codex">Open Codex</button>
            <button type="button" class="tm-btn tm-ghost" data-open="seals">Seal Library</button>
          </div>
        </div>`;
      document.body.appendChild(deck);
      deck.querySelector('[data-open="codex"]').onclick = () => { state.codexOpen = true; renderPanels(); };
      deck.querySelector('[data-open="seals"]').onclick = () => { state.sealsOpen = true; renderPanels(); };
    }
    if(!document.getElementById('tm-codex-panel')){
      const backdrop = document.createElement('div');
      backdrop.id = 'tm-codex-panel';
      backdrop.className = 'tm-panel-backdrop';
      backdrop.innerHTML = `
        <div class="tm-panel" role="dialog" aria-modal="true" aria-label="Temple Codex">
          <div class="tm-panel-head"><div><div class="tm-kicker">artifact codex</div><div class="tm-title">Temple of Ma’at Chamber Index</div></div><button type="button" class="tm-panel-close">✕</button></div>
          <div class="tm-panel-tools">
            <input class="tm-input tm-search" placeholder="Search chamber, angel, daemon, pillar, fire..." />
            <select class="tm-select tm-filter"><option value="all">All chambers</option><option value="collected">Collected</option><option value="uncollected">Uncollected</option><option value="tetrad">Tetrad</option><option value="recurrence">Recurrence</option><option value="jachin">Jachin</option><option value="middle">Middle</option><option value="boaz">Boaz</option></select>
            <div class="tm-chip collected tm-count-chip">0 items</div>
            <button type="button" class="tm-btn tm-sm tm-clear">Reset</button>
          </div>
          <div class="tm-panel-body"><div class="tm-grid"></div></div>
        </div>`;
      document.body.appendChild(backdrop);
      backdrop.addEventListener('click', (ev) => { if(ev.target === backdrop) { state.codexOpen = false; renderPanels(); } });
      backdrop.querySelector('.tm-panel-close').onclick = () => { state.codexOpen = false; renderPanels(); };
      backdrop.querySelector('.tm-search').addEventListener('input', (ev) => { state.search = ev.target.value || ''; renderPanels(); });
      backdrop.querySelector('.tm-filter').addEventListener('change', (ev) => { state.filter = ev.target.value || 'all'; renderPanels(); });
      backdrop.querySelector('.tm-clear').onclick = () => { state.search=''; state.filter='all'; backdrop.querySelector('.tm-search').value=''; backdrop.querySelector('.tm-filter').value='all'; renderPanels(); };
    }
    if(!document.getElementById('tm-seal-panel')){
      const backdrop = document.createElement('div');
      backdrop.id = 'tm-seal-panel';
      backdrop.className = 'tm-panel-backdrop';
      backdrop.innerHTML = `
        <div class="tm-panel" role="dialog" aria-modal="true" aria-label="Seal Library">
          <div class="tm-panel-head"><div><div class="tm-kicker">seal asset library</div><div class="tm-title">Egypto-Solomonic Seal Repository</div></div><button type="button" class="tm-panel-close">✕</button></div>
          <div class="tm-panel-body"><div class="tm-seal-grid"></div></div>
        </div>`;
      document.body.appendChild(backdrop);
      backdrop.addEventListener('click', (ev) => { if(ev.target === backdrop) { state.sealsOpen = false; renderPanels(); } });
      backdrop.querySelector('.tm-panel-close').onclick = () => { state.sealsOpen = false; renderPanels(); };
    }
  }
  function matchesFilter(info){
    const term = state.search.trim().toLowerCase();
    if(term){
      const hay = [info.num, info.name, info.pairing, info.office, info.law, info.fire, info.pillar, tierFor(info)].join(' ').toLowerCase();
      if(!hay.includes(term)) return false;
    }
    switch(state.filter){
      case 'collected': return isCollected(info.num);
      case 'uncollected': return !isCollected(info.num);
      case 'tetrad': return info.isTetrad;
      case 'recurrence': return info.isRecurrence;
      case 'jachin': return /jachin/i.test(info.pillar);
      case 'middle': return /middle/i.test(info.pillar);
      case 'boaz': return /boaz/i.test(info.pillar);
      default: return true;
    }
  }
  function openCard(info){ if(info && info.card) info.card.click(); }
  function renderPanels(){
    ensureUiShell();
    collectCards();
    const cards = state.cards;
    const total = cards.length || 72;
    const collected = cards.filter(c => isCollected(c.num)).length;
    const pct = total ? Math.round((collected/total)*100) : 0;
    const deck = document.getElementById('tm-commit-deck');
    if(deck){
      deck.querySelector('.tm-progress-text').textContent = `${collected} / ${total} chambers collected`;
      deck.querySelector('.tm-progress-chip').textContent = `${pct}%`;
      deck.querySelector('.tm-progress-meter > span').style.width = pct + '%';
    }
    const codex = document.getElementById('tm-codex-panel');
    const seals = document.getElementById('tm-seal-panel');
    if(codex) codex.classList.toggle('open', !!state.codexOpen);
    if(seals) seals.classList.toggle('open', !!state.sealsOpen);
    if(codex){
      const grid = codex.querySelector('.tm-grid');
      const list = cards.filter(matchesFilter);
      codex.querySelector('.tm-count-chip').textContent = `${list.length} item${list.length===1?'':'s'}`;
      grid.innerHTML = list.length ? list.map(info => `
        <div class="tm-codex-item">
          <div class="tm-codex-thumb">
            <img src="${escapeHtml(info.imgSrc)}" alt="${escapeHtml(info.name)}" />
            ${info.sealSrc ? `<div class="tm-codex-seal"><img src="${escapeHtml(info.sealSrc)}" alt="Seal of ${escapeHtml(info.name)}" /></div>` : ''}
          </div>
          <div class="tm-codex-body">
            <div class="tm-codex-title">${escapeHtml(info.num)} • ${escapeHtml(info.name)}</div>
            <div class="tm-codex-sub">${escapeHtml(info.pairing || info.office || 'Chamber artifact entry')}</div>
            <div class="tm-meta-row">
              <span class="tm-chip tier">${escapeHtml(tierFor(info))}</span>
              ${info.isRecurrence ? '<span class="tm-chip rec">RECURRENCE</span>' : ''}
              ${info.isTetrad ? '<span class="tm-chip tet">TETRAD</span>' : ''}
              <span class="tm-chip">${escapeHtml(info.pillar || '—')}</span>
              <span class="tm-chip">${escapeHtml(info.fire || '—')}</span>
              ${isCollected(info.num) ? '<span class="tm-chip collected">COLLECTED</span>' : ''}
            </div>
            <div class="tm-codex-actions">
              <button type="button" class="tm-btn tm-sm" data-open-chamber="${info.num}">Open Chamber</button>
              <button type="button" class="tm-btn tm-sm tm-ghost" data-toggle-collect="${info.num}">${isCollected(info.num)?'Uncollect':'Collect'}</button>
              <button type="button" class="tm-btn tm-sm" data-download-seal="${info.num}">Seal PNG</button>
              <button type="button" class="tm-btn tm-sm" data-download-plate="${info.num}">Plate PNG</button>
            </div>
          </div>
        </div>`).join('') : '<div class="tm-empty">No chambers match the current filter.</div>';
      grid.querySelectorAll('[data-open-chamber]').forEach(btn => btn.onclick = () => { const info = cards.find(c => c.num === btn.dataset.openChamber); state.codexOpen = false; renderPanels(); openCard(info); setTimeout(renderAll, 250); });
      grid.querySelectorAll('[data-toggle-collect]').forEach(btn => btn.onclick = () => toggleCollected(btn.dataset.toggleCollect));
      grid.querySelectorAll('[data-download-seal]').forEach(btn => btn.onclick = () => { const info = cards.find(c => c.num === btn.dataset.downloadSeal); const sourceBtn = info && findButtonByText(info.card, /Seal/i); sourceBtn && sourceBtn.click(); });
      grid.querySelectorAll('[data-download-plate]').forEach(btn => btn.onclick = () => { const info = cards.find(c => c.num === btn.dataset.downloadPlate); const sourceBtn = info && findButtonByText(info.card, /Collect/i); sourceBtn && sourceBtn.click(); });
    }
    if(seals){
      const grid = seals.querySelector('.tm-seal-grid');
      grid.innerHTML = cards.length ? cards.map(info => `
        <div class="tm-seal-item">
          <div class="tm-seal-art">${info.sealSrc ? `<img src="${escapeHtml(info.sealSrc)}" alt="Seal of ${escapeHtml(info.name)}" />` : '<div class="tm-empty" style="padding:0">Seal unavailable</div>'}</div>
          <div class="tm-seal-name">${escapeHtml(info.num)} • ${escapeHtml(info.name)}</div>
          <div class="tm-seal-copy">${escapeHtml(info.pillar || '—')} • ${escapeHtml(info.fire || '—')}</div>
          <div class="tm-codex-actions">
            <button type="button" class="tm-btn tm-sm" data-library-download-seal="${info.num}">Download Seal</button>
            <button type="button" class="tm-btn tm-sm tm-ghost" data-library-open="${info.num}">Open Chamber</button>
          </div>
        </div>`).join('') : '<div class="tm-empty">Seal library will populate once the chamber cards are ready.</div>';
      grid.querySelectorAll('[data-library-download-seal]').forEach(btn => btn.onclick = () => { const info = cards.find(c => c.num === btn.dataset.libraryDownloadSeal); const sourceBtn = info && findButtonByText(info.card, /Seal/i); sourceBtn && sourceBtn.click(); });
      grid.querySelectorAll('[data-library-open]').forEach(btn => btn.onclick = () => { const info = cards.find(c => c.num === btn.dataset.libraryOpen); state.sealsOpen = false; renderPanels(); openCard(info); setTimeout(renderAll, 250); });
    }
  }
  function renderAll(){
    applyFaceFocal(document);
    ensureCardEnhancements();
    ensureArtifactSheet();
    renderPanels();
  }
  let scheduled = false;
  function schedule(){ if(scheduled) return; scheduled = true; requestAnimationFrame(() => { scheduled = false; renderAll(); }); }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', schedule); else schedule();
  window.addEventListener('load', schedule);
  window.addEventListener('resize', schedule);
  const obs = new MutationObserver(() => schedule());
  obs.observe(document.getElementById('root') || document.body, {childList:true, subtree:true});
  setTimeout(schedule, 700); setTimeout(schedule, 1800); setTimeout(schedule, 3500);
})();

/* Runtime block 6 */
(function(){
  const FOCALS = {"01":{"x":50,"y":34.5},"02":{"x":50,"y":24},"03":{"x":50,"y":28},"04":{"x":50,"y":20.4},"05":{"x":50,"y":21.5},"06":{"x":50,"y":19.0},"07":{"x":50,"y":29.7},"08":{"x":50,"y":18},"09":{"x":50,"y":18.7},"10":{"x":50,"y":21.1},"11":{"x":50,"y":24.0},"12":{"x":50,"y":28},"13":{"x":50,"y":22.7},"14":{"x":50,"y":22.2},"15":{"x":50,"y":24.8},"16":{"x":50,"y":24},"17":{"x":50,"y":26},"18":{"x":57,"y":28},"19":{"x":50,"y":18},"20":{"x":50,"y":19.0},"21":{"x":50,"y":35},"22":{"x":50,"y":28.4},"23":{"x":50,"y":22.4},"24":{"x":50,"y":24.2},"25":{"x":50,"y":18},"26":{"x":50,"y":25},"27":{"x":50,"y":20.0},"28":{"x":50,"y":22.5},"29":{"x":50,"y":30.4},"30":{"x":50,"y":27},"31":{"x":50,"y":22.2},"32":{"x":50,"y":35},"33":{"x":50,"y":25.0},"34":{"x":50,"y":22.4},"35":{"x":50,"y":27},"36":{"x":50,"y":26.7},"37":{"x":50,"y":20.4},"38":{"x":50,"y":26.6},"39":{"x":50,"y":25.3},"40":{"x":50,"y":27.4},"41":{"x":50,"y":25},"42":{"x":50,"y":24.9},"43":{"x":50,"y":29.5},"44":{"x":50,"y":27},"45":{"x":50,"y":19.7},"46":{"x":50,"y":24.7},"47":{"x":50,"y":24.3},"48":{"x":50,"y":27},"49":{"x":50,"y":22.5},"50":{"x":50,"y":26.0},"51":{"x":50,"y":31.0},"52":{"x":50,"y":26.0},"53":{"x":50,"y":25},"54":{"x":50,"y":27},"55":{"x":50,"y":24.1},"56":{"x":50,"y":28},"57":{"x":50,"y":22.7},"58":{"x":50,"y":25.3},"59":{"x":50,"y":23.1},"60":{"x":50,"y":20.2},"61":{"x":50,"y":27},"62":{"x":50,"y":23.1},"63":{"x":50,"y":25.2},"64":{"x":50,"y":35},"65":{"x":50,"y":21.8},"66":{"x":50,"y":28},"67":{"x":50,"y":22.5},"68":{"x":50,"y":23.7},"69":{"x":50,"y":35},"70":{"x":50,"y":27},"71":{"x":50,"y":27},"72":{"x":50,"y":31.2}};
  const VERSION = '3.0.0-transformative';
  const TETRADS = new Set(['01','07','13','37','42']);
  let currentArtifact = null;
  let syncingHash = false;

  function st(){ try{return window.__templeLocal || window.localStorage;}catch(e){return null;} }
  function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function numText(s){const m=String(s||'').match(/\b(\d{1,2})\b/);return m?String(m[1]).padStart(2,'0'):'';}
  function safeText(root,sel){const e=root&&root.querySelector(sel);return e?e.textContent.trim():'';}
  function collectedSet(){
    try{const raw=st()?.getItem('temple_collected_v2');const arr=raw?JSON.parse(raw):[];return new Set(Array.isArray(arr)?arr:[]);}catch(e){return new Set();}
  }
  function setCollected(num,val){
    const set=collectedSet(); if(val)set.add(num); else set.delete(num);
    try{st()?.setItem('temple_collected_v2',JSON.stringify([...set]));}catch(e){}
    document.dispatchEvent(new CustomEvent('temple:collection-change',{detail:{num,val}}));
  }
  function tier(info){ if(info.isTetrad)return'TETRAD'; if(info.isRecurrence)return'RECURRENCE'; return (info.pillar||'CHAMBER').toUpperCase(); }
  function cardInfo(card){
    if(!card)return null;
    const imageWrap=card.querySelector('.relative'); const body=card.querySelector('.p-4'); if(!imageWrap||!body)return null;
    const num=numText(safeText(imageWrap,'.absolute.top-3.left-3'))||numText(body.textContent); if(!num)return null;
    const cin=Array.from(body.querySelectorAll('.font-cinzel')).map(e=>e.textContent.trim()).filter(Boolean);
    const name=cin[0]||('Chamber '+num), pairing=cin[1]||'';
    const office=safeText(body,'.italic');
    const tagSpans=Array.from(body.querySelectorAll('.mt-2 span')).map(e=>e.textContent.trim()).filter(Boolean);
    const law=tagSpans[0]||'';
    const isRecurrence=tagSpans.some(t=>/RECURRENCE/i.test(t));
    const isTetrad=tagSpans.some(t=>/TETRAD/i.test(t))||TETRADS.has(num);
    const sealMeta=safeText(body,'.egsol-seal-meta');
    const pillar=(sealMeta.match(/Pillar:\s*([^•]+?)(?:\s*•|$)/i)||[])[1]?.trim()||'';
    const fire=(sealMeta.match(/Fire:\s*(.+)$/i)||[])[1]?.trim()||safeText(imageWrap,'.absolute.top-3.right-3');
    const image=imageWrap.querySelector('img');
    const seal=body.querySelector('.egsol-seal-art img');
    const sealBtn=Array.from(card.querySelectorAll('button')).find(b=>/Seal/i.test(b.textContent||''));
    const plateBtn=Array.from(card.querySelectorAll('button')).find(b=>/Collectable|Collectible|Plate/i.test(b.textContent||''));
    return {num,name,pairing,office,law,isRecurrence,isTetrad,pillar,fire,imgSrc:image?.src||'',sealSrc:seal?.src||'',sealBtn,plateBtn,card,focal:FOCALS[num]||{x:50,y:25}};
  }
  function chambers(){return Array.from(document.querySelectorAll('.masonry-item')).map(cardInfo).filter(Boolean).sort((a,b)=>Number(a.num)-Number(b.num));}
  function applyFocals(){
    chambers().forEach(info=>{const img=info.card.querySelector('.relative>img');if(img)img.style.objectPosition=`${info.focal.x}% ${info.focal.y}%`;});
    const modal=document.querySelector('.temple-detail-modal');
    if(modal){const n=numText(modal.textContent);const f=FOCALS[n]||{x:50,y:25};const img=modal.querySelector('.temple-modal-image');if(img)img.style.objectPosition=`${f.x}% ${f.y}%`;}
  }
  function manifest(){
    const set=collectedSet();
    return {title:"Temple of Ma'at — 72 Chamber Archive",version:VERSION,generated:new Date().toISOString(),chamberCount:72,chambers:chambers().map(i=>({number:i.num,name:i.name,pairing:i.pairing,office:i.office,law:i.law,pillar:i.pillar,fire:i.fire,tier:tier(i),recurrence:i.isRecurrence,tetrad:i.isTetrad,collected:set.has(i.num),faceFocal:i.focal}))};
  }
  function saveBlob(blob,name){
    const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),5000);
  }
  function downloadManifest(){saveBlob(new Blob([JSON.stringify(manifest(),null,2)],{type:'application/json'}),'temple-of-maat-72-chamber-manifest.json');}
  function bytesFromDataUrl(url){
    if(!url||!url.startsWith('data:'))throw new Error('Seal is not embedded as a data URL.');
    const comma=url.indexOf(',');const meta=url.slice(0,comma);const data=url.slice(comma+1);
    if(/;base64/i.test(meta)){const bin=atob(data);const out=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)out[i]=bin.charCodeAt(i);return out;}
    return new TextEncoder().encode(decodeURIComponent(data));
  }
  const CRC_TABLE=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=(c&1)?(0xedb88320^(c>>>1)):(c>>>1);t[n]=c>>>0;}return t;})();
  function crc32(bytes){let c=0xffffffff;for(const b of bytes)c=CRC_TABLE[(c^b)&255]^(c>>>8);return(c^0xffffffff)>>>0;}
  function u16(v){const a=new Uint8Array(2);new DataView(a.buffer).setUint16(0,v,true);return a;}
  function u32(v){const a=new Uint8Array(4);new DataView(a.buffer).setUint32(0,v>>>0,true);return a;}
  function zipStore(files){
    const enc=new TextEncoder(),locals=[],centrals=[];let offset=0;
    for(const file of files){
      const name=enc.encode(file.name),data=file.data,crc=crc32(data);
      const local=new Blob([u32(0x04034b50),u16(20),u16(0),u16(0),u16(0),u16(0),u32(crc),u32(data.length),u32(data.length),u16(name.length),u16(0),name,data]);
      locals.push(local);
      const central=new Blob([u32(0x02014b50),u16(20),u16(20),u16(0),u16(0),u16(0),u16(0),u32(crc),u32(data.length),u32(data.length),u16(name.length),u16(0),u16(0),u16(0),u16(0),u32(0),u32(offset),name]);
      centrals.push(central);offset+=local.size;
    }
    const centralSize=centrals.reduce((n,b)=>n+b.size,0),count=files.length;
    const end=new Blob([u32(0x06054b50),u16(0),u16(0),u16(count),u16(count),u32(centralSize),u32(offset),u16(0)]);
    return new Blob([...locals,...centrals,end],{type:'application/zip'});
  }
  async function downloadSealPack(btn,status){
    const original=btn.textContent;btn.disabled=true;btn.textContent='Packing 72 seals…';status.textContent='Preparing embedded transparent PNGs…';status.classList.add('show');
    try{
      const list=chambers();const files=[];
      for(let i=0;i<list.length;i++){
        const info=list[i];if(!info.sealSrc)continue;
        status.textContent=`Packing seal ${i+1} of ${list.length}: ${info.num} ${info.name}`;
        files.push({name:`seals/${info.num}-${info.name.toLowerCase().replace(/[^a-z0-9]+/g,'-')}.png`,data:bytesFromDataUrl(info.sealSrc)});
        if(i%8===0)await new Promise(r=>setTimeout(r,0));
      }
      files.push({name:'temple-of-maat-manifest.json',data:new TextEncoder().encode(JSON.stringify(manifest(),null,2))});
      if(!files.length)throw new Error('No embedded seal PNGs were found.');
      saveBlob(zipStore(files),'Temple-of-Maat-72-Egypto-Solomonic-Seals.zip');
      status.textContent=`Seal pack ready: ${files.length-1} PNG seals + manifest.`;
    }catch(err){console.error(err);status.textContent='Pack failed: '+(err?.message||err);}
    finally{btn.disabled=false;btn.textContent=original;}
  }
  function loadImage(src){return new Promise((res,rej)=>{const img=new Image();img.onload=()=>res(img);img.onerror=()=>rej(new Error('Image could not be loaded.'));img.src=src;});}
  function drawCoverFocal(ctx,img,x,y,w,h,focal,targetY=.34){
    const s=Math.max(w/img.naturalWidth,h/img.naturalHeight),dw=img.naturalWidth*s,dh=img.naturalHeight*s;
    let dx=x+w/2-(focal.x/100)*dw,dy=y+h*targetY-(focal.y/100)*dh;
    dx=Math.min(x,Math.max(x+w-dw,dx));dy=Math.min(y,Math.max(y+h-dh,dy));ctx.drawImage(img,dx,dy,dw,dh);
  }
  function wrapText(ctx,text,x,y,maxW,lineH,maxLines){const words=String(text||'').split(/\s+/);let line='',lines=[];for(const w of words){const t=line?line+' '+w:w;if(ctx.measureText(t).width>maxW&&line){lines.push(line);line=w;}else line=t;}if(line)lines.push(line);lines=lines.slice(0,maxLines||99);lines.forEach((l,i)=>ctx.fillText(l,x,y+i*lineH));return y+lines.length*lineH;}
  async function wallpaperBlob(info){
    const W=1440,H=2560,c=document.createElement('canvas');c.width=W;c.height=H;const ctx=c.getContext('2d');
    ctx.fillStyle='#071018';ctx.fillRect(0,0,W,H);
    const hero=await loadImage(info.imgSrc);drawCoverFocal(ctx,hero,0,0,W,H,info.focal,.30);
    const grad=ctx.createLinearGradient(0,H*.35,0,H);grad.addColorStop(0,'rgba(4,8,12,0)');grad.addColorStop(.52,'rgba(4,8,12,.42)');grad.addColorStop(1,'rgba(4,8,12,.97)');ctx.fillStyle=grad;ctx.fillRect(0,0,W,H);
    ctx.strokeStyle='rgba(64,224,208,.65)';ctx.lineWidth=5;ctx.strokeRect(35,35,W-70,H-70);ctx.strokeStyle='rgba(217,191,115,.55)';ctx.lineWidth=2;ctx.strokeRect(53,53,W-106,H-106);
    if(info.sealSrc){const seal=await loadImage(info.sealSrc);const S=330;ctx.fillStyle='rgba(255,248,224,.13)';ctx.beginPath();ctx.arc(W-S/2-80,110+S/2,S*.54,0,Math.PI*2);ctx.fill();ctx.drawImage(seal,W-S-80,110,S,S);}
    ctx.textAlign='left';ctx.fillStyle='#40e0d0';ctx.font='700 34px monospace';ctx.fillText(`CHAMBER ${info.num} • ${tier(info)}`,92,H-630);
    ctx.fillStyle='#fff3cf';ctx.font='700 76px serif';wrapText(ctx,info.name,92,H-555,W-184,82,2);
    ctx.fillStyle='#d4e0e2';ctx.font='34px serif';wrapText(ctx,info.pairing,92,H-382,W-184,45,2);
    ctx.fillStyle='#d9bf73';ctx.font='700 26px monospace';ctx.fillText('OFFICE',92,H-270);ctx.fillStyle='#f1ead8';ctx.font='28px monospace';wrapText(ctx,info.office,92,H-228,W-184,38,2);
    ctx.fillStyle='#40e0d0';ctx.font='700 23px monospace';ctx.fillText('LAW',92,H-125);ctx.fillStyle='#fff0c8';ctx.font='25px monospace';wrapText(ctx,info.law,170,H-125,W-260,34,2);
    return await new Promise((res,rej)=>c.toBlob(b=>b?res(b):rej(new Error('Wallpaper PNG encoder failed.')),'image/png',1));
  }
  async function downloadWallpaper(info,btn){const o=btn.textContent;btn.disabled=true;btn.textContent='Rendering 1440×2560…';try{saveBlob(await wallpaperBlob(info),`chamber-${info.num}-${info.name.toLowerCase().replace(/[^a-z0-9]+/g,'-')}-wallpaper.png`);}catch(e){alert('Wallpaper export failed: '+(e?.message||e));}finally{btn.disabled=false;btn.textContent=o;}}
  function ensureArtifactShell(){
    if(document.getElementById('tm2-artifact'))return;
    const el=document.createElement('div');el.id='tm2-artifact';el.className='tm2-artifact-backdrop';el.innerHTML='<div class="tm2-artifact-page"></div>';document.body.appendChild(el);
    el.addEventListener('click',ev=>{if(ev.target===el)closeArtifact();});
  }
  function openArtifact(info,pushHash=true){
    ensureArtifactShell();currentArtifact=info;const root=document.getElementById('tm2-artifact');const page=root.querySelector('.tm2-artifact-page');const set=collectedSet();
    page.innerHTML=`
      <div class="tm2-artifact-head"><div><div class="tm-kicker">dedicated chamber artifact</div><h2>Chamber ${esc(info.num)} • ${esc(info.name)}</h2><p>${esc(info.pairing||'')} • ${esc(tier(info))}</p></div><button class="tm2-close" type="button">✕</button></div>
      <div class="tm2-artifact-layout">
        <div class="tm2-portrait-card">
          <div class="tm2-portrait-stage"><img class="tm2-hero" src="${esc(info.imgSrc)}" alt="${esc(info.name)}"><div class="tm2-portrait-gradient"></div><div class="tm2-portrait-caption"><div class="num">CHAMBER ${esc(info.num)}</div><div class="name">${esc(info.name)}</div><div class="pair">${esc(info.pairing||'')}</div></div></div>
          <div class="tm2-seal-dock"><div class="seal">${info.sealSrc?`<img src="${esc(info.sealSrc)}" alt="Seal of ${esc(info.name)}">`:''}</div><div class="tm2-seal-copy"><div class="kicker">EGYPTO-SOLOMONIC SEAL</div><div class="title">Seal of ${esc(info.name)}</div><div class="copy">A separate transparent chamber seal asset, color-coded by pillar and fire, preserved independently from the hero portrait.</div></div></div>
        </div>
        <div class="tm2-data-card">
          <div class="tm2-data-title">CANONICAL CHAMBER RECORD</div>
          <div class="tm2-data-grid">
            <div class="tm2-field"><div class="label">Office</div><div class="value">${esc(info.office||'—')}</div></div>
            <div class="tm2-field"><div class="label">Law</div><div class="value">${esc(info.law||'—')}</div></div>
            <div class="tm2-field"><div class="label">Pillar</div><div class="value">${esc(info.pillar||'—')}</div></div>
            <div class="tm2-field"><div class="label">Fire</div><div class="value">${esc(info.fire||'—')}</div></div>
            <div class="tm2-field"><div class="label">Tier</div><div class="value">${esc(tier(info))}${info.isRecurrence?' • RECURRENCE':''}${info.isTetrad?' • TETRAD':''}</div></div>
            <div class="tm2-field"><div class="label">Face focal</div><div class="value">X ${info.focal.x}% • Y ${info.focal.y}%</div></div>
          </div>
          <div class="tm2-actions">
            <button type="button" class="tm2-btn tm2-seal-download">Download Seal PNG</button>
            <button type="button" class="tm2-btn tm2-plate-download">Download Plate PNG</button>
            <button type="button" class="tm2-btn tm2-wallpaper">Wallpaper 1440×2560</button>
            <button type="button" class="tm2-btn secondary tm2-collect">${set.has(info.num)?'★ Collected':'☆ Collect Chamber'}</button>
            <button type="button" class="tm2-btn secondary full tm2-copy-link">Copy Chamber Link</button>
          </div>
          <div class="tm2-archive-note">Deep link: <span class="tm2-deeplink">#chamber-${esc(info.num)}</span><br>Artifact schema v${VERSION}. Hero image and transparent seal remain separate assets.</div>
        </div>
      </div>`;
    page.querySelector('.tm2-close').onclick=closeArtifact;
    page.querySelector('.tm2-hero').style.objectPosition=`${info.focal.x}% ${info.focal.y}%`;
    page.querySelector('.tm2-seal-download').onclick=()=>info.sealBtn?.click();
    page.querySelector('.tm2-plate-download').onclick=()=>info.plateBtn?.click();
    page.querySelector('.tm2-wallpaper').onclick=ev=>downloadWallpaper(info,ev.currentTarget);
    page.querySelector('.tm2-collect').onclick=ev=>{const next=!collectedSet().has(info.num);setCollected(info.num,next);ev.currentTarget.textContent=next?'★ Collected':'☆ Collect Chamber';};
    page.querySelector('.tm2-copy-link').onclick=async ev=>{const url=location.href.split('#')[0]+'#chamber-'+info.num;try{await navigator.clipboard.writeText(url);ev.currentTarget.textContent='Link copied';setTimeout(()=>ev.currentTarget.textContent='Copy Chamber Link',1200);}catch(e){prompt('Copy chamber link:',url);}};
    root.classList.add('open');
    if(pushHash){syncingHash=true;history.pushState(null,'','#chamber-'+info.num);setTimeout(()=>syncingHash=false,0);}
  }
  function closeArtifact(){const root=document.getElementById('tm2-artifact');root?.classList.remove('open');currentArtifact=null;if(/^#chamber-\d{1,2}$/i.test(location.hash)){syncingHash=true;history.pushState(null,'',location.pathname+location.search);setTimeout(()=>syncingHash=false,0);}}
  function openFromHash(){if(syncingHash)return;const m=location.hash.match(/^#chamber-(\d{1,2})$/i);if(!m)return;const num=String(m[1]).padStart(2,'0');const root=document.getElementById('tm2-artifact');if(currentArtifact&&currentArtifact.num===num&&root?.classList.contains('open'))return;const info=chambers().find(i=>i.num===num);if(info)openArtifact(info,false);}
  function addArtifactButtons(){
    chambers().forEach(info=>{const body=info.card.querySelector('.p-4');let bar=body?.querySelector('.tm-card-collectbar');if(!body)return;if(!bar){bar=document.createElement('div');bar.className='tm-card-collectbar';body.appendChild(bar);}if(!bar.querySelector('.tm2-artifact-open')){const b=document.createElement('button');b.type='button';b.className='tm-collect-toggle tm2-artifact-open';b.textContent='Artifact';b.onclick=ev=>{ev.preventDefault();ev.stopPropagation();openArtifact(info);};bar.appendChild(b);}});
  }
  function enhanceConsole(){
    const actions=document.querySelector('#tm-commit-deck .tm-actions');if(!actions)return;
    if(!actions.querySelector('.tm2-seal-pack')){const b=document.createElement('button');b.type='button';b.className='tm-btn tm2-seal-pack';b.textContent='Download 72 Seals';const s=document.createElement('div');s.className='tm2-pack-status';actions.append(b,s);b.onclick=()=>downloadSealPack(b,s);}
    if(!actions.querySelector('.tm2-manifest')){const b=document.createElement('button');b.type='button';b.className='tm-btn tm-ghost tm2-manifest';b.textContent='Export Manifest';b.onclick=downloadManifest;actions.appendChild(b);}
  }
  function exposeData(){window.TempleArchiveData=manifest();window.TempleArchive={version:VERSION,chambers,manifest,openChamber:(n)=>{const info=chambers().find(i=>i.num===String(n).padStart(2,'0'));if(info)openArtifact(info);},downloadManifest,downloadSealPack:()=>{const fake={textContent:'Download 72 Seals',disabled:false},status={textContent:'',classList:{add(){}}};return downloadSealPack(fake,status);}};}
  function run(){applyFocals();addArtifactButtons();enhanceConsole();ensureArtifactShell();exposeData();openFromHash();}
  let q=false;function schedule(){if(q)return;q=true;requestAnimationFrame(()=>{q=false;run();});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule);else schedule();
  window.addEventListener('load',schedule);window.addEventListener('hashchange',openFromHash);window.addEventListener('resize',applyFocals);
  document.addEventListener('temple:collection-change',schedule);
  const obs=new MutationObserver(schedule);obs.observe(document.getElementById('root') || document.body,{childList:true,subtree:true});
  setTimeout(schedule,800);setTimeout(schedule,1800);setTimeout(schedule,3500);
})();

/* Runtime block 7 */
(function(){
  const CONSOLE_STATE_KEY = 'temple_console_window_state_v1';
  function storage(){ return window.__templeLocal || window.localStorage; }
  function readState(){
    try{ return storage().getItem(CONSOLE_STATE_KEY) || 'open'; }
    catch(e){ return 'open'; }
  }
  function writeState(value){
    try{ storage().setItem(CONSOLE_STATE_KEY, value); }catch(e){}
  }
  function ensureLauncher(){
    let launcher = document.getElementById('tm-console-launcher');
    if(!launcher){
      launcher = document.createElement('button');
      launcher.id = 'tm-console-launcher';
      launcher.type = 'button';
      launcher.className = 'tm-console-launcher';
      launcher.innerHTML = '<span class="tm-launcher-label">Temple</span><span class="tm-launcher-title">Open Console</span>';
      launcher.addEventListener('click', function(){ setConsoleState('open'); });
      document.body.appendChild(launcher);
    }
    return launcher;
  }
  function applyState(deck, state){
    const launcher = ensureLauncher();
    deck.classList.remove('tm-minimized','tm-hidden');
    if(state === 'hidden'){
      deck.classList.add('tm-hidden');
      deck.style.display = 'none';
      launcher.classList.add('show');
    } else {
      deck.style.display = '';
      launcher.classList.remove('show');
      if(state === 'minimized') deck.classList.add('tm-minimized');
    }
    const minBtn = deck.querySelector('[data-console-action="minimize"]');
    if(minBtn){
      minBtn.textContent = state === 'minimized' ? '▣' : '–';
      minBtn.title = state === 'minimized' ? 'Restore console' : 'Minimize console';
      minBtn.setAttribute('aria-label', minBtn.title);
    }
  }
  function setConsoleState(next){
    const deck = document.getElementById('tm-commit-deck');
    if(!deck) return;
    writeState(next);
    applyState(deck, next);
  }
  function ensureDeckControls(){
    const deck = document.getElementById('tm-commit-deck');
    if(!deck) return;
    const header = deck.querySelector('.tm-commit-header');
    if(!header) return;
    if(!header.querySelector('.tm-commit-heading')){
      const heading = document.createElement('div');
      heading.className = 'tm-commit-heading';
      const kids = Array.from(header.childNodes);
      kids.forEach(node => heading.appendChild(node));
      header.appendChild(heading);
    }
    let controls = header.querySelector('.tm-commit-controls');
    if(!controls){
      controls = document.createElement('div');
      controls.className = 'tm-commit-controls';
      controls.innerHTML = '<button type="button" class="tm-icon-btn" data-console-action="minimize" title="Minimize console" aria-label="Minimize console">–</button><button type="button" class="tm-icon-btn" data-console-action="hide" title="Hide console" aria-label="Hide console">×</button>';
      header.appendChild(controls);
      controls.querySelector('[data-console-action="minimize"]').addEventListener('click', function(ev){
        ev.preventDefault(); ev.stopPropagation();
        const state = readState();
        setConsoleState(state === 'minimized' ? 'open' : 'minimized');
      });
      controls.querySelector('[data-console-action="hide"]').addEventListener('click', function(ev){
        ev.preventDefault(); ev.stopPropagation();
        setConsoleState('hidden');
      });
    }
    applyState(deck, readState());
  }
  let scheduled = false;
  function schedule(){
    if(scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      ensureLauncher();
      ensureDeckControls();
    });
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', schedule);
  else schedule();
  window.addEventListener('load', schedule);
  const obs = new MutationObserver(() => schedule());
  obs.observe(document.documentElement, {childList:true, subtree:true});
  setTimeout(schedule, 500);
  setTimeout(schedule, 1500);
})();

/* Runtime block 8 */
(function(){
  const installBtn=document.getElementById('temple-pwa-install');
  const offlineBadge=document.getElementById('temple-pwa-status');
  const updateToast=document.getElementById('temple-pwa-update');
  let deferredPrompt=null;
  let refreshing=false;
  let waitingWorker=null;

  function isStandalone(){
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  }
  function isIOS(){ return /iphone|ipad|ipod/i.test(navigator.userAgent); }
  function updateOnlineState(){ offlineBadge.classList.toggle('show', !navigator.onLine); }
  function showInstallFallback(){
    if(isStandalone()) return;
    installBtn.classList.add('show');
  }
  function hideInstall(){ installBtn.classList.remove('show'); }

  window.addEventListener('beforeinstallprompt',(event)=>{
    event.preventDefault();
    deferredPrompt=event;
    if(!isStandalone()) installBtn.classList.add('show');
  });
  window.addEventListener('appinstalled',()=>{ deferredPrompt=null; hideInstall(); });
  window.addEventListener('online',updateOnlineState);
  window.addEventListener('offline',updateOnlineState);
  updateOnlineState();

  installBtn.addEventListener('click',async()=>{
    if(deferredPrompt){
      deferredPrompt.prompt();
      try{ await deferredPrompt.userChoice; }catch(e){}
      deferredPrompt=null;
      hideInstall();
      return;
    }
    if(isIOS()) alert('To install: tap the Share button in Safari, then choose “Add to Home Screen”.');
    else alert('Open your browser menu and choose “Install app” or “Add to Home screen”.');
  });

  function showUpdate(worker){
    waitingWorker=worker;
    updateToast.classList.add('show');
  }
  updateToast.querySelector('button').addEventListener('click',()=>{
    if(waitingWorker) waitingWorker.postMessage({type:'SKIP_WAITING'});
  });

  if('serviceWorker' in navigator){
    window.addEventListener('load',async()=>{
      try{
        const registration=await navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'});
        if(registration.waiting) showUpdate(registration.waiting);
        registration.addEventListener('updatefound',()=>{
          const installing=registration.installing;
          if(!installing) return;
          installing.addEventListener('statechange',()=>{
            if(installing.state==='installed' && navigator.serviceWorker.controller) showUpdate(installing);
          });
        });
        setInterval(()=>registration.update().catch(()=>{}),60*60*1000);
      }catch(error){ console.error('Temple PWA service worker registration failed:',error); }
    });
    navigator.serviceWorker.addEventListener('controllerchange',()=>{
      if(refreshing) return;
      refreshing=true;
      location.reload();
    });
  }

  if(!isStandalone()) setTimeout(showInstallFallback,1800);
  else hideInstall();
})();

/* Runtime block 9 */
(function(){
  const ADMIN_NAME='Alberto Ramirez';
  const ADMIN_EMAIL='christus.kalki888@gmail.com';
  function addAdminInfo(){
    const footer=document.querySelector('footer');
    if(!footer || footer.querySelector('.temple-site-admin-card')) return;
    const inner=footer.querySelector('.max-w-\\[1600px\\]') || footer.firstElementChild || footer;
    const firstColumn=inner.querySelector(':scope > div') || inner;
    const card=document.createElement('div');
    card.className='temple-site-admin-card';
    card.innerHTML='<div class="temple-site-admin-label">Site Administrator / Contact</div>'+
      '<div class="temple-site-admin-name">'+ADMIN_NAME+'</div>'+
      '<div class="temple-site-admin-email"><a href="mailto:'+ADMIN_EMAIL+'" aria-label="Email site administrator '+ADMIN_NAME+'">'+ADMIN_EMAIL+'</a></div>'+
      '<div class="temple-site-admin-copyright">Copyright © 2026 Alberto Ramirez. All rights reserved.</div>'+
      '<div class="temple-site-admin-rights">Third-party libraries, fonts, and source materials remain subject to their respective rights and licenses.</div>';
    firstColumn.appendChild(card);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',addAdminInfo); else addAdminInfo();
  window.addEventListener('load',addAdminInfo);
  const obs=new MutationObserver(addAdminInfo);
  obs.observe(document.getElementById('root')||document.body,{childList:true,subtree:true});
  setTimeout(addAdminInfo,500); setTimeout(addAdminInfo,1500);
})();
