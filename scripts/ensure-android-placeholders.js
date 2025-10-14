const fs = require('fs')
const path = require('path')

function ensureFile(filePath, content) {
  try {
    const dir = path.dirname(filePath)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, content, 'utf8')
      console.log('[postinstall] created', filePath)
    } else {
      console.log('[postinstall] exists', filePath)
    }
  } catch (e) {
    console.error('[postinstall] failed to ensure', filePath, e.message)
  }
}

function patchGestureHandler(ghPath) {
  try {
    if (!fs.existsSync(ghPath)) {
      console.log('[postinstall] gesture-handler build.gradle not found at', ghPath)
      return
    }

    let src = fs.readFileSync(ghPath, 'utf8')

    // If we've already applied the robust version, skip.
    if (src.includes('[RNGH] Unable to determine react-native version')) {
      console.log('[postinstall] gesture-handler already patched')
      return
    }

    // Replace the simple reactProperties loading with a robust block
    const needle = "def REACT_NATIVE_DIR = resolveReactNativeDirectory()\n\ndef reactProperties = new Properties()\nfile(\"$REACT_NATIVE_DIR/ReactAndroid/gradle.properties\").withInputStream { reactProperties.load(it) }\n\ndef REACT_NATIVE_VERSION = reactProperties.getProperty(\"VERSION_NAME\")\ndef REACT_NATIVE_MINOR_VERSION = REACT_NATIVE_VERSION.split(\\\"\\.\\\")[1].toInteger()"

    if (src.includes(needle)) {
      const original = src
      const replacement = `def REACT_NATIVE_DIR = resolveReactNativeDirectory()\n\n// Resolve react-native version robustly. Some environments may not have ReactAndroid/gradle.properties.\ndef REACT_NATIVE_VERSION = null\ndef REACT_NATIVE_MINOR_VERSION = 0\ntry {\n    def reactPropertiesFile = file("$REACT_NATIVE_DIR/ReactAndroid/gradle.properties")\n    if (reactPropertiesFile.exists()) {\n        def reactProperties = new Properties()\n        reactPropertiesFile.withInputStream { reactProperties.load(it) }\n        REACT_NATIVE_VERSION = reactProperties.getProperty(\"VERSION_NAME\")\n    } else {\n        try {\n            def resolved = providers.exec {\n                workingDir(rootDir)\n                commandLine("node", "--print", "require.resolve('react-native/package.json')")\n            }.standardOutput.asText.get().trim()\n            def reactNativePackageFile = file(resolved)\n            if (reactNativePackageFile.exists()) {\n                def reactNativeDir = reactNativePackageFile.parentFile\n                def pkgFile = new File(reactNativeDir, 'package.json')\n                if (pkgFile.exists()) {\n                    def json = new groovy.json.JsonSlurper().parseText(pkgFile.text)\n                    REACT_NATIVE_VERSION = json.version\n                }\n            }\n        } catch (e) {\n            println \"[RNGH] fallback to package.json failed: ${e.message}\"\n        }\n    }\n} catch (e) {\n    println \"[RNGH] Unable to determine react-native version: ${e.message}\"\n}\n\nif (REACT_NATIVE_VERSION == null) {\n    REACT_NATIVE_VERSION = '0.0.0'\n}\ntry {\n    REACT_NATIVE_MINOR_VERSION = REACT_NATIVE_VERSION.split(\\\"\\.\\\")[1].toInteger()\n} catch (e) {\n    REACT_NATIVE_MINOR_VERSION = 0\n}`

      src = src.replace(needle, replacement)

      // Ensure compileSdk fallback to 36
      src = src.replace("android {\n    compileSdkVersion safeExtGet(\"compileSdkVersion\", 33)", "android {\n    // prefer compileSdk from root ext; fallback to 36 (Expo/SDK recommended)\n    def sdk = safeExtGet(\"compileSdkVersion\", 36)\n    try {\n        compileSdkVersion sdk\n    } catch (e) {\n        compileSdk = sdk\n    }")

      fs.writeFileSync(ghPath, src, 'utf8')
      console.log('[postinstall] patched', ghPath)

      try {
        // try to capture package info to write a patch file
        const pkgDir = path.dirname(path.dirname(path.dirname(ghPath))) // node_modules/<pkg>/android/build.gradle -> node_modules/<pkg>
        const pkgJsonPath = path.join(pkgDir, 'package.json')
        let version = 'local'
        let pkgName = path.basename(pkgDir)
        if (fs.existsSync(pkgJsonPath)) {
          try {
            const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'))
            version = pkg.version || version
            pkgName = pkg.name || pkgName
          } catch (e) {}
        }
        writePatchFile(pkgName, version, ghPath, original, src)
      } catch (e) {
        console.error('[postinstall] failed to write patch file', e.message)
      }
    } else {
      console.log('[postinstall] expected needle not found; skipping gesture-handler patch')
    }
  } catch (e) {
    console.error('[postinstall] failed to patch gesture-handler', e.message)
  }
}

function writePatchFile(pkgName, pkgVersion, targetPath, originalContent, newContent) {
  try {
    if (!pkgName) pkgName = 'unknown'
    if (!pkgVersion) pkgVersion = 'local'
    const rel = path.relative(path.join(process.cwd(), 'node_modules'), targetPath).replace(/\\/g, '/')
    const patchPath = path.join(process.cwd(), 'patches', `${pkgName}+${pkgVersion}.patch`)
    if (fs.existsSync(patchPath)) {
      console.log('[postinstall] patch file already exists', patchPath)
      return
    }

    const origLines = originalContent.split(/\r?\n/)
    const newLines = newContent.split(/\r?\n/)
    const header = []
    header.push(`diff --git a/node_modules/${rel} b/node_modules/${rel}`)
    header.push(`--- a/node_modules/${rel}`)
    header.push(`+++ b/node_modules/${rel}`)
    header.push(`@@ -1,${origLines.length} +1,${newLines.length} @@`)

    const body = []
    for (let i = 0; i < Math.max(origLines.length, newLines.length); i++) {
      const o = origLines[i]
      const n = newLines[i]
      if (o !== undefined && n !== undefined && o === n) {
        body.push(' ' + o)
      } else {
        if (o !== undefined) body.push('-' + o)
        if (n !== undefined) body.push('+' + n)
      }
    }

    const content = header.concat(body).join('\n') + '\n'
    if (!fs.existsSync(path.join(process.cwd(), 'patches'))) fs.mkdirSync(path.join(process.cwd(), 'patches'))
    fs.writeFileSync(patchPath, content, 'utf8')
    console.log('[postinstall] wrote patch file', patchPath)
  } catch (e) {
    console.error('[postinstall] writePatchFile failed', e.message)
  }
}

function patchReanimated(raPath) {
  try {
    if (!fs.existsSync(raPath)) {
      console.log('[postinstall] reanimated build.gradle not found at', raPath)
      return
    }

    let src = fs.readFileSync(raPath, 'utf8')

    if (src.includes('[RNR] Unable to determine react-native version')) {
      console.log('[postinstall] reanimated already patched')
      return
    }

    // Since the file format varies a bit between reanimated versions, we look for the
    // common pattern of reading ReactAndroid/gradle.properties and replace it with a robust block.
    const needle = "def reactProperties = new Properties()\n    file(\"$REACT_NATIVE_DIR/ReactAndroid/gradle.properties\").withInputStream { reactProperties.load(it) }\n\n    def REACT_NATIVE_VERSION = reactProperties.getProperty(\"VERSION_NAME\")\n    def REACT_NATIVE_MINOR_VERSION = REACT_NATIVE_VERSION.split(\\\"\\.\\\")[1].toInteger()"

    if (src.includes(needle)) {
      const replacement = `def REACT_NATIVE_VERSION = null\n    def REACT_NATIVE_MINOR_VERSION = 0\n    try {\n        def reactPropertiesFile = file("$REACT_NATIVE_DIR/ReactAndroid/gradle.properties")\n        if (reactPropertiesFile.exists()) {\n            def reactProperties = new Properties()\n            reactPropertiesFile.withInputStream { reactProperties.load(it) }\n            REACT_NATIVE_VERSION = reactProperties.getProperty(\"VERSION_NAME\")\n        } else {\n            try {\n                def resolved = providers.exec {\n                    workingDir(rootDir)\n                    commandLine("node", "--print", "require.resolve('react-native/package.json')")\n                }.standardOutput.asText.get().trim()\n                def reactNativePackageFile = file(resolved)\n                if (reactNativePackageFile.exists()) {\n                    def reactNativeDir = reactNativePackageFile.parentFile\n                    def pkgFile = new File(reactNativeDir, 'package.json')\n                    if (pkgFile.exists()) {\n                        def json = new groovy.json.JsonSlurper().parseText(pkgFile.text)\n                        REACT_NATIVE_VERSION = json.version\n                    }\n                }\n            } catch (e) {\n                println "[RNR] fallback to package.json failed: ${e.message}"\n            }\n        }\n    } catch (e) {\n        println "[RNR] Unable to determine react-native version: ${e.message}"\n    }\n\n    if (REACT_NATIVE_VERSION == null) {\n        REACT_NATIVE_VERSION = '0.0.0'\n    }\n    try {\n        REACT_NATIVE_MINOR_VERSION = REACT_NATIVE_VERSION.split(\\\"\\.\\\")[1].toInteger()\n    } catch (e) {\n        REACT_NATIVE_MINOR_VERSION = 0\n    }`

      src = src.replace(needle, replacement)
      fs.writeFileSync(raPath, src, 'utf8')
      console.log('[postinstall] patched reanimated at', raPath)
    } else {
      console.log('[postinstall] expected needle not found in reanimated; skipping')
    }
  } catch (e) {
    console.error('[postinstall] failed to patch reanimated', e.message)
  }
}

// Content for placeholder gradle.properties
const gradleContent = `# generated by postinstall to satisfy react-native build scripts\norg.gradle.jvmargs=-Xmx2048m\n`

// candidate locations where builder may look
const candidates = [
  path.join(process.cwd(), 'node_modules', 'ReactAndroid', 'gradle.properties'),
  path.join(process.cwd(), 'apps', 'mobile', 'node_modules', 'ReactAndroid', 'gradle.properties'),
  path.join(process.cwd(), 'build', 'node_modules', 'ReactAndroid', 'gradle.properties')
]

candidates.forEach(p => ensureFile(p, gradleContent))

// patch gesture handler in node_modules if present
const ghBuildGradle = path.join(process.cwd(), 'node_modules', 'react-native-gesture-handler', 'android', 'build.gradle')
patchGestureHandler(ghBuildGradle)

// also try the app-local node_modules
const ghBuildGradleApp = path.join(process.cwd(), 'apps', 'mobile', 'node_modules', 'react-native-gesture-handler', 'android', 'build.gradle')
patchGestureHandler(ghBuildGradleApp)

// patch reanimated if present
const raBuildGradle = path.join(process.cwd(), 'node_modules', 'react-native-reanimated', 'android', 'build.gradle')
patchReanimated(raBuildGradle)

const raBuildGradleApp = path.join(process.cwd(), 'apps', 'mobile', 'node_modules', 'react-native-reanimated', 'android', 'build.gradle')
patchReanimated(raBuildGradleApp)

console.log('[postinstall] done')
