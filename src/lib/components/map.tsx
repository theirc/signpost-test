import {
  GeolocateControl,
  Map,
  MapRef,
  Marker,
  NavigationControl,
  Popup,
} from "react-map-gl";
import { app, translate } from "../app";
import mapboxgl from "mapbox-gl";
import supercluster, { ClusterFeature, PointFeature } from "supercluster";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import GeocoderControl from "./geocoder-control";
import { ContactDropdown } from "./contact-dropdown";
import React from "react";
import { useMultiState } from "./hooks";

const getBoundsForFeatures = (services: Service[]) => {
  const bounds = new mapboxgl.LngLatBounds();

  services.forEach((service) => {
    if (service.location?.length > 1) {
      bounds.extend([+service.location[1], +service.location[0]]);
    }
  });
  return bounds;
};

const stripHtmlTags = (html: string): string => {
  const regex =
    /<[^>]*>|&[^;]+;|<img\s+.*?>|<span\s+style="[^"]*">.*?<\/span>|&[A-Za-z]+;/g;
  return html.replace(regex, "");
};

interface mapProps {
  services: Service[];
}

export function Maps({ services }: mapProps) {
  const categories = Object.values(app.categories.categories) || [];
  type ClusterOrPoint =
    | ClusterFeature<supercluster.AnyProps>
    | PointFeature<supercluster.AnyProps>;
  const [popupInfo, setPopupInfo] = useState<Service | null>(null);
  const [clusters, setClusters] = useState<ClusterOrPoint[]>([]);
  const [isMapReady, setIsMapReady] = useState(false);
  const mapRef = useRef<MapRef>(null);

  const STYLE: mapboxgl.Style = {
    version: 8,
    sources: {
      "raster-tiles": {
        type: "raster",
        tiles: [
          "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
          "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
          "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png",
        ],
        tileSize: 256,
      },
    },
    layers: [
      {
        id: "osm-tiles",
        type: "raster",
        source: "raster-tiles",
        minzoom: 0,
        maxzoom: 19,
      },
    ],
  };

  const bounds = useMemo(() => {
    return getBoundsForFeatures(services);
  }, [services]);

  const customMarkerIcon = (category?: number) => {
    const categorySelected = categories.filter((x) => x.id === category);
    if (!categorySelected.length) {
      return (
        <i
          className={`rounded-full shadow border-4 border-black h-40 w-40 bg-white p-8 text-center text-2xl flex items-center`}
          style={{ color: "#FFFFFF" }}
        />
      );
    } else {
      return (
        <span
          className={`material-icons rounded-full shadow border-4 border-black h-6 w-6 bg-white p-3 text-center text-2xl flex items-center`}
          style={{ color: categorySelected[0]?.color }}
        >
          {categorySelected[0]?.icon}
        </span>
      );
    }
  };

  const cluster = useMemo(() => {
    const newCluster = new supercluster({
      radius: 40,
      maxZoom: 16,
    });
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
    );
    return newCluster;
  }, [services]);

  const updateClusters = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;

    const bounds = map.getBounds();
    const bbox: [number, number, number, number] = [
      bounds.getWest(),
      bounds.getSouth(),
      bounds.getEast(),
      bounds.getNorth(),
    ];

    const newClusters = cluster.getClusters(bbox, Math.floor(map.getZoom()));
    setClusters(newClusters);
  }, [cluster, mapRef]);

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
      }));

    cluster.load(features);
    updateClusters();
  }, [services, cluster, updateClusters]);

  useEffect(() => {
    if (!isMapReady) {
      return;
    }

    const map = mapRef.current?.getMap();

    const onMapLoad = () => {
      loadAndUpdateClusters();
      mapRef.current?.getMap().on("move", updateClusters);
    };

    if (map) {
      if (map.isStyleLoaded()) {
        onMapLoad();
      } else {
        map.on("load", onMapLoad);
      }
    }

    return () => {
      if (map) {
        map.off("load", onMapLoad);
        map.off("move", updateClusters);
      }
    };
  }, [isMapReady]);

  useEffect(() => {
    const map = mapRef.current?.getMap();

    if (map && bounds) {
      map.once("load", () => {
        map.fitBounds(bounds, {
          padding: 20,
        });
      });
    }
  }, [bounds]);

  useEffect(() => {
    console.log("123 ", services);
  }, [services]);

  const handleViewportChange = () => {
    updateClusters();
  };

  return (
    <div>
      <div className="w-full h-[960px] bg-indigo-200 map-container">
        <Map
          mapboxAccessToken="pk.eyJ1Ijoic2lnbnBvc3RnbG9iYWwiLCJhIjoiY2w1dmVwYnVxMDkxbjNjbW96NXkybHZyZCJ9.cYedHq58Ur6PKXkEnwYCzQ"
          mapStyle={STYLE}
          maxZoom={20}
          minZoom={3}
          onMove={handleViewportChange}
          ref={mapRef}
          onLoad={() => {
            setIsMapReady(true);
          }}
        >
          <GeocoderControl
            mapboxAccessToken="pk.eyJ1Ijoic2lnbnBvc3RnbG9iYWwiLCJhIjoiY2w1dmVwYnVxMDkxbjNjbW96NXkybHZyZCJ9.cYedHq58Ur6PKXkEnwYCzQ"
            position="top-left"
          />
          <GeolocateControl position="top-left" />
          <NavigationControl position="top-left" />
          {clusters.map((cluster: ClusterOrPoint) => {
            const [longitude, latitude] = cluster.geometry.coordinates;
            const {
              cluster: isCluster,
              point_count_abbreviated: pointCountAbbreviated,
            } = cluster.properties;

            if (isCluster) {
              return (
                <Marker
                  key={`cluster-${cluster.id}`}
                  longitude={longitude}
                  latitude={latitude}
                  onClick={() => {
                    const map = mapRef.current?.getMap();
                    const zoom = map?.getZoom();
                    map?.flyTo({
                      center: [longitude, latitude],
                      zoom: (zoom || 0) + 3,
                    });
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
              );
            } else {
              const service = services.find(
                (s) => s.id === cluster.properties.serviceId
              );
              if (!service) return null;
              return (
                <Marker
                  key={`marker-${cluster.properties.serviceId}`}
                  longitude={longitude}
                  latitude={latitude}
                  onClick={(e) => {
                    e.originalEvent.stopPropagation();
                    setPopupInfo(service);
                  }}
                >
                  {customMarkerIcon(cluster.properties.category)}
                </Marker>
              );
            }
          })}
          {popupInfo && (
            <Popup
              longitude={+popupInfo.location[1]}
              latitude={+popupInfo.location[0]}
              onClose={() => setPopupInfo(null)}
              maxWidth="300px"
              anchor="bottom"
              offset={20}
            >
              <div className="popup-content">
                <div className="text-xl mb-2">
                  <strong> {translate(popupInfo.name)}</strong>
                </div>
                <div className="text-sm mb-2">
                  {stripHtmlTags(translate(popupInfo.description) || "")?.slice(
                    0,
                    100
                  )}
                  ...
                </div>
                <div className="text-sm mb-2 text-gray-400">
                  {popupInfo.address}
                </div>
                <div className="flex justify-between items-center mt-4">
                  <a
                    href={`/services/${popupInfo.id}`}
                    className="ant-btn ant-btn-round ant-btn-default ant-btn-sm text-white bg-blue-500 border-none"
                    target="_blank"
                  >
                    VIEW SERVICE
                  </a>

                  <ContactDropdown
                    serviceId={popupInfo.id}
                    contactInfo={popupInfo.contactInfo as []}
                    strings="strings"
                  />
                </div>
              </div>
            </Popup>
          )}
        </Map>
      </div>
    </div>
  );
}
