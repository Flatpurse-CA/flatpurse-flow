import { useEffect, useRef } from 'react'

interface SilkProps {
  speed?: number
  scale?: number
  color?: string
  noiseIntensity?: number
  rotation?: number
  style?: React.CSSProperties
}

const VERT = `
attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`

// Smooth flowing silk shader — large fabric-like folds with soft highlights
const FRAG = `
precision highp float;

uniform float u_time;
uniform vec2  u_res;
uniform vec3  u_color;
uniform float u_speed;
uniform float u_scale;
uniform float u_noise;
uniform float u_rotation;

float hash21(vec2 p) {
  p = fract(p * vec2(127.1, 311.7));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float smoothNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * smoothNoise(p);
    p  = p * 2.1 + vec2(1.7, 9.2);
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  uv -= 0.5;
  uv.x *= u_res.x / u_res.y;

  float t = u_time * u_speed * 0.15;

  float c = cos(u_rotation);
  float s = sin(u_rotation);
  uv = vec2(c * uv.x - s * uv.y, s * uv.x + c * uv.y);

  // gentle domain warp — keeps the silk smooth
  vec2 warp = vec2(
    fbm(uv * u_scale * 0.8 + vec2(t * 0.4, 0.0)),
    fbm(uv * u_scale * 0.8 + vec2(0.0, t * 0.4) + vec2(3.7, 1.4))
  );

  vec2 warped = uv + warp * u_noise * 0.18;

  // Primary silk folds — low frequency sine along dominant axis
  float fold1 = sin((warped.x * 2.2 + warped.y * 0.8) * u_scale * 2.5 + t) * 0.5 + 0.5;
  float fold2 = sin((warped.x * 0.6 - warped.y * 1.8) * u_scale * 1.8 + t * 0.7 + 1.2) * 0.5 + 0.5;
  float fold3 = sin((warped.x * 1.4 + warped.y * 1.2) * u_scale * 1.4 + t * 1.1 + 2.4) * 0.5 + 0.5;

  // blend folds — weighted toward the dominant one
  float silk = fold1 * 0.55 + fold2 * 0.28 + fold3 * 0.17;
  silk = smoothstep(0.05, 0.95, silk);

  // specular highlight — bright thin band at the peak of each fold
  float highlight = smoothstep(0.72, 0.82, silk) * smoothstep(1.0, 0.82, silk);

  // colour mapping: deep shadow → base colour → soft highlight
  vec3 shadow = u_color * 0.18;
  vec3 mid    = u_color;
  vec3 bright = mix(u_color, vec3(0.85, 0.75, 1.0), 0.35);

  vec3 col = mix(shadow, mid,    smoothstep(0.0, 0.55, silk));
  col      = mix(col,    bright, smoothstep(0.5, 0.85, silk) * 0.55);
  col     += highlight * 0.22;

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`

function hexToRgb(hex: string): [number, number, number] {
  const c = hex.replace('#', '')
  return [
    parseInt(c.slice(0, 2), 16) / 255,
    parseInt(c.slice(2, 4), 16) / 255,
    parseInt(c.slice(4, 6), 16) / 255,
  ]
}

export default function Silk({
  speed = 5,
  scale = 1,
  color = '#340f53',
  noiseIntensity = 1.9,
  rotation = 0,
  style,
}: SilkProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current!
    const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null
    if (!gl) return

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!
      gl.shaderSource(s, src)
      gl.compileShader(s)
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
        console.error('Silk shader:', gl.getShaderInfoLog(s))
      return s
    }

    const prog = gl.createProgram()!
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT))
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG))
    gl.linkProgram(prog)
    gl.useProgram(prog)

    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW)
    const aPos = gl.getAttribLocation(prog, 'a_pos')
    gl.enableVertexAttribArray(aPos)
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

    const uTime  = gl.getUniformLocation(prog, 'u_time')
    const uRes   = gl.getUniformLocation(prog, 'u_res')
    const uColor = gl.getUniformLocation(prog, 'u_color')
    const uSpeed = gl.getUniformLocation(prog, 'u_speed')
    const uScale = gl.getUniformLocation(prog, 'u_scale')
    const uNoise = gl.getUniformLocation(prog, 'u_noise')
    const uRot   = gl.getUniformLocation(prog, 'u_rotation')

    const [r, g, b] = hexToRgb(color)
    gl.uniform3f(uColor, r, g, b)
    gl.uniform1f(uSpeed, speed)
    gl.uniform1f(uScale, scale)
    gl.uniform1f(uNoise, noiseIntensity)
    gl.uniform1f(uRot, rotation)

    const setSize = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr  = window.devicePixelRatio || 1
      canvas.width  = rect.width  * dpr
      canvas.height = rect.height * dpr
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.uniform2f(uRes, canvas.width, canvas.height)
    }

    setTimeout(setSize, 0)
    window.addEventListener('resize', setSize)

    let rafId = 0
    let start: number | null = null
    const tick = (ts: number) => {
      if (!start) start = ts
      gl.uniform1f(uTime, (ts - start) / 1000)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', setSize)
    }
  }, [color, speed, scale, noiseIntensity, rotation])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0, left: 0,
        width: '100%', height: '100%',
        display: 'block',
        ...style,
      }}
    />
  )
}
