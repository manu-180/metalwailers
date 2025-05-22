'use strict';
const MANIFEST = 'flutter-app-manifest';
const TEMP = 'flutter-temp-cache';
const CACHE_NAME = 'flutter-app-cache';

const RESOURCES = {"assets/AssetManifest.bin": "426e9ef2a16fa58204f19a2f8ff1044d",
"assets/AssetManifest.bin.json": "c869e9c3334f2857034c141f75ebe774",
"assets/AssetManifest.json": "10ea35a2c8fda457da334a9dc98a9cc0",
"assets/assets/images/imagen1.png": "9425761419e552db798bdae6bdddf9b7",
"assets/assets/images/imagen10.png": "6b7cfcc5f8647a814bbe2b0f771227d0",
"assets/assets/images/imagen11.png": "711697991ac6ac3095916e1563d6931f",
"assets/assets/images/imagen2.png": "c44023552d74b6ea2c49c35b6acadfa1",
"assets/assets/images/imagen3.png": "4033ab41992a37aaa1fbffb0b68b9190",
"assets/assets/images/imagen4.png": "2112f55e891b6a55d7b58903219d1525",
"assets/assets/images/imagen5.png": "8850cd79c20ac12950f2c1ea00d71207",
"assets/assets/images/imagen6.png": "dee4b6971c2fd8e8a534643fd6c7f921",
"assets/assets/images/imagen7.png": "6da9fc158509f104c92e1b6eb46a3a83",
"assets/assets/images/imagen8.png": "fe0295717082c204943dbfcd62d1776f",
"assets/assets/images/imagen9.png": "a16f184fe10319aef47cae45633343a2",
"assets/assets/logo/header_logo.png": "e904a5a6385e7073970a91f4ff2eb509",
"assets/assets/logo/Logo-Horizontal.png": "edf6849639c8f3778d787f133f583904",
"assets/assets/logo/logo.png": "27ddd9d7607cc11de4b2c988c376ac04",
"assets/assets/logo/logo.svg": "ff06225f6accf7d9f6db07673eec6066",
"assets/assets/logo/logoweb.png": "e8989c15581f53da4e2676e2089065eb",
"assets/assets/logo/logo_metalwailer.svg": "02a7d7b0ffe70fd4673646e7d66e593a",
"assets/assets/logo/loguito.svg": "535c8b45bb956ff5a91f869fd7981187",
"assets/FontManifest.json": "5a32d4310a6f5d9a6b651e75ba0d7372",
"assets/fonts/MaterialIcons-Regular.otf": "5e580711cd5e6c349ace26da795cf21b",
"assets/NOTICES": "fd33c288d05a8f22f220bc447885a954",
"assets/packages/cupertino_icons/assets/CupertinoIcons.ttf": "33b7d9392238c04c131b6ce224e13711",
"assets/packages/font_awesome_flutter/lib/fonts/fa-brands-400.ttf": "a53baa14911df76a48506ba22ea66b91",
"assets/packages/font_awesome_flutter/lib/fonts/fa-regular-400.ttf": "9b885f0c7657631d6fb94952b7d441a4",
"assets/packages/font_awesome_flutter/lib/fonts/fa-solid-900.ttf": "fdbcefbe80b45521eaa21a4e26bb9cc0",
"assets/shaders/ink_sparkle.frag": "ecc85a2e95f5e9f53123dcaf8cb9b6ce",
"canvaskit/canvaskit.js": "86e461cf471c1640fd2b461ece4589df",
"canvaskit/canvaskit.js.symbols": "68eb703b9a609baef8ee0e413b442f33",
"canvaskit/canvaskit.wasm": "efeeba7dcc952dae57870d4df3111fad",
"canvaskit/chromium/canvaskit.js": "34beda9f39eb7d992d46125ca868dc61",
"canvaskit/chromium/canvaskit.js.symbols": "5a23598a2a8efd18ec3b60de5d28af8f",
"canvaskit/chromium/canvaskit.wasm": "64a386c87532ae52ae041d18a32a3635",
"canvaskit/skwasm.js": "f2ad9363618c5f62e813740099a80e63",
"canvaskit/skwasm.js.symbols": "80806576fa1056b43dd6d0b445b4b6f7",
"canvaskit/skwasm.wasm": "f0dfd99007f989368db17c9abeed5a49",
"canvaskit/skwasm_st.js": "d1326ceef381ad382ab492ba5d96f04d",
"canvaskit/skwasm_st.js.symbols": "c7e7aac7cd8b612defd62b43e3050bdd",
"canvaskit/skwasm_st.wasm": "56c3973560dfcbf28ce47cebe40f3206",
"favicon.png": "7da4c63ce88d3c46e9a6dc50ec1930c8",
"flutter.js": "76f08d47ff9f5715220992f993002504",
"flutter_bootstrap.js": "0bf442df778b669ddd8b437acc8a35c5",
"icons/Icon-192.png": "3a9d65259a2aa72445ea818cc362381e",
"icons/Icon-512.png": "c1f7d2ffb1651cee0a2abc3f7e945c12",
"icons/Icon-maskable-192.png": "3a9d65259a2aa72445ea818cc362381e",
"icons/Icon-maskable-512.png": "c1f7d2ffb1651cee0a2abc3f7e945c12",
"index.html": "61a4f2a0d4ec9411cc68a1f2e1cf3e5a",
"/": "61a4f2a0d4ec9411cc68a1f2e1cf3e5a",
"main.dart.js": "1b2bb01cbc018193e6df7e09a0e2e4bd",
"manifest.json": "4afd3bb6b87864ece5f6c026a03bf646",
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
