DOCUMENTACIÓN TÉCNICA
Sistema de Agenda de Citas Médicas
Arquitectura MVVM + Patrón Observer

ÍNDICE

1. Estructura del Proyecto por Carpetas
2. Archivos Principales del Sistema
3. Implementación de Arquitectura MVVM
4. Patrón Observer Aplicado
5. Operaciones CRUD Implementadas
6. Diagramas del Sistema
7. Justificación Técnica
    
===================================

1. ESTRUCTURA DEL PROYECTO POR CARPETAS

El proyecto está organizado siguiendo la arquitectura MVVM adaptada para backend, donde cada carpeta tiene una responsabilidad específica:

CARPETA Model/
Esta carpeta contiene toda la lógica relacionada con los datos y la estructura del sistema.

SUBCARPETA Model/Database/
- Archivo: connection.js
- Propósito: Maneja la conexión a MongoDB con reintentos automáticos
- Funcionalidad: Construye la URI de conexión desde variables de entorno, implementa reintentos con backoff exponencial, y permite iniciar sin base de datos para desarrollo
- Por qué existe: Centraliza la configuración de base de datos y maneja fallos de conexión de forma robusta

SUBCARPETA Model/Models/
Contiene los esquemas de datos definidos con Mongoose:

- Archivo: Paciente.js
  Propósito: Define la estructura de datos para pacientes
  Campos: nombre, telefono, correo
  Validaciones: campos obligatorios y formato de email

- Archivo: Medico.js
  Propósito: Define la estructura de datos para médicos
  Campos: nombre, especialidad, telefono, correo
  Validaciones: campos obligatorios y unicidad de correo

- Archivo: Cita.js
  Propósito: Define la estructura de datos para citas médicas
  Campos: paciente (referencia), medico (referencia), fecha, hora, estado
  Características especiales: Índice único para evitar conflictos de horario

- Archivo: Appointment.js
  Propósito: Modelo alternativo para citas con campos diferentes
  Uso: Sistema de citas más simple con validaciones básicas

SUBCARPETA Model/Repository/
Implementa el patrón Repository para acceso a datos:

- Archivo: citaRepository.js
  Propósito: Maneja todas las operaciones CRUD para citas
  Extiende: Clase Observable para notificar cambios
  Métodos principales: create, update, delete, listAll, listByFilter
  Características: Notifica observers en cada operación, maneja poblado de referencias

- Archivo: pacienteRepository.js
  Propósito: Operaciones CRUD para pacientes
  Funcionalidad: Crear, leer, actualizar y eliminar pacientes con notificaciones

- Archivo: medicoRepository.js
  Propósito: Operaciones CRUD para médicos
  Funcionalidad: Gestión completa de médicos con validaciones

- Archivo: appointmentRepository.js
  Propósito: Repository para el modelo Appointment
  Uso: Sistema alternativo de citas

SUBCARPETA Model/Services/
Contiene la lógica de negocio (ViewModel):

- Archivo: appointmentService.js
  Propósito: Implementa las reglas de negocio para citas
  Responsabilidades: Validaciones de negocio, detección de conflictos, coordinación entre repositories
  Extiende: Observable para propagar eventos de negocio
  Métodos: createAppointment, updateAppointment, cancelAppointment, validateAppointmentData

SUBCARPETA Model/Api/
Contiene la capa de presentación (View en MVVM):

- Archivo: citasRouter.js
  Propósito: Define endpoints REST para gestión de citas
  Endpoints: GET, POST, PUT, DELETE para /api/citas
  Características: Filtros por estado y fecha, soft-delete, validaciones de entrada

- Archivo: pacientesRouter.js
  Propósito: API REST para gestión de pacientes
  Funcionalidad: CRUD completo para pacientes

- Archivo: medicosRouter.js
  Propósito: API REST para gestión de médicos
  Funcionalidad: CRUD completo para médicos

- Archivo: appointmentsRouter.js
  Propósito: API alternativa para citas
  Uso: Endpoints adicionales del sistema

- Archivo: validators.js
  Propósito: Validaciones de entrada usando express-validator
  Responsabilidad: Verificar formato y contenido de datos recibidos
  Validaciones: Fechas ISO, horas en formato 24h, emails válidos

- Archivo: errorHandler.js
  Propósito: Manejo centralizado de errores
  Funcionalidad: Convierte errores internos a respuestas HTTP apropiadas
  Códigos manejados: 400 (validación), 404 (no encontrado), 409 (conflicto), 500 (servidor)

SUBCARPETA Model/Utils/
Contiene utilidades y patrones:

- Archivo: Observer.js
  Propósito: Implementa el patrón Observer
  Clases: Observable (clase base), EVENTS (constantes de eventos)
  Funcionalidad: Permite suscripción y notificación de eventos
  Uso: Base para repositories y services que notifican cambios

2. ARCHIVOS PRINCIPALES DEL SISTEMA

ARCHIVO: server.js (Raíz del proyecto)
Propósito: Punto de entrada principal del servidor
Responsabilidades:
- Configura Express.js con middlewares (CORS, Helmet, Morgan)
- Establece conexión con MongoDB
- Configura Socket.IO para comunicación en tiempo real
- Monta las rutas de la API
- Configura observers para reenviar eventos via WebSocket
- Maneja el inicio y cierre del servidor

Configuración de observers:
El archivo server.js crea un observer que escucha eventos de los repositories y services, y los reenvía a todos los clientes conectados via Socket.IO. Esto permite que los cambios en el sistema se reflejen automáticamente en las interfaces de usuario conectadas.

ARCHIVO: .env (Configuración)
Propósito: Variables de entorno para configuración
Contenido:
- MONGO_URI: Cadena de conexión completa a MongoDB
- MONGO_USER: Usuario de la base de datos (alternativo)
- MONGO_PASSWORD: Contraseña de la base de datos (alternativo)
- MONGO_HOST: Host del servidor MongoDB (alternativo)
- PORT: Puerto donde escucha el servidor (por defecto 3000)

ARCHIVO: package.json (Configuración del proyecto)
Propósito: Define dependencias y scripts del proyecto
Dependencias principales:
- express: Framework web
- mongoose: ODM para MongoDB
- socket.io: Comunicación en tiempo real
- express-validator: Validación de datos
- helmet: Seguridad HTTP
- cors: Control de acceso entre dominios
- morgan: Logging de peticiones HTTP
- dotenv: Manejo de variables de entorno

Scripts importantes:
- npm start: Inicia el servidor en producción
- npm run dev: Inicia con nodemon para desarrollo
- npm test: Ejecuta pruebas (preparado para Jest)

3. IMPLEMENTACIÓN DE ARQUITECTURA MVVM

MODELO (Model)
Responsabilidad: Gestión de datos y persistencia
Ubicación: Carpetas Model/Models/ y Model/Repository/
Características:
- Esquemas Mongoose definen estructura de datos
- Repositories manejan operaciones CRUD
- Notificación automática de cambios via Observer
- Validaciones a nivel de base de datos
- Índices únicos para prevenir conflictos

VISTA-MODELO (ViewModel)
Responsabilidad: Lógica de negocio y coordinación
Ubicación: Carpeta Model/Services/
Características:
- Valida reglas de negocio antes de persistir
- Coordina operaciones entre múltiples repositories
- Transforma datos entre formatos
- Implementa validaciones complejas
- Extiende Observable para notificar eventos

VISTA (View)
Responsabilidad: Interfaz de comunicación (API REST)
Ubicación: Carpeta Model/Api/
Características:
- Expone endpoints HTTP
- Valida formato de datos de entrada
- Serializa respuestas JSON
- Maneja códigos de estado HTTP apropiados
- Delega procesamiento a Services

FLUJO DE DATOS EN MVVM:
1. Cliente envía petición HTTP a API Router (View)
2. Router valida entrada y delega a Service (ViewModel)
3. Service aplica lógica de negocio y llama Repository (Model)
4. Repository persiste en base de datos y notifica Observer
5. Observer propaga evento via WebSocket a clientes conectados
6. Respuesta HTTP se envía al cliente original

4. PATRÓN OBSERVER APLICADO

DEFINICIÓN DEL PATRÓN:
El patrón Observer permite que un objeto (Subject) notifique automáticamente a una lista de dependientes (Observers) cuando su estado cambia, sin que el Subject conozca los detalles de sus Observers.

IMPLEMENTACIÓN EN EL SISTEMA:

CLASE OBSERVABLE:
- Mantiene lista de observers suscritos
- Método addObserver para suscribir nuevos observers
- Método removeObserver para cancelar suscripciones
- Método notifyObservers para enviar eventos a todos los suscritos
- Manejo de errores durante notificaciones

SUBJECTS (OBSERVABLES):
- CitaRepository: Notifica cuando se crean, actualizan o eliminan citas
- PacienteRepository: Notifica cambios en datos de pacientes
- MedicoRepository: Notifica cambios en datos de médicos
- AppointmentService: Notifica eventos de lógica de negocio

OBSERVERS (SUSCRIPTORES):
- WebSocket Observer: Reenvía eventos a clientes conectados via Socket.IO
- Console Observer: Registra eventos en logs del servidor (preparado)
- Email Observer: Envío de notificaciones por correo (preparado)
- Cache Observer: Invalidación de caché cuando hay cambios (preparado)

EVENTOS DEFINIDOS:
- CITA_CREADA: Se dispara al crear una nueva cita
- CITA_ACTUALIZADA: Se dispara al modificar una cita existente
- CITA_ELIMINADA: Se dispara al eliminar o cancelar una cita
- PACIENTE_CREADO: Se dispara al registrar un nuevo paciente
- MEDICO_CREADO: Se dispara al registrar un nuevo médico

VENTAJAS DE LA IMPLEMENTACIÓN:
- Desacoplamiento: Los repositories no conocen qué sistemas consumen sus eventos
- Extensibilidad: Fácil agregar nuevos observers sin modificar código existente
- Tiempo real: Los cambios se propagan inmediatamente a interfaces conectadas
- Mantenibilidad: Lógica de notificaciones separada de lógica de negocio

5. OPERACIONES CRUD IMPLEMENTADAS

CREAR (CREATE):
Endpoint: POST /api/citas
Proceso:
1. Router valida formato de datos de entrada
2. Service verifica reglas de negocio y conflictos
3. Repository guarda en base de datos
4. Observer notifica CITA_CREADA
5. WebSocket envía evento a clientes conectados
6. Se retorna respuesta 201 con objeto creado

Validaciones aplicadas:
- Formato de fecha (YYYY-MM-DD)
- Formato de hora (HH:MM en 24 horas)
- Existencia de paciente y médico
- Conflicto de horarios (médico ocupado)

LEER (READ):
Endpoints:
- GET /api/citas: Obtiene todas las citas
- GET /api/citas?estado=Programada: Filtra por estado
- GET /api/citas?desde=2025-12-01: Filtra desde fecha
- GET /api/citas/:id: Obtiene cita específica

Características:
- Población automática de referencias (paciente y médico)
- Filtros combinables
- Ordenamiento por fecha y hora
- Manejo de errores 404 para recursos no encontrados

ACTUALIZAR (UPDATE):
Endpoint: PUT /api/citas/:id
Proceso:
1. Router valida ID y datos de entrada
2. Service verifica que la cita existe
3. Service aplica validaciones de negocio
4. Repository actualiza en base de datos
5. Observer notifica CITA_ACTUALIZADA
6. Se retorna respuesta 200 con objeto actualizado

Casos de uso:
- Cambio de estado (Programada → Completada)
- Modificación de fecha y hora
- Actualización de observaciones

ELIMINAR (DELETE):
Endpoint: DELETE /api/citas/:id
Implementación: Soft Delete
Proceso:
1. Router valida ID de la cita
2. Service marca estado como "Cancelada"
3. Repository actualiza registro (no elimina físicamente)
4. Observer notifica CITA_ELIMINADA
5. Se retorna respuesta 200 con objeto actualizado

Ventajas del Soft Delete:
- Preserva historial médico
- Permite auditoría de cancelaciones
- Facilita reportes estadísticos
- Cumple con regulaciones de datos médicos

6. DIAGRAMAS DEL SISTEMA

DIAGRAMA DE CLASES:

Observable
- observers: Array
+ addObserver(observer)
+ removeObserver(observer)
+ notifyObservers(event, data)

CitaRepository extends Observable
- model: Cita
+ create(payload)
+ update(id, payload)
+ delete(id)
+ listAll()
+ listByFilter(filters)

AppointmentService extends Observable
- repository: CitaRepository
+ createAppointment(data)
+ updateAppointment(id, data)
+ cancelAppointment(id)
+ validateAppointmentData(data)

CitasRouter
- repository: CitaRepository
+ setupRoutes()
+ handleCreate(req, res)
+ handleUpdate(req, res)
+ handleDelete(req, res)
+ handleList(req, res)

DIAGRAMA DE SECUENCIA PARA CREAR CITA:

1. Cliente → Router: POST /api/citas (datos)
2. Router → Validators: validar formato
3. Validators → Router: validación OK
4. Router → Service: createAppointment(datos)
5. Service → Service: validateAppointmentData()
6. Service → Repository: findConflict(datos)
7. Repository → Service: no hay conflicto
8. Service → Repository: create(datos)
9. Repository → MongoDB: save()
10. MongoDB → Repository: documento guardado
11. Repository → Observer: notifyObservers(CITA_CREADA)
12. Observer → WebSocket: emit(CITA_CREADA)
13. WebSocket → Clientes: broadcast evento
14. Repository → Service: cita creada
15. Service → Router: cita creada
16. Router → Cliente: 201 Created + datos

DIAGRAMA DE COMPONENTES:

API Layer (Model/Api/)
├── Routers: Manejo de rutas HTTP
├── Validators: Validación de entrada
└── ErrorHandler: Manejo de errores

Service Layer (Model/Services/)
└── AppointmentService: Lógica de negocio

Repository Layer (Model/Repository/)
├── CitaRepository: Acceso a datos de citas
├── PacienteRepository: Acceso a datos de pacientes
└── MedicoRepository: Acceso a datos de médicos

Model Layer (Model/Models/)
├── Cita: Esquema de citas
├── Paciente: Esquema de pacientes
└── Medico: Esquema de médicos

Infrastructure Layer
├── Database: Conexión MongoDB
├── Observer: Patrón Observer
└── WebSocket: Comunicación tiempo real

7. JUSTIFICACIÓN TÉCNICA

ELECCIÓN DE TECNOLOGÍAS:

MongoDB vs SQL:
Se eligió MongoDB porque:
- Flexibilidad de esquemas para evolución futura
- Mejor rendimiento para operaciones de lectura frecuentes
- Soporte nativo para poblado de referencias
- Escalabilidad horizontal más sencilla
- JSON nativo facilita API REST

Socket.IO vs WebSockets nativos:
Se eligió Socket.IO porque:
- Fallback automático si WebSockets no está disponible
- Manejo automático de reconexiones
- Salas y namespaces para organizar conexiones
- Compatibilidad con navegadores antiguos
- Broadcasting simplificado

Express.js vs alternativas:
Se eligió Express porque:
- Ecosistema maduro y estable
- Middleware extenso disponible
- Documentación completa
- Comunidad activa
- Integración sencilla con Socket.IO

DECISIONES DE DISEÑO:

Patrón Repository:
- Abstrae acceso a datos del resto del sistema
- Facilita testing con mocks
- Permite cambio de base de datos sin afectar lógica
- Centraliza queries y optimizaciones

Separación en Services:
- Aísla lógica de negocio de infraestructura
- Facilita reutilización en diferentes contextos
- Simplifica testing unitario
- Mejora mantenibilidad

Validación Multicapa:
- Express-validator para formato de entrada
- Mongoose para restricciones de base de datos
- Services para reglas de negocio complejas
- Redundancia intencional para robustez

Soft Delete:
- Cumple regulaciones médicas de conservación
- Permite auditoría completa de acciones
- Facilita recuperación de errores
- Mantiene integridad referencial

ESCALABILIDAD PREPARADA:
- Índices de base de datos para consultas frecuentes
- Estructura preparada para microservicios
- Observer pattern permite agregar funcionalidades
- API REST stateless facilita balanceeo de carga
- WebSockets con identificadores de sesión

SEGURIDAD IMPLEMENTADA:
- Helmet.js para headers de seguridad HTTP
- Validación exhaustiva de entrada
- Sanitización de datos antes de persistir
- CORS configurado para dominios específicos
- Variables de entorno para credenciales

MANTENIBILIDAD:
- Estructura modular por responsabilidades
- Convenciones de nomenclatura consistentes
- Separación clara entre capas
- Documentación completa de API
- Logs estructurados para debugging

Esta implementación demuestra una arquitectura robusta, escalable y mantenible que cumple con todos los requisitos del proyecto y está preparada para crecimiento futuro.