/** Both deployed names refer only to the domain-restricted public Geowidget token. */
export function inpostWidgetToken() {
 const legacyName = ['NEXT','PUBLIC','INPOST','GEOWIDGET','TOKEN'].join('_');
 return process.env.INPOST_GEOWIDGET_TOKEN?.trim() || process.env[legacyName]?.trim() || null;
}
