/** Client-side, opt-in Web Speech support for Krushak Hithaishi.
 * There is no server audio upload in our application. Some browsers use
 * their own online speech-recognition service; see VOICE_FEATURES.md.
 */
import type {Lang} from './i18n';

export const SPEECH_LOCALES: Record<Lang,string>={kn:'kn-IN',en:'en-IN',hi:'hi-IN',te:'te-IN'};
export type VoiceIntent =
 | {kind:'language';language:Lang}
 | {kind:'navigate';path:string}
 | {kind:'crop';crop:'tomato'|'potato'|'bell_pepper'}
 | {kind:'model';model:'auto'|'general'|'tomato_specialist'}
 | {kind:'analyze'|'upload'|'read-result'|'stop-speech'|'stop-listening'|'help'|'locate'|'show-map'|'hide-map'|'auto-read-on'|'auto-read-off'}
 | {kind:'search-shops';query:string}
 | {kind:'unknown'};

export type CropResultForSpeech={
 status:string; prediction?:string|null; disease_name?:string|null;
 healthy?:boolean|null; confidence?:number|null;
};

export const voiceStrings:Record<Lang,{
 title:string;start:string;stop:string;listen:string;listening:string;help:string;
 examples:string[];unsupported:string;micDenied:string;notRecognized:string;
 awaiting:string;heard:string;privacy:string;tip:string;
 notAvailable:string; stopped:string; needsPhoto:string; needsResult:string;
 modelUnavailable:string; working:string; readNotSupported:string;
}>= {
 en:{title:'Voice assistant',start:'Start voice commands',stop:'Stop microphone',listen:'Tap microphone and speak',listening:'Listening… speak a command',help:'Voice command examples',examples:['Open crop scanner','Select tomato','Upload photo','Analyse leaf','Read result','Find village shops','Switch to Kannada','Stop listening'],unsupported:'Voice recognition is not supported in this browser. Use Chrome on Android or desktop, or use the manual controls.',micDenied:'Microphone access was denied. Allow microphone permission in browser settings.',notRecognized:'I did not understand that command. Open Help for examples.',awaiting:'Select a language, then tap the microphone.',heard:'Heard',privacy:'Only listens after you tap Start. Your browser may send speech to its recognition service; the application does not store voice recordings.',tip:'For voice controls use HTTPS or localhost and allow microphone access.',notAvailable:'Voice commands are unavailable on this device. Manual controls still work.',stopped:'Microphone stopped.',needsPhoto:'Please choose a leaf photo first. Browsers require you to tap the photo picker.',needsResult:'Analyse a leaf first to hear its result.',modelUnavailable:'The requested tomato model is not connected.',working:'Command received.',readNotSupported:'Speech output is unavailable on this browser.'},
 kn:{title:'ಧ್ವನಿ ಸಹಾಯಕ',start:'ಧ್ವನಿ ಆದೇಶ ಪ್ರಾರಂಭಿಸಿ',stop:'ಮೈಕ್ರೊಫೋನ್ ನಿಲ್ಲಿಸಿ',listen:'ಮೈಕ್ರೊಫೋನ್ ಒತ್ತಿ ಮಾತನಾಡಿ',listening:'ಕೇಳುತ್ತಿದ್ದೇನೆ… ಆದೇಶ ಹೇಳಿ',help:'ಧ್ವನಿ ಆದೇಶಗಳ ಉದಾಹರಣೆಗಳು',examples:['ಬೆಳೆ ಪರಿಶೀಲನೆ','ಟೊಮೇಟೊ ಆಯ್ಕೆಮಾಡಿ','ಫೋಟೋ ಹಾಕಿ','ಪರಿಶೀಲಿಸಿ','ಫಲಿತಾಂಶ ಹೇಳು','ಅಂಗಡಿಗಳು ತೋರಿಸು','ಇಂಗ್ಲಿಷ್ ಭಾಷೆ','ಕೇಳುವುದನ್ನು ನಿಲ್ಲಿಸು'],unsupported:'ಈ ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಧ್ವನಿ ಗುರುತಿಸುವಿಕೆ ಲಭ್ಯವಿಲ್ಲ. Chrome ಅಥವಾ ಕೈಯಾರೆ ಆಯ್ಕೆಯನ್ನು ಬಳಸಿ.',micDenied:'ಮೈಕ್ರೊಫೋನ್ ಅನುಮತಿ ನಿರಾಕರಿಸಲಾಗಿದೆ. ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಅನುಮತಿ ನೀಡಿ.',notRecognized:'ಆ ಆದೇಶ ಅರ್ಥವಾಗಲಿಲ್ಲ. ಸಹಾಯದಲ್ಲಿ ಉದಾಹರಣೆಗಳನ್ನು ನೋಡಿ.',awaiting:'ಭಾಷೆ ಆಯ್ಕೆ ಮಾಡಿ, ನಂತರ ಮೈಕ್ರೊಫೋನ್ ಒತ್ತಿ.',heard:'ಕೇಳಿದ ಮಾತು',privacy:'ಮೈಕ್ರೊಫೋನ್ ಒತ್ತಿದಾಗ ಮಾತ್ರ ಕೇಳುತ್ತದೆ. ಬ್ರೌಸರ್ ಧ್ವನಿಯನ್ನು ತನ್ನ ಸೇವೆಗೆ ಕಳುಹಿಸಬಹುದು; ನಮ್ಮ ಆಪ್ ಧ್ವನಿ ರೆಕಾರ್ಡಿಂಗ್ ಸಂಗ್ರಹಿಸುವುದಿಲ್ಲ.',tip:'ಧ್ವನಿ ಆದೇಶಗಳಿಗೆ HTTPS ಅಥವಾ localhost ಮತ್ತು ಮೈಕ್ರೊಫೋನ್ ಅನುಮತಿ ಬೇಕು.',notAvailable:'ಈ ಸಾಧನದಲ್ಲಿ ಧ್ವನಿ ಆದೇಶಗಳು ಲಭ್ಯವಿಲ್ಲ. ಕೈಯಾರೆ ಬಳಸಬಹುದು.',stopped:'ಮೈಕ್ರೊಫೋನ್ ನಿಲ್ಲಿಸಲಾಗಿದೆ.',needsPhoto:'ಮೊದಲು ಎಲೆಯ ಫೋಟೋ ಆಯ್ಕೆ ಮಾಡಿ. ಫೋಟೋ ಆಯ್ಕೆ ಮಾಡಲು ಪರದೆ ಮುಟ್ಟಬೇಕು.',needsResult:'ಮೊದಲು ಎಲೆಯನ್ನು ಪರಿಶೀಲಿಸಿ.',modelUnavailable:'ಟೊಮೇಟೊ ಮಾದರಿ ಲಭ್ಯವಿಲ್ಲ.',working:'ಆದೇಶ ಸ್ವೀಕರಿಸಲಾಗಿದೆ.',readNotSupported:'ಈ ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಧ್ವನಿ ಓದುವಿಕೆ ಲಭ್ಯವಿಲ್ಲ.'},
 hi:{title:'आवाज़ सहायक',start:'आवाज़ से चलाएँ',stop:'माइक्रोफ़ोन बंद करें',listen:'माइक्रोफ़ोन दबाएँ और बोलें',listening:'सुन रहा हूँ… आदेश बोलें',help:'आवाज़ से दिए जाने वाले आदेश',examples:['फसल जाँच खोलो','टमाटर चुनो','फोटो अपलोड करो','जाँच करो','परिणाम सुनाओ','दुकान दिखाओ','कन्नड़ भाषा','सुनना बंद करो'],unsupported:'इस ब्राउज़र में आवाज़ पहचान उपलब्ध नहीं है। Chrome या सामान्य बटन इस्तेमाल करें।',micDenied:'माइक्रोफ़ोन की अनुमति नहीं मिली। ब्राउज़र में अनुमति दें।',notRecognized:'यह आदेश समझ नहीं आया। मदद में उदाहरण देखें।',awaiting:'भाषा चुनें, फिर माइक्रोफ़ोन दबाएँ।',heard:'सुना गया',privacy:'बटन दबाने के बाद ही माइक्रोफ़ोन सुनता है। ब्राउज़र आवाज़ अपनी सेवा को भेज सकता है; हमारा ऐप रिकॉर्डिंग सेव नहीं करता।',tip:'आवाज़ पहचान के लिए HTTPS या localhost और माइक्रोफ़ोन अनुमति ज़रूरी है।',notAvailable:'इस उपकरण पर आवाज़ के आदेश उपलब्ध नहीं हैं। बटन से भी इस्तेमाल कर सकते हैं।',stopped:'माइक्रोफ़ोन बंद है।',needsPhoto:'पहले पत्ती की फ़ोटो चुनें। सुरक्षा के कारण फ़ाइल चुनने के लिए स्क्रीन दबानी होगी।',needsResult:'पहले पत्ती की जाँच करें।',modelUnavailable:'टमाटर का मॉडल उपलब्ध नहीं है।',working:'आदेश मिल गया।',readNotSupported:'इस ब्राउज़र पर आवाज़ में परिणाम उपलब्ध नहीं है।'},
 te:{title:'వాయిస్ సహాయకుడు',start:'వాయిస్ ఆదేశాలు మొదలుపెట్టండి',stop:'మైక్రోఫోన్ ఆపండి',listen:'మైక్రోఫోన్ నొక్కి మాట్లాడండి',listening:'వింటున్నాను… ఆదేశం చెప్పండి',help:'వాయిస్ ఆదేశాల ఉదాహరణలు',examples:['పంట పరిశీలన తెరువు','టమాటా ఎంచుకో','ఫోటో అప్లోడ్ చేయి','పరిశీలించు','ఫలితం చెప్పు','దుకాణాలు చూపించు','కన్నడ భాష','వినడం ఆపు'],unsupported:'ఈ బ్రౌజర్‌లో వాయిస్ గుర్తింపు లేదు. Chrome లేదా సాధారణ బటన్లు వాడండి.',micDenied:'మైక్రోఫోన్ అనుమతి లేదు. బ్రౌజర్ సెట్టింగ్‌లలో అనుమతించండి.',notRecognized:'ఆ ఆదేశం అర్థం కాలేదు. సహాయంలో ఉదాహరణలు చూడండి.',awaiting:'భాష ఎంచుకుని మైక్రోఫోన్ నొక్కండి.',heard:'విన్న మాట',privacy:'బటన్ నొక్కినప్పుడు మాత్రమే వింటుంది. బ్రౌజర్ ఆడియోను తన సేవకు పంపవచ్చు; యాప్ వాయిస్ రికార్డింగ్‌ను నిల్వ చేయదు.',tip:'వాయిస్ ఆదేశాలకు HTTPS లేదా localhost, మైక్రోఫోన్ అనుమతి అవసరం.',notAvailable:'ఈ పరికరంలో వాయిస్ ఆదేశాలు అందుబాటులో లేవు. బటన్లు వాడవచ్చు.',stopped:'మైక్రోఫోన్ ఆపబడింది.',needsPhoto:'ముందుగా ఆకు ఫోటో ఎంచుకోండి. ఫోటో ఫైల్‌ను ఎంచుకోవడానికి స్క్రీన్ నొక్కాలి.',needsResult:'ముందుగా ఆకును పరిశీలించండి.',modelUnavailable:'టమాటా మోడల్ అందుబాటులో లేదు.',working:'ఆదేశం అందింది.',readNotSupported:'ఈ బ్రౌజర్‌లో వాయిస్ ద్వారా ఫలితం చెప్పడం సాధ్యం కాదు.'}
};

const normalize=(s:string)=>s.toLocaleLowerCase().normalize('NFC').replace(/[.,!?।،:;]+/g,' ').replace(/\s+/g,' ').trim();
const contains=(s:string,terms:string[])=>terms.some(term=>s.includes(normalize(term)));
const onlyOrRequested=(s:string,names:string[])=>names.some(n=>s===normalize(n))||contains(s,['language','switch','change','ಭಾಷೆ','ಬದಲಿಸಿ','बदल','भाषा','భాష','మార్చు','ಗೆ ಬದಲಿಸಿ','में']);

const languages:Record<Lang,string[]>={
 kn:['ಕನ್ನಡ','ಕನ್ನಡ ಭಾಷೆ','kannada','kannad','कन्नड़','कन्नड़','కన్నడ'],en:['english','ಇಂಗ್ಲಿಷ್','अंग्रेजी','ఇంగ్లీష్','इंग्लिश','अंग्रेज़ी','ఆంగ్లం'],
 hi:['hindi','ಹಿಂದಿ','हिंदी','हिन्दी','హిందీ','हिंदी भाषा'],te:['telugu','ತೆಲುಗು','तेलुगू','తెలుగు','तेलుగు']
};
const cropKeywords={tomato:['tomato','ಟೊಮೇಟೊ','ಟೊಮಾಟೊ','ಟೊಮೆಟೊ','ಟೊಮೆಟೋ','tomato','tomatoo','टमाटर','टमाटो','టమాటా','టమోటా','టమాట','టొమాటో','tomata','tamata','tomato'],potato:['potato','ಆಲೂಗಡ್ಡೆ','ಆಲೂ','आलू','आलू के','బంగాళదుంప','ఆలుగడ్డ'],bell_pepper:['capsicum','bell pepper','pepper','ದೊಣ್ಣೆ ಮೆಣಸಿನಕಾಯಿ','ಕ್ಯಾಪ್ಸಿಕಂ','शिमला मिर्च','कैप्सिकम','కాప్సికం','బెల్ పెప్పర్','క్యాప్సికమ్']} as const;
export function parseVoiceCommand(input:string,_lang:Lang):VoiceIntent{
 const s=normalize(input);
 if(!s)return {kind:'unknown'};
 for(const lang of ['kn','en','hi','te'] as Lang[]){
   if(contains(s,languages[lang])&&onlyOrRequested(s,languages[lang]))return {kind:'language',language:lang};
 }
 if(contains(s,['stop listening','stop microphone','microphone off','ಕೇಳುವುದನ್ನು ನಿಲ್ಲಿಸು','ಮೈಕ್ರೊಫೋನ್ ನಿಲ್ಲಿಸು','सुनना बंद','माइक्रोफोन बंद','వినడం ఆపు','మైక్రోఫోన్ ఆపు']))return {kind:'stop-listening'};
 if(contains(s,['stop speaking','stop speech','stop voice','be quiet','ಧ್ವನಿ ನಿಲ್ಲಿಸು','ಮಾತು ನಿಲ್ಲಿಸು','बोलना बंद','आवाज़ बंद','మాట ఆపు','మాట్లాడటం ఆపు']))return {kind:'stop-speech'};
 if(contains(s,['help','commands','ಸಹಾಯ','ಆದೇಶಗಳು','मदद','आदेश','సహాయం','ఆదేశాలు']))return {kind:'help'};
 if(contains(s,['automatic voice off','auto read off','stop automatic reading','ಸ್ವಯಂಚಾಲಿತ ಧ್ವನಿ ಬೇಡ','अपने आप मत पढ़ो','ఆటో వాయిస్ ఆఫ్']))return {kind:'auto-read-off'};
 if(contains(s,['automatic voice on','auto read on','read results automatically','ಸ್ವಯಂಚಾಲಿತ ಧ್ವನಿ ಬೇಕು','अपने आप पढ़ो','ఆటో వాయిస్ ఆన్']))return {kind:'auto-read-on'};
 if(contains(s,['read result','speak result','say result','listen to result','tell result','ಫಲಿತಾಂಶ ಹೇಳು','ಫಲಿತಾಂಶ ಓದು','ಫಲಿತಾಂಶ ಕೇಳಿ','ರಿಸಲ್ಟ್ ಹೇಳು','ಏನು ಬಂದಿದೆ ಹೇಳಿ','ಫಲಿತಾಂಶ ಏನು','परिणाम सुनाओ','नतीजा बताओ','रिजल्ट सुनाओ','ఫలితం చెప్పు','ఫలితం వినిపించు','ఫలితాన్ని చదువు','రిజల్ట్ చెప్పు','ఏం వచ్చింది చెప్పు','ఏమొచ్చింది','పరీక్ష ఫలితం','ఫలితం ఏంటి']))return {kind:'read-result'};
 if(contains(s,['analyse','analyze','scan now','check leaf','scan leaf','ಪರಿಶೀಲಿಸಿ','ವಿಶ್ಲೇಷಿಸಿ','ಸ್ಕ್ಯಾನ್ ಮಾಡಿ','ಚೆಕ್ ಮಾಡಿ','ನೋಡಿ','ಬೆಳೆ ಪರೀಕ್ಷಿಸಿ','जाँच करो','जांच करो','विश्लेषण करो','పరిశీలించు','విశ్లేషించు','స్కాన్ చెయ్యి','చెక్ చెయ్యి','చూడు','పరీక్ష చేయి','చెక్ చేయి']))return {kind:'analyze'};
 if(contains(s,['upload photo','choose photo','open camera','take photo','select photo','ಫೋಟೋ ಹಾಕಿ','ಫೋಟೋ ತೆಗೆಯಿರಿ','ಫೋಟೋ ಆಯ್ಕೆ','फोटो अपलोड','फोटो चुनो','फोटो लो','ఫోటో అప్లోడ్','ఫోటో తీయి','ఫోటో ఎంచుకో']))return {kind:'upload'};
 if(contains(s,['show map','open map','ನಕ್ಷೆ ತೋರಿಸು','ನಕ್ಷೆ ತೆರೆ','नक्शा दिखाओ','नक्शा खोलो','మ్యాప్ చూపించు','మ్యాప్ తెరువు']))return {kind:'show-map'};
 if(contains(s,['hide map','close map','ನಕ್ಷೆ ಮುಚ್ಚು','नक्शा बंद','మ్యాప్ మూసివేయి']))return {kind:'hide-map'};
 if(contains(s,['use my location','find nearby','near me','ನನ್ನ ಸ್ಥಳ','ಹತ್ತಿರದ ಅಂಗಡಿಗಳು','मेरी लोकेशन','मेरे पास','నా స్థానాన్ని','నా దగ్గర']))return {kind:'locate'};
 // Optional spoken shop-name / village search.
 const match=s.match(/^(?:search(?: for)?(?: shops?| village| store)?(?: in)?|find shop in|ಅಂಗಡಿ ಹುಡುಕು|ಹಳ್ಳಿ ಹುಡುಕು|दुकान खोजो|गाँव खोजो|దుకాణం వెతుకు|గ్రామం వెతుకు)\s+(.+)$/u);
 if(match&&match[1].length>=2)return {kind:'search-shops',query:match[1].trim()};
 if(contains(s,['shop','shops','store','ಅಂಗಡಿ','ಅಂಗಡಿಗಳು','दुकान','दुकानें','दुकान दिखाओ','దుకాణం','దుకాణాలు']))return {kind:'navigate',path:'/shops'};
 if(contains(s,['farmer corner','farmer page','farmer','ರೈತರಿಗಾಗಿ','ರೈತ','किसान','రైతు']))return {kind:'navigate',path:'/farmer'};
 if(contains(s,['about us','about page','ನಮ್ಮ ಬಗ್ಗೆ','हमारे बारे','మా గురించి']))return {kind:'navigate',path:'/about'};
 if(contains(s,['dashboard','owner page','shop owner','ಅಂಗಡಿ ಮಾಲೀಕ','ಡ್ಯಾಶ್‌ಬೋರ್ಡ್','डैशबोर्ड','दुकानदार','డాష్‌బోర్డ్','యజమాని']))return {kind:'navigate',path:'/owner/dashboard'};
 if(contains(s,['home page','go home','open home','ಮುಖಪುಟ','ಮನೆಗೆ ಹೋಗಿ','होम खोलो','मुखपृष्ठ','హోమ్','ముఖ్య పేజీ']))return {kind:'navigate',path:'/'};
 if(contains(s,['scan crop','open scanner','crop scanner','detection page','scan page','check crop','crop analysis','ಬೆಳೆ ಪರಿಶೀಲನೆ','ಬೆಳೆ ಪರಿಶೀಲಿಸಿ','ಸ್ಕ್ಯಾನರ್','फसल जाँच खोलो','फसल जांच खोलो','फसल की जाँच','पत्ती की जांच खोलो','పంట పరిశీలన తెరువు','పంట స్కాన్','ఆకు పరీక్ష పేజీ']))return {kind:'navigate',path:'/detect'};
 if(contains(s,['efficientnet','specialist','ಟೊಮೇಟೊ ವಿಶೇಷ','विशेषज्ञ मॉडल','स्पेशलिस्ट','ప్రత్యేక మోడల్']))return {kind:'model',model:'tomato_specialist'};
 if(contains(s,['mobilenet','general model','default model','ಸಾಮಾನ್ಯ ಮಾದರಿ','सामान्य मॉडल','డిఫాల్ట్ మోడల్']))return {kind:'model',model:'general'};
 if(contains(s,['auto model','recommended model','ಶಿಫಾರಸು ಮಾದರಿ','अनुशंसित मॉडल','సిఫార్సు మోడల్']))return {kind:'model',model:'auto'};
 for(const [crop,words] of Object.entries(cropKeywords))if(contains(s,[...words]))return {kind:'crop',crop:crop as 'tomato'|'potato'|'bell_pepper'};
 return {kind:'unknown'};
}

const diseaseLabels:Record<string,Record<Lang,string>>={
 healthy:{en:'Healthy leaf',kn:'ಆರೋಗ್ಯಕರ ಎಲೆ',hi:'स्वस्थ पत्ती',te:'ఆరోగ్యకరమైన ఆకు'},
 bacterial_spot:{en:'Bacterial spot',kn:'ಬ್ಯಾಕ್ಟೀರಿಯಾ ಎಲೆ ಚುಕ್ಕೆ ರೋಗ',hi:'बैक्टीरियल धब्बा रोग',te:'బ్యాక్టీరియా మచ్చల తెగులు'},
 early_blight:{en:'Early blight',kn:'ಆರಂಭಿಕ ಅಂಗಮಾರಿ ರೋಗ',hi:'अगेती झुलसा रोग',te:'ఎర్లీ బ్లైట్ తెగులు'},
 late_blight:{en:'Late blight',kn:'ತಡ ಅಂಗಮಾರಿ ರೋಗ',hi:'पछेती झुलसा रोग',te:'లేట్ బ్లైట్ తెగులు'},
 leaf_mold:{en:'Leaf mold',kn:'ಎಲೆಯ ಬೂಷ್ಟು ರೋಗ',hi:'पत्ती की फफूँद',te:'ఆకు బూజు తెగులు'},
 septoria_leaf_spot:{en:'Septoria leaf spot',kn:'ಸೆಪ್ಟೋರಿಯಾ ಎಲೆ ಚುಕ್ಕೆ ರೋಗ',hi:'सेप्टोरिया पत्ती धब्बा',te:'సెప్టోరియా ఆకు మచ్చలు'},
 spider_mites:{en:'Spider mites',kn:'ಜೇಡ ಹುಳದ ಹಾವಳಿ',hi:'मकड़ी के कण का प्रकोप',te:'సాలీడు పురుగుల దాడి'},
 target_spot:{en:'Target spot',kn:'ಟಾರ್ಗೆಟ್ ಸ್ಪಾಟ್ ಎಲೆ ಚುಕ್ಕೆ ರೋಗ',hi:'टारगेट स्पॉट रोग',te:'టార్గెట్ స్పాట్ తెగులు'},
 mosaic_virus:{en:'Tomato mosaic virus',kn:'ಟೊಮೇಟೊ ಮೊಸಾಯಿಕ್ ವೈರಸ್',hi:'टमाटर मोज़ेक वायरस',te:'టమాటా మొజాయిక్ వైరస్'},
 yellow_leaf_curl:{en:'Tomato yellow leaf curl virus',kn:'ಟೊಮೇಟೊ ಹಳದಿ ಎಲೆ ಸುರುಳಿ ವೈರಸ್',hi:'टमाटर पीली पत्ती मरोड़ वायरस',te:'టమాటా పసుపు ఆకు ముడత వైరస్'}
};
export function localizedDisease(name:string|null|undefined,lang:Lang):string{
 const s=(name||'').toLowerCase().replace(/[_-]+/g,' ').replace(/\s+/g,' ').trim();
 if(s.includes('healthy'))return diseaseLabels.healthy[lang];
 if(s.includes('bacterial')&&s.includes('spot'))return diseaseLabels.bacterial_spot[lang];
 if(s.includes('early')&&s.includes('blight'))return diseaseLabels.early_blight[lang];
 if(s.includes('late')&&s.includes('blight'))return diseaseLabels.late_blight[lang];
 if(s.includes('leaf')&&s.includes('mold'))return diseaseLabels.leaf_mold[lang];
 if(s.includes('septoria'))return diseaseLabels.septoria_leaf_spot[lang];
 if(s.includes('spider')||s.includes('mite'))return diseaseLabels.spider_mites[lang];
 if(s.includes('target')&&s.includes('spot'))return diseaseLabels.target_spot[lang];
 if(s.includes('yellow')&&s.includes('curl'))return diseaseLabels.yellow_leaf_curl[lang];
 if(s.includes('mosaic'))return diseaseLabels.mosaic_virus[lang];
 return (name||'').replace(/_/g,' '); // Unknown label remains exact; never guess a disease.
}

const resultTexts:Record<Lang,{
 intro:string;healthy:string;condition:string;score:string;warning:string;
 uncertain:string;mismatch:string;quality:string;unavailable:string;error:string;
}>= {
 en:{intro:'Your AI leaf analysis is ready.',healthy:'The model suggests the leaf may be healthy.',condition:'Possible condition:',score:'Model confidence score:',warning:'This is not a confirmed diagnosis. Do not apply pesticides based only on AI output. Consult a local agricultural expert.',uncertain:'The result has low confidence. Please take a clearer leaf photo. No disease is confirmed.',mismatch:'The selected crop may not match the photo. Confirm the crop and try again. No disease is confirmed.',quality:'The photo quality is insufficient. Please take a clearer photo.',unavailable:'The AI model is currently unavailable. No diagnosis was made.',error:'The analysis could not be completed. Please try again.'},
 kn:{intro:'ನಿಮ್ಮ ಎಲೆಯ AI ಪರಿಶೀಲನೆಯ ಫಲಿತಾಂಶ ಸಿದ್ಧವಾಗಿದೆ.',healthy:'ಮಾದರಿಯ ಪ್ರಕಾರ ಎಲೆ ಆರೋಗ್ಯಕರವಾಗಿರಬಹುದು.',condition:'ಸಂಭಾವ್ಯ ಸಮಸ್ಯೆ:',score:'ಮಾದರಿಯ ವಿಶ್ವಾಸ ಅಂಕ:',warning:'ಇದು ಖಚಿತ ರೋಗ ನಿರ್ಣಯವಲ್ಲ. AI ಫಲಿತಾಂಶದ ಆಧಾರದಲ್ಲಿ ಮಾತ್ರ ಕೀಟನಾಶಕ ಬಳಸಬೇಡಿ. ಸ್ಥಳೀಯ ಕೃಷಿ ತಜ್ಞರನ್ನು ಸಂಪರ್ಕಿಸಿ.',uncertain:'ಫಲಿತಾಂಶದ ವಿಶ್ವಾಸ ಕಡಿಮೆ. ದಯವಿಟ್ಟು ಸ್ಪಷ್ಟವಾದ ಎಲೆಯ ಫೋಟೋ ತೆಗೆದುಕೊಳ್ಳಿ. ರೋಗ ಖಚಿತವಾಗಿಲ್ಲ.',mismatch:'ಆಯ್ಕೆ ಮಾಡಿದ ಬೆಳೆ ಮತ್ತು ಫೋಟೋ ಹೊಂದಿಕೆಯಾಗದೇ ಇರಬಹುದು. ಬೆಳೆ ಪರಿಶೀಲಿಸಿ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ. ರೋಗ ಖಚಿತವಾಗಿಲ್ಲ.',quality:'ಫೋಟೋ ಸ್ಪಷ್ಟವಾಗಿಲ್ಲ. ಮತ್ತೊಂದು ಸ್ಪಷ್ಟವಾದ ಫೋಟೋ ತೆಗೆದುಕೊಳ್ಳಿ.',unavailable:'AI ಮಾದರಿ ಈಗ ಲಭ್ಯವಿಲ್ಲ. ರೋಗನಿರ್ಣಯ ಮಾಡಲಾಗಿಲ್ಲ.',error:'ಪರಿಶೀಲನೆ ಪೂರ್ಣಗೊಳ್ಳಲಿಲ್ಲ. ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.'},
 hi:{intro:'आपकी पत्ती की AI जाँच पूरी हो गई है।',healthy:'मॉडल के अनुसार पत्ती स्वस्थ हो सकती है।',condition:'संभावित समस्या:',score:'मॉडल का विश्वास स्कोर:',warning:'यह पक्की बीमारी की पहचान नहीं है। सिर्फ AI के आधार पर कीटनाशक न डालें। स्थानीय कृषि विशेषज्ञ से सलाह लें।',uncertain:'नतीजे का विश्वास कम है। पत्ती की साफ फोटो दोबारा लें। किसी बीमारी की पुष्टि नहीं हुई है।',mismatch:'चुनी हुई फसल फोटो से मेल नहीं खा सकती। फसल देखकर फिर कोशिश करें। बीमारी की पुष्टि नहीं हुई है।',quality:'फोटो साफ नहीं है। साफ फोटो दोबारा लें।',unavailable:'AI मॉडल अभी उपलब्ध नहीं है। कोई निदान नहीं हुआ है।',error:'जाँच पूरी नहीं हो सकी। फिर कोशिश करें।'},
 te:{intro:'మీ ఆకు AI పరిశీలన ఫలితం సిద్ధంగా ఉంది.',healthy:'మోడల్ ప్రకారం ఆకు ఆరోగ్యంగా ఉండవచ్చు.',condition:'సంభావ్య సమస్య:',score:'మోడల్ విశ్వాస స్కోరు:',warning:'ఇది నిర్ధారించిన వ్యాధి కాదు. AI ఫలితం ఆధారంగా మాత్రమే పురుగుమందులు వాడవద్దు. స్థానిక వ్యవసాయ నిపుణులను సంప్రదించండి.',uncertain:'ఫలితంపై నమ్మకం తక్కువగా ఉంది. స్పష్టమైన ఆకు ఫోటో మళ్లీ తీయండి. వ్యాధి నిర్ధారణ కాలేదు.',mismatch:'ఎంచుకున్న పంట ఫోటోతో సరిపోలకపోవచ్చు. పంటను చూసి మళ్లీ ప్రయత్నించండి. వ్యాధి నిర్ధారణ కాలేదు.',quality:'ఫోటో స్పష్టంగా లేదు. మళ్లీ స్పష్టమైన ఫోటో తీయండి.',unavailable:'AI మోడల్ ప్రస్తుతం అందుబాటులో లేదు. వ్యాధి నిర్ధారణ చేయలేదు.',error:'పరిశీలన పూర్తికాలేదు. మళ్లీ ప్రయత్నించండి.'}
};
export function resultSpeech(result:CropResultForSpeech,lang:Lang){
 const t=resultTexts[lang];
 if(result.status==='crop_mismatch')return `${t.intro} ${t.mismatch}`;
 if(result.status==='low_confidence')return `${t.intro} ${t.uncertain}`;
 if(result.status==='image_quality_issue')return t.quality;
 if(result.status==='model_unavailable')return t.unavailable;
 if(result.status!=='predicted')return t.error;
 const condition=result.healthy ? t.healthy : `${t.condition} ${localizedDisease(result.disease_name||result.prediction,lang)}.`;
 const confidence=typeof result.confidence==='number'&&Number.isFinite(result.confidence)
   ? ` ${t.score} ${Math.round(Math.max(0,Math.min(1,result.confidence))*100)}%.` : '';
 return `${t.intro} ${condition}${confidence} ${t.warning}`;
}

export type VoiceCommandEvent=CustomEvent<{intent:VoiceIntent}>;
export function dispatchVoiceIntent(intent:VoiceIntent){
 if(typeof window!=='undefined')window.dispatchEvent(new CustomEvent('kh:voice-command',{detail:{intent}}));
}

let playingAudio:HTMLAudioElement|null=null;
let playbackSequence=0;
export function stopSpeech(){
 playbackSequence++;
 if(typeof window!=='undefined'){
  try{playingAudio?.pause();}catch{/* already stopped */}
  playingAudio=null;
  if('speechSynthesis' in window)window.speechSynthesis.cancel();
  window.dispatchEvent(new Event('kh:speech-end'));
 }
}
export function installedSpeechVoices(lang:Lang):SpeechSynthesisVoice[]{
 if(typeof window==='undefined'||!('speechSynthesis' in window))return [];
 return window.speechSynthesis.getVoices().filter(v=>v.lang.toLowerCase()===SPEECH_LOCALES[lang].toLowerCase()||v.lang.toLowerCase().startsWith(lang+'-'));
}
function speakNative(message:string,lang:Lang):boolean{
 if(typeof window==='undefined'||!('speechSynthesis' in window)||typeof SpeechSynthesisUtterance==='undefined')return false;
 const u=new SpeechSynthesisUtterance(message);
 u.lang=SPEECH_LOCALES[lang];
 const savedRate=Number(localStorage.getItem('kh-speech-rate')||'0.88');
 u.rate=Number.isFinite(savedRate)?Math.max(.7,Math.min(1.1,savedRate)):.88;
 u.pitch=1;u.volume=1;
 const voices=installedSpeechVoices(lang);
 const savedName=localStorage.getItem(`kh-voice-${lang}`)||'';
 const preferred=voices.find(v=>v.name===savedName)||voices.find(v=>v.localService)||voices[0];
 if(preferred)u.voice=preferred;
 window.dispatchEvent(new Event('kh:speech-start'));
 u.onend=()=>window.dispatchEvent(new Event('kh:speech-end'));
 u.onerror=()=>window.dispatchEvent(new Event('kh:speech-end'));
 window.speechSynthesis.speak(u);
 return true;
}
/** Works without a key. If cloud speech is explicitly enabled, attempt Azure neural TTS
 * via our backend and fall back to native TTS on failure. The key is never sent to the browser.
 */
export function speakText(message:string,lang:Lang):boolean{
 if(typeof window==='undefined')return false;
 stopSpeech();const sequence=playbackSequence;
 const neural=localStorage.getItem('kh-voice-provider')==='neural';
 if(neural){
  window.dispatchEvent(new Event('kh:speech-start'));
  void fetch('/api/voice/synthesize',{method:'POST',headers:{'Content-Type':'application/json','X-KH-Request':'web'},body:JSON.stringify({lang,text:message.slice(0,700),voice:localStorage.getItem(`kh-neural-gender-${lang}`)==='male'?'male':'female'}),cache:'no-store'})
    .then(async r=>{if(!r.ok)throw Error('neural unavailable');return r.blob();})
    .then(async blob=>{
       if(sequence!==playbackSequence)return;
       const url=URL.createObjectURL(blob);const audio=new Audio(url);playingAudio=audio;
       const cleanup=()=>{URL.revokeObjectURL(url);if(playingAudio===audio)playingAudio=null;window.dispatchEvent(new Event('kh:speech-end'));};
       audio.addEventListener('ended',cleanup,{once:true});audio.addEventListener('error',cleanup,{once:true});
       try{await audio.play();}catch{cleanup();if(sequence===playbackSequence)speakNative(message,lang);}
    }).catch(()=>{if(sequence===playbackSequence)speakNative(message,lang);});
  return true;
 }
 return speakNative(message,lang);
}
