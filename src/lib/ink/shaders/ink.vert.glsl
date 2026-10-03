// Triangulo que cubre toda la pantalla (3 vertices, sin quad ni indices).
attribute vec2 aPosition;

void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
