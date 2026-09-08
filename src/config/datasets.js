export const DATASETS = {
  iceFacilities: {
    id: 'ice-facilities',
    name: 'ICE Facilities',
    shortName: 'ICE',
    agency: 'ICE',
    objectClass: 'location',
    geometryType: 'Point',
    dataUrl: '/ice_facilities.geojson',
    recordIdField: 'facility_id',
    routeType: 'facility',
    enabled: true
  }
}

export const DEFAULT_DATASET_ID = 'ice-facilities'

export function getDatasetById(datasetId) {
  return Object.values(DATASETS).find(
    (dataset) => dataset.id === datasetId
  )
}
