# VisioAid — propuesta de estructura React Native

> Estado: **scaffolding aprobado e inicializado el 1 de septiembre de 2026**. Solo se conserva el código mínimo de Expo/React Native; las carpetas funcionales están vacías.

## 1. Decisiones de partida

- Crear la aplicación móvil directamente en la raíz del repositorio. La documentación del proyecto vivirá en `docs/`.
- Usar React Native con Expo, TypeScript estricto y Expo Router.
- Usar NativeWind con Tailwind CSS para aplicar estilos mediante `className` sobre componentes nativos.
- Crear un development build; el OCR con Google ML Kit necesitará código nativo y no dependerá de Expo Go.
- Mantener los archivos de `app/` como rutas delgadas. La interfaz y la lógica vivirán en `src/`.
- Encapsular cámara, OCR, voz, almacenamiento y API. Ninguna pantalla llamará directamente a esas APIs.
- Procesar las fotografías y el texto reconocido de forma temporal. No se guardarán en la galería, almacenamiento persistente, backend, logs ni analítica.
- Persistir las preferencias no sensibles de forma local y guardar los tokens de sesión únicamente en almacenamiento seguro.
- Usar negro y blanco como paleta visual base de todas las pantallas para ofrecer el máximo contraste posible.
- Usar nombres de archivo en `kebab-case`, componentes React en `PascalCase` y código en inglés. Los textos visibles estarán inicialmente en español.

## 2. Flujo de navegación propuesto

```text
Inicio técnico
├── Sin sesión -> Login <-> Register
└── Con sesión
    ├── Permiso de cámara sin decidir -> Permissions
    └── MainPage
        ├── Camera
        │   ├── OCR correcto -> Transcript
        │   └── OCR vacío o error recuperable -> ErrorTranscript
        └── Config
```

`app/index.tsx` será una ruta técnica sin interfaz de negocio: decidirá el destino según la sesión y el estado del permiso. No se propone una pantalla adicional para ella.

## 3. Correspondencia con los componentes solicitados

| Nombre solicitado | Ruta propuesta                      | Responsabilidad                                                                            |
| ----------------- | ----------------------------------- | ------------------------------------------------------------------------------------------ |
| Register          | `app/(auth)/register.tsx`           | Crear una cuenta y enlazar con Login.                                                      |
| Login             | `app/(auth)/login.tsx`              | Iniciar sesión con correo/contraseña, Google o Apple.                                      |
| Permitions        | `app/(onboarding)/permissions.tsx`  | Explicar y solicitar solamente el permiso de cámara. Se corrige el nombre a `Permissions`. |
| mainPage          | `app/(reader)/main.tsx`             | Acción principal para abrir la cámara y acceso a Config.                                   |
| camera            | `app/(reader)/camera.tsx`           | Vista previa, captura temporal y estado de procesamiento.                                  |
| transcript        | `app/(reader)/transcript.tsx`       | Mostrar el texto y controlar lectura, pausa/reanudación y nueva captura.                   |
| errorTranscript   | `app/(reader)/error-transcript.tsx` | Explicar el fallo y permitir volver a intentar.                                            |
| config            | `app/(reader)/config.tsx`           | Apariencia clara/oscura de alto contraste, tipografía, tamaño y velocidad de voz.          |

## 4. Árbol de directorios propuesto

```text
VisioAid/
├── .gitignore
├── .husky/
│   └── pre-commit
├── .prettierignore
├── .prettierrc.json
├── README.md
├── docs/
│   ├── PROJECT_CONTEXT.md
│   └── REACT_NATIVE_PROJECT_STRUCTURE.md
├── app/
│   ├── _layout.tsx
│   ├── index.tsx
│   ├── (auth)/                  # Vacía
│   ├── (onboarding)/            # Vacía
│   └── (reader)/                # Vacía
├── assets/
│   ├── fonts/
│   ├── icons/
│   └── images/
├── src/
│   ├── components/
│   │   └── ui/                  # Vacía
│   ├── features/
│   │   ├── auth/
│   │   │   └── components/      # Vacía
│   │   ├── permissions/
│   │   │   └── components/      # Vacía
│   │   ├── camera/
│   │   │   └── components/      # Vacía
│   │   ├── reader/
│   │   │   └── components/      # Vacía
│   │   └── settings/
│   │       └── components/      # Vacía
│   ├── hooks/                   # Vacía
│   ├── infrastructure/
│   │   ├── api/                 # Vacía
│   │   ├── camera/              # Vacía
│   │   ├── ocr/                 # Vacía
│   │   ├── speech/              # Vacía
│   │   └── storage/             # Vacía
│   ├── accessibility/           # Vacía
│   ├── config/                  # Vacía
│   ├── constants/               # Vacía
│   ├── errors/                  # Vacía
│   └── types/                   # Vacía
├── .env.example
├── app.config.ts
├── babel.config.js
├── eslint.config.js
├── expo-env.d.ts
├── global.css
├── metro.config.js
├── nativewind-env.d.ts
├── package.json
├── tailwind.config.js
└── tsconfig.json
```

## 5. Componentes reutilizables sugeridos

Estos no agregan pantallas ni amplían el alcance funcional; evitan duplicar controles y centralizan accesibilidad. Requieren aprobación junto con el árbol anterior.

- `ScreenContainer`: Safe Area, fondo, ancho y espaciado común.
- `AccessibleButton` y `AccessibleIconButton`: área táctil, estados, etiquetas y pistas para TalkBack/VoiceOver.
- `FormField`: etiqueta, entrada, error y manejo del teclado para Login/Register.
- `CameraPermissionExplainer`: explicación previa al diálogo nativo.
- `CameraPreview`, `CaptureButton` y `ProcessingOverlay`: separan vista previa, captura y progreso.
- `TranscriptPanel` y `SpeechControls`: muestran el texto y controlan la lectura sin acoplarse a `expo-speech`.
- `SettingToggle`, `FontScaleControl` y `SpeechRateControl`: controles consistentes para Config.
- `VisioAidLogo`: representación accesible de la marca, sin usar el icono como única fuente de información.

No se propone por ahora `ForgotPassword`, verificación de correo, perfil, historial, tutorial ni confirmación de fotografía. Si se requieren, deberán aprobarse como alcance adicional.

## 6. Sistema visual de alto contraste

El alto contraste será una característica permanente del producto, no una opción que pueda quedar desactivada. Toda pantalla, diálogo, estado de carga y mensaje de error utilizará uno de estos dos temas:

| Token semántico  | Tema oscuro predeterminado | Tema claro alternativo |
| ---------------- | -------------------------: | ---------------------: |
| `background`     |                  `#000000` |              `#FFFFFF` |
| `surface`        |                  `#000000` |              `#FFFFFF` |
| `textPrimary`    |                  `#FFFFFF` |              `#000000` |
| `textSecondary`  |                  `#FFFFFF` |              `#000000` |
| `border`         |                  `#FFFFFF` |              `#000000` |
| `icon`           |                  `#FFFFFF` |              `#000000` |
| `focusIndicator` |                  `#FFFFFF` |              `#000000` |

El negro puro y el blanco puro ofrecen una relación de contraste de `21:1`. Se evitarán grises, transparencias, degradados y sombras cuando reduzcan el contraste o sean la única forma de distinguir elementos.

Reglas obligatorias para los estilos:

- Centralizar los colores en `src/constants/theme.ts`; ninguna pantalla tendrá colores literales aislados.
- Mantener el tema oscuro de alto contraste como valor inicial y permitir invertirlo al tema claro, que conserva la misma relación de contraste.
- Eliminar el interruptor «Alto contraste» del prototipo porque el contraste elevado siempre estará activo. El control «Modo oscuro» únicamente invertirá negro y blanco.
- Usar tamaño, peso tipográfico, espaciado, bordes y etiquetas para crear jerarquía; no introducir grises para simular información secundaria.
- Mostrar bordes visibles en campos, botones, tarjetas, controles de reproducción y estados de foco.
- No comunicar éxito, error, selección, permiso o reproducción mediante color solamente. Cada estado tendrá texto, forma o icono distinguible y descripción accesible.
- Mantener cada objetivo táctil en un mínimo de `48 × 48 dp`, con separación suficiente entre acciones.
- Respetar la escala de fuente del sistema y verificar la interfaz con texto ampliado al `200 %`, sin recortes ni superposiciones.
- Evitar párrafos largos centrados, texto en cursiva, mayúsculas sostenidas y fuentes con trazos delgados.
- La imagen real de la vista previa de cámara es la única excepción a la paleta monocromática. Sus guías, botones, mensajes y superposiciones permanecerán en negro y blanco con borde contrastante.
- Los estados deshabilitados no dependerán de reducir la opacidad. Se explicará mediante texto por qué la acción no está disponible.
- Probar ambos temas con TalkBack, VoiceOver, texto ampliado y las opciones del sistema para aumentar contraste y diferenciar sin color.

Recomendaciones para validar con usuarios:

1. Conservar las variantes oscura y clara porque distintas personas con baja visión pueden preferir fondos diferentes, aunque ambas sean de alto contraste.
2. Usar inicialmente texto de cuerpo de al menos `18 sp`, títulos desde `24 sp` y controles principales con etiquetas grandes; los valores finales deben validarse en dispositivos reales.
3. Permitir una tipografía de apoyo para dislexia, pero conservar la fuente del sistema como predeterminada por su integración con el escalado del dispositivo.
4. Reducir animaciones no esenciales y respetar la preferencia del sistema para reducir movimiento.
5. Realizar pruebas tempranas con personas con baja visión. El contraste matemático por sí solo no garantiza que el tamaño, el foco, el orden de lectura y la densidad visual sean adecuados.

Estas reglas toman como mínimo WCAG 2.2: `4.5:1` para texto normal, `3:1` para texto grande y elementos gráficos, aunque la paleta base de VisioAid alcanza `21:1`.

## 7. Dependencias aprobadas

Las versiones no se fijarán a mano. `create-expo-app` elegirá las versiones base y `npx expo install` resolverá las compatibles con el SDK seleccionado.

### Incluidas o configuradas por la plantilla Expo

- `expo`, `react`, `react-native`: plataforma base.
- `expo-router`: rutas tipadas y navegación basada en archivos.
- `react-native-safe-area-context` y `react-native-screens`: integración segura con navegación nativa.
- `expo-status-bar`, `expo-font` y `expo-splash-screen`: estado, tipografías y arranque.

### Funcionalidad del producto

- `expo-dev-client`: development build requerido para dependencias nativas y ML Kit.
- `expo-camera`: permiso, vista previa y captura temporal.
- `expo-file-system`: eliminación explícita del archivo temporal después del OCR.
- `expo-speech`: lectura en voz alta mediante el motor del dispositivo.
- `expo-secure-store`: tokens de sesión y otros secretos pequeños.
- `@react-native-async-storage/async-storage`: preferencias locales no sensibles.
- `@react-native-community/slider`: tamaño del texto y velocidad de lectura.
- `zustand`: sesión, preferencias y estado efímero del flujo de lectura.
- `react-hook-form`, `zod` y `@hookform/resolvers`: formularios accesibles y validación tipada.

### Autenticación del MVP

- `expo-auth-session`, `expo-web-browser` y `expo-crypto`: flujo OAuth/OIDC de Google sin incluir secretos en la app.
- `expo-apple-authentication`: inicio de sesión nativo con Apple en iOS.

El correo/contraseña consumirá el backend mediante `fetch`, por lo que no se necesita `axios`.

### Desarrollo y verificación

- TypeScript y ESLint provenientes de la plantilla.
- `nativewind` y `tailwindcss`: utilidades de estilo compatibles con componentes React Native.
- Prettier para formato consistente y Husky para ejecutar las verificaciones antes de cada commit.
- Expo Doctor para validar la compatibilidad entre el SDK, la configuración y las dependencias instaladas.

El MVP no incluirá por ahora infraestructura ni dependencias de pruebas unitarias. La verificación inicial se limitará a TypeScript, ESLint, Expo Doctor y pruebas manuales en Android e iOS.

### Dependencia deliberadamente aplazada

No se instalará todavía un wrapper de Google ML Kit. Primero se evaluará su mantenimiento y compatibilidad con el SDK de Expo elegido. `ocr-service.ts` definirá el contrato para poder conectar después:

1. una librería mantenida compatible con development builds; o
2. un módulo local mediante Expo Modules API.

Esta decisión evita acoplar las pantallas a una librería que todavía figura como decisión abierta en `PROJECT_CONTEXT.md`.

Tampoco se instalarán por ahora React Query, librerías de analítica ni un SDK externo de autenticación: no son necesarios para generar estas pantallas y ampliarían el alcance.

## 8. Configuración nativa, accesibilidad y privacidad

- `app.config.ts` definirá `scheme`, `ios.bundleIdentifier`, `android.package` y rutas tipadas.
- El plugin de `expo-camera` incluirá una explicación en español para `NSCameraUsageDescription`.
- La aplicación no grabará audio; se bloqueará `android.permission.RECORD_AUDIO` si alguna dependencia intenta incorporarlo.
- No se solicitará permiso de galería o biblioteca multimedia.
- La URI de la captura se conservará solo durante el OCR y luego se eliminará de la caché.
- El texto reconocido vivirá únicamente en el estado efímero de `reader.store.ts` y se descartará al cerrar o iniciar otra captura.
- `.env.example` documentará solo valores públicos como la URL de la API y los client IDs públicos. No habrá secretos dentro de variables `EXPO_PUBLIC_*`.
- Los controles tendrán etiquetas, roles, estados y áreas táctiles accesibles; se validará el orden del foco y los anuncios hablados.
- Login y Register usarán `KeyboardAvoidingView`; todas las pantallas respetarán Safe Area y el flujo controlará el botón Atrás de Android.
- Cada pantalla consumirá únicamente tokens semánticos de `theme.ts` para garantizar la aplicación consistente de la paleta negra y blanca.

## 9. `.gitignore` aprobado

El único `.gitignore`, ubicado en la raíz, ignora los artefactos generales y las exclusiones de Expo.

```gitignore
# macOS
.DS_Store

# Dependencies and Expo
node_modules/
.expo/
dist/
web-build/

# Native projects generated by Expo CNG
android/
ios/

# Local environment files; keep examples
.env
.env.local
.env.*.local
!.env.example

# Logs
*.log
```

## 10. Comandos utilizados durante la implementación

```bash
# La plantilla Expo se generó primero en un directorio temporal para no
# sobrescribir README.md, docs/ ni los demás archivos existentes de la raíz.
npx create-expo-app@latest <directorio-temporal>/visioaid --template default@sdk-57

# Después de integrar los archivos de la plantilla en la raíz del repositorio:
npx expo install expo-dev-client expo-camera expo-file-system expo-speech expo-secure-store @react-native-async-storage/async-storage @react-native-community/slider expo-auth-session expo-web-browser expo-crypto expo-apple-authentication
npm install zustand react-hook-form zod @hookform/resolvers
npx expo-doctor
```

Después se reemplazó el contenido de ejemplo por el árbol aprobado, se creó el `.gitignore` raíz y se comprobaron TypeScript, ESLint y Expo Doctor. En esta etapa no se implementó la interfaz visual completa ni la integración real de OCR.

## 11. Resultado de esta fase

1. Proyecto Expo creado directamente en la raíz con su `.gitignore`.
2. Dependencias aprobadas instaladas con versiones compatibles con Expo SDK 57.
3. Carpetas principales creadas vacías y conservadas mediante `.gitkeep`.
4. Solo `app/_layout.tsx` y `app/index.tsx` contienen el mínimo requerido por Expo Router.
5. Las reglas futuras de alto contraste permanecen documentadas, pero todavía no existen archivos de estilos.
6. Jest, infraestructura de pruebas unitarias y carpeta `tests/` excluidos del MVP por decisión del equipo.

La creación de rutas, pantallas, componentes, estilos, OCR, backend y autenticación real queda para fases posteriores.

## 12. Referencias de accesibilidad

- [WCAG 2.2: contraste mínimo](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum)
- [Apple: pruebas de funciones de accesibilidad del sistema](https://developer.apple.com/documentation/accessibility/testing-system-accessibility-features-in-your-app)
- [Apple: accesibilidad en interfaces](https://developer.apple.com/design/human-interface-guidelines/accessibility/)
