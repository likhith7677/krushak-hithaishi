/** npm run test:farmer — no internet or model files needed. */
const ts=require('typescript'),fs=require('fs'),path=require('path'),vm=require('vm');
function evaluate(file,custom={}){
  const src=fs.readFileSync(path.resolve(__dirname,file),'utf8');
  const transformed=ts.transpileModule(src,{fileName:file,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX},reportDiagnostics:true});
  if(transformed.diagnostics?.length)throw Error('Typescript syntax error in '+file);
  const module={exports:{}};
  vm.runInNewContext(transformed.outputText,{module,exports:module.exports,require:(id)=>custom[id]||require(id),console},{filename:file});
  return module.exports;
}
const voice=evaluate('../lib/voice.ts');
const farmer=evaluate('../lib/farmerAssistant.ts',{'./voice':voice});
const cases=[
  ['నమస్కారం','te','greeting'],['టమాటా ఆకులు పసుపు అవుతున్నాయి','te','yellow'],['ఆకుపై మచ్చలు ఉన్నాయి','te','spots'],
  ['నాకు ఏ ఎరువు వేయాలి','te','fertilizer'],['ఏ మందు వేయాలి','te','treatment'],['ఆకులు ముడతలు పడుతున్నాయి','te','curl'],
  ['ನಮಸ್ಕಾರ','kn','greeting'],['ನನ್ನ ಎಲೆ ಹಳದಿ ಆಗಿದೆ','kn','yellow'],['ಯಾವ ಗೊಬ್ಬರ ಹಾಕಬೇಕು','kn','fertilizer'],
  ['ಯಾವ ಔಷಧಿ ಹಾಕಲಿ','kn','treatment'],['What fertilizer should I use?','en','fertilizer'],
  ['Why are my leaves yellow?','en','yellow'],['पत्ते पीले क्यों हैं','hi','yellow'],['कौन सी दवा डालूं','hi','treatment'],
  ['Where are nearby shops?','en','shops']
];
for(const [question,lang,kind] of cases){
 const got=farmer.farmerQuestionAnswer(question,lang,null);
 if(!got||got.length<35)throw Error(`Missing answer for ${lang} ${kind}: ${got}`);
}
for(const l of ['kn','en','hi','te']){
  const q={en:'what disease did you find',kn:'ನನ್ನ ಫಲಿತಾಂಶ ಏನು',hi:'मेरा नतीजा बताओ',te:'నా ఫలితం ఏంటి'}[l];
  const noScan=farmer.farmerQuestionAnswer(q,l,null);
  if(!noScan||noScan.includes('90%'))throw Error('Fake result without scan '+l);
  const scanned=farmer.farmerQuestionAnswer(q,l,{status:'predicted',prediction:'Tomato___Early_blight',disease_name:'Early Blight',healthy:false,confidence:0.9});
  if(!scanned||!scanned.includes(voice.localizedDisease('Early Blight',l)))throw Error('Missing true scanned label '+l);
  const mismatch=farmer.farmerQuestionAnswer(q,l,{status:'crop_mismatch',prediction:'Potato___Early_blight',disease_name:'Early Blight'});
  if(!mismatch||mismatch.includes(voice.localizedDisease('Early Blight',l)))throw Error('Unsafe result spoken on crop mismatch '+l);
}
for(const [phrase,lang,expected] of [['టమాటా ఎంచుకో','te','crop'],['ఫలితం చెప్పు','te','read-result'],['ಟೊಮೇಟೊ ಆಯ್ಕೆಮಾಡಿ','kn','crop'],['ಫಲಿತಾಂಶ ಹೇಳು','kn','read-result'],['Switch to Telugu','en','language']]){
 const got=voice.parseVoiceCommand(phrase,lang);if(got.kind!==expected)throw Error(`Bad command ${phrase}: ${got.kind}`);
}
console.log(`PASS: ${cases.length} natural farmer questions; 4 language scan-context controls; 5 voice commands.`);
