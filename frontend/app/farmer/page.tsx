'use client';
import {useEffect, useState} from 'react';
import Link from 'next/link';
import {readScans, deleteScan, SavedScan} from '@/lib/history';
import {useLang} from '@/lib/i18n';
import {ScanLine, MapPin, Cloud, Droplets, Wind, CloudRain, ArrowUpRight, Trash2, History} from 'lucide-react';

type WeatherData = {
  status: string;
  current: {
    temperature_c: number;
    humidity_percent: number;
    precipitation_mm: number;
    wind_speed_kmh: number;
    condition: { en: string; kn: string };
  };
  forecast_3d: Array<{
    date: string;
    temp_max_c: number;
    temp_min_c: number;
    rain_probability_percent: number;
    condition: { en: string; kn: string };
  }>;
};

export default function Farmer(){
  const {t, lang}=useLang();
  const [history,setHistory]=useState<SavedScan[]>([]);
  const [weather,setWeather]=useState<WeatherData | null>(null);
  const [weatherError,setWeatherError]=useState<string>('');
  const [loadingWeather,setLoadingWeather]=useState<boolean>(true);
  const [usingGps,setUsingGps]=useState<boolean>(false);

  useEffect(()=>{setHistory(readScans());},[]);

  useEffect(()=>{
    let cancelled = false;

    async function loadWeather(lat?: number, lng?: number) {
      try {
        const query = lat !== undefined && lng !== undefined ? `?lat=${lat}&lng=${lng}` : '';
        const res = await fetch(`/api/weather${query}`);
        if (!res.ok) throw new Error('Failed to fetch weather');
        const data: WeatherData = await res.json();
        if (!cancelled) {
          setWeather(data);
          setWeatherError('');
        }
      } catch {
        if (!cancelled) setWeatherError('Live weather is temporarily unavailable.');
      } finally {
        if (!cancelled) setLoadingWeather(false);
      }
    }

    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUsingGps(true);
          loadWeather(pos.coords.latitude, pos.coords.longitude);
        },
        () => {
          loadWeather();
        },
        {timeout: 5000}
      );
    } else {
      loadWeather();
    }

    return () => { cancelled = true; };
  },[]);

  function remove(id:string){deleteScan(id);setHistory(readScans());}

  return <>
    <section className="inner-hero"><div className="container">
      <div className="eyebrow">🌾 ರೈತ ಮಿತ್ರ / FARMER CORNER</div>
      <h1>{t('farmer')}</h1>
      <p>Simple crop-care tools and genuine nearby agricultural shops, right from your phone.</p>
    </div></section>

    <section className="page-section"><div className="container">
      <div className="content-grid">
        <Link href="/detect" className="panel" style={{background:'#e0ead6'}}>
          <ScanLine size={35} color="#276345"/>
          <h2 style={{marginTop:20}}>{t('scan')}</h2>
          <p className="helper">Take a clear leaf photo of tomato, potato or bell pepper. See a suggestion from the trained MobileNetV2 model, with confidence warnings and safe guidance.</p>
          <span className="inline-link">Open scanner <ArrowUpRight size={18}/></span>
        </Link>
        <Link href="/shops" className="panel">
          <MapPin size={35} color="#a56c46"/>
          <h2 style={{marginTop:20}}>{t('find')}</h2>
          <p className="helper">Browse approved local shops, call them, and open driving directions.</p>
          <span className="inline-link">Browse shops <ArrowUpRight size={18}/></span>
        </Link>
      </div>

      <div className="panel" style={{marginTop:22}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:10}}>
          <h2 style={{margin:0}}><Cloud size={23} color="#35684a" style={{verticalAlign:'middle', marginRight:8}}/>Live local weather</h2>
          <span className="helper" style={{margin:0}}>
            {usingGps ? '📍 Using your current location' : '📍 Default: Bengaluru (allow location for farm weather)'}
          </span>
        </div>

        {loadingWeather && <p className="helper" style={{marginTop:12}}>Loading live weather forecast...</p>}
        {!loadingWeather && weatherError && <p className="helper" style={{marginTop:12}}>{weatherError}</p>}

        {!loadingWeather && weather && (
          <div style={{marginTop:16}}>
            <div className="content-grid">
              <div>
                <div style={{fontSize:'2rem', fontWeight:700, color:'#276345'}}>
                  {weather.current.temperature_c}°C
                </div>
                <p style={{fontWeight:600, margin:'4px 0'}}>
                  {lang === 'kn' ? weather.current.condition.kn : weather.current.condition.en}
                </p>
                <p className="helper" style={{margin:0}}>
                  <Droplets size={15} style={{verticalAlign:'middle'}}/> Humidity: {weather.current.humidity_percent}% &nbsp;•&nbsp;
                  <Wind size={15} style={{verticalAlign:'middle'}}/> Wind: {weather.current.wind_speed_kmh} km/h
                </p>
              </div>

              <div className="small-list">
                {weather.forecast_3d.map((day) => (
                  <div className="list-row" key={day.date} style={{padding:'8px 12px'}}>
                    <div>
                      <strong>{new Date(day.date).toLocaleDateString(undefined, {weekday:'short', month:'short', day:'numeric'})}</strong>
                      <p className="helper" style={{margin:0}}>
                        {lang === 'kn' ? day.condition.kn : day.condition.en}
                      </p>
                    </div>
                    <div style={{textAlign:'right'}}>
                      <strong>{day.temp_min_c}° / {day.temp_max_c}°C</strong>
                      <p className="helper" style={{margin:0}}>
                        <CloudRain size={14} style={{verticalAlign:'middle'}}/> {day.rain_probability_percent}% rain
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="panel" style={{marginTop:22}}>
        <h2><History size={23} style={{verticalAlign:'middle'}}/> Your saved scans</h2>
        <p className="helper">Only scans you explicitly saved appear here. Uploaded photos and GPS coordinates are not saved. This history stays on this device.</p>
        {!history.length ? <p className="helper">No saved scans yet. Use “Save scan on this device” after a crop scan.</p> :
          <div className="small-list">{history.map(h=><div className="list-row" key={h.id}>
            <div><h3>{h.prediction}</h3>
              <p>{h.crop.replace('_',' ')} • {new Date(h.date).toLocaleString()} • {h.status.replace('_',' ')}</p>
              <p>{h.confidence===null?'No confidence shown':`Model score ${(h.confidence*100).toFixed(1)}% (not guaranteed accuracy)`}</p>
            </div>
            <button className="btn btn-small btn-outline" type="button" onClick={()=>remove(h.id)} aria-label="Delete saved scan"><Trash2 size={15}/> Delete</button>
          </div>)}</div>
        }
      </div>
    </div></section>
  </>;
}