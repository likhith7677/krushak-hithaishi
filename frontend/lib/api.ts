// All browser calls use same-origin Next.js proxy; no separate localhost:8000 dependency.
export const API_BASE=process.env.NEXT_PUBLIC_API_URL||'';
export type SessionUser={id:number;name:string;phone:string;role:'owner'|'farmer'|'admin';preferred_language:string};
export type Shop={id:number;owner_id:number;name:string;village:string;town:string;district:string;state:string;pincode:string;phone:string;hours:string;description:string;image_url:string;latitude:number;longitude:number;status:string;created_at:string;updated_at:string;distance_km:number|null};
export type Product={id:number;shop_id:number;name:string;category:string;brand:string;description:string;image_url:string;package_size:string;price:number|null;in_stock:boolean;updated_at:string;moderation_status:string};
export type ShopForm=Omit<Shop,'id'|'owner_id'|'status'|'created_at'|'updated_at'|'distance_km'>;
export type ProductForm=Omit<Product,'id'|'shop_id'|'updated_at'|'moderation_status'>;
export const categories=['Fertilizer','Seeds','Biofertilizer','Biopesticide','Fungicide','Insecticide','Equipment','Plant nutrients','Other'];
export function asset(url?:string|null){if(!url)return '';return url.startsWith('/')?API_BASE+url:url;}
export async function api<T>(path:string,options:RequestInit={}):Promise<T>{
 const isForm=options.body instanceof FormData;
 const headers=new Headers(options.headers||{});
 headers.set('X-KH-Request','web');
 if(options.body&&!isForm)headers.set('Content-Type','application/json');
 let response:Response;
 try{response=await fetch(`${API_BASE}${path}`,{...options,credentials:'include',headers,cache:'no-store'});}catch{throw new Error('Cannot reach the server. Check your connection and try again.');}
 let data:any;try{data=await response.json();}catch{data={detail:response.statusText};}
 if(!response.ok){const detail=data?.detail;throw new Error(typeof detail==='string'?detail:Array.isArray(detail)?detail.map((x:any)=>x.msg).join(', '):`Request failed (${response.status})`);}
 return data as T;
}
export async function uploadPhoto(file:File){const f=new FormData();f.append('file',file);return api<{url:string}>('/api/uploads',{method:'POST',body:f});}
export const formatPrice=(x:number|null)=>x===null?'Ask the shop':new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(x);
