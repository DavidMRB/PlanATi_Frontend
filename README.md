# PlanATi — Frontend

Aplicación web de PlanATi, una plataforma para descubrir establecimientos gastronómicos de Cúcuta (búsqueda, mapa, reseñas, planes y paneles para establecimientos y administradores). Está hecha con [Next.js](https://nextjs.org) 16, React 19 y Tailwind CSS 4.

Para la descripción general del proyecto y la instalación completa (base de datos, backend y frontend) consulta el [README de la raíz](../README.md).

## Inicio rápido

Requiere el backend corriendo en `http://localhost:8000` (ver [`../Backend/README.md`](../Backend/README.md)).

```bash
npm install
copy .env.example .env.local    # Linux/Mac: cp .env.example .env.local
npm run dev
```

Abre <http://localhost:3000>.

## Variables de entorno (`.env.local`)

| Variable | Descripción |
|---|---|
| `NEXT_PUBLIC_API_URL` | URL de la API (`http://localhost:8000/api/v1`). |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | API key de Google Maps (`AIza…`). Sin ella los mapas muestran un aviso. |
| `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID` | ID del mapa (`DEMO_MAP_ID` en desarrollo). |
| `NEXT_PUBLIC_DEFAULT_MAP_CENTER`, `NEXT_PUBLIC_DEFAULT_MAP_ZOOM` | Vista inicial del mapa (Cúcuta). |
| `NEXT_PUBLIC_SERVICE_AREA_BOUNDS` | `sur,oeste,norte,este`; igual que `SERVICE_AREA_BOUNDS` del backend. |

Las variables `NEXT_PUBLIC_*` son públicas (se incrustan en el JavaScript del navegador): no guardes secretos en ellas. Reinicia `npm run dev` tras cambiarlas.

## Scripts

| Comando | Acción |
|---|---|
| `npm run dev` | Servidor de desarrollo. |
| `npm run build` | Compilación de producción. |
| `npm start` | Sirve la compilación de producción. |
| `npm run lint` | ESLint. |
| `npx tsc --noEmit` | Comprobación de tipos. |
