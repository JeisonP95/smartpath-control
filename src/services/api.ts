import { createServerSupabaseClient } from "./supabase"
import type { NodeData, Edge, Vehicle, ConditionMap, Condition, PathResult, RouteAlgorithm } from "."
import {
  findShortestPathAStar,
  evalCondition,
} from "./algorithms"

// Datos de ejemplo para desarrollo local


const mockNodes: NodeData[] = [
  { id: "1", label: "Bodega A", x: 50, y: 300, type: "bodega", latitude: 4.6097, longitude: -74.0817 },
  { id: "2", label: "Bodega B", x: 450, y: 300, type: "bodega", latitude: 4.6234, longitude: -74.0836 },
  { id: "3", label: "Bodega C", x: 250, y: 350, type: "bodega", latitude: 4.6145, longitude: -74.0648 },
  { id: "4", label: "Zona Carga 1", x: 150, y: 50, type: "zonaCarga", latitude: 4.6189, longitude: -74.0756 },
  { id: "5", label: "Zona Carga 2", x: 350, y: 50, type: "zonaCarga", latitude: 4.6278, longitude: -74.0723 },
  { id: "6", label: "Distribución Central", x: 250, y: 150, type: "distribucion", latitude: 4.6201, longitude: -74.0701 },
];

// Crear un grafo no dirigido (bidireccional)
const mockEdges: Edge[] = [

// zonas de carga a distribucion central
  { from: "5", to: "6", condition: "true", distance: 8, estimatedTime: 25, trafficFactor: 1.2 },
  { from: "4", to: "6", condition: "true", distance: 5, estimatedTime: 25, trafficFactor: 1.2 },
  
  // Distribuccion central a bodegas(a,b,c)
  {from: "6", to: "1",condition: "true",distance: 8,estimatedTime: 25,trafficFactor: 1.2},
  {from: "6", to: "2",condition: "true",distance: 8,estimatedTime: 25,trafficFactor: 1.2},
  {from: "6", to: "3", condition: "true", distance: 8, estimatedTime: 25, trafficFactor: 1.2 },
//distribuccionn entre bodegas
  { from: "1", to: "2", condition: "true", distance: 8, estimatedTime: 25, trafficFactor: 1.2 },
  { from: "1", to: "3", condition: "true", distance: 8, estimatedTime: 25, trafficFactor: 1.2 },
  { from: "2", to: "1", condition: "true", distance: 8, estimatedTime: 25, trafficFactor: 1.2 },
  { from: "2", to: "3", condition: "true", distance: 8, estimatedTime: 25, trafficFactor: 1.2 },
  { from: "3", to: "1", condition: "true", distance: 8, estimatedTime: 25, trafficFactor: 1.2 },
  { from: "3", to: "2", condition: "true", distance: 8, estimatedTime: 25, trafficFactor: 1.2 },
  // bodegas a distribucion central
  { from: "1", to: "6", condition: "!mantenimiento || !horasPico", distance: 8, estimatedTime: 25, trafficFactor: 1.2 },
  { from: "2", to: "6", condition: "true", distance: 8, estimatedTime: 25, trafficFactor: 1.2 },
  { from: "3", to: "6", condition: "true", distance: 8, estimatedTime: 25, trafficFactor: 1.2 },
  // distribucion central a zona de cargas
  { from: "6", to: "5", condition: "true", distance: 8, estimatedTime: 25, trafficFactor: 1.2 },
  { from: "6", to: "4", condition: "true", distance: 8, estimatedTime: 25, trafficFactor: 1.2 },
 
  /*{ from: "4", to: "2", condition: "!mantenimiento || !horasPico", distance: 8, estimatedTime: 25, trafficFactor: 1.2 },
  { from: "6", to: "2", condition: "!mantenimiento", distance: 4, estimatedTime: 12, trafficFactor: 1.0 },
  { from: "2", to: "5", condition: "permisoCarga && !lluvia", distance: 6, estimatedTime: 18, trafficFactor: 1.1 },
  { from: "5", to: "3", condition: "!traficoAlto", distance: 7, estimatedTime: 20, trafficFactor: 1.3 },
  {from: "3",to: "1",condition: "!mantenimiento && !horasPico",distance: 12,estimatedTime: 35,trafficFactor: 1.2,},
  { from: "6", to: "3", condition: "!lluvia || !traficoAlto", distance: 9, estimatedTime: 28, trafficFactor: 1.1 },
  { from: "4", to: "5", condition: "true", distance: 7, estimatedTime: 21, trafficFactor: 1.2 },
  */
]



const mockConditions: Condition[] = [
  { key: "lluvia", label: "Lluvia", description: "Condiciones climáticas desfavorables", icon: "🌧️", active: false },
  {
    key: "permisoCarga",
    label: "Permiso de Carga",
    description: "Autorización para transportar mercancía",
    icon: "📝",
    active: true,
  },
  { key: "mantenimiento", label: "Mantenimiento", description: "Vías en reparación", icon: "🔧", active: false },
  { key: "horasPico", label: "Horas Pico", description: "Horarios de alta congestión", icon: "⏰", active: false },
]


const mockVehicles: Vehicle[] = [
  { id: 1, name: "Camión 1", type: "camion", capacity: 5000, speedFactor: 0.8, available: true },
  { id: 2, name: "Camión 2", type: "camion", capacity: 8000, speedFactor: 0.7, available: true },
  { id: 3, name: "Furgoneta 1", type: "furgoneta", capacity: 1500, speedFactor: 1.2, available: true },
  { id: 4, name: "Motocicleta 1", type: "moto", capacity: 100, speedFactor: 1.5, available: true },
]

const mockRouteHistory: any[] = [
  {
    id: 1,
    start_node: "1",
    end_node: "3",
    path: JSON.stringify(["1", "6", "3"]),
    distance: 12,
    estimated_time: 38,
    algorithm: "dijkstra",
    created_at: new Date().toISOString(),
    vehicles: { name: "Camión 1" },
  },
  {
    id: 2,
    start_node: "2",
    end_node: "1",
    path: JSON.stringify(["2", "5", "3", "1"]),
    distance: 25,
    estimated_time: 73,
    algorithm: "astar",
    created_at: new Date(Date.now() - 86400000).toISOString(), // Ayer
    vehicles: { name: "Furgoneta 1" },
  },
]

// Verificar si estamos en modo de desarrollo
const isDevelopment = import.meta.env.DEV

// Obtener todos los nodos
export async function getNodes(): Promise<NodeData[]> {
  if (isDevelopment) {
    return mockNodes
  }

  try {
    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase.from("nodes").select("*")

    if (error) {
      console.error("Error fetching nodes:", error)
      return []
    }

    return data.map((node) => ({
      id: node.node_id,
      label: node.label,
      x: node.x,
      y: node.y,
      type: node.type as "bodega" | "zonaCarga" | "distribucion",
      latitude: node.latitude,
      longitude: node.longitude,
    }))
  } catch (error) {
    console.error("Error in getNodes:", error)
    return []
  }
}

// Obtener todas las aristas
export async function getEdges(): Promise<Edge[]> {
  if (isDevelopment) {
    return mockEdges
  }

  try {
    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase.from("edges").select("*")

    if (error) {
      console.error("Error fetching edges:", error)
      return []
    }

    return data.map((edge) => ({
      id: edge.id,
      from: edge.from_node,
      to: edge.to_node,
      condition: edge.condition,
      distance: edge.distance,
      estimatedTime: edge.estimated_time,
      trafficFactor: edge.traffic_factor,
    }))
  } catch (error) {
    console.error("Error in getEdges:", error)
    return []
  }
}

// Obtener todas las condiciones
export async function getConditions(): Promise<Condition[]> {
  if (isDevelopment) {
    return mockConditions
  }

  try {
    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase.from("conditions").select("*")

    if (error) {
      console.error("Error fetching conditions:", error)
      return []
    }

    return data.map((condition) => ({
      key: condition.key as any,
      label: condition.label,
      description: condition.description || "",
      icon: condition.icon || "❓",
      active: condition.active,
    }))
  } catch (error) {
    console.error("Error in getConditions:", error)
    return []
  }
}

// Actualizar una condición
export async function updateCondition(key: string, active: boolean): Promise<boolean> {
  if (isDevelopment) {
    const index = mockConditions.findIndex((c) => c.key === key)
    if (index !== -1) {
      mockConditions[index].active = active
      return true
    }
    return false
  }

  try {
    const supabase = createServerSupabaseClient()
    const { error } = await supabase.from("conditions").update({ active }).eq("key", key)

    if (error) {
      console.error("Error updating condition:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in updateCondition:", error)
    return false
  }
}

// Obtener todos los vehículos
export async function getVehicles(): Promise<Vehicle[]> {
  if (isDevelopment) {
    return mockVehicles
  }

  try {
    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase.from("vehicles").select("*")

    if (error) {
      console.error("Error fetching vehicles:", error)
      return []
    }

    return data.map((vehicle) => ({
      id: vehicle.id,
      name: vehicle.name,
      type: vehicle.type,
      capacity: vehicle.capacity,
      speedFactor: vehicle.speed_factor,
      available: vehicle.available,
    }))
  } catch (error) {
    console.error("Error in getVehicles:", error)
    return []
  }
}

// Calcular ruta
export async function calculateRoute(
  start: string,
  end: string,
  algorithm = "dijkstra",
  optimizeFor: "distance" | "time" = "distance",
  vehicleId?: number,
): Promise<PathResult | null> {
  // Obtener condiciones actuales
  const conditionsData = await getConditions()
  const conditions: ConditionMap = {} as any
  conditionsData.forEach((c) => {
    conditions[c.key] = c.active
  })

  // Obtener aristas
  const edges = await getEdges()

  // Filtrar aristas activas según condiciones
  const activeEdges = edges.filter((edge) => evalCondition(edge.condition, conditions))

  // Obtener vehículo si se especificó
  let vehicleSpeedFactor = 1.0
  if (vehicleId) {
    const vehicles = await getVehicles()
    const vehicle = vehicles.find((v) => v.id === vehicleId)
    if (vehicle) {
      vehicleSpeedFactor = vehicle.speedFactor
    }
  }

  // Ajustar tiempos estimados según el vehículo
  const adjustedEdges = activeEdges.map((edge) => ({
    ...edge,
    estimatedTime: (edge.estimatedTime || edge.distance * 3) / vehicleSpeedFactor,
  }))

    // Calcular ruta usando exclusivamente A*
const nodes = await getNodes()
const nodesMap: Record<string, { x: number; y: number }> = {}
nodes.forEach((node) => {
  nodesMap[node.id] = { x: node.x, y: node.y }
})

const result: PathResult | null = findShortestPathAStar(
  start,
  end,
  adjustedEdges,
  nodesMap,
  optimizeFor
)


  // Si se encontró una ruta y no estamos en desarrollo, guardarla en el historial
  if (result && !isDevelopment) {
    try {
      const supabase = createServerSupabaseClient()
      await supabase.from("routes").insert({
        start_node: start,
        end_node: end,
        path: JSON.stringify(result.path),
        distance: result.distance,
        estimated_time: result.estimatedTime,
        vehicle_id: vehicleId,
        conditions_snapshot: JSON.stringify(conditions),
        algorithm,
      })
    } catch (error) {
      console.error("Error saving route to history:", error)
    }
  }

  if (result && vehicleId) {
    result.vehicleId = vehicleId
  }

  return result
}

// Obtener algoritmos disponibles
export function getAvailableAlgorithms(): RouteAlgorithm[] {
  return [
    {
      name: "astar",
      description: "Algoritmo A* que usa heurística para optimizar la búsqueda",
    }
  ]
}

// Guardar una nueva ruta en el historial
export async function saveRoute(route: PathResult): Promise<boolean> {
  if (isDevelopment) {
    console.log("Saving route (mock):", route)
    return true
  }

  try {
    const supabase = createServerSupabaseClient()
    const { error } = await supabase.from("routes").insert({
      start_node: route.path[0],
      end_node: route.path[route.path.length - 1],
      path: JSON.stringify(route.path),
      distance: route.distance,
      estimated_time: route.estimatedTime,
      vehicle_id: route.vehicleId,
      algorithm: "custom",
    })

    if (error) {
      console.error("Error saving route:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in saveRoute:", error)
    return false
  }
}

// Obtener historial de rutas
export async function getRouteHistory(limit = 10): Promise<any[]> {
  if (isDevelopment) {
    return mockRouteHistory
  }

  try {
    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase
      .from("routes")
      .select(`
        id, 
        start_node, 
        end_node, 
        path, 
        distance, 
        estimated_time, 
        algorithm, 
        created_at,
        vehicles(name)
      `)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("Error fetching route history:", error)
      return []
    }

    return data
  } catch (error) {
    console.error("Error in getRouteHistory:", error)
    return []
  }
}
