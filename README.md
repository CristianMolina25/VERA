# VERA - Asistente Inteligente de Ciberseguridad

Aplicación web que ayuda a identificar señales de phishing, estafas y enlaces sospechosos. VERA combina análisis heurístico con proveedores de inteligencia artificial configurables y ofrece recomendaciones en español.

[![Node.js](https://img.shields.io/badge/Node.js-24-339933)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF)](https://vite.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth%20%7C%20Firestore-FFCA28)](https://firebase.google.com/)
[![License](https://img.shields.io/badge/license-Privado-lightgrey)]()

## ¿De qué trata este proyecto?

VERA es una herramienta web de apoyo para revisar mensajes, enlaces e imágenes que podrían formar parte de una estafa digital. El usuario comparte el contenido recibido y la aplicación presenta una clasificación —probablemente seguro, sospechoso o peligroso— junto con una explicación y recomendaciones prácticas.

El sistema está orientado a la prevención y educación en ciberseguridad. Sus resultados son indicativos: no garantizan que un mensaje, sitio web o archivo sea seguro.

La solución está dividida en dos partes:

- **Frontend:** React y Vite, con una interfaz para analizar contenido, consultar el historial y aprender recomendaciones básicas de seguridad.
- **Backend:** API HTTP en Node.js que valida y analiza las solicitudes, aplica reglas de seguridad y puede conectarse a proveedores externos.

## ¿A qué ayuda?

1. **Revisar mensajes sospechosos:** identifica expresiones de urgencia, solicitudes de dinero y señales comunes de fraude.
2. **Evaluar enlaces:** detecta dominios reconocidos, acortadores, protocolos inseguros y posibles intentos de suplantación.
3. **Consultar fuentes externas:** puede verificar reputación mediante Google Safe Browsing y VirusTotal cuando se configuran sus claves.
4. **Obtener análisis con IA:** permite conectar modelos compatibles con OpenAI y Gemini desde el servidor.
5. **Entender el resultado:** explica las señales encontradas y sugiere qué hacer a continuación.
6. **Revisar imágenes y códigos QR:** permite adjuntar imágenes y detectar códigos QR en el navegador; un análisis visual con IA requiere configurar un proveedor compatible.
7. **Consultar análisis anteriores y reportar resultados dudosos:** con Firebase configurado, el historial y los reportes pueden asociarse a la cuenta del usuario.

## Objetivos del sistema

- Ayudar a reconocer señales habituales de phishing, suplantación y fraude digital.
- Proporcionar recomendaciones claras y comprensibles para personas no especialistas.
- Revisar dominios y enlaces antes de que el usuario interactúe con ellos.
- Reducir la exposición de información personal mediante redacción de algunos datos sensibles.
- Permitir autenticación e historial por usuario mediante Firebase.
- Mantener las claves privadas de IA y reputación en el backend, no en el navegador.

## Stack tecnológico

### Frontend

- React 19
- Vite 8
- Firebase Authentication
- `jsqr` para detectar códigos QR en imágenes en el navegador
- CSS propio y diseño adaptable

### Backend

- Node.js 24 en la imagen Docker
- API HTTP basada en los módulos nativos de Node.js
- Firebase Admin SDK
- Firestore para análisis e informes cuando está configurado
- Integración opcional con APIs compatibles con OpenAI y Gemini
- Integración opcional con Google Safe Browsing y VirusTotal

### Infraestructura

- Firebase Hosting para servir la aplicación web
- Cloud Run para desplegar la API
- Firestore para almacenar historial e informes
- Docker para empaquetar el backend

## Funcionalidades principales

### 1. Análisis de mensajes y enlaces

- Analiza texto de hasta 4.000 caracteres.
- Busca señales como urgencia, solicitudes de credenciales o dinero y enlaces sospechosos.
- Identifica dominios de servicios conocidos y dominios que podrían intentar imitarlos.
- Distingue entre resultados probablemente seguros, sospechosos y peligrosos.
- Presenta una explicación y recomendaciones para cada resultado.

### 2. Análisis con proveedores de IA

- Permite configurar un proveedor compatible con OpenAI o Gemini.
- Puede consultar ambos proveedores y mostrar si sus clasificaciones coinciden.
- Mantiene un análisis heurístico como alternativa cuando no hay un proveedor configurado o este no está disponible.
- Puede enviar imágenes a modelos compatibles con visión, si se configuran las credenciales y el modelo correspondiente.

### 3. Revisión de imágenes y códigos QR

- Acepta imágenes PNG, JPG y WEBP de hasta 5 MB desde la interfaz.
- Detecta códigos QR en el navegador y agrega su contenido al análisis.
- Envía la imagen al backend para revisión; el análisis visual depende de tener configurado un proveedor de IA compatible.
- Sin un modelo de visión configurado, VERA indica que la imagen requiere revisión y no afirma haberla interpretado.

### 4. Reputación y redirecciones

- Puede consultar Google Safe Browsing y VirusTotal si se configuran sus claves.
- Puede revisar redirecciones HTTP cuando se habilita `CHECK_REDIRECTS`.
- Aplica validaciones para evitar consultar direcciones locales o privadas.
- Estas comprobaciones externas son opcionales y pueden estar sujetas a cuotas y costos.

### 5. Cuenta e historial

- Incluye registro e inicio de sesión con correo y contraseña mediante Firebase Authentication.
- Guarda análisis asociados al usuario en Firestore cuando Firebase está configurado.
- Muestra consultas recientes en la sección de historial.
- En modo local sin Firebase, el historial no tiene persistencia equivalente a la de producción.

### 6. Reportes y guía de seguridad

- Permite reportar un diagnóstico dudoso.
- Guarda los reportes en Firestore si Firebase Admin está disponible; de lo contrario, puede almacenarlos localmente en formato NDJSON.
- Incluye una guía con recomendaciones para reconocer urgencias falsas, proteger credenciales y verificar solicitudes por otro canal.

### 7. Seguridad y privacidad

- Las claves privadas de IA y reputación se configuran en el backend.
- El servidor elimina o reemplaza ciertos números y correos antes de enviar el texto al análisis y guardar extractos.
- La API limita el número de solicitudes por dirección IP.
- En producción, el backend exige un token válido de Firebase Authentication.
- Las reglas de Firestore bloquean el acceso directo desde el navegador; las operaciones se realizan desde el servidor.

## Requisitos previos

- Node.js y npm
- Firebase CLI para desplegar Hosting y reglas
- Google Cloud CLI para desplegar la API en Cloud Run
- Proyecto de Firebase configurado para Authentication y Firestore
- Facturación de Google Cloud habilitada para desplegar en Cloud Run

## Configuración local

1. Instala las dependencias:

   ```bash
   npm install
