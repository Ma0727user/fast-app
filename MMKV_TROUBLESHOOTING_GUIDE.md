# Guía de Solución de Problemas: MMKV Native Module Not Found

Este documento proporciona pasos detallados para diagnosticar y resolver el error "Failed to create a new MMKV instance: The native MMKV Module could not be found" en proyectos React Native.

---

## 1. Verificar Instalación Correcta de react-native-mmkv

### Paso 1: Verificar package.json

Asegúrate de que `react-native-mmkv` esté correctamente agregado a tus dependencias:

```json
// package.json
{
  "dependencies": {
    "react-native-mmkv": "^2.12.2"
  }
}
```

### Paso 2: Verificar versión compatible con React Native

| Versión MMKV | React Native Compatible           |
| ------------ | --------------------------------- |
| 3.x (v3 API) | RN 0.76+ (New Architecture)       |
| 2.x (v2 API) | RN 0.71 - 0.75 (Old Architecture) |
| 1.x          | RN 0.70 y anteriores              |

**Para este proyecto (React Native 0.81.5):**

- ⚠️ New Architecture está habilitado por defecto
- Recomendamos usar MMKV v2.12.2 con arquitectura antigua deshabilitada

---

## 2. Verificar Autolinking

### iOS - Verificar xcconfig

```bash
# En directorio ios/
cat Pods/Target\ Support\ Files/Pods-YourApp/Pods-YourApp.xcconfig
```

Busca líneas como:

```
GCC_PREPROCESSOR_DEFINITIONS = $(inherited) ... MMKV=1
OTHER_LDFLAGS = $(inherited) ... -lMMKV
```

### Android - Verificar build.gradle

```gradle
// android/app/build.gradle
dependencies {
    implementation "com.tencent:mmkv:1.3.2"  // Versión automáticamente linkeada
}
```

---

## 3. Ejecutar Instalación de Pods (iOS)

```bash
cd ios
pod install
```

Si hay errores:

```bash
# Forzar actualización de pods
pod install --repo-update

# O reinstalar completamente
rm -rf Pods Podfile.lock
pod install
```

---

## 4. Limpiar y Reconstruir Android

```bash
cd android

# Limpiar caché de Gradle
./gradlew clean

# Reconstruir
cd ..
npx react-native run-android
```

O desde cero:

```bash
cd android
./gradlew clean
./gradlew assembleDebug
```

---

## 5. Verificar babel.config.js

### Para MMKV v3 API (nuevo):

```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      "react-native-worklets/plugin",
      // No se requiere plugin adicional para MMKV v3
    ],
  };
};
```

### Para MMKV v2 API (usado en este proyecto):

```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: ["react-native-worklets/plugin"],
  };
};
```

---

## 6. Limpiar Caché de Metro Bundler

```bash
npx react-native start --reset-cache

# O eliminar manualmente
rm -rf node_modules/.cache
rm -rf $TMPDIR/metro-*
```

---

## 7. Verificar Compatibilidad de iOS Deployment Target

### En Podfile:

```ruby
# ios/Podfile
platform :ios, '13.4'  # Mínimo para MMKV

post_install do |installer|
  installer.pods_project.targets.each do |target|
    target.build_configurations.each do |config|
      config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '13.4'
    end
  end
end
```

---

## 8. Soluciones Alternativas

### Opción A: Usar expo-mmkv (para proyectos Expo)

```bash
npm uninstall react-native-mmkv
npx expo install expo-mmkv
```

Actualizar import en store:

```typescript
// Antes (react-native-mmkv)
import { MMKV } from "react-native-mmkv";

// Después (expo-mmkv)
import { MMKV } from "expo-mmkv";
```

### Opción B: Deshabilitar New Architecture

```json
// app.json
{
  "expo": {
    "newArchEnabled": false
  }
}
```

```gradle
// android/gradle.properties
newArchEnabled=false
```

### Opción C: Linking Manual (iOS)

1. Abrir Xcode
2. Agregar MMKV.xcodeproj desde `node_modules/react-native-mmkv/ios/`
3. En Build Phases, agregar libMMKV.a a "Link Binary With Libraries"

### Opción D: Linking Manual (Android)

```gradle
// android/app/build.gradle
dependencies {
    implementation project(':react-native-mmkv')
}
```

```java
// android/settings.gradle
include ':react-native-mmkv'
project(':react-native-mmkv').projectDir = new File(rootProject.projectDir, '../node_modules/react-native-mmkv/android')
```

---

## 9. Verificar Conflictos con Otros Módulos Nativos

Revisa si hay módulos nativos conflictivos:

```bash
# Listar todos los módulos nativos instalados
ls node_modules | grep react-native
```

Módulos que pueden causar conflictos:

- @react-native-async-storage/async-storage (usar MMKV en su lugar)
- react-native-quick-sqlite
- react-native-nitro-modules

---

## 10. Verificar Errores de Versión

### Tabla de Compatibilidad

| react-native-mmkv | React Native | Node.js | Observações                |
| ----------------- | ------------ | ------- | -------------------------- |
| 3.3.x             | 0.76+        | 18+     | New Architecture requerida |
| 2.12.x            | 0.71-0.75    | 16+     | Old Architecture           |
| 1.3.x             | 0.70-        | 14+     | API legacy                 |

### Verificar versión instalada:

```bash
npm list react-native-mmkv
```

---

## 11. Verificar Compilación Nativa

### iOS - Ver logs de compilación:

```bash
xcodebuild -workspace ios/YourApp.xcworkspace -scheme YourApp -configuration Debug -destination 'platform=iOS Simulator,name=iPhone 15' build 2>&1 | grep -i mmkv
```

### Android - Verificar logs:

```bash
cd android && ./gradlew assembleDebug --info 2>&1 | grep -i mmkv
```

---

## 12. Código de Ejemplo: Verificación de MMKV

```typescript
// utils/mmkv-check.ts
import { MMKV } from "react-native-mmkv";

export const verifyMMKV = () => {
  try {
    const storage = new MMKV({
      id: "test-storage",
    });

    // Test de escritura/lectura
    storage.set("test_key", "test_value");
    const value = storage.getString("test_key");

    console.log("✅ MMKV funcionando correctamente");
    console.log("Valor leído:", value);

    return true;
  } catch (error) {
    console.error("❌ Error con MMKV:", error);
    return false;
  }
};
```

---

## 13. Solución Rápida para Este Proyecto

Si el error persiste, ejecutar:

```bash
# 1. Reinstalar dependencias
rm -rf node_modules
npm install

# 2. Limpiar cachés
rm -rf $TMPDIR/metro-*
rm -rf $TMPDIR/haste-*

# 3. Reconstruir
cd ios && pod install && cd ..
cd android && ./gradlew clean && cd ..

# 4. Ejecutar
npx react-native run-android
```

---

## 14. Referencias

- [Documentación oficial MMKV](https://github.com/mrousavy/react-native-mmkv)
- [Migration Guide v2 to v3](https://mmkv.io/migration)
- [React Native New Architecture](https://reactnative.dev/docs/new-architecture)

---

_Este documento fue creado como guía de troubleshooting para el proyecto FAST._
