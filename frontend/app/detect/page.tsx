'use client';

import {useEffect, useRef, useState} from 'react';
import Link from 'next/link';
import {api} from '@/lib/api';
import {saveScan} from '@/lib/history';
import {useLang} from '@/lib/i18n';
import {localizedDisease,resultSpeech,speakText,stopSpeech,voiceStrings,type VoiceCommandEvent} from '@/lib/voice';
import {Camera, ScanLine, TriangleAlert, MapPin, Volume2, CheckCircle2, Leaf, RefreshCcw, BookOpen, BookmarkCheck, ExternalLink, VolumeX} from 'lucide-react';

type Advice = {review_status:string; label:string|null; disease_group?:DiseaseGroup|null; summary:string; checks:string[]; sources:{title:string;url:string}[]; disclaimer:string};
type DiseaseGroup = 'bacterial'|'fungal'|'oomycete'|'mite'|'viral'|'healthy';
type TomatoStatus = {status: string; model: string; classes: number; crop: string; message: string};
type Status = {status: string; model: string | null; classes: number; crops: string[]; message: string; tomato_specialist?: TomatoStatus};
type Result = {
  status: 'predicted' | 'low_confidence' | 'crop_mismatch' | 'model_unavailable' | 'inference_error' | 'image_quality_issue';
  prediction?: string | null;
  raw_label?: string;
  class_label?: string | null;
  disease_group?: DiseaseGroup | null;
  growth_stage?: 'not_assessed';
  disease_severity?: 'not_assessed';
  analysis_basis?: 'leaf_image_class_label_only';
  predicted_crop?: string;
  disease_name?: string | null;
  healthy?: boolean | null;
  confidence: number | null;
  heatmap: null;
  message: string;
  multimodal?: boolean;
  crop_stage_used?: boolean;
  model_version?: string | null;
  model_selection_note?: string;
};
const crops = [
  {id:'tomato',emoji:'🍅',name:'Tomato / ಟೊಮೇಟೊ'},
  {id:'potato',emoji:'🥔',name:'Potato / ಆಲೂಗಡ್ಡೆ'},
  {id:'bell_pepper',emoji:'🫑',name:'Capsicum / ದೊಣ್ಣೆ ಮೆಣಸಿನಕಾಯಿ'},
];
const groupNames:Record<'en'|'kn'|'hi'|'te',Record<DiseaseGroup,string>>={
  en:{bacterial:'Bacterial disease',fungal:'Fungal disease',oomycete:'Oomycete (fungus-like) disease',mite:'Mite pest',viral:'Viral disease',healthy:'Healthy class'},
  kn:{bacterial:'ಬ್ಯಾಕ್ಟೀರಿಯಾ ರೋಗ',fungal:'ಶಿಲೀಂಧ್ರ ರೋಗ',oomycete:'ಊಮೈಸೀಟ್ (ಶಿಲೀಂಧ್ರದಂತಿರುವ) ರೋಗ',mite:'ಜೇಡ ಹುಳದ ಹಾವಳಿ',viral:'ವೈರಸ್ ರೋಗ',healthy:'ಆರೋಗ್ಯಕರ ವರ್ಗ'},
  hi:{bacterial:'जीवाणु रोग',fungal:'फफूँद जनित रोग',oomycete:'ऊमाइसीट (फफूँद जैसे) रोग',mite:'मकड़ी के कण का प्रकोप',viral:'वायरस रोग',healthy:'स्वस्थ वर्ग'},
  te:{bacterial:'బ్యాక్టీరియా వ్యాధి',fungal:'శిలీంధ్ర వ్యాధి',oomycete:'ఊమైసీట్ (శిలీంధ్రం వంటి) వ్యాధి',mite:'సాలీడు పురుగుల దాడి',viral:'వైరస్ వ్యాధి',healthy:'ఆరోగ్యకరమైన వర్గం'},
};
const labelOnlyTexts={
  en:{heading:'Image-based class-label analysis',classLabel:'Model class label',group:'Issue category derived from the class label',notStage:'Growth stage and disease severity are not assessed. The model does not identify them from a leaf image.',next:'Fertilizer and treatment selection are not part of this scan; they require verified symptoms, crop conditions and local agricultural guidance.'},
  kn:{heading:'ಚಿತ್ರದ ವರ್ಗದ ಆಧಾರದ ಮೇಲೆ ಪರಿಶೀಲನೆ',classLabel:'AI ವರ್ಗದ ಹೆಸರು',group:'ವರ್ಗದ ಹೆಸರಿನ ಆಧಾರದ ಮೇಲೆ ಸಮಸ್ಯೆಯ ವಿಧ',notStage:'ಬೆಳವಣಿಗೆಯ ಹಂತ ಮತ್ತು ರೋಗದ ತೀವ್ರತೆಯನ್ನು ಈ ಮಾದರಿ ನಿರ್ಧರಿಸುವುದಿಲ್ಲ.',next:'ಗೊಬ್ಬರ ಮತ್ತು ಚಿಕಿತ್ಸೆಯ ಆಯ್ಕೆ ಈ ಪರಿಶೀಲನೆಯ ಭಾಗವಲ್ಲ. ಸ್ಥಳೀಯ ಕೃಷಿ ತಜ್ಞರ ಸಲಹೆ ಅಗತ್ಯ.'},
  hi:{heading:'छवि की श्रेणी के आधार पर जाँच',classLabel:'मॉडल की श्रेणी',group:'श्रेणी के आधार पर समस्या का प्रकार',notStage:'फसल की अवस्था और रोग की गंभीरता इस मॉडल से निर्धारित नहीं होती।',next:'खाद और उपचार का चुनाव इस जाँच का भाग नहीं है। स्थानीय कृषि विशेषज्ञ की सलाह लें।'},
  te:{heading:'చిత్రం వర్గం ఆధారంగా విశ్లేషణ',classLabel:'మోడల్ వర్గం',group:'వర్గం ఆధారంగా సమస్య రకం',notStage:'పంట పెరుగుదల దశ మరియు వ్యాధి తీవ్రతను ఈ మోడల్ అంచనా వేయదు.',next:'ఎరువులు మరియు చికిత్స ఎంపిక ఈ పరిశీలనలో భాగం కాదు. స్థానిక వ్యవసాయ నిపుణుల సలహా అవసరం.'},
};
const texts = {
  en:{heading:'Check your leaf with real AI',intro:'Choose a supported crop, upload one clear leaf image, and see the trained model’s output.',select:'Select crop',upload:'Upload or take leaf photo',uploadHint:'JPEG, PNG, WEBP • up to 5 MB',button:'Analyse leaf',checking:'Analysing leaf…',result:'AI crop result',ready:'Trained model connected',missing:'Model unavailable',empty:'Upload a leaf photo to see the model result.',pred:'Possible condition',healthy:'The model suggests this leaf is healthy.',score:'Model score',notice:'AI results are suggestions, not a confirmed diagnosis. The score is not guaranteed accuracy.',mismatch:'Selected crop may not match the image',uncertain:'Low-confidence result — consider retaking the photo',voice:'Listen to result',shops:'Find village shops',warning:'Do not apply pesticides or other chemicals based only on AI output. Consult an agricultural expert and follow approved labels.',noHeat:'Explainable heatmap is not implemented for this model.'},
  kn:{heading:'ನಿಜವಾದ AI ಮೂಲಕ ಎಲೆಯನ್ನು ಪರಿಶೀಲಿಸಿ',intro:'ಬೆಳೆಯನ್ನು ಆಯ್ಕೆ ಮಾಡಿ, ಸ್ಪಷ್ಟವಾದ ಎಲೆಯ ಫೋಟೋ ಹಾಕಿ, ತರಬೇತಿ ಪಡೆದ ಮಾದರಿಯ ಫಲಿತಾಂಶ ನೋಡಿ.',select:'ಬೆಳೆ ಆಯ್ಕೆಮಾಡಿ',upload:'ಎಲೆಯ ಫೋಟೋ ತೆಗೆಯಿರಿ ಅಥವಾ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ',uploadHint:'JPEG, PNG, WEBP • ಗರಿಷ್ಠ 5 MB',button:'ಎಲೆಯನ್ನು ಪರಿಶೀಲಿಸಿ',checking:'ಎಲೆ ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ…',result:'AI ಬೆಳೆ ಫಲಿತಾಂಶ',ready:'AI ಮಾದರಿ ಸಂಪರ್ಕಗೊಂಡಿದೆ',missing:'AI ಮಾದರಿ ಲಭ್ಯವಿಲ್ಲ',empty:'ಫಲಿತಾಂಶ ನೋಡಲು ಎಲೆಯ ಫೋಟೋ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ.',pred:'ಸಂಭಾವ್ಯ ಸ್ಥಿತಿ',healthy:'AI ಪ್ರಕಾರ ಎಲೆ ಆರೋಗ್ಯವಾಗಿರಬಹುದು.',score:'ಮಾದರಿ ಅಂಕ',notice:'AI ಫಲಿತಾಂಶ ಖಚಿತ ರೋಗನಿರ್ಣಯವಲ್ಲ. ಅಂಕವು ಖಚಿತ ನಿಖರತೆಯಲ್ಲ.',mismatch:'ಆಯ್ಕೆ ಮಾಡಿದ ಬೆಳೆ ಮತ್ತು ಫೋಟೋ ಹೊಂದಿಕೆಯಾಗದೇ ಇರಬಹುದು',uncertain:'ಫಲಿತಾಂಶದ ವಿಶ್ವಾಸ ಕಡಿಮೆ — ಮತ್ತೊಂದು ಫೋಟೋ ತೆಗೆಯಿರಿ',voice:'ಫಲಿತಾಂಶ ಕೇಳಿ',shops:'ಹಳ್ಳಿಯ ಅಂಗಡಿಗಳನ್ನು ಹುಡುಕಿ',warning:'AI ಫಲಿತಾಂಶವನ್ನು ಮಾತ್ರ ನಂಬಿ ಕೀಟನಾಶಕ ಬಳಸಬೇಡಿ. ಕೃಷಿ ತಜ್ಞರನ್ನು ಸಂಪರ್ಕಿಸಿ.',noHeat:'ಈ ಮಾದರಿಗೆ ಹೀಟ್‌ಮ್ಯಾಪ್ ಇನ್ನೂ ಲಭ್ಯವಿಲ್ಲ.'},
  hi:{heading:'असली AI से पत्ती की जाँच',intro:'फसल चुनें, पत्ती की साफ तस्वीर अपलोड करें और प्रशिक्षित मॉडल का परिणाम देखें।',select:'फसल चुनें',upload:'पत्ती की फोटो लें या अपलोड करें',uploadHint:'JPEG, PNG, WEBP • अधिकतम 5 MB',button:'पत्ती जाँचें',checking:'पत्ती जाँची जा रही है…',result:'AI फसल परिणाम',ready:'AI मॉडल जुड़ा है',missing:'AI मॉडल उपलब्ध नहीं',empty:'परिणाम देखने के लिए पत्ती की फोटो अपलोड करें।',pred:'संभावित स्थिति',healthy:'मॉडल के अनुसार पत्ती स्वस्थ हो सकती है।',score:'मॉडल स्कोर',notice:'AI का परिणाम पुष्टि किया हुआ निदान नहीं है। स्कोर सटीकता की गारंटी नहीं है।',mismatch:'चुनी हुई फसल फोटो से मेल नहीं खा सकती',uncertain:'विश्वास कम है — साफ फोटो दोबारा लें',voice:'परिणाम सुनें',shops:'गाँव की दुकानें देखें',warning:'केवल AI परिणाम के आधार पर कीटनाशक न डालें। कृषि विशेषज्ञ से सलाह लें।',noHeat:'इस मॉडल के लिए हीटमैप उपलब्ध नहीं है।'},
  te:{heading:'నిజమైన AI తో ఆకును పరిశీలించండి',intro:'పంటను ఎంచుకుని, ఆకు స్పష్టమైన ఫోటో అప్లోడ్ చేసి, మోడల్ ఫలితం చూడండి.',select:'పంటను ఎంచుకోండి',upload:'ఆకు ఫోటో తీయండి లేదా అప్లోడ్ చేయండి',uploadHint:'JPEG, PNG, WEBP • గరిష్ఠం 5 MB',button:'ఆకును పరిశీలించండి',checking:'ఆకు పరిశీలన జరుగుతోంది…',result:'AI పంట ఫలితం',ready:'AI మోడల్ అనుసంధానమైంది',missing:'AI మోడల్ అందుబాటులో లేదు',empty:'ఫలితాన్ని చూడటానికి ఆకు ఫోటో అప్లోడ్ చేయండి.',pred:'సంభావ్య పరిస్థితి',healthy:'మోడల్ ప్రకారం ఆకు ఆరోగ్యంగా ఉండవచ్చు.',score:'మోడల్ స్కోరు',notice:'AI ఫలితం ధృవీకరించిన వ్యాధి నిర్ధారణ కాదు. స్కోరు ఖచ్చితత్వానికి హామీ కాదు.',mismatch:'ఎంచుకున్న పంట ఫోటోతో సరిపోలకపోవచ్చు',uncertain:'విశ్వాసం తక్కువ — మరో స్పష్టమైన ఫోటో తీసుకోండి',voice:'ఫలితం వినండి',shops:'గ్రామ దుకాణాలు వెతకండి',warning:'కేవలం AI ఫలితంతో పురుగుమందు వాడవద్దు. వ్యవసాయ నిపుణులను సంప్రదించండి.',noHeat:'ఈ మోడల్‌కు హీట్‌మ్యాప్ ఇంకా లేదు.'},
};

export default function Detect(){
  const {lang} = useLang();
  const t = texts[lang];
  const [crop,setCrop] = useState('tomato');
  const [modelChoice,setModelChoice] = useState<'auto' | 'general' | 'tomato_specialist'>('auto');
  const [file,setFile] = useState<File | null>(null);
  const [preview,setPreview] = useState('');
  const [status,setStatus] = useState<Status | null>(null);
  const [loading,setLoading] = useState(false);
  const [result,setResult] = useState<Result | null>(null);
  const [error,setError] = useState('');
  const [advice,setAdvice] = useState<Advice | null>(null);
  const [saved,setSaved] = useState(false);
  const [autoRead,setAutoRead] = useState(true);
  const [voiceNotice,setVoiceNotice] = useState('');
  const photoInput=useRef<HTMLInputElement|null>(null);
  useEffect(()=>{try{const stored=localStorage.getItem('kh-auto-speak');if(stored!==null)setAutoRead(stored==='true');}catch{/* storage disabled */}},[]);
  function changeAutoRead(value:boolean){setAutoRead(value);try{localStorage.setItem('kh-auto-speak',String(value))}catch{/* private browsing */}}

  useEffect(()=>{api<Status>('/api/model/status').then(setStatus).catch(()=>setStatus(null));},[]);
  useEffect(()=>{
    const params=new URLSearchParams(window.location.search);
    const incomingCrop=params.get('crop');
    if(incomingCrop==='tomato'||incomingCrop==='potato'||incomingCrop==='bell_pepper')setCrop(incomingCrop);
    const incomingModel=params.get('model');
    if(incomingModel==='auto'||incomingModel==='general'||incomingModel==='tomato_specialist'){
      setModelChoice(incomingModel);
      if(incomingModel==='tomato_specialist')setCrop('tomato');
    }
  },[]);
  useEffect(()=>()=>{if(preview) URL.revokeObjectURL(preview);},[preview]);
  useEffect(()=>{
    let active=true;
    setAdvice(null);setSaved(false);
    if(!result)return;
    // Low confidence or crop mismatch MUST NOT receive named disease guidance.
    const label=result.status==='predicted' && result.prediction ? result.prediction : '';
    api<Advice>(`/api/advisory?label=${encodeURIComponent(label)}`)
       .then(x=>{if(active)setAdvice(x)})
       .catch(()=>{if(active)setAdvice(null)});
    return ()=>{active=false};
  },[result]);
  // Share the latest real model result with the conversational voice assistant.
  useEffect(()=>{
    window.dispatchEvent(new CustomEvent('kh:analysis-result',{detail:result}));
    return ()=>{window.dispatchEvent(new CustomEvent('kh:analysis-result',{detail:null}));};
  },[result]);
  function updateFile(f?: File){
    if(!f)return;
    if(!['image/png','image/jpeg','image/webp'].includes(f.type) || f.size > 5*1024*1024){
      setError('Please upload a JPEG, PNG or WEBP image smaller than 5 MB.');return;
    }
    stopSpeech();setFile(f);setPreview(URL.createObjectURL(f));setResult(null);setAdvice(null);setSaved(false);setError('');setVoiceNotice('');
  }
  async function scan(){
    if(!file){setError(voiceStrings[lang].needsPhoto);return;}
    if(loading)return;
    setLoading(true);setError('');setResult(null);
    const data=new FormData();data.append('file',file);
    try{setResult(await api<Result>(`/api/detect?crop=${encodeURIComponent(crop)}&model=${encodeURIComponent(modelChoice)}`,{method:'POST',body:data}));}
    catch(e){setError((e as Error).message);}
    finally{setLoading(false);}
  }
  function speak(){
    if(!result){setVoiceNotice(voiceStrings[lang].needsResult);return;}
    if(!speakText(resultSpeech(result,lang),lang))setVoiceNotice(voiceStrings[lang].readNotSupported);
    else setVoiceNotice('');
  }
  // Read result automatically in the currently selected language. Manual replay
  // remains available if the device blocks automatic audio playback.
  useEffect(()=>{
    if(result&&autoRead){
      if(!speakText(resultSpeech(result,lang),lang))setVoiceNotice(voiceStrings[lang].readNotSupported);
    }
  // Only the arrival of a new result should trigger automatic playback.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[result]);
  // A global microphone control emits commands for the current screen.
  useEffect(()=>{
    function onVoice(event:Event){
      const intent=(event as VoiceCommandEvent).detail.intent;
      switch(intent.kind){
        case 'crop':setCrop(intent.crop);setModelChoice('auto');setResult(null);stopSpeech();break;
        case 'model':
          if(intent.model==='tomato_specialist'&&status?.tomato_specialist?.status!=='ready'){
            setVoiceNotice(voiceStrings[lang].modelUnavailable);break;
          }
          if(intent.model==='tomato_specialist'){setCrop('tomato');}
          setModelChoice(intent.model);setResult(null);stopSpeech();break;
        case 'upload':
          // Browsers may reject file picker calls outside a direct user gesture.
          // Never attempt to bypass the browser's security requirement.
          photoInput.current?.focus();
          setVoiceNotice(voiceStrings[lang].needsPhoto);
          break;
        case 'analyze':void scan();break;
        case 'read-result':speak();break;
        case 'auto-read-on':changeAutoRead(true);setVoiceNotice('✓');break;
        case 'auto-read-off':changeAutoRead(false);stopSpeech();setVoiceNotice('✓');break;
      }
    }
    window.addEventListener('kh:voice-command',onVoice);
    return ()=>window.removeEventListener('kh:voice-command',onVoice);
  });
  const hasSuggestion=Boolean(result?.prediction&&(result.status==='predicted'||result.status==='low_confidence'));
  const healthy=result?.healthy===true;
  function storeResult(){
    if(!result?.prediction||saved)return;
    saveScan({id:globalThis.crypto?.randomUUID?.() || String(Date.now()), date:new Date().toISOString(),
      crop,prediction:result.disease_name||result.prediction, confidence:result.confidence,
      status:result.status,model:result.model_version||'Trained image classifier'});
    setSaved(true);
  }
  return <>
    <section className="inner-hero"><div className="container">
      <div className="eyebrow"><ScanLine size={16}/> AI CROP CHECK / ಬೆಳೆ ಪರಿಶೀಲನೆ</div>
      <h1>{t.heading}</h1><p>{t.intro}</p>
      <div style={{display:'flex',alignItems:'center',gap:8,marginTop:15,flexWrap:'wrap'}}>
        {status?.status==='ready'?<span className="status approved"><CheckCircle2 size={15}/> {t.ready} • {status.classes} classes</span>:<span className="status"><TriangleAlert size={15}/> {t.missing}</span>}
      </div>
    </div></section>
    <section className="page-section"><div className="container"><div className="content-grid">
      <div className="panel">
        <h2 className="form-title">1. {t.select}</h2>
        <div className="crop-grid">{crops.map(c=><button type="button" key={c.id} className={`crop-btn ${crop===c.id?'chosen':''}`} onClick={()=>{setCrop(c.id);setModelChoice('auto');setResult(null)}}>
          <span className="crop-emoji">{c.emoji}</span><strong>{c.name}</strong>
        </button>)}</div>
        {crop==='tomato'&&<div style={{marginTop:18}}>
          <label className="field"><span>AI model / AI ಮಾದರಿ</span>
            <select value={modelChoice} onChange={e=>{setModelChoice(e.target.value as typeof modelChoice);setResult(null)}}>
              <option value="auto">Recommended — MobileNetV2 (checks crop mismatch)</option>
              <option value="general">MobileNetV2 — 15-class model</option>
              <option value="tomato_specialist" disabled={status?.tomato_specialist?.status!=='ready'}>
                EfficientNetB0 — 10-class tomato specialist (experimental) {status?.tomato_specialist?.status==='ready'?'':'(unavailable)'}
              </option>
            </select>
          </label>
          {status?.tomato_specialist?.status==='ready'&&<p className="helper" style={{marginTop:7}}>
            EfficientNetB0 is trained for tomato leaves only. Its training labels are confirmed, but its predictions are not validated on independent farm images. If you choose it, make sure the uploaded leaf is tomato.
          </p>}
          {status?.tomato_specialist?.status!=='ready'&&<p className="helper" style={{marginTop:7}}>
            The tomato specialist is temporarily unavailable. Use MobileNetV2 for now.
          </p>}
        </div>}
        <p className="helper" style={{marginTop:20}}>{labelOnlyTexts[lang].heading}. {labelOnlyTexts[lang].notStage}</p>
        <h2 className="form-title" style={{marginTop:27}}>2. {t.upload}</h2>
        <label className="file-drop"><Camera size={34}/><strong>{t.upload}</strong><small>{t.uploadHint}</small>
          <input ref={photoInput} aria-label={t.upload} type="file" accept="image/png,image/jpeg,image/webp" capture="environment" onChange={e=>updateFile(e.target.files?.[0])}/>
        </label>
        {preview&&<img className="preview-image" src={preview} alt="Uploaded crop leaf"/>}
        {error&&<p className="message error" role="alert">{error}</p>}
        <div className="form-actions"><button type="button" disabled={!file||loading} onClick={scan} className="btn btn-green btn-large">
          {loading?t.checking:t.button} <ScanLine size={18}/>
        </button></div>
      </div>
      <div className="panel">
        <div className="overline">AI RESULT / ಫಲಿತಾಂಶ</div><h2>{t.result}</h2>
        {!result?<div className="empty-state"><Leaf size={42}/><h3>{t.empty}</h3><p>{status?.message||'The model connection can be checked once the backend is online.'}</p></div>:<>
          {hasSuggestion?<div style={{padding:'18px 0'}}>
            <div className="overline">{t.pred}</div>
            <p className="helper">{t.select}: {crops.find(c=>c.id===crop)?.name}</p>
            <h2 style={{fontSize:'1.9rem',margin:'9px 0'}}>{healthy?'🌿':'🔍'} {localizedDisease(result.disease_name||result.prediction,lang)}</h2>
            {healthy&&<p className="message good">{t.healthy}</p>}
            <div className="panel" style={{marginTop:12,padding:14,background:'#f5f8f2'}}>
              <div><strong>{labelOnlyTexts[lang].classLabel}:</strong> <code>{result.class_label||result.prediction}</code></div>
              {result.disease_group&&<div style={{marginTop:8}}><strong>{labelOnlyTexts[lang].group}:</strong> {groupNames[lang][result.disease_group]}</div>}
              <p className="helper" style={{marginTop:8}}>{labelOnlyTexts[lang].notStage}</p>
            </div>
            {result.confidence!==null&&<div className="panel" style={{marginTop:12,padding:14,background:'#edf4e9'}}>
              <strong>{t.score}: {(result.confidence*100).toFixed(1)}%</strong>
              <div style={{height:8,borderRadius:30,background:'#cfdfcd',overflow:'hidden',marginTop:9}}><div style={{width:`${Math.max(0,Math.min(100,result.confidence*100))}%`,height:'100%',background:'#408556',borderRadius:30}}/></div>
              <small className="helper">{t.notice}</small>
            </div>}
            {result.status==='low_confidence'&&<p className="message error" style={{marginTop:15}}><TriangleAlert size={18}/> {t.uncertain}</p>}
          </div>:<div className="message error"><TriangleAlert size={18}/> {result.status==='crop_mismatch'?t.mismatch:result.status==='image_quality_issue'?'Photo quality issue — please retake the picture':t.missing}</div>}
          {result.model_version&&<p className="helper" style={{marginTop:10}}><strong>Model used:</strong> {result.model_version}</p>}
          {result.model_selection_note&&<p className="helper" style={{marginTop:8}}>{result.model_selection_note}</p>}
          <p className="helper" style={{marginTop:14,lineHeight:1.75}}>{result.message}</p>
          <p className="helper" style={{marginTop:8}}>{labelOnlyTexts[lang].next}</p>
          <div className="form-actions">
            <button className="btn btn-soft" type="button" onClick={speak}><Volume2 size={17}/> {t.voice}</button>
            <button className="btn btn-outline" type="button" onClick={stopSpeech}><VolumeX size={17}/> {lang==='kn'?'ಧ್ವನಿ ನಿಲ್ಲಿಸಿ':lang==='hi'?'आवाज़ रोकें':lang==='te'?'వాయిస్ ఆపండి':'Stop audio'}</button>
            {hasSuggestion&&<button className="btn btn-outline" type="button" disabled={saved} onClick={storeResult}>
              <BookmarkCheck size={17}/> {saved?'Saved to this device':'Save scan on this device'}
            </button>}
          </div>
          <p className="helper">Saved scans are optional and stored only in this browser, without leaf photos or GPS information. Clear them in Farmer Corner.</p>
          <p className="helper" style={{marginTop:16}}><RefreshCcw size={15}/> {t.noHeat}</p>
          {advice&&<div className="guidance-card">
            <div className="overline"><BookOpen size={15} style={{verticalAlign:'middle'}}/> REFERENCE-LINKED CROP INFORMATION</div>
            <h3>What to check next</h3>
            <p>{advice.summary}</p>
            <ul>{advice.checks.map((c,i)=><li key={i}>{c}</li>)}</ul>
            {advice.sources.length>0&&<div className="guidance-sources">{advice.sources.map(x=><a key={x.url} href={x.url} target="_blank" rel="noopener noreferrer">Extension reference <ExternalLink size={13}/></a>)}</div>}
            <p className="helper">{advice.disclaimer} This information has not yet been reviewed by a local Indian agricultural specialist.</p>
          </div>}
        </>}
        <div className="kh-read-settings">
          <label><input type="checkbox" checked={autoRead} onChange={e=>changeAutoRead(e.target.checked)}/> {lang==='kn'?'ಪರಿಶೀಲನೆ ಮುಗಿದ ಮೇಲೆ ಫಲಿತಾಂಶವನ್ನು ಧ್ವನಿಯಲ್ಲಿ ಓದಿ':lang==='hi'?'जाँच के बाद परिणाम अपने आप बोलें':lang==='te'?'పరిశీలన తర్వాత ఫలితాన్ని ఆటోమేటిక్‌గా చెప్పండి':'Automatically read results after analysis'}</label>
          <p className="helper">{lang==='kn'?'ಆಯ್ಕೆ ಮಾಡಿದ ಭಾಷೆಯ ಧ್ವನಿ ಸಾಧನದಲ್ಲಿ ಲಭ್ಯವಿದ್ದರೆ ಮಾತ್ರ ಓದಬಹುದು. ಧ್ವನಿ ಸಹಾಯಕದಲ್ಲಿ ಮೈಕ್ರೊಫೋನ್ ಒತ್ತಿ ಆದೇಶ ಹೇಳಬಹುದು.':lang==='hi'?'आवाज़ आपके फ़ोन या ब्राउज़र में उपलब्ध भाषा पर निर्भर करती है। माइक्रोफ़ोन दबाकर आदेश बोलें।':lang==='te'?'ఎంపిక చేసిన భాష వాయిస్ మీ పరికరంలో అందుబాటులో ఉండాలి. మైక్రోఫోన్ నొక్కి ఆదేశం చెప్పండి.':'Speech depends on installed device/browser voices. Tap the assistant microphone for voice commands.'}</p>
          {voiceNotice&&<p className="message" role="status">{voiceNotice}</p>}
        </div>
        <div className="notice-ribbon" style={{margin:'20px 0'}}>{t.warning}</div>
        <Link href="/shops" className="btn btn-outline"><MapPin size={17}/> {t.shops}</Link>
      </div>
    </div></div></section>
  </>;
}
