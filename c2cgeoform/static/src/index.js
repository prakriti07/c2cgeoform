import Feature from 'ol/Feature'
import GeoJSONFormat from 'ol/format/GeoJSON'
import Map from 'ol/Map'
import VectorSource from 'ol/source/Vector'
import View from 'ol/View'
import { defaults } from 'ol/interaction'
import proj4 from 'proj4'
import { register } from 'ol/proj/proj4'
import { addControls, addGeolocation } from './controls'
import { addInteractions } from './interactions'
import { createBaseLayer, createVectorLayer } from './layers.js'
import { getStyleFunction } from './styles'

const format = new GeoJSONFormat()
const widgets = []
let itemIcon

export function initMap(target, options) {
  const source = new VectorSource()
  let vectorLayer = createVectorLayer(source)
  const context = { feature: null }
  vectorLayer.setStyle(getStyleFunction({ opacity: 0.5, context }))

  let map = new Map({
    layers: options.baselayers
      .map(def => createBaseLayer(def))
      .concat([vectorLayer]),
    target,
    view: new View(options.view || {}),
  })
  if (options.view.extent) {
    map.getView().fit(extent)
  }

  if (options.url)
    fetch(options.url)
      .then(resp => resp.json())
      .then(json => format.readFeatures(json))
      .then(features => {
        source.addFeatures(features)
        if (options.fit_source) {
          map.getView().fit(source.getExtent())
        }
        if (options.onFeaturesLoaded) {
          options.onFeaturesLoaded(features)
        }
      })

  // Change feature style on Hover
  map.on('pointermove', e => {
    if (e.dragging) return
    let feature
    map.forEachFeatureAtPixel(e.pixel, f => (feature = f), { hitTolerance: 3 })
    map.getTargetElement().classList.toggle('hovering', !!feature)
    context.feature = feature
    vectorLayer.changed()
  })

  // On feature click redirect to url in feature property
  map.on('click', e =>
    map.forEachFeatureAtPixel(
      e.pixel,
      f => (window.location.href = f.getProperties()['url'])
    )
  )
  addGeolocation(map)
  return map
}

export function initMapWidget(oid, options, defs) {
  if (checkInitialized(oid)) return
  const geometry = options.geojson ? format.readGeometry(options.geojson) : null
  const target = document.querySelector(`#map_${oid}`)
  const input = document.querySelector(`#${oid}`)
  const type = defs.point ? 'Point' : defs.line ? 'Line' : 'Polygon'
  const multi = defs.isMultiGeometry

  const source = new VectorSource()
  const layer = createVectorLayer(source)
  const map = new Map({
    layers: options.baselayers.map(def => createBaseLayer(def)).concat([layer]),
    target,
    view: new View(options.view || {}),
    interactions: defaults({ onFocusOnly: options.onFocusOnly }),
  })

  if (options.onFocusOnly) map.getTargetElement().setAttribute('tabindex', '0')

  // Existing geometry
  if (geometry) {
    source.addFeature(new Feature({ geometry }))
    map.getView().fit(geometry, {
      maxZoom: options.fit_max_zoom || 18,
      padding: [20, 20, 20, 20],
    })
  } else {
    if (options.view.extent) {
      map.getView().fit(extent)
    }
  }
  if (!defs.readonly) {
    const interactions = addInteractions({ map, source, type, input, multi })
    addControls({
      target,
      interactions,
      i18n: {
        draw: defs[`draw${type}Tooltip`],
        edit: defs.modifyTooltip,
        clear: defs.clearTooltip,
      },
      source,
    })
  }
  // Force style to specific Icon
  if (itemIcon) layer.setStyle(getStyleFunction({ icon: itemIcon }))

  addGeolocation(map)
}

export function checkInitialized(oid) {
  const initialized = widgets.includes(oid)
  widgets.push(oid)
  return initialized
}

export function registerProjection(epsg, def) {
  proj4.defs(epsg, def)
  register(proj4)
}

export function setItemIcon(url) {
  itemIcon = url
}
