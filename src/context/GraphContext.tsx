import { createContext, useContext, useState, ReactNode } from 'react';
import { NodeData, Edge, Vehicle, RouteAlgorithm, Condition, ConditionMap } from '../pages/graph/utils/interface';

interface GraphContextType {
  nodes: NodeData[];
  edges: Edge[];
  vehicles: Vehicle[];
  algorithms: RouteAlgorithm[];
  conditions: Condition[];
  activeConditions: ConditionMap;
  setNodes: (nodes: NodeData[]) => void;
  setEdges: (edges: Edge[]) => void;
  setVehicles: (vehicles: Vehicle[]) => void;
  setAlgorithms: (algorithms: RouteAlgorithm[]) => void;
  setConditions: (conditions: Condition[]) => void;
  setActiveConditions: (conditions: ConditionMap | ((prev: ConditionMap) => ConditionMap)) => void;
  updateNodePosition: (nodeId: string, x: number, y: number) => void;
}

const GraphContext = createContext<GraphContextType | undefined>(undefined);

export function GraphProvider({ children }: { children: ReactNode }) {
  const [nodes, setNodes] = useState<NodeData[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [algorithms, setAlgorithms] = useState<RouteAlgorithm[]>([]);
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [activeConditions, setActiveConditions] = useState<ConditionMap>({} as ConditionMap);

  const updateNodePosition = (nodeId: string, x: number, y: number) => {
    setNodes(prevNodes => 
      prevNodes.map(node => 
        node.id === nodeId ? { ...node, x, y } : node
      )
    );
  };

  return (
    <GraphContext.Provider value={{
      nodes,
      edges,
      vehicles,
      algorithms,
      conditions,
      activeConditions,
      setNodes,
      setEdges,
      setVehicles,
      setAlgorithms,
      setConditions,
      setActiveConditions,
      updateNodePosition
    }}>
      {children}
    </GraphContext.Provider>
  );
}

export function useGraph() {
  const context = useContext(GraphContext);
  if (context === undefined) {
    throw new Error('useGraph must be used within a GraphProvider');
  }
  return context;
} 