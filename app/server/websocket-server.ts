import { WebSocketServer, WebSocket } from "ws"

type TelemetryPayload = {
  speed: number
  distance: number
  yaw: number
  pitch: number
  roll: number
  battery?: number
  timestamp?: number
}

const PORT = Number(process.env.WS_PORT ?? 8081)
const HOST = process.env.WS_HOST ?? "0.0.0.0"

const wss = new WebSocketServer({ host: HOST, port: PORT })

let latestTelemetry: TelemetryPayload = {
  speed: 0,
  distance: 0,
  yaw: 0,
  pitch: 0,
  roll: 0,
  battery: 0,
  timestamp: Date.now(),
}

function broadcast(payload: TelemetryPayload) {
  const message = JSON.stringify(payload)

  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message)
    }
  }
}

wss.on("listening", () => {
  console.log(`✅ WebSocket server escuchando en ws://${HOST}:${PORT}`)
})

wss.on("connection", (socket, request) => {
  console.log("🔌 Cliente conectado desde:", request.socket.remoteAddress)

  socket.send(JSON.stringify(latestTelemetry))

  socket.on("message", (raw) => {
    try {
      const payload = JSON.parse(raw.toString()) as Partial<TelemetryPayload>

      latestTelemetry = {
        ...latestTelemetry,
        ...payload,
        timestamp: Date.now(),
      }

      console.log("📦 Payload recibido:", latestTelemetry)
      broadcast(latestTelemetry)
    } catch (error) {
      console.error("❌ Mensaje inválido:", error)
    }
  })

  socket.on("close", () => {
    console.log("⚠️ Cliente desconectado")
  })

  socket.on("error", (error) => {
    console.error("❌ Error en socket:", error)
  })
})

wss.on("error", (error) => {
  console.error("❌ Error en WebSocket server:", error)
})