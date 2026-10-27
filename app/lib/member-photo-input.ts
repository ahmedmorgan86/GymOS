export function validateMemberPhotoFile(file:Pick<File,'type'|'size'>){
 if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size<1||file.size>12*1024*1024)throw Error('photoFile');
}
/** Decode locally and re-encode pixels as a small JPEG, stripping source metadata. */
export async function memberPhotoFromFile(file:File){
 validateMemberPhotoFile(file);const url=URL.createObjectURL(file);
 try{
  const image=new window.Image();await new Promise<void>((resolve,reject)=>{image.onload=()=>resolve();image.onerror=()=>reject(Error('photoDecode'));image.src=url;});
  const w=image.naturalWidth,h=image.naturalHeight;if(!w||!h||w*h>40_000_000)throw Error('photoDimensions');
  const canvas=document.createElement('canvas');canvas.width=160;canvas.height=160;const ctx=canvas.getContext('2d');if(!ctx)throw Error('photoDecode');
  const side=Math.min(w,h);ctx.fillStyle='#ffffff';ctx.fillRect(0,0,160,160);ctx.drawImage(image,(w-side)/2,(h-side)/2,side,side,0,0,160,160);
  for(const quality of [.8,.65,.5,.35]){const value=canvas.toDataURL('image/jpeg',quality);if(/^data:image\/jpeg;base64,\/9j\//.test(value)&&value.length<=22000)return value;}
  throw Error('photoSize');
 }finally{URL.revokeObjectURL(url);}
}
