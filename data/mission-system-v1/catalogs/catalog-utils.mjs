export const CATALOG_VERSION='1.0.0-isolated';
export const freezeCatalog=(id,schema,entries)=>Object.freeze({id,version:CATALOG_VERSION,schema:Object.freeze(schema),entries:Object.freeze(entries.map(Object.freeze))});

