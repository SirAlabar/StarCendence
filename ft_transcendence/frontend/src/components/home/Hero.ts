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
  private video!: HTMLVideoElement;
  private textCanvas!: HTMLCanvasElement;
  private textures!: {
    space: WebGLTexture;
    neb1: WebGLTexture;
    video: WebGLTexture;
    text: WebGLTexture;
  };
  private uniforms!: {
    time: WebGLUniformLocation | null;
    mouse: WebGLUniformLocation | null;
    prevMouse: WebGLUniformLocation | null;
    reveal: WebGLUniformLocation | null;
    resolution: WebGLUniformLocation | null;
    blobScale: WebGLUniformLocation | null;
    texSpace: WebGLUniformLocation | null;
    texNeb1: WebGLUniformLocation | null;
    texNeb2: WebGLUniformLocation | null;
    texText: WebGLUniformLocation | null;
  };

  render(): string 
  {
    return `
      <section id="hero-section"
        class="relative w-screen min-h-screen overflow-hidden flex items-center justify-center bg-black">

        <div class="absolute inset-0 overflow-hidden">
          <div class="w-full h-full 
                      bg-[url('/assets/images/backgrounds/space_background.jpg')]
                      bg-cover bg-center bg-no-repeat">
          </div>
        </div>

        <canvas id="hero-hover-canvas" class="absolute inset-0 w-full h-full"></canvas>

        <div class="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60"></div>

      </section>
    `;
  }

  async mount(): Promise<void> 
  {
    const section = document.getElementById('hero-section');
    if (!section) 
    {
      return;
    }

    this.canvas = document.getElementById('hero-hover-canvas') as HTMLCanvasElement;
    if (!this.canvas) 
    {
      return;
    }

    const gl = this.canvas.getContext('webgl');
    if (!gl) 
    {
      return;
    }
    this.gl = gl;

    this.setupCanvas(section);
    this.setupShaders();
    this.setupBuffers();
    await this.setupTextures();
    await this.setupVideo();
    this.setupUniforms();
    await this.setupTextCanvas();
    this.setupEventListeners(section);
    this.startRenderLoop();
  }

  private setupCanvas(section: HTMLElement): void
  {
    const resize = () =>
    {
      if (!this.gl) return;
      
      const rect = section.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      this.canvas.width = rect.width * dpr;
      this.canvas.height = rect.height * dpr;
      this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
      
      // Redraw text canvas on resize
      if (this.textCanvas)
      {
        this.drawConstellationText();
      }
    };
    
    resize();
    window.addEventListener('resize', resize);
  }

  private setupShaders(): void
  {
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
      uniform float blobScale;

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

      float blob(vec2 uv, vec2 center, float t, float scale){
        float aspect = resolution.x / resolution.y;
        vec2 diff = uv - center;
        diff.x *= aspect;
        
        vec2 p = diff * 8.0 * scale;
        float n = fbm(p*0.6+t*0.3)*0.8 + fbm(p*1.2-t*0.2)*0.5;
        float r = (0.20 + 0.03*sin(t*0.5+n*6.2831)) * scale;
        
        float d = length(diff);
        float edge = smoothstep(r, r-0.15*scale, d+n*0.05*scale);
        return clamp(edge, 0.0, 1.0);
      }

      vec2 coverUV(vec2 uv, float canvasAspect, float textureAspect) {
        vec2 ratio = vec2(
          min(canvasAspect / textureAspect, 1.0),
          min(textureAspect / canvasAspect, 1.0)
        );
        return vec2(
          uv.x * ratio.x + (1.0 - ratio.x) * 0.5,
          uv.y * ratio.y + (1.0 - ratio.y) * 0.5
        );
      }

      void main(){
        float canvasAspect = resolution.x / resolution.y;
        float textureAspect = 1.5; // Approximate aspect ratio of background images
        
        vec2 uv = coverUV(vUV, canvasAspect, textureAspect);

        vec4 base = texture2D(texSpace, uv);
        vec4 n1 = texture2D(texNeb1, uv + vec2(sin(time*0.02), cos(time*0.015))*0.02);
        vec4 n2 = texture2D(texNeb2, uv);

        float blend = smoothstep(0.3, 0.7, abs(fract(sin(time*0.1))*2.0 - 1.0));

        float head = blob(vUV, mouse, time, blobScale);
        float tail = blob(vUV, prevMouse, time - 0.6, blobScale) * 0.5;
        float trail = clamp(head + tail, 0.0, 1.0);
        float mask = trail * reveal;

        vec3 mixNeb = mix(n1.rgb, n2.rgb, blend);
        vec3 col = mix(base.rgb, mixNeb, mask);

        vec4 textTex = texture2D(texText, vUV);
        float pulse = 0.8 + 0.2 * sin(time * 2.0);
        col += textTex.rgb * textTex.a * pulse;

        vec2 glowDiff = vUV - mouse;
        glowDiff.x *= resolution.x / resolution.y;
        float glow = smoothstep(0.25 * blobScale, 0.0, length(glowDiff)) * reveal * 0.3;
        col += vec3(0.5, 0.7, 1.0) * glow;

        gl_FragColor = vec4(col, 1.0);
      }`;

    const vs = this.createShader(this.gl, this.gl.VERTEX_SHADER, vertex);
    const fs = this.createShader(this.gl, this.gl.FRAGMENT_SHADER, fragment);
    this.program = this.createProgram(this.gl, vs, fs);
    this.gl.useProgram(this.program);
  }

  private setupBuffers(): void
  {
    const pos = this.gl.getAttribLocation(this.program, 'position');
    const buf = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buf);
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      this.gl.STATIC_DRAW
    );
    this.gl.enableVertexAttribArray(pos);
    this.gl.vertexAttribPointer(pos, 2, this.gl.FLOAT, false, 0, 0);
  }

  private async setupTextures(): Promise<void>
  {
    this.textures = {
      space: this.loadTexture('/assets/images/backgrounds/space_background.jpg'),
      neb1: this.loadTexture('/assets/images/backgrounds/nebula1.jpg'),
      video: this.gl.createTexture()!,
      text: this.gl.createTexture()!
    };
  }

  private async setupVideo(): Promise<void>
  {
    this.video = document.createElement('video');
    this.video.src = '/assets/images/backgrounds/hyperspace.mp4';
    this.video.loop = true;
    this.video.muted = true;
    this.video.playsInline = true;
    this.video.crossOrigin = 'anonymous';

    await this.tryPlayVideo();
    this.configureVideoTexture();
  }

  private async tryPlayVideo(): Promise<void>
  {
    const tryPlay = async () =>
    {
      try
      {
        await this.video.play();
        document.removeEventListener('click', tryPlay);
        document.removeEventListener('mousemove', tryPlay);
      }
      catch
      {
        document.addEventListener('click', tryPlay);
        document.addEventListener('mousemove', tryPlay);
      }
    };
    
    await tryPlay();
  }

  private configureVideoTexture(): void
  {
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.textures.video);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
  }

  private setupUniforms(): void
  {
    this.uniforms = {
      time: this.gl.getUniformLocation(this.program, 'time'),
      mouse: this.gl.getUniformLocation(this.program, 'mouse'),
      prevMouse: this.gl.getUniformLocation(this.program, 'prevMouse'),
      reveal: this.gl.getUniformLocation(this.program, 'reveal'),
      resolution: this.gl.getUniformLocation(this.program, 'resolution'),
      blobScale: this.gl.getUniformLocation(this.program, 'blobScale'),
      texSpace: this.gl.getUniformLocation(this.program, 'texSpace'),
      texNeb1: this.gl.getUniformLocation(this.program, 'texNeb1'),
      texNeb2: this.gl.getUniformLocation(this.program, 'texNeb2'),
      texText: this.gl.getUniformLocation(this.program, 'texText')
    };

    this.gl.uniform1i(this.uniforms.texSpace, 0);
    this.gl.uniform1i(this.uniforms.texNeb1, 1);
    this.gl.uniform1i(this.uniforms.texNeb2, 2);
    this.gl.uniform1i(this.uniforms.texText, 3);
  }

  private async setupTextCanvas(): Promise<void>
  {
    this.textCanvas = document.createElement('canvas');
    await document.fonts.load(`bold 100px 'Trattorian'`);
    this.drawConstellationText();
  }

  private drawConstellationText(): void
  {
    const ctx = this.textCanvas.getContext('2d')!;
    const w = this.textCanvas.width = this.canvas.width;
    const h = this.textCanvas.height = this.canvas.height;
    
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.scale(1, -1);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Responsive font size based on viewport width
    const viewportWidth = window.innerWidth;
    let fontSize;
    
    if (viewportWidth < 640)
    {
      // Mobile: smaller font
      fontSize = Math.min(h * 0.07, viewportWidth * 0.10);
    }
    else if (viewportWidth < 1024)
    {
      // Tablet: medium font
      fontSize = Math.min(h * 0.10, viewportWidth * 0.08);
    }
    else
    {
      // Desktop: larger font
      fontSize = h * 0.10;
    }
    
    ctx.font = `bold ${fontSize}px 'Trattorian', 'Orbitron', sans-serif`;

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
  }

  private setupEventListeners(section: HTMLElement): void
  {
    section.addEventListener('mousemove', (e) =>
    {
      const r = section.getBoundingClientRect();
      this.mouse.x = (e.clientX - r.left) / r.width;
      this.mouse.y = 1.0 - (e.clientY - r.top) / r.height;
      this.mouse.active = true;
    });

    section.addEventListener('mouseleave', () =>
    {
      this.mouse.active = false;
    });
  }

  private startRenderLoop(): void
  {
    let prevMouse = { x: this.mouse.x, y: this.mouse.y };

    const loop = () =>
    {
      this.updateUniforms(prevMouse);
      this.updatePrevMouse(prevMouse);
      this.updateReveal();
      this.updateVideoTexture();
      this.bindTextures();
      this.render3D();
      this.raf = requestAnimationFrame(loop);
    };
    
    loop();
  }

  private updateUniforms(prevMouse: { x: number; y: number }): void
  {
    const t = (performance.now() - this.startTime) * 0.001;
    this.gl.useProgram(this.program);
    this.gl.uniform1f(this.uniforms.time, t);
    this.gl.uniform2f(this.uniforms.mouse, this.mouse.x, this.mouse.y);
    this.gl.uniform2f(this.uniforms.prevMouse, prevMouse.x, prevMouse.y);
    this.gl.uniform2f(this.uniforms.resolution, this.canvas.width, this.canvas.height);
    
    // Calculate responsive blob scale: 3 sizes
    const viewportWidth = window.innerWidth;
    let blobScale;
    
    if (viewportWidth < 640)
    {
      // Mobile: smallest hover effect
      blobScale = 0.5;
    }
    else if (viewportWidth < 1024)
    {
      // Tablet: medium hover effect
      blobScale = 0.75;
    }
    else
    {
      // Desktop: full size hover effect
      blobScale = 1.0;
    }
    
    this.gl.uniform1f(this.uniforms.blobScale, blobScale);
  }

  private updatePrevMouse(prevMouse: { x: number; y: number }): void
  {
    prevMouse.x += (this.mouse.x - prevMouse.x) * 0.25;
    prevMouse.y += (this.mouse.y - prevMouse.y) * 0.25;
  }

  private updateReveal(): void
  {
    this.reveal += ((this.mouse.active ? 1 : 0) - this.reveal) * 0.08;
    this.gl.uniform1f(this.uniforms.reveal, this.reveal);
  }

  private updateVideoTexture(): void
  {
    if (this.video.readyState >= this.video.HAVE_CURRENT_DATA)
    {
      this.gl.activeTexture(this.gl.TEXTURE2);
      this.gl.bindTexture(this.gl.TEXTURE_2D, this.textures.video);
      this.gl.texImage2D(
        this.gl.TEXTURE_2D,
        0,
        this.gl.RGBA,
        this.gl.RGBA,
        this.gl.UNSIGNED_BYTE,
        this.video
      );
    }
  }

  private bindTextures(): void
  {
    this.gl.activeTexture(this.gl.TEXTURE0);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.textures.space);
    
    this.gl.activeTexture(this.gl.TEXTURE1);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.textures.neb1);
    
    this.gl.activeTexture(this.gl.TEXTURE3);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.textures.text);
    this.gl.texImage2D(
      this.gl.TEXTURE_2D,
      0,
      this.gl.RGBA,
      this.gl.RGBA,
      this.gl.UNSIGNED_BYTE,
      this.textCanvas
    );
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
  }

  private render3D(): void
  {
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
  }

  private createShader(gl: WebGLRenderingContext, type: number, src: string): WebGLShader
  {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  }

  private createProgram(gl: WebGLRenderingContext, vs: WebGLShader, fs: WebGLShader): WebGLProgram
  {
    const p = gl.createProgram()!;
    gl.attachShader(p, vs);
    gl.attachShader(p, fs);
    gl.linkProgram(p);
    return p;
  }

  private loadTexture(src: string): WebGLTexture
  {
    const gl = this.gl;
    const tex = gl.createTexture()!;
    const img = new Image();
    img.src = src;
    
    img.onload = () =>
    {
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    };
    
    return tex;
  }

  unmount(): void
  {
    if (this.raf)
    {
      cancelAnimationFrame(this.raf);
    }
  }
}