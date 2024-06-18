import {
  GeolocateControl,
  Map,
  MapRef,
  Marker,
  NavigationControl,
  Popup,
} from "react-map-gl"
import { app, translate } from "../app"
import mapboxgl, { RasterLayer, Style } from "mapbox-gl"
import supercluster, { ClusterFeature, PointFeature } from "supercluster"
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import GeocoderControl from "./geocoder-control"
import { Button, Popover, Typography } from "antd"
import { GetIconForChannel, getContactDetailLink } from "./service"
import { RightOutlined } from "@ant-design/icons"

const { Title, Text, Link } = Typography;

const getBoundsForFeatures = (services: Service[]) => {
  const bounds = new mapboxgl.LngLatBounds()

  services.forEach((service) => {
    if (service.location?.length > 1) {
      bounds.extend([+service.location[1], +service.location[0]])
    }
  })
  return bounds
}

const stripHtmlTags = (html: string): string => {
  const regex =
    /<[^>]*>|&[^ ]+ |<img\s+.*?>|<span\s+style="[^"]*">.*?<\/span>|&[A-Za-z]+ /g
  return html.replace(regex, "")
}

interface mapProps {
  services: Service[]
}

const MAP_STYLES: { [key: string]: Style | string } = {
  mapbox: 'mapbox://styles/mapbox/streets-v12',
  osm: {
    version: 8,
    sources: {
      'raster-tiles': {
        type: 'raster',
        tiles: [
          'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
          'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
          'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
        ],
        tileSize: 256,
      },
    },
    layers: [
      {
        id: 'osm-tiles',
        type: 'raster',
        source: 'raster-tiles',
        minzoom: 0,
        maxzoom: 19,
      } as RasterLayer,
    ],
  },
  satellite: 'mapbox://styles/mapbox/satellite-streets-v12',
  dark: 'mapbox://styles/mapbox/dark-v11',
};

class MapStyleControl implements mapboxgl.IControl {
  private container: HTMLDivElement;
  private setMapStyle: React.Dispatch<React.SetStateAction<Style | string>>;

  constructor(setMapStyle: React.Dispatch<React.SetStateAction<Style | string>>) {
    this.container = document.createElement('div');
    this.container.className = 'mapboxgl-ctrl mapboxgl-ctrl-group';
    this.setMapStyle = setMapStyle;
    this.createButtons();
  }

  private createButtons() {
    const styles = [
      { id: 'mapbox', label: 'Mapbox' },
      { id: 'osm', label: 'OSM' },
      { id: 'satellite', label: 'Satellite' },
      { id: 'dark', label: 'Dark' },
    ];

    styles.forEach((style) => {
      const button = document.createElement('button');
      button.className = 'm-2';
      button.textContent = style.label;
      button.onclick = () => this.setMapStyle(MAP_STYLES[style.id]);
      this.container.appendChild(button);
    });
  }

  onAdd(map: mapboxgl.Map) {
    return this.container;
  }

  onRemove() {
    this.container.parentNode?.removeChild(this.container);
  }
}

const MapStyleControlComponent = ({ setMapStyle, currentMapStyle }) => {
  const handleMapStyleChange = (style) => {
    setMapStyle(style);
  };

  const popoverContent = (
    <div>
      <Button onClick={() => handleMapStyleChange(MAP_STYLES.mapbox)}>Mapbox</Button>
      <Button onClick={() => handleMapStyleChange(MAP_STYLES.osm)}>OSM</Button>
      <Button onClick={() => handleMapStyleChange(MAP_STYLES.satellite)}>Satellite</Button>
      <Button onClick={() => handleMapStyleChange(MAP_STYLES.dark)}>Dark</Button>
    </div>
  );

  let style = ''
  if (typeof currentMapStyle === 'string') {
    style = currentMapStyle.includes('dark') ? 'Dark' : currentMapStyle.includes('satellite') ? 'Satellite' : 'Mapbox'
  } else {
    style = 'OSM'
  }

  return (
    <div className="absolute bottom-4 left-4">
      <Popover content={popoverContent} placement="right">
        <Button>{style}</Button>
      </Popover>
    </div>
  );
};

export function Maps({ services }: mapProps) {
  const categories = Object.values(app.data.categories.categories) || []
  type ClusterOrPoint =
    | ClusterFeature<supercluster.AnyProps>
    | PointFeature<supercluster.AnyProps>
  const [popupInfo, setPopupInfo] = useState<Service | null>(null)
  const [clusters, setClusters] = useState<ClusterOrPoint[]>([])
  const [isMapReady, setIsMapReady] = useState(false)
  const [mapStyle, setMapStyle] = useState<Style | string>(MAP_STYLES.mapbox)
  const mapRef = useRef<MapRef>(null)

  const bounds = useMemo(() => {
    return getBoundsForFeatures(services)
  }, [services])

  const customMarkerIcon = (category?: number) => {
    const categorySelected = categories.filter((x) => x.id === category)
    if (!categorySelected.length) {
      return (
        <i
          className={`rounded-full shadow border-4 border-black h-6 w-6 bg-white p-3 text-center text-2xl flex items-center`}
          style={{ color: "#FFFFFF" }}
        />
      )
    } else {
      return (
        <span
          className={`material-icons rounded-full shadow border-4 border-black h-6 w-6 bg-white p-3 text-center text-2xl flex items-center`}
          style={{ color: categorySelected[0]?.color }}
        >
          {categorySelected[0]?.icon}
        </span>
      )
    }
  }

  const cluster = useMemo(() => {
    const newCluster = new supercluster({
      radius: 40,
      maxZoom: 16,
    })
    newCluster.load(
      services
        ?.filter((x) => x?.location?.length > 1)
        .map((service) => ({
          type: "Feature",
          properties: {
            cluster: false,
            serviceId: service.id,
            category: service?.categories[0],
          },
          geometry: {
            type: "Point",
            coordinates: [+service.location[1], +service.location[0]],
          },
        }))
    )
    return newCluster
  }, [services])

  const updateClusters = useCallback(() => {
    const map = mapRef.current?.getMap()
    if (!map) return

    const bounds = map.getBounds()
    const bbox: [number, number, number, number] = [
      bounds.getWest(),
      bounds.getSouth(),
      bounds.getEast(),
      bounds.getNorth(),
    ]

    const newClusters = cluster.getClusters(bbox, Math.floor(map.getZoom()))
    setClusters(newClusters)
  }, [cluster, mapRef])

  const loadAndUpdateClusters = useCallback(() => {
    const features = services
      ?.filter((x) => x?.location?.length > 1)
      .map((service) => ({
        type: "Feature" as const,
        properties: {
          cluster: false,
          serviceId: service.id,
          category: service.categories[0],
        },
        geometry: {
          type: "Point" as const,
          coordinates: [+service.location[1], +service.location[0]],
        },
      }))

    cluster.load(features)
    updateClusters()
  }, [services, cluster, updateClusters])

  useEffect(() => {
    if (!isMapReady) {
      return
    }

    const map = mapRef.current?.getMap()

    const onMapLoad = () => {
      loadAndUpdateClusters()
      mapRef.current?.getMap().on("move", updateClusters)
    }

    if (map) {
      if (map.isStyleLoaded()) {
        onMapLoad()
      } else {
        map.on("load", onMapLoad)
      }
    }

    return () => {
      if (map) {
        map.off("load", onMapLoad)
        map.off("move", updateClusters)
      }
    }
  }, [isMapReady, loadAndUpdateClusters, updateClusters])

  useEffect(() => {
    const map = mapRef.current?.getMap()

    if (map && bounds) {
      map.once("load", () => {
        map.fitBounds(bounds, {
          padding: 20,
        })
      })
    }
  }, [bounds])

  const handleViewportChange = () => {
    updateClusters()
  }

  return (
    <div id="service-map" className="service-map">
      <div className="w-full h-[650px] md:h-[960px] bg-indigo-200 map-container rounded-2xl">
        <Map
          mapboxAccessToken="pk.eyJ1Ijoic2lnbnBvc3RnbG9iYWwiLCJhIjoiY2w1dmVwYnVxMDkxbjNjbW96NXkybHZyZCJ9.cYedHq58Ur6PKXkEnwYCzQ"
          mapStyle={mapStyle}
          maxZoom={20}
          minZoom={3}
          onMove={handleViewportChange}
          ref={mapRef}
          onLoad={() => {
            setIsMapReady(true)
          }}
          style={{ borderRadius: '1rem' }}
        >
          <GeocoderControl
            mapboxAccessToken="pk.eyJ1Ijoic2lnbnBvc3RnbG9iYWwiLCJhIjoiY2w1dmVwYnVxMDkxbjNjbW96NXkybHZyZCJ9.cYedHq58Ur6PKXkEnwYCzQ"
            position="top-left"
          />
          <GeolocateControl position="top-left" />
          <NavigationControl position="top-left" />
          <MapStyleControlComponent setMapStyle={setMapStyle} currentMapStyle={mapStyle} />
          {clusters.map((cluster: ClusterOrPoint) => {
            const [longitude, latitude] = cluster.geometry.coordinates
            const {
              cluster: isCluster,
              point_count_abbreviated: pointCountAbbreviated,
            } = cluster.properties

            if (isCluster) {
              return (
                <Marker
                  key={`cluster-${cluster.id}`}
                  longitude={longitude}
                  latitude={latitude}
                  onClick={() => {
                    const map = mapRef.current?.getMap()
                    const zoom = map?.getZoom()
                    map?.flyTo({
                      center: [longitude, latitude],
                      zoom: (zoom || 0) + 3,
                    })
                  }}
                >
                  <div
                    className="cluster-marker"
                    style={{
                      width: `40px`,
                      height: `40px`,
                    }}
                  >
                    {pointCountAbbreviated}
                  </div>
                </Marker>
              )
            } else {
              const service = services.find(
                (s) => s.id === cluster.properties.serviceId
              )
              if (!service) return null
              return (
                <Marker
                  key={`marker-${cluster.properties.serviceId}`}
                  longitude={longitude}
                  latitude={latitude}
                  onClick={(e) => {
                    e.originalEvent.stopPropagation()
                    setPopupInfo(service)
                  }}
                >
                  {customMarkerIcon(cluster.properties.category)}
                </Marker>
              )
            }
          })}
          {popupInfo && (
            <Popup
              longitude={+popupInfo.location[1]}
              latitude={+popupInfo.location[0]}
              onClose={() => setPopupInfo(null)}
              maxWidth="417px"
              anchor="bottom"
              offset={20}
            >
              <div className="popup-content">
                <div className="text-xl mb-2">
                  <Title level={3}>
                    {translate(popupInfo.name)}
                  </Title>
                </div>
                {popupInfo.address &&
                  <Text type="secondary" className="text-sm mb-2 text-gray-400 flex items-center">
                    <span className="material-symbols-outlined material-icons">
                      pin_drop
                    </span>
                    {popupInfo.address}
                  </Text>}
                <div className="text-sm mb-2 text-gray-400">
                  <Text type="secondary">
                    {stripHtmlTags(translate(popupInfo.description) || "")?.slice(
                      0,
                      100
                    )}
                    ...
                  </Text>
                </div>
                <div className="md:grid grid-cols-2 gap-4 mt-4 mb-4 flex flex-col">
                  {popupInfo?.contactInfo?.map(info => {
                    if (!info.contact_details) return null;

                    const icon = <GetIconForChannel channel={info.channel} />;
                    const contactDetail = getContactDetailLink({
                      channel: info.channel,
                      contactDetails: info.contact_details,
                    });
                    return (
                      <div className="truncate flex items-center gap-2">
                        <Text>{icon}</Text>
                        <Link className="truncate contact-detail">{contactDetail}</Link>
                      </div>
                    )
                  })}
                </div>
                <div className="flex justify-end">
                  <Link
                    href={`/service/${popupInfo.id}`}
                    target="_blank"
                    className="contact-detail"
                  >
                    <strong>See more details {<RightOutlined />}</strong>
                  </Link>
                </div>
              </div>
            </Popup>
          )}
        </Map>
      </div>
    </div>
  )
}
