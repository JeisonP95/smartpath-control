export interface Props {
  conditions: Condition[]
  activeConditions: ConditionMap
  toggle: (key: ConditionKey) => void
}
