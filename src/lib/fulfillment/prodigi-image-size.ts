/** Local shop quality policy for qualified single-photo Fine Art / canvas only.
 * Prodigi's printAreaSizes are recommendations, not supplier minimums. */
export function prodigiMinimumResolutionRatio(sku: string | undefined): number {
 return sku && /^GLOBAL-(?:FAP|CAN)-[1-9]\d{0,3}X[1-9]\d{0,3}$/.test(sku) ? 2 / 3 : 1;
}
export type ProdigiPrintQuality = {
 status: 'recommended' | 'acceptable' | 'blocked'; rotated: boolean;
 recommendedWidth: number; recommendedHeight: number;
 minimumWidth: number; minimumHeight: number; sourceMinimumWidth: number; sourceMinimumHeight: number; resolutionRatio: number;
};
/** Same whole-image fit used by fitPrintArea. Rotate the FIELD to match the
 * supplier's best-fit rotation; the photograph stays upright in the preview.
 * Only the limiting image extent must reach the field size when using contain. */
export function prodigiPrintQuality(width:number|null|undefined,height:number|null|undefined,required:{horizontalResolution:number;verticalResolution:number}|undefined,minimumRatio=1):ProdigiPrintQuality {
 const valid=!!required && Number.isSafeInteger(required.horizontalResolution) && required.horizontalResolution>0 && Number.isSafeInteger(required.verticalResolution) && required.verticalResolution>0 && Number.isSafeInteger(width) && width!>0 && Number.isSafeInteger(height) && height!>0;
 const rotated=valid && ((width!>height! && required!.horizontalResolution<required!.verticalResolution) || (width!<height! && required!.horizontalResolution>required!.verticalResolution));
 const recommendedWidth=rotated ? required!.verticalResolution : required?.horizontalResolution || 0;
 const recommendedHeight=rotated ? required!.horizontalResolution : required?.verticalResolution || 0;
 const floor=Number.isFinite(minimumRatio) && minimumRatio>=2/3 && minimumRatio<=1 ? minimumRatio : 1;
 const minimumWidth=Math.ceil(recommendedWidth*floor),minimumHeight=Math.ceil(recommendedHeight*floor);
 const resolutionRatio=valid ? Math.max(width!/recommendedWidth,height!/recommendedHeight) : 0;
 const sufficient=valid && (width!>=minimumWidth || height!>=minimumHeight);
 const sourceScale=resolutionRatio>0 ? floor/resolutionRatio : 0;
 const sourceMinimumWidth=valid ? Math.ceil(width!*sourceScale) : minimumWidth,sourceMinimumHeight=valid ? Math.ceil(height!*sourceScale) : minimumHeight;
 return {sourceMinimumWidth,sourceMinimumHeight,status:!sufficient ? 'blocked' : resolutionRatio>=1 ? 'recommended' : 'acceptable',rotated,recommendedWidth,recommendedHeight,minimumWidth,minimumHeight,resolutionRatio};
}
export function hasProdigiPrintResolution(width:number|null|undefined,height:number|null|undefined,required:{horizontalResolution:number;verticalResolution:number}|undefined,minimumRatio=1){
 return prodigiPrintQuality(width,height,required,minimumRatio).status!=='blocked';
}
