# VERA - Asistente Inteligente de Ciberseguridad

## Firebase local

1. Crea un proyecto en Firebase Console.
2. En Authentication, habilita el proveedor Email/Password.
3. Crea la base de Firestore en producción.
4. Registra una aplicación Web y copia sus valores en `.env` (`VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID`). Estos valores del cliente son públicos; la seguridad la aplican Auth y las reglas.
5. Para que el backend local acceda a Firestore, configura `FIREBASE_PROJECT_ID` y credenciales ADC de Google Cloud (`gcloud auth application-default login`) o `FIREBASE_SERVICE_ACCOUNT_JSON` en tu `.env`. Nunca guardes un archivo de service account en Git.
6. Despliega reglas e índices con `npx firebase-tools deploy --only firestore:rules,firestore:indexes`.
7. En dos terminales ejecuta `npm run dev:api` y `npm run dev`.

Sin configuración Firebase, el modo local permite probar la UI y guarda reportes localmente. No uses ese modo para producción.

## Configuración de IA

El backend admite proveedores opcionales. `AI_API_KEY` configura ChatGPT mediante una API compatible con OpenAI; `GEMINI_API_KEY` configura Gemini. `GOOGLE_SAFE_BROWSING_KEY` y `VIRUSTOTAL_API_KEY` activan reputación externa. Guarda esas claves solo como secretos en el entorno del servidor.

## Despliegue

Requisitos: proyecto Firebase, facturación de Google Cloud habilitada para Cloud Run, Firebase CLI y Google Cloud CLI instalados y autenticados.

1. Selecciona el proyecto: `npx firebase-tools login` y `npx firebase-tools use --add`.
2. Construye la web con `.env` configurado con los valores `VITE_FIREBASE_*`.
3. Despliega la API a Cloud Run desde la raíz:

   `gcloud run deploy vera-api --source . --region us-central1 --allow-unauthenticated --set-env-vars FIREBASE_PROJECT_ID=TU_PROJECT_ID,ALLOWED_ORIGIN=https://TU_PROJECT_ID.web.app,NODE_ENV=production`

4. Otorga al service account usado por Cloud Run el rol `Cloud Datastore User` y configura los secretos de IA con Secret Manager; no uses `--set-env-vars` para claves privadas.
5. Despliega web y seguridad de Firestore: `npm run deploy:hosting`.
6. En Firebase Console > Hosting > Add custom domain, registra tu dominio. Añade en tu proveedor DNS los registros TXT/A que Firebase indique y espera la verificación del certificado TLS.
7. Actualiza `ALLOWED_ORIGIN` del servicio si el dominio personalizado cambia y vuelve a desplegar Cloud Run.

Firebase Hosting sirve `dist` y reenvía `/api/**` al servicio `vera-api` en `us-central1`. El API exige un token Firebase Auth en producción. Las reglas Firestore bloquean acceso directo desde el navegador; el servidor usa Firebase Admin y guarda historial y reportes por UID.

## Seguridad y alcance

- No subas `.env`, credenciales de service account, claves API ni imágenes de usuarios al repositorio.
- La configuración `VITE_FIREBASE_*` se compila en el navegador y no debe contener secretos privados.
- Firestore almacena extractos redactados del análisis para el historial. Define retención y consentimiento antes del lanzamiento público.
- Los reportes no deben almacenar imágenes por defecto.
- Las cuotas de Firestore, Cloud Run y modelos externos pueden generar costos. Configura presupuestos, límites y alertas en Google Cloud.
- El dominio personalizado requiere que controles el dominio y puedas editar su DNS; no se puede completar desde el código.

## Comandos locales

- `npm run lint`
- `npm run build`
- API: `npm run dev:api`
- UI: `npm run dev`
