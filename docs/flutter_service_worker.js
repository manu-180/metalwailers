'use strict';
const MANIFEST = 'flutter-app-manifest';
const TEMP = 'flutter-temp-cache';
const CACHE_NAME = 'flutter-app-cache';

const RESOURCES = {"assets/AssetManifest.bin": "f3cb38eddd663a29b926e35f687f04a3",
"assets/AssetManifest.bin.json": "fb8cf1f2ebb20f2fffe0cde7d97cbb15",
"assets/AssetManifest.json": "122a7a1d8ab9e2a8d427ee2084839a52",
"assets/assets/images/balancinadonew.png": "71cde42cae6fa6cea8fe982e5b8e39cb",
"assets/assets/images/balancinadonew2.png": "6666c4d1aff026c733406d90f564aa9d",
"assets/assets/images/cilindrado.png": "8cd63f291fc3ea0136fb050b8a3b2694",
"assets/assets/images/cilindrado2.png": "f2dcf1bfd884bf05053142eda225dcca",
"assets/assets/images/curvado.png": "4063b1f65d526b3b215b6c8cf27acf0d",
"assets/assets/images/curvado2.png": "8c118ac7636d5b1a4d9914648e825aac",
"assets/assets/images/curvadonew.png": "b71053b10a99b6b9b8eef76b0ef98282",
"assets/assets/images/dobladoranew.png": "f95cd3f6171f868eca8c9b3752286282",
"assets/assets/images/dobladoranew2.png": "4f883bb81a1d24da8231e984ec128130",
"assets/assets/images/guillotinado.png": "e7696df0b91a8ab6365830dd44ef89be",
"assets/assets/images/guillotinado2.png": "480b1fc532a8c4a5a46515ea7a2aa12d",
"assets/assets/images/guillotinadonew.png": "535d190254505202cf33846d874dbf2e",
"assets/assets/images/guillotinadonew2.png": "eee891555fab53141325096e56910492",
"assets/assets/images/homesoldadura.png": "ef96bcf14de4b977e2137e4cf6900148",
"assets/assets/images/homesoldadura2.png": "7f32b52719a8a531c7a06a51822d9535",
"assets/assets/images/inicio1.png": "fddad2865be111560fda80384d2235b4",
"assets/assets/images/inicio2.png": "f18c061ef31f3df8f75a72f96d252d5d",
"assets/assets/images/inicio3.png": "aad78809cddb75abf3ce1de2762a4e97",
"assets/assets/images/inicio4.png": "6836fb0b4ea0485a2b79e61f13270ba2",
"assets/assets/images/laser.png": "0d1bb1320fe016904916d60d3db0cc85",
"assets/assets/images/laser2.png": "191b1524f9713e7d0a0d1c85eea268db",
"assets/assets/images/pintura.png": "dbc2f2eee2a74831e980bcf0e39ac4b7",
"assets/assets/images/pintura2.png": "3d8e062c6a47473bc84a95500d575730",
"assets/assets/images/plasma.png": "2180ed2a9e9619107bd0070e7ac07f2b",
"assets/assets/images/plasma2.png": "3cec2951403095b459e76bec36982e08",
"assets/assets/images/plegado.png": "fa92b70bc8454dc3b2952420ce5b908d",
"assets/assets/images/plegado2.png": "5e279bc8e7013b01cd05a3d91089df0b",
"assets/assets/images/plegadonew.jpeg": "69bf9f0ad20be2fb31bc9dd066c5f221",
"assets/assets/images/plegadonew2.jpeg": "0b4ededda4d1d1a5eb8c954fbc9d99cc",
"assets/assets/images/punzonado.png": "a46da1de81755eadb5d7f27f8863e5ec",
"assets/assets/images/punzonado2.png": "c21f2c4441104ef9524787ac7fad75d3",
"assets/assets/images/rolado.png": "3018d74cd3e474f7841782ccda1fe375",
"assets/assets/images/rolado2.png": "a20695528f6cb6322af780103172cdfd",
"assets/assets/images/roladonew.png": "0058be2b4f6844f446ba5d360caecbfa",
"assets/assets/images/roladonew2.png": "428fc1f1fc3a1acd64c63ea875f01948",
"assets/assets/images/soldadura.png": "5f082c65c772f84a3787bf614d0606a5",
"assets/assets/images/soldadura2.png": "b37d8b045c0609efa300e591737a4bc3",
"assets/assets/images/soldadura3.png": "fc3a4174fee93df6e3ab61208e9639af",
"assets/assets/logo/header_logo.png": "e904a5a6385e7073970a91f4ff2eb509",
"assets/assets/logo/Logo-Horizontal.png": "edf6849639c8f3778d787f133f583904",
"assets/assets/logo/logo.png": "27ddd9d7607cc11de4b2c988c376ac04",
"assets/assets/logo/logo.svg": "ff06225f6accf7d9f6db07673eec6066",
"assets/assets/logo/logoweb.png": "e8989c15581f53da4e2676e2089065eb",
"assets/assets/logo/logowebbbbb.png": "3687b074a545ecec7f58eae300200d7e",
"assets/assets/logo/logo_metalwailer.svg": "02a7d7b0ffe70fd4673646e7d66e593a",
"assets/assets/logo/loguito.svg": "535c8b45bb956ff5a91f869fd7981187",
"assets/FontManifest.json": "5a32d4310a6f5d9a6b651e75ba0d7372",
"assets/fonts/MaterialIcons-Regular.otf": "cb2607c9f8eb686c01f6b01f12d67ffc",
"assets/NOTICES": "624c3cccd105583e0288199f0e08191b",
"assets/packages/cupertino_icons/assets/CupertinoIcons.ttf": "33b7d9392238c04c131b6ce224e13711",
"assets/packages/font_awesome_flutter/lib/fonts/fa-brands-400.ttf": "a53baa14911df76a48506ba22ea66b91",
"assets/packages/font_awesome_flutter/lib/fonts/fa-regular-400.ttf": "bf21cd8fd775a3c59fd53afdee39e0e6",
"assets/packages/font_awesome_flutter/lib/fonts/fa-solid-900.ttf": "95aa81aff62e03dbedd688740741f730",
"assets/shaders/ink_sparkle.frag": "ecc85a2e95f5e9f53123dcaf8cb9b6ce",
"canvaskit/canvaskit.js": "728b2d477d9b8c14593d4f9b82b484f3",
"canvaskit/canvaskit.js.symbols": "bdcd3835edf8586b6d6edfce8749fb77",
"canvaskit/canvaskit.wasm": "7a3f4ae7d65fc1de6a6e7ddd3224bc93",
"canvaskit/chromium/canvaskit.js": "8191e843020c832c9cf8852a4b909d4c",
"canvaskit/chromium/canvaskit.js.symbols": "b61b5f4673c9698029fa0a746a9ad581",
"canvaskit/chromium/canvaskit.wasm": "f504de372e31c8031018a9ec0a9ef5f0",
"canvaskit/skwasm.js": "ea559890a088fe28b4ddf70e17e60052",
"canvaskit/skwasm.js.symbols": "e72c79950c8a8483d826a7f0560573a1",
"canvaskit/skwasm.wasm": "39dd80367a4e71582d234948adc521c0",
"favicon.png": "7da4c63ce88d3c46e9a6dc50ec1930c8",
"flutter.js": "83d881c1dbb6d6bcd6b42e274605b69c",
"flutter_bootstrap.js": "45628aa92d3ada6f1c46e2ef0da5696c",
"icons/Icon-192.png": "3a9d65259a2aa72445ea818cc362381e",
"icons/Icon-512.png": "c1f7d2ffb1651cee0a2abc3f7e945c12",
"icons/Icon-maskable-192.png": "3a9d65259a2aa72445ea818cc362381e",
"icons/Icon-maskable-512.png": "c1f7d2ffb1651cee0a2abc3f7e945c12",
"index.html": "55fbf4ae2c91e420715094e47b0ce381",
"/": "55fbf4ae2c91e420715094e47b0ce381",
"main.dart.js": "d13ec52c5ec1e46b1fea7786d51accf2",
"manifest.json": "4afd3bb6b87864ece5f6c026a03bf646",
"robots.txt": "557177d139278d082c403e2176b9f919",
"sitemap.xml": "d06a2a9463bf8bffff4767567e6cfe1d",
"version.json": "882b3d41e910386c30e12f4b095956e6"};
// The application shell files that are downloaded before a service worker can
// start.
const CORE = ["main.dart.js",
"index.html",
"flutter_bootstrap.js",
"assets/AssetManifest.bin.json",
"assets/FontManifest.json"];

// During install, the TEMP cache is populated with the application shell files.
self.addEventListener("install", (event) => {
  self.skipWaiting();
  return event.waitUntil(
    caches.open(TEMP).then((cache) => {
      return cache.addAll(
        CORE.map((value) => new Request(value, {'cache': 'reload'})));
    })
  );
});
// During activate, the cache is populated with the temp files downloaded in
// install. If this service worker is upgrading from one with a saved
// MANIFEST, then use this to retain unchanged resource files.
self.addEventListener("activate", function(event) {
  return event.waitUntil(async function() {
    try {
      var contentCache = await caches.open(CACHE_NAME);
      var tempCache = await caches.open(TEMP);
      var manifestCache = await caches.open(MANIFEST);
      var manifest = await manifestCache.match('manifest');
      // When there is no prior manifest, clear the entire cache.
      if (!manifest) {
        await caches.delete(CACHE_NAME);
        contentCache = await caches.open(CACHE_NAME);
        for (var request of await tempCache.keys()) {
          var response = await tempCache.match(request);
          await contentCache.put(request, response);
        }
        await caches.delete(TEMP);
        // Save the manifest to make future upgrades efficient.
        await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
        // Claim client to enable caching on first launch
        self.clients.claim();
        return;
      }
      var oldManifest = await manifest.json();
      var origin = self.location.origin;
      for (var request of await contentCache.keys()) {
        var key = request.url.substring(origin.length + 1);
        if (key == "") {
          key = "/";
        }
        // If a resource from the old manifest is not in the new cache, or if
        // the MD5 sum has changed, delete it. Otherwise the resource is left
        // in the cache and can be reused by the new service worker.
        if (!RESOURCES[key] || RESOURCES[key] != oldManifest[key]) {
          await contentCache.delete(request);
        }
      }
      // Populate the cache with the app shell TEMP files, potentially overwriting
      // cache files preserved above.
      for (var request of await tempCache.keys()) {
        var response = await tempCache.match(request);
        await contentCache.put(request, response);
      }
      await caches.delete(TEMP);
      // Save the manifest to make future upgrades efficient.
      await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
      // Claim client to enable caching on first launch
      self.clients.claim();
      return;
    } catch (err) {
      // On an unhandled exception the state of the cache cannot be guaranteed.
      console.error('Failed to upgrade service worker: ' + err);
      await caches.delete(CACHE_NAME);
      await caches.delete(TEMP);
      await caches.delete(MANIFEST);
    }
  }());
});
// The fetch handler redirects requests for RESOURCE files to the service
// worker cache.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== 'GET') {
    return;
  }
  var origin = self.location.origin;
  var key = event.request.url.substring(origin.length + 1);
  // Redirect URLs to the index.html
  if (key.indexOf('?v=') != -1) {
    key = key.split('?v=')[0];
  }
  if (event.request.url == origin || event.request.url.startsWith(origin + '/#') || key == '') {
    key = '/';
  }
  // If the URL is not the RESOURCE list then return to signal that the
  // browser should take over.
  if (!RESOURCES[key]) {
    return;
  }
  // If the URL is the index.html, perform an online-first request.
  if (key == '/') {
    return onlineFirst(event);
  }
  event.respondWith(caches.open(CACHE_NAME)
    .then((cache) =>  {
      return cache.match(event.request).then((response) => {
        // Either respond with the cached resource, or perform a fetch and
        // lazily populate the cache only if the resource was successfully fetched.
        return response || fetch(event.request).then((response) => {
          if (response && Boolean(response.ok)) {
            cache.put(event.request, response.clone());
          }
          return response;
        });
      })
    })
  );
});
self.addEventListener('message', (event) => {
  // SkipWaiting can be used to immediately activate a waiting service worker.
  // This will also require a page refresh triggered by the main worker.
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
    return;
  }
  if (event.data === 'downloadOffline') {
    downloadOffline();
    return;
  }
});
// Download offline will check the RESOURCES for all files not in the cache
// and populate them.
async function downloadOffline() {
  var resources = [];
  var contentCache = await caches.open(CACHE_NAME);
  var currentContent = {};
  for (var request of await contentCache.keys()) {
    var key = request.url.substring(origin.length + 1);
    if (key == "") {
      key = "/";
    }
    currentContent[key] = true;
  }
  for (var resourceKey of Object.keys(RESOURCES)) {
    if (!currentContent[resourceKey]) {
      resources.push(resourceKey);
    }
  }
  return contentCache.addAll(resources);
}
// Attempt to download the resource online before falling back to
// the offline cache.
function onlineFirst(event) {
  return event.respondWith(
    fetch(event.request).then((response) => {
      return caches.open(CACHE_NAME).then((cache) => {
        cache.put(event.request, response.clone());
        return response;
      });
    }).catch((error) => {
      return caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((response) => {
          if (response != null) {
            return response;
          }
          throw error;
        });
      });
    })
  );
}
