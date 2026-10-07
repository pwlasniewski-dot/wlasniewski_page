import { prodigiMinimumResolutionRatio } from './prodigi-image-size';
import type { ProdigiProductConfig } from './prodigi-catalog';

/** Public physical characteristics only; never supplier credentials or order configuration. */
export type ProdigiPreviewModel = {
 kind: 'paper' | 'canvas'; width: number; height: number; minimumResolutionRatio?: number;
 physicalWidthMm: number; physicalHeightMm: number;
 depthMm?: number; edgeColor?: 'black' | 'white'; wrap?: 'black' | 'white' | 'image' | 'mirror';
};
export function prodigiPreviewModel(spec: ProdigiProductConfig): ProdigiPreviewModel | undefined {
 const match=/^GLOBAL-(FAP|CAN)-(\d+)X(\d+)$/.exec(spec.sku);
 const size=spec.variant.printAreaSizes.default;
 if(!match || !size)return;
 const kind=match[1]==='CAN'?'canvas':'paper';
 const model:ProdigiPreviewModel={kind,minimumResolutionRatio:prodigiMinimumResolutionRatio(spec.sku),width:size.horizontalResolution,height:size.verticalResolution,physicalWidthMm:Number(match[2])*25.4,physicalHeightMm:Number(match[3])*25.4};
 if(kind==='canvas'){
  const edge=/^(19|38)mm$/.exec(spec.variant.attributes.edge || '');
  if(edge)model.depthMm=Number(edge[1]);
  const wrap=spec.variant.attributes.wrap?.toLowerCase();
  if(wrap==='black'||wrap==='white'){model.wrap=wrap;model.edgeColor=wrap;}
  else if(wrap==='image'||wrap==='image wrap')model.wrap='image';
  else if(wrap==='mirror'||wrap==='mirror wrap')model.wrap='mirror';
 }
 return model;
}
