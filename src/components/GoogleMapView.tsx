"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { GoogleMap, LoadScript, Marker, Polyline, InfoWindow } from "@react-google-maps/api"
import type { NodeData, Edge } from "../types"

// Estilos para el contenedor del mapa
const containerStyle = {
  width: "100%",
  height: "100%",
}

// Colores para los diferentes tipos de nodos
const nodeColors = {
  bodega: "#3498db",
  zonaCarga: "#e67e22",
  distribucion: "#9b59b6",
}

// Opciones para el mapa
const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: true,
  streetViewControl: false,
  fullscreenControl: true,
}

interface Props {
  nodes: NodeData[]
  edges: Edge[]
  highlightedPath?: string[] | null
}

const GoogleMapView = ({ nodes, edges, highlightedPath }: Props) => {
  const [center, setCenter] = useState({ lat: 4.6097, lng: -74.0817 }) // Bogotá por defecto
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const mapRef = useRef<google.maps.Map | null>(null)

  // Calcular el centro del mapa basado en los nodos
  useEffect(() => {
    if (nodes.length > 0) {
      const validNodes = nodes.filter((node) => node.latitude && node.longitude)
      if (validNodes.length > 0) {
        const sumLat = validNodes.reduce((sum, node) => sum + (node.latitude || 0), 0)
        const sumLng = validNodes.reduce((sum, node) => sum + (node.longitude || 0), 0)
        setCenter({
          lat: sumLat / validNodes.length,
          lng: sumLng / validNodes.length,
        })
      }
    }
  }, [nodes])

  // Función para ajustar el zoom del mapa para mostrar todos los nodos
  const fitBounds = useCallback(() => {
    if (mapRef.current && nodes.length > 0 && mapLoaded && window.google) {
      const bounds = new window.google.maps.LatLngBounds()
      nodes.forEach((node) => {
        if (node.latitude && node.longitude) {
          bounds.extend({ lat: node.latitude, lng: node.longitude })
        }
      })
      mapRef.current.fitBounds(bounds, 50) // 50px de padding
    }
  }, [nodes, mapLoaded])

  // Ajustar el zoom cuando cambian los nodos o se carga el mapa
  useEffect(() => {
    fitBounds()
  }, [fitBounds, nodes, mapLoaded])

  // Función para manejar la carga del mapa
  const handleMapLoad = (map: google.maps.Map) => {
    mapRef.current = map
    setMapLoaded(true)
  }

  // Determinar si una arista está en la ruta resaltada
  const isEdgeInPath = useCallback(
    (from: string, to: string): boolean => {
      if (!highlightedPath || highlightedPath.length < 2) return false

      for (let i = 0; i < highlightedPath.length - 1; i++) {
        if (highlightedPath[i] === from && highlightedPath[i + 1] === to) {
          return true
        }
      }
      return false
    },
    [highlightedPath],
  )

  // Obtener el nodo por ID
  const getNodeById = (id: string): NodeData | undefined => {
    return nodes.find((node) => node.id === id)
  }

  // Crear líneas para las aristas
  const createPolylines = () => {
    return edges.map((edge, index) => {
      const fromNode = getNodeById(edge.from)
      const toNode = getNodeById(edge.to)

      if (!fromNode || !toNode || !fromNode.latitude || !fromNode.longitude || !toNode.latitude || !toNode.longitude) {
        return null
      }

      const isInPath = isEdgeInPath(edge.from, edge.to)

      return (
        <Polyline
          key={`edge-${index}`}
          path={[
            { lat: fromNode.latitude, lng: fromNode.longitude },
            { lat: toNode.latitude, lng: toNode.longitude },
          ]}
          options={{
            strokeColor: isInPath ? "#ffcc00" : "#00cc44",
            strokeOpacity: 0.8,
            strokeWeight: isInPath ? 5 : 3,
          }}
        />
      )
    })
  }

  // Crear marcadores para los nodos
  const createMarkers = () => {
    return nodes.map((node) => {
      if (!node.latitude || !node.longitude || !window.google) return null

      const isInPath = highlightedPath?.includes(node.id) || false
      const scale = isInPath ? 1.2 : 1

      return (
        <Marker
          key={`node-${node.id}`}
          position={{ lat: node.latitude, lng: node.longitude }}
          title={node.label}
          onClick={() => setSelectedNode(node)}
          icon={{
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 8 * scale,
            fillColor: nodeColors[node.type as keyof typeof nodeColors] || "#333",
            fillOpacity: 0.8,
            strokeWeight: isInPath ? 2 : 1,
            strokeColor: isInPath ? "#ffcc00" : "#ffffff",
          }}
          zIndex={isInPath ? 10 : 1}
        />
      )
    })
  }

  return (
    <div className="google-map-container">
      <LoadScript
        googleMapsApiKey="AIzaSyB41DRUbKWJHPxaFjMAwdrzWzbVKartNGg"
        loadingElement={<div>Cargando mapa...</div>}
      >
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={center}
          zoom={13}
          onLoad={handleMapLoad}
          options={mapOptions}
        >
          {createPolylines()}
          {createMarkers()}

          {selectedNode && selectedNode.latitude && selectedNode.longitude && (
            <InfoWindow
              position={{ lat: selectedNode.latitude, lng: selectedNode.longitude }}
              onCloseClick={() => setSelectedNode(null)}
            >
              <div className="info-window">
                <h3>{selectedNode.label}</h3>
                <p>Tipo: {selectedNode.type}</p>
                <p>
                  Coordenadas: {selectedNode.latitude.toFixed(6)}, {selectedNode.longitude.toFixed(6)}
                </p>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </LoadScript>

      <div className="map-controls">
        <button className="map-control-button" onClick={fitBounds}>
          Centrar Mapa
        </button>
      </div>
    </div>
  )
}

export default GoogleMapView
