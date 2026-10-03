/** Match the fixed orientation shown in the proof; no implicit rotation or upscaling. */
export function hasProdigiPrintResolution(width:number|null|undefined,height:number|null|undefined,required:{horizontalResolution:number;verticalResolution:number}|undefined){
 return Boolean(required&&Number.isSafeInteger(width)&&Number.isSafeInteger(height)&&width!>=required.horizontalResolution&&height!>=required.verticalResolution);
}
