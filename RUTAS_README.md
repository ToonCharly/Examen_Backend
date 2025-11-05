Guía rápida para probar el backend de Agenda de Citas (Postman / curl / Thunder Client / Insomnia)

Base URL
- Define una variable `baseUrl` o usa directamente: http://localhost:3000

Solicitudes sugeridas (copia el cuerpo y los encabezados en tu herramienta de API preferida)

1) Crear Paciente (POST /api/pacientes)
Encabezados:
- Content-Type: application/json
Body (JSON):
{
  "nombre": "María López",
  "telefono": "55-9988-7766",
  "correo": "maria.lopez@example.com"
}
Esperado: 201 Created → la respuesta incluye `_id` (guárdalo como pacienteId)

Ejemplo con curl:
```bash
curl -X POST {{baseUrl}}/api/pacientes -H "Content-Type: application/json" -d '{"nombre":"Juan Perez","telefono":"555-1234","correo":"juan@example.com"}'
```

2) Crear Médico (POST /api/medicos)
Encabezados:
- Content-Type: application/json
Body (JSON):
{
  "nombre": "Dr. Rafael Ortiz",
  "especialidad": "Pediatría",
  "telefono": "55-3344-2211",
  "correo": "rafael.ortiz@example.com"
}
Esperado: 201 Created → la respuesta incluye `_id` (guárdalo como medicoId)

3) Crear Cita (POST /api/citas)
Encabezados:
- Content-Type: application/json
Body (JSON) — sustituye los IDs con los devueltos antes:
{
  "paciente": "<pacienteId>",
  "medico": "<medicoId>",
  "fecha": "2025-12-15",
  "hora": "09:00",
  "estado": "Programada"
}
Esperado: 201 Created → objeto cita con `paciente` y `medico` poblados.

Ejemplo con curl:
```bash
curl -X POST {{baseUrl}}/api/citas -H "Content-Type: application/json" -d '{"paciente":"<pacienteId>","medico":"<medicoId>","fecha":"2025-12-15","hora":"09:00","estado":"Programada"}'
```

4) Crear Cita (error de validación) — formato de fecha inválido (espera 400)
Body ejemplo:
{
  "paciente": "<pacienteId>",
  "medico": "<medicoId>",
  "fecha": "15/12/2025",
  "hora": "09:00"
}
Esperado: 400 con `code: "VALIDATION_ERROR"` y un array `details`.

5) Crear Cita (conflicto) — mismo médico + fecha + hora (espera 409)
- Repite el paso 3 con el mismo `medico`, `fecha` y `hora`.
Esperado: 409 con `code: "CONFLICT"` y un mensaje sobre conflicto de horario.

6) Obtener todas las citas (GET /api/citas)
Esperado: 200 con un array de objetos cita.

Filtros y consultas
- Obtener solo las programadas: GET /api/citas?estado=Programada
  Esperado: 200 y un array de citas cuyo `estado` sea "Programada".

- Obtener citas desde una fecha (inclusive): GET /api/citas?desde=2025-11-10
  Esperado: 200 y un array de citas con `fecha` >= `2025-11-10` (usa YYYY-MM-DD).

- Combinar filtros: GET /api/citas?estado=Programada&desde=2025-11-01
  Esperado: 200 y citas programadas desde la fecha indicada.

Ejemplo con curl (con filtros):
```bash
curl "{{baseUrl}}/api/citas?estado=Programada&desde=2025-12-01"
```

7) Actualizar cita (PUT /api/citas/:id)
Encabezados:
- Content-Type: application/json
Body ejemplo para cambiar el estado:
{
  "estado": "Completada"
}
Esperado: 200 con el objeto actualizado.

Ejemplo con curl:
```bash
curl -X PUT {{baseUrl}}/api/citas/<citaId> -H "Content-Type: application/json" -d '{"estado":"Atendida"}'
```

8) Eliminar cita (DELETE /api/citas/:id) — CANCELACIÓN SUAVE (soft cancel)
Esperado: 200 y el objeto cita actualizado con `estado: "Cancelada"`, o 404 si no existe.

Para cancelar una cita (preservar historial) puedes:
- DELETE /api/citas/:id — marca `estado` = "Cancelada"
- o PUT /api/citas/:id con body { "estado": "Cancelada" }

Notas sobre herramientas
- Postman / Insomnia / Thunder Client: puedes importar peticiones como colección si prefieres interfaz gráfica.
- curl: útil para pruebas rápidas desde terminal.
- Si quieres, genero una colección (Postman/Thunder) que puedas importar.

Pruebas en tiempo real (opcional)
- Para ver eventos socket mientras ejecutas peticiones, abre una pequeña página HTML o usa Node con `socket.io-client`.
- Fragmento de ejemplo (pega en la consola del navegador o en un archivo HTML):

<script src="https://cdn.socket.io/4.7.2/socket.io.min.js"></script>
<script>
  const socket = io('http://localhost:3000');
  socket.on('connect', () => console.log('WS conectado', socket.id));
  socket.on('CITA_CREADA', data => console.log('CITA_CREADA', data));
  socket.on('CITA_ACTUALIZADA', data => console.log('CITA_ACTUALIZADA', data));
  socket.on('CITA_ELIMINADA', data => console.log('CITA_ELIMINADA', data));
</script>

Notas
- Usa los valores `_id` devueltos por los endpoints de creación para relacionar recursos.
- La validación usa fecha ISO `YYYY-MM-DD` y hora en formato `HH:mm` (24 horas).
- La detección de conflictos se implementa mediante un índice único en `medico+fecha+hora` y devuelve 409.

Si quieres, puedo generar un archivo de colección (Postman / Thunder Client) que puedas importar automáticamente. Dime y lo agrego a `tools/thunder-client/`.
