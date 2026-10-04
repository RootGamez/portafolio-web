// Tinta de las transiciones (docs/PLAN_ESCENARIOS.md §6 «Shader», §7 mapa de efectos).
//
// Cada efecto define DOS campos en 0..1 por pixel:
//   f = campo de LLEGADA: el pixel se cubre cuando uCover lo supera;
//   g = campo de SALIDA:  el pixel se descubre cuando uErase lo supera.
// Los dos se recortan a 0..1 y los umbrales recorren de 0 a 1 + SOFT_MAX, asi que con
// uCover = 1 y uErase = 0 NO queda un pixel sin tinta, sea cual sea el efecto: ahi
// cambia el escenario. Todo es funcion del progreso (sin tiempo): reversible con
// el scroll y sin parpadeo propio (WCAG 2.3.1).
//
// Encima: borde de pigmento seco (uRim) en el frente, trama de puntos manga por
// delante del frente y detras de la cola (paso uTonePitch), y grano de washi.

#extension GL_OES_standard_derivatives : enable

#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform vec2 uResolution;
uniform float uEffect;
uniform float uCover;
uniform float uErase;
uniform float uMirror;
uniform float uSeed;
uniform float uTonePitch;
uniform int uOctaves;
uniform vec3 uInk;
uniform vec3 uRim;

// Numeros de efecto: los de EFFECT_IDS (lib/ink/frame.ts; frame.test.ts los cruza).
#define EFFECT_WASH 5.0

const int MAX_OCTAVES = 5;
const int FLOOD_DROPS = 7;
const int SPLASH_DROPS = 6;
// Los anchos del borde se miden en PX con fwidth(): el mismo trazo en todos los
// efectos, sea cual sea la pendiente de su campo.
const float SOFT_MAX = 0.04;    // tope (en unidades de campo) del ancho del borde
const float EDGE_PX = 1.5;      // antialias del frente
const float WASH_EDGE_PX = 40.0; // la aguada es difusa
const float RIM_PX = 5.0;       // pigmento seco acumulado tras el frente
const float RIM_MIX = 0.85;
const float TONE_PX = 110.0;   // ancho de la trama delante del frente
const float GRAIN = 0.05;

// --- ruido -------------------------------------------------------------------

// Hash sin seno (Dave Hoskins): estable en GPUs moviles.
float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

// fBm normalizado a 0..1; las octavas dependen del tier (uOctaves).
float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  float norm = 0.0;
  for (int i = 0; i < MAX_OCTAVES; i++) {
    if (i >= uOctaves) break;
    value += amplitude * noise(p);
    norm += amplitude;
    p = p * 2.03 + 17.1;
    amplitude *= 0.5;
  }
  return value / norm;
}

// Distancia de `center` a la esquina mas lejana de la pantalla (en espacio p):
// normaliza un campo radial para que llegue a 1 justo en el ultimo pixel.
float farthestCorner(vec2 center, float aspect) {
  vec2 far = max(center, vec2(aspect, 1.0) - center);
  return length(far);
}

float smin(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}

// --- campos de cada efecto ----------------------------------------------------
// uv: 0..1 (y hacia arriba) · p: uv con la x escalada al aspecto (ruido isotropo)
// s: desplazamiento de la semilla. Devuelven vec2(f, g).

// 0 · pincelada con cerdas que cruza la pantalla; se va con una aguada.
vec2 brushSweep(vec2 uv, vec2 p, vec2 s) {
  float bristles = noise(vec2(uv.x * 3.0, uv.y * 70.0) + s);
  float f = 0.8 * uv.x + 0.13 * bristles + 0.07 * fbm(p * 3.0 + s);
  float g = 0.65 * uv.x + 0.35 * fbm(p * 1.5 + s + 5.0);
  return vec2(f, g);
}

// 1 · trazo vertical que se abre desde el centro; al borrar queda el centro el
// ultimo: el eje de la linea de tiempo que viene.
vec2 verticalStroke(vec2 uv, vec2 s) {
  float d = abs(uv.x - 0.5) * 2.0;
  float f = 0.86 * d + 0.14 * noise(vec2(uv.x * 60.0, uv.y * 2.5) + s);
  float g = 0.86 * (1.0 - d) + 0.14 * noise(vec2(uv.x * 60.0, uv.y * 2.5) + s + 9.0);
  return vec2(f, g);
}

// 2 · gotas que crecen y se funden hasta inundar; escurre hacia abajo.
vec2 inkFlood(vec2 uv, vec2 p, vec2 s, float aspect) {
  float field = 4.0;
  for (int i = 0; i < FLOOD_DROPS; i++) {
    float k = float(i) + 1.0;
    vec2 center = vec2(hash(s + k) * aspect, 0.05 + 0.9 * hash(s + k + 0.5));
    float radius = 0.12 + 0.13 * hash(s + k + 0.25);
    field = smin(field, length(p - center) / radius, 0.25);
  }
  // Lejos de toda gota el campo llega a ~2: se escala para repartir 0..1.
  float f = 0.82 * clamp(field * 0.5, 0.0, 1.0) + 0.18 * fbm(p * 4.0 + s);
  float g = 0.8 * (1.0 - uv.y) + 0.2 * fbm(p * 3.0 + s + 3.0);
  return vec2(f, g);
}

// 3 · pincel seco que arrastra el papel: vetas con huecos que llegan tarde.
vec2 dryBrush(vec2 uv, vec2 s) {
  float gapsIn = smoothstep(0.35, 0.75, noise(vec2(uv.x * 2.0, uv.y * 120.0) + s));
  float gapsOut = smoothstep(0.35, 0.75, noise(vec2(uv.x * 2.0, uv.y * 120.0) + s + 11.0));
  return vec2(0.72 * uv.x + 0.28 * gapsIn, 0.72 * uv.x + 0.28 * gapsOut);
}

// 4 · salpicadura: una mancha con puntas y gotas sueltas; se va en onda.
vec2 splash(vec2 p, vec2 s, float aspect) {
  vec2 center = vec2(aspect * (0.5 + 0.18 * (hash(s) - 0.5)), 0.42);
  vec2 v = p - center;
  float reach = farthestCorner(center, aspect);
  float r = length(v) / reach;
  float angle = atan(v.y, v.x);
  // Puntas finas: ruido angular de frecuencia alta, elevado para que solo los picos cuenten.
  float spikes = pow(noise(vec2(cos(angle), sin(angle)) * 9.0 + s), 4.0);
  // r normalizado a la esquina mas lejana: el area cubierta crece casi a ritmo constante.
  float f = r * (1.0 - 0.7 * spikes);
  for (int i = 0; i < SPLASH_DROPS; i++) {
    float k = float(i) + 1.0;
    float a = 6.2832 * hash(s + k * 1.7);
    float dist = (0.35 + 0.3 * hash(s + k * 2.3)) * reach;
    vec2 drop = center + vec2(cos(a), sin(a)) * dist;
    float size = 0.02 + 0.03 * hash(s + k * 3.1);
    if (length(p - drop) < size) f = min(f, 0.08 + 0.2 * dist / reach);
  }
  float g = 0.85 * r + 0.15 * fbm(p * 3.0 + s + 2.0);
  return vec2(f, g);
}

// 5 · aguada diluida: lobulos blandos que aparecen por todas partes.
vec2 wash(vec2 uv, vec2 p, vec2 s) {
  float lobesIn = smoothstep(0.2, 0.8, fbm(p * 1.4 + s));
  float lobesOut = smoothstep(0.2, 0.8, fbm(p * 1.4 + s + 4.0));
  return vec2(0.65 * lobesIn + 0.35 * uv.y, 0.65 * lobesOut + 0.35 * uv.y);
}

// 6 · papel rasgado en diagonal: borde nitido y fibroso.
vec2 tear(vec2 uv, vec2 s) {
  vec2 dir = normalize(vec2(1.0, 0.55));
  float d = dot(uv, dir) / dot(vec2(1.0), dir);
  float along = dot(uv, vec2(-dir.y, dir.x));
  float jagIn = (noise(vec2(along * 30.0, 0.0) + s) - 0.5) * 0.06 + (noise(vec2(along * 160.0, 3.0) + s) - 0.5) * 0.02;
  float jagOut = (noise(vec2(along * 30.0, 7.0) + s) - 0.5) * 0.06 + (noise(vec2(along * 160.0, 9.0) + s) - 0.5) * 0.02;
  return vec2(d + jagIn, d + jagOut);
}

// 7 · el sol (enso) sube desde abajo y lo llena; luego se despega de abajo arriba.
vec2 sun(vec2 uv, vec2 p, vec2 s, float aspect) {
  vec2 center = vec2(aspect * 0.5, -0.25);
  vec2 v = p - center;
  float r = length(v) / farthestCorner(center, aspect);
  float wobble = (noise(vec2(cos(atan(v.y, v.x)), sin(atan(v.y, v.x))) * 4.0 + s) - 0.5) * 0.03;
  return vec2(r + wobble, 0.85 * uv.y + 0.15 * fbm(p * 2.0 + s));
}

// 8 · sello hanko: el cuadrado se ESTAMPA primero (el primer tercio del campo) y
// la tinta sale de el en ondas hasta las esquinas; se va con otra onda.
const float STAMP_HALF = 0.36;  // medio lado del sello, en altos de pantalla
const float STAMP_SHARE = 0.32; // parte del campo que ocupa el estampado

vec2 seal(vec2 p, vec2 s, float aspect) {
  vec2 center = vec2(aspect * 0.5, 0.5);
  float c = cos(0.06);
  float sn = sin(0.06);
  vec2 q = mat2(c, -sn, sn, c) * (p - center);
  float box = max(max(abs(q.x), abs(q.y)) / STAMP_HALF, 1e-4);
  float reach = farthestCorner(center, aspect);
  float r = length(q) / reach;
  // Donde corta el borde del sello el rayo que pasa por este pixel: la onda sale
  // de AHI, asi el campo es continuo (un salto pintaria un falso borde con fwidth).
  float rEdge = r / box;
  float spread = clamp((r - rEdge) / max(1.0 - rEdge, 1e-3), 0.0, 1.0);
  float base = box < 1.0 ? STAMP_SHARE * box : STAMP_SHARE + (1.0 - STAMP_SHARE) * spread;
  float f = base + 0.03 * (fbm(p * 6.0 + s) - 0.5) + 0.012 * sin(r * 60.0);
  return vec2(f, r + 0.035 * sin(r * 48.0));
}

vec2 fields(vec2 uv, vec2 p, vec2 s, float aspect) {
  if (uEffect < 0.5) return brushSweep(uv, p, s);
  if (uEffect < 1.5) return verticalStroke(uv, s);
  if (uEffect < 2.5) return inkFlood(uv, p, s, aspect);
  if (uEffect < 3.5) return dryBrush(uv, s);
  if (uEffect < 4.5) return splash(p, s, aspect);
  if (uEffect < 5.5) return wash(uv, p, s);
  if (uEffect < 6.5) return tear(uv, s);
  if (uEffect < 7.5) return sun(uv, p, s, aspect);
  return seal(p, s, aspect);
}

// --- trama de puntos manga (rejilla a 45 grados) -------------------------------

float toneDots(float amount) {
  if (amount <= 0.0) return 0.0;
  vec2 cell = mat2(0.7071, -0.7071, 0.7071, 0.7071) * gl_FragCoord.xy / uTonePitch;
  float dist = length(fract(cell) - 0.5);
  float radius = 0.48 * sqrt(amount);
  float aa = 1.0 / uTonePitch;
  return 1.0 - smoothstep(radius - aa, radius + aa, dist);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  if (uMirror > 0.5) uv.x = 1.0 - uv.x;
  float aspect = uResolution.x / uResolution.y;
  vec2 p = vec2(uv.x * aspect, uv.y);
  vec2 s = vec2(uSeed * 13.7, uSeed * 7.3);

  vec2 fg = clamp(fields(uv, p, s, aspect), 0.0, 1.0);
  // Cuanto campo cabe en un pixel: convierte anchos en px a unidades de campo.
  vec2 perPx = max(fwidth(fg), vec2(1e-5));
  float edgePx = abs(uEffect - EFFECT_WASH) < 0.5 ? WASH_EDGE_PX : EDGE_PX;
  vec2 soft = min(perPx * edgePx, vec2(SOFT_MAX));
  vec2 rimWidth = min(perPx * RIM_PX, vec2(SOFT_MAX * 2.0));
  vec2 toneZone = clamp(perPx * TONE_PX, vec2(0.01), vec2(0.15));

  // Umbrales de 0 a 1 + SOFT_MAX: en los extremos, nada o todo (ver cabecera).
  // Como soft <= SOFT_MAX, con uCover = 1 el borde queda entero por encima de f = 1.
  float c = uCover * (1.0 + SOFT_MAX);
  float e = uErase * (1.0 + SOFT_MAX);
  float covered = 1.0 - smoothstep(c - soft.x, c, fg.x);
  float kept = smoothstep(e - soft.y, e, fg.y);
  float alpha = covered * kept;

  // Pigmento seco: se acumula justo detras de cada frente en movimiento. Se apaga
  // cuando ese frente ya no se mueve (todo cubierto, o aun sin borrar).
  // Es una LINEA pegada al borde (sube rapido y cae), no un degradado.
  float coverFront = (1.0 - smoothstep(rimWidth.x * 0.4, rimWidth.x, c - fg.x)) * (1.0 - smoothstep(0.85, 1.0, uCover));
  float eraseFront = (1.0 - smoothstep(rimWidth.y * 0.4, rimWidth.y, fg.y - e)) * smoothstep(0.0, 0.08, uErase);
  float rim = max(coverFront, eraseFront);
  vec3 ink = mix(uInk, uRim, rim * RIM_MIX);

  // Grano de washi: fijo en la pantalla (no se anima: nada que parpadee).
  float grain = (hash(floor(gl_FragCoord.xy)) - 0.5) + (noise(p * 40.0) - 0.5);
  ink *= 1.0 + grain * GRAIN;

  // Trama por delante del frente que cubre y por detras de la cola que borra. Empieza
  // donde empieza el antialias del borde (c - soft): si no, esa franja de tinta
  // semitransparente dejaria ver el papel y el borde tendria un halo claro.
  float ahead = fg.x - (c - soft.x);
  float toneIn = ahead > 0.0 ? (1.0 - ahead / toneZone.x) * smoothstep(0.0, 0.05, uCover) : 0.0;
  float behind = e - fg.y;
  float toneOut = behind > 0.0 ? (1.0 - behind / toneZone.y) * (1.0 - smoothstep(0.95, 1.0, uErase)) : 0.0;
  float dots = toneDots(clamp(max(toneIn, toneOut), 0.0, 1.0)) * (1.0 - alpha);

  // Salida premultiplicada (el contexto usa premultipliedAlpha).
  gl_FragColor = vec4(ink * alpha + uInk * dots, alpha + dots);
}
