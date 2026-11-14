# Plan Técnico de Frontend — Fase 2: Mapa, Geolocalización, Reseñas, Moderación, Notificaciones y Planes (PlanATi)

> **Destinatario de ejecución:** Claude Code (CLI).
> **Ubicación:** `PlanATi_Frontend/` (raíz del frontend).
> **Documento hermano:** `PlanATi_Backend/fase2-mapa-resenas-planes-backend.md`. Los contratos de API vienen de ahí; si difieren, manda la OpenAPI viva (`http://127.0.0.1:8000/docs`).
> **Base analizada:** rama `dev`, 2026-11-12.
> **Revisión 2 (2026-11-12):** el equipo confirmó como alcance obligatorio: horarios editables, tipo de establecimiento, favoritos, invitación a reseñar después del plan, "Agregar a Google Calendar" y descarga del evento (`.ics`) para el calendario del celular, protección de la clave de Google Maps, zona horaria de Colombia, datos demo en Cúcuta, aviso de privacidad y autorización de datos (Ley 1581 de 2012) y el **bloqueo del comentario** de una reseña por moderación.
> **Revisión 3 (2026-11-12):** se añade la **revisión de seguridad antes de publicar** (sección 3.5 y fase F9): token CSRF en las peticiones, HTTPS y topología de dominios, cabeceras de seguridad. Las demás propuestas quedan en la sección 15, "Por planificar".
> **Revisión 4 (2026-11-12):** **el MVP se ejecutará solo en local.** El token CSRF se implementa ahora (F0). HTTPS, topología de dominios, cabeceras de producción y la lista de verificación quedan en F9, que se ejecuta solo cuando se decida publicar.

---

## 0. Cómo usar este documento

1. **Antes de escribir código**, leer `AGENTS.md`: esta versión de Next.js (16.3.5) tiene cambios incompatibles. Guías mínimas en `node_modules/next/dist/docs/`:
   - `01-app/02-guides/environment-variables.md` (las `NEXT_PUBLIC_*` se incrustan en el build).
   - `01-app/02-guides/lazy-loading.md` (`next/dynamic` con `ssr: false` solo funciona dentro de Client Components).
   - `01-app/03-api-reference/01-directives/use-client.md`.
   - `01-app/03-api-reference/06-cli/next.md` (opción `--experimental-https` para probar geolocalización con HTTPS).
2. Ejecutar las fases **en orden** y sincronizadas con el backend:

   | Frontend | Backend | Tema |
   |---|---|---|
   | F0 | B0 | Base: dependencias, variables de entorno, utilidades |
   | F1 | B1 | Notificaciones |
   | F2 | B2 | Mapa y geolocalización **(cambio de contrato en `/establishments`)** |
   | F3 | B3 | Reseñas y puntuación **(cambio de contrato en el detalle)** |
   | F4 | B4 | Panel del establecimiento: reseñas, respuestas y horarios |
   | F5 | B5 | Administración y moderación |
   | F6 | B6 | Planes y recordatorios |
   | F7 | B7 | Favoritos y tipo de establecimiento |
   | F8 | B8 | Privacidad y datos personales (antes de publicar la app) |
   | F9 | B9 | Revisión de seguridad antes de publicar (**pendiente mientras el MVP sea local**; el token CSRF se implementa ya en F0) |
   | F10 | B10 | Opcional |

3. Al cerrar cada fase: `npm run lint`, `npx tsc --noEmit` y `npm run build` sin errores, más la lista de verificación manual de la sección 13 (no hay test runner).
4. Respetar las convenciones de `CLAUDE.md`: textos en español, sesión solo por cookie (`credentials: "include"`, nunca leer tokens), formularios divididos en `X.ts` (hook `useXForm`) + `X.tsx`, helpers de `lib/auth-api.ts`, `PlaceholderLink` para secciones que aún no existen.

---

## 1. Objetivo y alcance

### 1.1 Objetivos

1. **Mapa georreferenciado** con Google Maps: ver establecimientos en el mapa, ver los cercanos a la ubicación del usuario y navegar entre lista y mapa.
2. **Ubicación del establecimiento** al registrarse y al editar su perfil, por tres vías: GPS del dispositivo, escribir la dirección (autocompletado) o marcar el punto en el mapa; siempre con un pin arrastrable para el ajuste fino.
3. **Reseñas**: publicar, editar y eliminar (1–5 estrellas obligatorias; texto e imágenes opcionales), ver la puntuación, su distribución y la posición del local, y reportar contenido.
4. **Respuestas** del establecimiento desde su panel.
5. **Administración**: usuarios, establecimientos (incluido editar su perfil y catálogo como si fuera el establecimiento), moderación de contenido (incluido **bloquear el comentario** de una reseña, que en público se ve como "El comentario fue bloqueado por una violación a las políticas de la aplicación."), reportes, normas de la comunidad y bitácora.
6. **Notificaciones** en la campana y en una página propia.
7. **Planes**: agendar una visita (fecha, hora, personas, platos con cantidades, total), verla en un calendario, recibir el recordatorio en la app, **agregarla a Google Calendar o descargar el evento (`.ics`) para el calendario del celular**, y recibir la invitación a reseñar cuando pase.
8. **Complementos confirmados**: horarios editables por el establecimiento, favoritos y tipo de establecimiento.
9. **Privacidad y datos personales**: páginas de política de datos, términos y normas de la comunidad; aceptación obligatoria y sin casillas premarcadas al registrarse; nueva aceptación cuando cambia la versión; descarga de mis datos y eliminación de la cuenta.

### 1.2 Fuera de alcance

- Pagos, pedidos o reservas confirmadas por el establecimiento (ver D1 del backend).
- Notificaciones push nativas (Web Push queda en F10).
- Cambiar el flujo de Google OAuth o de verificación telefónica.

---

## 2. Diagnóstico del estado actual

| Área | Estado actual | Qué cambia |
|---|---|---|
| `app/(site)/explore/page.tsx` | Lista con búsqueda y categorías; el panel derecho (`<aside aria-label="Mapa">`, solo `lg`) muestra "Mapa próximamente". Promedio calculado con `averageRating()` desde `reviews` del listado. | Mapa real, cercanos, orden, vista móvil lista/mapa; promedio desde `rating_avg`. |
| `app/(site)/establishments/[id]/page.tsx` | Botón "Consultar ubicación" abre Google Maps externo; tarjeta "Ubicación" es un recuadro estático; reseñas de solo lectura con "Próximamente podrás dejar tu reseña"; autor siempre "Comensal de PlanATi"; usa `detail.reviews` completo. | Mini mapa, "Cómo llegar", resumen de puntuación, formulario de reseña, lista paginada, reportar, "Planear visita". |
| `app/(site)/page.tsx` (inicio) | Pide la ubicación al cargar y usa `/establishments/nearby`; arma "experiencias" con `menu_items` del listado. | Pedir ubicación con un gesto del usuario si no hay permiso; sección "Mejor puntuados". |
| `app/(auth)/restaurant/register` | Solo dirección de texto; sin coordenadas. | Sección "Ubicación" obligatoria con el selector de ubicación. |
| `app/(restaurant)/restaurant/profile/page.tsx` | Campos de latitud/longitud manuales y botón de detectar ubicación (`navigator.geolocation`). | Selector de ubicación con mapa; los campos manuales pasan a "Avanzado". |
| Panel del restaurante | Sin sección de reseñas; "Horarios" y "Soporte" son `PlaceholderLink`; el dashboard lee la puntuación del detalle público. | `/restaurant/reviews`, `/restaurant/schedules`, widgets nuevos. |
| Consola admin | "Resumen" y "Establecimientos"; "Solicitudes", "Usuarios", "Reseñas", "Configuración" son placeholders. La lista de establecimientos ya lee `?status=` de la URL. | Usuarios, reseñas, reportes, actividad, suspensión, "Gestionar como establecimiento". |
| `components/common/NotificationsBell.tsx` | Estado vacío fijo ("Estás al día"). Se usa en `Navbar` y `AreaTopBar`. | Contador, últimas notificaciones, página completa. |
| `Navbar` / `PublicBottomBar` | "Planes", "Mis Favoritos" y "Favoritos" son placeholders. | Enlaces reales en F6/F7. |
| `app/(site)/profile/page.tsx` | Datos personales y seguridad. | "Mis reseñas" y accesos a planes, favoritos y notificaciones. |
| `lib/auth-api.ts` | `get/post/patch/deleteAuthRequest`; aceptan `options: RequestInit` (sirve para pasar `signal`), pero no hay `put` ni envían token CSRF. | Añadir `putAuthRequest` y la cabecera `X-CSRF-Token` (3.5). |
| Peticiones fuera de los helpers | `LoginForm.tsx` hace un `fetch` `GET /auth/google` (no necesita token); `lib/api.ts` (`apiFetch`) no se usa; `lib/uploads.ts` sube con `XMLHttpRequest` directo a R2. | `apiFetch` se elimina o se reescribe sobre los helpers; la subida a R2 **no** lleva el token (no es nuestra API). |
| `proxy.ts` | Comprueba la cookie `access_token` en el dominio del frontend; en local funciona porque `localhost:3000` y `localhost:8000` comparten cookies. | En producción depende de la topología de dominios (3.5); el nombre de la cookie pasa a configuración. |
| `components/restaurant/ProductModal.tsx`, `ComboModal.tsx` | Llaman directamente a `createProduct`/`updateProduct` de `lib/restaurant-api.ts`. | Recibir la API por props para reutilizarlos desde el admin. |
| Dependencias | No hay librería de mapas ni variables de Google Maps. | Ver F0. |
| `components/layout/Footer.tsx` y formularios de registro | "Nosotros" y "Contacto" son placeholders; no hay política de datos, términos ni normas de la comunidad, ni casillas de aceptación en `RegisterForm`, `RestaurantRegisterForm` o `complete-profile`. | Páginas legales, enlaces en el pie y aceptación obligatoria (F8). |
| `.gitignore` | Ignora `.env*` salvo `.env.example`; `.env.local` nunca se subió a git (verificado). | Mantenerlo así: la clave de Maps vive solo en `.env.local` y en las variables del hosting. |

---

## 3. Decisiones técnicas

### 3.1 Google Maps

| Tema | Decisión |
|---|---|
| Librería | `@vis.gl/react-google-maps` (`APIProvider`, `Map`, `AdvancedMarker`, `Pin`, `InfoWindow`, `useMap`, `useMapsLibrary`) + `@googlemaps/markerclusterer` para agrupar marcadores + `@types/google.maps` (dev). Instalar la versión estable vigente y revisar su documentación al implementar. |
| Marcadores | `AdvancedMarker` (requiere **Map ID**). No usar `google.maps.Marker`, que está obsoleto. En desarrollo se puede usar `mapId="DEMO_MAP_ID"`. |
| Autocompletado de direcciones | **Places API (New)** con la API de datos `google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions(...)` y un input propio con el estilo de la app, usando `AutocompleteSessionToken` por sesión de búsqueda. No usar el widget heredado `google.maps.places.Autocomplete` (no está disponible para proyectos nuevos de Google Cloud). |
| Geocodificación inversa | `google.maps.Geocoder` (`useMapsLibrary("geocoding")`) para sugerir la dirección del punto elegido por GPS o pin. |
| Carga | Los componentes de mapa son Client Components y se cargan con `next/dynamic` (`ssr: false`) desde un Client Component, para no descargar el JS de Google en páginas que no lo usan. `APIProvider` se monta **solo** en las vistas con mapa, con `language="es"` y `region="CO"`. |
| Sin clave configurada | `MapUnavailable` muestra un aviso y la app sigue funcionando: la lista, el GPS del navegador, la dirección escrita a mano y el enlace externo a Google Maps no dependen de la clave. |
| Atribución | No ocultar el logo ni los avisos de Google en el mapa. Mostrar la atribución de Google junto a las sugerencias de Places cuando no se muestren sobre un mapa de Google. |

**Configuración y protección de la clave en Google Cloud (confirmado).** La hace una persona del equipo, no Claude Code. La clave de navegador siempre termina visible en el JavaScript del sitio (`NEXT_PUBLIC_`): no se puede ocultar, así que **la protección son las restricciones, las cuotas y las alertas**.

1. Crear el proyecto y activar facturación (obligatoria aunque se use solo la cuota gratuita).
2. Habilitar **solo** **Maps JavaScript API**, **Places API (New)** y **Geocoding API**.
3. Crear **dos claves separadas**, una para desarrollo y otra para producción:
   - Desarrollo: restricción por sitio web `http://localhost:3000/*` (y `https://localhost:3000/*` si se usa `--experimental-https`).
   - Producción: restricción por sitio web solo con el dominio real (`https://<dominio>/*`); sin comodines amplios como `*.vercel.app/*`.
   - En ambas, **restricción de API** a las tres APIs del paso 2.
4. Crear un **Map ID** de tipo JavaScript (vector) en "Map Management" por entorno; opcionalmente aplicarle un estilo con los colores de la marca.
5. **Cuotas diarias** por API (p. ej. carga de mapas, solicitudes de Autocomplete y de Geocoding) en "APIs y servicios → Cuotas", con un tope que el equipo pueda pagar; si alguien abusa de la clave, el servicio se corta en vez de generar cobros.
6. **Alertas de presupuesto** en Facturación al 50 %, 90 % y 100 % del monto mensual acordado, enviadas a dos personas del equipo.
7. La clave solo vive en `.env.local` (ignorado por git) y en las variables de entorno del hosting. Nunca en el repositorio, en el backend, en capturas, issues ni mensajes de chat.
8. Si una clave se filtra o hay consumo extraño: **regenerarla** en Google Cloud, actualizar `.env.local`/hosting y volver a desplegar (el valor queda incrustado en el build).
9. Revisar el consumo mensualmente en "Google Maps Platform → Métricas".

**Prácticas en el código que reducen consumo y abuso:**

- Montar `APIProvider` solo en vistas con mapa (no en el layout raíz).
- Usar `AutocompleteSessionToken` (una sesión por búsqueda de dirección) y esperar 300 ms entre teclas antes de pedir sugerencias; mínimo 3 caracteres.
- Geocodificación inversa solo cuando el pin se suelta (no mientras se arrastra).
- Recargar marcadores del mapa solo cuando la cámara se detiene, con espera de 400 ms.
- `lib/maps-config.ts` no registra la clave en consola ni la incluye en mensajes de error.

### 3.2 Geolocalización del navegador

- Solo funciona en **contexto seguro** (HTTPS o `localhost`). Probar desde un celular en `http://192.168.x.x:3000` **no** funciona: usar `next dev --experimental-https`, un túnel HTTPS o el despliegue de prueba.
- Hook `hooks/useGeolocation.ts` con estados `idle | prompting | granted | denied | unavailable | timeout | error`, la posición y su `accuracy`.
- Consultar primero `navigator.permissions?.query({ name: "geolocation" })`: si ya está concedido, obtener la posición sin preguntar; si no, mostrar un botón "Usar mi ubicación" y pedirla **solo tras el clic**. Si el usuario la deniega, explicar cómo activarla y usar el centro por defecto (Cúcuta).
- Opciones: para buscar cercanos `{ enableHighAccuracy: false, maximumAge: 300000, timeout: 10000 }`; para ubicar un establecimiento `{ enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }`.
- Guardar la última posición en `sessionStorage` (con `try/catch`) para no volver a pedirla en cada navegación.

### 3.3 Datos, fechas y estado

- Seguir el patrón actual: Client Components con `useEffect` y funciones de `lib/*-api.ts` sobre los helpers de `lib/auth-api.ts`. Añadir `putAuthRequest`; para cancelar peticiones del mapa y de búsquedas, pasar `{ signal }` en el `options: RequestInit` que los helpers ya aceptan.
- Zona horaria fija `America/Bogota` (UTC−5, sin horario de verano). `lib/datetime.ts` centraliza: formatear con `Intl.DateTimeFormat("es-CO", { timeZone: "America/Bogota", … })`, construir ISO con offset (`2026-11-20T19:30:00-05:00`), rangos de mes para el calendario y "hace X tiempo" (mover `timeAgo` del detalle aquí).
- El calendario se construye a mano con Tailwind (cuadrícula mensual + agenda); no hace falta una librería.
- Notificaciones por **polling** cada 60 s, solo con sesión y con la pestaña visible, más una consulta al recuperar el foco y tras acciones que generan notificaciones.

### 3.4 Variables de entorno (`.env.example`)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID=DEMO_MAP_ID
# Cúcuta
NEXT_PUBLIC_DEFAULT_MAP_CENTER=7.889100,-72.496700
NEXT_PUBLIC_DEFAULT_MAP_ZOOM=13
# sur,oeste,norte,este; igual que SERVICE_AREA_BOUNDS del backend
NEXT_PUBLIC_SERVICE_AREA_BOUNDS=-4.3,-81.8,13.6,-66.8
```

Leerlas en un único módulo `lib/maps-config.ts` con valores por defecto y validación. Recordar que se incrustan al hacer `next build`: cambiar `.env.local` exige reconstruir.

Variables de servidor (sin `NEXT_PUBLIC_`, no llegan al navegador):

```env
# Debe coincidir con ACCESS_TOKEN_COOKIE_NAME del backend; proxy.ts la lee
SESSION_COOKIE_NAME=access_token
# Solo con la topología de mismo dominio (3.5): destino de los rewrites /api/v1/*
BACKEND_ORIGIN=http://localhost:8000
```

### 3.5 Seguridad antes de publicar (confirmado)

Contraparte de las secciones 9.1–9.5 del plan del backend.

**Token CSRF** (se implementa en **F0**, junto con B0; sin esto, todas las escrituras del frontend reciben 403 en cuanto el backend active la protección):

- `lib/csrf.ts` guarda el token **solo en memoria** (variable del módulo; nunca en `localStorage`, `sessionStorage` ni en una cookie legible).
- Se carga desde `csrf_token` en las respuestas de login, registro, registro de restaurante y canje de Google, y con `GET /auth/csrf` cuando `AuthProvider` encuentra sesión al cargar la página.
- `postAuthRequest`, `patchAuthRequest`, `putAuthRequest`, `deleteAuthRequest` y `logoutUser` añaden `X-CSRF-Token` si hay token.
- Si la respuesta es 403 con `code: "CSRF_FAILED"`: pedir un token nuevo con `GET /auth/csrf` y **reintentar una sola vez**; si vuelve a fallar, mostrar "La solicitud fue rechazada por seguridad. Recarga la página e inténtalo de nuevo."
- `clear()` del `AuthProvider` y el logout borran el token.
- No enviar el token a terceros: la subida a R2 (`XMLHttpRequest` en `lib/uploads.ts`) y Google Maps quedan sin esa cabecera.
- El navegador envía `Origin` por su cuenta; no hay que tocarlo. Mantener la política de `Referer` por defecto (`strict-origin-when-cross-origin`), que el backend usa como respaldo.

**HTTPS y topología de dominios** (decisión D12 del backend):

- **MVP local:** no aplica todavía. Se sigue usando `http://localhost:3000` y `http://localhost:8000` (la cookie no lleva `Secure` en desarrollo). Para probar la geolocalización desde un celular, usar `next dev --experimental-https` o un túnel HTTPS (3.2). Lo siguiente se aplica en F9, al publicar.
- En producción todo se sirve por `https://` (también lo exige la geolocalización).
- **Recomendado: mismo dominio.** La app en `https://<dominio>` y la API en `https://<dominio>/api/v1`, con un *reverse proxy* o con `rewrites` en `next.config.ts` hacia `BACKEND_ORIGIN` (leer `node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/rewrites.md`). Entonces `NEXT_PUBLIC_API_URL=/api/v1`, la cookie es del mismo sitio y `proxy.ts` la ve. En este caso, **excluir `/api/` del caché de `public/sw.js`** (ver sección 10).
- Alternativa: API en `api.<dominio>`; el backend debe emitir la cookie con `Domain=<dominio>` para que `proxy.ts` la reciba.
- Sin una de las dos, en producción `proxy.ts` no ve la cookie y todas las rutas protegidas redirigen al login.
- `proxy.ts` lee el nombre de la cookie de `SESSION_COOKIE_NAME` (por si el backend la renombra, p. ej. a `__Host-planati_session`).

**Cabeceras de seguridad** en `next.config.ts` → `headers()` (leer `.../01-next-config-js/headers.md`), para todas las rutas:

| Cabecera | Valor |
|---|---|
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` (solo en producción) |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `X-Frame-Options` | `DENY` |
| `Permissions-Policy` | `geolocation=(self), camera=(), microphone=()` |

Una Content-Security-Policy completa queda opcional (debe permitir Google Maps y R2; ver sección 10).

**Secretos:** el frontend no guarda ningún secreto. Todo lo que empieza por `NEXT_PUBLIC_` es público; la clave de Maps se protege con sus restricciones (3.1). La clave secreta del backend, las credenciales de la base de datos y las copias de seguridad no tienen nada que ver con este repositorio.

---

## 4. Rutas y navegación

### 4.1 Rutas nuevas y modificadas

| Ruta | Tipo | Actor | Contenido |
|---|---|---|---|
| `/explore` | modificar | todos | Lista + mapa, "Cerca de mí", orden, filtros, vista móvil Lista/Mapa. Estado en la URL (`?view=map&sort=…`). |
| `/establishments/[id]` | modificar | todos | Mini mapa y "Cómo llegar", resumen de puntuación, reseñas paginadas, formulario, reportar, "Planear visita", favorito. Anclas `#reviews` y `#review-{id}`; `?review=1` abre el formulario (viene de la invitación a reseñar tras un plan). |
| `/` | modificar | todos | Cercanos con permiso explícito; "Mejor puntuados". |
| `/notifications` | nueva | con sesión | Bandeja completa paginada. |
| `/plans` | nueva | `user` | Calendario mensual + próximos planes. |
| `/plans/new?establishment={id}` | nueva | `user` | Asistente para crear un plan. |
| `/plans/[id]` | nueva | `user` | Detalle, editar, cancelar, eliminar, mapa, menú "Agregar al calendario" (Google Calendar y archivo `.ics`). |
| `/plans/[id]/edit` | nueva | `user` | Asistente en modo edición. |
| `/favorites` | nueva (F7) | `user` | Establecimientos favoritos. |
| `/profile` | modificar | `user` | "Mis reseñas", accesos rápidos y sección **"Privacidad y datos"** (versiones aceptadas, descargar mis datos, eliminar cuenta). |
| `/account-suspended` | nueva | sesión suspendida | Motivo de la suspensión y cerrar sesión. |
| `/legal/privacy` | nueva | todos | Política de tratamiento de datos personales (Server Component estático, con versión y fecha). |
| `/legal/terms` | nueva | todos | Términos y condiciones de uso. |
| `/legal/community-guidelines` | nueva | todos | Normas de la comunidad: qué se puede publicar, categorías de moderación y qué pasa con el contenido bloqueado. Destino del enlace "Ver normas" en los comentarios bloqueados. |
| `/restaurant/register` | modificar | visitante | Sección "Ubicación" obligatoria. |
| `/restaurant/status` | modificar | `restaurant` | Estado `SUSPENDED` con motivo; la re-aplicación incluye ubicación. |
| `/restaurant/dashboard` | modificar | `restaurant` | Widgets de puntuación, reseñas sin responder y avisos de ubicación/horarios faltantes. |
| `/restaurant/profile` | modificar | `restaurant` | Selector de ubicación; `establishment_type` (F7). |
| `/restaurant/reviews` | nueva | `restaurant` | Reseñas, resumen y respuestas. |
| `/restaurant/schedules` | nueva | `restaurant` | Editor de horarios semanal. |
| `/admin/dashboard` | modificar | `admin` | Indicadores nuevos. |
| `/admin/users`, `/admin/users/[id]` | nuevas | `admin` | Listado con filtros y detalle con acciones. |
| `/admin/establishments` | modificar | `admin` | Filtro `SUSPENDED`, puntuación, "sin ubicación", reportes abiertos. |
| `/admin/establishments/[id]` | modificar | `admin` | Suspender/reactivar, mapa de ubicación, acceso a "Gestionar". |
| `/admin/establishments/[id]/manage` | nueva | `admin` | Pestañas Perfil, Productos, Combos, Fotos, Horarios editando como el establecimiento. |
| `/admin/reviews` | nueva | `admin` | Moderación de reseñas. |
| `/admin/reports` | nueva | `admin` | Cola de reportes. |
| `/admin/activity` | nueva | `admin` | Bitácora de moderación. |

### 4.2 Menús

- **`Navbar` (`LINKS`)**: "Planes" → `/plans` (F6); "Mis Favoritos" → `/favorites` (F7). Mientras no existan, siguen como `PlaceholderLink`.
- **`PublicBottomBar`** (móvil): Inicio, Explorar, **Planes**, Favoritos, Perfil (cinco pestañas). **[DECISIÓN F-D1]**
- **Restaurante (`NAV_ITEMS`)**: Panel Principal, Perfil de Comercio, Menú y Productos, Combos y Promociones, Galería y Fotos, **Reseñas** (`MessageSquare`, con contador de sin responder), **Horarios** (`/restaurant/schedules`), Soporte (placeholder).
  **`TAB_ITEMS`** móvil: Panel, Menú, Reseñas, Fotos, Perfil (Combos queda accesible desde "Menú" y la barra lateral). **[DECISIÓN F-D2]**
- **Admin (`NAV_ITEMS`)**: Resumen, Establecimientos, Solicitudes (→ `/admin/establishments?status=PENDING`), Usuarios, Reseñas, Reportes (con contador de abiertos), Actividad, Configuración (placeholder).
  **`TAB_ITEMS`** móvil: Resumen, Locales, Usuarios, Reseñas, Reportes.

### 4.3 Protección

- `proxy.ts`: añadir `"/plans/:path*"`, `"/notifications"` y `"/favorites"` al `matcher` (solo comprueba que exista la cookie).
- Componente `components/common/RequireRole.tsx` (usa `useAuth()`): las páginas de planes y favoritos exigen rol `user` y redirigen a restaurantes y admins a su panel; un `user` con teléfono sin verificar va a `/complete-profile`.
- `AuthProvider`: si `/users/me` responde 403 con `code: "ACCOUNT_SUSPENDED"`, guardar `suspended: { reason }` en el contexto y redirigir a `/account-suspended` (desde `ApiError.data`).
- `ConsentGate` (montado bajo `AuthProvider`): si `user.pending_consents` no está vacío, o una petición responde 403 `code: "CONSENT_REQUIRED"`, muestra un modal que no se puede cerrar con la nueva versión de la política y los términos; solo deja aceptar o cerrar sesión. No aparece en `/legal/*`, para poder leer los textos.
- `Footer`: enlaces reales a `/legal/privacy`, `/legal/terms` y `/legal/community-guidelines`.
- Layout del restaurante: `SUSPENDED` se trata como `REJECTED` (solo `/restaurant/status`), pero sin formulario de re-aplicación.

---

## 5. Capa de API (`lib/`)

| Archivo | Cambios |
|---|---|
| `lib/auth-api.ts` | `putAuthRequest`; cabecera `X-CSRF-Token` y reintento único ante `CSRF_FAILED` en todos los helpers de escritura y en `logoutUser` (3.5); `AuthResponse` añade `csrf_token`. |
| `lib/csrf.ts` (nuevo, F0) | `getCsrfToken`, `setCsrfToken`, `clearCsrfToken`, `refreshCsrfToken()` (`GET /auth/csrf`). |
| `lib/establishments-api.ts` | **[⇄ B2/B3]** Tipos: quitar `reviews` del listado; añadir `rating_avg`, `rating_count`, `ranking_score`, `establishment_type`, `city`, `location_source`, `google_place_id`. Detalle: `recent_reviews`, `rating_distribution`, `category_rank`, `viewer_review`, `viewer_can_review`, `viewer_review_block`, `is_favorite`. Eliminar `averageRating()` y usar `rating_avg` (lo usan `explore` e inicio). Funciones nuevas o ampliadas: `searchEstablishments({ search, category, establishmentType, minRating, sort, skip, limit })`, `searchNearbyEstablishments({ …, sort, category, minRating })`, `getMapMarkers(bounds, filters, signal)`. Constantes `ESTABLISHMENT_TYPES` con etiquetas en español. |
| `lib/reviews-api.ts` (nuevo) | Tipos `ReviewAuthor`, `Review` (con `comment_blocked` y `moderation_notice`, también en `reply`), `MyReview` (texto original, `comment_status`, `moderation_category`, `moderation_reason`, `flagged_for_review`), `Page<T>`, `RatingDistribution`. Funciones `listEstablishmentReviews`, `createReview`, `updateReview`, `deleteReview`, `listMyReviews`. Constante `MODERATION_CATEGORY_LABEL` con las etiquetas en español de la sección 5.3 del backend. |
| `lib/uploads.ts` | Añadir la carpeta `"reviews"` a `ImageFolder`, que pide la URL a `POST /reviews/upload-url`. |
| `lib/reports-api.ts` (nuevo) | `createReport({ target_type, target_id, reason, details })` y etiquetas de motivos. |
| `lib/restaurant-api.ts` | Campos de ubicación en `RestaurantRegisterPayload`, `RestaurantProfileUpdate` y `RestaurantProfile`; `EstablishmentStatus` con `SUSPENDED`; `listRestaurantReviews`, `getRestaurantReviewSummary`, `upsertReviewReply`, `deleteReviewReply`, `getSchedules`, `putSchedules`. |
| `lib/management-api.ts` (nuevo) | Interfaz `EstablishmentManagementApi` (perfil, productos, combos, imágenes, horarios, carpeta de subida) con dos implementaciones: `restaurantManagementApi` (rutas `/restaurant/*`) y `adminManagementApi(establishmentId)` (rutas `/admin/establishments/{id}/*`). |
| `lib/admin-api.ts` | Usuarios (`listAdminUsers`, `getAdminUser`, `updateUserRole`, `suspendUser`, `reactivateUser`, `notifyUser`); establecimientos (`suspendEstablishment`, `reactivateEstablishment`, `updateEstablishmentAsAdmin`); moderación (`listAdminReviews`, `blockReviewComment`, `unblockReviewComment`, `hideReview`, `restoreReview`, `deleteReviewAsAdmin`, `blockReply`, `unblockReply`, `deleteReviewImage`); reportes (`listReports`, `resolveReport`, `dismissReport`); `listModerationActions`; tipo del dashboard ampliado; `warnings` en `EstablishmentDecision`. |
| `lib/notifications-api.ts` (nuevo) | `listNotifications`, `getUnreadCount`, `markNotificationRead`, `markAllNotificationsRead`, `deleteNotification`; tipo `NotificationType`. |
| `lib/plans-api.ts` (nuevo) | Tipos `PlanListItem`, `PlanDetail`, `PlanPayload`; `listPlans({ from, to, status })`, `getPlan`, `createPlan`, `updatePlan`, `cancelPlan`, `deletePlan`, `planIcsUrl(id)`. |
| `lib/favorites-api.ts` (nuevo, F7) | `listFavorites`, `addFavorite`, `removeFavorite`. |
| `lib/privacy-api.ts` (nuevo, F8) | `getLegalVersions`, `listMyConsents`, `acceptConsents`, `exportMyDataUrl()` (ruta del JSON), `sendDeleteAccountCode`, `deleteMyAccount`. `UserProfile` (en `auth-api.ts`) añade `pending_consents`. Los payloads de registro añaden `accept_privacy_policy`, `accept_terms`, `privacy_policy_version`, `terms_version` (sin `is_adult`: no hay edad mínima, D10 confirmada en B8). |
| `lib/legal.ts` (nuevo, F8) | `PRIVACY_POLICY_VERSION` y `TERMS_VERSION` de los textos publicados en `/legal/*`; deben coincidir con las del backend (`GET /legal/versions` permite detectar desajustes en desarrollo). |
| `lib/geo.ts` (nuevo) | `haversineKm` (para mostrar distancias en cliente), `formatDistance` ("850 m", "2,3 km"), `parseLatLng`, `isInsideServiceArea`, `boundsToQuery`, `directionsUrl(lat, lng, placeId?)` → `https://www.google.com/maps/dir/?api=1&destination=…`. |
| `lib/datetime.ts` (nuevo) | Ver 3.3. Más `googleCalendarUrl(plan)` → `https://calendar.google.com/calendar/render?action=TEMPLATE&text=…&dates=…/…&details=…&location=…` (duración por defecto 2 h). |
| `lib/format.ts` | `SUSPENDED` en `ESTABLISHMENT_STATUS_LABEL` y `ESTABLISHMENT_STATUS_CLASS` (TypeScript lo exigirá); etiquetas de estados de plan y de reseña. |

**Recomendación:** generar los tipos desde la OpenAPI con `openapi-typescript` (`lib/api-types.ts`) para no desincronizarse del backend; las funciones de `lib/*-api.ts` seguirían siendo manuales.

---

## 6. Componentes

### 6.1 Mapa y ubicación (`components/map/`)

| Componente | Responsabilidad |
|---|---|
| `MapsProvider.tsx` | Envuelve `APIProvider` con la clave, `language="es"`, `region="CO"`; si falta la clave renderiza `MapUnavailable`. |
| `EstablishmentsMap.tsx` | Mapa del directorio. Pide marcadores a `/establishments/map` con los límites visibles en el evento `idle` (o `onCameraChanged` con espera de 400 ms) cancelando la petición anterior; agrupa con `MarkerClusterer` cuando hay muchos; selección sincronizada con la lista (hover/foco en tarjeta ↔ marcador resaltado); `InfoWindow` con foto, nombre, ★ promedio (conteo), categoría, distancia y "Ver detalle"; aviso si la respuesta viene `truncated`. |
| `EstablishmentMarker.tsx` | `AdvancedMarker` con pin propio: color por tipo/categoría y burbuja con la puntuación. Accesible: `title` con nombre y puntuación. |
| `UserLocationMarker.tsx` | Punto azul de la ubicación del usuario con círculo de precisión. |
| `LocationPicker.tsx` (+ `LocationPicker.ts`) | Selector de ubicación del establecimiento (ver 7.2). Devuelve `{ latitude, longitude, address?, city?, google_place_id?, location_source }`. |
| `PlaceAutocompleteInput.tsx` | Input propio sobre `AutocompleteSuggestion`: restringido a Colombia (`includedRegionCodes: ["co"]`), sesgo hacia el centro configurado, espera de 300 ms, navegación con teclado (`role="combobox"`/`listbox`). Al elegir: `toPlace()` + `fetchFields({ fields: ["id", "location", "formattedAddress", "addressComponents"] })`. |
| `StaticLocationMap.tsx` | Mapa pequeño de un solo punto (detalle, plan, admin), sin gestos de zoom, con botones "Cómo llegar" y "Abrir en Google Maps". |
| `MapUnavailable.tsx` | Estado sin clave o con error de carga. |
| `hooks/useGeolocation.ts` | Ver 3.2. |

### 6.2 Reseñas (`components/reviews/`)

| Componente | Responsabilidad |
|---|---|
| `StarRating.tsx` | Solo lectura; reemplaza al `Stars` local del detalle. Admite medias estrellas para promedios. |
| `StarRatingInput.tsx` | Grupo de radios accesible (1–5) con flechas del teclado, vista previa al pasar el cursor y etiquetas ("1: Muy malo" … "5: Excelente"). |
| `RatingSummary.tsx` | Promedio grande, total de reseñas, barras de distribución 5→1 (clic filtra la lista) y, si existe, "#N en {categoría}". |
| `ReviewForm.tsx` + `ReviewForm.ts` | Crear/editar. Estrellas obligatorias; comentario opcional con contador (máx. 2000); hasta 5 imágenes subidas al seleccionarlas (`uploadImage("reviews", …)`, `validateImageFile`) con progreso y opción de quitar; botón deshabilitado mientras suben. |
| `ReviewList.tsx` | Lista paginada ("Cargar más") con orden (Recientes, Mejor puntuación, Peor puntuación) y filtros (estrellas, "Con fotos"). |
| `ReviewCard.tsx` | Extraído del detalle: avatar y `display_name`, fecha relativa, "(editada)", estrellas, texto, miniaturas con visor, respuesta del establecimiento y menú de acciones (editar/eliminar si es el autor; reportar si no). Ancla `id="review-{id}"`. Si `comment_blocked`, en lugar del texto muestra `BlockedContentNotice`; lo mismo para la respuesta. |
| `BlockedContentNotice.tsx` | Recuadro gris con ícono `ShieldAlert`, el texto de `moderation_notice` ("El comentario fue bloqueado por una violación a las políticas de la aplicación.") en cursiva y el enlace "Ver normas de la comunidad". Nunca intenta mostrar el texto original. |
| `MyBlockedReviewBanner.tsx` | Para el autor (en el detalle y en "Mis reseñas"): "Tu comentario fue bloqueado por: {categoría}. {nota del admin}. Solo tú ves el texto original." Si lo reescribe: "Un administrador revisará tu nuevo comentario antes de publicarlo." |
| `ReplyEditor.tsx` | Para el panel del restaurante: escribir, editar o eliminar la respuesta (máx. 1000). |
| `ReportDialog.tsx` | Motivo (radio) + detalle opcional; reutilizable para reseñas, respuestas, imágenes y establecimientos. |
| `ImageLightbox.tsx` | Visor de imágenes a pantalla completa (sobre `components/ui/Modal.tsx`). |

### 6.3 Notificaciones (`components/notifications/`)

| Componente | Responsabilidad |
|---|---|
| `NotificationsProvider.tsx` | Montado en `app/layout.tsx` dentro de `AuthProvider`. Expone `useNotifications()` → `{ unreadCount, latest, refresh, markRead, markAllRead }`. Polling de `/notifications/unread-count` cada 60 s con la pestaña visible; recarga las últimas 5 al abrir la campana. |
| `NotificationsBell.tsx` (modificar) | Insignia con el contador (`99+`), últimas 5 con no leídas resaltadas, "Marcar todas como leídas" y "Ver todas" → `/notifications`. Al hacer clic: marcar leída y navegar a `link`. |
| `NotificationItem.tsx` | Ícono por tipo, título, cuerpo, fecha relativa. |

### 6.4 Planes (`components/plans/`)

| Componente | Responsabilidad |
|---|---|
| `PlanBuilder.tsx` + `PlanBuilder.ts` | Asistente (ver 7.6) para crear o editar. |
| `TimeSlotPicker.tsx` | Fecha (`<input type="date">`) + franjas de 30 min generadas a partir de los horarios del local (soporta tramos que cruzan la medianoche); días cerrados deshabilitados; si el local no tiene horarios, `<input type="time">` libre con aviso. |
| `MenuItemPicker.tsx` | Productos y combos disponibles con foto, precio y selector de cantidad (1–99) y nota por ítem. |
| `PlanSummary.tsx` | Resumen fijo (barra inferior en móvil): ítems, personas, total en COP (`formatCop`) y aviso "El total es estimado; el establecimiento puede cambiar sus precios". |
| `ReminderSelect.tsx` | Sin recordatorio, 15 min, 30 min, 1 h, 2 h, 1 día; deshabilita las opciones que quedarían en el pasado. |
| `PlansCalendar.tsx` | Cuadrícula mensual (lunes primero) con puntos por día; al elegir un día muestra su agenda. Pide `/plans?from&to` con el rango visible (máx. 42 días). |
| `PlanCard.tsx`, `PlanStatusBadge.tsx` | Tarjeta de plan y estado (Programado, Cancelado, Completado). |
| `AddToCalendarMenu.tsx` | Botón "Agregar al calendario" con tres opciones: **Google Calendar** (abre `googleCalendarUrl(plan)` en otra pestaña), **iPhone / Apple Calendar** y **Outlook u otro calendario** (ambas descargan el `.ics`). El orden se adapta al dispositivo: en Android, Google Calendar primero; en iPhone/iPad, el `.ics` primero. Debajo, una ayuda corta: "En Android usa Google Calendar; en iPhone, el archivo se abre directamente en Calendario". |

**Cómo descargar el `.ics`:** usar un enlace normal (`<a href={planIcsUrl(id)}>`) a `GET /plans/{id}/calendar.ics` y **no** un `Blob` creado con `fetch`. Safari en iPhone abre el diálogo "Añadir a Calendario" solo con una navegación real a una respuesta `text/calendar`. La cookie de sesión viaja en esa navegación porque la API y el frontend son el mismo sitio (en local, `localhost` con otro puerto; en producción, mismo dominio base). Si en producción quedaran en sitios distintos, generar el `.ics` en el cliente como respaldo.

**`googleCalendarUrl(plan)`** (en `lib/datetime.ts`): `https://calendar.google.com/calendar/render?action=TEMPLATE&text={título}&dates={inicio UTC}/{fin UTC}&details={personas, platos, total y enlace al plan}&location={local, dirección}`, con fechas en formato `YYYYMMDDTHHmmssZ`, valores codificados con `encodeURIComponent` y duración de 2 h. Ese enlace no agrega la alarma; el `.ics` sí la incluye.

### 6.5 Gestión de establecimiento reutilizable (`components/establishment-management/`)

Extraer el cuerpo de las páginas del panel del restaurante a componentes que reciben `api: EstablishmentManagementApi`:
`ProfileEditor`, `ProductsManager`, `CombosManager`, `GalleryManager`, `SchedulesEditor`. `ProductModal` y `ComboModal` reciben también `api`.
Las páginas de `app/(restaurant)/restaurant/*` quedan como envoltorios con `restaurantManagementApi`; `/admin/establishments/[id]/manage` usa `adminManagementApi(id)` y muestra un aviso fijo: "Estás editando como administrador. El establecimiento será notificado." con un campo opcional de motivo.

### 6.6 Administración (`components/admin/`)

`ConfirmWithReasonModal` (motivo obligatorio de 5 a 1000 caracteres; para suspender, borrar, rechazar), `ModerationActionModal` (para bloquear comentario/respuesta y ocultar reseña: **categoría obligatoria** de `MODERATION_CATEGORY_LABEL`, nota opcional para el autor, casilla "Quitar también las imágenes" y **vista previa** de cómo lo verá el público con `BlockedContentNotice`), `AdminUsersTable`, `ModerationReviewCard` (texto original siempre visible para el admin, estado del comentario, autor, local, reportes y acciones), `ReportCard` (vista previa del destino y acciones Resolver/Descartar), `ActivityTable`, `NotifyUserModal`.

### 6.7 Comunes

`Pagination`/"Cargar más", `EmptyState`, `RequireRole`, `Tabs` accesibles. Reutilizar `Modal`, `Avatar`, `ImageUploadField`, `BrandMark`, `formatCop` y la paleta actual (`#514ddd`, `#17243d`, `#d6154a`, `#5df0dc`…).

### 6.8 Privacidad (`components/privacy/`, F8)

| Componente | Responsabilidad |
|---|---|
| `ConsentCheckboxes.tsx` | Casillas **sin marcar por defecto**: "He leído y acepto la [Política de tratamiento de datos personales] y autorizo el tratamiento de mis datos para las finalidades allí descritas", "Acepto los [Términos y condiciones] y las [Normas de la comunidad]" (sin casilla de mayoría de edad: D10 confirmada en B8). Enlaces en pestaña nueva. Sin las dos marcadas no se puede enviar. Se usa en `RegisterForm`, `RestaurantRegisterForm` y `CompleteProfileForm` (cuentas de Google). |
| `ConsentGate.tsx` | Modal de nueva aceptación (ver 4.3), con un resumen de qué cambió. |
| `LocationPurposeNote.tsx` | Texto corto junto a "Usar mi ubicación" y "Cerca de mí": "Usamos tu ubicación solo para mostrarte lugares cercanos; no la guardamos." En el registro del establecimiento: "La ubicación de tu local será pública en el mapa." |
| `PrivacySettings.tsx` | Sección de `/profile`: versiones aceptadas y fecha, "Descargar mis datos" (enlace directo al JSON), enlaces a los textos legales y "Eliminar mi cuenta". |
| `DeleteAccountDialog.tsx` | Explica qué se borra (reseñas, planes, favoritos, notificaciones) y que no se puede deshacer; pide escribir **ELIMINAR** y la contraseña o, en cuentas de Google, el código SMS (`sendDeleteAccountCode`, reutilizando `PhoneCodePanel`). Tras eliminar: `clear()` del `AuthProvider` y redirección al inicio con un mensaje. Para `restaurant`/`admin` muestra "Solicita la eliminación a soporte". |

---

## 7. Flujos de usuario

### 7.1 Explorar con mapa y cercanos (`/explore`)

1. Al entrar, si el permiso de ubicación ya está concedido se obtiene la posición sin preguntar; si no, aparece el chip **"Cerca de mí"**, que la pide al tocarlo.
2. **Escritorio (`lg+`):** lista a la izquierda (como hoy) y mapa a la derecha en lugar de "Mapa próximamente". **Móvil/tablet:** botón flotante "Mapa"/"Lista"; en modo mapa, la tarjeta del marcador elegido aparece como hoja inferior.
3. El mapa se centra en el usuario o en Cúcuta. Al moverlo, se recargan los marcadores del área visible.
4. Con "Cerca de mí" activo, la lista usa `/establishments/nearby` (radio 1, 3, 5 o 10 km) y muestra la distancia en cada tarjeta; sin él, `/establishments` con el orden elegido.
5. Orden: Relevancia (cercanos), Mejor posicionados (`ranking`), Mejor puntuados, Más reseñas, Más cercanos. Filtros: categoría (ya existe), tipo de establecimiento (F7), puntuación mínima.
6. Pasar el cursor o enfocar una tarjeta resalta su marcador; tocar un marcador desplaza la lista a su tarjeta.
7. Estado en la URL (`?view=map&sort=ranking&near=1`) para compartir y para el botón "atrás"; mantener el patrón de `key` que ya usa la página para remontar con nuevos parámetros.
8. Accesibilidad: la lista sigue siendo la alternativa completa al mapa; el mapa tiene `aria-label` y los marcadores son botones con título.

### 7.2 Ubicar el establecimiento (`LocationPicker`)

Se usa en el registro del restaurante, en `/restaurant/profile`, en la re-aplicación de `/restaurant/status` y en la gestión del admin.

1. Tres pestañas:
   - **"Usar mi ubicación"**: GPS de alta precisión. Si `accuracy > 100 m`, avisar "La ubicación es aproximada; ajusta el pin". `location_source = "GPS"`.
   - **"Buscar dirección"**: `PlaceAutocompleteInput`; al elegir, centra el mapa y coloca el pin. `location_source = "ADDRESS"` y `google_place_id`.
   - **"Marcar en el mapa"**: clic o toque para colocar el pin. `location_source = "MAP_PIN"`.
2. En los tres casos queda un **pin arrastrable** para el ajuste fino; mover el pin a mano cambia `location_source` a `"MAP_PIN"`.
3. Tras fijar el punto se hace geocodificación inversa y se **sugiere** la dirección ("¿Usar 'Av. 0 # 12-34, Cúcuta'?"); nunca se sobrescribe la dirección escrita por el usuario sin que la acepte. La ciudad se toma del componente `locality`.
4. Validación: punto obligatorio en el registro; dentro de `NEXT_PUBLIC_SERVICE_AREA_BOUNDS`; latitud y longitud juntas.
5. Sin clave de Google: solo GPS y campos manuales de latitud/longitud (`location_source = "MANUAL"`), con enlace para verificar el punto en Google Maps.
6. Vista previa: "Así te verán en el mapa" con el marcador final.

### 7.3 Reseñas en el detalle

1. Encabezado: `RatingSummary` (promedio, total, distribución, "#2 en Parrilla").
2. Bloque de acción según `viewer_can_review` / `viewer_review_block`:

   | Caso | Qué se muestra |
   |---|---|
   | Sin sesión (`LOGIN_REQUIRED`) | "Inicia sesión para dejar tu reseña" → `/login?redirect=/establishments/{id}#reviews` |
   | Teléfono sin verificar | "Verifica tu teléfono para opinar" → `/complete-profile` |
   | Restaurante, admin o dueño | Nada |
   | Ya reseñó (`viewer_review`) | Su reseña fijada arriba con "Editar" y "Eliminar"; si está oculta o su comentario bloqueado, `MyBlockedReviewBanner` con la categoría y la nota |
   | Puede reseñar | `ReviewForm` (se abre y recibe el foco automáticamente si la URL trae `?review=1`) |

   **Comentario bloqueado (vista pública y del establecimiento):** la reseña se muestra con autor, fecha, estrellas y respuesta, pero en lugar del texto aparece `BlockedContentNotice`:

   > 🛡 *El comentario fue bloqueado por una violación a las políticas de la aplicación.* · [Ver normas de la comunidad](/legal/community-guidelines)

   El frontend solo usa `moderation_notice` del backend; nunca recibe ni guarda el texto original en ese caso.

3. Al publicar, editar o borrar: recargar el detalle (promedio y distribución) y la primera página de reseñas. Un 409 abre el formulario en modo edición; un 429 muestra "Alcanzaste el límite diario de reseñas"; un 503 al subir imágenes muestra "La subida de imágenes no está disponible; puedes publicar sin fotos".
4. `ReviewList` sustituye al "Ver las N reseñas" actual.
5. "Reportar" en cada reseña ajena y en la respuesta del establecimiento; también "Reportar este lugar" en el pie del detalle.
6. CTA **"Planear visita"** (solo rol `user`) → `/plans/new?establishment={id}`.

### 7.4 Responder reseñas (`/restaurant/reviews`)

1. Arriba, el resumen (`/restaurant/reviews/summary`): promedio, total, distribución, posición en la categoría, sin responder y tasa de respuesta.
2. Pestañas "Sin responder" (por defecto), "Todas", "Respondidas"; filtro por estrellas; orden Recientes / Peor puntuación primero.
3. Cada reseña con `ReplyEditor` en línea: "Responder" → texto → guardar (`PUT`); luego "Editar" o "Eliminar" (confirmación). Si el comentario del cliente está bloqueado, se ve `BlockedContentNotice` y se puede responder a la calificación. Si la **respuesta** del establecimiento fue bloqueada, se muestra la categoría y la nota; al reescribirla, avisar "Un administrador la revisará antes de publicarla".
4. Llegar desde la notificación `REVIEW_RECEIVED` lleva a esta página.
5. En el dashboard: tarjeta de puntuación (desde el resumen) y "Tienes N reseñas sin responder" con enlace.

### 7.5 Horarios (`/restaurant/schedules`)

Siete filas (lunes a domingo) con interruptor Abierto/Cerrado, hasta 3 tramos por día, inputs de hora, "Copiar a todos los días", aviso "cierra al día siguiente" cuando el cierre es menor que la apertura, y validación de solapes antes de enviar `PUT`. El dashboard avisa si no hay horarios ("Sin horarios, los usuarios no podrán planear visitas con validación de apertura").

### 7.6 Planes

**Crear (`/plans/new`):**

1. **Lugar:** viene de `?establishment=` o se busca en un selector.
2. **Fecha y hora:** `TimeSlotPicker` con los horarios del local.
3. **Menú (opcional):** `MenuItemPicker` con productos y combos disponibles; el total se actualiza en `PlanSummary`.
4. **Detalles:** título (por defecto "Plan en {local}"), personas (1–50), notas, recordatorio.
5. **Resumen:** todo junto con el total → "Crear plan".

Tras crear → `/plans/{id}` con "Te recordaremos {X} antes". Errores del backend (cerrado a esa hora, ítem no disponible, recordatorio en el pasado) se muestran en el paso correspondiente.

Tras crear también se ofrece `AddToCalendarMenu` ("¿Quieres agregarlo a tu calendario?").

**Ver (`/plans`):** calendario mensual + lista "Próximos"; los cancelados en gris; los completados con "¿Cómo te fue? Deja tu reseña" (→ `/establishments/{id}?review=1#reviews`) si aún no reseñó.

**Detalle (`/plans/[id]`):** fecha y hora locales, local con `StaticLocationMap` y "Cómo llegar", ítems con cantidades y subtotales, total, avisos (`price_changed`, `outside_schedule`, `establishment_available = false`), botones Editar, Cancelar, Eliminar y `AddToCalendarMenu`. Si se edita la fecha de un plan ya agregado al calendario, avisar "Vuelve a agregarlo a tu calendario para actualizar la fecha".

**Invitación a reseñar:** cuando el plan pasa a `COMPLETED`, llega la notificación `REVIEW_PROMPT` ("¿Cómo te fue en {local}?"); su enlace abre el detalle con el formulario de reseña listo.

**Recordatorio:** llega como notificación `PLAN_REMINDER` (insignia en la campana) con enlace al plan. Opcional en F10: si el usuario lo permite, mostrar además una notificación del navegador mientras la app está abierta y Web Push con el service worker.

### 7.7 Notificaciones

Campana con contador en `Navbar` y `AreaTopBar`; lista desplegable con las 5 últimas; `/notifications` con todas, filtro "No leídas" y "Cargar más". Cada tipo define ícono y destino (`link` del backend).

### 7.8 Administración

1. **Usuarios (`/admin/users`):** búsqueda, filtros por rol y estado, tabla con reseñas y reportes. **Detalle:** datos, establecimientos, reseñas recientes, reportes, actividad y acciones (cambiar rol, suspender/reactivar con motivo, enviar aviso). Si se suspende una cuenta `restaurant`, ofrecer "Suspender también su establecimiento". Ocultar las acciones no permitidas (sobre sí mismo o el último admin) y mostrar el error del backend si ocurre.
2. **Establecimientos:** filtro `SUSPENDED`, columnas de puntuación, ubicación y reportes. En el detalle: `StaticLocationMap` (o "Sin ubicación"), Suspender/Reactivar con motivo, "Gestionar como establecimiento" y los `warnings` al aprobar.
3. **Reseñas (`/admin/reviews`):** filtros (estado de la reseña, estado del comentario, **"Pendientes de revisión"** = reescritas tras un bloqueo, estrellas, con reportes, texto). Cada `ModerationReviewCard` ofrece, en este orden:
   - **Bloquear comentario** → `ModerationActionModal` (categoría + nota + quitar imágenes) → en público queda "El comentario fue bloqueado por una violación a las políticas de la aplicación."; las estrellas siguen contando.
   - **Desbloquear** (también para aprobar un comentario reescrito).
   - **Ocultar reseña** (spam o falsa; sale del promedio) / **Restaurar**.
   - **Eliminar** (contenido ilegal; motivo obligatorio).
   - **Quitar imagen** individual.
   - Lo mismo para la respuesta del establecimiento: **Bloquear respuesta** / **Desbloquear**.
   Una ayuda desplegable "¿Qué acción usar?" reproduce la tabla de la sección 7.5 del plan del backend.
4. **Reportes (`/admin/reports`):** cola "Abiertos" por defecto; cada tarjeta muestra el contenido reportado, cuántos reportes tiene y los motivos; "Resolver" con acción (Ninguna, **Bloquear comentario**, Ocultar, Eliminar, Suspender al responsable), categoría y nota; "Descartar".
5. **Actividad (`/admin/activity`):** bitácora filtrable por admin, tipo y destino.
6. **Resumen:** tarjetas de reportes abiertos (enlazan a la cola), solicitudes pendientes, reseñas ocultas, comentarios bloqueados, pendientes de revisión, establecimientos sin ubicación, usuarios suspendidos y planes programados.

### 7.9 Privacidad y datos personales (F8)

1. **Registro** (correo, Google en `complete-profile` y restaurante): `ConsentCheckboxes` antes del botón final; se envían las versiones de `lib/legal.ts`. Si el backend responde 409 (versión desactualizada), recargar las versiones y pedir aceptar de nuevo.
2. **Cambio de versión:** al publicar un texto nuevo se actualizan a la vez `lib/legal.ts`, la página `/legal/*` y la variable del backend; en la siguiente visita `ConsentGate` pide la nueva aceptación.
3. **Ubicación del usuario:** `LocationPurposeNote` antes de pedir el permiso del navegador.
4. **Perfil → Privacidad y datos:** ver aceptaciones, descargar datos (JSON), eliminar cuenta (`DeleteAccountDialog`).
5. **Páginas legales** (`/legal/privacy`, `/legal/terms`, `/legal/community-guidelines`): Server Components estáticos con índice, versión y fecha de vigencia, legibles en móvil y enlazados desde el pie, los formularios y los avisos de moderación.

**Contenido mínimo de la política de tratamiento de datos** (borrador para revisión de la universidad o de un asesor; no es asesoría legal):

- Responsable del tratamiento: nombre, identificación, domicilio, correo y teléfono de contacto.
- Datos que se recogen: identificación y contacto (nombre, apodo, correo, teléfono), foto de perfil, cuenta de Google, reseñas e imágenes, planes, favoritos, ubicación (solo en el momento, sin guardarla) y datos técnicos (cookie de sesión; IP y navegador al aceptar la política).
- Finalidades: crear y gestionar la cuenta, verificar el teléfono, mostrar lugares cercanos, publicar reseñas, gestionar planes y recordatorios, moderar contenido, seguridad y prevención de fraude, y comunicaciones del servicio.
- Proveedores que procesan datos: Cloudflare R2 (imágenes), Google (inicio de sesión y mapas) y el proveedor de SMS.
- Derechos del titular (conocer, actualizar, rectificar, suprimir, revocar la autorización, pedir prueba de ella y presentar quejas ante la Superintendencia de Industria y Comercio) y cómo ejercerlos: la sección "Privacidad y datos" del perfil y un correo de contacto.
- Plazos de respuesta: consultas en 10 días hábiles y reclamos en 15 días hábiles.
- Vigencia, versión y cómo se avisan los cambios.

**Normas de la comunidad** (`/legal/community-guidelines`): una sección por cada categoría de moderación (lenguaje ofensivo, discriminación, datos personales de terceros, spam o publicidad, información falsa, contenido sexual o violento, contenido ilegal, contenido no relacionado con el lugar), con ejemplos de qué sí y qué no; qué hace la moderación (bloquear el comentario, ocultar la reseña, eliminar, suspender) y cómo pedir una revisión.

---

## 8. Contratos consumidos

| Endpoint | Función | Pantallas |
|---|---|---|
| `GET /establishments` | `searchEstablishments` | inicio, explorar, favoritos |
| `GET /establishments/nearby` | `searchNearbyEstablishments` | inicio, explorar |
| `GET /establishments/map` | `getMapMarkers` | explorar |
| `GET /establishments/{id}` | `getEstablishmentDetail` | detalle, constructor de planes |
| `GET /reviews/establishments/{id}` | `listEstablishmentReviews` | detalle |
| `POST /reviews/establishments/{id}` | `createReview` | detalle |
| `PATCH` / `DELETE /reviews/{id}` | `updateReview` / `deleteReview` | detalle, perfil |
| `GET /reviews/me` | `listMyReviews` | perfil |
| `POST /reviews/upload-url` | `uploadImage("reviews")` | formulario de reseña |
| `POST /reports` | `createReport` | detalle |
| `GET /restaurant/reviews`, `/summary` | `listRestaurantReviews`, `getRestaurantReviewSummary` | reseñas y dashboard del restaurante |
| `PUT` / `DELETE /restaurant/reviews/{id}/reply` | `upsertReviewReply`, `deleteReviewReply` | reseñas del restaurante |
| `GET` / `PUT /restaurant/schedules` | `getSchedules`, `putSchedules` | horarios |
| `POST /auth/restaurant/register`, `PATCH /restaurant/profile`, `PATCH /restaurant/reapply` | existentes + ubicación | registro, perfil, estado |
| `/notifications*` | `lib/notifications-api.ts` | campana, `/notifications` |
| `/plans*` | `lib/plans-api.ts` | planes |
| `GET /plans/{id}/calendar.ics` | `planIcsUrl` (enlace directo) | detalle del plan |
| `/favorites*` | `lib/favorites-api.ts` | favoritos, detalle |
| `GET /legal/versions`, `GET/POST /users/me/consents`, `GET /users/me/export`, `POST /users/me/delete/send-code`, `DELETE /users/me` | `lib/privacy-api.ts` | registro, `ConsentGate`, perfil |
| `/admin/users*`, `/admin/reviews*`, `/admin/review-replies*`, `/admin/review-images*`, `/admin/reports*`, `/admin/moderation-actions`, `/admin/establishments/{id}/(suspend\|reactivate\|products\|combos\|images\|schedules)`, `PATCH /admin/establishments/{id}`, `GET /admin/dashboard` | `lib/admin-api.ts`, `adminManagementApi` | consola admin |

---

## 9. Errores, validaciones y estados de carga

| Código | Tratamiento |
|---|---|
| 401 | Redirigir a `/login?redirect=<ruta actual>`. |
| 403 `ACCOUNT_SUSPENDED` | `AuthProvider` → `/account-suspended`. |
| 403 `CONSENT_REQUIRED` | Abrir `ConsentGate` y reintentar la acción después de aceptar. |
| 403 `CSRF_FAILED` | Pedir un token nuevo y reintentar una vez (lo hacen los helpers); si persiste, pedir recargar la página. |
| 403 (otros) | Mensaje del backend en la vista. |
| 404 | Estado "no encontrado" de la vista (no romper la página). |
| 409 | Reseña duplicada → modo edición; reporte duplicado → "Ya reportaste este contenido"; transición inválida → mensaje del backend. |
| 422 | Mostrar el primer `msg` bajo el campo correspondiente (ya lo extrae `parseApiError`). |
| 429 | "Alcanzaste el límite por hoy. Intenta mañana." |
| 503 en subidas | Permitir continuar sin imágenes. |

- Esqueletos de carga como los actuales (`animate-pulse`), estados vacíos con texto útil y botones deshabilitados durante el envío.
- Validar en el cliente lo mismo que el backend (longitudes, rangos, máximos) pero confiar siempre en la respuesta del servidor; el total del plan que se muestra es orientativo y el definitivo viene del backend.

---

## 10. Rendimiento, accesibilidad y robustez

- Cargar los mapas con `next/dynamic` y montar `APIProvider` solo donde haya mapa.
- Esperar 300–400 ms antes de pedir datos al mover el mapa o escribir, y cancelar la petición anterior con `AbortController`.
- Limitar marcadores (el backend devuelve como máximo 500) y agruparlos.
- `loading="lazy"` en imágenes de listas y reseñas.
- Polling de notificaciones pausado con la pestaña oculta.
- **Service worker (`public/sw.js`):** hoy sirve en *cache-first* los GET del mismo origen. La API está en otro origen, así que no la afecta; si en producción se sirve la API bajo el mismo dominio, **excluir `/api/`** del caché o las notificaciones y planes se verán desactualizados. Tampoco debe cachear recursos de Google Maps.
- Si más adelante se añade una Content-Security-Policy, permitir `*.googleapis.com`, `*.gstatic.com`, `*.google.com` y el dominio público de R2.
- Accesibilidad: entrada de estrellas usable con teclado y lector de pantalla, foco atrapado en modales (`Modal` existente), contraste suficiente en insignias y marcadores, textos alternativos en imágenes de reseñas.

---

## 11. Archivos

### 11.1 Nuevos

```
app/(site)/plans/page.tsx, plans/new/page.tsx, plans/[id]/page.tsx, plans/[id]/edit/page.tsx
app/(site)/notifications/page.tsx
app/(site)/favorites/page.tsx                                   (F7)
app/(site)/legal/privacy/page.tsx, legal/terms/page.tsx         (F8)
app/(site)/legal/community-guidelines/page.tsx                  (F5)
app/(auth)/account-suspended/page.tsx
app/(restaurant)/restaurant/reviews/page.tsx, schedules/page.tsx
app/(admin)/admin/users/page.tsx, users/[id]/page.tsx
app/(admin)/admin/reviews/page.tsx, reports/page.tsx, activity/page.tsx
app/(admin)/admin/establishments/[id]/manage/page.tsx
components/map/*, components/reviews/*, components/notifications/*, components/plans/*,
components/establishment-management/*, components/admin/*, components/privacy/*,
components/common/RequireRole.tsx
hooks/useGeolocation.ts
lib/reviews-api.ts, reports-api.ts, notifications-api.ts, plans-api.ts, favorites-api.ts,
    management-api.ts, privacy-api.ts, legal.ts, csrf.ts, geo.ts, datetime.ts, maps-config.ts
```

### 11.2 Modificados

`app/layout.tsx` (NotificationsProvider, ConsentGate), `app/(site)/page.tsx`, `app/(site)/explore/page.tsx`, `app/(site)/establishments/[id]/page.tsx`, `app/(site)/profile/page.tsx`, `app/(auth)/restaurant/register/components/RestaurantRegisterForm.tsx`, `app/(auth)/login/components/RegisterForm.{ts,tsx}`, `app/(auth)/complete-profile/components/CompleteProfileForm.tsx`, `components/layout/Footer.tsx`, `app/(restaurant)/layout.tsx`, `app/(restaurant)/restaurant/{dashboard,profile,products,combos,gallery,status}/page.tsx`, `app/(admin)/layout.tsx`, `app/(admin)/admin/{dashboard,establishments,establishments/[id]}/page.tsx`, `components/common/{Navbar,PublicBottomBar,NotificationsBell}.tsx`, `components/restaurant/{ProductModal,ComboModal}.tsx`, `components/providers/AuthProvider.tsx`, `lib/{auth-api,establishments-api,restaurant-api,admin-api,uploads,format}.ts`, `lib/api.ts` (eliminar `apiFetch` o pasarlo a los helpers), `app/(auth)/google-callback/page.tsx` (guarda el `csrf_token` del canje), `proxy.ts` (`SESSION_COOKIE_NAME`), `next.config.ts` (`headers()` y, con la topología de mismo dominio, `rewrites()`), `public/sw.js` (excluir `/api/`), `.env.example`, `package.json`, `CLAUDE.md`, `docs/design/**/ROUTE.md` de las vistas tocadas.

---

## 12. Plan de tareas por fases

### Fase F0 — Base ⇄ B0

- [x] `npm install @vis.gl/react-google-maps @googlemaps/markerclusterer` y `npm install -D @types/google.maps`.
- [x] Variables de la sección 3.4 en `.env.example` y `lib/maps-config.ts`.
- [x] `putAuthRequest` en `lib/auth-api.ts`.
- [x] **CSRF (3.5, se despliega junto con B0):** `lib/csrf.ts`; token tomado de las respuestas de login, registros y canje de Google (`google-callback`) y de `GET /auth/csrf` en `AuthProvider`; cabecera `X-CSRF-Token` y reintento único en los helpers de escritura y `logoutUser`; borrar el token en `clear()`/logout; eliminar o adaptar `apiFetch`. Verificar a mano que login, registro, Google, completar perfil, panel del restaurante (productos, combos, galería, perfil) y aprobación del admin siguen funcionando con el backend protegido. *(Hecho el 2026-11-12. Verificado contra el backend real en una base temporal, ejecutando los helpers de `lib/` desde Node con `Origin: http://localhost:3000`: login, registro de usuario y de restaurante guardan el token; POST/PATCH/DELETE lo envían; sin token o con uno viejo se pide `GET /auth/csrf` y se reintenta una vez; sin sesión, 401 sin reintento; logout borra token y cookie; aprobación del admin. Falta probarlo en el navegador, incluido Google.)*
- [x] `lib/geo.ts`, `lib/datetime.ts`, `hooks/useGeolocation.ts`, `components/common/RequireRole.tsx`, `Pagination`, `EmptyState`. *(La paginación es `components/ui/LoadMoreButton.tsx` ("Cargar más"); `EmptyState` está en `components/ui/`. `timeAgo` del detalle y del admin se movió a `lib/datetime.ts`.)*
- [ ] Lista de pasos de Google Cloud (3.1) entregada al equipo: dos claves (desarrollo y producción) con restricción por sitio web y por API, cuotas diarias y alertas de presupuesto; clave y Map ID de desarrollo en `.env.local`. *(Pendiente del equipo: Claude Code no crea claves. Los pasos están en la sección 3.1; sin clave, los mapas muestran `MapUnavailable`.)*

### Fase F1 — Notificaciones ⇄ B1

- [x] `lib/notifications-api.ts`, `NotificationsProvider` en `app/layout.tsx`, `NotificationsBell` con datos reales, `NotificationItem`, `/notifications`, `proxy.ts`.
- **Hecho cuando:** al aprobar o rechazar un restaurante, su cuenta ve la notificación con contador y puede marcarla como leída.
- *Hecho el 2026-11-12.* Polling cada 60 s solo con sesión y pestaña visible, más una consulta al recuperar el foco. La campana también está en `/restaurant/status` (que no tiene barra superior), para que el restaurante `PENDING` vea la aprobación. Verificado contra el backend: aprobar un local crea la notificación para el dueño, el contador sube a 1, marcarla la deja en 0 y eliminarla responde 204.

### Fase F2 — Mapa y geolocalización ⇄ B2

- [x] Componentes de `components/map/`.
- [x] `/explore` con mapa, cercanos, orden, vista móvil y estado en la URL.
- [x] Detalle con `StaticLocationMap` y "Cómo llegar" (sustituye la tarjeta estática "Ubicación").
- [x] Inicio: permiso con gesto, "Mejor puntuados".
- [x] `LocationPicker` en registro (obligatorio), perfil y re-aplicación del restaurante.
- [x] Migrar `averageRating()` → `rating_avg` y quitar el uso de `reviews` del listado **(desplegar junto con B2)**.
- *Hecho el 2026-11-13.* Notas: `/explore` guarda todos los filtros en la URL **sin** el patrón de `key` (remontar recrearía el mapa de Google y cobraría otra carga); el texto del buscador se sincroniza con la URL. El mapa solo se monta en escritorio o con `?view=map`. Los cercanos no aceptan texto en el backend: con "Cerca de mí" la búsqueda filtra en el cliente. Los marcadores se agrupan con más de 40. `LocationPurposeNote` (de F8) ya existe y se usa en explorar, inicio y el selector. Los `warnings` al aprobar quedan para F5. **Sin probar en el navegador ni con una clave de Google Maps** (sin clave se ve `MapUnavailable` y el registro funciona con GPS o coordenadas).

### Fase F3 — Reseñas ⇄ B3

- [x] `lib/reviews-api.ts`, `lib/reports-api.ts`, carpeta `reviews` en `uploads.ts`.
- [x] Componentes de `components/reviews/`; integración en el detalle (resumen, acción según `viewer_*`, formulario, lista, reportar) **(desplegar junto con B3: el detalle deja de traer `reviews`)**.
- [x] "Mis reseñas" en `/profile`.
- *Hecho el 2026-11-13.* Notas: **"Reportar" (`lib/reports-api.ts`, `ReportDialog`) pasa a F5**, porque `POST /reports` llega con B5; `ReplyEditor` es de F4. `?review=1` ya abre el formulario con foco. `BlockedContentNotice` enlaza a `/legal/community-guidelines`, que se crea en F5 (antes de B5 no puede haber comentarios bloqueados). El bloque de reseñas vive en `components/reviews/ReviewsSection.tsx`; "Mis reseñas" (`MyReviewsList`) edita en el detalle del lugar y elimina en el perfil. Lint, tipos y build. **Probado contra el backend el 2026-11-13** (helpers de `lib/` desde Node, base temporal con el seed): detalle sin `reviews` con `recent_reviews`, distribución 1..5 y `viewer_*` (visitante `LOGIN_REQUIRED`, tras reseñar `ALREADY_REVIEWED`); lista con orden, filtros por estrellas y fotos, y paginación; crear sin comentario, editar (`MyReview`), borrar y agregados recalculados; 409, 404 en ajena, 422 por imagen ajena y comentario largo; `/reviews/me`; `POST /reviews/upload-url`; notificación al dueño (enlaza a `/restaurant/reviews`). La cuenta del dueño recibe `ROLE_NOT_ALLOWED` (no `OWNER`) porque un restaurante no puede reseñar; en ambos casos no se muestra nada. `parseApiError` ahora quita el prefijo "Value error, " de Pydantic en los 422. Falta probarlo en el navegador.

### Fase F4 — Panel del establecimiento ⇄ B4

- [x] `/restaurant/reviews` con resumen, filtros y `ReplyEditor`.
- [x] `/restaurant/schedules`.
- [x] Menús del restaurante (sección 4.2) y widgets del dashboard.
- *Hecho el 2026-11-13.* Notas: las funciones están en `lib/restaurant-api.ts`; el editor de horarios ya vive en `components/establishment-management/SchedulesEditor.tsx` (recibe `load`/`save`, listo para el admin en F5) y sus reglas en `schedules.ts` (mismas que `schedule_service`: semiabiertos, cruce de medianoche, domingo → lunes). `ReviewCard` acepta `replySlot` para poner el `ReplyEditor`. En "Sin responder", una reseña respondida se queda en su sitio y "Cargar más" descuenta las que salieron de la pestaña. El contador de sin responder del menú se recarga al navegar y con el evento `RESTAURANT_REVIEWS_CHANGED`. El panel no recibe categoría ni nota de una respuesta bloqueada (`ReviewReplyPublic` no las trae): muestra el aviso y "un administrador la revisará". Dashboard: puntuación desde `/restaurant/reviews/summary` y avisos de reseñas sin responder, sin horarios y sin ubicación. **Probado contra el backend** (Node): pestañas, orden, filtro, paginación, responder (dos veces → mismo id), 422, 404, borrar, contador y tasa; `PUT`/`GET` de horarios ida y vuelta y 7 casos de validación en los que cliente y backend coinciden; usuario normal 403. Sin probar en el navegador.

### Fase F5 — Administración ⇄ B5

- [x] `AuthProvider` + `/account-suspended`; `SUSPENDED` en `format.ts` y en el layout del restaurante.
- [x] Usuarios (listado y detalle con acciones).
- [x] Establecimientos: suspender/reactivar, mapa, `warnings`.
- [x] Refactor a `components/establishment-management/` + `lib/management-api.ts` y `/admin/establishments/[id]/manage`. Verificar a mano que el panel del restaurante sigue funcionando igual.
- [x] Reseñas (con **bloquear/desbloquear comentario y respuesta**, `ModerationActionModal`, filtro "Pendientes de revisión"), reportes (acción "Bloquear comentario"), actividad, dashboard y menús del admin.
- [x] `BlockedContentNotice` en `ReviewCard` (público y panel del restaurante) y `MyBlockedReviewBanner` para el autor.
- [x] Página `/legal/community-guidelines` (el aviso de comentario bloqueado enlaza ahí) y enlace en el pie.
- [x] *(Pasado desde F3)* `lib/reports-api.ts` y `ReportDialog`/`ReportButton`: "Reportar" en reseñas ajenas, en la respuesta del establecimiento, en el pie del detalle ("Reportar este lugar") y en el panel del restaurante (reseñas falsas sobre su local).
- *Hecho el 2026-11-13.* Notas:
  - **Cuenta suspendida:** los helpers de `lib/auth-api.ts` emiten el evento `ACCOUNT_SUSPENDED_EVENT` ante cualquier 403 `ACCOUNT_SUSPENDED` (también el login y el sondeo de notificaciones); `AuthProvider` lo escucha, guarda `suspended: { reason }`, borra el token CSRF y lleva a `/account-suspended` (salvo en `/legal/*`). Los layouts admin/restaurante y `RequireRole` no mandan al login mientras `suspended` esté puesto (si no, competían con esa redirección). Un local `SUSPENDED` va a `/restaurant/status`, que muestra el motivo sin formulario de re-aplicación.
  - **Aprobar y rechazar solo desde `PENDING`** (el detalle del admin permitía decidir sobre `REJECTED`). Un aprobado se suspende; uno rechazado re-aplica. `GET /admin/establishments` ahora pagina de 20 en 20 sin total: el listado usa "Cargar más" y guarda el filtro en la URL (`useSearchParams` + `Suspense`), para que "Solicitudes" del menú funcione estando ya en la página. Lo mismo `/admin/reviews` (`?queue=&establishment_id=&user_id=`), que es a donde enlazan el detalle del local, el del usuario y el dashboard.
  - **Gestión compartida:** `ProfileEditor`, `ProductsManager`, `CombosManager`, `GalleryManager` y `SchedulesEditor` reciben `api: EstablishmentManagementApi` (`restaurantManagementApi` o `adminManagementApi(id)`); las páginas del panel son envoltorios de una línea. `uploadImage` y `ImageUploadField` aceptan la función que firma la subida (el admin usa `/admin/establishments/{id}/upload-url`). El motivo opcional de `/manage` se pasa con `api.setReason()` y viaja en `PATCH /admin/establishments/{id}` (el catálogo no lleva motivo; el backend avisa al dueño una vez al día).
  - Moderación: `ModerationReviewCard` (texto original, estados, reportes; bloquear/desbloquear o "Aprobar y publicar"/"Mantener bloqueado" si fue reescrito, ocultar/restaurar, eliminar, quitar imagen y lo mismo para la respuesta), `ModerationActionModal` (categoría obligatoria, nota, quitar imágenes, vista previa del aviso), `ConfirmWithReasonModal` (5..1000), `ReportCard` + modal de resolver (acciones según `RESOLVE_ACTIONS_BY_TARGET`, igual que el despacho de `report_service`), `NotifyUserModal`, `ModerationHelp` ("¿Qué acción usar?"). Las tarjetas se actualizan en su sitio y los contadores del menú (solicitudes y reportes abiertos) se recargan con `announceAdminCountsChanged()`.
  - Usuarios: se ocultan las acciones sobre la propia cuenta y "Cambiar rol" en cuentas `restaurant`; el último admin lo protege el backend y su error se muestra. Al suspender una cuenta `restaurant` con local aprobado se ofrece suspender también el local.
  - **Probado contra el backend** (Node, base temporal con el seed de B5): dashboard y colas coinciden; bloquear comentario (público ve el aviso, el promedio no cambia), ocultar/restaurar (el promedio cambia), bloquear/desbloquear respuesta; reportar (409 duplicado, 400 propio), resolver (400 sin categoría y con acción no aplicable), descartar; bitácora; suspender usuario (cookie vigente y login → 403 `ACCOUNT_SUSPENDED` con motivo), protecciones de rol y auto-suspensión; suspender local (sale del directorio, el dueño ve el motivo, panel 403), rechazar un aprobado 409; gestionar como el local (perfil con motivo en la bitácora, producto, horarios, fotos, `upload-url`) y aviso al dueño; el panel del restaurante sigue funcionando; usuario normal 403. **Sin probar en el navegador.**

### Fase F6 — Planes ⇄ B6

- [x] `lib/plans-api.ts` y componentes de `components/plans/`.
- [x] `/plans`, `/plans/new`, `/plans/[id]`, `/plans/[id]/edit`.
- [x] "Planear visita" en el detalle; "Planes" en `Navbar` y `PublicBottomBar`.
- [x] `AddToCalendarMenu` (Google Calendar + `.ics`) en el detalle del plan y tras crearlo.
- [x] Notificaciones `PLAN_REMINDER`, `PLAN_AFFECTED` y `REVIEW_PROMPT` enlazadas correctamente; `?review=1` abre el formulario de reseña en el detalle.
- **Notas de implementación (2026-11-13):**
  - `components/plans/slots.ts` replica `is_open_at` del backend (apertura incluida, cierre excluido, tramos que cruzan la medianoche) y genera franjas de 30 min más las aperturas que no caen en :00/:30, sin las que no cumplen la anticipación mínima (15 min). `TimeSlotPicker` deshabilita los días cerrados con un aviso y, sin horarios, ofrece `<input type="time">` libre.
  - `PlanBuilder.ts` (`usePlanBuilder`) + `PlanBuilder.tsx`: pasos Fecha y hora → Menú → Detalles → Resumen; el lugar se elige antes en `/plans/new` (buscador) o llega con `?establishment=`. Los errores del backend vuelven al paso con `planErrorStep` (`CLOSED` y anticipación → fecha, `INVALID_ITEMS` → menú marcando `invalid_item_ids`, `REMINDER_IN_PAST` → detalles). En edición solo se envían `scheduled_at` si cambió e `items` si se tocaron (enviarlos recalcula el total con precios actuales); la hora antigua se acepta aunque ya no esté en las franjas.
  - Tras crear → `/plans/{id}?created=1` (aviso "Te recordaremos…" + `AddToCalendarMenu`); tras editar → `?updated=1` y, si cambió la fecha, `&rescheduled=1` con "Vuelve a agregarlo a tu calendario". El calendario pide las 6 semanas visibles (`from`/`to`, `limit=100`); "Próximos" usa `status=SCHEDULED`.
  - `app/(site)/plans/layout.tsx` envuelve todo en `RequireRole roles={["user"]} requireVerifiedPhone`; `proxy.ts` añade `/plans/:path*`. "Planes" y "Planear visita" se ocultan a restaurantes y admins. `PublicBottomBar` no se muestra en el asistente (usa la barra inferior para el total).
  - **Probado contra el backend** (Node, base temporal con el seed): franjas de medianoche (unidad), total con 2 productos ×2 + 1 combo igual al del backend, ida y vuelta de la hora de Colombia, título por defecto, hora cerrada / anticipación / recordatorio en el pasado / ítem de otro local mapeados al paso correcto, `PATCH` que recalcula y reprograma, `.ics` con `VALARM`, enlace de Google Calendar, cancelar (luego 409) y eliminar (luego 404). **Sin probar en el navegador** (ni el `.ics` en un iPhone real).

### Fase F7 — Favoritos y tipo de establecimiento ⇄ B7

- [x] `/favorites`, corazón en detalle y tarjetas, enlaces en `Navbar` y `PublicBottomBar`.
- [x] Selector de `establishment_type` en registro y perfil; filtro por tipo en explorar y en el mapa; textos "establecimiento/aliado" donde hoy dice "restaurante" para el público.
- **Notas de implementación (2026-11-13):**
  - `lib/favorites-api.ts`: `listFavorites`, `listFavoriteIds` (`GET /favorites/ids`, extra de B7), `addFavorite` (`PUT`, idempotente), `removeFavorite`, `favoriteErrorMessage` (`PHONE_NOT_VERIFIED`, `ROLE_NOT_ALLOWED`, 404). `is_favorite` añadido a `PublicEstablishmentDetail`.
  - `components/favorites/FavoritesProvider.tsx` (en el layout raíz, dentro de `NotificationsProvider`): pide los ids una vez por sesión de una cuenta `user` verificada y expone `useFavorites()` → `{ mode, isReady, isFavorite(id, fallback), isPending, toggle }`. Los cambios son optimistas y se guardan como *overrides* sobre los ids (un toque antes de que lleguen no se pierde); si el backend falla se deshace y sale un aviso. El aviso ("Guardado en tus favoritos · Ver favoritos") lo pinta el propio proveedor.
  - `FavoriteButton` (`variant` `icon`/`full`): no aparece a restaurantes ni admins; el visitante va al login con `?redirect=` y el `user` sin teléfono verificado a `/complete-profile`. Nunca va dentro de un `<a>`: las tarjetas de explorar y `EstablishmentCard` (nuevo, `components/establishments/`, usado en inicio y `/favorites`) lo ponen como hermano del enlace. También está en la ficha del marcador del mapa y en el detalle (con `is_favorite` como valor inicial).
  - `/favorites`: `RequireRole` user + teléfono verificado (igual que el backend), paginado de 20 con "Cargar más". Un lugar que se quita se queda atenuado en su sitio para deshacerlo con otro toque; "Cargar más" y el contador descuentan los quitados. `proxy.ts` añade `/favorites`. "Mis Favoritos" (`Navbar`) y "Favoritos" (`PublicBottomBar`) se ocultan a restaurantes y admins, como "Planes".
  - Tipo de establecimiento: `EstablishmentTypePicker` (radios con icono y ayuda, `ESTABLISHMENT_TYPE_HINT`) en el registro (por defecto `RESTAURANT`) y en `ProfileEditor` (panel y gestión del admin; solo se envía si cambió, porque el backend no acepta `null`). `/explore` filtra con `?type=` en lista, cercanos, "Cargar más" y mapa; los accesos del inicio llevan a `?type=RESTAURANT|CAFE|BAR|HOTEL|EXPERIENCE|STORE` (antes eran categorías o `/explore` sin filtro). Las tarjetas y el detalle muestran el tipo solo si no repite la categoría.
  - Textos: "Registra tu establecimiento", "Mi establecimiento" en el menú del avatar, "Perfil del establecimiento", galería y carta del panel, rol `restaurant` → "Establecimiento" en `ROLE_LABEL` y en el filtro de usuarios del admin.
  - **Probado contra el backend** (Node, base temporal con el seed): visitante 401 en `/favorites/ids` e `is_favorite` falso; user1 con 2 favoritos listados (el del local suspendido no sale) en el mismo orden que los ids; añadir dos veces → primero de la lista, `is_favorite` verdadero; paginación; quitar dos veces; 404 en local inexistente y suspendido; `DELETE` sobre suspendido 204; aislamiento user1/user2; dueño 403 `ROLE_NOT_ALLOWED`; `PATCH` de tipo y filtro por tipo en directorio, cercanos y mapa; registro con `HOTEL`. **Sin probar en el navegador.**
  - **Aviso para F8:** el backend ya tiene `0014_privacy` (B8 en curso). Con él, toda escritura de una cuenta sin la política vigente aceptada responde 403 `CONSENT_REQUIRED` (también `PUT /favorites`), y los registros exigen `accept_privacy_policy`, `accept_terms` y las versiones (sin ellos, 422). La prueba de F7 aceptó los consentimientos con `POST /users/me/consents`; en la app eso lo resuelven `ConsentGate` y `ConsentCheckboxes` de F8.

### Fase F8 — Privacidad y datos personales ⇄ B8

> Debe estar terminada **antes de publicar la app**.

- [x] `lib/privacy-api.ts`, `lib/legal.ts`, `pending_consents` en `UserProfile`.
- [x] Páginas `/legal/privacy` y `/legal/terms` con el contenido mínimo de 7.9 (texto revisado por la universidad o un asesor antes de publicar); enlaces en el pie.
- [x] `ConsentCheckboxes` en `RegisterForm`, `RestaurantRegisterForm` y `CompleteProfileForm`.
- [x] `ConsentGate` y manejo de `CONSENT_REQUIRED`.
- [x] `LocationPurposeNote` en explorar, inicio y `LocationPicker` (ya hecho en F2).
- [x] `PrivacySettings` y `DeleteAccountDialog` en `/profile`.
- **Notas de implementación (2026-11-13):**
  - `lib/legal.ts`: `PRIVACY_POLICY_VERSION`/`TERMS_VERSION` (`2026-11-01`, iguales a las del backend), `LEGAL_EFFECTIVE_DATE`, `LEGAL_CHANGE_SUMMARY` (lo que muestra `ConsentGate` en "Qué cambió"), `DATA_CONTROLLER` y `consentPayload()`. **`DATA_CONTROLLER` tiene campos `[Pendiente: …]`** (identificación, correo y teléfono del responsable): hay que completarlos antes de publicar; el correo es también el canal de consultas y reclamos, porque `data_requests` no se implementó en B8.
  - `lib/privacy-api.ts`: `getLegalVersions`, `listMyConsents`, `acceptConsents` (envía las versiones de `lib/legal.ts`, no las del backend: así se acepta el texto que se ve), `downloadMyData`, `sendDeleteAccountCode`, `deleteMyAccount`, `isConsentVersionOutdated`, `CONSENT_CHANNEL_LABEL` (canales reales: `WEB_REGISTER`, `RESTAURANT_REGISTER`, `GOOGLE_COMPLETE_PROFILE`, `RE_ACCEPTANCE`). `lib/auth-api.ts`: `pending_consents` en `UserProfile`, tipo `ConsentFields` en `registerUser` y `RestaurantRegisterPayload`, `deleteAuthRequestWithBody` (el `deleteAuthRequest` de siempre no envía cuerpo) y el evento `CONSENT_REQUIRED_EVENT` que emiten los helpers ante cualquier 403 `CONSENT_REQUIRED`.
  - **Desviación:** "Descargar mis datos" no es un enlace directo sino `fetch` + Blob, para poder mostrar el límite de una descarga por hora (429 con `retry_after_seconds`: "Podrás pedir otra copia en N minutos") en vez de abrir el JSON del error. Es un JSON, no un `.ics`: la restricción de iOS del `.ics` no aplica.
  - `ConsentCheckboxes` (sin marcar, enlaces en pestaña nueva; `documents` para mostrar solo las pendientes) en el registro por correo, el del establecimiento y `/complete-profile`. En `/complete-profile` la sección "4. Autorización de datos" solo aparece si `pending_consents` no está vacío (cuentas de Google) y `POST /users/me/consents` va antes del `PATCH /users/me`. Un 409 `CONSENT_VERSION_OUTDATED` pide recargar la página.
  - `ConsentGate` (layout raíz, dentro de `FavoritesProvider`): modal que no se cierra, con "Qué cambió", las casillas de los documentos pendientes, "Aceptar y continuar", "Cerrar sesión" y, para `user`, "eliminar tu cuenta" (abre `DeleteAccountDialog` encima). No aparece en `/legal/*`, `/account-suspended`, `/complete-profile` ni `/google-callback`. Si en la página hubo peticiones rechazadas con `CONSENT_REQUIRED`, al aceptar **recarga la página** para repetirlas (es la forma general de "reintentar la acción"); si no, solo refresca la sesión. El layout del restaurante ya no muestra error ante `CONSENT_REQUIRED` (se queda cargando detrás del modal).
  - `DeleteAccountDialog`: escribir ELIMINAR y contraseña, o código SMS (por defecto en cuentas de Google con teléfono verificado; las de correo pueden cambiar a código). **Desviación:** no reutiliza `PhoneCodePanel`, cuyo texto es del cambio de teléfono; tiene su propio campo de código. Tras eliminar: `clear()` y al inicio con el aviso `AccountDeletedNotice` (marca en `sessionStorage`). Restaurante y admin ven "Solicita la eliminación a soporte".
  - `PrivacySettings` en `/profile` (`#privacidad`): última versión aceptada de cada documento con fecha y canal, aviso si hay una versión nueva, descarga, enlaces y eliminar cuenta.
  - Páginas `/legal/privacy` y `/legal/terms` (Server Components con `components/legal/LegalDocumentPage.tsx`: versión, vigencia, índice con anclas y un aviso de **borrador para revisión**). El pie enlaza Privacidad, Términos y Normas de la comunidad.
  - **Probado contra el backend** (Node, base temporal con el seed; user3 con versión vieja): versiones iguales; registro sin casillas 422, con versión vieja 409 `CONSENT_VERSION_OUTDATED`, con casillas sin pendientes y canal `WEB_REGISTER`; `pending_consents` de user3, escritura protegida 403 `CONSENT_REQUIRED` con el evento emitido, aceptar (canal `RE_ACCEPTANCE`, idempotente) y la escritura funciona; exportación (claves del JSON) y segunda → 429 con el mensaje; eliminar con contraseña (mala 400, sin prueba 422, buena → 401 y cookie borrada) y con código SMS del proveedor simulado (malo 400, bueno → sesión fuera y sus reseñas ya no salen en el local); dueño 409 `SUPPORT_REQUIRED`; registro de establecimiento sin casillas 422 y con ellas sin pendientes. **Sin probar en el navegador** ni el canal `GOOGLE_COMPLETE_PROFILE` (requiere una cuenta de Google real).

### Fase F9 — Revisión de seguridad antes de publicar ⇄ B9

> **Pendiente: no se ejecuta mientras el MVP sea solo local.** Se hace cuando el equipo decida publicar la app. El token CSRF ya se hizo en F0; aquí se cierra lo de publicación.

- [ ] Aplicar la topología elegida (D12): `rewrites()` hacia `BACKEND_ORIGIN` y `NEXT_PUBLIC_API_URL=/api/v1`, o subdominio con la cookie en `Domain=<dominio>` desde el backend.
- [ ] `proxy.ts` con `SESSION_COOKIE_NAME`.
- [ ] Cabeceras de seguridad en `next.config.ts` (3.5).
- [ ] `public/sw.js` sin cachear `/api/` ni recursos de Google.
- [ ] Servir el sitio solo por HTTPS (también lo necesita la geolocalización).
- [ ] Ejecutar la sección "Seguridad" de la lista de la sección 13 en el dominio real.

### Fase F10 — Opcional

- Web Push con el service worker existente (y corregir `/icons/icon-192.png`, que falta en `public/`).
- Playwright para los flujos críticos (registro con ubicación, reseña, respuesta, plan con recordatorio, moderación) y Vitest para `lib/geo.ts` y `lib/datetime.ts`.
- Tipos generados desde la OpenAPI.

---

## 13. Verificación manual y criterios de aceptación

**Mapa y ubicación**
- [ ] Con permiso concedido, `/explore` centra el mapa en el usuario y "Cerca de mí" ordena por distancia mostrando metros/kilómetros.
- [ ] Con permiso denegado, la página funciona centrada en Cúcuta y explica cómo activar la ubicación.
- [ ] Mover el mapa recarga los marcadores sin parpadeos ni peticiones duplicadas.
- [ ] En móvil, el cambio Lista/Mapa funciona y la tarjeta del marcador abre el detalle.
- [ ] Un restaurante se registra ubicándose por GPS, por dirección y por pin (probar los tres); tras la aprobación aparece en el mapa en el punto elegido.
- [ ] Sin `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`, la app no se rompe y el registro sigue siendo posible con GPS o coordenadas manuales.
- [ ] Probado en un celular real por HTTPS.

**Reseñas y puntuación**
- [ ] Un usuario verificado publica con solo estrellas y con texto + 2 imágenes; el promedio y la distribución se actualizan sin recargar la página.
- [ ] No ve el formulario por segunda vez: ve su reseña con "Editar" y "Eliminar".
- [ ] Visitante, usuario sin verificar, restaurante, admin y dueño ven el estado correcto del bloque de reseña.
- [ ] El listado del directorio ordena por posición y muestra ★ promedio (conteo).
- [ ] Reportar una reseña muestra confirmación; reportarla otra vez avisa que ya se reportó.

**Establecimiento**
- [ ] Recibe la notificación de nueva reseña, la responde, la edita y la elimina; el autor recibe la notificación de respuesta.
- [ ] Edita sus horarios (incluido un tramo que cruza la medianoche).

**Administración**
- [ ] Suspende un usuario: su sesión abierta pasa a `/account-suspended`.
- [ ] Suspende un establecimiento: desaparece del directorio y del mapa; el dueño ve su estado con el motivo.
- [ ] Edita el catálogo de un establecimiento desde "Gestionar"; el dueño recibe la notificación y la acción aparece en "Actividad".
- [ ] Oculta una reseña reportada desde la cola de reportes: el promedio público cambia y el autor ve el motivo en "Mis reseñas".
- [ ] Bloquea el comentario de una reseña con la categoría "Lenguaje ofensivo": el público y el establecimiento ven "El comentario fue bloqueado por una violación a las políticas de la aplicación." con el enlace a las normas; las estrellas y el promedio no cambian; el autor recibe la notificación y ve su texto original con la categoría.
- [ ] El autor reescribe el comentario bloqueado: sigue bloqueado y aparece en "Pendientes de revisión"; al desbloquearlo se publica.
- [ ] Bloquea la respuesta de un establecimiento: se ve el aviso de respuesta bloqueada.

**Planes**
- [ ] Crea un plan con 2 platos y 1 combo; el total coincide con el del backend.
- [ ] No permite elegir un horario cerrado ni un recordatorio que quedaría en el pasado.
- [ ] El plan aparece en el calendario el día correcto (hora de Colombia).
- [ ] Con un recordatorio de 15 minutos, la notificación llega a la campana a la hora indicada (±1 min) y lleva al plan.
- [ ] "Agregar a Google Calendar" abre el evento con fecha, hora y lugar correctos (probar en Android).
- [ ] El `.ics` se abre en Calendario de un iPhone real con la hora correcta y la alarma configurada.
- [ ] Al completarse un plan llega "¿Cómo te fue en…?" y el enlace abre el formulario de reseña.

**Privacidad**
- [ ] No se puede registrar ninguna cuenta (correo, Google o restaurante) sin marcar las casillas, y no vienen marcadas.
- [ ] Al cambiar la versión de la política en el backend y en `lib/legal.ts`, un usuario existente ve `ConsentGate` y no puede usar funciones protegidas hasta aceptar.
- [ ] "Descargar mis datos" descarga un JSON con los datos propios.
- [ ] Eliminar la cuenta (con contraseña y con código SMS en una cuenta de Google) cierra la sesión y sus reseñas desaparecen del detalle.
- [ ] Las tres páginas legales se leen bien en el celular y están enlazadas en el pie.

**Clave de Google Maps**
- [ ] La clave de producción no funciona desde `localhost` (prueba de que la restricción por sitio web está activa).
- [ ] La clave no aparece en el repositorio (`git grep` del valor sin resultados) ni en los logs de la consola del navegador.

**Seguridad en local (MVP, desde F0)**
- [ ] En la pestaña Red del navegador, toda petición `POST`/`PUT`/`PATCH`/`DELETE` a la API lleva `X-CSRF-Token`; ninguna a R2 la lleva.
- [ ] Tras recargar la página, la primera acción de escritura funciona (el token se recupera con `GET /auth/csrf`).
- [ ] Una petición de escritura sin token (p. ej. repetida desde la consola sin la cabecera) recibe 403.

**Seguridad al publicar (F9, pendiente)**
- [ ] `http://` redirige a `https://`; la cookie de sesión aparece con `Secure`, `HttpOnly` y `SameSite=Lax`.
- [ ] Con sesión iniciada, entrar directamente a `/profile`, `/plans`, `/restaurant/dashboard` y `/admin/dashboard` no redirige al login (`proxy.ts` ve la cookie en producción).
- [ ] Las cabeceras de 3.5 aparecen en las respuestas del sitio.
- [ ] Las notificaciones y los planes no se ven desactualizados por el service worker.

**Calidad**
- [ ] `npm run lint`, `npx tsc --noEmit` y `npm run build` sin errores.
- [ ] `CLAUDE.md` actualizado (rutas nuevas, mapas, notificaciones, variables de entorno) y `ROUTE.md` de las vistas tocadas.

---

## 14. Decisiones pendientes del frontend (valor por defecto aplicado)

| Id | Pregunta | Por defecto | Alternativa |
|---|---|---|---|
| F-D1 | Pestañas móviles del sitio público | Inicio, Explorar, Planes, Favoritos, Perfil | Mantener 4 y llevar Favoritos al perfil |
| F-D2 | Pestañas móviles del restaurante | Panel, Menú, Reseñas, Fotos, Perfil | Sustituir Fotos en lugar de Combos |
| F-D3 | Al mover el mapa, ¿recargar solo o con botón "Buscar en esta zona"? | Recarga automática con espera | Botón explícito (menos peticiones) |
| F-D4 | ¿Pedir la ubicación al entrar al inicio? | Solo si ya hay permiso; si no, botón | Pedirla siempre al cargar (como hoy) |
| F-D5 | Decisiones de producto y de publicación D1–D13 (D12 = topología de dominios) | Ver sección 16 del plan del backend | — |

---

## 15. Por planificar (no implementar todavía)

Propuestas registradas el 2026-11-12. **No forman parte del alcance** hasta que el equipo las apruebe; el detalle del backend está en la sección 17 de su plan.

| Propuesta | Idea para el frontend |
|---|---|
| **Recuperar contraseña por SMS** | Enlace "¿Olvidaste tu contraseña?" en `LoginForm`; página `/forgot-password` en dos pasos (pedir código con correo o teléfono → código + nueva contraseña), reutilizando `PhoneCodePanel` y las reglas de contraseña del registro. |
| **Vista previa al compartir (WhatsApp, redes)** | Convertir `/establishments/[id]` en un Server Component que obtiene el resumen público y exporta `generateMetadata` (título, descripción, imagen de portada para Open Graph), dejando la parte interactiva como Client Component; botón "Compartir" con la Web Share API; `sitemap.ts`. |
| **Reseña con "visita verificada"** | Insignia "Visita planeada en PlanATi" en `ReviewCard` cuando `verified_visit` es verdadero; filtro "Solo visitas verificadas". |
| **Filtro automático de groserías** | Sin cambios para el usuario; en la consola admin, motivo "Detectado automáticamente" en la cola "Pendientes de revisión". |
| **Festivos y horarios especiales** | En `/restaurant/schedules`, sección de fechas especiales (cerrado u horario propio) y casilla "Abrimos festivos"; `TimeSlotPicker` y el bloque de horarios del detalle los respetan ("Hoy es festivo: cerrado"). |
| **Estadísticas para el establecimiento** | Sección "Estadísticas" en el panel del restaurante con gráficos de visitas al perfil, clics en "Cómo llegar" y teléfono, planes y favoritos por día (cargar el skill `dataviz` antes de diseñar los gráficos); el frontend registra esos eventos con una petición ligera. |
