// Tipos estrictos para las claves válidas
export type ConditionKey = 'lluvia' | 'permisoCarga' | 'traficoAlto' | 'mantenimiento' | 'horasPico';
export type ConditionMap = Record<ConditionKey, boolean>;

export interface Edge {
  from: string;
  to: string;
  condition: string; // expresión booleana
  distance: number; // distancia en kilómetros
}

export interface NodeData {
  id: string;
  label: string;
  x: number;
  y: number;
  type: 'bodega' | 'zonaCarga' | 'distribucion';
}

// Nodos con posiciones fijas
export const nodes: NodeData[] = [
  { id: '1', label: 'Bodega A', x: 100, y: 100, type: 'bodega' },
  { id: '2', label: 'Bodega B', x: 400, y: 100, type: 'bodega' },
  { id: '3', label: 'Bodega C', x: 250, y: 300, type: 'bodega' },
  { id: '4', label: 'Zona Carga 1', x: 150, y: 200, type: 'zonaCarga' },
  { id: '5', label: 'Zona Carga 2', x: 350, y: 200, type: 'zonaCarga' },
  { id: '6', label: 'Distribucion Central', x: 250, y: 150, type: 'distribucion' }
];

// Conexiones entre nodos con condiciones booleanas
export const edges: Edge[] = [
  { from: '1', to: '4', condition: '!lluvia && permisoCarga', distance: 5 },
  { from: '4', to: '2', condition: '!traficoAlto || !horasPico', distance: 8 },
  { from: '1', to: '6', condition: 'true', distance: 3 },
  { from: '6', to: '2', condition: '!mantenimiento', distance: 4 },
  { from: '2', to: '5', condition: 'permisoCarga && !lluvia', distance: 6 },
  { from: '5', to: '3', condition: '!traficoAlto', distance: 7 },
  { from: '3', to: '1', condition: '!mantenimiento && !horasPico', distance: 12 },
  { from: '6', to: '3', condition: '!lluvia || !traficoAlto', distance: 9 }
];

// Función para evaluar condiciones booleanas
export function evalCondition(expression: string, values: ConditionMap): boolean {
  try {
    const keys = Object.keys(values) as (keyof ConditionMap)[];
    const args = keys.map(k => values[k]);
    const fn = new Function(...keys, `return ${expression}`);
    return fn(...args);
  } catch {
    return false;
  }
}

// Implementación del algoritmo de Dijkstra para encontrar la ruta más corta
export function findShortestPath(
  start: string, 
  end: string, 
  activeEdges: Edge[]
): { path: string[], distance: number } | null {
  const distances: Record<string, number> = {};
  const previous: Record<string, string | null> = {};
  const unvisited = new Set<string>();
  
  // Obtener todos los nodos únicos
  const allNodes = new Set<string>();
  activeEdges.forEach(edge => {
    allNodes.add(edge.from);
    allNodes.add(edge.to);
  });
  
  // Inicializar distancias
  allNodes.forEach(node => {
    distances[node] = node === start ? 0 : Infinity;
    previous[node] = null;
    unvisited.add(node);
  });
  
  while (unvisited.size > 0) {
    // Encontrar el nodo no visitado con la menor distancia
    let current: string | null = null;
    let minDistance = Infinity;
    
    unvisited.forEach(node => {
      if (distances[node] < minDistance) {
        minDistance = distances[node];
        current = node;
      }
    });
    
    // Si no hay camino o llegamos al destino
    if (current === null || current === end || minDistance === Infinity) {
      break;
    }
    
    unvisited.delete(current);
    
    // Buscar vecinos del nodo actual
    for (const edge of activeEdges) {
      if (edge.from === current) {
        const neighbor = edge.to;
        const newDistance = distances[current] + edge.distance;
        
        if (newDistance < distances[neighbor]) {
          distances[neighbor] = newDistance;
          previous[neighbor] = current;
        }
      }
    }
  }
  
  // Construir el camino
  if (distances[end] === Infinity) {
    return null; // No hay camino
  }
  
  const path: string[] = [];
  let current = end;
  
  while (current) {
    path.unshift(current);
    const prevNode = previous[current];
    if (prevNode === null) break;  // Detenemos el bucle si no hay más nodos previos
    current = prevNode;
  }
  
  // Aseguramos que el camino empieza en el nodo de inicio
  if (path[0] !== start) {
    path.unshift(start);
  }
  
  return {
    path,
    distance: distances[end]
  };
}
