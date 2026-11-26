'use client';
import {useEffect,useRef} from 'react';import {Shop} from '@/lib/api';
export default function ShopMap({shops}:{shops:Shop[]}){const div=useRef<HTMLDivElement>(null);useEffect(()=>{if(!div.current||shops.length===0)return;let active=true;let instance:import('leaflet').Map|undefined;import('leaflet').then(L=>{if(!active||!div.current)return;instance=L.map(div.current,{scrollWheelZoom:false});L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'&copy; OpenStreetMap contributors',maxZoom:19}).addTo(instance);const bounds:import('leaflet').LatLngTuple[]=shops.map(s=>[s.latitude,s.longitude] as import('leaflet').LatLngTuple);shops.forEach(s=>{const point=L.divIcon({className:'kh-map-pin',html:'<div>🏪</div>',iconSize:[35,40],iconAnchor:[17,40]});const popup=document.createElement('div');
 const title=document.createElement('strong');title.textContent=s.name;
 const village=document.createElement('div');village.textContent=s.village;
 const link=document.createElement('a');link.href=`/shops/${s.id}`;link.textContent='View shop';
 popup.append(title,village,link);
 L.marker([s.latitude,s.longitude],{icon:point}).bindPopup(popup).addTo(instance!);});instance.fitBounds(L.latLngBounds(bounds).pad(.15),{maxZoom:13});});return ()=>{active=false;instance?.remove()};},[shops]);if(!shops.length)return null;return <div className="panel" style={{marginBottom:24}}><h3>Shops on the village map</h3><div ref={div} className="leaflet-map" aria-label="Map of verified agricultural shops"/></div>}
