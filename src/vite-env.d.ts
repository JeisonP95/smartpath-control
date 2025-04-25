/// <reference types="vite/client" />

declare namespace google {
    namespace maps {
      class LatLngBounds {
        constructor()
        extend(latLng: { lat: number; lng: number }): void
      }
  
      class Map {
        fitBounds(bounds: LatLngBounds, padding?: number): void
      }
  
      namespace SymbolPath {
        const CIRCLE: number
      }
    }
  }
  