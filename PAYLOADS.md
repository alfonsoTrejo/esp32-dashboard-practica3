# Contrato de Payloads WebSocket (ESP32 <-> Front)

Este documento describe que mensajes deberia enviar y recibir cada lado.

## 1) Resumen rapido

- Transporte: WebSocket
- URL por defecto: ws://localhost:8081
- Mensajes: JSON
- Timestamp recomendado: milisegundos Unix (Date.now())

## 2) Tipos de mensajes

Se recomienda usar un envelope comun:

```json
{
  "type": "telemetry | command | ack | error",
  "timestamp": 1710000000000,
  "payload": {}
}
```

## 3) Front -> ESP32

### 3.1 Comando para prender carrito

Este es el evento que ya manda el front con el boton "Prender carrito":

```json
{
  "event": "cart_start",
  "value": true,
  "timestamp": 1710000000000
}
```

Version recomendada (normalizada con envelope):

```json
{
  "type": "command",
  "timestamp": 1710000000000,
  "payload": {
    "event": "cart_start",
    "value": true
  }
}
```

### 3.2 Comandos sugeridos futuros

```json
{
  "type": "command",
  "timestamp": 1710000000001,
  "payload": {
    "event": "cart_stop",
    "value": true
  }
}
```

```json
{
  "type": "command",
  "timestamp": 1710000000002,
  "payload": {
    "event": "set_yaw_target",
    "yawTarget": 90
  }
}
```

## 4) ESP32 -> Front

### 4.1 Telemetria (modelo recomendado para la UI actual)

La UI actual usa estos campos:

```json
{
  "speed": 1.25,
  "distance": 12.4,
  "yawCurrent": 35.5,
  "yawTarget": 40.0,
  "battery": 87,
  "timestamp": 1710000000000
}
```

Version recomendada con envelope:

```json
{
  "type": "telemetry",
  "timestamp": 1710000000000,
  "payload": {
    "speed": 1.25,
    "distance": 12.4,
    "yawCurrent": 35.5,
    "yawTarget": 40.0,
    "battery": 87
  }
}
```

### 4.2 ACK de comandos

Cuando el ESP32 reciba un comando, deberia responder ack:

```json
{
  "type": "ack",
  "timestamp": 1710000000005,
  "payload": {
    "event": "cart_start",
    "ok": true,
    "message": "Carrito encendido"
  }
}
```

### 4.3 Error

```json
{
  "type": "error",
  "timestamp": 1710000000006,
  "payload": {
    "event": "set_yaw_target",
    "ok": false,
    "code": "INVALID_RANGE",
    "message": "yawTarget fuera de rango"
  }
}
```

## 5) Estado actual del repo (importante)

Hoy existe una diferencia entre servidor y front:

- Front espera: speed, distance, yawCurrent, yawTarget, battery, timestamp
- WebSocket server maneja: speed, distance, yaw, pitch, roll, battery, timestamp

Si se quiere compatibilidad inmediata con la UI actual, el ESP32/servidor debe enviar yawCurrent y yawTarget.

## 6) Reglas de validacion recomendadas

- speed: numero >= 0
- distance: numero >= 0
- yawCurrent: numero entre -180 y 180
- yawTarget: numero entre -180 y 180
- battery: numero entre 0 y 100
- timestamp: entero en ms
- Todo mensaje debe ser JSON valido

## 7) Ejemplo de flujo completo

1. Front se conecta al WebSocket.
2. ESP32 (o server puente) envia telemetria periodica (5 a 20 Hz segun necesidad).
3. Usuario pulsa "Prender carrito".
4. Front envia command cart_start.
5. ESP32 responde ack.
6. ESP32 sigue enviando telemetria actualizada.
