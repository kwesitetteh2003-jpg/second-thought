import { useEffect, useRef } from "react";

/**
 * One small WebGL accent: slow ember ink bleeding into night paper.
 * Raw WebGL (no library), half-resolution, capped DPR, only runs while on
 * screen, and not at all under reduced motion (a CSS wash shows instead).
 */
const FRAG = `
precision mediump float;
uniform vec2 r; uniform float t; uniform vec2 m;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);
  return mix(mix(h(i),h(i+vec2(1,0)),u.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),u.x),u.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*n(p);p*=2.03;a*=.5;}return v;}
void main(){
  vec2 uv=gl_FragCoord.xy/r; vec2 p=uv*vec2(r.x/r.y,1.)*2.2;
  float tt=t*.045;
  vec2 q=vec2(fbm(p+tt),fbm(p+vec2(5.2,1.3)-tt));
  vec2 w=vec2(fbm(p+3.*q+vec2(1.7,9.2)+tt*1.4),fbm(p+3.*q+vec2(8.3,2.8)));
  float f=fbm(p+2.6*w);
  float d=distance(uv,m); float pull=smoothstep(.55,0.,d)*.25;
  vec3 night=vec3(.067,.078,.106);
  vec3 ember=vec3(.85,.34,.16);
  vec3 ochre=vec3(.60,.36,.04);
  vec3 c=mix(night,ochre,smoothstep(.45,.85,f+pull)*.55);
  c=mix(c,ember,smoothstep(.62,.95,f*1.05+pull)*.75);
  c*=.75+.25*smoothstep(1.2,.1,distance(uv,vec2(.7,.4)));
  gl_FragColor=vec4(c,1.);
}`;
const VERT = `attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}`;

export function InkWash({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const gl = c.getContext("webgl", { antialias: false, alpha: false, powerPreference: "low-power" });
    if (!gl) return;
    const sh = (type: number, src: string) => { const s = gl.createShader(type)!; gl.shaderSource(s, src); gl.compileShader(s); return s; };
    const pr = gl.createProgram()!;
    gl.attachShader(pr, sh(gl.VERTEX_SHADER, VERT)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return;
    gl.useProgram(pr);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const a = gl.getAttribLocation(pr, "a"); gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
    const uR = gl.getUniformLocation(pr, "r"), uT = gl.getUniformLocation(pr, "t"), uM = gl.getUniformLocation(pr, "m");
    const mouse = [0.7, 0.4], target = [0.7, 0.4];
    const size = () => {
      const s = Math.min(window.devicePixelRatio || 1, 1.5) * 0.5;
      c.width = Math.max(1, Math.round(c.clientWidth * s)); c.height = Math.max(1, Math.round(c.clientHeight * s));
      gl.viewport(0, 0, c.width, c.height);
    };
    size();
    const ro = new ResizeObserver(size); ro.observe(c);
    const onMove = (e: PointerEvent) => { const b = c.getBoundingClientRect(); target[0] = (e.clientX - b.left) / b.width; target[1] = 1 - (e.clientY - b.top) / b.height; };
    c.parentElement?.addEventListener("pointermove", onMove);
    let raf = 0, visible = false; const t0 = performance.now();
    const loop = () => {
      mouse[0] += (target[0] - mouse[0]) * 0.04; mouse[1] += (target[1] - mouse[1]) * 0.04;
      gl.uniform2f(uR, c.width, c.height); gl.uniform1f(uT, (performance.now() - t0) / 1000 + 20); gl.uniform2f(uM, mouse[0], mouse[1]);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      raf = visible ? requestAnimationFrame(loop) : 0;
    };
    const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible && !raf) raf = requestAnimationFrame(loop); });
    io.observe(c);
    c.dataset.live = "1";
    return () => { cancelAnimationFrame(raf); io.disconnect(); ro.disconnect(); c.parentElement?.removeEventListener("pointermove", onMove); gl.getExtension("WEBGL_lose_context")?.loseContext(); };
  }, []);
  return <canvas ref={ref} aria-hidden className={`ink-wash ${className}`} />;
}
