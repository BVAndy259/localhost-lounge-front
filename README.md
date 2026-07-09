# LocalHost Lounge Frontend

Bienvenido al repositorio oficial del **Frontend de LocalHost Lounge**, la aplicación web desarrollada y desplegada en junio de 2026. Esta plataforma ofrece una experiencia dual: un portal público atractivo para clientes y un panel administrativo avanzado (Dashboard) para el staff del restaurante.

---

## Características Principales

### Portal Público
* **Landing Page Dinámica:** Interfaz moderna y *responsive* diseñada con Tailwind CSS, animaciones suaves y componentes interactivos.
* **Reserva Inteligente (3 Pasos):** Flujo de reserva optimizado que permite seleccionar fecha, hora y mesas disponibles en tiempo real, con la capacidad de auto-completar datos si es asistido por la IA.
* **Carta Digital Interactiva:** Visualización del menú sincronizado con la base de datos (Cloudinary) con sistema de categorías.

### Panel Administrativo (Staff Dashboard)
* **Punto de Venta (POS) Integrado:** Interfaz de facturación para agregar platos a las comandas de las mesas, ajustar cantidades y procesar cobros (efectivo, tarjetas o billeteras digitales) generando comprobantes PDF al instante.
* **Gestión Visual de Mesas:** "Plano de mesas" interactivo para monitorear el estado (`LIBRE`, `OCUPADA`, `RESERVADA`), visualizar capacidades y asignar meseros directamente desde la interfaz.
* **Control de Reservas y Órdenes:** Listados con filtros avanzados (fecha, estado) para manejar todo el flujo operativo del salón en vivo.
* **Asistente IA Operativo:** Un "Floating Chat Widget" con contexto. Para el cliente actúa como guía de reservas, y para el staff ejecuta comandos como `SHOW_DASHBOARD`, `RENDER_TABLE_STATUS` o registrar usuarios directamente desde el chat.

---

## Stack Tecnológico

La aplicación está construida enfocada en la velocidad, modularidad y experiencia de desarrollo moderna:

* **Core:** React v19.2 + Vite v8.0.
* **Enrutamiento:** React Router DOM v7.15 para la navegación *Single Page Application* y protección de rutas mediante `AuthMiddleware`.
* **Estilos y UI:** 
  * Tailwind CSS v4.3 para estilización utilitaria.
  * Arquitectura basada en componentes UI reutilizables (Botones, Tarjetas, Inputs) con `class-variance-authority` y `tailwind-merge`.
  * Iconografía moderna con `lucide-react`.
* **Consumo de API:** `axios` v1.16 con interceptores configurados para adjuntar tokens JWT y manejar sesiones expiradas (Redirección al Login).
* **Calidad de Código:** ESLint + configuración estricta para React.

---

## Estructura del Proyecto

El código fuente (`/src`) sigue una arquitectura limpia orientada a dominios y responsabilidades:

* `api/`: Configuración del cliente HTTP (Axios) e interceptores.
* `app/`: Configuración del `AppRouter` principal y sub-layouts (`AdminLayout`).
* `components/`: Componentes modulares. Divididos en `ui/` (elementos base), `public/` (Footer, Navbar) y `chat/` (Widget IA).
* `pages/`: Vistas completas de la aplicación, separadas por contexto (`public/` y `staff/`).
* `services/`: Capa de abstracción de datos. Módulos que interactúan con el backend (`auth.service.js`, `order.service.js`, `table.service.js`, etc.) manteniendo los componentes limpios de llamadas directas a Axios.

---

## Instalación y Configuración Local

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/BVAndy259/localhost-lounge-front
   cd localhost-lounge-front
   ```
2. **Instalar dependencias:**
   ```bash
   npm install
   ```
3. **Configurar el entorno:**
   La aplicación espera que el backend esté corriendo en la URL configurada en `axiosClient.js`. Si lo corres localmente, asegúrate de cambiar la `baseURL` apuntando a `http://localhost:PUERTO/api`.
5. **Ejecutar en desarrollo:**
   ```bash
   npm run dev
   ```

*La aplicación estará disponible mediante Vite con Hot Module Replacement (HMR) activo.*

---

**Desarrollado por Andy Barreda / BVAndy259** - *Estudiante de Ingeniería de Software*
