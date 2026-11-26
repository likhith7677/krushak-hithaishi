'use client';
import {useEffect,useState} from 'react';import {api,Shop,categories} from '@/lib/api';import {useLang} from '@/lib/i18n';import type {VoiceCommandEvent} from '@/lib/voice';import ShopCard from '@/components/ShopCard';import ShopMap from '@/components/ShopMap';import {MapPin,LocateFixed,Store,Search,SlidersHorizontal} from 'lucide-react';
export default function Shops(){const{t}=useLang();const[shops,setShops]=useState<Shop[]>([]);const[q,setQ]=useState('');const[category,setCategory]=useState('');const[location,setLocation]=useState<{lat:number;lng:number}|null>(null);const[busy,setBusy]=useState(true);const[error,setError]=useState('');const[mapVisible,setMapVisible]=useState(false);const[locationStatus,setLocationStatus]=useState('');
 useEffect(()=>{let active=true;setBusy(true);setError('');const query=new URLSearchParams();if(q)query.set('q',q);if(category)query.set('category',category);if(location){query.set('lat',String(location.lat));query.set('lng',String(location.lng));query.set('radius_km','100');}const handle=setTimeout(()=>{api<Shop[]>(`/api/shops/nearby?${query}`).then(x=>{if(active)setShops(x)}).catch(e=>{if(active)setError(e.message)}).finally(()=>{if(active)setBusy(false)})},300);return ()=>{active=false;clearTimeout(handle)};},[q,category,location]);
 function locate(){if(!navigator.geolocation){setLocationStatus('GPS unavailable in this browser.');return;}setLocationStatus('Finding your location…');navigator.geolocation.getCurrentPosition(x=>{setLocation({lat:x.coords.latitude,lng:x.coords.longitude});setLocationStatus('Sorted by distance within 100 km. Distance is straight-line, not driving distance.');},()=>setLocationStatus('Location denied. You can still search by village.'),{enableHighAccuracy:false,timeout:10000});}
 useEffect(()=>{
   // Apply spoken navigation parameters once, when the page is opened.
   const params=new URLSearchParams(window.location.search);
   const search=params.get('search');
   if(search)setQ(search.slice(0,80));
   const command=params.get('voice');
   if(command==='show-map')setMapVisible(true);
   if(command==='hide-map')setMapVisible(false);
   if(command==='locate')locate();
 },[]);
 useEffect(()=>{
   const onVoice=(event:Event)=>{
     const intent=(event as VoiceCommandEvent).detail.intent;
     if(intent.kind==='search-shops')setQ(intent.query.slice(0,80));
     if(intent.kind==='locate')locate();
     if(intent.kind==='show-map')setMapVisible(true);
     if(intent.kind==='hide-map')setMapVisible(false);
   };
   window.addEventListener('kh:voice-command',onVoice);
   return ()=>window.removeEventListener('kh:voice-command',onVoice);
 });
 return <><section className="inner-hero"><div className="container"><div className="eyebrow"><MapPin size={16}/> LOCAL AGRI SHOPS / ಹಳ್ಳಿಯ ಅಂಗಡಿಗಳು</div><h1>{t('find')}</h1><p>Explore verified, owner-registered agricultural stores. Stock and prices are reported by the store and may change — call before visiting.</p></div></section><section className="page-section"><div className="container"><div className="search-bar"><input value={q} onChange={e=>setQ(e.target.value)} className="search-control" placeholder={t('search')} aria-label="Search shop or village"/><select aria-label="Product category" className="search-control" style={{maxWidth:200}} value={category} onChange={e=>setCategory(e.target.value)}><option value="">All product categories</option>{categories.map(c=><option key={c}>{c}</option>)}</select><button onClick={locate} className="btn btn-green"><LocateFixed size={17}/>{t('useLocation')}</button><button className="btn btn-outline" onClick={()=>setMapVisible(!mapVisible)}><MapPin size={16}/> {mapVisible?'Hide map':'Show map'}</button></div>{locationStatus&&<p className="helper">{locationStatus}</p>}{error&&<div className="message error">{error}</div>}{busy?<div className="empty-state"><div className="spinner"/><p>Loading village shops…</p></div>:shops.length?<>{mapVisible&&<ShopMap shops={shops}/>}<p className="helper">{shops.length} approved shop{shops.length!==1?'s':''} found. Shop inventory is owner-reported.</p><div className="shop-grid">{shops.map(s=><ShopCard shop={s} key={s.id}/>)}</div></>:<div className="empty-state"><Store size={43}/><h3>{t('noShops')}</h3><p>Shops appear after their owners register and an administrator verifies them. Try another village or clear the category filter.</p></div>}</div></section></>}
