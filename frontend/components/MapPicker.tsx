'use client';
import {useEffect,useRef,useState} from 'react';import {MapPin,LocateFixed} from 'lucide-react';
type Position={lat:number;lng:number};
export default function MapPicker({value,onChange}:{value:Position;onChange:(p:Position)=>void}){
 const div=useRef<HTMLDivElement>(null);const map=useRef<import('leaflet').Map|null>(null);const marker=useRef<import('leaflet').Marker|null>(null);const changed=useRef(onChange);const[message,setMessage]=useState('Tap on the map or drag the pin to your shop entrance.');const[address,setAddress]=useState('');
 useEffect(()=>{changed.current=onChange},[onChange]);
 useEffect(()=>{if(!div.current||map.current)return;let active=true;import('leaflet').then(L=>{if(!active||!div.current)return;const m=L.map(div.current,{scrollWheelZoom:false}).setView([value.lat,value.lng],12);map.current=m;L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',maxZoom:19}).addTo(m);
 const pin=L.divIcon({className:'kh-map-pin',html:'<div>📍</div>',iconSize:[38,45],iconAnchor:[19,42]});const mark=L.marker([value.lat,value.lng],{draggable:true,icon:pin}).addTo(m);marker.current=mark;
 const emit=(lat:number,lng:number)=>{changed.current({lat:Number(lat.toFixed(6)),lng:Number(lng.toFixed(6))});setMessage('Pin updated. Confirm this is the actual shop location.');};
 m.on('click',e=>{mark.setLatLng(e.latlng);emit(e.latlng.lat,e.latlng.lng)});
 mark.on('dragend',()=>{const p=mark.getLatLng();emit(p.lat,p.lng)});
 setTimeout(()=>m.invalidateSize(),180);
 });return ()=>{active=false;map.current?.remove();map.current=null;marker.current=null}; // map created only on mount
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[]);
 useEffect(()=>{if(map.current&&marker.current){marker.current.setLatLng([value.lat,value.lng]);map.current.panTo([value.lat,value.lng]);}},[value.lat,value.lng]);
 function locate(){if(!navigator.geolocation){setMessage('GPS is not supported. Place the pin manually.');return;}setMessage('Requesting location permission…');navigator.geolocation.getCurrentPosition(({coords})=>{changed.current({lat:coords.latitude,lng:coords.longitude});map.current?.setView([coords.latitude,coords.longitude],16);setMessage('GPS found. Move the pin if your shop is elsewhere.');},()=>setMessage('Location unavailable. Search the village or tap on the map.'),{enableHighAccuracy:true,timeout:12000});}
 async function search(e:React.FormEvent){e.preventDefault();if(!address.trim())return;setMessage('Searching for your village…');try{const res=await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=4&countrycodes=in&q=${encodeURIComponent(address)}`);const a=await res.json();if(!a.length){setMessage('Location not found. Try a nearby village or district.');return;}const p={lat:Number(a[0].lat),lng:Number(a[0].lon)};changed.current(p);map.current?.setView([p.lat,p.lng],16);setMessage('Search location found. Drag the pin to your exact shop entrance.');}catch{setMessage('Search unavailable. You can still tap the map to place a pin.');}}
 return <div className="map-picker"><div className="map-actions"><form onSubmit={search} className="map-search"><input aria-label="Search village or landmark" placeholder="Search village, landmark, district…" value={address} onChange={e=>setAddress(e.target.value)}/><button type="submit" className="btn btn-soft">Search</button></form><button type="button" onClick={locate} className="btn btn-outline"><LocateFixed size={16}/> Use GPS</button></div><div ref={div} className="leaflet-map"/><p className="map-help"><MapPin size={15}/> {message}</p><p className="coords">Latitude: {value.lat.toFixed(6)} • Longitude: {value.lng.toFixed(6)}</p></div>}
