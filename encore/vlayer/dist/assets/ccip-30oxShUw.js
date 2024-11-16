import{B as l,g as m,s as y,d as k,i as b,c as E,a as L,e as O,H as h,b as x}from"./index-CD1bJ9Ks.js";class R extends l{constructor({callbackSelector:t,cause:e,data:o,extraData:n,sender:c,urls:s}){super(e.shortMessage||"An error occurred while fetching for an offchain result.",{cause:e,metaMessages:[...e.metaMessages||[],e.metaMessages?.length?"":[],"Offchain Gateway Call:",s&&["  Gateway URL(s):",...s.map(d=>`    ${m(d)}`)],`  Sender: ${c}`,`  Data: ${o}`,`  Callback selector: ${t}`,`  Extra data: ${n}`].flat(),name:"OffchainLookupError"})}}class M extends l{constructor({result:t,url:e}){super("Offchain gateway response is malformed. Response data must be a hex value.",{metaMessages:[`Gateway URL: ${m(e)}`,`Response: ${y(t)}`],name:"OffchainLookupResponseMalformedError"})}}class $ extends l{constructor({sender:t,to:e}){super("Reverted sender address does not match target contract address (`to`).",{metaMessages:[`Contract address: ${e}`,`OffchainLookup sender address: ${t}`],name:"OffchainLookupSenderMismatchError"})}}const D="0x556f1830",S={name:"OffchainLookup",type:"error",inputs:[{name:"sender",type:"address"},{name:"urls",type:"string[]"},{name:"callData",type:"bytes"},{name:"callbackFunction",type:"bytes4"},{name:"extraData",type:"bytes"}]};async function T(i,{blockNumber:t,blockTag:e,data:o,to:n}){const{args:c}=k({data:o,abi:[S]}),[s,d,a,r,p]=c,{ccipRead:f}=i,g=f&&typeof f?.request=="function"?f.request:q;try{if(!b(n,s))throw new $({sender:s,to:n});const u=await g({data:a,sender:s,urls:d}),{data:w}=await E(i,{blockNumber:t,blockTag:e,data:L([r,O([{type:"bytes"},{type:"bytes"}],[u,p])]),to:n});return w}catch(u){throw new R({callbackSelector:r,cause:u,data:o,extraData:p,sender:s,urls:d})}}async function q({data:i,sender:t,urls:e}){let o=new Error("An unknown error occurred.");for(let n=0;n<e.length;n++){const c=e[n],s=c.includes("{data}")?"GET":"POST",d=s==="POST"?{data:i,sender:t}:void 0;try{const a=await fetch(c.replace("{sender}",t).replace("{data}",i),{body:JSON.stringify(d),method:s});let r;if(a.headers.get("Content-Type")?.startsWith("application/json")?r=(await a.json()).data:r=await a.text(),!a.ok){o=new h({body:d,details:r?.error?y(r.error):a.statusText,headers:a.headers,status:a.status,url:c});continue}if(!x(r)){o=new M({result:r,url:c});continue}return r}catch(a){o=new h({body:d,details:a.message,url:c})}}throw o}export{q as ccipRequest,T as offchainLookup,S as offchainLookupAbiItem,D as offchainLookupSignature};
//# sourceMappingURL=ccip-30oxShUw.js.map