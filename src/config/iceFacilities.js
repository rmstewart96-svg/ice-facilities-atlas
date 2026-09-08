export const ICE_FACILITY_CATEGORIES = [
  '287(g)',
  'Detention',
  'Processing & Enforcement',
  'Air Operations',
  'Legal',
  'Investigations & Oversight',
  'Administration & Specialized'
]

export function getIceFacilityCategory(feature) {
  const fn = feature.properties?.function || ''

  if (fn === '287(g) Program') {
    return '287(g)'
  }

  if (
    fn === 'Detention' ||
    fn === 'Detention Health Care'
  ) {
    return 'Detention'
  }

  if (
    fn === 'Immigration Processing/Transfer' ||
    fn === 'Immigration Enforcement/Removal Operations'
  ) {
    return 'Processing & Enforcement'
  }

  if (fn === 'Air Transportation') {
    return 'Air Operations'
  }

  if (
    fn === 'Legal Services' ||
    fn === 'Legal Services/Agency General Counsel'
  ) {
    return 'Legal'
  }

  if (
    fn === 'Internal Investigations' ||
    fn === 'Cybercrime Investigative Support' ||
    fn === 'Intellectual Property Enforcement Coordination' ||
    fn === 'Financial Crime Investigative Support' ||
    fn === 'Human Rights / War Crimes Investigations' ||
    fn === 'Forensic Laboratory Services' ||
    fn === 'Immigration Status / Law Enforcement Support' ||
    fn === 'Enforcement Targeting / Lead Generation' ||
    fn === 'Criminal Analysis / Targeting' ||
    fn === 'Internal Oversight/Investigations/Inspections/Security'
  ) {
    return 'Investigations & Oversight'
  }

  return 'Administration & Specialized'
}
