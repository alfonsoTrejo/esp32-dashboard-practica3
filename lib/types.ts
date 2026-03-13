export type TelemetryPayload = {
  speed: number
  distance: number
  yawCurrent: number
  yawTarget: number
  battery?: number
  timestamp?: number
}