import { useEffect, useMemo, useRef, useState } from 'react'
import * as maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import './App.css'
import { DEFAULT_DATASET_ID, getDatasetById } from './config/datasets.js'

function App() {
  const mapContainer = useRef(null)
  const mapRef = useRef(null)
  const popupRef = useRef(null)
  const dataRef = useRef(null)
  const [activeDatasetId, setActiveDatasetId] = useState(DEFAULT_DATASET_ID)

  const activeDataset = getDatasetById(activeDatasetId)

  const [data, setData] = useState(null)

  const [search, setSearch] = useState('')

  const [categoryFilter, setCategoryFilter] = useState('All')
    const [subcomponentFilter, setSubcomponentFilter] = useState('All')
const [statusFilter, setStatusFilter] = useState('All')
  const [componentFilter, setComponentFilter] = useState('All')
  const [selectedFacility, setSelectedFacility] = useState(null)
  const [selectedLocationRecords, setSelectedLocationRecords] = useState([])
  const [detailView, setDetailView] = useState(null)

  useEffect(() => {
    async function loadData() {

      if (!activeDataset) return

      const response = await fetch(activeDataset.dataUrl)
      const geojson = await response.json()

      dataRef.current = geojson
      setData(geojson)
    }

    loadData()

  }, [activeDatasetId])

  useEffect(() => {
    if (!data) return

    const match = window.location.pathname.match(
      /^\/facility\/([^/]+)\/?$/
    )

    if (!match) return

    const facilityId = decodeURIComponent(match[1])

    const feature = data.features.find(
      (candidate) =>
        candidate.properties?.facility_id === facilityId
    )

    if (!feature) return

    setSelectedFacility(feature)
    setSelectedLocationRecords([])
    setDetailView('facility')

    const map = mapRef.current

    if (map) {
      map.flyTo({
        center: feature.geometry.coordinates,
        zoom: 14,
        essential: true
      })
    }
  }, [data])

  useEffect(() => {
    if (!data) return

    function handlePopState() {
      const match = window.location.pathname.match(
        /^\/facility\/([^/]+)\/?$/
      )

      if (!match) {
        setSelectedFacility(null)
        setSelectedLocationRecords([])
        setDetailView(null)

        if (popupRef.current) {
          popupRef.current.remove()
          popupRef.current = null
        }

        return
      }

      const facilityId = decodeURIComponent(match[1])

      const feature = data.features.find(
        (candidate) =>
          candidate.properties?.facility_id === facilityId
      )

      if (!feature) return

      setSelectedFacility(feature)
      setSelectedLocationRecords([])
      setDetailView('facility')

      const map = mapRef.current

      if (map) {
        map.flyTo({
          center: feature.geometry.coordinates,
          zoom: 14,
          essential: true
        })
      }

      if (popupRef.current) {
        popupRef.current.remove()
        popupRef.current = null
      }
    }

    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [data])

  const filteredFeatures = useMemo(() => {
    if (!data) return []

    const query = search.trim().toLowerCase()

    return data.features.filter((feature) => {
      const p = feature.properties || {}

      const matchesSearch =
        !query ||
        [
          p.name,
          p.alternate_name,
          p.city,
          p.county,
          p.state,
          p.address,
          p.function,
          p.component,
          p.subcomponent
        ]
          .filter(Boolean)
          .some((value) =>
            String(value).toLowerCase().includes(query)
          )

      const matchesCategory =
        categoryFilter === 'All' ||
        getMapCategory(feature) === categoryFilter
      const matchesSubcomponent =
        subcomponentFilter === 'All' ||
        p.subcomponent === subcomponentFilter



      const matchesStatus =
        statusFilter === 'All' || p.status === statusFilter

      const matchesComponent =
        componentFilter === 'All' || p.component === componentFilter

      return (
        matchesSearch &&
        matchesCategory &&
        matchesSubcomponent &&
        matchesStatus &&
        matchesComponent
      )
    })
  }, [
    data,
    search,
    categoryFilter,
    subcomponentFilter,
    statusFilter,
    componentFilter
  ])

  const filteredFeaturesRef = useRef([])

  useEffect(() => {
    filteredFeaturesRef.current = filteredFeatures
  }, [filteredFeatures, categoryFilter])

  useEffect(() => {
    const map = mapRef.current

    if (!map || !map.getLayer('selected-point')) return

    const facilityId =
      selectedFacility?.properties?.facility_id || ''

    map.setFilter(
      'selected-point',
      ['==', ['get', 'facility_id'], facilityId]
    )
  }, [selectedFacility])

  useEffect(() => {
    const facilityId =
      selectedFacility?.properties?.facility_id

    if (!facilityId) return

    const resultCard = document.getElementById(
      `result-${facilityId}`
    )

    if (!resultCard) return

    resultCard.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest'
    })
  }, [selectedFacility])

  const categoryOptions = [
    '287(g)',
    'Detention',
    'Processing & Enforcement',
    'Air Operations',
    'Legal',
    'Investigations & Oversight',
    'Administration & Specialized'
  ]

  const subcomponentOptions = useMemo(() => {
    if (!data || categoryFilter === 'All') return []

    return [...new Set(
      data.features
        .filter(
          (feature) =>
            getMapCategory(feature) === categoryFilter
        )
        .map((feature) => feature.properties?.subcomponent)
        .filter(Boolean)
    )].sort()
  }, [data, categoryFilter])

  useEffect(() => {
    setSubcomponentFilter('All')
  }, [categoryFilter])

  const statusOptions = useMemo(() => {
    if (!data) return []

    return [...new Set(
      data.features
        .map((f) => f.properties?.status)
        .filter(Boolean)
    )].sort()
  }, [data])

  const componentOptions = useMemo(() => {
    if (!data) return []

    return [...new Set(
      data.features
        .map((f) => f.properties?.component)
        .filter(Boolean)
    )].sort()
  }, [data])

  function getMapCategory(feature) {
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

  function coordinateKey(feature) {
    const [lon, lat] = feature.geometry.coordinates
    return `${lon},${lat}`
  }

  function getRecordsAtLocation(feature) {
    const facilityId = feature.properties?.facility_id

    const originalFeature =
      filteredFeaturesRef.current.find(
        (candidate) =>
          candidate.properties?.facility_id === facilityId
      ) || feature

    const key = coordinateKey(originalFeature)

    return filteredFeaturesRef.current.filter(
      (candidate) => coordinateKey(candidate) === key
    )
  }

  function formatLocation(props) {
    return [props.city, props.state]
      .filter(Boolean)
      .join(', ')
  }

  function formatAddress(props) {
    return [
      props.address,
      props.city,
      props.state,
      props.zip
    ]
      .filter(Boolean)
      .join(', ')
  }

  function singleRecordHTML(feature) {
    const props = feature.properties || {}

    return `
      <div class="facility-popup">
        <h3>${props.name || 'Unnamed Facility'}</h3>
        <p><strong>Function:</strong> ${props.function || 'Not listed'}</p>
        <p><strong>Component:</strong> ${props.component || 'Not listed'}</p>
        <p><strong>Status:</strong> ${props.status || 'Not listed'}</p>
        <p><strong>Location:</strong> ${formatAddress(props) || 'Not listed'}</p>
        <p><strong>Facility ID:</strong> ${props.facility_id || 'Not listed'}</p>
      </div>
    `
  }

  function groupedRecordsHTML(features) {
    const firstProps = features[0]?.properties || {}
    const location = formatLocation(firstProps) || 'Shared location'

    const records = features
      .map((feature) => {
        const props = feature.properties || {}

        return `
          <div class="shared-record">
            <div class="shared-record-name">
              ${props.name || 'Unnamed Facility'}
            </div>

            <div class="shared-record-meta">
              ${props.function || 'Unclassified'}
              ${props.component ? ` · ${props.component}` : ''}
            </div>

            <div class="shared-record-id">
              ${props.facility_id || ''}
            </div>
          </div>
        `
      })
      .join('')

    return `
      <div class="facility-popup shared-location-popup">
        <h3>${location}</h3>

        <div class="shared-location-count">
          ${features.length} records at this location
        </div>

        <div class="shared-record-list">
          ${records}
        </div>
      </div>
    `
  }

  function openLocationPopup(feature) {
    const map = mapRef.current
    if (!map) return

    const coordinates = feature.geometry.coordinates
    const records = getRecordsAtLocation(feature)

    if (records.length > 1) {
      setSelectedLocationRecords(records)
      setSelectedFacility(null)
      setDetailView('location')
    } else {
      setSelectedLocationRecords([])
      setSelectedFacility(records[0] || feature)
      setDetailView('facility')
    }

    if (popupRef.current) {
      popupRef.current.remove()
    }

    const html =
      records.length > 1
        ? groupedRecordsHTML(records)
        : singleRecordHTML(feature)

    popupRef.current = new maplibregl.Popup({
      closeButton: true,
      closeOnClick: true,
      maxWidth: '380px'
    })
      .setLngLat(coordinates)
      .setHTML(html)
      .addTo(map)
  }

  function selectFacility(feature) {
    const map = mapRef.current
    if (!map) return

    map.flyTo({
      center: feature.geometry.coordinates,
      zoom: 14,
      essential: true
    })

    setSelectedFacility(feature)
    setSelectedLocationRecords([])
    setDetailView('facility')

    const facilityId = feature.properties?.facility_id

    if (facilityId) {
      window.history.pushState(
        { facilityId },
        '',
        `/facility/${facilityId}`
      )
    }

    if (popupRef.current) {
      popupRef.current.remove()
      popupRef.current = null
    }
  }

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: 'raster',
            tiles: [
              'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
            ],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors'
          }
        },
        layers: [
          {
            id: 'osm',
            type: 'raster',
            source: 'osm'
          }
        ]
      },
      center: [-98.5, 39.5],
      zoom: 3
    })

    map.addControl(new maplibregl.NavigationControl(), 'top-right')

    map.on('load', () => {
      map.addSource('facilities', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: []
        },
        cluster: true,
        clusterMaxZoom: 12,
        clusterRadius: 50
      })

      map.addSource('facilities-unclustered', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: []
        }
      })

      map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'facilities',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': '#334155',
          'circle-radius': [
            'step',
            ['get', 'point_count'],
            18,
            25,
            24,
            100,
            30
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff'
        }
      })

      map.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'facilities',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': ['get', 'point_count_abbreviated'],
          'text-size': 13
        },
        paint: {
          'text-color': '#ffffff'
        }
      })

      map.addLayer({
        id: 'facility-points',
        type: 'circle',
        source: 'facilities',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-radius': 6,
          'circle-color': [
            'match',
            ['get', 'map_category'],
            '287(g)', '#2563eb',
            'Detention', '#dc2626',
            'Processing & Enforcement', '#f59e0b',
            'Air Operations', '#7c3aed',
            'Legal', '#0891b2',
            'Investigations & Oversight', '#059669',
            'Administration & Specialized', '#64748b',
            '#64748b'
          ],
          'circle-stroke-width': 1.5,
          'circle-stroke-color': '#ffffff'
        }
      })

      map.addLayer({
        id: 'category-points',
        type: 'circle',
        source: 'facilities-unclustered',
        layout: {
          visibility: 'none'
        },
        paint: {
          'circle-radius': 6,
          'circle-color': [
            'match',
            ['get', 'map_category'],
            '287(g)', '#2563eb',
            'Detention', '#dc2626',
            'Processing & Enforcement', '#f59e0b',
            'Air Operations', '#7c3aed',
            'Legal', '#0891b2',
            'Investigations & Oversight', '#059669',
            'Administration & Specialized', '#64748b',
            '#64748b'
          ],
          'circle-stroke-width': 1.5,
          'circle-stroke-color': '#ffffff'
        }
      })

      map.addLayer({
        id: 'selected-point',
        type: 'circle',
        source: 'facilities-unclustered',
        filter: ['==', ['get', 'facility_id'], ''],
        paint: {
          'circle-radius': 10,
          'circle-color': 'rgba(0, 0, 0, 0)',
          'circle-stroke-width': 3,
          'circle-stroke-color': '#172033'
        }
      })

      map.on('click', 'category-points', (e) => {
        if (!e.features?.length) return
        openLocationPopup(e.features[0])
      })

      map.on('mouseenter', 'category-points', () => {
        map.getCanvas().style.cursor = 'pointer'
      })

      map.on('mouseleave', 'category-points', () => {
        map.getCanvas().style.cursor = ''
      })

      map.on('click', 'clusters', async (e) => {
        const features = map.queryRenderedFeatures(e.point, {
          layers: ['clusters']
        })

        if (!features.length) return

        const cluster = features[0]
        const clusterId = cluster.properties.cluster_id
        const source = map.getSource('facilities')

        const leaves = await source.getClusterLeaves(
          clusterId,
          cluster.properties.point_count,
          0
        )

        const firstCoordinates = leaves[0]?.geometry?.coordinates

        const allSameLocation =
          firstCoordinates &&
          leaves.every((feature) => {
            const coordinates = feature.geometry.coordinates

            return (
              coordinates[0] === firstCoordinates[0] &&
              coordinates[1] === firstCoordinates[1]
            )
          })

        if (allSameLocation) {
          map.easeTo({
            center: firstCoordinates,
            zoom: Math.max(map.getZoom(), 12)
          })

          openLocationPopup(leaves[0])
          return
        }

        const zoom = await source.getClusterExpansionZoom(clusterId)

        map.easeTo({
          center: cluster.geometry.coordinates,
          zoom
        })
      })

      map.on('click', 'facility-points', (e) => {
        if (!e.features?.length) return
        openLocationPopup(e.features[0])
      })

      ;['clusters', 'facility-points'].forEach((layerId) => {
        map.on('mouseenter', layerId, () => {
          map.getCanvas().style.cursor = 'pointer'
        })

        map.on('mouseleave', layerId, () => {
          map.getCanvas().style.cursor = ''
        })
      })
    })

    mapRef.current = map

    return () => {
      if (popupRef.current) {
        popupRef.current.remove()
      }

      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    function updateSource() {
      const clusteredSource = map.getSource('facilities')
      const unclusteredSource = map.getSource('facilities-unclustered')

      if (!clusteredSource || !unclusteredSource) return

      const featureCollection = {
        type: 'FeatureCollection',
        features: filteredFeatures.map((feature) => ({
          ...feature,
          properties: {
            ...feature.properties,
            map_category: getMapCategory(feature)
          }
        }))
      }

      clusteredSource.setData(featureCollection)
      unclusteredSource.setData(featureCollection)

      const showingAllCategories = categoryFilter === 'All'

      map.setLayoutProperty(
        'clusters',
        'visibility',
        showingAllCategories ? 'visible' : 'none'
      )

      map.setLayoutProperty(
        'cluster-count',
        'visibility',
        showingAllCategories ? 'visible' : 'none'
      )

      map.setLayoutProperty(
        'facility-points',
        'visibility',
        showingAllCategories ? 'visible' : 'none'
      )

      map.setLayoutProperty(
        'category-points',
        'visibility',
        showingAllCategories ? 'none' : 'visible'
      )
    }

    if (map.isStyleLoaded()) {
      updateSource()
    } else {
      map.once('load', updateSource)
    }
  }, [filteredFeatures])

  const visibleResults = filteredFeatures.slice(0, 100)

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1>ICE Facilities Atlas</h1>
          <p>
            Explore ICE facilities, offices, detention sites,
            and related infrastructure.
          </p>
        </div>

        <div className="filter-group">
          <label htmlFor="search">Search</label>
          <input
            id="search"
            type="text"
            placeholder="Facility, city, county, state..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <label htmlFor="category-filter">Category</label>
          <select
            id="category-filter"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="All">All categories</option>
            {categoryOptions.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>

        {categoryFilter !== 'All' && (
          <div className="filter-group">
            <label htmlFor="subcomponent-filter">Subcomponent</label>
            <select
              id="subcomponent-filter"
              value={subcomponentFilter}
              onChange={(e) =>
                setSubcomponentFilter(e.target.value)
              }
            >
              <option value="All">All subcomponents</option>
              {subcomponentOptions.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
        )}



        <div className="filter-group">
          <label htmlFor="status-filter">Status</label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All statuses</option>
            {statusOptions.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>

        <details className="advanced-filters">
          <summary>Advanced filters</summary>

          <div className="advanced-filter-content">
            <div className="filter-group">
              <label htmlFor="component-filter">Component</label>
              <select
                id="component-filter"
                value={componentFilter}
                onChange={(e) => setComponentFilter(e.target.value)}
              >
                <option value="All">All components</option>
                {componentOptions.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </details>

        <div className="results-toolbar">
          <span>
            <strong>{filteredFeatures.length.toLocaleString()}</strong>{' '}
            facilities
          </span>

          <button
            className="reset-link"
            onClick={() => {
              setSearch('')
              setCategoryFilter('All')
              setSubcomponentFilter('All')
              setComponentFilter('All')
              setStatusFilter('All')
            }}
          >
            Reset
          </button>
        </div>

        <div className="results-list">
          {visibleResults.map((feature) => {
            const p = feature.properties || {}

            return (
              <button
                key={p.facility_id}
                id={`result-${p.facility_id}`}
                className={`result-card ${
                  selectedFacility?.properties?.facility_id === p.facility_id
                    ? 'result-card-selected'
                    : ''
                }`}
                onClick={() => selectFacility(feature)}
              >
                <div className="result-name">
                  {p.name || 'Unnamed Facility'}
                </div>

                <div className="result-location">
                  {[p.city, p.state].filter(Boolean).join(', ')}
                </div>

                <div className="result-meta">
                  {p.function || 'Unclassified'}
                  {p.component ? ` · ${p.component}` : ''}
                </div>
              </button>
            )
          })}

          {filteredFeatures.length > 100 && (
            <div className="results-limit">
              Showing the first 100 of{' '}
              {filteredFeatures.length.toLocaleString()} results.
              Refine your search or filters to narrow the list.
            </div>
          )}

          {filteredFeatures.length === 0 && (
            <div className="no-results">
              No facilities match these filters.
            </div>
          )}
        </div>
      </aside>

      <main className="map-panel">
        <div ref={mapContainer} className="map-container" />

        <div className="map-legend">
          <div className="legend-title">Facility category</div>

          <button
            type="button"
            className={`legend-item ${categoryFilter === '287(g)' ? 'legend-item-active' : ''}`}
            onClick={() =>
              setCategoryFilter(
                categoryFilter === '287(g)' ? 'All' : '287(g)'
              )
            }
          >
            <span className="legend-swatch legend-287g"></span>
            <span>287(g)</span>
          </button>

          <button
            type="button"
            className={`legend-item ${categoryFilter === 'Detention' ? 'legend-item-active' : ''}`}
            onClick={() =>
              setCategoryFilter(
                categoryFilter === 'Detention' ? 'All' : 'Detention'
              )
            }
          >
            <span className="legend-swatch legend-detention"></span>
            <span>Detention</span>
          </button>

          <button
            type="button"
            className={`legend-item ${categoryFilter === 'Processing & Enforcement' ? 'legend-item-active' : ''}`}
            onClick={() =>
              setCategoryFilter(
                categoryFilter === 'Processing & Enforcement'
                  ? 'All'
                  : 'Processing & Enforcement'
              )
            }
          >
            <span className="legend-swatch legend-processing"></span>
            <span>Processing &amp; Enforcement</span>
          </button>

          <button
            type="button"
            className={`legend-item ${categoryFilter === 'Air Operations' ? 'legend-item-active' : ''}`}
            onClick={() =>
              setCategoryFilter(
                categoryFilter === 'Air Operations'
                  ? 'All'
                  : 'Air Operations'
              )
            }
          >
            <span className="legend-swatch legend-air"></span>
            <span>Air Operations</span>
          </button>

          <button
            type="button"
            className={`legend-item ${categoryFilter === 'Legal' ? 'legend-item-active' : ''}`}
            onClick={() =>
              setCategoryFilter(
                categoryFilter === 'Legal' ? 'All' : 'Legal'
              )
            }
          >
            <span className="legend-swatch legend-legal"></span>
            <span>Legal</span>
          </button>

          <button
            type="button"
            className={`legend-item ${categoryFilter === 'Investigations & Oversight' ? 'legend-item-active' : ''}`}
            onClick={() =>
              setCategoryFilter(
                categoryFilter === 'Investigations & Oversight'
                  ? 'All'
                  : 'Investigations & Oversight'
              )
            }
          >
            <span className="legend-swatch legend-investigations"></span>
            <span>Investigations &amp; Oversight</span>
          </button>

          <button
            type="button"
            className={`legend-item ${categoryFilter === 'Administration & Specialized' ? 'legend-item-active' : ''}`}
            onClick={() =>
              setCategoryFilter(
                categoryFilter === 'Administration & Specialized'
                  ? 'All'
                  : 'Administration & Specialized'
              )
            }
          >
            <span className="legend-swatch legend-admin"></span>
            <span>Administration &amp; Specialized</span>
          </button>
        </div>
      </main>

      {detailView && (
        <aside className="detail-panel">
          <button
            className="detail-close"
            onClick={() => {
              setDetailView(null)
              setSelectedFacility(null)
              setSelectedLocationRecords([])

              if (window.location.pathname.startsWith('/facility/')) {
                window.history.pushState({}, '', '/')
              }

              if (popupRef.current) {
                popupRef.current.remove()
                popupRef.current = null
              }
            }}
            aria-label="Close details"
          >
            ×
          </button>

          {detailView === 'facility' && selectedFacility && (() => {
            const p = selectedFacility.properties || {}

            const fullAddress = [
              p.address,
              p.city,
              p.state,
              p.zip
            ]
              .filter(Boolean)
              .join(', ')

            const Field = ({ label, value }) => {
              if (
                value === null ||
                value === undefined ||
                String(value).trim() === ''
              ) {
                return null
              }

              return (
                <div>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              )
            }

            return (
              <div className="detail-content">
                <div className="detail-kicker">
                  Facility record
                </div>

                <h2>{p.name || 'Unnamed Facility'}</h2>

                {p.alternate_name && (
                  <div className="detail-alternate-name">
                    {p.alternate_name}
                  </div>
                )}

                <div className="detail-location">
                  {[p.city, p.state]
                    .filter(Boolean)
                    .join(', ')}
                </div>

                {p.status && (
                  <div className="detail-status">
                    {p.status}
                  </div>
                )}

                <section className="detail-section">
                  <h3>Classification</h3>

                  <dl className="detail-fields">
                    <Field label="Facility ID" value={p.facility_id} />
                    <Field label="Site ID" value={p.site_id} />
                    <Field label="Agency" value={p.agency} />
                    <Field label="Component" value={p.component} />
                    <Field label="Subcomponent" value={p.subcomponent} />
                    <Field label="Function" value={p.function} />
                  </dl>
                </section>

                {(p.detention_type ||
                  p.population_served ||
                  p.parent_facility) && (
                  <section className="detail-section">
                    <h3>Facility characteristics</h3>

                    <dl className="detail-fields">
                      <Field
                        label="Detention type"
                        value={p.detention_type}
                      />
                      <Field
                        label="Population served"
                        value={p.population_served}
                      />
                      <Field
                        label="Parent facility"
                        value={p.parent_facility}
                      />
                    </dl>
                  </section>
                )}

                <section className="detail-section">
                  <h3>Location</h3>

                  <dl className="detail-fields">
                    <Field
                      label="Address"
                      value={fullAddress}
                    />
                    <Field label="County" value={p.county} />
                    <Field label="ICE AOR" value={p.ice_aor} />
                    <Field
                      label="Location precision"
                      value={p.location_precision}
                    />
                  </dl>
                </section>

                {(p.operator ||
                  p.owner ||
                  p.jurisdiction ||
                  p.opened) && (
                  <section className="detail-section">
                    <h3>Operations</h3>

                    <dl className="detail-fields">
                      <Field label="Operator" value={p.operator} />
                      <Field label="Owner" value={p.owner} />
                      <Field
                        label="Jurisdiction"
                        value={p.jurisdiction}
                      />
                      <Field label="Opened" value={p.opened} />
                    </dl>
                  </section>
                )}

                {p.last_verified && (
                  <section className="detail-section">
                    <h3>Documentation</h3>

                    <dl className="detail-fields">
                      <Field
                        label="Last verified"
                        value={p.last_verified}
                      />
                    </dl>
                  </section>
                )}
              </div>
            )
          })()}

          {detailView === 'location' && selectedLocationRecords.length > 0 && (
            <div className="detail-content">
              <div className="detail-kicker">
                Shared location
              </div>

              <h2>
                {[
                  selectedLocationRecords[0]?.properties?.city,
                  selectedLocationRecords[0]?.properties?.state
                ]
                  .filter(Boolean)
                  .join(', ') || 'Shared location'}
              </h2>

              <div className="detail-location-count">
                {selectedLocationRecords.length} records at this location
              </div>

              <div className="location-record-list">
                {selectedLocationRecords.map((feature) => {
                  const p = feature.properties || {}

                  return (
                    <button
                      key={p.facility_id}
                      className="location-record-card"
                      onClick={() => {
                        setSelectedFacility(feature)
                        setDetailView('facility')
                      }}
                    >
                      <div className="location-record-name">
                        {p.name || 'Unnamed Facility'}
                      </div>

                      <div className="location-record-meta">
                        {p.function || 'Unclassified'}
                        {p.component ? ` · ${p.component}` : ''}
                      </div>

                      <div className="location-record-id">
                        {p.facility_id || ''}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </aside>
      )}
    </div>
  )
}

export default App
