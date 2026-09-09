# VisioAid--- Samuel

Aplicación móvil accesible para iOS y Android que permite capturar texto del entorno, reconocerlo localmente y leerlo mediante la voz del dispositivo.

## Estado

El proyecto utiliza Expo SDK 57, Expo Router y TypeScript. Ya incluye los flujos accesibles de Login y Registro, autenticación mock, guía hablada y dictado nativo en los campos de nombre, edad, correo electrónico y contraseña. Al completar cualquier método de acceso se navega a una pantalla de bienvenida.

Los formularios se validan con Zod: el correo debe tener formato válido, la contraseña requiere únicamente 6 caracteres y Registro exige nombre y una edad mayor a 10 años. Cada campo presenta su propio mensaje de error accesible.

VisioAid es exclusivamente móvil. No se mantiene ni se publica una versión para navegador.

## Requisitos

- Node.js compatible con Expo SDK 57.
- macOS y Xcode para compilar iOS.
- Android Studio y el SDK de Android para compilar Android.
- Un development build: el reconocimiento de voz usa código nativo y no funciona dentro de Expo Go.

## Instalación

```bash
npm install
```

## Primera compilación

El config plugin agrega los permisos de micrófono y reconocimiento de voz durante la generación de los proyectos nativos.

### Previsualización rápida con Expo Go

Expo Go puede utilizarse para revisar la interfaz, navegación, formularios y accesibilidad general:

```bash
npx expo start --go
```

En este modo el botón **Dictar** permanece visible pero deshabilitado porque Expo Go no contiene el módulo nativo. Para probar el dictado debes usar el development build.

### iOS

```bash
npm run ios
```

Para seleccionar un iPhone físico conectado:

```bash
npm run ios -- --device
```

La instalación en un dispositivo físico puede requerir configurar el equipo de firma en Xcode.

### Android

Inicia un emulador o conecta un dispositivo con depuración USB y ejecuta:

```bash
npm run android
```

Para seleccionar un dispositivo específico:

```bash
npm run android -- --device
```

Después de instalar el development build, Metro puede iniciarse sin recompilar:

```bash
npm start
```

Debes volver a ejecutar `npm run ios` o `npm run android` cuando cambien dependencias nativas o plugins de `app.config.ts`.

## Dictado nativo

Los botones **Dictar** utilizan los servicios de reconocimiento de voz de iOS y Android. La primera activación solicita permiso para usar el micrófono y el reconocedor del sistema. El audio no se conserva en archivos ni se envía al backend de VisioAid.

Para probarlo:

1. Abre Login o Registro en el development build.
2. Pulsa **Dictar** junto a cualquiera de los campos. Dicta contraseñas únicamente en un lugar privado.
3. Acepta los permisos del sistema.
4. Habla después del anuncio «Escuchando».
5. Comprueba que el resultado se añade al campo y que VoiceOver o TalkBack anuncia el estado.

Algunos servicios de reconocimiento del sistema pueden necesitar conexión a Internet o que el idioma español esté instalado y habilitado.

## Guía hablada y lectores de pantalla

Al abrir Login, Registro o Bienvenida, VisioAid describe mediante voz la pantalla, sus campos y las acciones principales. El botón **Escuchar guía** permite repetir esa información. Si VoiceOver o TalkBack están activos, la guía utiliza sus anuncios nativos; en caso contrario utiliza `expo-speech`.

Los estados de validación, carga y dictado también se anuncian. Durante la escucha del micrófono se pausa la voz propia de la aplicación para evitar que el reconocedor la transcriba. El correo dictado elimina espacios y convierte expresiones como «arroba», «punto», «guion» y «guion bajo» a sus símbolos correspondientes.

## Verificación

```bash
npm run check
```

El comando valida formato, ESLint, TypeScript y Expo Doctor. Para corregir únicamente el formato:

```bash
npm run format
```

## Documentación

- [Contexto del proyecto](docs/PROJECT_CONTEXT.md)
- [Estructura React Native](docs/REACT_NATIVE_PROJECT_STRUCTURE.md)
