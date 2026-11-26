'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {usePathname,useRouter} from 'next/navigation';
import {useLang,type Lang} from '@/lib/i18n';
import {Mic,MicOff,Volume2,HelpCircle,X,Globe2,ShieldCheck,Send,MessageCircle,Settings2} from 'lucide-react';
import {api} from '@/lib/api';
import {startCloudRecording,type CloudRecording} from '@/lib/cloudSpeech';
import {farmerQuestionAnswer,looksLikeFarmerQuestion,questionFallback,type ScanContext} from '@/lib/farmerAssistant';
import {dispatchVoiceIntent,installedSpeechVoices,parseVoiceCommand,SPEECH_LOCALES,speakText,stopSpeech,voiceStrings,resultSpeech} from '@/lib/voice';

type RecognitionResultEvent={results:ArrayLike<ArrayLike<{transcript:string;confidence?:number}>>;resultIndex:number};
type RecognitionErrorEvent={error:string};
type SpeechRecognizer={
 lang:string;continuous:boolean;interimResults:boolean;maxAlternatives:number;
 onresult:((event:RecognitionResultEvent)=>void)|null;
 onerror:((event:RecognitionErrorEvent)=>void)|null;
 onend:(()=>void)|null;
 start:()=>void;stop:()=>void;abort:()=>void;
};
type RecognitionConstructor=new()=>SpeechRecognizer;
function availableRecognizer():RecognitionConstructor|undefined{
 if(typeof window==='undefined')return undefined;
 const w=window as typeof window & {SpeechRecognition?:RecognitionConstructor;webkitSpeechRecognition?:RecognitionConstructor};
 return w.SpeechRecognition||w.webkitSpeechRecognition;
}
const greetings:Record<Lang,string>={en:'Hello! What would you like to know?',kn:'ನಮಸ್ಕಾರ! ನಿಮ್ಮ ಬೆಳೆದ ಬಗ್ಗೆ ಏನು ತಿಳಿಯಬೇಕು ಹೇಳಿ.',hi:'नमस्ते! आप क्या जानना चाहते हैं?',te:'నమస్కారం అండీ! మీ పంట గురించి ఏం తెలుసుకోవాలి?'};
const verbalAck:Record<Lang,string>={en:'Okay.',kn:'ಸರಿ.',hi:'ठीक है।',te:'సరేనండీ.'};
const waitSpeech:Record<Lang,string>={en:'Understanding your question…',kn:'ನಿಮ್ಮ ಪ್ರಶ್ನೆಗೆ ಉತ್ತರ ಹುಡುಕುತ್ತಿದ್ದೇನೆ…',hi:'आपके सवाल का जवाब ढूँढ रहा हूँ…',te:'మీ ప్రశ్నకు జవాబు చూస్తున్నాను…'};
const labels:Record<Lang,{ask:string;send:string;provider:string;browser:string;neural:string;voice:string;rate:string;test:string;noVoice:string;noCloud:string;question:string;note:string;history:string;micTip:string}>={
 en:{ask:'Ask about your crop in your own words…',send:'Ask',provider:'Listening and speaking',browser:'Free browser speech',neural:'Natural cloud voice (requires setup)',voice:'Installed voice',rate:'Speaking speed',test:'Test voice',noVoice:'No matching voice is installed for this language. Try cloud speech or install a language voice on this device.',noCloud:'Cloud speech needs an Azure Speech key in your private .env file.',question:'Ask a farmer question',note:'Answers are general guidance, not a confirmed diagnosis or a pesticide prescription.',history:'Conversation',micTip:'In cloud mode, tap to start speaking and tap again to finish. In browser mode, speak after the microphone starts.'},
 kn:{ask:'ನಿಮ್ಮ ಬೆಳೆ ಬಗ್ಗೆ ಇಲ್ಲಿ ಕೇಳಿ…',send:'ಕೇಳಿ',provider:'ಕೇಳುವುದು ಮತ್ತು ಮಾತನಾಡುವುದು',browser:'ಉಚಿತ ಬ್ರೌಸರ್ ಧ್ವನಿ',neural:'ಸಹಜ ಕ್ಲೌಡ್ ಧ್ವನಿ (ಸೆಟಪ್ ಬೇಕು)',voice:'ಫೋನ್‌ನಲ್ಲಿ ಇರುವ ಧ್ವನಿ',rate:'ಮಾತಿನ ವೇಗ',test:'ಧ್ವನಿ ಪರೀಕ್ಷೆ',noVoice:'ಈ ಭಾಷೆಗೆ ಸರಿಯಾದ ಧ್ವನಿ ಫೋನ್‌ನಲ್ಲಿ ಇಲ್ಲ. ಸ್ಥಳೀಯ ಧ್ವನಿ ಸ್ಥಾಪಿಸಿ ಅಥವಾ ಕ್ಲೌಡ್ ಧ್ವನಿ ಬಳಸಿ.',noCloud:'ಕ್ಲೌಡ್ ಧ್ವನಿಗೆ ನಿಮ್ಮ ಖಾಸಗಿ .env ನಲ್ಲಿ Azure Speech ಕೀ ಬೇಕು.',question:'ರೈತರ ಪ್ರಶ್ನೆ ಕೇಳಿ',note:'ಇದು ಸಾಮಾನ್ಯ ಸಲಹೆ ಮಾತ್ರ. ಖಚಿತ ರೋಗನಿರ್ಣಯ ಅಥವಾ ಔಷಧಿ ಪಟ್ಟಿ ಅಲ್ಲ.',history:'ಮಾತುಕತೆ',micTip:'ಕ್ಲೌಡ್ ಧ್ವನಿಯಲ್ಲಿ ಮಾತನಾಡಲು ಒಮ್ಮೆ ಒತ್ತಿ, ಮುಗಿದ ಮೇಲೆ ಮತ್ತೆ ಒತ್ತಿ. ಬ್ರೌಸರ್ ಧ್ವನಿಯಲ್ಲಿ ಮೈಕ್ರೊಫೋನ್ ಶುರುವಾದ ಮೇಲೆ ಮಾತನಾಡಿ.'},
 hi:{ask:'अपनी फसल के बारे में पूछिए…',send:'पूछें',provider:'सुनना और बोलना',browser:'मुफ़्त ब्राउज़र आवाज़',neural:'स्वाभाविक क्लाउड आवाज़ (सेटअप चाहिए)',voice:'उपलब्ध आवाज़',rate:'बोलने की रफ़्तार',test:'आवाज़ सुनें',noVoice:'इस भाषा की आवाज़ आपके उपकरण में नहीं है। भाषा आवाज़ इंस्टॉल करें या क्लाउड इस्तेमाल करें।',noCloud:'क्लाउड आवाज़ के लिए निजी .env में Azure Speech कुंजी चाहिए।',question:'किसान का सवाल पूछें',note:'ये सामान्य सलाह है, पक्की बीमारी की पहचान या दवा का नुस्खा नहीं।',history:'बातचीत',micTip:'क्लाउड मोड में रिकॉर्डिंग शुरू करने और समाप्त करने के लिए बटन दबाएँ।'},
 te:{ask:'మీ పంట గురించి మీ మాటల్లో అడగండి…',send:'అడగండి',provider:'వినడం, మాట్లాడడం',browser:'ఉచిత బ్రౌజర్ వాయిస్',neural:'సహజమైన క్లౌడ్ వాయిస్ (సెటప్ అవసరం)',voice:'ఫోన్లో ఉన్న వాయిస్',rate:'మాట్లాడే వేగం',test:'వాయిస్ వినండి',noVoice:'ఈ భాషకు సరిపోయే వాయిస్ మీ ఫోన్లో లేదు. తెలుగు వాయిస్ ఇన్‌స్టాల్ చేయండి లేదా క్లౌడ్ వాయిస్ వాడండి.',noCloud:'క్లౌడ్ వాయిస్‌కు మీ ప్రైవేట్ .env ఫైల్‌లో Azure Speech కీ కావాలి.',question:'రైతు ప్రశ్న అడగండి',note:'ఇది సాధారణ సమాచారం మాత్రమే. ఖచ్చితమైన రోగ నిర్ధారణ లేదా మందుల మోతాదు కాదు.',history:'మన మాటలు',micTip:'క్లౌడ్ మోడ్‌లో మైక్రోఫోన్ నొక్కి మాట్లాడండి. మాట్లాడడం అయిపోయాక మళ్లీ నొక్కండి.'}
};
type Turn={who:'farmer'|'assistant';text:string};
export default function VoiceAssistant(){
 const {lang,setLang}=useLang();const t=voiceStrings[lang];const l=labels[lang];
 const router=useRouter();const pathname=usePathname();
 const [expanded,setExpanded]=useState(false),[supported,setSupported]=useState<boolean|null>(null);
 const [listening,setListening]=useState(false),[continuous,setContinuous]=useState(false),[help,setHelp]=useState(false);
 const [heard,setHeard]=useState(''),[feedback,setFeedback]=useState(''),[draft,setDraft]=useState('');
 const [turns,setTurns]=useState<Turn[]>([]),[busy,setBusy]=useState(false),[settings,setSettings]=useState(false);
 const [provider,setProvider]=useState<'browser'|'neural'>('browser');
 const [cloudEnabled,setCloudEnabled]=useState(false),[chatEnabled,setChatEnabled]=useState(false);
 const [voices,setVoices]=useState<SpeechSynthesisVoice[]>([]),[chosenVoice,setChosenVoice]=useState(''),[rate,setRate]=useState(.88),[neuralGender,setNeuralGender]=useState<'female'|'male'>('female');
 const activeRef=useRef(false),spokenRef=useRef(false),continuousRef=useRef(false),recognizerRef=useRef<SpeechRecognizer|null>(null);
 const cloudRef=useRef<CloudRecording|null>(null),retryRef=useRef<ReturnType<typeof setTimeout>|null>(null);
 const langRef=useRef(lang),pathnameRef=useRef(pathname),scanRef=useRef<ScanContext|null>(null);
 const beginRecognitionRef=useRef<()=>void>(()=>{}),handleTranscriptRef=useRef<(s:string)=>void>(()=>{});
 langRef.current=lang;pathnameRef.current=pathname;continuousRef.current=continuous;
 const addTurn=(who:Turn['who'],text:string)=>setTurns(prev=>[...prev,{who,text}].slice(-8));
 const cancelRetry=()=>{if(retryRef.current){clearTimeout(retryRef.current);retryRef.current=null;}};
 const stopListening=useCallback(()=>{
   activeRef.current=false;cancelRetry();
   try{recognizerRef.current?.abort();}catch{/* done */}
   recognizerRef.current=null;setListening(false);
   if(cloudRef.current){void cloudRef.current.abort();cloudRef.current=null;}
 },[]);
 const reply=(text:string,replyLang:Lang=langRef.current)=>{
   addTurn('assistant',text);setFeedback(text);speakText(text,replyLang);
 };
 const answerUnknown=async(text:string,replyLang:Lang)=>{
   if(!chatEnabled){reply(questionFallback(replyLang),replyLang);return;}
   setBusy(true);setFeedback(waitSpeech[replyLang]);
   try{
      const r=await api<{answer:string}>('/api/assistant/ask',{method:'POST',body:JSON.stringify({question:text,lang:replyLang,scan_status:scanRef.current?.status||null,scan_label:scanRef.current?.status==='predicted'?(scanRef.current?.disease_name||scanRef.current?.prediction||null):null,history:turns.slice(-6)})});
      reply(r.answer,replyLang);
   }catch{reply(questionFallback(replyLang),replyLang);}finally{setBusy(false);}
 };
 const processTranscript=async(transcript:string)=>{
   const text=transcript.trim();if(!text)return;
   setHeard(text);addTurn('farmer',text);
   const replyLang=langRef.current;const strings=voiceStrings[replyLang];const current=pathnameRef.current;
   const intent=parseVoiceCommand(text,replyLang);
   if(intent.kind==='language'){
     setLang(intent.language);reply(greetings[intent.language],intent.language);
     if(continuousRef.current){try{recognizerRef.current?.stop();}catch{/* done */}}
     return;
   }
   if(intent.kind==='stop-listening'){stopListening();setFeedback(strings.stopped);return;}
   if(intent.kind==='stop-speech'){stopSpeech();setFeedback(strings.working);return;}
   if(intent.kind==='help'){setExpanded(true);setHelp(true);reply(greetings[replyLang]);return;}
   // Questions are interpreted before crop-name command shortcuts; e.g. 'tomato fertilizer?'
   const knownAnswer=farmerQuestionAnswer(text,replyLang,scanRef.current);
   if(knownAnswer){reply(knownAnswer,replyLang);return;}
   if(intent.kind==='unknown'||(looksLikeFarmerQuestion(text)&&['crop','navigate','model'].includes(intent.kind))){await answerUnknown(text,replyLang);return;}
   setFeedback(strings.working);
   switch(intent.kind){
     case 'navigate':router.push(intent.path);reply(verbalAck[replyLang]);break;
     case 'crop':
       if(current==='/detect')dispatchVoiceIntent(intent);
       else router.push(`/detect?crop=${encodeURIComponent(intent.crop)}`);
       reply(verbalAck[replyLang]);break;
     case 'model':
       if(current==='/detect')dispatchVoiceIntent(intent);
       else router.push(`/detect?model=${encodeURIComponent(intent.model)}`);
       reply(verbalAck[replyLang]);break;
     case 'search-shops':
       if(current==='/shops')dispatchVoiceIntent(intent);
       else router.push(`/shops?search=${encodeURIComponent(intent.query)}`);
       reply(verbalAck[replyLang]);break;
     case 'locate':case 'show-map':case 'hide-map':
       if(current==='/shops')dispatchVoiceIntent(intent);
       else router.push(`/shops?voice=${intent.kind}`);
       reply(verbalAck[replyLang]);break;
     case 'upload':
       if(current!=='/detect')router.push('/detect');
       else dispatchVoiceIntent(intent);
       reply(strings.needsPhoto,replyLang);break;
     case 'analyze':
       if(current==='/detect'){dispatchVoiceIntent(intent);setFeedback(strings.working);}
       else {router.push('/detect');reply(strings.needsPhoto,replyLang);}
       break;
     case 'read-result':
       if(scanRef.current)reply(resultSpeech(scanRef.current,replyLang),replyLang);
       else reply(strings.needsResult,replyLang);
       break;
     case 'auto-read-on':case 'auto-read-off':
       if(current!=='/detect')router.push('/detect');else dispatchVoiceIntent(intent);
       reply(verbalAck[replyLang]);break;
   }
 };
 handleTranscriptRef.current=(s:string)=>{void processTranscript(s);};
 const beginRecognition=useCallback(()=>{
   if(!activeRef.current||spokenRef.current)return;
   const Constructor=availableRecognizer();
   if(!Constructor){setSupported(false);activeRef.current=false;setListening(false);return;}
   const speech=new Constructor();recognizerRef.current=speech;
   speech.lang=SPEECH_LOCALES[langRef.current];speech.continuous=continuousRef.current;
   speech.interimResults=false;speech.maxAlternatives=5;
   speech.onresult=(event)=>{
     const choices=Array.from(event.results[event.resultIndex]||[]).map(a=>({text:a.transcript?.trim()||'',confidence:a.confidence||0})).filter(x=>x.text);
     // Favor an alternative containing a real command rather than a misheard phrase.
     const selected=choices.find(c=>parseVoiceCommand(c.text,langRef.current).kind!=='unknown'||farmerQuestionAnswer(c.text,langRef.current,scanRef.current))||choices[0];
     if(selected)handleTranscriptRef.current(selected.text);
   };
   speech.onerror=(event)=>{
     if(event.error==='aborted')return;
     const strings=voiceStrings[langRef.current];
     if(event.error==='not-allowed'||event.error==='service-not-allowed'){
       setFeedback(strings.micDenied);activeRef.current=false;
     }else if(event.error==='language-not-supported'){
       setFeedback(strings.notAvailable);activeRef.current=false;
     }else if(event.error!=='no-speech'){
       setFeedback(`${strings.notAvailable} (${event.error})`);
       if(event.error==='audio-capture')activeRef.current=false;
     }
   };
   speech.onend=()=>{
     if(recognizerRef.current===speech)recognizerRef.current=null;
     setListening(false);
     if(activeRef.current&&continuousRef.current&&!spokenRef.current){
       cancelRetry();retryRef.current=setTimeout(()=>beginRecognitionRef.current(),700);
     }else if(!continuousRef.current)activeRef.current=false;
   };
   try{speech.start();setListening(true);setFeedback('');}
   catch{setListening(false);setFeedback(voiceStrings[langRef.current].notAvailable);activeRef.current=false;}
 },[]);
 beginRecognitionRef.current=beginRecognition;
 const cloudStop=async()=>{
   const recording=cloudRef.current;if(!recording)return;
   cloudRef.current=null;setListening(false);setBusy(true);setFeedback(waitSpeech[langRef.current]);
   try{
     const wav=await recording.stop();
     const form=new FormData();form.append('audio',wav,'farmer.wav');
     const r=await api<{transcript:string}>(`/api/voice/transcribe?lang=${langRef.current}`,{method:'POST',body:form});
     if(r.transcript)await processTranscript(r.transcript);else reply(voiceStrings[langRef.current].notRecognized);
   }catch(e){setFeedback((e as Error).message||voiceStrings[langRef.current].notAvailable);}
   finally{setBusy(false);activeRef.current=false;}
 };
 const toggleMicrophone=async()=>{
   if(provider==='neural'&&cloudEnabled){
      if(cloudRef.current){await cloudStop();return;}
      if(busy)return;
      stopSpeech();stopListening();
      try{cloudRef.current=await startCloudRecording();setListening(true);activeRef.current=true;setExpanded(true);setFeedback('');}
      catch(e){setFeedback((e as Error).message);setListening(false);}
      return;
   }
   if(activeRef.current){stopListening();setFeedback(t.stopped);return;}
   if(!availableRecognizer()){setSupported(false);setFeedback(t.unsupported);return;}
   stopSpeech();spokenRef.current=false;
   activeRef.current=true;setExpanded(true);setHelp(false);beginRecognition();
 };
 useEffect(()=>{
   setSupported(Boolean(availableRecognizer()));
   try{const saved=localStorage.getItem('kh-voice-provider');if(saved==='neural')setProvider('neural');const savedRate=Number(localStorage.getItem('kh-speech-rate'));if(savedRate>=.7&&savedRate<=1.1)setRate(savedRate);}catch{/* no storage */}
   api<{neural_speech_enabled:boolean;open_questions_enabled:boolean}>('/api/voice/config').then(r=>{setCloudEnabled(r.neural_speech_enabled);setChatEnabled(r.open_questions_enabled);if(!r.neural_speech_enabled&&localStorage.getItem('kh-voice-provider')==='neural'){setProvider('browser');localStorage.setItem('kh-voice-provider','browser');}}).catch(()=>{});
   return ()=>{activeRef.current=false;cancelRetry();try{recognizerRef.current?.abort();}catch{/* done */}if(cloudRef.current)void cloudRef.current.abort();};
 },[]);
 useEffect(()=>{
   const refresh=()=>{setVoices(installedSpeechVoices(lang));try{setChosenVoice(localStorage.getItem(`kh-voice-${lang}`)||'');}catch{/* disabled */}};
   refresh();try{setNeuralGender(localStorage.getItem(`kh-neural-gender-${lang}`)==='male'?'male':'female');}catch{/* storage disabled */}if('speechSynthesis' in window)window.speechSynthesis.addEventListener('voiceschanged',refresh);
   return ()=>{if('speechSynthesis' in window)window.speechSynthesis.removeEventListener('voiceschanged',refresh);};
 },[lang]);
 useEffect(()=>{
   const onResult=(event:Event)=>{scanRef.current=(event as CustomEvent<ScanContext|null>).detail;};
   const speaking=()=>{spokenRef.current=true;try{recognizerRef.current?.abort();}catch{/* done */}setListening(false);cancelRetry();};
   const ended=()=>{spokenRef.current=false;if(activeRef.current&&continuousRef.current&&provider==='browser'){cancelRetry();retryRef.current=setTimeout(()=>beginRecognitionRef.current(),800);}};
   window.addEventListener('kh:analysis-result',onResult);window.addEventListener('kh:speech-start',speaking);window.addEventListener('kh:speech-end',ended);
   return ()=>{window.removeEventListener('kh:analysis-result',onResult);window.removeEventListener('kh:speech-start',speaking);window.removeEventListener('kh:speech-end',ended);};
 },[provider]);
 useEffect(()=>{if(activeRef.current&&continuousRef.current){try{recognizerRef.current?.stop();}catch{/* done */}};},[lang]);
 return <div className="kh-voice-wrap" aria-label={t.title}>
  {!expanded?<button type="button" className="kh-voice-fab" onClick={()=>{setExpanded(true);if(turns.length===0)setFeedback(greetings[lang]);}} aria-label={t.title}><MessageCircle size={21}/><span>{t.title}</span></button>:
  <div className="kh-voice-panel" role="region" aria-label={t.title}>
   <div className="kh-voice-top"><strong><MessageCircle size={19}/> {t.title}</strong><button type="button" onClick={()=>{stopListening();setExpanded(false)}} aria-label="Close assistant"><X size={19}/></button></div>
   <div className="kh-voice-locale"><Globe2 size={16}/><label htmlFor="kh-voice-language">{t.awaiting}</label></div>
   <select id="kh-voice-language" aria-label="Voice language" value={lang} onChange={e=>setLang(e.target.value as Lang)}>
     <option value="kn">ಕನ್ನಡ — Kannada</option><option value="te">తెలుగు — Telugu</option><option value="hi">हिंदी — Hindi</option><option value="en">English</option>
   </select>
   <div className="kh-voice-buttons">
     <button className={listening?'kh-voice-mic active':'kh-voice-mic'} onClick={()=>void toggleMicrophone()} disabled={busy || (provider==='browser'&&supported===false)} type="button" aria-pressed={listening}>
       {listening?<MicOff size={18}/>:<Mic size={18}/>} {listening?t.stop:t.start}
     </button>
     <button className="kh-voice-icon" type="button" onClick={()=>setHelp(v=>!v)} aria-label={t.help}><HelpCircle size={19}/></button>
     <button className="kh-voice-icon" type="button" onClick={()=>setSettings(v=>!v)} aria-label="Voice settings"><Settings2 size={19}/></button>
   </div>
   {provider==='browser'&&<label className="kh-voice-opt"><input type="checkbox" checked={continuous} onChange={e=>{stopListening();setContinuous(e.target.checked)}}/> {lang==='kn'?'ನಿರಂತರ ಕೇಳುವಿಕೆ (ಪ್ರಾಯೋಗಿಕ)':lang==='hi'?'लगातार सुनना (प्रयोगात्मक)':lang==='te'?'నిరంతరం వినడం (ప్రయోగాత్మకం)':'Continuous listening (experimental)'}</label>}
   {settings&&<div className="kh-voice-settings">
     <label>{l.provider}</label>
     <select value={provider} onChange={e=>{stopListening();const p=e.target.value as 'browser'|'neural';setProvider(p);localStorage.setItem('kh-voice-provider',p)}}>
       <option value="browser">{l.browser}</option>
       <option value="neural" disabled={!cloudEnabled}>{l.neural}</option>
     </select>
     {!cloudEnabled&&<p className="kh-voice-hint">{l.noCloud}</p>}
     {provider==='neural'&&<><label>{l.voice}</label><select value={neuralGender} onChange={e=>{const g=e.target.value as 'male'|'female';setNeuralGender(g);localStorage.setItem(`kh-neural-gender-${lang}`,g)}}><option value="female">{lang==='kn'?'ಮಹಿಳೆ ಧ್ವನಿ':lang==='te'?'మహిళా వాయిస్':lang==='hi'?'महिला आवाज़':'Female voice'}</option><option value="male">{lang==='kn'?'ಪುರುಷ ಧ್ವನಿ':lang==='te'?'పురుష వాయిస్':lang==='hi'?'पुरुष आवाज़':'Male voice'}</option></select></>}
     {provider==='browser'&&<><label>{l.voice}</label><select value={chosenVoice} onChange={e=>{setChosenVoice(e.target.value);localStorage.setItem(`kh-voice-${lang}`,e.target.value)}}>
       <option value="">{lang==='te'?'తెలుగు వాయిస్':lang==='kn'?'ಕನ್ನಡ ಧ್ವನಿ':lang==='hi'?'हिंदी आवाज़':'Automatic voice'}</option>
       {voices.map(v=><option value={v.name} key={v.name}>{v.name} ({v.lang})</option>)}
     </select>{voices.length===0&&<p className="kh-voice-error">{l.noVoice}</p>}</>}
     <label htmlFor="kh-speech-rate">{l.rate}: {rate.toFixed(2)}×</label>
     <input id="kh-speech-rate" aria-label={l.rate} type="range" min="0.7" max="1.1" step="0.05" value={rate} onChange={e=>{const v=Number(e.target.value);setRate(v);localStorage.setItem('kh-speech-rate',String(v))}}/>
     <button type="button" className="kh-voice-preview" onClick={()=>speakText(greetings[lang],lang)}><Volume2 size={15}/> {l.test}</button>
   </div>}
   {listening&&<p className="kh-voice-live" role="status"><span className="kh-voice-led"/> {t.listening}</p>}
   {provider==='neural'&&cloudEnabled&&<p className="kh-voice-hint">{l.micTip}</p>}
   {supported===false&&provider==='browser'&&<p className="kh-voice-error">{t.unsupported}</p>}
   {heard&&<p className="kh-voice-heard"><strong>{t.heard}:</strong> {heard}</p>}
   {turns.length>0&&<div className="kh-voice-chat" role="log" aria-label={l.history} aria-live="polite">{turns.map((turn,i)=><div key={i} className={'kh-voice-turn '+turn.who}>{turn.text}</div>)}</div>}
   {feedback&&<p className="kh-voice-message" role="status">{feedback}</p>}
   <form className="kh-voice-ask" onSubmit={e=>{e.preventDefault();const text=draft.trim();if(text){setDraft('');void processTranscript(text)}}}>
     <label htmlFor="kh-farmer-question">{l.question}</label>
     <div><input id="kh-farmer-question" value={draft} onChange={e=>setDraft(e.target.value)} maxLength={450} placeholder={l.ask} disabled={busy}/>
       <button type="submit" disabled={busy||!draft.trim()} title={l.send}><Send size={17}/></button>
     </div>
   </form>
   {help&&<div className="kh-voice-help"><strong>{t.help}</strong><ul>{t.examples.map(x=><li key={x}>{x}</li>)}</ul><p>{t.tip}</p></div>}
   <p className="kh-voice-hint">{l.note}</p>
   <p className="kh-voice-privacy"><ShieldCheck size={15}/>{t.privacy} {provider==='neural'?'Cloud mode sends microphone audio and spoken text to a configured speech provider.':''}</p>
   <button className="kh-voice-cancel-speech" type="button" onClick={stopSpeech}><Volume2 size={15}/>{lang==='kn'?'ಮಾತು ನಿಲ್ಲಿಸಿ':lang==='te'?'మాట ఆపండి':lang==='hi'?'आवाज़ रोकें':'Stop reading aloud'}</button>
  </div>}
 </div>;
}
