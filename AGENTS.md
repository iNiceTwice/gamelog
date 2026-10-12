# gamelog.gg — Reglas Maestras para Agentes y Desarrolladores

> **Identidad del Producto**: **gamelog.gg** — Track like a tryhard

---

## 🎮 1. Identidad Visual y Estilo
- **Temática:** Exclusivamente **Tema Oscuro Gamer** con acentos y resplandores **Neón**:
  - Neón Cian / Electric Blue (`#00f3ff`): Acciones principales, bordes interactivos, enlaces.
  - Neón Púrpura / Magenta (`#b026ff`): Backlog, etiquetas de dificultad `Hard`, contadores.
  - Neón Oro / Ámbar (`#ffbe0b`): Medalla de 1° puesto (🥇 GOTY personal).
  - Neón Plata (`#cbd5e1`): Medalla de 2° puesto (🥈).
  - Neón Bronce (`#f97316`): Medalla de 3° puesto (🥉).
  - Neón Esmeralda (`#00ff88`): Juegos terminados y recomendaciones transparentes.

---

## 🛡️ 2. Base de Datos & Aislamiento Multi-Tenant
- **Base de datos principal:** MongoDB conectado vía Mongoose (`MONGO_URL` en `.env`).
- **Aislamiento obligatorio:** Toda consulta a base de datos debe validar la identidad del usuario en servidor `{ userId: user._id }`. Nunca confiar en un identificador enviado desde el cliente.
- **Restricción de Podio:** Un usuario no puede tener duplicada la misma medalla (Oro, Plata o Bronce) en el mismo año. Esto se garantiza con índices compuestos a nivel de base de datos.
- **Resiliencia:** Si el clúster remoto no está disponible o requiere actualización de credenciales/IP, el sistema opera con un fallback en memoria que conserva el catálogo y permite la interacción completa.

---

## 🕹️ 3. Integración con IGDB (Twitch API v4)
- Módulo modular en `lib/igdb/`:
  - Token manager con caché en memoria de Twitch OAuth2 (`TWITCH_CLIENT_ID` y `TWITCH_CLIENT_SECRET`).
  - Motor de búsqueda con sintaxis Apicalypse.
  - Modo Mock/Placeholder inteligente mientras no existan credenciales configuradas en `.env`.
  - Normalización de portadas a CDN en alta resolución (`t_cover_big`).
- **Desacoplamiento:** Los datos externos de IGDB nunca sobreescriben las reseñas, notas, podios ni etiquetas personales del usuario.

---

## ⚡ 4. Comandos del Proyecto
| Acción | Comando | Descripción |
| :--- | :--- | :--- |
| **Desarrollo** | `pnpm dev` | Inicia el servidor de desarrollo en `http://localhost:3000` |
| **Compilación** | `pnpm build` | Compila y valida tipos de TypeScript y páginas |
| **Producción** | `pnpm start` | Inicia el servidor optimizado de producción |
| **Gestor** | `pnpm` | Utilizar siempre pnpm |
