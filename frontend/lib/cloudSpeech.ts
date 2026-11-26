/** Short push-to-talk WAV recording for optional server-side speech recognition.
 * No audio is kept by this application. Requires user microphone permission.
 */
export type CloudRecording={stop:()=>Promise<Blob>;abort:()=>Promise<void>};
export async function startCloudRecording():Promise<CloudRecording>{
 if(!navigator.mediaDevices?.getUserMedia)throw new Error('Microphone recording is unavailable');
 const stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});
 const AudioContextConstructor=window.AudioContext;
 if(!AudioContextConstructor){stream.getTracks().forEach(t=>t.stop());throw new Error('Audio recording unavailable');}
 const ctx=new AudioContextConstructor();
 const source=ctx.createMediaStreamSource(stream);
 const processor=ctx.createScriptProcessor(4096,1,1);
 const chunks:Float32Array[]=[];let count=0;let finished=false;
 processor.onaudioprocess=(event)=>{
   if(finished)return;
   const data=event.inputBuffer.getChannelData(0);
   if(count>=ctx.sampleRate*16)return;
   chunks.push(new Float32Array(data));count+=data.length;
   event.outputBuffer.getChannelData(0).fill(0);
 };
 source.connect(processor);processor.connect(ctx.destination);
 const cleanup=async()=>{finished=true;processor.disconnect();source.disconnect();stream.getTracks().forEach(t=>t.stop());await ctx.close();};
 return {
  abort:cleanup,
  stop:async()=>{
    await cleanup();
    const joined=new Float32Array(count);let offset=0;
    for(const chunk of chunks){joined.set(chunk,offset);offset+=chunk.length;}
    // Short-audio REST API needs mono 16 kHz, 16-bit PCM WAV.
    const targetRate=16000,ratio=ctx.sampleRate/targetRate;
    const length=Math.floor(joined.length/ratio);
    const buffer=new ArrayBuffer(44+length*2);const view=new DataView(buffer);
    const write=(at:number,text:string)=>{for(let i=0;i<text.length;i++)view.setUint8(at+i,text.charCodeAt(i));};
    write(0,'RIFF');view.setUint32(4,36+length*2,true);write(8,'WAVE');write(12,'fmt ');
    view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,1,true);
    view.setUint32(24,targetRate,true);view.setUint32(28,targetRate*2,true);
    view.setUint16(32,2,true);view.setUint16(34,16,true);write(36,'data');view.setUint32(40,length*2,true);
    for(let i=0;i<length;i++){
      const start=Math.floor(i*ratio);const end=Math.min(joined.length,Math.max(start+1,Math.floor((i+1)*ratio)));
      let val=0;for(let j=start;j<end;j++)val+=joined[j];val/=end-start;
      val=Math.max(-1,Math.min(1,val));view.setInt16(44+i*2,val<0?val*32768:val*32767,true);
    }
    return new Blob([buffer],{type:'audio/wav'});
  }
 };
}
