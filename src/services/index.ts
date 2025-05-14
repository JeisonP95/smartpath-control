// Tipos para las condiciones
export type ConditionKey = "lluvia" | "permisoCarga" | "traficoAlto" | "mantenimiento" | "horasPico"
export type ConditionMap = Record<ConditionKey, boolean>

// Interfaces para los datos del grafo
export interface Edge {
  id?: number
  from: string
  to: string
  condition: string // expresión booleana
  distance: number // distancia en kilómetros
  estimatedTime?: number // tiempo estimado en minutos
  trafficFactor?: number // factor de tráfico
}

export interface NodeData {
  id: string
  label: string
  x: number
  y: number
  type: "bodega" | "zonaCarga" | "distribucion"
  latitude?: number
  longitude?: number
}

// Interfaz para vehículos
export interface Vehicle {
  id: number
  name: string
  type: string
  capacity: number
  speedFactor: number
  available: boolean
}

// Interfaz para resultados de ruta
export interface PathResult {
  path: string[]
  distance: number
  estimatedTime?: number
  vehicleId?: number
}

// Interfaz para algoritmos de ruta
export interface RouteAlgorithm {
  name: string
  description: string
}

// Interfaz para condiciones
export interface Condition {
  key: ConditionKey
  label: string
  description: string
  icon: string
  active: boolean
}
