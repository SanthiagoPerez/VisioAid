# VisioAid - Contexto vivo del proyecto

> Fuente única de verdad para entender el producto y continuar su desarrollo. Este archivo debe actualizarse cada vez que cambie una decisión, el alcance, la arquitectura o el estado del proyecto.

## Resumen

VisioAid es una aplicación móvil accesible que permite fotografiar texto del entorno, reconocerlo y escucharlo mediante la voz del dispositivo.

Está dirigida principalmente a personas ciegas, con baja visión, dislexia, dificultades de lectura y adultos mayores. La experiencia debe ser sencilla, privada y utilizable sin ayuda de terceros.

Flujo principal:

`abrir cámara -> tomar fotografía -> reconocer texto -> mostrar texto -> leer en voz alta`

## Problema

La información escrita aparece en documentos, etiquetas, precios, carteles, instrucciones y señales. Para muchas personas, acceder a ella requiere ayuda de otra persona o herramientas demasiado complejas.

VisioAid busca resolver una necesidad concreta: convertir rápidamente texto físico en información audible usando un teléfono móvil.

## Principios del producto

Las decisiones del proyecto deben priorizar, en este orden:

1. Accesibilidad y autonomía.
2. Privacidad del contenido capturado.
3. Simplicidad del flujo principal.
4. Respuesta rápida y errores fáciles de corregir.
5. Mantenibilidad y capacidad de evolución.

Una función nueva no debe complicar innecesariamente la acción principal: **capturar texto y escucharlo**.

## Estado actual

- El proyecto Expo SDK 57 y su estructura inicial ya fueron creados en la raíz del repositorio.
- Solo existe el código mínimo de inicialización de Expo Router y una pantalla de bienvenida para validar los estilos. Las carpetas funcionales, hooks e infraestructura están vacías y se conservan mediante `.gitkeep`.
- NativeWind está configurado para usar utilidades de Tailwind CSS sobre componentes React Native; todavía no existen pantallas de negocio, stores, adaptadores ni lógica de negocio.
- Las dependencias previstas para cámara, voz, almacenamiento y autenticación están instaladas, pero todavía no se utilizan.
- La integración de Google ML Kit, el backend y la autenticación continúan abiertas.
- El MVP no incluye Jest ni una carpeta de pruebas unitarias; actualmente se valida con Prettier, TypeScript, ESLint, Expo Doctor y pruebas manuales. Las comprobaciones automatizadas se ejecutan mediante Husky antes de cada commit.
- El alcance detallado del primer lanzamiento se definirá y actualizará durante el desarrollo.

## Tecnologías decididas

### Aplicación móvil

- React Native.
- Expo.
- TypeScript.
- NativeWind 4 con Tailwind CSS 3 para los estilos mediante `className`.
- Android e iOS.
- `expo-camera` como opción prevista para permisos, vista previa y captura.
- Development build de Expo, porque la integración de Google ML Kit requiere código nativo que no estará disponible únicamente con Expo Go.

### Reconocimiento de texto

- Google ML Kit Text Recognition v2.
- Procesamiento en el dispositivo como comportamiento principal.
- Modelo inicial para escritura latina, con prioridad para textos en español.
- La integración específica con React Native está pendiente de evaluación. Puede utilizarse una librería compatible y mantenida o un módulo local creado con Expo Modules API.

### Lectura en voz alta

- Funciones TTS nativas de Android e iOS.
- `expo-speech` como primera opción de integración.
- Uso de las voces e idiomas instalados en el dispositivo.
- El texto largo deberá dividirse en fragmentos para controlar mejor la reproducción y aproximar la pausa y continuación entre plataformas.

### Backend y base de datos

- Se contempla un backend sencillo en Python.
- FastAPI es la opción inicial propuesta para exponer la API.
- PostgreSQL es la opción inicial propuesta para datos persistentes y relaciones entre usuarios.
- El MVP incluirá cuentas con correo y contraseña, Google y Apple.
- La base de datos conservará únicamente los datos mínimos de la cuenta y sus preferencias.
- La aplicación móvil debe conservar su función principal aunque el backend no esté disponible.
- La comunicación se realizará mediante una API versionada y contratos claramente definidos.
- El backend debe diseñarse para permitir futuras funciones de ML en Python sin obligar a que el OCR básico dependa de internet.

La incorporación del backend y la base de datos debe responder a funciones concretas. Sus primeros usos posibles son:

- Cuentas de usuario.
- Preferencias sincronizadas entre dispositivos.
- Configuración remota de funciones.
- Acceso futuro a modelos de ML que no puedan ejecutarse en el teléfono.
- Administración de consentimiento, sesiones y eliminación de cuenta.

No se debe construir complejidad de servidor para replicar funciones que ya trabajan correctamente en el dispositivo.

## Arquitectura general

```text
Aplicación React Native + Expo
├── Interfaz y accesibilidad
├── Cámara
├── Coordinación del flujo de lectura
├── OCR local con Google ML Kit
├── Voz nativa del dispositivo
├── Preferencias locales
└── Cliente de API opcional
          │
          ▼
Backend Python / FastAPI
├── Autenticación y usuarios
├── Preferencias sincronizadas
├── Servicios futuros de ML
└── Acceso controlado a datos
          │
          ▼
PostgreSQL
```

### Regla de separación

La interfaz no debe comunicarse directamente con las APIs nativas ni con la base de datos. Cámara, OCR, voz, almacenamiento y backend deben estar encapsulados detrás de módulos internos. Esto permitirá sustituir tecnologías sin reescribir toda la aplicación.

## Experiencia principal

1. El usuario abre VisioAid.
2. La aplicación solicita el permiso de cámara si todavía no lo tiene.
3. El usuario abre la cámara y toma una fotografía.
4. La aplicación confirma la captura e informa que está procesando el contenido.
5. Google ML Kit reconoce el texto localmente.
6. El texto se muestra en pantalla.
7. La aplicación lo lee mediante el motor TTS del sistema.
8. El usuario puede controlar la reproducción o realizar una nueva captura.

La aplicación debe comunicar mediante texto y voz los estados importantes, sin producir mensajes hablados que compitan con la lectura del contenido.

## Accesibilidad

La accesibilidad no es una mejora posterior: es parte central del producto.

- Todo el flujo debe funcionar con TalkBack y VoiceOver.
- Los controles deben tener nombres, funciones y estados comprensibles.
- El orden del foco debe ser predecible.
- Las acciones principales deben ser grandes y fáciles de localizar.
- Toda la interfaz utilizará por defecto blanco sobre negro puro, con una variante invertida de negro sobre blanco. Ambas combinaciones mantienen una relación de contraste de `21:1`.
- El alto contraste será una propiedad permanente, no una preferencia que pueda desactivarse. El usuario podrá elegir únicamente qué combinación contrastada le resulta más cómoda.
- La jerarquía visual se construirá con tamaño, peso, espaciado y bordes; no con texto gris, transparencias o sombras de bajo contraste.
- Los estados y acciones no dependerán exclusivamente del color o de un icono: incluirán texto, forma y metadatos accesibles.
- Los objetivos táctiles tendrán al menos `48 × 48 dp` y separación suficiente.
- La interfaz soportará texto ampliado hasta al menos el `200 %` sin ocultar contenido ni superponer controles.
- La vista previa de la cámara puede mostrar la imagen capturada en color; todos sus controles, guías y mensajes mantendrán la paleta negra y blanca.
- La información no puede depender únicamente del color, un icono, un gesto o un sonido.
- Los errores deben explicar qué ocurrió y cuál es la siguiente acción posible.
- La experiencia debe probarse en dispositivos físicos y, cuando sea posible, con usuarios reales.

## Privacidad y datos

El contenido fotografiado puede ser sensible. La existencia de usuarios y una base de datos no cambia estas reglas:

- El OCR principal se realiza en el dispositivo.
- Las fotografías no se guardan automáticamente en la galería.
- Las imágenes se mantienen solo en memoria o caché temporal durante el procesamiento.
- El texto reconocido es temporal y no se envía al backend de forma predeterminada.
- No se incluyen imágenes ni textos reconocidos en logs, analítica o reportes de errores.
- Solo se solicitan los permisos indispensables.
- El usuario debe dar consentimiento explícito antes de usar una futura función que envíe contenido a un servicio remoto.
- La cuenta y sus datos deben poder eliminarse.

### Datos que sí puede almacenar la base de datos

- Identificador y datos mínimos de la cuenta.
- Información necesaria para autenticación, almacenada de forma segura.
- Preferencias sincronizables de accesibilidad, interfaz y voz.
- Consentimientos y fechas relevantes.
- Metadatos técnicos mínimos que no revelen el contenido leído.

### Datos excluidos por defecto

- Fotografías capturadas.
- Texto obtenido mediante OCR.
- Historial de lecturas.
- Audio generado a partir del texto.
- Datos personales que no sean necesarios para una función visible del producto.

Si más adelante se propone guardar cualquiera de estos datos, deberá registrarse como una nueva decisión, justificar su utilidad, definir retención y seguridad, y obtener consentimiento claro del usuario.

## Organización conceptual del código

Cuando comience la implementación, se espera separar al menos estas áreas:

- `camera`: permisos, sesión de cámara y captura temporal.
- `ocr`: integración con ML Kit y normalización del resultado.
- `speech`: voces, velocidad, fragmentación y reproducción.
- `reader`: coordinación del flujo completo.
- `accessibility`: anuncios, foco y preferencias visuales.
- `settings`: preferencias locales y sincronizadas.
- `api`: comunicación con el backend.
- `auth`: sesión e identidad del usuario, si se incluyen cuentas.
- `core`: tipos, errores y contratos compartidos.

En el backend se espera separar API, lógica de negocio, persistencia y servicios de ML. La base de datos no debe ser consultada directamente desde la aplicación móvil.

## Límites actuales

Por ahora no se consideran parte confirmada del producto:

- Traducción automática.
- Reconocimiento de objetos o descripción de escenas.
- Procesamiento específico de códigos QR.
- OCR continuo sobre video.
- Historial de imágenes o lecturas.
- Exportación del texto.
- Funciones sociales o colaboración.
- Panel administrativo.

Estos elementos pueden evaluarse después sin asumir que formarán parte del primer lanzamiento.

## Decisiones abiertas

- Alcance exacto de la primera versión.
- Wrapper de React Native para Google ML Kit o módulo local.
- Versiones mínimas de Android e iOS.
- Comportamiento de reproducción automática después del OCR.
- Precisión esperada al pausar y continuar una lectura.
- Funcionamiento del audio en segundo plano.
- Despliegue y proveedor del backend y PostgreSQL.
- Funciones concretas que justificarán la primera versión del backend.
- Métricas de éxito, rendimiento y calidad del OCR.

Una decisión abierta solo debe pasar a “decidida” cuando exista una razón clara y se registre en este documento.

## Riesgos conocidos

- La calidad del OCR depende del enfoque, iluminación, tamaño y orientación del texto.
- El comportamiento del TTS cambia entre Android e iOS.
- Un wrapper de ML Kit sin mantenimiento puede bloquear futuras actualizaciones de Expo.
- Las cuentas y el backend pueden aumentar el tiempo de desarrollo sin mejorar inicialmente la función principal.
- Enviar imágenes a servicios remotos podría romper la promesa de privacidad si no se controla explícitamente.
- La accesibilidad asumida por el equipo puede fallar si no se valida con tecnologías de asistencia y usuarios reales.

## Criterio para el backend

Antes de implementar una función en el servidor, se deben responder estas preguntas:

1. ¿Qué necesidad concreta del usuario resuelve?
2. ¿Puede funcionar localmente de forma más privada y confiable?
3. ¿Qué datos necesita y durante cuánto tiempo?
4. ¿Qué ocurre si no hay conexión?
5. ¿La función principal continúa funcionando si el servidor falla?

Si estas preguntas no tienen respuestas claras, la función debe permanecer fuera del backend.

## Cómo mantener este documento

Este archivo funciona como metadocumento del repositorio. Debe actualizarse en el mismo cambio que modifique una decisión relevante.

Actualizarlo cuando ocurra cualquiera de estos eventos:

- Se agrega, elimina o redefine una función.
- Cambia una tecnología o integración.
- Se modifica la arquitectura.
- Se decide almacenar un nuevo tipo de dato.
- Cambia una regla de privacidad o accesibilidad.
- Se resuelve una decisión abierta.
- Aparece un riesgo relevante.

Reglas de mantenimiento:

- Describir el estado real, no el estado deseado.
- Mantenerlo breve y evitar copiar documentación técnica que pertenece a otro archivo.
- Eliminar información obsoleta en vez de acumular versiones contradictorias.
- Registrar decisiones importantes en el historial inferior.
- Enlazar documentos especializados cuando el repositorio crezca, por ejemplo arquitectura, API, base de datos, pruebas o diseño.

## Historial de decisiones

| Fecha      | Decisión                                                                      | Motivo                                                                                                |
| ---------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| 2026-08-21 | Crear VisioAid como aplicación móvil de asistencia visual                     | Facilitar acceso autónomo a información escrita                                                       |
| 2026-08-29 | Usar React Native y Expo                                                      | Compartir una base móvil para Android e iOS                                                           |
| 2026-08-29 | Usar Google ML Kit para OCR local                                             | Reconocer texto sin depender de un servicio remoto                                                    |
| 2026-08-29 | Usar el TTS nativo del sistema                                                | Aprovechar voces y capacidades de accesibilidad del dispositivo                                       |
| 2026-08-29 | Contemplar backend en Python y PostgreSQL                                     | Preparar cuentas, sincronización y futuras funciones de ML sin acoplar el flujo principal al servidor |
| 2026-08-29 | No almacenar imágenes ni texto OCR por defecto                                | Proteger la privacidad del usuario                                                                    |
| 2026-08-31 | Incluir cuentas con contraseña, Google y Apple en el MVP                      | Permitir identidad de usuario con distintos métodos de acceso                                         |
| 2026-08-31 | Limitar los datos persistentes a nombre, autenticación y preferencias         | Mantener el MVP simple y preservar la privacidad del contenido leído                                  |
| 2026-08-31 | Definir el modelo ER inicial con cinco entidades                              | Documentar usuarios, credenciales, identidades externas, preferencias y sesiones                      |
| 2026-09-01 | Adoptar negro y blanco como sistema visual permanente de alto contraste       | Priorizar la legibilidad de personas con baja visión en todas las pantallas y estados                 |
| 2026-09-01 | Aprobar la estructura inicial de React Native en la raíz del repositorio      | Iniciar la implementación sin una carpeta intermedia `mobile/`                                        |
| 2026-09-01 | Excluir pruebas unitarias y Jest de la estructura inicial                     | Mantener el alcance técnico del MVP limitado a verificaciones estáticas y pruebas manuales            |
| 2026-09-01 | Mantener únicamente el código de inicialización de Expo y las carpetas vacías | Separar claramente la preparación estructural de la implementación funcional                          |

## Documentos relacionados

- Documento académico inicial: _Construyendo la Base de un Proyecto de Software_, Samuel Fernando Rosero, Santiago Pérez Pino y Silvia Rosa Posso Mazo, 21 de agosto de 2026.
- `../README.md`: presentación, instalación y comandos principales del proyecto.
