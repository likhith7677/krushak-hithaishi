/** Run after npm install: npm run test:voice */
const ts=require('typescript');const fs=require('fs'),vm=require('vm'),path=require('path');
const src=fs.readFileSync(path.resolve(__dirname,'../lib/voice.ts'),'utf8');
const code=ts.transpileModule(src,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
const mod={exports:{}};vm.runInNewContext(code,{module:mod,exports:mod.exports,console});
const {parseVoiceCommand,resultSpeech,localizedDisease}=mod.exports;
const cases=[
 ['Open crop scanner','en','navigate'],['Select tomato','en','crop'],['Analyse leaf','en','analyze'],
 ['Read result','en','read-result'],['Switch to Kannada','en','language'],
 ['ಟೊಮೇಟೊ ಆಯ್ಕೆಮಾಡಿ','kn','crop'],['ಫಲಿತಾಂಶ ಹೇಳು','kn','read-result'],['ಇಂಗ್ಲಿಷ್ ಭಾಷೆ','kn','language'],
 ['टमाटर चुनो','hi','crop'],['परिणाम सुनाओ','hi','read-result'],['कन्नड़ भाषा','hi','language'],
 ['టమాటా ఎంచుకో','te','crop'],['ఫలితం చెప్పు','te','read-result'],['కన్నడ భాష','te','language'],
 ['Stop listening','en','stop-listening'],['Show map','en','show-map'],['EfficientNet specialist','en','model']
];
for(const [text,lang,kind] of cases){const got=parseVoiceCommand(text,lang);if(got.kind!==kind)throw Error(`${text}: expected ${kind}, got ${got.kind}`);}
for(const lang of ['en','kn','hi','te']){
 for(const status of ['predicted','crop_mismatch','low_confidence','model_unavailable','image_quality_issue']){
  const phrase=resultSpeech({status,prediction:'Tomato___Early_blight',disease_name:'Early Blight',confidence:0.9},lang);
  if(!phrase)throw Error(`Empty speech: ${lang}/${status}`);
  if(status!=='predicted'&&phrase.toLowerCase().includes('early blight'))throw Error(`Unsafe disease naming: ${lang}/${status}`);
 }
 if(!localizedDisease('Tomato___Early_blight',lang))throw Error(`Missing disease name: ${lang}`);
}
console.log(`PASS: ${cases.length} voice commands; 20 safe result speeches; 4 translated disease labels.`);
