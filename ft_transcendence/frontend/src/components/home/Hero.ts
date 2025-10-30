import { BaseComponent } from '../BaseComponent';

export class Hero extends BaseComponent 
{
  private gl!: WebGLRenderingContext;
  private program!: WebGLProgram;
  private mouse = { x: 0.5, y: 0.5, active: false };
  private startTime = performance.now();
  private reveal = 0;
  private canvas!: HTMLCanvasElement;
  private raf?: number;

  render(): string 
  {
    return `
      <section id="hero-section"
        class="relative w-screen min-h-screen overflow-hidden flex items-center justify-center bg-black">

        <!-- Fundo base -->
        <div class="absolute inset-0 
                    bg-[url('/assets/images/backgrounds/space_background.jpg')]
                    bg-cover bg-center bg-no-repeat"></div>

        <!-- Canvas do shader -->
        <canvas id="hero-hover-canvas" class="absolute inset-0 w-full h-full"></canvas>

        <!-- Overlay escuro -->
        <div class="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60"></div>

      </section>
    `;
  }

  async mount(): Promise<void> 
  {
  const section = document.getElementById('hero-section')!;
  this.canvas = document.getElementById('hero-hover-canvas') as HTMLCanvasElement;
  const gl = this.canvas.getContext('webgl')!;
  this.gl = gl;

  const resize = () => {
    const rect = section.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  };
  resize();
  window.addEventListener('resize', resize);

  // === Shaders ===
  const vertex = `
    attribute vec2 position;
    varying vec2 vUV;
    void main() {
      vUV = (position + 1.0) * 0.5;
      gl_Position = vec4(position, 0.0, 1.0);
    }`;

  const fragment = `
    precision highp float;
    varying vec2 vUV;
    uniform float time;
    uniform vec2 mouse;
    uniform vec2 prevMouse;
    uniform float reveal;
    uniform vec2 resolution;

    uniform sampler2D texSpace;
    uniform sampler2D texNeb1;
    uniform sampler2D texNeb2;
    uniform sampler2D texText;

    float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
    float noise(vec2 p){
      vec2 i=floor(p), f=fract(p);
      float a=hash(i), b=hash(i+vec2(1,0));
      float c=hash(i+vec2(0,1)), d=hash(i+vec2(1,1));
      vec2 u=f*f*(3.-2.*f);
      return mix(a,b,u.x)+(c-a)*u.y*(1.-u.x)+(d-b)*u.x*u.y;
    }
    float fbm(vec2 p){
      float v=0.0, a=0.5;
      for(int i=0;i<5;i++){v+=a*noise(p);p*=2.0;a*=0.5;}
      return v;
    }

    float blob(vec2 uv, vec2 center, float t){
      vec2 p=(uv-center)*8.0;
      float n=fbm(p*0.6+t*0.3)*0.8 + fbm(p*1.2-t*0.2)*0.5;
      float r=0.20 + 0.03*sin(t*0.5+n*6.2831);
      float d=length(uv-center);
      float edge=smoothstep(r, r-0.15, d+n*0.05);
      return clamp(edge,0.0,1.0);
    }

    void main(){
      vec2 uv = vUV;
      vec2 centered = (uv - 0.5);
      float aspect = resolution.x / resolution.y;
      if (aspect > 1.0) centered.x /= aspect;
      else centered.y *= aspect;
      uv = centered + 0.5;
      uv = clamp(uv, 0.0, 1.0);

      vec4 base = texture2D(texSpace, uv);
      vec4 n1 = texture2D(texNeb1, uv + vec2(sin(time*0.02), cos(time*0.015))*0.02);
      vec4 n2 = texture2D(texNeb2, uv);

      float blend = smoothstep(0.3, 0.7, abs(fract(sin(time*0.1))*2.0 - 1.0));

      // blob principal e rastro fixo
      float head = blob(vUV, mouse, time);
      float tail = blob(vUV, prevMouse, time - 0.6) * 0.5;
      float trail = clamp(head + tail, 0.0, 1.0);
      float mask = trail * reveal;

      vec3 mixNeb = mix(n1.rgb, n2.rgb, blend);
      vec3 col = mix(base.rgb, mixNeb, mask);

      // === texto constelação ===
      vec4 textTex = texture2D(texText, vUV);
      float pulse = 0.8 + 0.2 * sin(time * 2.0);
      // texto visível mesmo sem hover
      col += textTex.rgb * textTex.a * pulse;

      // brilho suave ao redor do mouse
      float glow = smoothstep(0.25, 0.0, length(uv - mouse)) * reveal * 0.3;
      col += vec3(0.5, 0.7, 1.0) * glow;

      gl_FragColor = vec4(col, 1.0);
    }`;

  const vs = this.createShader(gl, gl.VERTEX_SHADER, vertex);
  const fs = this.createShader(gl, gl.FRAGMENT_SHADER, fragment);
  this.program = this.createProgram(gl, vs, fs);
  gl.useProgram(this.program);

  const pos = gl.getAttribLocation(this.program, 'position');
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(pos);
  gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

  const texSpace = this.loadTexture('/assets/images/backgrounds/space_background.jpg');
  const texNeb1  = this.loadTexture('/assets/images/backgrounds/nebula1.jpg');
  const texText  = gl.createTexture()!;

  const video = document.createElement('video');
  video.src = '/assets/images/backgrounds/hyperspace.mp4';
  video.loop = true;
  video.muted = true;
  video.playsInline = true;
  video.crossOrigin = 'anonymous';

  const tryPlay = async () => {
    try {
      await video.play();
      console.log('🎥 Vídeo iniciado com sucesso');
      document.removeEventListener('click', tryPlay);
      document.removeEventListener('mousemove', tryPlay);
    } catch {
      console.warn('⏸️ Autoplay bloqueado — mova o mouse ou clique para iniciar o vídeo.');
      document.addEventListener('click', tryPlay);
      document.addEventListener('mousemove', tryPlay);
    }
  };
  await tryPlay();

  const texVideo = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, texVideo);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  // === Uniforms ===
  const uniforms = {
    time: gl.getUniformLocation(this.program, 'time'),
    mouse: gl.getUniformLocation(this.program, 'mouse'),
    prevMouse: gl.getUniformLocation(this.program, 'prevMouse'),
    reveal: gl.getUniformLocation(this.program, 'reveal'),
    resolution: gl.getUniformLocation(this.program, 'resolution'),
    texSpace: gl.getUniformLocation(this.program, 'texSpace'),
    texNeb1: gl.getUniformLocation(this.program, 'texNeb1'),
    texNeb2: gl.getUniformLocation(this.program, 'texNeb2'),
    texText: gl.getUniformLocation(this.program, 'texText'),
  };

  gl.uniform1i(uniforms.texSpace, 0);
  gl.uniform1i(uniforms.texNeb1, 1);
  gl.uniform1i(uniforms.texNeb2, 2);
  gl.uniform1i(uniforms.texText, 3);

  const textCanvas = document.createElement('canvas');
  const ctx = textCanvas.getContext('2d')!;
  const drawConstellationText = () => {
    const w = textCanvas.width = this.canvas.width;
    const h = textCanvas.height = this.canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.scale(1, -1);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `bold ${h * 0.13}px 'Trattorian', 'Orbitron', sans-serif`;

    const gradient = ctx.createLinearGradient(-w / 3, 0, w / 3, 0);
    gradient.addColorStop(0.0, '#007a8f');
    gradient.addColorStop(0.25, '#2a3a7a');
    gradient.addColorStop(0.5, '#6030a3');
    gradient.addColorStop(0.75, '#007a8f'); 
    gradient.addColorStop(1.0, '#111b40'); 

    ctx.fillStyle = gradient;
    ctx.fillText('TRANCENDENCE', 0, 0);
    ctx.lineWidth = 2.2;
    ctx.strokeStyle = gradient;
    ctx.strokeText('TRANCENDENCE', 0, 0);
    ctx.shadowColor = 'rgba(90, 150, 255, 0.25)';
    ctx.shadowBlur = 10;

    ctx.restore();
  };

  await document.fonts.load(`bold 100px 'Trattorian'`);
  drawConstellationText();

  section.addEventListener('mousemove', (e) => {
    const r = section.getBoundingClientRect();
    this.mouse.x = (e.clientX - r.left) / r.width;
    this.mouse.y = 1.0 - (e.clientY - r.top) / r.height;
    this.mouse.active = true;
  });
  section.addEventListener('mouseleave', () => (this.mouse.active = false));

  let prevMouse = { x: this.mouse.x, y: this.mouse.y };

  const loop = () => {
    const t = (performance.now() - this.startTime) * 0.001;
    gl.useProgram(this.program);
    gl.uniform1f(uniforms.time, t);
    gl.uniform2f(uniforms.mouse, this.mouse.x, this.mouse.y);
    gl.uniform2f(uniforms.prevMouse, prevMouse.x, prevMouse.y);
    gl.uniform2f(uniforms.resolution, this.canvas.width, this.canvas.height);

    prevMouse.x += (this.mouse.x - prevMouse.x) * 0.25;
    prevMouse.y += (this.mouse.y - prevMouse.y) * 0.25;
    this.reveal += ((this.mouse.active ? 1 : 0) - this.reveal) * 0.08;
    gl.uniform1f(uniforms.reveal, this.reveal);

    if (video.readyState >= video.HAVE_CURRENT_DATA) {
      gl.activeTexture(gl.TEXTURE2);
      gl.bindTexture(gl.TEXTURE_2D, texVideo);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
    }

    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, texSpace);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, texNeb1);
    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_2D, texText);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textCanvas);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    this.raf = requestAnimationFrame(loop);
  };
  loop();
}


  private createShader(gl: WebGLRenderingContext, type: number, src: string) {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  }

  private createProgram(gl: WebGLRenderingContext, vs: WebGLShader, fs: WebGLShader) {
    const p = gl.createProgram()!;
    gl.attachShader(p, vs);
    gl.attachShader(p, fs);
    gl.linkProgram(p);
    return p;
  }

  private loadTexture(src: string) {
    const gl = this.gl;
    const tex = gl.createTexture()!;
    const img = new Image();
    img.src = src;
    img.onload = () => {
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    };
    return tex;
  }

  unmount(): void {
    if (this.raf) cancelAnimationFrame(this.raf);
  }
}
