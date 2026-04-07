# SkillPilot MVP

**Plataforma de aprendizaje personalizado con IA**  
**Versión:** 0.1.0  
**Última Actualización:** Abril 2026

## 📋 Descripción General

SkillPilot es una plataforma web moderna de aprendizaje interactivo que utiliza inteligencia artificial para personalizar planes de estudio, generar desafíos de programación dinámicos y proporcionar retroalimentación inteligente en tiempo real. Permite a los usuarios mejorar sus habilidades de código a través de una experiencia gamificada y adaptativa.

## 🏗️ Arquitectura del Sistema

```
┌─────────────────────────────────┐    ┌──────────────────────────┐
│   Frontend (React 19 + Next.js) │    │   Backend (Next.js API)  │
│   - UI Responsiva               │◄──►│   - Rutas API            │
│   - Editor Monaco               │    │   - Lógica de Negocio    │
│   - Animaciones (Framer Motion) │    │   - Integración IA       │
└─────────────────────────────────┘    └──────────────────────────┘
                                              │
                                              ▼
                        ┌─────────────────────────────────┐
                        │   Base de Datos (MySQL)         │
                        │   - Usuarios                    │
                        │   - Progreso                    │
                        │   - Historial de Desafíos       │
                        │   - Analytics                   │
                        └─────────────────────────────────┘
                                              │
                                ┌─────────────┴──────────────┐
                                ▼                            ▼
                    ┌──────────────────────┐    ┌──────────────────────┐
                    │   Groq API (IA)      │    │   OpenAI API (IA)    │
                    │   - Generación       │    │   - Evaluación       │
                    │   - Análisis         │    │   - Análisis Código  │
                    └──────────────────────┘    └──────────────────────┘
```

### Componentes Principales

- **Frontend:** Interfaz responsiva construida con React 19 y Next.js 15
- **Backend:** API REST con Next.js API Routes
- **Base de Datos:** MySQL para persistencia de datos
- **IA:** Integración con Groq y OpenAI para procesamiento inteligente
- **Editor:** Monaco Editor embebido para escritura de código
- **Almacenamiento:** Caché local para optimización

## 🚀 Funcionalidades

### Funcionalidades Core

- **Autenticación Segura:** Sistema de login/registro con JWT y contraseñas con hash bcrypt
- **Generación de Planes:** IA crea planes de aprendizaje personalizados según objetivos
- **Desafíos Dinámicos:** Generación automática de ejercicios de código progresivos
- **Editor Multi-archivo:** Editor Monaco integrado para escribir y probar código
- **Evaluación Inteligente:** IA evalúa soluciones y proporciona retroalimentación
- **Historial Completo:** Seguimiento de todos los desafíos resueltos y attempts
- **Sistema de Logros:** Insignias y reconocimientos por hitos alcanzados
- **Analytics Dashboard:** Métricas visuales de progreso y desempeño
- **Progressive Hints:** Pistas inteligentes cuando se bloquea el usuario
- **Caché de Desafíos:** Optimización de rendimiento con almacenamiento en caché

### Módulos del Sistema

- **Autenticación:** Gestión segura de usuarios y sesiones
- **Planes Personalizados:** Creación dinámica de itinerarios de aprendizaje
- **Desafíos:** Generación y evaluación de ejercicios de programación
- **Progreso:** Seguimiento detallado de actividad y logros
- **Editor:** Interfaz completa para escribir y ejecutar código
- **Analytics:** Visualización de métricas y estadísticas
- **Onboarding:** Flujo de bienvenida personalizado

## 📦 Stack Tecnológico

### Frontend

| Tecnología        | Versión  | Descripción                 |
| ----------------- | -------- | --------------------------- |
| **React**         | 19.1.0   | Librería UI                 |
| **Next.js**       | 15.4.6   | Framework React SSR         |
| **Tailwind CSS**  | 4.1.12   | Framework CSS utility-first |
| **Framer Motion** | 12.23.26 | Animaciones y transiciones  |
| **Monaco Editor** | 4.7.0    | Editor de código embebido   |
| **Sonner**        | 2.0.7    | Notificaciones toast        |

### Backend

| Tecnología  | Versión | Descripción              |
| ----------- | ------- | ------------------------ |
| **Node.js** | 18+     | Entorno de ejecución     |
| **Next.js** | 15.4.6  | Framework full-stack     |
| **Express** | (Built) | Subyacente en API Routes |
| **JWT**     | 9.0.3   | Autenticación stateless  |

### Base de Datos

| Tecnología | Versión | Descripción     |
| ---------- | ------- | --------------- |
| **MySQL**  | 8.0+    | SGBD relacional |

### Inteligencia Artificial

| Tecnología | Versión | Descripción             |
| ---------- | ------- | ----------------------- |
| **Groq**   | Latest  | Generación de contenido |
| **OpenAI** | 5.12.2  | Evaluación y análisis   |

### Validación y Seguridad

| Tecnología       | Versión | Descripción            |
| ---------------- | ------- | ---------------------- |
| **Zod**          | 4.2.1   | Validación de esquemas |
| **bcryptjs**     | 3.0.3   | Hash de contraseñas    |
| **jsonwebtoken** | 9.0.3   | Tokens JWT             |

### Utilidades

| Tecnología       | Versión | Descripción              |
| ---------------- | ------- | ------------------------ |
| **uuid**         | 13.0.0  | Generación de IDs únicas |
| **lightningcss** | 1.30.1  | Procesamiento CSS        |
| **js-cookie**    | 3.0.5   | Gestión de cookies       |

### DevOps

| Tecnología       | Descripción        |
| ---------------- | ------------------ |
| **ESLint**       | Linting de código  |
| **Tailwind CSS** | Procesamiento CSS  |
| **PostCSS**      | Transformación CSS |

## 🛠️ Instalación y Configuración

### Requisitos Previos

- **Node.js** 18.0 o superior
- **npm** 8.0 o superior
- **MySQL** 8.0 o superior
- **Git** - Sistema de control de versiones
- Credenciales para **Groq API**
- Credenciales para **OpenAI API**

### 🔧 Instalación Tradicional

#### Pasos

1. **Clonar el repositorio:**

   ```bash
   git clone https://github.com/ZGuillerX/login-jwt.git
   cd skillpilot-mvp
   ```

2. **Instalar dependencias:**

   ```bash
   npm install
   ```

3. **Configurar variables de entorno:**

   ```bash
   cp .env.example .env
   ```

   Editar `.env` con las siguientes variables:

   ```env
   # Base de Datos
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=contraseña
   DB_NAME=skillpilot_db
   DB_PORT=3306

   # IA
   GROQ_API_KEY=groq_api_key
   OPENAI_API_KEY=openai_api_key

   # Seguridad
   JWT_SECRET=jwt_secret_fuerte_aqui

   # Ambiente
   NODE_ENV=development
   ```

4. **Crear base de datos e importar esquema:**

   ```bash
   mysql -u root -p < database/schema.sql
   ```

5. **Iniciar el servidor de desarrollo:**

   ```bash
   npm run dev
   ```

   La aplicación está disponible en `http://localhost:3000`

### 🏃 Scripts Disponibles

```bash
# Desarrollo
npm run dev        # Inicia servidor con hot-reload

# Producción
npm run build      # Compila para producción
npm run start      # Inicia servidor de producción

# Calidad de Código
npm run lint       # Ejecuta ESLint
```

## 📁 Estructura del Proyecto

```
skillpilot-mvp/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── layout.js                 # Layout principal
│   │   ├── page.jsx                  # Home
│   │   ├── global.css                # Estilos globales
│   │   ├── api/                      # API Routes
│   │   │   ├── ai/
│   │   │   │   ├── challenges/       # Generación de desafíos
│   │   │   │   ├── evaluate-code/    # Evaluación de soluciones
│   │   │   │   ├── generate-files/   # Generación de archivos
│   │   │   │   └── plan/             # Creación de planes
│   │   │   ├── auth/                 # Autenticación
│   │   │   │   ├── login/
│   │   │   │   ├── logout/
│   │   │   │   ├── register/
│   │   │   │   └── me/
│   │   │   └── user/                 # Datos de usuario
│   │   │       └── progress/
│   │   ├── challenges/               # Página de desafíos
│   │   ├── history/                  # Historial
│   │   ├── login/                    # Página login
│   │   ├── register/                 # Página registro
│   │   ├── onboarding/               # Onboarding
│   │   ├── profile/                  # Perfil usuario
│   │   └── stats/                    # Analytics
│   ├── components/                   # Componentes React
│   │   ├── AchievementListener.jsx   # Listener de logros
│   │   ├── Achievements.jsx          # Mostrador de logros
│   │   ├── AnalyticsDashboard.jsx    # Dashboard analítico
│   │   ├── ChallengeCard.jsx         # Tarjeta desafío
│   │   ├── Editor.jsx                # Editor de código
│   │   ├── ErrorBoundary.jsx         # Manejador de errores
│   │   ├── InfiniteChallengeCard.jsx # Desafíos infinitos
│   │   ├── MultiFileEditor.jsx       # Editor multi-archivo
│   │   ├── Navbar.jsx                # Navegación
│   │   ├── PlanView.jsx              # Vista de planes
│   │   ├── ProgressiveHints.jsx      # Sistema de pistas
│   │   └── ui/                       # Componentes UI
│   │       ├── Animations.jsx
│   │       ├── Icons.jsx
│   │       ├── ProgressIndicator.jsx
│   │       └── Toaster.jsx
│   ├── contexts/
│   │   └── AuthContext.jsx           # Contexto de autenticación
│   └── lib/                          # Utilidades
│       ├── analytics.js              # Análisis
│       ├── auth.js                   # Helpers auth
│       ├── challengeCache.js         # Caché de desafíos
│       ├── challengeManager.js       # Gestión de desafíos
│       ├── db.js                     # Conexión DB
│       ├── events.js                 # Event system
│       ├── progress.js               # Cálculo de progreso
│       ├── schemas.js                # Esquemas Zod
│       ├── userProgress.js           # Progreso del usuario
│       ├── url-validator.js          # Validador URLs
│       └── ai/                       # Servicios IA
│           ├── ai.js
│           ├── groq.js               # Integración Groq
│           └── prompts.js            # Prompts de IA
├── public/                           # Archivos estáticos
├── database/
│   ├── schema.sql                    # Esquema de DB
│   └── README.md                     # Docs de DB
├── package.json                      # Dependencias
├── next.config.mjs                   # Configuración Next.js
├── tailwind.config.js                # Configuración Tailwind
├── postcss.config.js                 # Configuración PostCSS
├── eslint.config.mjs                 # Configuración ESLint
└── README.md                         # Este archivo
```

## 🔒 Seguridad

### Medidas Implementadas

- **Autenticación JWT:** Tokens seguros y stateless para sesiones
- **Hash de Contraseñas:** bcryptjs con salt automático
- **Validación de Entrada:** Zod para validar todos los datos
- **HTTPS:** Recomendado en producción
- **Variables de Entorno:** Credenciales nunca en el código fuente
- **SQL Seguro:** Prepared statements con mysql2
- **CORS:** Configuración restrictiva de orígenes

### Buenas Prácticas

- Autenticación requerida para endpoints sensibles
- Logs de auditoría en operaciones críticas
- Validación de archivos en multi-file editor
- Limpieza de entrada contra inyecciones
- Encriptación de datos sensibles

## 📊 Rendimiento

### Optimizaciones

- **Caché Local:** Sistema de caché para desafíos frecuentes
- **Code Splitting:** Carga de componentes bajo demanda con Next.js
- **Minificación:** Assets minificados en producción
- **Connection Pooling:** Pool optimizado de conexiones a MySQL
- **Lazy Loading:** Componentes cargados dinámicamente

### Límites del Sistema

- **Timeout API:** 30 segundos
- **Tamaño Máximo Desafío:** 10 MB
- **Conexiones Concurrentes:** 50+ usuarios simultáneos
- **Max Tokens IA:** 2000 tokens por request
- **Rate Limiting:** 100 peticiones por minuto por IP

## 🏃 Uso del Sistema

### Iniciar en Desarrollo

```bash
npm run dev
```

Acceder a: `http://localhost:3000`

### Flujo de Usuario Típico

1. **Registro/Login:** Crear cuenta o iniciar sesión
2. **Onboarding:** Definir objetivo de aprendizaje
3. **Generación de Plan:** IA crea plan personalizado
4. **Desafíos:** Resolver ejercicios progresivos
5. **Evaluación:** Obtener feedback de IA
6. **Analytics:** Seguir progreso en dashboard

### Endpoints API Principales

```bash
# Autenticación
POST   /api/auth/register        # Crear cuenta
POST   /api/auth/login           # Iniciar sesión
POST   /api/auth/logout          # Cerrar sesión
GET    /api/auth/me              # Obtener usuario actual

# IA
POST   /api/ai/plan              # Generar plan
POST   /api/ai/challenges        # Generar desafío
POST   /api/ai/evaluate-code     # Evaluar solución
POST   /api/ai/generate-files    # Generar plantillas

# Progreso
GET    /api/user/progress        # Obtener progreso
GET    /api/user/progress/plans  # Listar planes
POST   /api/user/progress/challenge  # Enviar desafío
```

### Documentación

- [Next.js Docs](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com)
- [Groq API](https://console.groq.com)
- [OpenAI API](https://platform.openai.com)


## 📄 Licencia

**© 2026 SkillPilot - Todos los derechos reservados**

Desarrollado como MVP de plataforma educativa con IA.

---


