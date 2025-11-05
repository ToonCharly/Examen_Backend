Thunder Client quick guide for testing the Agenda Citas Backend

Base URL
- Use an environment variable in Thunder Client named `baseUrl` set to: http://localhost:3000

Suggested requests (copy body + headers into Thunder Client JSON requests)

1) Create Paciente (POST /api/pacientes)
Headers:
- Content-Type: application/json
Body (raw JSON):
{
  "nombre": "Juan Perez",
  "telefono": "555-1234",
  "correo": "juan@example.com"
}
Expected: 201 Created -> response body includes `_id` (save it as pacienteId)

2) Create Medico (POST /api/medicos)
Headers:
- Content-Type: application/json
Body (raw JSON):
{
  "nombre": "Dra. Gómez",
  "especialidad": "Cardiología",
  "telefono": "555-5678",
  "correo": "gomez@example.com"
}
Expected: 201 Created -> response body includes `_id` (save it as medicoId)

3) Create Cita (POST /api/citas)
Headers:
- Content-Type: application/json
Body (raw JSON) — replace IDs with the ones returned above:
{
  "paciente": "<pacienteId>",
  "medico": "<medicoId>",
  "fecha": "2025-11-10",
  "hora": "14:30",
  "estado": "Programada"
}
Expected: 201 Created -> cita object with populated `paciente` and `medico` objects.

4) Create Cita (validation error) — invalid fecha format (expect 400)
Body example:
{
  "paciente": "<pacienteId>",
  "medico": "<medicoId>",
  "fecha": "10-11-2025",
  "hora": "14:30"
}
Expected: 400 with `code: "VALIDATION_ERROR"` and `details` array.

5) Create Cita (conflict) — same medico + fecha + hora (expect 409)
- Repeat step 3 with same `medico`, `fecha`, `hora`.
Expected: 409 with `code: "CONFLICT"` and message about schedule conflict.

6) Get all citas (GET /api/citas)
Expected: 200 and an array of cita objects.

Filtering and queries
- Get only programadas: GET /api/citas?estado=Programada
  Expected: 200 and array of citas whose `estado` === "Programada".

- Get citas desde una fecha (inclusive): GET /api/citas?desde=2025-11-10
  Expected: 200 and array of citas con `fecha` >= `2025-11-10` (use YYYY-MM-DD).

- Combine filters: GET /api/citas?estado=Programada&desde=2025-11-01
  Expected: 200 and citas programadas desde la fecha indicada.

7) Update cita (PUT /api/citas/:id)
Headers:
- Content-Type: application/json
Body example to change estado:
{
  "estado": "Completada"
}
Expected: 200 with updated object.

8) Delete cita (DELETE /api/citas/:id) — SOFT CANCEL
Expected: 200 and the cita object updated with `estado: "Cancelada"`, or 404 if not found.

To cancel a cita (preserve history) you can:
- DELETE /api/citas/:id — marks `estado` = "Cancelada" (preferred for history)
- or PUT /api/citas/:id with body { "estado": "Cancelada" }

Thunder Client environment variables (recommended)
- baseUrl = http://localhost:3000

How to import quickly
- Create a new request in Thunder Client.
- Set method and URL using `{{baseUrl}}/api/citas` or other routes.
- Set header `Content-Type: application/json` and paste the JSON body.
- Save requests into a collection named `AgendaCitas` for reuse.

Realtime testing (optional)
- To see socket events while you run requests, open a small HTML page or use Node with `socket.io-client`.
- Example browser snippet (paste into the DevTools console or an HTML file):

<script src="https://cdn.socket.io/4.7.2/socket.io.min.js"></script>
<script>
  const socket = io('http://localhost:3000');
  socket.on('connect', () => console.log('WS connected', socket.id));
  socket.on('CITA_CREADA', data => console.log('CITA_CREADA', data));
  socket.on('CITA_ACTUALIZADA', data => console.log('CITA_ACTUALIZADA', data));
  socket.on('CITA_ELIMINADA', data => console.log('CITA_ELIMINADA', data));
</script>

Notes
- Use the `_id` values returned by creation endpoints for linking resources.
- Validation uses ISO date `YYYY-MM-DD` and time `HH:mm` 24-hour format.
- Conflict detection is enforced by a unique index on `medico+fecha+hora` and returns 409.

If you want, I can generate a Thunder Client collection file (.json) you can import automatically. Tell me and I'll add it to `tools/thunder-client/`.
