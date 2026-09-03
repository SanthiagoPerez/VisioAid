# VisioAid

Aplicación móvil accesible para capturar texto del entorno, reconocerlo localmente y leerlo mediante la voz del dispositivo.

## Estado

La inicialización de React Native está creada con Expo SDK 57, Expo Router, TypeScript y NativeWind. La arquitectura está representada mediante carpetas vacías; solo existe una pantalla de bienvenida para validar los estilos y todavía no hay lógica de negocio.

## Requisitos

- Node.js compatible con Expo SDK 57.
- Un teléfono Android o iPhone con Expo Go para probar la interfaz actual.
- Android Studio únicamente si se usará un emulador o un development build de Android.
- macOS con Xcode únicamente si se usará el simulador o un development build de iOS.

## Instalación

```bash
npm install
```

## Verificación

```bash
npm run check
```

Este comando comprueba el formato con Prettier, ejecuta ESLint, valida TypeScript y finalmente ejecuta Expo Doctor. Para corregir automáticamente únicamente el formato, utiliza `npm run format`.

### Pre-commit

Husky instala automáticamente el hook de Git después de ejecutar `npm install`. Antes de cada commit se ejecutan estas comprobaciones, en orden:

1. Prettier.
2. ESLint.
3. TypeScript.
4. Expo Doctor.

Si alguna comprobación falla, el commit se cancela y muestra el error que se debe corregir. Puedes ejecutar todo el mismo flujo manualmente con `npm run check`.

## Ejecución en un dispositivo físico con Expo Go

1. Instala Expo Go desde Google Play o App Store.
2. Conecta el computador y el teléfono a la misma red Wi-Fi.
3. Inicia el servidor de desarrollo limpiando la caché:

```bash
npm run start:go -- --clear
```

En Android, abre Expo Go y selecciona **Scan QR code**. En iPhone, escanea el código QR con la cámara o desde Expo Go.

Si el teléfono no logra conectarse por la red local, inicia Expo usando un túnel:

```bash
npm run start:go -- --clear --tunnel
```

## Ejecución en Android

### Emulador con Android Studio

1. Instala Android Studio y crea un dispositivo virtual desde **Device Manager**.
2. Inicia el emulador.
3. Compila e instala el development build:

```bash
npm run android
```

Después de la primera compilación, puedes iniciar nuevamente Metro con:

```bash
npm start
```

También es posible ejecutar el development build en un teléfono Android conectado por USB con la depuración USB habilitada.

## Ejecución en iPhone

### Dispositivo físico con Expo Go

No necesitas Xcode. Ejecuta `npm run start:go -- --clear` y escanea el código QR con el iPhone.

### Simulador o development build con Xcode

Esta opción requiere macOS y Xcode. Ejecuta:

```bash
npm run ios
```

Después de la primera compilación, puedes iniciar nuevamente Metro con `npm start` y abrir el development build instalado.

> La interfaz actual funciona con Expo Go. Cuando se incorpore Google ML Kit será necesario utilizar un development build, ya que esa integración incluirá código nativo que Expo Go no contiene.

## Documentación

- [Contexto del proyecto](docs/PROJECT_CONTEXT.md)
- [Estructura React Native](docs/REACT_NATIVE_PROJECT_STRUCTURE.md)
