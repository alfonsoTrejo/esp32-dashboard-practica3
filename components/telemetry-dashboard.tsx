"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  Activity,
  Gauge,
  Move3D,
  Route,
  Wifi,
  WifiOff,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { TelemetryPayload } from "@/lib/types"
import { formatNumber } from "@/lib/utils"

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8081"

const initialData: TelemetryPayload = {
  speed: 0,
  distance: 0,
  yawCurrent: 0,
  yawTarget: 0,
  battery: 0,
  timestamp: Date.now(),
}

function MetricCard({
  title,
  value,
  unit,
  icon,
}: {
  title: string
  value: string
  unit: string
  icon: React.ReactNode
}) {
  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold tracking-tight">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{unit}</p>
      </CardContent>
    </Card>
  )
}

export function TelemetryDashboard() {
  const [data, setData] = useState<TelemetryPayload>(initialData)
  const [connected, setConnected] = useState(false)
  const socketRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null

    const connect = () => {
      const socket = new WebSocket(WS_URL)
      socketRef.current = socket

      socket.onopen = () => {
        setConnected(true)
      }

      socket.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data) as TelemetryPayload
          setData((prev) => ({
            ...prev,
            ...parsed,
            timestamp: parsed.timestamp ?? Date.now(),
          }))
        } catch (error) {
          console.error("Error parsing telemetry:", error)
        }
      }

      socket.onclose = () => {
        setConnected(false)
        reconnectTimer = setTimeout(connect, 2000)
      }

      socket.onerror = () => {
        socket.close()
      }
    }

    connect()

    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer)
      socketRef.current?.close()
    }
  }, [])

  const lastUpdate = useMemo(() => {
    if (!data.timestamp) return "--"
    return new Date(data.timestamp).toLocaleTimeString("es-MX")
  }, [data.timestamp])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard ESP32</h1>
          <p className="text-sm text-muted-foreground">
            Telemetría en tiempo real por WebSocket
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant={connected ? "default" : "destructive"} className="gap-2 px-3 py-1">
            {connected ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
            {connected ? "Conectado" : "Desconectado"}
          </Badge>
          <Badge variant="secondary" className="px-3 py-1">
            Última actualización: {lastUpdate}
          </Badge>
        </div>
      </div>

<section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
  <MetricCard
    title="Velocidad actual"
    value={formatNumber(data.speed, 2)}
    unit="m/s"
    icon={<Gauge className="h-4 w-4 text-muted-foreground" />}
  />
  <MetricCard
    title="Distancia recorrida"
    value={formatNumber(data.distance, 2)}
    unit="m"
    icon={<Route className="h-4 w-4 text-muted-foreground" />}
  />
  <MetricCard
    title="Yaw actual"
    value={formatNumber(data.yawCurrent, 2)}
    unit="°"
    icon={<Move3D className="h-4 w-4 text-muted-foreground" />}
  />
  <MetricCard
    title="Yaw objetivo"
    value={formatNumber(data.yawTarget, 2)}
    unit="°"
    icon={<Move3D className="h-4 w-4 text-muted-foreground" />}
  />
  <MetricCard
    title="Error de yaw"
    value={formatNumber(data.yawTarget - data.yawCurrent, 2)}
    unit="°"
    icon={<Activity className="h-4 w-4 text-muted-foreground" />}
  />
</section>

      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle>Payload actual</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="overflow-x-auto rounded-xl border bg-muted/40 p-4 text-sm">
{JSON.stringify(data, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}