import { useState } from "react"
import type { ConditionKey } from "../../services"
import { updateCondition } from "../../services/api"
import { Props } from "./interface"
import { Leaf } from "../../components/icons/icons"

const ControlPanel = ({ conditions, activeConditions, toggle }: Props) => {
  const [updating, setUpdating] = useState<string | null>(null)

  const handleToggle = async (key: ConditionKey) => {
    setUpdating(key)
    try {
      await updateCondition(key, !activeConditions[key])
      toggle(key)
    } catch (error) {
      console.error("Error updating condition:", error)
    } finally {
      setUpdating(null)
    }
  }

  return (
    <div className="control-panel">
      <h2>
        Panel de Control
<Leaf size={20} className="control-panel-icon" />
      </h2>
      <p className="control-description">Ajuste las condiciones para ver cómo afectan a las rutas disponibles</p>

      <div className="conditions-grid">
        {conditions.map((condition) => (
          <div key={condition.key} className="condition-card">
            <div className="condition-icon">{condition.icon}</div>
            <div className="condition-content">
              <label className="condition-label">
                <input
                  type="checkbox"
                  checked={activeConditions[condition.key]}
                  onChange={() => handleToggle(condition.key)}
                  disabled={updating === condition.key}
                />
                <span className="condition-name">{condition.label}</span>
              </label>
              <div className="condition-description">{condition.description}</div>
            </div>
            <div className={`condition-status ${activeConditions[condition.key] ? "active" : "inactive"}`}>
              {updating === condition.key ? "..." : activeConditions[condition.key] ? "ON" : "OFF"}
            </div>
          </div>
        ))}
      </div>

      <div className="boolean-expressions">
        <h3>Condiciones Lógicas Activas</h3>
        <ul className="expressions-list">
          {Object.entries(activeConditions)
            .filter(([_, value]) => value)
            .map(([key]) => (
              <li key={key} className="expression-item">
                <span className="variable">{key}</span> = <span className="value">true</span>
              </li>
            ))}
        </ul>
      </div>
    </div>
  )
}

export default ControlPanel
