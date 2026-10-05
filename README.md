# VERA - Asistente Inteligente de Ciberseguridad

Aplicación web orientada a la identificación de señales de phishing, estafas, suplantación de identidad y enlaces potencialmente sospechosos. VERA combina análisis heurístico con proveedores de inteligencia artificial configurables y presenta recomendaciones de seguridad de forma clara y comprensible.

[![Node.js](https://img.shields.io/badge/Node.js-24-339933)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF)](https://vite.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth%20%7C%20Firestore-FFCA28)](https://firebase.google.com/)
[![Docker](https://img.shields.io/badge/Docker-Backend-2496ED)](https://www.docker.com/)

---

## Funciones del software

VERA permite analizar mensajes, enlaces e imágenes que puedan contener señales de fraude o amenazas digitales.

La aplicación proporciona una clasificación del contenido analizado:

* 🟢 **Probablemente seguro**
* 🟡 **Sospechoso**
* 🔴 **Peligroso**

Además del resultado, el sistema muestra las señales detectadas y recomendaciones sobre las acciones que debería tomar el usuario.

---

## ¿De qué trata este proyecto?

VERA es una herramienta web de apoyo a la **prevención y educación en ciberseguridad**, diseñada para ayudar a los usuarios a identificar posibles intentos de phishing, estafas digitales, suplantación de identidad y enlaces maliciosos.

El usuario puede proporcionar un mensaje, enlace o imagen para que el sistema realice diferentes comprobaciones de seguridad.

El análisis combina:

* Reglas heurísticas.
* Análisis de dominios y enlaces.
* Detección de códigos QR.
* Servicios externos de reputación.
* Modelos de inteligencia artificial configurables.
* Recomendaciones de seguridad.

La aplicación está dividida principalmente en dos partes:

* **Frontend:** React + Vite.
* **Backend:** Node.js mediante una API HTTP.

Además, utiliza Firebase para autenticación y almacenamiento de información cuando se encuentra correctamente configurado.

---

## ¿A qué ayuda VERA?

1. **Detectar señales de phishing:** identifica patrones comunes utilizados en mensajes fraudulentos.
2. **Analizar enlaces sospechosos:** revisa dominios, protocolos, acortadores y posibles intentos de suplantación.
3. **Detectar códigos QR:** permite cargar imágenes y detectar códigos QR directamente desde el navegador.
4. **Consultar reputación externa:** puede utilizar servicios como Google Safe Browsing y VirusTotal.
5. **Utilizar inteligencia artificial:** permite conectar proveedores como OpenAI y Gemini.
6. **Explicar los resultados:** presenta las señales encontradas y recomendaciones para el usuario.
7. **Mantener historial:** permite consultar análisis anteriores cuando Firebase está configurado.
8. **Reportar resultados:** permite registrar diagnósticos que el usuario considere dudosos.
9. **Educar en seguridad digital:** incluye recomendaciones para reconocer y evitar diferentes tipos de estafas.

---

## Objetivos del sistema

* Ayudar a los usuarios a reconocer señales de phishing y fraude digital.
* Facilitar la revisión de mensajes y enlaces antes de interactuar con ellos.
* Identificar posibles intentos de suplantación de identidad.
* Proporcionar explicaciones comprensibles sobre los riesgos detectados.
* Integrar diferentes mecanismos de análisis en una sola plataforma.
* Utilizar inteligencia artificial como apoyo para el análisis de contenido.
* Mantener las credenciales y claves privadas en el backend.
* Permitir autenticación e historial de análisis mediante Firebase.
* Promover buenas prácticas de seguridad y protección de información personal.

---

# Stack tecnológico

## Frontend

* React 19
* Vite 8
* Firebase Authentication
* `jsqr` para detección de códigos QR
* JavaScript
* CSS
* Diseño adaptable para diferentes dispositivos

## Backend

* Node.js 24
* API HTTP
* Firebase Admin SDK
* Firestore
* Integración opcional con OpenAI
* Integración opcional con Gemini
* Google Safe Browsing
* VirusTotal

## Infraestructura

* Firebase Hosting
* Firebase Authentication
* Cloud Run
* Firestore
* Docker
* Google Cloud

---

# Funcionalidades principales

## 1. Análisis de mensajes

VERA permite analizar mensajes introducidos por el usuario para identificar posibles señales de fraude.

El sistema puede detectar patrones relacionados con:

* Solicitudes urgentes.
* Solicitudes de dinero.
* Solicitudes de credenciales.
* Solicitudes de información personal.
* Enlaces sospechosos.
* Posibles intentos de suplantación.
* Patrones habituales de phishing.

El resultado incluye una clasificación y una explicación de las señales encontradas.

---

## 2. Análisis de enlaces

El sistema permite analizar URLs para identificar posibles riesgos.

Entre las comprobaciones se encuentran:

* Identificación de dominios.
* Detección de protocolos inseguros.
* Identificación de acortadores de enlaces.
* Reconocimiento de dominios conocidos.
* Detección de posibles dominios de suplantación.
* Consulta de reputación mediante servicios externos cuando están configurados.
* Revisión de redirecciones HTTP cuando esta funcionalidad está habilitada.

El sistema también aplica validaciones para evitar realizar consultas hacia direcciones locales o privadas.

---

## 3. Análisis mediante inteligencia artificial

VERA puede utilizar proveedores externos de inteligencia artificial para complementar el análisis heurístico.

Actualmente puede configurarse para trabajar con:

* OpenAI.
* Gemini.

Cuando los proveedores de IA no están disponibles o no se han configurado sus credenciales, el sistema puede continuar utilizando el análisis heurístico.

Esto permite que la aplicación mantenga una funcionalidad básica incluso sin depender obligatoriamente de servicios externos de inteligencia artificial.

---

## 4. Análisis de imágenes y códigos QR

VERA permite cargar imágenes para realizar comprobaciones de seguridad.

Formatos admitidos:

* PNG
* JPG
* WEBP

El tamaño máximo permitido para las imágenes es de 5 MB.

El sistema puede detectar códigos QR directamente en el navegador utilizando `jsQR`.

Cuando se encuentra un código QR, su contenido puede incorporarse al análisis para determinar si contiene un enlace o información potencialmente sospechosa.

El análisis visual mediante inteligencia artificial depende de que exista un proveedor compatible con visión correctamente configurado.

---

## 5. Reputación de enlaces

Cuando se configuran las respectivas credenciales, VERA puede consultar servicios externos para obtener información adicional sobre una URL.

Entre ellos:

* Google Safe Browsing.
* VirusTotal.

Estas consultas permiten complementar el análisis realizado mediante las reglas internas de la aplicación.

Las funcionalidades externas pueden depender de límites de uso, cuotas o condiciones propias de cada proveedor.

---

## 6. Autenticación de usuarios

La aplicación utiliza Firebase Authentication para gestionar las cuentas de usuario.

Permite:

* Registro.
* Inicio de sesión.
* Autenticación mediante correo electrónico y contraseña.
* Asociación de información con el usuario autenticado.
* Protección de funcionalidades que requieren autenticación.

En producción, el backend puede validar el token de autenticación proporcionado por Firebase.

---

## 7. Historial de análisis

Los análisis realizados pueden asociarse al usuario y almacenarse mediante Firestore cuando Firebase está correctamente configurado.

El historial permite consultar análisis anteriores y revisar nuevamente los resultados obtenidos.

En una configuración local sin Firebase, esta persistencia puede no estar disponible de la misma manera que en el entorno de producción.

---

## 8. Reportes

VERA permite reportar diagnósticos que el usuario considere incorrectos o dudosos.

Los reportes pueden almacenarse:

* En Firestore cuando Firebase está disponible.
* Localmente en formato NDJSON cuando no se encuentra disponible la persistencia mediante Firebase.

Esta funcionalidad permite recopilar casos que posteriormente pueden utilizarse para mejorar el análisis.

---

## 9. Guía de seguridad

La aplicación incluye contenido educativo relacionado con ciberseguridad.

Entre las recomendaciones se encuentran prácticas para:

* Reconocer mensajes fraudulentos.
* Identificar solicitudes urgentes sospechosas.
* Proteger contraseñas y credenciales.
* Verificar solicitudes por canales alternativos.
* Evitar ingresar información sensible en sitios desconocidos.
* Revisar enlaces antes de abrirlos.

---

# Seguridad y privacidad

VERA incorpora diferentes mecanismos orientados a proteger la información procesada por la aplicación.

Entre ellos:

* Las claves de los servicios externos se mantienen en el backend.
* Las credenciales de servicios externos no deben exponerse en el frontend.
* Se aplican mecanismos de autenticación mediante Firebase.
* El backend puede validar los tokens de los usuarios.
* Se aplican límites de solicitudes por dirección IP.
* Se realizan validaciones sobre URLs antes de efectuar determinadas consultas.
* Se pueden eliminar o reemplazar determinados datos sensibles antes de procesar o almacenar información.

Las claves privadas y variables sensibles deben configurarse mediante variables de entorno y nunca almacenarse directamente dentro del código fuente o repositorio.

---

# Requisitos previos

Para ejecutar el proyecto localmente se recomienda contar con:

* **Node.js**
* **npm**
* **Git**
* Cuenta/proyecto de Firebase para funcionalidades de autenticación y almacenamiento.
* Firebase CLI para despliegues.
* Google Cloud CLI para despliegues en Cloud Run.
* Docker, si se desea construir y ejecutar el backend mediante contenedores.

---

# Configuración local

## 1. Clonar el repositorio

```bash
git clone <URL_DEL_REPOSITORIO>
```

Entrar en la carpeta:

```bash
cd VERA
```

---

## 2. Instalar dependencias

```bash
npm install
```

---

## 3. Configurar variables de entorno

Crear un archivo `.env` utilizando como referencia:

```text
.env.example
```

Las variables necesarias dependen de los servicios que se quieran utilizar.

Por ejemplo:

* Firebase.
* OpenAI.
* Gemini.
* Google Safe Browsing.
* VirusTotal.

Las claves de estos servicios deben permanecer únicamente en el backend cuando corresponda.

---

# Ejecución del proyecto

## Iniciar el backend

En una terminal:

```bash
npm run dev:api
```

La API local normalmente estará disponible en:

```text
http://localhost:8787
```

También puede consultarse el estado del servidor mediante:

```text
/api/health
```

---

## Iniciar el frontend

En otra terminal:

```bash
npm run dev
```

Vite mostrará en la terminal la dirección donde se encuentra disponible la aplicación.

Normalmente:

```text
http://localhost:5173
```

---

# Comandos disponibles

```bash
npm run dev
```

Inicia el frontend en modo desarrollo.

```bash
npm run dev:api
```

Inicia la API backend en modo desarrollo.

```bash
npm run build
```

Construye el frontend para producción.

```bash
npm run preview
```

Permite previsualizar la compilación de producción.

```bash
npm run lint
```

Ejecuta las comprobaciones de código configuradas en el proyecto.

```bash
npm run deploy:hosting
```

Realiza el despliegue del frontend mediante Firebase Hosting.

---

# Despliegue

El proyecto puede desplegarse utilizando servicios de Google Cloud y Firebase.

## Frontend

El frontend se construye mediante Vite y puede desplegarse en:

**Firebase Hosting**

Las solicitudes dirigidas a determinadas rutas de la API pueden ser redirigidas hacia el backend desplegado en Cloud Run.

## Backend

La API puede empaquetarse mediante Docker y desplegarse en:

**Google Cloud Run**

El backend utiliza variables de entorno para configurar:

* Firebase Admin.
* Proveedores de inteligencia artificial.
* Servicios de reputación.
* Configuración de seguridad.
* Otros servicios externos.

Las claves privadas deben almacenarse como secretos o variables de entorno del servicio y no dentro del código fuente.

---

# Arquitectura general

```text
                    ┌─────────────────────┐
                    │       Usuario       │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   React + Vite      │
                    │      Frontend       │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │    Node.js API      │
                    │      Backend        │
                    └──────────┬──────────┘
                               │
             ┌─────────────────┼─────────────────┐
             │                 │                 │
             ▼                 ▼                 ▼
      ┌─────────────┐   ┌─────────────┐   ┌──────────────┐
      │  Firebase   │   │ Inteligencia│   │ Reputación   │
      │ Auth/       │   │ Artificial  │   │ de URLs      │
      │ Firestore   │   │             │   │              │
      └─────────────┘   └─────────────┘   └──────────────┘
                               │                 │
                               ▼                 ▼
                         ┌───────────┐     ┌──────────────┐
                         │ OpenAI /  │     │ Safe Browsing│
                         │ Gemini    │     │ / VirusTotal │
                         └───────────┘     └──────────────┘
```

---

# Estructura del repositorio

```text
VERA/
│
├── src/
│   ├── assets/
│   │   └── # Recursos e imágenes de la interfaz
│   │
│   ├── App.jsx
│   │   ├── # Aplicación principal
│   │   ├── # Autenticación
│   │   ├── # Vistas
│   │   ├── # Análisis
│   │   └── # Historial
│   │
│   ├── App.css
│   │   └── # Estilos de la aplicación
│   │
│   ├── firebase.js
│   │   └── # Configuración cliente de Firebase
│   │
│   └── main.jsx
│       └── # Punto de entrada de React
│
├── server/
│   ├── analyzer.js
│   │   └── # Motor de análisis y reglas heurísticas
│   │
│   ├── firebase.js
│   │   └── # Firebase Admin, autenticación e historial
│   │
│   ├── index.js
│   │   └── # API HTTP principal
│   │
│   ├── providers.js
│   │   └── # Integración con OpenAI y Gemini
│   │
│   ├── reputation.js
│   │   └── # Reputación de URLs y redirecciones
│   │
│   └── reports.js
│       └── # Gestión y almacenamiento de reportes
│
├── .env.example
│   └── # Plantilla de variables de entorno
│
├── Dockerfile
│   └── # Configuración del contenedor del backend
│
├── firebase.json
│   └── # Configuración de Firebase Hosting
│
├── firestore.indexes.json
│   └── # Índices de Firestore
│
├── firestore.rules
│   └── # Reglas de seguridad de Firestore
│
├── package.json
│   └── # Dependencias y scripts
│
├── vite.config.js
│   └── # Configuración de Vite
│
└── README.md
    └── # Documentación principal
```

---

# Flujo de análisis

El funcionamiento general de VERA puede representarse de la siguiente manera:

```text
Usuario
   │
   ▼
Ingresa mensaje / URL / imagen
   │
   ▼
Frontend React
   │
   ▼
API Node.js
   │
   ├──► Análisis heurístico
   │
   ├──► Detección de QR
   │
   ├──► Análisis de dominio
   │
   ├──► Reputación externa
   │
   └──► Inteligencia artificial
             │
             ├──► OpenAI
             └──► Gemini
   │
   ▼
Clasificación del riesgo
   │
   ├──► Probablemente seguro
   ├──► Sospechoso
   └──► Peligroso
   │
   ▼
Explicación + recomendaciones
   │
   ▼
Historial / Reporte
```

---

# Alcance y consideraciones

VERA es una **herramienta de apoyo a la ciberseguridad**, no un antivirus ni un sistema capaz de garantizar que un enlace, mensaje o archivo sea completamente seguro.

Los resultados del análisis son indicativos y deben interpretarse junto con el contexto del usuario.

Algunas funcionalidades dependen de servicios externos y de su correspondiente configuración:

* Inteligencia artificial.
* Google Safe Browsing.
* VirusTotal.
* Firebase Authentication.
* Firestore.
* Google Cloud.

Cuando los proveedores externos no están configurados o no están disponibles, VERA puede utilizar sus mecanismos de análisis heurístico para realizar una evaluación básica.

Antes de utilizar el sistema en un entorno público o empresarial, se recomienda establecer políticas de:

* Privacidad.
* Consentimiento.
* Retención de datos.
* Límites de uso.
* Protección de credenciales.
* Control de costos de APIs externas.
* Gestión de información sensible.

---

# Proyecto

**VERA — Asistente Inteligente de Ciberseguridad**

Sistema web desarrollado para apoyar la identificación y prevención de amenazas digitales mediante análisis heurístico, inteligencia artificial, reputación de enlaces y educación en ciberseguridad.
