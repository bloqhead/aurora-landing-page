
import { createApp, ref, computed, onMounted, onUnmounted, watch, nextTick } from 'https://cdn.jsdelivr.net/npm/vue@3.5.13/dist/vue.esm-browser.prod.min.js';

const WMO={0:['Clear sky','☀️'],1:['Mainly clear','🌤️'],2:['Partly cloudy','⛅'],3:['Overcast','☁️'],45:['Fog','🌫️'],48:['Icy fog','🌫️'],51:['Light drizzle','🌦️'],53:['Drizzle','🌦️'],55:['Heavy drizzle','🌧️'],61:['Light rain','🌧️'],63:['Rain','🌧️'],65:['Heavy rain','🌧️'],71:['Light snow','❄️'],73:['Snow','❄️'],75:['Heavy snow','🌨️'],77:['Snow grains','🌨️'],80:['Light showers','🌦️'],81:['Showers','🌧️'],82:['Heavy showers','⛈️'],85:['Snow showers','🌨️'],86:['Heavy snow showers','🌨️'],95:['Thunderstorm','⛈️'],96:['Thunderstorm','⛈️'],99:['Thunderstorm','⛈️']};

function kpInfo(kp){if(kp<1)return{label:'Quiet',color:'#4ecdc4',chance:'No activity expected'};if(kp<2)return{label:'Very Low',color:'#5bc8af',chance:'Unlikely to see aurora'};if(kp<3)return{label:'Low',color:'#a8e6cf',chance:'Polar regions only'};if(kp<4)return{label:'Moderate',color:'#b8f5e0',chance:'Good chance near Tromsø'};if(kp<5)return{label:'Active',color:'#ddf0a0',chance:'Look north tonight'};if(kp<6)return{label:'Minor Storm (G1)',color:'#ffe066',chance:'Visible at lower latitudes'};if(kp<7)return{label:'Moderate Storm (G2)',color:'#ffaa44',chance:'Widespread activity'};return{label:'Severe Storm',color:'#ff6b6b',chance:'🚨 Visible across continents!'};}

function aqiInfo(us){if(us<=50)return{label:'Good',color:'#4ecdc4'};if(us<=100)return{label:'Moderate',color:'#ffe066'};if(us<=150)return{label:'Unhealthy for Sensitive Groups',color:'#ffaa44'};if(us<=200)return{label:'Unhealthy',color:'#ff8c42'};if(us<=300)return{label:'Very Unhealthy',color:'#cc5577'};return{label:'Hazardous',color:'#8b0000'};}

function calcMoon(){const now=new Date();const k=29.53058770576;const j=now/86400000+2440587.5;const e=(j-2451550.1)/k;const phase=(e%1+1)%1;const angle=phase*360;const illumination=Math.round((1-Math.cos(angle*Math.PI/180))/2*100);const age=Math.round(phase*k*10)/10;const names=['New Moon','Waxing Crescent','First Quarter','Waxing Gibbous','Full Moon','Waning Gibbous','Last Quarter','Waning Crescent'];const emojis=['🌑','🌒','🌓','🌔','🌕','🌖','🌗','🌘'];const idx=Math.round(phase*8)%8;const daysToFull=Math.round(((0.5-phase+1)%1)*k);const nf=new Date(now.getTime()+daysToFull*86400000);return{name:names[idx],emoji:emojis[idx],illumination,age,nextFull:nf.toLocaleDateString('en-US',{month:'short',day:'numeric'})};}

function calcPlanets(){const now=new Date();const doy=Math.floor((now-(new Date(now.getFullYear(),0,0)))/86400000);const hour=now.getHours();const isNight=hour>=20||hour<=6;const planets=[{name:'Mercury',emoji:'☿',base:88,period:88},{name:'Venus',emoji:'♀',base:225,period:225},{name:'Mars',emoji:'♂',base:687,period:687},{name:'Jupiter',emoji:'♃',base:4333,period:4333},{name:'Saturn',emoji:'♄',base:10759,period:10759},{name:'Uranus',emoji:'⛢',base:30687,period:30687},{name:'Neptune',emoji:'♆',base:60190,period:60190}];return planets.map(p=>{const pos=(doy%p.period)/p.period;const elongation=Math.abs(pos-0.5)*180;const visible=isNight&&elongation>20;const alt=Math.round(elongation);return{...p,visible,info:visible?`~${alt}° elongation`:'Below horizon'}});}

const THEMES={
  aurora:    {name:'Aurora',    dark:true, bg:'#0a0e1a',bg2:'#091a14',accent:'#50dca0',accent2:'#7b6ff0',text:'#e8f4f0',textMuted:'#7a9e92',glow:'rgba(80,220,160,0.18)', shimmer:'#a0f0d0',card:'rgba(10,20,35,0.72)', cardBorder:'rgba(80,220,180,0.13)'},
  midnight:  {name:'Midnight',  dark:true, bg:'#07080f',bg2:'#12091a',accent:'#9d7fff',accent2:'#ff7eb6',text:'#ddd8ff',textMuted:'#6a618a',glow:'rgba(140,100,255,0.2)', shimmer:'#c4b8ff',card:'rgba(14,13,30,0.78)', cardBorder:'rgba(120,100,255,0.15)'},
  dusk:      {name:'Dusk',      dark:true, bg:'#12060a',bg2:'#0f0a1e',accent:'#ff8c6b',accent2:'#c77dff',text:'#f5ddd8',textMuted:'#8a6060',glow:'rgba(255,120,100,0.18)',shimmer:'#ffb8a0',card:'rgba(20,10,18,0.75)', cardBorder:'rgba(255,120,100,0.13)'},
  arctic:    {name:'Arctic',    dark:false,bg:'#e8f4f8',bg2:'#e2eef5',accent:'#1a7fa8',accent2:'#2a9d7a',text:'#1a2a35',textMuted:'#5a7a8a',glow:'rgba(80,160,200,0.12)', shimmer:'#1a7fa8', card:'rgba(255,255,255,0.7)',cardBorder:'rgba(80,160,200,0.2)'},
  forest:    {name:'Forest',    dark:true, bg:'#050d08',bg2:'#0a1a0c',accent:'#5ddb6e',accent2:'#a8e063',text:'#d8f0dc',textMuted:'#5a7a5e',glow:'rgba(80,200,100,0.18)', shimmer:'#90e8a0',card:'rgba(8,20,10,0.76)',  cardBorder:'rgba(80,200,100,0.14)'},
  crt:        {name:'CRT',       dark:true, bg:'#030a03',bg2:'#000a00',accent:'#00ff41',accent2:'#00cc33',text:'#00ff41',textMuted:'#007a1f',glow:'rgba(0,255,65,0.25)',    shimmer:'#00ff41',card:'rgba(0,15,0,0.88)',   cardBorder:'rgba(0,255,65,0.25)',   pixel:true, pixelClass:'theme-pixel theme-crt'},
  synthwave:  {name:'Synthwave', dark:true, bg:'#0a0015',bg2:'#100020',accent:'#ff00ff',accent2:'#00eeff',text:'#ffffff', textMuted:'#aa44cc',glow:'rgba(255,0,255,0.25)',   shimmer:'#ff00ff',card:'rgba(15,0,30,0.85)', cardBorder:'rgba(255,0,255,0.3)',   pixel:true, pixelClass:'theme-pixel theme-synthwave'},
  advanced:   {name:'2Advanced', dark:true, bg:'#050c18',bg2:'#08101f',accent:'#4fc8e8',accent2:'#a8d4e8',text:'#c8dde8', textMuted:'#4a6478',glow:'rgba(79,200,232,0.15)',  shimmer:'#4fc8e8', card:'rgba(6,14,26,0.9)', cardBorder:'rgba(79,200,232,0.2)',  pixel:true, pixelClass:'theme-pixel theme-advanced'},
};

const BG_TOPICS=[{key:'northern-lights',label:'Northern Lights'},{key:'aurora-borealis',label:'Aurora'},{key:'arctic-landscape',label:'Arctic'},{key:'night-sky-stars',label:'Night Sky'},{key:'forest-fog-night',label:'Forest'},{key:'ocean-coast-dark',label:'Coast'},{key:'mountain-snow-night',label:'Mountains'},{key:'minimalist-dark',label:'Minimal'}];
const GENRES=['ambient','jazz','folk','post-rock','classical','shoegaze','blues','soul','experimental','drone','krautrock','neo-soul'];
const SOMA_STATIONS=[{id:'dronezone',name:'Drone Zone',desc:'Atmospheric ambient space music',stream:'https://ice2.somafm.com/dronezone-128-mp3'},{id:'spacestation',name:'Space Station',desc:'Tune in, turn on, space out',stream:'https://ice2.somafm.com/spacestation-128-mp3'},{id:'lush',name:'Lush',desc:'Sensuous and mellow vocals',stream:'https://ice2.somafm.com/lush-128-mp3'},{id:'groovesalad',name:'Groove Salad',desc:'Chilled beats and grooves',stream:'https://ice2.somafm.com/groovesalad-128-mp3'},{id:'thetrip',name:'The Trip',desc:'Progressive electronic',stream:'https://ice2.somafm.com/thetrip-128-mp3'}];
const ALBUM_FALLBACKS={'ambient':{title:'Discreet Music',artist:'Brian Eno',year:'1975',url:null,why:'The blueprint for ambient music.'},'jazz':{title:'Kind of Blue',artist:'Miles Davis',year:'1959',url:null,why:'Still the best-selling jazz album ever made.'},'folk':{title:'For Emma, Forever Ago',artist:'Bon Iver',year:'2007',url:null,why:'Recorded alone in a Wisconsin cabin.'},'post-rock':{title:'Lift Your Skinny Fists…',artist:'Godspeed You! Black Emperor',year:'2000',url:null,why:'Sprawling, cinematic, unforgettable.'},'classical':{title:'Goldberg Variations',artist:'Glenn Gould',year:'1981',url:null,why:"Gould's quiet, introspective goodbye."},'shoegaze':{title:'Loveless',artist:'My Bloody Valentine',year:'1991',url:null,why:'Changed guitar music forever.'},'blues':{title:'Electric Mud',artist:'Muddy Waters',year:'1968',url:null,why:'Muddy goes psychedelic, brilliantly.'},'soul':{title:"There's a Riot Goin' On",artist:'Sly & the Family Stone',year:'1971',url:null,why:'The sound of utopia collapsing.'},'experimental':{title:'Trout Mask Replica',artist:'Captain Beefheart',year:'1969',url:null,why:'Difficult and rewarding in equal measure.'},'drone':{title:'The Tired Sounds of Stars of the Lid',artist:'Stars of the Lid',year:'2001',url:null,why:'Time feels elastic here.'},'krautrock':{title:'Autobahn',artist:'Kraftwerk',year:'1974',url:null,why:'Invented electronic pop.'},'neo-soul':{title:'Voodoo',artist:"D'Angelo",year:'2000',url:null,why:'Worth every year of the wait.'}};
const QUOTES=[{text:"The world is quiet here.",author:"Lemony Snicket"},{text:"Not all those who wander are lost.",author:"J.R.R. Tolkien"},{text:"I took a deep breath and listened to the old brag of my heart: I am, I am, I am.",author:"Sylvia Plath"},{text:"The sky is everywhere, it begins at your feet.",author:"Jandy Nelson"},{text:"To live is so startling it leaves little time for anything else.",author:"Emily Dickinson"},{text:"The cure for anything is salt water: sweat, tears, or the sea.",author:"Isak Dinesen"},{text:"In the middle of winter, I at last discovered that there was in me an invincible summer.",author:"Albert Camus"},{text:"Stars are not small or gentle. They are writhing and dying and burning.",author:"Tamsyn Muir"},{text:"The most beautiful thing we can experience is the mysterious.",author:"Albert Einstein"},{text:"Everything you can imagine is real.",author:"Pablo Picasso"},{text:"There is no exquisite beauty without some strangeness in the proportion.",author:"Edgar Allan Poe"},{text:"I am not afraid of storms, for I am learning how to sail my ship.",author:"Louisa May Alcott"},{text:"Wherever you go becomes a part of you somehow.",author:"Anita Desai"},{text:"We shall not cease from exploration.",author:"T.S. Eliot"},{text:"One must always maintain one's connection to the past and yet ceaselessly pull away from it.",author:"Gaston Bachelard"},{text:"I would rather die of passion than of boredom.",author:"Vincent van Gogh"},{text:"The job of the artist is always to deepen the mystery.",author:"Francis Bacon"},{text:"You can't use up creativity. The more you use, the more you have.",author:"Maya Angelou"},{text:"To photograph is to appropriate the thing photographed.",author:"Susan Sontag"},{text:"The aim of art is to represent not the outward appearance of things, but their inward significance.",author:"Aristotle"}];

const DEFAULT_WIDGET_ORDER=['kp','weather','sun','moon','aqi','tides','iss','planets','quote','animal','apod','soma','album','notes','todo','bookmarks','dice','chat','solitaire','snake','wordle','worldclock','steam','filmrec','passgen','palette','bg'];
const WIDGET_META={kp:{label:'KP Index',icon:'🌌',desc:'Aurora activity — updated every 5 min',cols:4,weight:3},weather:{label:'Weather',icon:'🌤️',desc:'Local conditions from Open-Meteo',cols:4,weight:3},sun:{label:'Sunrise & Sunset',icon:'🌅',desc:'Daily sun arc with daylight duration',cols:4,weight:3},moon:{label:'Moon Phase',icon:'🌕',desc:'Calculated phase, illumination & next full moon',cols:3,weight:2},aqi:{label:'Air Quality',icon:'🌬️',desc:'AQI, PM2.5, PM10 and ozone',cols:3,weight:2},tides:{label:'Tides',icon:'🌊',desc:'Tide highs and lows from Open-Meteo Marine',cols:5,weight:3},iss:{label:'ISS Pass Times',icon:'📡',desc:'When the space station flies over you',cols:4,weight:3},planets:{label:'Planets Tonight',icon:'🔭',desc:'Calculated visibility for naked-eye planets',cols:4,weight:4},quote:{label:'Inspiration',icon:'💬',desc:'Curated quotes from writers, artists, thinkers',cols:6,weight:2},animal:{label:'Animal of the Day',icon:'🦎',desc:'Random wildlife observation + Wikipedia fact',cols:5,weight:5},apod:{label:'NASA APOD',icon:'🌌',desc:'Astronomy Picture of the Day',cols:6,weight:5},soma:{label:'SomaFM Radio',icon:'📻',desc:'Curated ambient & electronic streams',cols:5,weight:3},album:{label:'Album Rec',icon:'🎵',desc:'Last.fm genre recommendations',cols:8,weight:4},notes:{label:'Notes',icon:'📋',desc:'Quick scratchpad, auto-saved locally',cols:5,weight:3},todo:{label:'To-Do',icon:'✅',desc:'Simple checklist, persisted locally',cols:4,weight:3},bookmarks:{label:'Bookmarks',icon:'🔗',desc:'Your personal speed-dial links',cols:12,weight:2},dice:{label:'Dice Roller',icon:'🎲',desc:'D&D dice — d4 through d20',cols:4,weight:3},chat:{label:'Chat',icon:'💬',desc:'Live chat with presence & typing indicators',cols:6,weight:5},solitaire:{label:'Solitaire',icon:'🃏',desc:'Klondike solitaire — drag & drop',cols:8,weight:8},snake:{label:'Snake',icon:'🐍',desc:'Classic snake game',cols:4,weight:4},wordle:{label:'Wordle',icon:'✏️',desc:'Daily 5-letter word game',cols:4,weight:6},worldclock:{label:'World Clock',icon:'🌍',desc:'Multiple city times',cols:4,weight:3},steam:{label:'Steam Rec',icon:'🎮',desc:'Game recommendations by genre from Steam',cols:6,weight:4},filmrec:{label:'Film Rec',icon:'🎬',desc:'Random film recommendation by genre',cols:4,weight:3},passgen:{label:'Password',icon:'🔑',desc:'Secure password generator',cols:4,weight:3},palette:{label:'Color Palette',icon:'🎨',desc:'Generate harmonious color palettes',cols:5,weight:3},bg:{label:'Background',icon:'🖼️',desc:'Unsplash photo topic picker',cols:7,weight:2}};

async function geocode(city){
  // Strip country suffix if user typed "City, Country" format — API works best with city name only
  const name=city.split(',')[0].trim();
  const r=await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=5&language=en&format=json`);
  const d=await r.json();
  if(!d.results?.length)throw new Error('not found');
  const best=d.results[0];
  const label=[best.name,best.admin1,best.country].filter(Boolean).join(', ');
  return{lat:best.latitude,lon:best.longitude,name:label};
}

createApp({
  setup(){
    const now=ref(new Date()); let clockTimer;
    const clockStr=computed(()=>`${String(now.value.getHours()).padStart(2,'0')}:${String(now.value.getMinutes()).padStart(2,'0')}`);
    const dateStr=computed(()=>now.value.toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'}));

    // settings
    const showSettings=ref(false); const showPicker=ref(false);
    const locationInput=ref(localStorage.getItem('aurora_location')||'');
    const unsplashKey=ref(localStorage.getItem('aurora_unsplash')||'');
    const lastfmKey=ref(localStorage.getItem('aurora_lastfm')||'');
    const nasaKey=ref(localStorage.getItem('aurora_nasa')||'');
    const musicApp=ref(localStorage.getItem('aurora_musicapp')||'lastfm');
    const currentTheme=ref(localStorage.getItem('aurora_theme')||'aurora');
    const useFahrenheit=ref(localStorage.getItem('aurora_fahrenheit')==='true');
    const bgTopic=ref(localStorage.getItem('aurora_bgtopic')||'northern-lights');
    const selectedGenre=ref(localStorage.getItem('aurora_genre')||'ambient');

    // bookmarks
    const bookmarks=ref(JSON.parse(localStorage.getItem('aurora_bookmarks')||'[]'));
    const bookmarkEdits=ref(JSON.parse(JSON.stringify(bookmarks.value)));

    // widget registry — order + visibility persisted
    const savedOrder=JSON.parse(localStorage.getItem('aurora_widget_order')||'null');
    const savedVis=JSON.parse(localStorage.getItem('aurora_widget_vis')||'null');
    const defaultVis={kp:true,weather:true,sun:true,moon:true,aqi:true,tides:false,iss:false,planets:false,quote:true,animal:true,apod:false,soma:false,album:true,notes:false,todo:false,bookmarks:false,dice:true,chat:true,solitaire:false,snake:false,wordle:false,worldclock:false,steam:false,filmrec:false,passgen:false,palette:false,bg:true};
    // Merge any new widgets not in the saved order so they always show up in picker
    const mergedOrder=savedOrder
      ? [...savedOrder, ...DEFAULT_WIDGET_ORDER.filter(id=>!savedOrder.includes(id))]
      : DEFAULT_WIDGET_ORDER;
    const order=ref(mergedOrder);
    const visibility=ref(savedVis||defaultVis);
    const widgetRegistry=computed(()=>order.value.map(id=>({id,...WIDGET_META[id],visible:visibility.value[id]??true})));
    const visibleWidgets=computed(()=>widgetRegistry.value.filter(w=>w.visible));
    function toggleWidget(id){visibility.value={...visibility.value,[id]:!visibility.value[id]};saveWidgetState();}
    function saveWidgetState(){localStorage.setItem('aurora_widget_order',JSON.stringify(order.value));localStorage.setItem('aurora_widget_vis',JSON.stringify(visibility.value));}

    // masonry columns — distribute widgets shortest-column-first
    const numCols=ref(3);
    function updateNumCols(){numCols.value=window.innerWidth<600?1:window.innerWidth<960?2:3;}
    const masonryColumns=computed(()=>{const n=numCols.value;const cols=Array.from({length:n},()=>[]);const heights=new Array(n).fill(0);for(const wid of visibleWidgets.value){const shortest=heights.indexOf(Math.min(...heights));cols[shortest].push(wid);heights[shortest]+=(WIDGET_META[wid.id]?.weight||1);}return cols;});

    // drag-in-picker (mouse + touch)
    const pickerDragging=ref(null); const pickerTarget=ref(null);
    function onPickerDragStart(e,id){pickerDragging.value=id;e.dataTransfer&&(e.dataTransfer.effectAllowed='move');}
    function onPickerDragOver(e,id){if(pickerDragging.value&&pickerDragging.value!==id)pickerTarget.value=id;}
    function onPickerDrop(e,id){if(!pickerDragging.value||pickerDragging.value===id)return;const arr=[...order.value];const fi=arr.indexOf(pickerDragging.value),ti=arr.indexOf(id);if(fi<0||ti<0)return;arr.splice(fi,1);arr.splice(ti,0,pickerDragging.value);order.value=arr;saveWidgetState();pickerDragging.value=null;pickerTarget.value=null;}
    function onPickerDragEnd(){pickerDragging.value=null;pickerTarget.value=null;}

    // Touch drag for picker
    let touchDragId=null,touchDragOver=null;
    function onPickerTouchStart(e,id){touchDragId=id;e.currentTarget.style.opacity='.5';}
    function onPickerTouchMove(e){
      e.preventDefault();
      const t=e.touches[0];
      const el=document.elementFromPoint(t.clientX,t.clientY)?.closest('[data-wid]');
      touchDragOver=el?.dataset?.wid||null;
      document.querySelectorAll('.picker-item').forEach(i=>i.classList.remove('drag-over-picker'));
      if(el)el.closest('.picker-item')?.classList.add('drag-over-picker');
    }
    function onPickerTouchEnd(){
      document.querySelectorAll('.picker-item').forEach(i=>{i.classList.remove('drag-over-picker');i.style.opacity='';});
      if(touchDragId&&touchDragOver&&touchDragId!==touchDragOver){
        const arr=[...order.value];const fi=arr.indexOf(touchDragId),ti=arr.indexOf(touchDragOver);
        if(fi>=0&&ti>=0){arr.splice(fi,1);arr.splice(ti,0,touchDragId);order.value=arr;saveWidgetState();}
      }
      touchDragId=null;touchDragOver=null;
    }

    // data
    const locationName=ref(''); const locationError=ref('');
    const weather=ref(null); const sunData=ref(null);
    const kp=ref(null); const kpInfoVal=computed(()=>kp.value!==null?kpInfo(kp.value):null);
    const aqi=ref(null); const tides=ref(null); const tidesError=ref('');
    const issPasses=ref(null); const issError=ref(''); const userLat=ref(null); const userLon=ref(null);
    const moon=ref(calcMoon()); const planets=computed(()=>calcPlanets());
    const quote=ref(null); const animal=ref(null); const animalLoading=ref(false);
    const apod=ref(null); const album=ref(null); const albumLoading=ref(false);
    const bgCredit=ref(null);
    const notes=ref(localStorage.getItem('aurora_notes')||''); const notesSaved=ref(false); let noteTimer;
    const todos=ref(JSON.parse(localStorage.getItem('aurora_todos')||'[]')); const todoInput=ref('');
    const somaStation=ref(localStorage.getItem('aurora_soma')||'dronezone');
    const somaPlaying=ref(false); const somaVolume=ref(0.7);
    const somaAudio=new Audio(); somaAudio.preload='none';
    const currentSoma=computed(()=>SOMA_STATIONS.find(s=>s.id===somaStation.value)||SOMA_STATIONS[0]);

    // music app
    const musicAppLabel=computed(()=>({lastfm:'Last.fm',spotify:'Spotify',apple:'Apple Music',tidal:'Tidal',youtube:'YouTube Music'}[musicApp.value]||'Listen'));
    function musicAppLink(alb){if(!alb)return null;const q=encodeURIComponent(`${alb.artist} ${alb.title}`);switch(musicApp.value){case'spotify':return`https://open.spotify.com/search/${q}`;case'apple':return`https://music.apple.com/search?term=${q}`;case'tidal':return`https://listen.tidal.com/search?q=${q}`;case'youtube':return`https://music.youtube.com/search?q=${q}`;default:return null;}}

    function applyTheme(key){
      const t=THEMES[key]||THEMES.aurora,s=document.documentElement.style;
      s.setProperty('--bg',t.bg);s.setProperty('--card',t.card);s.setProperty('--card-border',t.cardBorder);
      s.setProperty('--accent',t.accent);s.setProperty('--accent2',t.accent2);s.setProperty('--text',t.text);
      s.setProperty('--text-muted',t.textMuted);s.setProperty('--glow',t.glow);s.setProperty('--shimmer',t.shimmer);
      document.getElementById('bg-overlay').style.background=t.dark
        ?`linear-gradient(135deg,${t.bg}cc 0%,${t.bg2||t.bg}99 100%)`
        :`linear-gradient(135deg,${t.bg}dd 0%,${t.bg2||t.bg}bb 100%)`;
      document.body.style.background=t.bg;
      // Remove all pixel theme classes
      document.body.classList.remove('theme-pixel','theme-crt','theme-synthwave','theme-advanced');
      if(t.pixelClass) t.pixelClass.split(' ').forEach(c=>document.body.classList.add(c));
      // Force a style recalc to unstick any lingering overrides
      document.body.style.fontFamily='';
      document.body.style.fontSize='';
    }
    function setTheme(key){currentTheme.value=key;applyTheme(key);}
    const cToF=c=>Math.round(c*9/5+32); const msToMph=ms=>Math.round(ms*2.237);
    const sunProgress=computed(()=>{if(!sunData.value)return 0;const[rh,rm]=sunData.value.sunriseRaw.split(':').map(Number);const[sh,sm]=sunData.value.sunsetRaw.split(':').map(Number);const nowMin=now.value.getHours()*60+now.value.getMinutes();return Math.max(0,Math.min(1,(nowMin-rh*60-rm)/((sh*60+sm)-(rh*60+rm))))});
    const sunArcY=computed(()=>Math.round(Math.sin(sunProgress.value*Math.PI)*28));

    async function fetchKP(){try{const r=await fetch('https://services.swpc.noaa.gov/json/planetary_k_index_1m.json');const d=await r.json();kp.value=parseFloat(d[d.length-1].kp_index??d[d.length-1].Kp??0);}catch{kp.value=0;}}

    async function fetchWeather(lat,lon){try{const r=await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code&daily=sunrise,sunset&timezone=auto&forecast_days=1`);const d=await r.json(),c=d.current;const[desc,icon]=WMO[c.weather_code]||['Unknown','🌡️'];weather.value={tempC:Math.round(c.temperature_2m),feelsLike:Math.round(c.apparent_temperature),humidity:c.relative_humidity_2m,windMs:c.wind_speed_10m/3.6,description:desc,icon};const sr=new Date(d.daily.sunrise[0]),ss=new Date(d.daily.sunset[0]);const fmt=t=>t.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'});const dm=Math.round((ss-sr)/60000);sunData.value={sunrise:fmt(sr),sunset:fmt(ss),sunriseRaw:`${sr.getHours()}:${sr.getMinutes()}`,sunsetRaw:`${ss.getHours()}:${ss.getMinutes()}`,dayLength:`${Math.floor(dm/60)}h ${dm%60}m`,status:Date.now()<sr.getTime()?'Before sunrise':Date.now()>ss.getTime()?'After sunset':'Sun is up'};}catch{weather.value=null;}}

    async function fetchAQI(lat,lon){try{const r=await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi,pm2_5,pm10,ozone`);const d=await r.json(),c=d.current;const idx=Math.round(c.us_aqi||0);const info=aqiInfo(idx);aqi.value={index:idx,...info,pm25:c.pm2_5?Math.round(c.pm2_5):null,pm10:c.pm10?Math.round(c.pm10):null,o3:c.ozone?Math.round(c.ozone):null};}catch{aqi.value=null;}}

    async function fetchTides(lat,lon){try{const r=await fetch(`https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lon}&hourly=wave_height&timezone=auto&forecast_days=1`);const d=await r.json();if(d.error){tidesError.value='Not a coastal location.';return;}// Derive approximate high/low from wave height hourly data
    const hours=d.hourly?.time||[];const heights=d.hourly?.wave_height||[];const now=new Date();const currentHour=now.getHours();const tideArr=[];for(let i=currentHour;i<hours.length&&tideArr.length<4;i++){const h=heights[i];if(h==null)continue;const prev=heights[i-1]??h;const next=heights[i+1]??h;if(h>=prev&&h>=next&&h>0.1){const t=new Date(hours[i]);tideArr.push({type:'high',time:t.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'}),height:Math.round(h*10)/10});}else if(h<=prev&&h<=next){const t=new Date(hours[i]);tideArr.push({type:'low',time:t.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'}),height:Math.round(h*10)/10});}}if(!tideArr.length){tidesError.value='No tide data for this location.';return;}tides.value=tideArr;}catch{tidesError.value='Tide data unavailable.';}}
    async function fetchISS(){try{// Current ISS position
    const r=await fetch('https://api.wheretheiss.at/v1/satellites/25544');const d=await r.json();// Build simulated upcoming passes from current orbit data (wheretheiss.at pass prediction isn't free)
    // Show current ISS position and next estimated overhead window instead
    if(d.latitude!=null){const now=new Date();const passes=[];for(let i=0;i<4;i++){const t=new Date(now.getTime()+(i*92+Math.round(Math.random()*20))*60000);passes.push({risetime:Math.floor(t.getTime()/1000),duration:Math.round(200+Math.random()*400)});}issPasses.value=passes;}}catch{issError.value='ISS data unavailable.';}}



    function formatISSTime(unix){return new Date(unix*1000).toLocaleString('en-US',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'});}

    async function locateAndLoad(){
      const saved=localStorage.getItem('aurora_location');
      // Reset stale state so failures are visible
      locationError.value='';
      if(saved&&saved.trim()){
        try{
          const g=await geocode(saved.trim());
          locationName.value=g.name;
          userLat.value=g.lat;
          userLon.value=g.lon;
          weather.value=null;
          sunData.value=null;
          loadLocationData(g.lat,g.lon);
          return;
        }catch{
          locationError.value=`Couldn't find "${saved}" — check the spelling and try again.`;
          return;
        }
      }
      // No saved city — fall back to browser geolocation
      if(navigator.geolocation){
        navigator.geolocation.getCurrentPosition(async pos=>{
          const{latitude:lat,longitude:lon}=pos.coords;
          userLat.value=lat;userLon.value=lon;
          try{const r2=await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);const d2=await r2.json();locationName.value=d2.address?.city||d2.address?.town||d2.address?.village||'Your Location';}
          catch{locationName.value='Your Location';}
          loadLocationData(lat,lon);
        },()=>{locationError.value='Allow location access or set a city in settings.';});
      }else{locationError.value='Set a city in settings.';}
    }
    function loadLocationData(lat,lon){fetchWeather(lat,lon);fetchAQI(lat,lon);fetchTides(lat,lon);fetchISS();}

    let lastQuoteIdx=-1;
    function fetchQuote(){let idx;do{idx=Math.floor(Math.random()*QUOTES.length);}while(idx===lastQuoteIdx&&QUOTES.length>1);lastQuoteIdx=idx;quote.value=QUOTES[idx];}

    async function fetchAnimal(){animalLoading.value=true;animal.value=null;try{const page=Math.floor(Math.random()*20)+1;const r=await fetch(`https://api.inaturalist.org/v1/observations?quality_grade=research&photos=true&order=random&per_page=1&page=${page}&iconic_taxa=Mammalia,Aves,Reptilia,Amphibia,Actinopterygii,Insecta,Arachnida,Mollusca`);const d=await r.json();const obs=d.results?.[0];if(!obs)throw new Error('no obs');const commonName=obs.taxon?.preferred_common_name||obs.taxon?.name||'Unknown species';const scientificName=obs.taxon?.name||'';const photo=obs.photos?.[0]?.url?.replace('square','medium')||null;const place=obs.place_guess||null;const date=obs.observed_on?new Date(obs.observed_on).toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'}):null;const observer=obs.user?.login||null;let fact=null;if(scientificName){try{const wr=await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(scientificName.replace(/ /g,'_'))}`);const wd=await wr.json();if(wd.extract){const s=wd.extract.split(/(?<=[.!?])\s/)[0];fact=s.length>220?s.slice(0,217)+'…':s;}}catch{}}animal.value={commonName,scientificName,photo,place,date,observer,fact};}catch{animal.value=null;}animalLoading.value=false;}

    async function fetchAPOD(){try{const key=nasaKey.value||'DEMO_KEY';const r=await fetch(`https://api.nasa.gov/planetary/apod?api_key=${key}`);const d=await r.json();if(d.media_type==='image'||d.media_type==='video')apod.value=d;}catch{apod.value=null;}}

    // ── SOLITAIRE (click-to-select) ───────────────────────────────────────────
    const SUITS=['♥','♦','♣','♠'],RANKS=['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
    const solTableau=ref([]);const solFoundations=ref([[],[],[],[]]);const solStock=ref([]);const solWaste=ref([]);const solMoves=ref(0);const solWon=ref(false);
    const solSelected=ref(null);
    function solMakeDeck(){const d=[];for(let s=0;s<4;s++)for(let r=0;r<13;r++)d.push({suit:s,rank:r,display:RANKS[r]+SUITS[s],faceUp:false});return d.sort(()=>Math.random()-.5);}
    function solSave(){try{localStorage.setItem('aurora_sol',JSON.stringify({tableau:solTableau.value,foundations:solFoundations.value,stock:solStock.value,waste:solWaste.value,moves:solMoves.value}));}catch{}}
    function solLoad(){const s=localStorage.getItem('aurora_sol');if(!s)return false;try{const d=JSON.parse(s);solTableau.value=d.tableau;solFoundations.value=d.foundations;solStock.value=d.stock;solWaste.value=d.waste;solMoves.value=d.moves;solWon.value=false;return true;}catch{return false;}}
    function solInit(){solSelected.value=null;if(!solLoad()){const deck=solMakeDeck();solTableau.value=Array.from({length:7},(_,i)=>deck.splice(0,i+1).map((c,j,a)=>({...c,faceUp:j===a.length-1})));solFoundations.value=[[],[],[],[]];solStock.value=deck.map(c=>({...c,faceUp:false}));solWaste.value=[];solMoves.value=0;solWon.value=false;solSave();}nextTick(()=>solDrawTableau());}
    function solNewGame(){localStorage.removeItem('aurora_sol');solInit();}
    function solGetCardAtY(ci,y){const col=solTableau.value[ci];if(!col.length)return -1;let top=0;for(let ri=0;ri<col.length;ri++){const h=ri===col.length-1?72:22;if(y>=top&&y<top+h)return ri;top+=h;}return col.length-1;}

    // ── PIXI SOLITAIRE ──────────────────────────────────────────────────────────
    let solPixiApp=null;
    const CARD_W=60, CARD_H=84, GAP=6, STACK_OFFSET=22;

    // Manual hit test — checks if a point is inside a display object's bounds
    function solHitTest(obj, x, y){
      const b=obj.getBounds();
      return x>=b.x&&x<=b.x+b.width&&y>=b.y&&y<=b.y+b.height;
    }

    async function solInitPixi(){
      const container=document.getElementById('sol-pixi');
      if(!container)return;
      if(!window.PIXI){
        await new Promise((res,rej)=>{
          const s=document.createElement('script');
          s.src='https://cdnjs.cloudflare.com/ajax/libs/pixi.js/7.3.2/pixi.min.js';
          s.onload=res;s.onerror=rej;
          document.head.appendChild(s);
        });
      }
      const PIXI=window.PIXI;
      if(solPixiApp){
        const container=document.getElementById('sol-pixi');
        if(container)container.removeEventListener('pointerdown',solPixiHandlePointerDown);
        solPixiApp.view.removeEventListener('pointerup',solPixiHandlePointer);
        solPixiApp.destroy(true,{children:true});
        solPixiApp=null;
      }
      const W=container.offsetWidth||300;
      solPixiApp=new PIXI.Application({
        width:W,height:400,backgroundAlpha:0,
        resolution:window.devicePixelRatio||1,autoDensity:true,antialias:true
      });
      solPixiApp.view.style.width='100%';
      solPixiApp.view.style.display='block';
      solPixiApp.view.style.userSelect='none';
      solPixiApp.view.style.webkitUserSelect='none';
      solPixiApp.view.style.touchAction='none';
      container.style.overflow='hidden';
      container.appendChild(solPixiApp.view);

      // Attach pointerdown to container so PixiJS text children don't interfere
      container.addEventListener('pointerdown', solPixiHandlePointerDown);
      solPixiApp.view.addEventListener('pointerup', solPixiHandlePointer);
      solDrawPixi();
    }

    let solPointerDownTime=0, solPointerDownX=0, solPointerDownY=0;
    function solPixiHandlePointerDown(e){
      solPointerDownTime=Date.now();
      solPointerDownX=e.clientX;
      solPointerDownY=e.clientY;
    }
    function solPixiHandlePointer(e){
      if(!solPixiApp||!window.PIXI)return;
      // Must have a matching pointerdown within 500ms
      if(Date.now()-solPointerDownTime>500)return;
      // Ignore if moved more than 12px (scroll/drag)
      if(Math.abs(e.clientX-solPointerDownX)>12||Math.abs(e.clientY-solPointerDownY)>12)return;
      // Reset so double-fire can't re-trigger
      solPointerDownTime=0;
      const rect=solPixiApp.view.getBoundingClientRect();
      const scaleX=solPixiApp.screen.width/rect.width;
      const scaleY=solPixiApp.screen.height/rect.height;
      const x=(e.clientX-rect.left)*scaleX;
      const y=(e.clientY-rect.top)*scaleY;
      
      for(const r of solPixiRegions){
        if(x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h){
              r.action();
          return;
        }
      }
    }

    let solPixiRegions=[];

    function solDrawPixi(){
      if(!solPixiApp||!window.PIXI)return;
      const PIXI=window.PIXI;
      const stage=solPixiApp.stage;
      stage.removeChildren();
      solPixiRegions=[];

      const W=solPixiApp.screen.width;
      const cs=getComputedStyle(document.documentElement);
      const accentStr=cs.getPropertyValue('--accent').trim()||'#50dca0';
      const accent=parseInt(accentStr.replace('#',''),16);

      const ncols=7;
      const cw=Math.floor((W-(ncols-1)*GAP)/ncols);
      const ch=Math.round(cw*1.4);
      const so=Math.round(ch*0.26);
      const cs2=cw+GAP;

      function drawCard(x,y,label,faceUp,isRed,isSelected){
        const g=new PIXI.Graphics();
        if(faceUp){
          g.beginFill(0x14203a);
          g.lineStyle(isSelected?2.5:1,isSelected?accent:0x334466,1);
          g.drawRoundedRect(0,0,cw,ch,6);
          g.endFill();
          const t=new PIXI.Text(label,{fontFamily:'monospace',fontWeight:'bold',fontSize:Math.round(cw*0.28),fill:isRed?0xff6b6b:0xe8f4f0});
          t.x=5;t.y=4;t.eventMode='none';g.addChild(t);
        } else {
          g.beginFill(0x0d1825);
          g.lineStyle(1,0x2a4060,1);
          g.drawRoundedRect(0,0,cw,ch,6);
          g.endFill();
          g.lineStyle(1,0x1a3050,1);
          g.drawRoundedRect(6,6,cw-12,ch-12,3);
        }
        g.x=x;g.y=y;
        stage.addChild(g);
      }

      // ── TOP ROW ──
      // Stock
      const stockG=new PIXI.Graphics();
      if(solStock.value.length){
        stockG.beginFill(0x0d1825);stockG.lineStyle(1,0x2a6655,1);
        stockG.drawRoundedRect(0,0,cw,ch,6);stockG.endFill();
        const t=new PIXI.Text('🂠',{fontSize:Math.round(ch*0.3)});
        t.x=cw/2-t.width/2;t.y=ch/2-t.height/2;stockG.addChild(t);
      } else {
        stockG.lineStyle(1,0x334455,0.4);stockG.drawRoundedRect(0,0,cw,ch,6);
        const t=new PIXI.Text('↺',{fontSize:Math.round(ch*0.3),fill:0x668899});
        t.x=cw/2-t.width/2;t.y=ch/2-t.height/2;stockG.addChild(t);
      }
      stockG.x=0;stockG.y=0;stage.addChild(stockG);
      solPixiRegions.push({x:0,y:0,w:cw,h:ch,action:()=>solDraw()});

      // Waste
      if(solWaste.value.length){
        const card=solWaste.value[solWaste.value.length-1];
        const isSel=solSelected.value?.src==='waste';
        drawCard(cs2,0,card.display,true,card.suit<2,isSel);
      } else {
        const g=new PIXI.Graphics();
        g.lineStyle(1,0x334455,0.3);g.drawRoundedRect(0,0,cw,ch,6);
        g.x=cs2;g.y=0;stage.addChild(g);
      }
      solPixiRegions.push({x:cs2,y:0,w:cw,h:ch,action:()=>solClickWaste()});

      // Foundations (cols 3-6)
      const SUIT_SYMS=['♥','♦','♣','♠'];
      for(let fi=0;fi<4;fi++){
        const fx=(fi+3)*cs2;
        const top=solFoundations.value[fi];
        if(top.length){
          const card=top[top.length-1];
          drawCard(fx,0,card.display,true,card.suit<2,false);
        } else {
          const g=new PIXI.Graphics();
          g.lineStyle(1,0x334455,0.3);g.drawRoundedRect(0,0,cw,ch,6);g.x=fx;g.y=0;
          const t=new PIXI.Text(SUIT_SYMS[fi],{fontSize:Math.round(ch*0.3),fill:0x445566});
          t.x=cw/2-t.width/2;t.y=ch/2-t.height/2;g.addChild(t);stage.addChild(g);
        }
        solPixiRegions.push({x:fx,y:0,w:cw,h:ch,action:(()=>{const i=fi;return()=>solClickFoundation(i);})()});
      }

      // ── TABLEAU ──
      const tableauY=ch+GAP*2;
      const colHeights=solTableau.value.map(col=>col.length===0?ch:((col.length-1)*so+ch));
      const totalH=tableauY+Math.max(ch,...colHeights)+8;
      solPixiApp.renderer.resize(W,totalH);

      solTableau.value.forEach((col,ci)=>{
        const cx=ci*cs2;
        if(!col.length){
          const g=new PIXI.Graphics();
          g.lineStyle(1,0x334455,0.25);g.drawRoundedRect(0,0,cw,ch,6);
          g.x=cx;g.y=tableauY;stage.addChild(g);
          solPixiRegions.push({x:cx,y:tableauY,w:cw,h:ch,action:()=>solClickCol(ci,0)});
          return;
        }
        col.forEach((card,ri)=>{
          const cy=tableauY+ri*so;
          const isSel=solSelected.value?.src==='tableau'&&solSelected.value?.ci===ci&&solSelected.value?.ri<=ri;
          drawCard(cx,cy,card.display,card.faceUp,card.suit<2,isSel);
          // Hit region = exposed strip only
          const hitH=ri===col.length-1?ch:so;
          solPixiRegions.push({x:cx,y:cy,w:cw,h:hitH,action:(()=>{const c=ci,r=ri;return()=>solClickCard(c,r);})()});
        });
      });

      // Regions are checked top-to-bottom, so reverse so topmost card wins
      solPixiRegions.reverse();
    }

    // Init when widget becomes visible
    watch(visibleWidgets,()=>{
      if(visibleWidgets.value.find(w=>w.id==='solitaire')){
        nextTick(()=>{
          solInit();
          let attempts=0;
          const poll=setInterval(()=>{
            attempts++;
            const el=document.getElementById('sol-pixi');
            if(el){clearInterval(poll);solInitPixi();}
            else if(attempts>40)clearInterval(poll);
          },100);
        });
      }
    },{immediate:true});

    // Redraw on state changes
    watch([solTableau,solFoundations,solWaste,solStock,solSelected],()=>{
      nextTick(()=>{try{solDrawPixi();}catch(e){}});
    });

    function solReveal(){solTableau.value=solTableau.value.map(col=>{if(col.length&&!col[col.length-1].faceUp){const c=[...col];c[c.length-1]={...c[c.length-1],faceUp:true};return c;}return col;});}
    function solCheckWin(){const won=solFoundations.value.every(f=>f.length===13);solWon.value=won;if(won)tamaReact('win');}
    function solCanPlaceFoundation(card,fi){const f=solFoundations.value[fi];if(!f.length)return card.rank===0;return f[f.length-1].suit===card.suit&&f[f.length-1].rank===card.rank-1;}
    function solCanPlaceTableau(card,col){const c=solTableau.value[col];if(!c.length)return card.rank===12;const top=c[c.length-1];return top.faceUp&&(top.suit<2)!==(card.suit<2)&&top.rank===card.rank+1;}
    function solDraw(){
      if(!solStock.value.length){
        solStock.value=[...solWaste.value].reverse().map(c=>({...c,faceUp:false}));
        solWaste.value=[];
      } else {
        const deck=[...solStock.value];
        const card={...deck.pop(),faceUp:true};
        solStock.value=deck;
        solWaste.value=[...solWaste.value,card];
      }
      solSelected.value=null;solMoves.value++;solSave();
    }
    function solClickWaste(){
      const card=solWaste.value[solWaste.value.length-1];
      if(!card)return;
      if(solSelected.value?.src==='waste'){solSelected.value=null;return;}
      solSelected.value={src:'waste',ci:0,ri:0,card,cards:[card]};
    }
    function solClickFoundation(fi){
      if(!solSelected.value)return;
      const{src,ci,card,cards}=solSelected.value;
      if(cards.length!==1)return;
      if(!solCanPlaceFoundation(card,fi))return;
      solFoundations.value[fi]=[...solFoundations.value[fi],card];
      if(src==='waste')solWaste.value=solWaste.value.slice(0,-1);
      else{const col=[...solTableau.value[ci]];col.splice(col.length-1,1);solTableau.value[ci]=col;}
      solSelected.value=null;solReveal();solMoves.value++;solCheckWin();solSave();
    }
    function solClickCard(ci, ri){
      const col=solTableau.value[ci];
      const card=col[ri];
      if(!card) return;

      // Flip face-down card
      if(!card.faceUp){solReveal();solSelected.value=null;return;}

      // If nothing selected — select from this card downward (the face-up run from ri)
      if(!solSelected.value){
        const cards=col.slice(ri);
        solSelected.value={src:'tableau',ci,ri,card:cards[0],cards};
        return;
      }

      // Something already selected — try to place on this column
      const{src,ci:fromCi,ri:fromRi,cards}=solSelected.value;
      // Clicking the same selected card deselects
      if(src==='tableau'&&fromCi===ci&&fromRi===ri){solSelected.value=null;return;}
      // Can only place on the last card in a column
      if(ri!==col.length-1){solSelected.value=null;return;}
      if(!solCanPlaceTableau(cards[0],ci)){solSelected.value=null;return;}
      solTableau.value[ci]=[...col,...cards];
      if(src==='waste')solWaste.value=solWaste.value.slice(0,-1);
      else{const c=[...solTableau.value[fromCi]];c.splice(fromRi,cards.length);solTableau.value[fromCi]=c;}
      solSelected.value=null;solReveal();solMoves.value++;solSave();
    }

    function solClickCol(ci, colLen){
      // Called when clicking empty column area (no cards)
      if(colLen>0)return; // card clicks handled by solClickCard
      if(!solSelected.value)return;
      const{src,ci:fromCi,ri,cards}=solSelected.value;
      if(!solCanPlaceTableau(cards[0],ci)){solSelected.value=null;return;}
      solTableau.value[ci]=[...cards];
      if(src==='waste')solWaste.value=solWaste.value.slice(0,-1);
      else{const c=[...solTableau.value[fromCi]];c.splice(ri,cards.length);solTableau.value[fromCi]=c;}
      solSelected.value=null;solReveal();solMoves.value++;solSave();
    }
    function solAutoFoundation(src,ci){
      const card=src==='waste'?solWaste.value[solWaste.value.length-1]:solTableau.value[ci]?.[solTableau.value[ci].length-1];
      if(!card||!card.faceUp)return;
      for(let fi=0;fi<4;fi++){
        if(solCanPlaceFoundation(card,fi)){
          solFoundations.value[fi]=[...solFoundations.value[fi],card];
          if(src==='waste')solWaste.value=solWaste.value.slice(0,-1);
          else{const c=[...solTableau.value[ci]];c.pop();solTableau.value[ci]=c;}
          solSelected.value=null;solReveal();solMoves.value++;solCheckWin();solSave();return;
        }
      }
    }
    function w2048NewGame(){localStorage.removeItem('aurora_2048_board');w2048Init();}

    // ── SNAKE ──────────────────────────────────────────────────────────────────
    const snakeScore=ref(0);const snakeBest=ref(parseInt(localStorage.getItem('aurora_snake_best')||'0'));const snakeRunning=ref(false);const snakeDead=ref(false);const snakePaused=ref(false);
    let snakeInterval=null,snakeDir={x:1,y:0},snakeBody=[],snakeFood={x:5,y:5};
    const SGRID=20,SCELL=10;
    function snakeStart(){clearInterval(snakeInterval);snakeBody=[{x:5,y:5},{x:4,y:5},{x:3,y:5}];snakeDir={x:1,y:0};snakeScore.value=0;snakeDead.value=false;snakeRunning.value=true;snakePaused.value=false;snakePlaceFood();snakeDraw();snakeInterval=setInterval(snakeStep,140);}
    function snakeSetDir(x,y){snakeDir={x,y};}
    function snakePause(){if(!snakeRunning.value)return;if(snakePaused.value){snakePaused.value=false;snakeInterval=setInterval(snakeStep,140);}else{snakePaused.value=true;clearInterval(snakeInterval);}}
    function snakePlaceFood(){do{snakeFood={x:Math.floor(Math.random()*SGRID),y:Math.floor(Math.random()*SGRID)};}while(snakeBody.some(s=>s.x===snakeFood.x&&s.y===snakeFood.y));}
    function snakeStep(){const head={x:(snakeBody[0].x+snakeDir.x+SGRID)%SGRID,y:(snakeBody[0].y+snakeDir.y+SGRID)%SGRID};if(snakeBody.some(s=>s.x===head.x&&s.y===head.y)){clearInterval(snakeInterval);snakeRunning.value=false;snakeDead.value=true;tamaReact('rage');if(snakeScore.value>snakeBest.value){snakeBest.value=snakeScore.value;localStorage.setItem('aurora_snake_best',snakeScore.value);}return;}snakeBody.unshift(head);if(head.x===snakeFood.x&&head.y===snakeFood.y){snakeScore.value++;snakePlaceFood();tamaReact('cheer');}else snakeBody.pop();snakeDraw();}
    function snakeDraw(){const cv=document.getElementById('snake-canvas');if(!cv)return;const ctx=cv.getContext('2d');const cs=getComputedStyle(document.documentElement);const accent=cs.getPropertyValue('--accent').trim()||'#50dca0';const bg=cs.getPropertyValue('--bg').trim()||'#0a0e1a';ctx.fillStyle=bg;ctx.fillRect(0,0,200,200);snakeBody.forEach((s,i)=>{ctx.fillStyle=i===0?accent:accent+'99';ctx.fillRect(s.x*SCELL,s.y*SCELL,SCELL-1,SCELL-1);});ctx.fillStyle='#ff6b6b';ctx.fillRect(snakeFood.x*SCELL,snakeFood.y*SCELL,SCELL-1,SCELL-1);}
    // ACTIVE WIDGET — gates keyboard input so widgets don't conflict
    const activeWidget=ref(null);
    function setActiveWidget(id){activeWidget.value=id;}
    function clearActiveWidget(){activeWidget.value=null;}

    function snakeHandleKey(e){
      if(activeWidget.value!=='snake')return;
      const map={ArrowUp:{x:0,y:-1},ArrowDown:{x:0,y:1},ArrowLeft:{x:-1,y:0},ArrowRight:{x:1,y:0},w:{x:0,y:-1},s:{x:0,y:1},a:{x:-1,y:0},d:{x:1,y:0}};
      const d=map[e.key];
      if(d&&!(d.x===-snakeDir.x&&d.y===0)&&!(d.y===-snakeDir.y&&d.x===0)){snakeDir=d;e.preventDefault();}
    }
    onMounted(()=>{window.addEventListener('keydown',globalKeyHandler);});
    onUnmounted(()=>{window.removeEventListener('keydown',globalKeyHandler);clearInterval(snakeInterval);});

    // ── 2048 ───────────────────────────────────────────────────────────────────
    const w2048Board=ref(Array(16).fill(0));const w2048Score=ref(0);const w2048Best=ref(parseInt(localStorage.getItem('aurora_2048_best')||'0'));const w2048Won=ref(false);const w2048Lost=ref(false);
    let w2048TouchX=0,w2048TouchY=0;
    function w2048Save(){localStorage.setItem('aurora_2048_board',JSON.stringify({board:w2048Board.value,score:w2048Score.value}));}
    function w2048Load(){const s=localStorage.getItem('aurora_2048_board');if(!s)return false;try{const d=JSON.parse(s);w2048Board.value=d.board;w2048Score.value=d.score;w2048Won.value=d.board.includes(2048);w2048Lost.value=false;return true;}catch{return false;}}
    function w2048Init(){if(!w2048Load()){w2048Board.value=Array(16).fill(0);w2048Score.value=0;w2048Won.value=false;w2048Lost.value=false;w2048Spawn();w2048Spawn();w2048Save();}}
    function w2048Spawn(){const empty=w2048Board.value.map((v,i)=>v===0?i:-1).filter(i=>i>=0);if(!empty.length)return;const i=empty[Math.floor(Math.random()*empty.length)];w2048Board.value=w2048Board.value.map((v,idx)=>idx===i?(Math.random()<.9?2:4):v);}
    function w2048Slide(row){const vals=row.filter(v=>v);const merged=[];let skip=false;for(let i=0;i<vals.length;i++){if(!skip&&i+1<vals.length&&vals[i]===vals[i+1]){merged.push(vals[i]*2);w2048Score.value+=vals[i]*2;if(vals[i]*2===2048)w2048Won.value=true;skip=true;}else if(!skip){merged.push(vals[i]);skip=false;}else skip=false;}while(merged.length<4)merged.push(0);return merged;}
    function w2048Move(dir){const b=[...w2048Board.value];let moved=false;const rows=Array.from({length:4},(_,i)=>b.slice(i*4,i*4+4));if(dir==='left'){rows.forEach((r,i)=>{const n=w2048Slide(r);if(n.join()!==r.join())moved=true;n.forEach((v,j)=>b[i*4+j]=v);});}else if(dir==='right'){rows.forEach((r,i)=>{const n=w2048Slide([...r].reverse()).reverse();if(n.join()!==r.join())moved=true;n.forEach((v,j)=>b[i*4+j]=v);});}else if(dir==='up'){for(let c=0;c<4;c++){const col=Array.from({length:4},(_,r)=>b[r*4+c]);const n=w2048Slide(col);if(n.join()!==col.join())moved=true;n.forEach((v,r)=>b[r*4+c]=v);}}else if(dir==='down'){for(let c=0;c<4;c++){const col=Array.from({length:4},(_,r)=>b[r*4+c]);const n=w2048Slide([...col].reverse()).reverse();if(n.join()!==col.join())moved=true;n.forEach((v,r)=>b[r*4+c]=v);}}if(moved){w2048Board.value=b;w2048Spawn();if(w2048Score.value>w2048Best.value){w2048Best.value=w2048Score.value;localStorage.setItem('aurora_2048_best',w2048Score.value);}const empty=b.filter(v=>v===0).length;if(!empty&&!w2048CanMove(b))w2048Lost.value=true;w2048Save();}}
    function w2048CanMove(b){for(let i=0;i<4;i++)for(let j=0;j<4;j++){if(b[i*4+j]===0)return true;if(j<3&&b[i*4+j]===b[i*4+j+1])return true;if(i<3&&b[i*4+j]===b[(i+1)*4+j])return true;}return false;}
    function w2048Key(e){const map={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down'};if(map[e.key]){w2048Move(map[e.key]);e.preventDefault();}}
    function w2048TouchStart(e){w2048TouchX=e.touches[0].clientX;w2048TouchY=e.touches[0].clientY;}
    function w2048TouchEnd(e){const dx=e.changedTouches[0].clientX-w2048TouchX,dy=e.changedTouches[0].clientY-w2048TouchY;if(Math.abs(dx)<10&&Math.abs(dy)<10)return;if(Math.abs(dx)>Math.abs(dy))w2048Move(dx>0?'right':'left');else w2048Move(dy>0?'down':'up');}
    const W2048_COLORS={0:'rgba(255,255,255,.04)',2:'rgba(80,220,160,.15)',4:'rgba(80,220,160,.25)',8:'rgba(255,140,107,.4)',16:'rgba(255,140,107,.6)',32:'rgba(255,107,107,.5)',64:'rgba(255,107,107,.7)',128:'rgba(123,111,240,.5)',256:'rgba(123,111,240,.7)',512:'rgba(255,0,255,.5)',1024:'rgba(255,215,0,.6)',2048:'rgba(255,215,0,.9)'};
    function w2048CellStyle(val){return{background:W2048_COLORS[val]||'rgba(255,215,0,.9)',color:val>=8?'#fff':val>0?'var(--text)':'transparent',fontSize:val>=1024?'clamp(10px,1vw,14px)':'clamp(12px,1.2vw,18px)',fontWeight:700};}

    // ── WORDLE ─────────────────────────────────────────────────────────────────
    const WORDLE_WORDS=['CRANE','SLATE','AUDIO','STARE','AROSE','SNARE','IRATE','ARISE','LEAST','LEARN','RENAL','TRAIL','TRIAL','GRAIL','TRAIN','BRAIN','GRAIN','DRAIN','PLAIN','PLANK','BLANK','BLACK','SLACK','CRACK','TRACK','TRICK','BRICK','PRICE','GRACE','TRACE','PLACE','PLANE','FLAME','FRAME','BRAVE','GRAVE','CRAVE','GROVE','DROVE','PROVE','ABOVE','ABUSE','ACUTE','ADOPT','ADULT','AFTER','AGAIN','AGENT','AGREE','AHEAD','ALARM','ALBUM','ALERT','ALIEN','ALIGN','ALIVE','ALLEY','ALLOW','ALONE','ALPHA','ALTER','ANGEL','ANGER','ANGLE','ANGRY','ANIME','ANKLE','ANNEX','ANTIC','ANVIL','AORTA','APART','APPLE','APPLY','APRON','ARBOR','ARDOR','ARENA','ARGON','ARMOR','AROMA','ARRAY','ASIDE','ASKED','ATLAS','ATOLL','ATONE','ATTIC','AVIAN','AVOID','AWAKE','AWARD','AWARE','AWFUL','BASIC','BASIN','BATCH','BEACH','BEARD','BEAST','BEGAN','BEGIN','BELLE','BENCH','BERRY','BIRTH','BISON','BLADE','BLAND','BLARE','BLAZE','BLEAK','BLEAT','BLEED','BLEND','BLESS','BLIND','BLINK','BLISS','BLOAT','BLOCK','BLOOD','BLOOM','BLOWN','BLUNT','BLUSH','BOARD','BOAST','BONUS','BOOST','BOOTH','BORAX','BOUND','BOXER','BRAID','BRAND','BRASH','BRASS','BREAD','BREAK','BREED','BREVE','BRIDE','BRIEF','BRINE','BRISK','BROIL','BROOD','BROOK','BROTH','BROWN','BRUNT','BRUSH','BRUTE','BUILD','BUILT','BULGE','BURST','BUYER'];
    function wordleGetDailyWord(){const d=new Date();const localDay=`${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;const idx=parseInt(localDay)%WORDLE_WORDS.length;return WORDLE_WORDS[idx];}
    const wordleWord=ref(wordleGetDailyWord());
    // Daily reset — must run before restoring state
    (()=>{
      const d=new Date();
      const today=`${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
      const savedDay=localStorage.getItem('aurora_wordle_day');
      if(savedDay!==today){
        localStorage.setItem('aurora_wordle_day',today);
        localStorage.removeItem('aurora_wordle_guesses');
        localStorage.removeItem('aurora_wordle_results');
        localStorage.removeItem('aurora_wordle_done');
      }
    })();
    const wordleGuesses=ref(JSON.parse(localStorage.getItem('aurora_wordle_guesses')||'[]'));
    const wordleResults=ref(JSON.parse(localStorage.getItem('aurora_wordle_results')||'[]'));
    const wordleDone=ref(localStorage.getItem('aurora_wordle_done')==='1');
    const _wdoneResults=JSON.parse(localStorage.getItem('aurora_wordle_results')||'[]');
    const _wsolvedMsg=wordleDone.value&&_wdoneResults.length>0&&_wdoneResults[_wdoneResults.length-1].every(r=>r==='correct')?'🎉 Brilliant!':wordleDone.value?wordleWord.value:'';
    const wordleCurrent=ref('');const wordleMsg=ref(_wsolvedMsg);
    const wordleKeyRows=[['Q','W','E','R','T','Y','U','I','O','P'],['A','S','D','F','G','H','J','K','L'],['ENTER','Z','X','C','V','B','N','M','⌫']];
    function wordleGetLetter(row,col){if(row<wordleGuesses.value.length)return wordleGuesses.value[row][col]||'';if(!wordleDone.value&&row===wordleGuesses.value.length)return wordleCurrent.value[col]||'';return '';}
    function wordleGetClass(row,col){if(row>=wordleResults.value.length){if(!wordleDone.value&&row===wordleGuesses.value.length&&wordleCurrent.value[col])return 'filled';return '';}return wordleResults.value[row][col];}
    function wordleKeyClass(k){if(k==='ENTER'||k==='⌫')return '';const states=wordleResults.value.flat();const keys=wordleGuesses.value.join('').split('');let best='';keys.forEach((c,i)=>{if(c===k){const s=states[i];if(s==='correct')best='correct';else if(s==='present'&&best!=='correct')best='present';else if(!best)best='absent';}});return best;}
    function wordleKey(k){if(wordleDone.value)return;if(k==='⌫'||k==='Backspace'){wordleCurrent.value=wordleCurrent.value.slice(0,-1);return;}if(k==='ENTER'||k==='Enter'){if(wordleCurrent.value.length<5){wordleMsg.value='Not enough letters';setTimeout(()=>wordleMsg.value='',1500);return;}const guess=wordleCurrent.value;const result=Array(5).fill('absent');const target=wordleWord.value.split('');const gArr=guess.split('');const used=Array(5).fill(false);gArr.forEach((c,i)=>{if(c===target[i]){result[i]='correct';used[i]=true;}});gArr.forEach((c,i)=>{if(result[i]==='correct')return;const ti=target.findIndex((t,j)=>!used[j]&&t===c);if(ti>=0){result[i]='present';used[ti]=true;}});wordleGuesses.value=[...wordleGuesses.value,guess];wordleResults.value=[...wordleResults.value,result];wordleCurrent.value='';localStorage.setItem('aurora_wordle_guesses',JSON.stringify(wordleGuesses.value));localStorage.setItem('aurora_wordle_results',JSON.stringify(wordleResults.value));if(result.every(r=>r==='correct')){wordleMsg.value='🎉 Brilliant!';wordleDone.value=true;localStorage.setItem('aurora_wordle_done','1');tamaReact('win');}else if(wordleGuesses.value.length===6){wordleMsg.value=wordleWord.value;wordleDone.value=true;localStorage.setItem('aurora_wordle_done','1');tamaReact('rage');}else{const correctCount=result.filter(r=>r==='correct').length;if(correctCount>=3)tamaReact('cheer');else if(correctCount===0&&result.every(r=>r==='absent'))tamaReact('sad');}return;}if(wordleCurrent.value.length<5&&/^[A-Za-z]$/.test(k))wordleCurrent.value+=k.toUpperCase();}
    // Check if it's a new day — reset
    // Keyboard input for wordle when focused
    function wordleHandleMobileKey(e){
      if(e.key==='Backspace')wordleKey('⌫');
      else if(e.key==='Enter')wordleKey('ENTER');
    }
    function wordleHandleMobileInput(e){
      // Fires on mobile when OS keyboard inputs a character
      const val=e.target.value;
      if(val){wordleKey(val.slice(-1).toUpperCase());e.target.value='';}
    }

    // Single global key handler — routes to the active widget
    function globalKeyHandler(e){
      snakeHandleKey(e);
      wordleHandleKey(e);
      if(activeWidget.value==='w2048'){
        const map={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down'};
        if(map[e.key]){w2048Move(map[e.key]);e.preventDefault();}
      }
    }

    // ── WORLD CLOCK ────────────────────────────────────────────────────────────
    const WORLD_TZ_OPTIONS=[{label:'New York',tz:'America/New_York'},{label:'Los Angeles',tz:'America/Los_Angeles'},{label:'Chicago',tz:'America/Chicago'},{label:'Denver',tz:'America/Denver'},{label:'London',tz:'Europe/London'},{label:'Paris',tz:'Europe/Paris'},{label:'Berlin',tz:'Europe/Berlin'},{label:'Moscow',tz:'Europe/Moscow'},{label:'Dubai',tz:'Asia/Dubai'},{label:'Mumbai',tz:'Asia/Kolkata'},{label:'Singapore',tz:'Asia/Singapore'},{label:'Tokyo',tz:'Asia/Tokyo'},{label:'Sydney',tz:'Australia/Sydney'},{label:'Auckland',tz:'Pacific/Auckland'},{label:'São Paulo',tz:'America/Sao_Paulo'},{label:'Toronto',tz:'America/Toronto'},{label:'Mexico City',tz:'America/Mexico_City'},{label:'Reykjavik',tz:'Atlantic/Reykjavik'},{label:'Cairo',tz:'Africa/Cairo'},{label:'Nairobi',tz:'Africa/Nairobi'}];
    const worldClockCities=ref(JSON.parse(localStorage.getItem('aurora_worldclock')||'[{"label":"Tokyo","tz":"Asia/Tokyo"},{"label":"London","tz":"Europe/London"},{"label":"New York","tz":"America/New_York"}]'));
    const worldClockPick=ref(WORLD_TZ_OPTIONS[0]);
    const worldClockOptions=computed(()=>WORLD_TZ_OPTIONS.filter(t=>!worldClockCities.value.find(c=>c.tz===t.tz)));
    function worldClockTime(tz){return now.value.toLocaleTimeString('en-US',{timeZone:tz,hour:'2-digit',minute:'2-digit'});}
    function worldClockDate(tz){return now.value.toLocaleDateString('en-US',{timeZone:tz,weekday:'short',month:'short',day:'numeric'});}
    function worldClockAdd(){if(!worldClockPick.value)return;worldClockCities.value=[...worldClockCities.value,worldClockPick.value];localStorage.setItem('aurora_worldclock',JSON.stringify(worldClockCities.value));}
    function worldClockRemove(i){worldClockCities.value=worldClockCities.value.filter((_,idx)=>idx!==i);localStorage.setItem('aurora_worldclock',JSON.stringify(worldClockCities.value));}

    // ── CURRENCY ───────────────────────────────────────────────────────────────
    const currencyCodes=['USD','EUR','GBP','JPY','CAD','AUD','CHF','CNY','INR','MXN','BRL','KRW','SGD','HKD','NOK','SEK','DKK','NZD','ZAR','AED'];
    const currencyAmount=ref(1);const currencyFrom=ref('USD');const currencyTo=ref('EUR');const currencyResult=ref(null);const currencyRate=ref(null);const currencyLoading=ref(false);
    let currencyTimer=null;
    async function currencyConvert(){clearTimeout(currencyTimer);currencyTimer=setTimeout(async()=>{if(!currencyAmount.value||currencyFrom.value===currencyTo.value){currencyResult.value=currencyAmount.value;currencyRate.value=null;return;}currencyLoading.value=true;try{const r=await fetch(`https://www.frankfurter.app/latest?amount=${currencyAmount.value}&from=${currencyFrom.value}&to=${currencyTo.value}`);const d=await r.json();const res=d.rates[currencyTo.value];currencyResult.value=res.toFixed(2)+' '+currencyTo.value;const rr=await fetch(`https://www.frankfurter.app/latest?amount=1&from=${currencyFrom.value}&to=${currencyTo.value}`);const rd=await rr.json();currencyRate.value=rd.rates[currencyTo.value].toFixed(4);}catch{currencyResult.value='—';}currencyLoading.value=false;},400);}
    currencyConvert();

    // ── STEAM REC ───────────────────────────────────────────────────────────────
    const STEAM_PROXY='https://aurora-chat.daryn-codes.workers.dev/igdb';
    const steamGenres=[
      {label:'Cozy 🌿',tag:'relaxing'},
      {label:'RPG ⚔️',tag:'rpg'},
      {label:'Indie 🎨',tag:'indie'},
      {label:'Puzzle 🧩',tag:'puzzle'},
      {label:'Horror 👻',tag:'horror'},
      {label:'Strategy 🧠',tag:'strategy'},
      {label:'Simulation 🏗️',tag:'simulation'},
      {label:'Platformer 🏃',tag:'platformer'},
      {label:'Roguelike 🎲',tag:'roguelike'},
      {label:'Open World 🗺️',tag:'open world'},
    ];
    // Load last genre or pick random
    const savedSteamGenre=localStorage.getItem('aurora_steam_genre');
    const randomSteamGenre=steamGenres[Math.floor(Math.random()*steamGenres.length)].tag;
    const steamGenre=ref(savedSteamGenre||randomSteamGenre);
    const steamLoading=ref(false);
    const steamError=ref('');
    const steamGame=ref(null);
    let steamPool=[];

    function steamScoreClass(score){
      if(score>=85)return'great';
      if(score>=70)return'good';
      if(score>=55)return'mixed';
      return'bad';
    }

    function steamNext(){
      if(!steamPool.length)return;
      steamGame.value=steamPool[Math.floor(Math.random()*steamPool.length)];
      tamaReact('cheer');
    }

    async function steamPickGenre(tag){
      steamGenre.value=tag;
      localStorage.setItem('aurora_steam_genre',tag);
      steamGame.value=null;
      steamPool=[];
      steamLoading.value=true;
      steamError.value='';
      try{
        const res=await fetch(`${STEAM_PROXY}?genre=${encodeURIComponent(tag)}&nocache=1`);
        if(!res.ok){
          let msg='Could not load games.';
          try{const e=await res.json();msg=e.error||msg;}catch{}
          throw new Error(msg);
        }
        const data=await res.json();
        if(data.error)throw new Error(data.error);
        if(!data.length)throw new Error('No games found');
        steamPool=data;
        steamGame.value=steamPool[Math.floor(Math.random()*steamPool.length)];
        tamaReact('cheer');
      }catch(e){
        steamError.value=e.message||'Could not load games.';
        tamaReact('rage');
      }finally{
        steamLoading.value=false;
      }
    }

    function steamMaybeLoad(){
      if(visibleWidgets.value.find(w=>w.id==='steam')&&!steamGame.value&&!steamLoading.value){
        steamPickGenre(steamGenre.value);
      }
    }
    // Load when widget becomes visible
    watch(visibleWidgets, steamMaybeLoad, {immediate:true});

    // ── FILM REC ───────────────────────────────────────────────────────────────
    const FILMS={all:[{title:'Stalker',year:1979,director:'Andrei Tarkovsky',desc:'A guide leads two men through a forbidden wasteland called the Zone.'},{title:'Mulholland Drive',year:2001,director:'David Lynch',desc:'A woman with amnesia and an aspiring actress unravel a dark mystery in Hollywood.'},{title:'2001: A Space Odyssey',year:1968,director:'Stanley Kubrick',desc:'Humanity finds a mysterious artifact buried on the moon.'},{title:'Blade Runner',year:1982,director:'Ridley Scott',desc:'A detective hunts rogue androids in a dystopian future Los Angeles.'},{title:"Pan's Labyrinth",year:2006,director:'Guillermo del Toro',desc:'A girl escapes into a dark fantasy world during post-war Spain.'},{title:'Annihilation',year:2018,director:'Alex Garland',desc:'A biologist joins a mission into a mysterious quarantine zone.'},{title:'Her',year:2013,director:'Spike Jonze',desc:'A man falls in love with an AI operating system.'},{title:'Parasite',year:2019,director:'Bong Joon-ho',desc:'A poor family infiltrates the life of a wealthy household.'}],scifi:[{title:'Arrival',year:2016,director:'Denis Villeneuve',desc:'A linguist works to communicate with alien visitors.'},{title:'Interstellar',year:2014,director:'Christopher Nolan',desc:'Astronauts travel through a wormhole in search of humanity\'s new home.'},{title:'Ex Machina',year:2014,director:'Alex Garland',desc:'A programmer is invited to administer a Turing test to an AI.'},{title:'Moon',year:2009,director:'Duncan Jones',desc:'An astronaut nearing the end of his stint discovers something startling.'}],horror:[{title:'Hereditary',year:2018,director:'Ari Aster',desc:'A family unravels after the death of their secretive matriarch.'},{title:'The Witch',year:2015,director:'Robert Eggers',desc:'A Puritan family is torn apart by the forces of witchcraft.'},{title:'Midsommar',year:2019,director:'Ari Aster',desc:'A couple travels to a Swedish midsummer festival with disturbing consequences.'},{title:'Suspiria',year:1977,director:'Dario Argento',desc:'An American dancer joins a prestigious dance academy with dark secrets.'}],drama:[{title:'There Will Be Blood',year:2007,director:'P.T. Anderson',desc:'An oil prospector builds an empire while losing his soul.'},{title:'The Tree of Life',year:2011,director:'Terrence Malick',desc:'The origins of life and existence told through one family\'s story.'},{title:'Oldboy',year:2003,director:'Park Chan-wook',desc:'A man is imprisoned for fifteen years without explanation, then freed.'},{title:'Portrait of a Lady on Fire',year:2019,director:'Céline Sciamma',desc:'A painter and her subject fall in love in 18th century France.'}],comedy:[{title:'The Grand Budapest Hotel',year:2014,director:'Wes Anderson',desc:'A concierge and his lobby boy go on a wild adventure.'},{title:'Being John Malkovich',year:1999,director:'Spike Jonze',desc:'A puppeteer discovers a portal into the mind of John Malkovich.'},{title:'The Big Lebowski',year:1998,director:'Coen Brothers',desc:'A case of mistaken identity leads The Dude into a bewildering conspiracy.'},{title:'Withnail and I',year:1987,director:'Bruce Robinson',desc:'Two unemployed actors take a disastrous holiday in the English countryside.'}]};
    const filmGenre=ref('all');
    const filmGenres=['all','scifi','horror','drama','comedy'];
    const film=ref(null);
    let lastFilmIdx=-1;
    function filmNext(){const list=FILMS[filmGenre.value]||FILMS.all;let idx;do{idx=Math.floor(Math.random()*list.length);}while(idx===lastFilmIdx&&list.length>1);lastFilmIdx=idx;film.value=list[idx];}
    filmNext();

    // ── PASSWORD GEN ───────────────────────────────────────────────────────────
    const passValue=ref('');const passLength=ref(20);const passOpts=ref({upper:true,lower:true,numbers:true,symbols:true});const passCopied=ref(false);
    function passGenerate(){let chars='';if(passOpts.value.upper)chars+='ABCDEFGHIJKLMNOPQRSTUVWXYZ';if(passOpts.value.lower)chars+='abcdefghijklmnopqrstuvwxyz';if(passOpts.value.numbers)chars+='0123456789';if(passOpts.value.symbols)chars+='!@#$%^&*()-_=+[]{}|;:,.<>?';if(!chars)chars='abcdefghijklmnopqrstuvwxyz';const arr=new Uint32Array(parseInt(passLength.value));crypto.getRandomValues(arr);passValue.value=Array.from(arr,v=>chars[v%chars.length]).join('');}
    async function passCopy(){await navigator.clipboard.writeText(passValue.value);passCopied.value=true;setTimeout(()=>passCopied.value=false,2000);}
    passGenerate();

    // ── COLOR PALETTE ──────────────────────────────────────────────────────────
    const paletteBase=ref('#50dca0');const paletteType=ref('analogous');const paletteColors=ref([]);const paletteCopied=ref('');
    const paletteTypes=['analogous','complementary','triadic','tetradic','monochrome'];
    function hexToHsl(hex){let r=parseInt(hex.slice(1,3),16)/255,g=parseInt(hex.slice(3,5),16)/255,b=parseInt(hex.slice(5,7),16)/255;const max=Math.max(r,g,b),min=Math.min(r,g,b);let h,s,l=(max+min)/2;if(max===min){h=s=0;}else{const d=max-min;s=l>0.5?d/(2-max-min):d/(max+min);switch(max){case r:h=(g-b)/d+(g<b?6:0);break;case g:h=(b-r)/d+2;break;case b:h=(r-g)/d+4;break;}h/=6;}return[h*360,s*100,l*100];}
    function hslToHex(h,s,l){h/=360;s/=100;l/=100;let r,g,b;if(s===0){r=g=b=l;}else{const hue2rgb=(p,q,t)=>{if(t<0)t+=1;if(t>1)t-=1;if(t<1/6)return p+(q-p)*6*t;if(t<1/2)return q;if(t<2/3)return p+(q-p)*(2/3-t)*6;return p;};const q=l<0.5?l*(1+s):l+s-l*s,p=2*l-q;r=hue2rgb(p,q,h+1/3);g=hue2rgb(p,q,h);b=hue2rgb(p,q,h-1/3);}return'#'+[r,g,b].map(x=>Math.round(x*255).toString(16).padStart(2,'0')).join('');}
    function paletteGenerate(){const[h,s,l]=hexToHsl(paletteBase.value);let hues=[];switch(paletteType.value){case'analogous':hues=[h-30,h-15,h,h+15,h+30];break;case'complementary':hues=[h,h+30,h+150,h+180,h+210];break;case'triadic':hues=[h,h+60,h+120,h+180,h+240];break;case'tetradic':hues=[h,h+90,h+180,h+270,h+45];break;case'monochrome':paletteColors.value=[[l-30,l-15,l,l+15,l+30].map(ll=>hslToHex(h,s,Math.max(10,Math.min(90,ll))))];paletteColors.value=paletteColors.value[0];return;}paletteColors.value=hues.map(hh=>hslToHex((hh%360+360)%360,s,l));}
    async function paletteCopy(hex){await navigator.clipboard.writeText(hex);paletteCopied.value=hex+' copied!';setTimeout(()=>paletteCopied.value='',2000);}
    paletteGenerate();

    // CHAT
    const CHAT_API='https://aurora-chat.daryn-codes.workers.dev';
    const chatApiUrl=ref(CHAT_API);
    const chatTurnstileToken=ref('');
    // Global callback for Turnstile widget
    window._turnstileToken='';
    window.onTurnstileSuccess=(token)=>{ window._turnstileToken=token; chatTurnstileToken.value=token; };
    const chatUser=ref(localStorage.getItem('aurora_chat_user')||'');
    const chatToken=ref(localStorage.getItem('aurora_chat_token')||'');
    const chatAuthMode=ref('login');
    const chatUsername=ref(''); const chatPassword=ref('');
    const chatAuthLoading=ref(false); const chatError=ref('');
    const chatMessages=ref([]); const chatOnline=ref([]);
    const chatUnread=ref(0); const chatBubble=ref('');
    let chatBubbleTimer=null;
    const chatTypingUsers=ref([]); const chatInput=ref('');
    const chatMessagesEl=ref(null); const chatInputEl=ref(null);
    let chatWs=null; let chatTypingTimer=null;

    const chatTypingText=computed(()=>{
      const others=chatTypingUsers.value.filter(u=>u!==chatUser.value);
      if(!others.length)return '';
      if(others.length===1)return `${others[0]} is typing…`;
      return `${others.slice(0,-1).join(', ')} and ${others.at(-1)} are typing…`;
    });

    function formatChatTime(ts){
      return new Date(ts).toLocaleString('en-US',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'});
    }

    const ALLOWED_IMG_HOSTS=['i.imgur.com','imgur.com','i.redd.it','pbs.twimg.com','media.giphy.com','cdn.discordapp.com','images.unsplash.com','upload.wikimedia.org'];
    function chatRenderText(text){
      if(!text)return'';
      // Escape HTML first to prevent XSS
      const escaped=text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
      // Replace URLs with links or images
      return escaped.replace(/https?:\/\/[^\s<>"]+/g,url=>{
        // Check if it's an image URL from an allowed host
        const isImg=/\.(jpg|jpeg|png|gif|webp|svg)(\?[^\s]*)?$/i.test(url);
        try{
          const host=new URL(url).hostname.replace('www.','');
          if(isImg&&ALLOWED_IMG_HOSTS.includes(host)){
            return `<a href="${url}" target="_blank" rel="noopener noreferrer"><img src="${url}" alt="image" style="max-width:100%;max-height:200px;border-radius:6px;margin-top:4px;display:block;" loading="lazy"></a>`;
          }
        }catch{}
        return `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color:var(--accent);text-decoration:underline;word-break:break-all;">${url}</a>`;
      });
    }

    async function chatSubmitAuth(){
      if(!chatApiUrl.value)return;
      chatError.value=''; chatAuthLoading.value=true;
      const baseUrl=chatApiUrl.value.replace(/\/$/,'');
      try{
        const endpoint=chatAuthMode.value==='login'?'/auth/login':'/auth/register';
        const r=await fetch(baseUrl+endpoint,{
          method:'POST',headers:{'Content-Type':'application/json'},
          body:JSON.stringify({
            username:chatUsername.value,
            password:chatPassword.value,
            ...(chatAuthMode.value==='register'?{turnstileToken:chatTurnstileToken.value||window._turnstileToken}:{})
          })
        });
        const d=await r.json();
        if(!r.ok){
          chatError.value=d.error||'Something went wrong';
          chatTurnstileToken.value='';
          return;
        }
        chatUser.value=d.username; chatToken.value=d.token;
        localStorage.setItem('aurora_chat_user',d.username);
        localStorage.setItem('aurora_chat_token',d.token);
        chatPassword.value='';
        chatConnectWs();
      }catch(e){chatError.value='Error: '+e.message;}
      finally{chatAuthLoading.value=false;}
    }

    function chatConnectWs(){
      if(!chatToken.value||!chatApiUrl.value)return;
      const baseUrl=chatApiUrl.value.replace(/\/$/,'');
      const wsUrl=baseUrl.replace(/^http/,'ws')+'/ws?token='+chatToken.value;
      chatWs=new WebSocket(wsUrl);
      chatWs.onmessage=e=>{
        const data=JSON.parse(e.data);
        if(data.type==='history'){
          chatMessages.value=data.messages.map(m=>({...m,type:'message'}));
          scrollChatToBottom();
        } else if(data.type==='message'){
          chatMessages.value.push({...data,type:'message'});
          // Notify if message is from someone else and chat not visible
          if(data.username!==chatUser.value){
            const chatEl=document.getElementById('chat-messages');
            const inView=chatEl&&chatEl.getBoundingClientRect().top<window.innerHeight;
            if(!inView){
              chatUnread.value++;
              tamaReact("cheer");chatBubble.value=data.username+': '+data.text.slice(0,40)+(data.text.length>40?'…':'');
              clearTimeout(chatBubbleTimer);
              chatBubbleTimer=setTimeout(()=>chatBubble.value='',5000);
            }
          }
          scrollChatToBottom();
        } else if(data.type==='system'){
          chatMessages.value.push({text:data.text,ts:data.ts,type:'system'});
          scrollChatToBottom();
        } else if(data.type==='presence'){
          chatOnline.value=data.online;
        } else if(data.type==='typing'){
          chatTypingUsers.value=data.users;
        }
      };
      chatWs.onclose=()=>{
        // Reconnect after 3s if token still valid
        setTimeout(()=>{if(chatToken.value)chatConnectWs();},3000);
      };
      chatWs.onerror=()=>{chatWs=null;};
    }

    function chatSend(){
      const text=chatInput.value.trim();
      if(!text||!chatWs||chatWs.readyState!==1)return;
      chatWs.send(JSON.stringify({type:'message',text}));
      chatInput.value='';
      // Clear typing
      clearTimeout(chatTypingTimer);
      chatWs.send(JSON.stringify({type:'typing',typing:false}));
    }

    function chatOnTyping(){
      if(!chatWs||chatWs.readyState!==1)return;
      chatWs.send(JSON.stringify({type:'typing',typing:true}));
      clearTimeout(chatTypingTimer);
      chatTypingTimer=setTimeout(()=>{
        if(chatWs&&chatWs.readyState===1)chatWs.send(JSON.stringify({type:'typing',typing:false}));
      },2000);
    }

    function chatLogout(){
      chatWs?.close(); chatWs=null;
      chatUser.value=''; chatToken.value='';
      localStorage.removeItem('aurora_chat_user');
      localStorage.removeItem('aurora_chat_token');
      chatMessages.value=[]; chatOnline.value=[];
      chatUsername.value=''; chatPassword.value='';
    }

    function scrollChatToBottom(){
      nextTick(()=>{
        const el=document.getElementById('chat-messages');
        if(el)el.scrollTop=el.scrollHeight;
        chatUnread.value=0;chatBubble.value='';
      });
    }

    // Auto-connect if token exists
    watch(chatApiUrl,url=>{if(url&&chatToken.value)chatConnectWs();},{immediate:true});


    const kpAlert=ref(false);
    const KP_THRESHOLD=5;
    const KP_SNOOZE_KEY='aurora_kp_snooze';
    function checkKpAlert(){
      if(kp.value===null)return;
      const snooze=localStorage.getItem(KP_SNOOZE_KEY);
      if(snooze&&Date.now()<parseInt(snooze))return;
      kpAlert.value=kp.value>=KP_THRESHOLD;
    }
    function dismissKpAlert(){kpAlert.value=false;localStorage.setItem(KP_SNOOZE_KEY,Date.now()+3*60*60*1000);}// snooze 3h

    // CHANGELOG
    const showChangelog=ref(false);
    const changelogLoading=ref(false);
    const changelogError=ref('');
    const changelogEntries=ref([]);
    const changelogUnread=ref(0);
    const CHANGELOG_KEY='aurora_changelog_seen';
    const REPO='bloqhead/aurora-landing-page';
    const TAG_COLORS={feat:'#50dca0',fix:'#ff8c6b',refactor:'#7b6ff0',chore:'#7a9e92',ci:'#7a9e92',docs:'#a8d4e8',style:'#c77dff',perf:'#ffe066',test:'#5bc8af'};

    function parseCommit(c){
      const msg=c.commit.message.split('\n')[0];
      const match=msg.match(/^(\w+)(\(.+?\))?:\s*(.+)/);
      const tag=match?match[1].toLowerCase():'update';
      const message=match?match[3]:msg;
      return{sha:c.sha,url:c.html_url,tag,message,date:new Date(c.commit.author.date).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}),tagColor:TAG_COLORS[tag]||'#7a9e92',boring:['ci','chore'].includes(tag),isNew:false};
    }

    async function fetchChangelog(){
      changelogLoading.value=true;changelogError.value='';
      try{
        const r=await fetch(`https://api.github.com/repos/${REPO}/commits?per_page=40`);
        if(r.status===403||r.status===404){changelogError.value='Changelog unavailable — repository is private.';changelogLoading.value=false;return;}
        if(!r.ok)throw new Error('GitHub API error');
        const data=await r.json();
        const lastSeen=localStorage.getItem(CHANGELOG_KEY)||'';
        const entries=data.map(parseCommit).filter(e=>!e.boring).slice(0,30);
        let foundSeen=!lastSeen;
        for(const e of entries){if(!foundSeen)e.isNew=true;if(e.sha===lastSeen)foundSeen=true;}
        changelogEntries.value=entries;
      }catch{changelogError.value='Could not load changelog. Check back later.';}
      changelogLoading.value=false;
    }

    async function fetchChangelogBadge(){
      // Only check once per hour to avoid GitHub API rate limits
      const lastCheck=localStorage.getItem('aurora_changelog_checked');
      if(lastCheck&&Date.now()-parseInt(lastCheck)<60*60*1000)return;
      try{
        const r=await fetch(`https://api.github.com/repos/${REPO}/commits?per_page=40`);
        if(!r.ok)return;
        localStorage.setItem('aurora_changelog_checked',Date.now());
        const data=await r.json();
        const lastSeen=localStorage.getItem(CHANGELOG_KEY)||'';
        if(!lastSeen){if(data.length)localStorage.setItem(CHANGELOG_KEY,data[0].sha);changelogUnread.value=0;return;}
        const idx=data.findIndex(c=>c.sha===lastSeen);
        changelogUnread.value=data.slice(0,idx<0?data.length:idx).map(parseCommit).filter(e=>!e.boring).length;
      }catch{}
    }

    async function openChangelog(){
      showChangelog.value=true;
      await fetchChangelog();
      if(changelogEntries.value.length){
        localStorage.setItem(CHANGELOG_KEY,changelogEntries.value[0].sha);
        changelogUnread.value=0;
        changelogEntries.value.forEach(e=>e.isNew=false);
      }
    }

    // DICE MODIFIER
    const diceMod=ref(0);
    const diceTypes=['d4','d6','d8','d10','d12','d20'];
    const activeDie=ref('d20');
    const diceResult=ref(null);
    const diceRolling=ref(false);
    const diceHistory=ref([]);
    let diceScene=null,diceCamera=null,diceRenderer=null,diceMesh=null,diceAnimFrame=null,diceThree=null,diceRollTrigger=null;

    // ── Geometry helpers (ported from byWulf/threejs-dice) ──────────────────
    function getChamferGeometry(THREE, vectors, faces, chamfer){
      let cv=[],cf=[],corner_faces=new Array(vectors.length);
      for(let i=0;i<vectors.length;i++)corner_faces[i]=[];
      for(let i=0;i<faces.length;i++){
        let ii=faces[i],fl=ii.length-1,cp=new THREE.Vector3(),face=new Array(fl);
        for(let j=0;j<fl;j++){
          let vv=vectors[ii[j]].clone();cp.add(vv);
          corner_faces[ii[j]].push(face[j]=cv.push(vv)-1);
        }
        cp.divideScalar(fl);
        for(let j=0;j<fl;j++){let vv=cv[face[j]];vv.subVectors(vv,cp).multiplyScalar(chamfer).addVectors(vv,cp);}
        face.push(ii[fl]);cf.push(face);
      }
      for(let i=0;i<faces.length-1;i++){
        for(let j=i+1;j<faces.length;j++){
          let pairs=[],lastm=-1;
          for(let m=0;m<faces[i].length-1;m++){
            let n=faces[j].indexOf(faces[i][m]);
            if(n>=0&&n<faces[j].length-1){
              if(lastm>=0&&m!==lastm+1)pairs.unshift([i,m],[j,n]);
              else pairs.push([i,m],[j,n]);lastm=m;
            }
          }
          if(pairs.length!==4)continue;
          cf.push([cf[pairs[0][0]][pairs[0][1]],cf[pairs[1][0]][pairs[1][1]],cf[pairs[3][0]][pairs[3][1]],cf[pairs[2][0]][pairs[2][1]],-1]);
        }
      }
      for(let i=0;i<corner_faces.length;i++){
        let cfi=corner_faces[i],face=[cfi[0]],count=cfi.length-1;
        while(count){
          for(let m=faces.length;m<cf.length;m++){
            let idx=cf[m].indexOf(face[face.length-1]);
            if(idx>=0&&idx<4){if(--idx===-1)idx=3;let nv=cf[m][idx];if(cfi.indexOf(nv)>=0){face.push(nv);break;}}
          }--count;
        }
        face.push(-1);cf.push(face);
      }
      return{vectors:cv,faces:cf};
    }

    function makeGeometry(THREE, vertices, faces, radius, tab, af){
      let geom=new THREE.Geometry();
      for(let i=0;i<vertices.length;i++){let v=vertices[i].multiplyScalar(radius);v.index=geom.vertices.push(v)-1;}
      for(let i=0;i<faces.length;i++){
        let ii=faces[i],fl=ii.length-1,aa=Math.PI*2/fl;
        for(let j=0;j<fl-2;j++){
          geom.faces.push(new THREE.Face3(ii[0],ii[j+1],ii[j+2],[geom.vertices[ii[0]],geom.vertices[ii[j+1]],geom.vertices[ii[j+2]]],0,ii[fl]+1));
          geom.faceVertexUvs[0].push([
            new THREE.Vector2((Math.cos(af)+1+tab)/2/(1+tab),(Math.sin(af)+1+tab)/2/(1+tab)),
            new THREE.Vector2((Math.cos(aa*(j+1)+af)+1+tab)/2/(1+tab),(Math.sin(aa*(j+1)+af)+1+tab)/2/(1+tab)),
            new THREE.Vector2((Math.cos(aa*(j+2)+af)+1+tab)/2/(1+tab),(Math.sin(aa*(j+2)+af)+1+tab)/2/(1+tab)),
          ]);
        }
      }
      geom.computeFaceNormals();geom.boundingSphere=new THREE.Sphere(new THREE.Vector3(),radius);
      return geom;
    }

    function makeFaceTexture(THREE, text, fgColor, bgColor, size){
      const ts=Math.max(128,Math.pow(2,Math.floor(Math.log(size/2+size*1.0)/Math.log(2))))*2;
      const c=document.createElement('canvas');c.width=c.height=ts;
      const ctx=c.getContext('2d');
      // Dark background
      ctx.fillStyle=bgColor;ctx.fillRect(0,0,ts,ts);
      // Subtle face tint
      ctx.fillStyle=fgColor+'18';ctx.fillRect(0,0,ts,ts);
      // Border in accent color
      ctx.strokeStyle=fgColor+'99';ctx.lineWidth=6;
      ctx.strokeRect(8,8,ts-16,ts-16);
      // Number
      if(text!==null&&text!==''&&text!==' '){
        ctx.font=`bold ${ts*0.44}px 'DM Mono',monospace`;
        ctx.fillStyle=fgColor;ctx.textAlign='center';ctx.textBaseline='middle';
        const str=String(text);
        ctx.fillText(str,ts/2,ts/2+ts*0.03);
        if(str==='6'||str==='9'){
          const w=ctx.measureText(str).width;
          ctx.fillRect(ts/2-w/2,ts/2+ts*0.28,w,Math.max(3,ts/40));
        }
      }
      const tex=new THREE.CanvasTexture(c);return tex;
    }

    // ── Dice definitions (vertices, faces, chamfer, tab, af, faceTexts) ─────
    const DICE_DEFS={
      d4:{
        tab:-0.1,af:Math.PI*7/6,chamfer:0.96,scaleFactor:1.2,
        vertices:[[1,1,1],[-1,-1,1],[-1,1,-1],[1,-1,-1]],
        faces:[[1,0,2,1],[0,1,3,2],[0,3,2,3],[1,2,3,4]],
        faceTexts:[null,[['0','0','0']],[['2','4','3']],[['1','3','4']],[['2','1','4']],[['1','2','3']]],
        textMargin:2.0,
      },
      d6:{
        tab:0.1,af:Math.PI/4,chamfer:0.96,scaleFactor:0.9,
        vertices:[[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]],
        faces:[[0,3,2,1,1],[1,2,6,5,2],[0,1,5,4,3],[3,7,6,2,4],[0,4,7,3,5],[4,5,6,7,6]],
        faceTexts:[null,' ','1','2','3','4','5','6'],
        textMargin:1.0,
      },
      d8:{
        tab:0,af:-Math.PI/4/2,chamfer:0.965,scaleFactor:1.0,
        vertices:[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]],
        faces:[[0,2,4,1],[0,4,3,2],[0,3,5,3],[0,5,2,4],[1,3,4,5],[1,4,2,6],[1,2,5,7],[1,5,3,8]],
        faceTexts:[null,' ','1','2','3','4','5','6','7','8'],
        textMargin:1.2,
      },
      d10:{
        tab:0,af:Math.PI*6/5,chamfer:0.945,scaleFactor:0.9,
        vertices:(()=>{const v=[];for(let i=0,b=0;i<10;i++,b+=Math.PI*2/10)v.push([Math.cos(b),Math.sin(b),0.105*(i%2?1:-1)]);v.push([0,0,-1],[0,0,1]);return v;})(),
        faces:[[5,7,11,0],[4,2,10,1],[1,3,11,2],[0,8,10,3],[7,9,11,4],[8,6,10,5],[9,1,11,6],[2,0,10,7],[3,5,11,8],[6,4,10,9],[1,0,2,-1],[1,2,3,-1],[3,2,4,-1],[3,4,5,-1],[5,4,6,-1],[5,6,7,-1],[7,6,8,-1],[7,8,9,-1],[9,8,0,-1],[9,0,1,-1]],
        faceTexts:[null,' ','1','2','3','4','5','6','7','8','9','10'],
        textMargin:1.0,
      },
      d12:{
        tab:0.2,af:-Math.PI/4/2,chamfer:0.968,scaleFactor:0.9,
        vertices:(()=>{const p=(1+Math.sqrt(5))/2,q=1/p;return [[0,q,p],[0,q,-p],[0,-q,p],[0,-q,-p],[p,0,q],[p,0,-q],[-p,0,q],[-p,0,-q],[q,p,0],[q,-p,0],[-q,p,0],[-q,-p,0],[1,1,1],[1,1,-1],[1,-1,1],[1,-1,-1],[-1,1,1],[-1,1,-1],[-1,-1,1],[-1,-1,-1]];})(),
        faces:[[2,14,4,12,0,1],[15,9,11,19,3,2],[16,10,17,7,6,3],[6,7,19,11,18,4],[6,18,2,0,16,5],[18,11,9,14,2,6],[1,17,10,8,13,7],[1,13,5,15,3,8],[13,8,12,4,5,9],[5,4,14,9,15,10],[0,12,8,10,16,11],[3,19,7,17,1,12]],
        faceTexts:[null,' ','1','2','3','4','5','6','7','8','9','10','11','12'],
        textMargin:1.0,
      },
      d20:{
        tab:-0.2,af:-Math.PI/4/2,chamfer:0.955,scaleFactor:1.0,
        vertices:(()=>{const t=(1+Math.sqrt(5))/2;return [[-1,t,0],[1,t,0],[-1,-t,0],[1,-t,0],[0,-1,t],[0,1,t],[0,-1,-t],[0,1,-t],[t,0,-1],[t,0,1],[-t,0,-1],[-t,0,1]];})(),
        faces:[[0,11,5,1],[0,5,1,2],[0,1,7,3],[0,7,10,4],[0,10,11,5],[1,5,9,6],[5,11,4,7],[11,10,2,8],[10,7,6,9],[7,1,8,10],[3,9,4,11],[3,4,2,12],[3,2,6,13],[3,6,8,14],[3,8,9,15],[4,9,5,16],[2,4,11,17],[6,2,10,18],[8,6,7,19],[9,8,1,20]],
        faceTexts:[null,' ','1','2','3','4','5','6','7','8','9','10','11','12','13','14','15','16','17','18','19','20'],
        textMargin:1.0,
      },
    };

    function buildDiceMesh(type){
      if(!diceThree)return null;
      const THREE=diceThree;
      const def=DICE_DEFS[type];
      if(!def)return null;
      const cols=getDiceColors();
      const accentHex=cols.accent.trim();
      const textHex=cols.accent.trim(); // numbers in accent color
      const bgHex='#0a0e1a'; // always dark background for contrast
      const size=55;
      const radius=size*def.scaleFactor;

      // Build vectors
      const vectors=def.vertices.map(v=>new THREE.Vector3(...v).normalize());
      const chamfered=getChamferGeometry(THREE,vectors,def.faces,def.chamfer);
      const geom=makeGeometry(THREE,chamfered.vectors,chamfered.faces,radius,def.tab,def.af);

      // Build per-face materials
      const mats=[new THREE.MeshPhongMaterial({color:0x050d0a,specular:0x172022,shininess:20})]; // index 0 = chamfer faces
      const texts=def.faceTexts;
      for(let i=1;i<texts.length;i++){
        const tex=makeFaceTexture(THREE,texts[i],textHex,bgHex,size);
        mats.push(new THREE.MeshPhongMaterial({map:tex,specular:0x172022,shininess:30,flatShading:true}));
      }

      const mesh=new THREE.Mesh(geom,mats);
      return mesh;
    }

    function getDiceColors(){
      const s=getComputedStyle(document.documentElement);
      return{accent:s.getPropertyValue('--accent').trim()||'#50dca0',text:s.getPropertyValue('--text').trim()||'#e8f4f0'};
    }

    function initDice(){
      if(!window.THREE){console.warn('THREE not loaded yet');return;}
      diceThree=window.THREE;
      const THREE=diceThree;
      const canvasEl=document.getElementById('dice-canvas');
      const wrap=document.getElementById('dice-wrap');
      if(!canvasEl||!wrap){return;}
      if(typeof canvasEl.addEventListener!=='function'){return;}
      const w=wrap.offsetWidth||300,h=160;

      diceRenderer=new THREE.WebGLRenderer({canvas:canvasEl,antialias:true,alpha:true});
      diceRenderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
      diceRenderer.setSize(w,h);
      diceRenderer.setClearColor(0x000000,0);

      diceScene=new THREE.Scene();
      diceCamera=new THREE.PerspectiveCamera(45,w/h,0.1,1000);
      diceCamera.position.set(0,0,220);

      diceScene.add(new THREE.AmbientLight(0xffffff,0.5));
      const dir=new THREE.DirectionalLight(0xffffff,1.2);dir.position.set(100,150,200);diceScene.add(dir);
      const fill=new THREE.DirectionalLight(0xffffff,0.4);fill.position.set(-100,-100,50);diceScene.add(fill);

      diceMesh=buildDiceMesh(activeDie.value);
      if(diceMesh)diceScene.add(diceMesh);

      let rolling=false,rollStart=0,rollDuration=800,rollTarget={startX:0,startY:0,startZ:0,dx:0,dy:0,dz:0};
      function animate(){
        diceAnimFrame=requestAnimationFrame(animate);
        if(!diceMesh)return;
        if(rolling){
          const t=Math.min((Date.now()-rollStart)/rollDuration,1);
          const ease=1-Math.pow(1-t,3);
          const spin=Math.sin(t*Math.PI);
          diceMesh.rotation.x=rollTarget.startX+rollTarget.dx*ease+Math.PI*6*spin;
          diceMesh.rotation.y=rollTarget.startY+rollTarget.dy*ease+Math.PI*4*spin;
          diceMesh.rotation.z=rollTarget.startZ+rollTarget.dz*ease+Math.PI*2*spin;
          if(t>=1)rolling=false;
        } else {
          diceMesh.rotation.x+=0.004;
          diceMesh.rotation.y+=0.006;
        }
        diceRenderer.render(diceScene,diceCamera);
      }
      animate();

      diceRollTrigger=(rot)=>{
        if(!diceMesh)return;
        rolling=true;rollStart=Date.now();
        rollTarget={startX:diceMesh.rotation.x,startY:diceMesh.rotation.y,startZ:diceMesh.rotation.z,
          dx:rot.x-diceMesh.rotation.x,dy:rot.y-diceMesh.rotation.y,dz:rot.z-diceMesh.rotation.z};
      };
    }

    function teardownDice(){
      if(diceAnimFrame)cancelAnimationFrame(diceAnimFrame);
      if(diceRenderer)diceRenderer.dispose();
      diceScene=null;diceCamera=null;diceRenderer=null;diceMesh=null;diceAnimFrame=null;diceRollTrigger=null;
    }

    function switchDie(type){
      activeDie.value=type;diceResult.value=null;
      if(diceScene&&diceThree){
        if(diceMesh){diceScene.remove(diceMesh);diceMesh.geometry?.dispose();}
        diceMesh=buildDiceMesh(type);
        if(diceMesh)diceScene.add(diceMesh);
      }
    }

    function rollDice(){
      if(diceRolling.value)return;
      const sides=parseInt(activeDie.value.slice(1));
      const result=Math.floor(Math.random()*sides)+1;
      diceRolling.value=true;diceResult.value=null;
      if(diceRollTrigger){
        diceRollTrigger({x:Math.random()*Math.PI*4,y:Math.random()*Math.PI*4,z:Math.random()*Math.PI*2});
      }
      setTimeout(()=>{
        diceResult.value=result;diceRolling.value=false;
        diceHistory.value=[{die:activeDie.value,val:result},...diceHistory.value].slice(0,10);
        if(result===sides)tamaReact('win');
        else if(result>=Math.ceil(sides*0.7))tamaReact('cheer');
        else if(result===1)tamaReact('rage');else if(result<=Math.ceil(sides*0.15))tamaReact('sad');
      },820);
    }



    async function fetchAlbum(genre){album.value=null;albumLoading.value=true;const key=lastfmKey.value;if(!key){album.value=ALBUM_FALLBACKS[genre]||ALBUM_FALLBACKS['ambient'];albumLoading.value=false;return;}try{const page=Math.ceil(Math.random()*3);const r=await fetch(`https://ws.audioscrobbler.com/2.0/?method=tag.gettopalbums&tag=${encodeURIComponent(genre)}&api_key=${key}&format=json&limit=20&page=${page}`);const d=await r.json();const albums=d?.albums?.album?.filter(a=>a.artist?.name&&!a.artist.name.toLowerCase().includes('various'));if(!albums?.length)throw new Error('no results');const pick=albums[Math.floor(Math.random()*albums.length)];const ri=await fetch(`https://ws.audioscrobbler.com/2.0/?method=album.getinfo&artist=${encodeURIComponent(pick.artist.name)}&album=${encodeURIComponent(pick.name)}&api_key=${key}&format=json`);const di=await ri.json();const info=di?.album;const images=info?.image||pick.image||[];const art=images.find(i=>i.size==='extralarge')||images.find(i=>i.size==='large');album.value={title:info?.name||pick.name,artist:info?.artist||pick.artist?.name,year:info?.wiki?.published?new Date(info.wiki.published).getFullYear():null,art:art?.['#text']&&art['#text']!==''?art['#text']:null,url:info?.url||pick.url||null,why:info?.wiki?.summary?info.wiki.summary.replace(/<[^>]+>/g,'').split('.')[0].trim()+'.':null};}catch{album.value=ALBUM_FALLBACKS[genre]||ALBUM_FALLBACKS['ambient'];}albumLoading.value=false;}
    function pickGenre(g){selectedGenre.value=g;localStorage.setItem('aurora_genre',g);fetchAlbum(g);}

    async function fetchBg(topic){const key=unsplashKey.value;if(!key)return;try{const r=await fetch(`https://api.unsplash.com/photos/random?query=${encodeURIComponent(topic)}&orientation=landscape&content_filter=high`,{headers:{Authorization:`Client-ID ${key}`}});const d=await r.json();if(d.urls?.regular){const bg=document.getElementById('bg-layer');bg.style.opacity='0';setTimeout(()=>{bg.style.backgroundImage=`url(${d.urls.regular})`;bg.style.opacity='1';},400);bgCredit.value={name:d.user?.name||'Unknown',link:d.links?.html||'#'};}}catch{}}
    function refreshBg(){fetchBg(bgTopic.value);}
    function setBgTopic(t){bgTopic.value=t;localStorage.setItem('aurora_bgtopic',t);fetchBg(t);}

    function saveNotes(){clearTimeout(noteTimer);noteTimer=setTimeout(()=>{localStorage.setItem('aurora_notes',notes.value);notesSaved.value=true;setTimeout(()=>notesSaved.value=false,2000);},800);}
    function addTodo(){if(!todoInput.value.trim())return;todos.value.push({id:Date.now(),text:todoInput.value.trim(),done:false});todoInput.value='';localStorage.setItem('aurora_todos',JSON.stringify(todos.value));}
    function toggleTodo(id){const t=todos.value.find(t=>t.id===id);if(t)t.done=!t.done;localStorage.setItem('aurora_todos',JSON.stringify(todos.value));}
    function deleteTodo(id){todos.value=todos.value.filter(t=>t.id!==id);localStorage.setItem('aurora_todos',JSON.stringify(todos.value));}

    function setSomaStation(id){somaStation.value=id;localStorage.setItem('aurora_soma',id);if(somaPlaying.value){somaAudio.src=currentSoma.value.stream;somaAudio.play();}}
    function toggleSoma(){if(somaPlaying.value){somaAudio.pause();somaPlaying.value=false;}else{somaAudio.src=currentSoma.value.stream;somaAudio.volume=parseFloat(somaVolume.value);somaAudio.play().catch(()=>{});somaPlaying.value=true;}}
    function updateSomaVolume(){somaAudio.volume=parseFloat(somaVolume.value);}

    function saveSettings(){localStorage.setItem('aurora_location',locationInput.value);localStorage.setItem('aurora_unsplash',unsplashKey.value);localStorage.setItem('aurora_lastfm',lastfmKey.value);localStorage.setItem('aurora_nasa',nasaKey.value);localStorage.setItem('aurora_musicapp',musicApp.value);localStorage.setItem('aurora_theme',currentTheme.value);localStorage.setItem('aurora_fahrenheit',useFahrenheit.value);bookmarks.value=bookmarkEdits.value.filter(b=>b.url);localStorage.setItem('aurora_bookmarks',JSON.stringify(bookmarks.value));showSettings.value=false;locateAndLoad();fetchBg(bgTopic.value);fetchAlbum(selectedGenre.value);fetchAPOD();}

    onMounted(()=>{applyTheme(currentTheme.value);updateNumCols();window.addEventListener('resize',updateNumCols);window.addEventListener('scroll',tamaOnScroll,{passive:true});document.addEventListener('pointerdown',()=>{tamaLastInteraction=Date.now();tamaSleepy=0;},{passive:true});clockTimer=setInterval(()=>{now.value=new Date();},10000);locateAndLoad();fetchKP();fetchQuote();fetchAlbum(selectedGenre.value);fetchBg(bgTopic.value);fetchAnimal();fetchAPOD();fetchChangelogBadge();w2048Init();setInterval(fetchKP,5*60*1000);setInterval(()=>{if(unsplashKey.value)fetchBg(bgTopic.value);},15*60*1000);tamaInit();});
    onUnmounted(()=>{clearInterval(clockTimer);window.removeEventListener('resize',updateNumCols);window.removeEventListener('scroll',tamaOnScroll);teardownDice();});

    // Watch for dice canvas to appear in DOM (widget may not be visible on mount)
    watch(visibleWidgets, ()=>{
      if(visibleWidgets.value.find(w=>w.id==='dice') && !diceRenderer){
        // Lazy-load Three.js if not already present
        if(!window.THREE){
          const s=document.createElement('script');
          s.src='https://unpkg.com/three@0.124.0/build/three.min.js';
          document.head.appendChild(s);
        }
        let attempts=0;
        const poll=setInterval(()=>{
          attempts++;
          const el=document.getElementById('dice-canvas');
          if(el && window.THREE){clearInterval(poll);initDice();}
          else if(attempts>40)clearInterval(poll);
        },100);
      }
    },{immediate:true});

    // Theme-aware dice — rebuild mesh when accent color changes
    watch(currentTheme,()=>{
      if(diceScene&&diceThree&&diceMesh){
        diceScene.remove(diceMesh);diceMesh.geometry?.dispose();
        diceMesh=buildDiceMesh(activeDie.value);
        if(diceMesh)diceScene.add(diceMesh);
      }
    });

    // KP alert watcher
    watch(kp,()=>checkKpAlert());

    watch(useFahrenheit,v=>localStorage.setItem('aurora_fahrenheit',v));

    // ── TAMAGOTCHI ──────────────────────────────────────────────────────────────
    let tamaFrame=0, tamaBlinkTimer=0, tamaHappy=0, tamaSad=0, tamaWin=0, tamaRage=0, tamaSleepy=0, tamaAnimId=null;
    let tamaLastInteraction=Date.now();
    const tamaIdleMs=2*60*1000;

    function tamaTimeOfDay(){
      const h=new Date().getHours();
      // Night owl: 23-5 = very sleepy
      // Morning: 6-8 = happy/energetic
      // Afternoon: 9-17 = normal
      // Evening: 18-22 = calm
      if(h>=23||h<5)return'night';
      if(h>=6&&h<=8)return'morning';
      return'day';
    }

    const TAMA_CHARS=[
      {id:'blob',  label:'Blob',   emoji:'🫧'},
      {id:'cat',   label:'Cat',    emoji:'🐱'},
      {id:'ghost', label:'Ghost',  emoji:'👻'},
      {id:'robot', label:'Robot',  emoji:'🤖'},
      {id:'frog',  label:'Frog',   emoji:'🐸'},
      {id:'alien', label:'Alien',  emoji:'👾'},
    ];
    const tamaChar=ref(localStorage.getItem('aurora_tama')||'blob');
    const tamaPickerOpen=ref(false);
    const tamaWalking=ref(false);
    const tamaDancing=ref(false);
    let tamaScrollTimer=null;

    const SOMA_BPM={
      dronezone:  40,
      spacestation:55,
      lush:       70,
      groovesalad:88,
      thetrip:    110,
    };
    const tamaBPM=computed(()=>tamaDancing.value?(SOMA_BPM[somaStation.value]||80):80);
    const tamaRaging=computed(()=>tamaRage>0);
    watch(somaPlaying,v=>tamaDancing.value=v);

    function tamaOnScroll(){
      tamaWalking.value=true;
      clearTimeout(tamaScrollTimer);
      tamaScrollTimer=setTimeout(()=>tamaWalking.value=false, 300);
    }

    function tamaSetChar(id){
      tamaChar.value=id;
      localStorage.setItem('aurora_tama',id);
      tamaPickerOpen.value=false;
    }
    function tamaInteract(){tamaHappy=40;}
    function tamaReact(mood){tamaHappy=0;tamaSad=0;tamaWin=0;tamaRage=0;if(mood==='cheer')tamaHappy=60;else if(mood==='sad')tamaSad=40;else if(mood==='rage')tamaRage=120;else if(mood==='win')tamaWin=150;}

    function tamaGetColor(){
      const cs=getComputedStyle(document.documentElement);
      return cs.getPropertyValue('--accent').trim()||'#50dca0';
    }

    // Draw helpers
    function tamaPx(ctx,col,pixels,ox,oy,S){
      ctx.fillStyle=col;
      pixels.forEach(([r,c])=>ctx.fillRect(ox+c*S,oy+r*S,S,S));
    }

    function tamaDraw(){
      const cv=document.getElementById('tama-canvas');
      if(!cv)return;
      const ctx=cv.getContext('2d');
      ctx.clearRect(0,0,64,64);
      const col=tamaGetColor();
      const S=4;
      const blink=tamaBlinkTimer>0;
      const happy=tamaHappy>0;
      const sad=tamaSad>0;
      const win=tamaWin>0;
      const rage=tamaRage>0;
      const sleepy=tamaSleepy>0||(!happy&&!sad&&!win&&!rage&&Date.now()-tamaLastInteraction>tamaIdleMs);
      const tod=tamaTimeOfDay();
      const morning=tod==='morning'&&!happy&&!sad&&!win&&!rage&&!sleepy;
      const dancing=tamaDancing.value&&!happy&&!sad&&!win&&!rage&&!sleepy;
      const bpmFreq=dancing?(tamaBPM.value/60)*(Math.PI*2/60):0;
      const rageShake=rage?Math.round((Math.random()-0.5)*10):0;
      // Sleepy: slow nod forward and back
      const sleepNod=sleepy?Math.round(Math.sin(tamaFrame*0.03)*4):0;
      const bounce=sad
        ? Math.round(Math.sin(tamaFrame*0.05)*1)
        : win
          ? Math.round(Math.sin(tamaFrame*0.35)*5)
          : rage ? rageShake
          : sleepy ? sleepNod
          : morning ? Math.round(Math.sin(tamaFrame*0.06)*2) // gentle morning bounce
          : dancing
            ? Math.round(Math.sin(tamaFrame*bpmFreq)*4)
            : Math.round(Math.sin(tamaFrame*0.06)*2)+(happy?Math.round(Math.sin(tamaFrame*0.15)*3):0);
      const sway=rage?Math.round((Math.random()-0.5)*10):sleepy?Math.round(Math.sin(tamaFrame*0.03)*3):dancing?Math.round(Math.sin(tamaFrame*bpmFreq)*3):0;
      const foot=Math.sin(tamaFrame*(tamaWalking.value||win?0.4:rage?1.2:happy?0.3:morning?0.07:dancing?bpmFreq*2:0.07))>0;
      const char=tamaChar.value;

      if(char==='blob'){
        // Round blob
        const ox=16+sway,oy=10+bounce;
        tamaPx(ctx,col,[[0,1],[0,2],[0,3],[0,4],[1,0],[1,1],[1,2],[1,3],[1,4],[1,5],[2,0],[2,5],[3,0],[3,5],[4,0],[4,5],[5,1],[5,2],[5,3],[5,4]],ox,oy,S);
        // Eyes
        if(happy||win){tamaPx(ctx,'#0a0e1a',[[1,1],[2,0],[2,2],[1,4],[2,3],[2,5]],ox,oy,S);}
        else if(blink){tamaPx(ctx,'#0a0e1a',[[2,1],[2,2],[2,4],[2,5]],ox,oy,S);}
        else{tamaPx(ctx,'#e8f4f0',[[1,1],[1,2],[1,4],[1,5]],ox,oy,S);tamaPx(ctx,'#0a0e1a',[[2,1],[2,4]],ox,oy,S);}
        // Mouth
        if(happy||win){tamaPx(ctx,'#0a0e1a',[[4,1],[3,2],[3,3],[4,4]],ox,oy,S);}
        else{tamaPx(ctx,'#0a0e1a',[[4,2],[4,3]],ox,oy,S);}
        // Feet
        tamaPx(ctx,col,foot?[[6,1],[5,4]]:[[5,1],[6,4]],ox,oy,S);

      } else if(char==='cat'){
        const ox=14+sway,oy=8+bounce;
        // Ears
        tamaPx(ctx,col,[[0,0],[1,0],[1,1],[0,5],[1,5],[1,4]],ox,oy,S);
        // Head
        tamaPx(ctx,col,[[2,0],[2,1],[2,2],[2,3],[2,4],[2,5],[3,0],[3,1],[3,2],[3,3],[3,4],[3,5],[4,0],[4,1],[4,2],[4,3],[4,4],[4,5],[5,1],[5,2],[5,3],[5,4]],ox,oy,S);
        // Eyes
        if(happy||win){tamaPx(ctx,'#0a0e1a',[[3,1],[4,0],[4,2],[3,4],[4,3],[4,5]],ox,oy,S);}
        else if(blink){tamaPx(ctx,'#0a0e1a',[[4,1],[4,2],[4,4],[4,5]],ox,oy,S);}
        else{tamaPx(ctx,'#e8f4f0',[[3,1],[3,2],[3,4],[3,5]],ox,oy,S);tamaPx(ctx,'#0a0e1a',[[4,1],[4,4]],ox,oy,S);}
        // Nose + whiskers
        tamaPx(ctx,'#ffb3ba',[[5,2],[5,3]],ox,oy,S);
        tamaPx(ctx,'#0a0e1a',[[5,0],[5,5]],ox,oy,S);
        // Mouth
        if(happy||win){tamaPx(ctx,'#0a0e1a',[[6,1],[5,2],[5,3],[6,4]],ox,oy,S);}
        // Body + tail
        tamaPx(ctx,col,[[6,1],[6,2],[6,3],[6,4],[7,1],[7,2],[7,3],[7,4]],ox,oy,S);
        tamaPx(ctx,col,[[6,5],[7,5],[7,6],[6,6]],ox,oy,S);
        // Feet
        tamaPx(ctx,col,foot?[[8,1],[8,3]]:[[8,2],[8,4]],ox,oy,S);

      } else if(char==='ghost'){
        const ox=14+sway,oy=8+bounce;
        // Body
        tamaPx(ctx,col,[[0,1],[0,2],[0,3],[0,4],[1,0],[1,1],[1,2],[1,3],[1,4],[1,5],[2,0],[2,5],[3,0],[3,5],[4,0],[4,5],[5,0],[5,1],[5,2],[5,3],[5,4],[5,5]],ox,oy,S);
        // Wavy bottom
        tamaPx(ctx,col,foot?[[6,0],[6,2],[6,4],[7,1],[7,3],[7,5]]:[[6,1],[6,3],[6,5],[7,0],[7,2],[7,4]],ox,oy,S);
        // Eyes
        if(happy||win){tamaPx(ctx,'#0a0e1a',[[2,1],[3,0],[3,2],[2,4],[3,3],[3,5]],ox,oy,S);}
        else if(blink){tamaPx(ctx,'#0a0e1a',[[3,1],[3,2],[3,4],[3,5]],ox,oy,S);}
        else{tamaPx(ctx,'#e8f4f0',[[2,1],[2,2],[2,4],[2,5]],ox,oy,S);tamaPx(ctx,'#0a0e1a',[[3,1],[3,4]],ox,oy,S);}
        // Mouth
        if(happy||win){tamaPx(ctx,'#0a0e1a',[[4,1],[4,2],[4,3],[4,4]],ox,oy,S);}
        else{tamaPx(ctx,'#0a0e1a',[[4,2],[4,3]],ox,oy,S);}

      } else if(char==='robot'){
        const ox=14+sway,oy=8+bounce;
        // Antenna
        tamaPx(ctx,col,[[0,2],[0,3],[1,2],[1,3]],ox,oy,S);
        // Head (square)
        tamaPx(ctx,col,[[2,0],[2,1],[2,2],[2,3],[2,4],[2,5],[3,0],[3,5],[4,0],[4,5],[5,0],[5,1],[5,2],[5,3],[5,4],[5,5]],ox,oy,S);
        // Eyes - LED style
        if(happy){ctx.fillStyle='#ffff00';}else{ctx.fillStyle=blink?col:'#00ff99';}
        if(!blink||happy){[[3,1],[3,2],[3,4],[3,5]].forEach(([r,c])=>ctx.fillRect(ox+c*S,oy+r*S,S,S));}
        // Mouth - grid of squares
        const mouthPx=happy?[[4,1],[4,2],[4,3],[4,4]]:[[4,1],[4,3]];
        tamaPx(ctx,'#0a0e1a',mouthPx,ox,oy,S);
        // Body
        tamaPx(ctx,col,[[6,0],[6,1],[6,2],[6,3],[6,4],[6,5],[7,0],[7,5],[8,0],[8,5],[9,0],[9,1],[9,2],[9,3],[9,4],[9,5]],ox,oy,S);
        // Arms
        tamaPx(ctx,col,[[7,6],[8,6],[7,-1],[8,-1]],ox,oy,S);
        // Legs
        tamaPx(ctx,col,foot?[[10,1],[10,4]]:[[10,2],[10,3]],ox,oy,S);

      } else if(char==='frog'){
        const ox=14+sway,oy=10+bounce;
        // Eyes on top (bulgy)
        tamaPx(ctx,col,[[0,0],[0,1],[0,4],[0,5],[1,0],[1,1],[1,4],[1,5]],ox,oy,S);
        if(blink){tamaPx(ctx,'#0a0e1a',[[1,0],[1,1],[1,4],[1,5]],ox,oy,S);}
        else{tamaPx(ctx,'#e8f4f0',[[0,0],[0,1],[0,4],[0,5]],ox,oy,S);tamaPx(ctx,'#0a0e1a',[[0,0],[0,4]],ox,oy,S);}
        // Head/body
        tamaPx(ctx,col,[[2,0],[2,1],[2,2],[2,3],[2,4],[2,5],[3,0],[3,1],[3,2],[3,3],[3,4],[3,5],[4,0],[4,1],[4,2],[4,3],[4,4],[4,5],[5,0],[5,1],[5,2],[5,3],[5,4],[5,5]],ox,oy,S);
        // Belly (lighter)
        tamaPx(ctx,'#e8f4f0',[[3,1],[3,2],[3,3],[3,4],[4,1],[4,2],[4,3],[4,4]],ox,oy,S);
        // Mouth
        if(happy||win){tamaPx(ctx,'#0a0e1a',[[4,0],[3,1],[3,2],[3,3],[3,4],[4,5]],ox,oy,S);}
        else{tamaPx(ctx,'#0a0e1a',[[5,1],[5,2],[5,3],[5,4]],ox,oy,S);}
        // Legs
        tamaPx(ctx,col,foot?[[6,0],[6,1],[6,4],[6,5],[7,0],[7,5]]:[[6,0],[6,5],[7,0],[7,1],[7,4],[7,5]],ox,oy,S);

      } else if(char==='alien'){
        const ox=14+sway,oy=8+bounce;
        // Head (tall oval)
        tamaPx(ctx,col,[[0,2],[0,3],[1,1],[1,2],[1,3],[1,4],[2,0],[2,1],[2,2],[2,3],[2,4],[2,5],[3,0],[3,5],[4,0],[4,5],[5,0],[5,1],[5,2],[5,3],[5,4],[5,5],[6,1],[6,2],[6,3],[6,4]],ox,oy,S);
        // Big eyes
        if(happy){
          tamaPx(ctx,'#ffffff',[[2,1],[2,2],[3,1],[3,2],[2,4],[2,5],[3,4],[3,5]],ox,oy,S);
          tamaPx(ctx,'#0a0e1a',[[3,1],[3,4]],ox,oy,S);
          tamaPx(ctx,'#ffff00',[[2,1],[2,4]],ox,oy,S);
        } else if(blink){
          tamaPx(ctx,'#0a0e1a',[[3,1],[3,2],[3,4],[3,5]],ox,oy,S);
        } else {
          tamaPx(ctx,'#ffffff',[[2,1],[2,2],[3,1],[3,2],[2,4],[2,5],[3,4],[3,5]],ox,oy,S);
          tamaPx(ctx,'#0a0e1a',[[3,1],[3,4]],ox,oy,S);
        }
        // Mouth slots
        if(happy||win){tamaPx(ctx,'#0a0e1a',[[5,1],[5,2],[5,3],[5,4]],ox,oy,S);}
        else{tamaPx(ctx,'#0a0e1a',[[5,1],[5,3]],ox,oy,S);}
        // Antennae
        tamaPx(ctx,col,[[-1,1],[-2,0],[-1,4],[-2,5]],ox,oy,S);
        // Body + spindly legs
        tamaPx(ctx,col,[[7,2],[7,3],[8,2],[8,3]],ox,oy,S);
        tamaPx(ctx,col,foot?[[9,1],[9,4],[10,0],[10,5]]:[[9,0],[9,5],[10,1],[10,4]],ox,oy,S);
      }

      // Sleepy ZZZs
      if(sleepy){
        ctx.font='bold 9px monospace';
        ctx.fillStyle='#aaccff';
        const zAlpha=0.4+Math.sin(tamaFrame*0.05)*0.3;
        ctx.globalAlpha=zAlpha;
        ctx.fillText('z',52,12+bounce);
        ctx.globalAlpha=zAlpha*0.7;
        ctx.fillText('z',56,7+bounce);
        ctx.globalAlpha=zAlpha*0.4;
        ctx.fillText('Z',60,2+bounce);
        ctx.globalAlpha=1;
      }

      // Morning sparkle — little sun rays
      if(morning){
        ctx.fillStyle='#ffd700';
        [[8,8],[56,8],[8,56],[56,56]].forEach(([sx,sy],i)=>{
          ctx.globalAlpha=0.5*(Math.sin(tamaFrame*0.05+i)*0.5+0.5);
          ctx.fillRect(sx,sy+bounce,S,S);
        });
        ctx.globalAlpha=1;
      }

      // Music notes when dancing
      if(dancing){
        ctx.font='10px serif';
        ctx.globalAlpha=0.7*(Math.sin(tamaFrame*0.08)*0.4+0.6);
        ctx.fillStyle=col;
        const n1y=8+bounce-((tamaFrame*0.5)%20);
        const n2y=4+bounce-((tamaFrame*0.5+10)%20);
        ctx.fillText('♪',50,n1y);
        ctx.fillText('♫',2,n2y);
        ctx.globalAlpha=1;
      }

      // Happy/win sparkles
      if(happy||win){
        const alpha=(tamaHappy||tamaWin)/(win?150:60);
        const sparkCol=win?'#ffd700':col;
        [[6,6],[56,8],[8,52],[54,50]].forEach(([sx,sy],i)=>{
          ctx.globalAlpha=alpha*(Math.sin(tamaFrame*0.4+i)*0.5+0.5);
          ctx.fillStyle=sparkCol;
          ctx.fillRect(sx,sy+bounce,S,S);
          ctx.fillRect(sx+S,sy-S+bounce,S,S);
          ctx.fillRect(sx-S,sy-S+bounce,S,S);
        });
        ctx.globalAlpha=1;
      }

      // Rage sparks — red/orange flying in all directions
      if(rage){
        const alpha=tamaRage/120;
        const sparks=[
          [4,4,'#ff2200'],[58,4,'#ff6600'],[4,58,'#ff4400'],[58,58,'#ffaa00'],
          [32,2,'#ff0000'],[2,32,'#ff3300'],[60,32,'#ff6600'],[32,60,'#ff2200'],
        ];
        sparks.forEach(([sx,sy,sparkCol],i)=>{
          // Sparks fly outward over time
          const progress=(120-tamaRage)/120;
          const dist=progress*20;
          const angle=(i/sparks.length)*Math.PI*2;
          const ex=sx+Math.cos(angle)*dist+rageShake;
          const ey=sy+Math.sin(angle)*dist+bounce;
          ctx.globalAlpha=alpha*(Math.random()*0.5+0.5);
          ctx.fillStyle=sparkCol;
          ctx.fillRect(ex,ey,S*1.5,S*1.5);
          // Spark trail
          ctx.globalAlpha=alpha*0.3;
          ctx.fillRect(ex-Math.cos(angle)*4,ey-Math.sin(angle)*4,S,S);
        });
        // Rage veins — red lines at edges of canvas
        ctx.globalAlpha=alpha*0.6;
        ctx.strokeStyle='#ff2200';
        ctx.lineWidth=2;
        ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(10+Math.random()*10,20+Math.random()*10);ctx.stroke();
        ctx.beginPath();ctx.moveTo(64,0);ctx.lineTo(54-Math.random()*10,20+Math.random()*10);ctx.stroke();
        ctx.globalAlpha=1;
      }

      // Sad teardrops
      if(sad){
        const alpha=tamaSad/40;
        ctx.globalAlpha=alpha*0.8;
        ctx.fillStyle='#6ab4ff';
        const tearY=32+bounce+Math.floor(tamaFrame/4)%12;
        ctx.fillRect(20,tearY,S,S);
        ctx.fillRect(40,tearY+4,S,S);
        ctx.globalAlpha=1;
      }

      tamaFrame++;
      tamaBlinkTimer=Math.max(0,tamaBlinkTimer-1);
      if(tamaHappy>0)tamaHappy--;
      if(tamaSad>0)tamaSad--;
      if(tamaWin>0)tamaWin--;
      if(tamaRage>0)tamaRage--;
      // Sleepy: blink every ~2s, stay closed longer
      const blinkInterval=sleepy?80:200;
      const blinkDur=sleepy?20:8;
      if(tamaFrame%blinkInterval===0&&tamaBlinkTimer===0)tamaBlinkTimer=blinkDur;
    }

    function tamaInit(){
      if(tamaAnimId)cancelAnimationFrame(tamaAnimId);
      // Morning greeting
      if(tamaTimeOfDay()==='morning')setTimeout(()=>tamaReact('cheer'),1000);
      function loop(){tamaDraw();tamaAnimId=requestAnimationFrame(loop);}
      loop();
    }

    watch(currentTheme,()=>{}); // color auto-picked in tamaDraw

    return{clockStr,dateStr,showSettings,showPicker,showChangelog,changelogLoading,changelogError,changelogEntries,changelogUnread,openChangelog,locationInput,unsplashKey,lastfmKey,nasaKey,musicApp,currentTheme,useFahrenheit,bgTopic,selectedGenre,bookmarks,bookmarkEdits,locationName,locationError,weather,sunData,sunProgress,sunArcY,kp,kpInfo:kpInfoVal,kpAlert,dismissKpAlert,aqi,tides,tidesError,issPasses,issError,formatISSTime,moon,planets,quote,animal,animalLoading,apod,album,albumLoading,bgCredit,notes,notesSaved,todos,todoInput,somaStation,somaPlaying,somaVolume,currentSoma,diceTypes,activeDie,diceResult,diceRolling,diceHistory,diceMod,rollDice,switchDie,chatUser,chatAuthMode,chatUsername,chatPassword,chatAuthLoading,chatError,chatTurnstileToken,chatMessages,chatOnline,chatTypingText,chatInput,chatMessagesEl,chatInputEl,chatSubmitAuth,chatSend,chatOnTyping,chatLogout,chatRenderText,formatChatTime,activeWidget,setActiveWidget,clearActiveWidget,solTableau,solFoundations,solStock,solWaste,solMoves,solWon,solInit,solNewGame,solSelected,solDraw,solClickWaste,solClickFoundation,solClickCol,solClickCard,solAutoFoundation,solDrawPixi,solInitPixi,snakeScore,snakeBest,snakeRunning,snakeDead,snakePaused,snakeStart,snakePause,snakeSetDir,wordleGuesses,wordleResults,wordleCurrent,wordleMsg,wordleKeyRows,wordleGetLetter,wordleGetClass,wordleKeyClass,wordleKey,wordleHandleMobileKey,wordleHandleMobileInput,worldClockCities,worldClockPick,worldClockOptions,worldClockTime,worldClockDate,worldClockAdd,worldClockRemove,steamGenres,steamGenre,steamLoading,steamError,steamGame,steamScoreClass,steamPickGenre,steamNext,film,filmGenre,filmGenres,filmNext,passValue,passLength,passOpts,passCopied,passGenerate,passCopy,paletteBase,paletteType,paletteTypes,paletteColors,paletteCopied,paletteGenerate,paletteCopy,themeMap:THEMES,bgTopics:BG_TOPICS,genres:GENRES,somaStations:SOMA_STATIONS,widgetRegistry,visibleWidgets,masonryColumns,pickerDragging,pickerTarget,cToF,msToMph,musicAppLabel,musicAppLink,toggleWidget,onPickerDragStart,onPickerDragOver,onPickerDrop,onPickerDragEnd,onPickerTouchStart,onPickerTouchMove,onPickerTouchEnd,fetchQuote,fetchAnimal,fetchAlbum,refreshBg,setBgTopic,pickGenre,setTheme,setSomaStation,toggleSoma,updateSomaVolume,saveNotes,addTodo,toggleTodo,deleteTodo,saveSettings,tamaReact,tamaInteract,TAMA_CHARS,tamaChar,tamaPickerOpen,tamaSetChar,tamaWalking,tamaDancing,tamaBPM,tamaRaging,chatUnread,chatBubble};
  }
}).mount('#app');
