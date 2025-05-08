import { type NodeTypes, Handle, Position, type NodeProps } from "reactflow"
import "reactflow/dist/style.css"

export const BodegaNode = ({ data }: NodeProps) => (
  <div className="node bodega-node">
    <Handle type="target" position={Position.Top} />
    <div>{data.label}</div>
    <Handle type="source" position={Position.Bottom} />
  </div>
)

const ZonaCargaNode = ({ data }: NodeProps) => (
  <div className="node zona-carga-node">
    <Handle type="target" position={Position.Top} />
    <div>{data.label}</div>
    <Handle type="source" position={Position.Bottom} />
  </div>
)

const DistribucionNode = ({ data }: NodeProps) => (
  <div className="node distribucion-node">
    <Handle type="target" position={Position.Top} />
    <div>{data.label}</div>
    <Handle type="source" position={Position.Bottom} />
  </div>
)

export const nodeTypes: NodeTypes = {
  bodega: BodegaNode,
  zonaCarga: ZonaCargaNode,
  distribucion: DistribucionNode,
}
