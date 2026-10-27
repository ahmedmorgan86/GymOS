/** Device-specific QR entry. No auth or business data changes. */
export function mobileDownloadResponse(request:Request,apkPath:string,webPath:string,nativeReady=true){
 const android=/Android/i.test(request.headers.get('user-agent')??'');
 const destination=android&&nativeReady?apkPath:webPath;
 return new Response(null,{status:307,headers:{Location:destination,'Cache-Control':'private, no-store',Vary:'User-Agent','X-Robots-Tag':'noindex, nofollow'}});
}
