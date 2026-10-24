var _t=Object.defineProperty;var xt=(r,e,n)=>e in r?_t(r,e,{enumerable:!0,configurable:!0,writable:!0,value:n}):r[e]=n;var u=(r,e,n)=>xt(r,typeof e!="symbol"?e+"":e,n);var N=`
attribute vec2 a_pos;
varying vec2 v_uv;
void main() {
	v_uv = a_pos * 0.5 + 0.5;
	gl_Position = vec4(a_pos, 0.0, 1.0);
}`,He=`
precision mediump float;
uniform sampler2D u_tex;
uniform vec2 u_scale;
uniform vec2 u_offset;
varying vec2 v_uv;
void main() {
	gl_FragColor = texture2D(u_tex, v_uv * u_scale + u_offset);
}`,We=`
precision mediump float;
uniform sampler2D u_tex;
uniform vec2 u_dir;
varying vec2 v_uv;
void main() {
	vec4 s  = texture2D(u_tex, v_uv) * 0.227027;
	s += texture2D(u_tex, v_uv + u_dir * 1.0) * 0.194594;
	s += texture2D(u_tex, v_uv - u_dir * 1.0) * 0.194594;
	s += texture2D(u_tex, v_uv + u_dir * 2.0) * 0.121622;
	s += texture2D(u_tex, v_uv - u_dir * 2.0) * 0.121622;
	s += texture2D(u_tex, v_uv + u_dir * 3.0) * 0.054054;
	s += texture2D(u_tex, v_uv - u_dir * 3.0) * 0.054054;
	s += texture2D(u_tex, v_uv + u_dir * 4.0) * 0.016216;
	s += texture2D(u_tex, v_uv - u_dir * 4.0) * 0.016216;
	gl_FragColor = s;
}`,ae=`
attribute vec2 a_pos;
uniform vec2 u_center;   // panel centre in root-pixel coords (top-left origin)
uniform vec2 u_size;     // panel size in px
uniform vec2 u_res;      // root element size in px
uniform float u_pad;     // shadow padding in px
varying vec2 v_localPx;
varying vec2 v_screenUV;

void main() {
	vec2 total = u_size + vec2(u_pad * 2.0);
	v_localPx = a_pos * total;                       // px from panel centre
	vec2 px = u_center + a_pos * total;              // screen px (DOM)
	v_screenUV = vec2(px.x / u_res.x, 1.0 - px.y / u_res.y);
	vec2 ndc = (px / u_res) * 2.0 - 1.0;
	ndc.y = -ndc.y;
	gl_Position = vec4(ndc, 0.0, 1.0);
}`,ke=`
precision highp float;

uniform sampler2D u_bgTex;
uniform sampler2D u_blurTex;
uniform vec2 u_size;           // panel px
uniform float u_radius;        // corner radius px
uniform vec2 u_res;

uniform float u_refract;
uniform float u_chroma;
uniform float u_edgeHL;
uniform float u_spec;
uniform float u_fresnel;
uniform float u_distort;
uniform float u_alpha;
uniform float u_sat;
uniform float u_tint;
uniform float u_zRadius;
uniform float u_brightness;
uniform float u_shadowAlpha;
uniform float u_shadowSpread;
uniform float u_shadowOffY;
uniform float u_bevelMode;

varying vec2 v_localPx;
varying vec2 v_screenUV;

// Rounded-rect signed distance
float rrSDF(vec2 p, vec2 b, float r) {
	vec2 q = abs(p) - b + vec2(r);
	return min(max(q.x, q.y), 0.0) + length(max(q, vec2(0.0))) - r;
}

// Bevel height field.
// Both modes use the same half-circle profile (smooth peak at centre,
// steep at edges).  The difference is in the refraction model:
//   mode 0 = biconvex pill \u2014 light refracts at both surfaces (entry + exit).
//   mode 1 = dome (plano-convex) \u2014 flat bottom, so only exit refraction.
// d = distance inside from edge (-sdf), zR = z-radius of the bevel.
float bevelHeight(float d, float zR) {
	if (d <= 0.0) return 0.0;
	if (d >= zR) return zR;
	return sqrt(d * (2.0 * zR - d));
}

float hash(vec2 p) {
	return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

void main() {
	vec2 half_ = u_size * 0.5;
	float r = min(u_radius, min(half_.x, half_.y));
	float sdf = rrSDF(v_localPx, half_, r);

	// \u2500\u2500 Shadow (outside panel, offset by shadowOffY) \u2500\u2500
	if (sdf > 0.0) {
		float sdfShadow = rrSDF(v_localPx - vec2(0.0, u_shadowOffY), half_, r);
		float d = max(sdfShadow - 1.0, 0.0);
		float spread = max(u_shadowSpread, 1.0);
		float falloff = 1.0 / (spread * spread);
		float outerShadow = exp(-d * d * falloff) * 0.65;
		float contactShadow = exp(-d * 0.08 / max(spread * 0.04, 0.01)) * 0.35;
		float shadow = (outerShadow + contactShadow) * u_shadowAlpha;
		gl_FragColor = vec4(0.0, 0.0, 0.0, shadow);
		return;
	}

	// \u2500\u2500 Anti-aliased mask \u2500\u2500
	float mask = 1.0 - smoothstep(-1.5, 0.5, sdf);

	float maxD = min(half_.x, half_.y);
	float inside = -sdf;
	float edge = smoothstep(maxD * 0.35, 0.0, inside);

	// \u2500\u2500 Surface normal (top surface) via bevel height field \u2500\u2500
	float zR = u_zRadius;
	float e = 2.0;
	float dC = inside;
	float dR = -rrSDF(v_localPx + vec2(e, 0.0), half_, r);
	float dL = -rrSDF(v_localPx - vec2(e, 0.0), half_, r);
	float dU = -rrSDF(v_localPx + vec2(0.0, e), half_, r);
	float dD = -rrSDF(v_localPx - vec2(0.0, e), half_, r);
	float hC = bevelHeight(dC, zR);
	float hR = bevelHeight(dR, zR);
	float hL = bevelHeight(dL, zR);
	float hU = bevelHeight(dU, zR);
	float hD = bevelHeight(dD, zR);
	vec2 hGrad = vec2(hR - hL, hU - hD) / (2.0 * e);
	vec3 N = normalize(vec3(-hGrad, 1.0));

	float depth = smoothstep(0.0, zR, inside);

	// \u2500\u2500 Refraction \u2500\u2500
	vec2 pxToUV = vec2(1.0, -1.0) / u_res;
	float ior = 1.5;
	float refrPow = 1.0 - 1.0 / ior;
	float thickness = hC * 2.0;
	float thickNorm = thickness / max(zR * 2.0, 1.0);
	vec2 refrPx;
	if (u_bevelMode < 0.5) {
		// Biconvex: physically-based dual-surface refraction
		vec2 exitRefr = hGrad * refrPow;
		vec2 entryRefr = hGrad * refrPow;
		vec2 throughRefr = entryRefr * thickNorm * 0.5;
		refrPx = (exitRefr + entryRefr + throughRefr) * u_refract * 30.0;
		vec2 centerDir = -v_localPx / max(half_, vec2(1.0));
		refrPx += centerDir * u_refract * 4.0 * depth;
	} else {
		// Dome (plano-convex): uniform magnification by contracting UV toward center.
		// Each pixel samples from closer to center \u2192 content appears larger.
		refrPx = -v_localPx * u_refract * depth * 0.35;
	}
	vec2 refr = refrPx * pxToUV;

	// \u2500\u2500 Micro-distortion noise \u2500\u2500
	vec2 ns = v_localPx * 0.08;
	vec2 absPxToUV = vec2(1.0) / u_res;
	vec2 micro = (vec2(hash(ns), hash(ns + vec2(37.0))) - 0.5) * u_distort * 4.0 * absPxToUV;

	// \u2500\u2500 Chromatic aberration \u2500\u2500
	float caS = u_chroma * 18.0 * (edge * 0.7 + 0.3) * 2.0;
	vec2 caD = N.xy * caS * pxToUV;
	vec2 base = v_screenUV + refr + micro;

	vec3 sharp = vec3(
		texture2D(u_bgTex,  base + caD).r,
		texture2D(u_bgTex,  base).g,
		texture2D(u_bgTex,  base - caD).b
	);
	vec3 blur = vec3(
		texture2D(u_blurTex, base + caD).r,
		texture2D(u_blurTex, base).g,
		texture2D(u_blurTex, base - caD).b
	);
	// \u2500\u2500 Edge-weighted blur mix \u2500\u2500
	// Centre of the panel uses the blurred sample; the rim blends
	// toward the sharp sample so refraction edges stay crisp.
	float edgeMix = (1.0 - edge * 0.15);
	vec3 col = mix(sharp, blur, edgeMix);

	// \u2500\u2500 Brightness \u2500\u2500
	col *= 1.0 + u_brightness;

	// \u2500\u2500 Saturation \u2500\u2500
	float lum = dot(col, vec3(0.299, 0.587, 0.114));
	col = mix(vec3(lum), col, 1.0 + u_sat);

	// \u2500\u2500 Cool glass tint \u2500\u2500
	col = mix(col, col * vec3(0.92, 0.95, 1.05), u_tint);
	col *= 1.0 + 0.06 * depth;

	// \u2500\u2500 Fresnel \u2500\u2500
	float fres = pow(1.0 - abs(N.z), 4.0) * u_fresnel;

	// \u2500\u2500 Specular highlights (multi-light Blinn-Phong) \u2500\u2500
	vec3 V = vec3(0.0, 0.0, 1.0);
	vec3 L1 = normalize(vec3(0.4, 0.7, 1.0));
	vec3 H1 = normalize(L1 + V);
	float sp1 = pow(max(dot(N, H1), 0.0), 90.0);
	vec3 L2 = normalize(vec3(-0.3, -0.5, 1.0));
	vec3 H2 = normalize(L2 + V);
	float sp2 = pow(max(dot(N, H2), 0.0), 50.0) * 0.3;
	vec3 L3 = normalize(vec3(0.1, 0.3, 1.0));
	float spB = pow(max(dot(N, L3), 0.0), 6.0) * 0.1;
	vec3 L4 = normalize(vec3(0.0, 0.9, 0.4));
	vec3 H4 = normalize(L4 + V);
	float sp4 = pow(max(dot(N, H4), 0.0), 120.0) * 0.6;
	float totalSpec = (sp1 + sp2 + spB + sp4) * u_spec;

	// \u2500\u2500 Inner border / stroke highlight \u2500\u2500
	float borderWidth = 1.5;
	float innerStroke = smoothstep(-borderWidth - 1.0, -borderWidth, sdf)
	                  * (1.0 - smoothstep(-1.0, 0.0, sdf));
	float topBias = 0.5 + 0.5 * (-v_localPx.y / half_.y);
	innerStroke *= (0.4 + 0.6 * topBias);

	// \u2500\u2500 Edge highlight & inner glow \u2500\u2500
	float rim = edge * u_edgeHL * 0.22;
	float innerGlow = smoothstep(5.0, 0.0, -sdf) * u_edgeHL * 0.15;

	// \u2500\u2500 Environment-like reflection (fake) \u2500\u2500
	float envRefl = (N.y * 0.5 + 0.5) * fres * 0.08;

	// \u2500\u2500 Composite \u2500\u2500
	vec3 fin = col;
	fin += vec3(totalSpec);
	fin += vec3(rim + innerGlow);
	fin += vec3(innerStroke * u_edgeHL * 0.55);
	fin += vec3(envRefl);
	fin = mix(fin, vec3(1.0), fres * 0.2);

	gl_FragColor = vec4(fin, mask * u_alpha);
}`;var Xe={blurAmount:0,refraction:.69,chromAberration:.05,edgeHighlight:.05,specular:0,fresnel:1,distortion:0,cornerRadius:65,zRadius:40,opacity:1,saturation:0,tintStrength:0,brightness:0,shadowOpacity:.3,shadowSpread:10,shadowOffsetY:1,floating:!1,button:!1,bevelMode:0},oe=6,T=20;var le=class{constructor(){u(this,"canvas");u(this,"gl");u(this,"cropCanvas");u(this,"cropCtx");u(this,"blitP");u(this,"blitU");u(this,"blurP");u(this,"blurU");u(this,"glassP");u(this,"glassU");u(this,"quadBuf");u(this,"panelBuf");u(this,"fboCache",new Map);u(this,"activeFBOs",null);u(this,"bgTex",null);u(this,"width",0);u(this,"height",0);u(this,"contextLost",!1);u(this,"_onContextLost");u(this,"_onContextRestored");this.canvas=document.createElement("canvas"),this.canvas.style.display="none",this.cropCanvas=document.createElement("canvas"),this.cropCtx=this.cropCanvas.getContext("2d");let e=this.canvas.getContext("webgl",{alpha:!0,premultipliedAlpha:!1,antialias:!1,preserveDrawingBuffer:!0});if(!e)throw new Error("LiquidGlass: WebGL is not supported in this browser.");this.gl=e,this._initPrograms(),this._initBuffers(),this._onContextLost=n=>{n.preventDefault(),this.contextLost=!0,console.warn("LiquidGlass: WebGL context lost.")},this._onContextRestored=()=>{console.info("LiquidGlass: WebGL context restored \u2014 reinitialising."),this.contextLost=!1,this._initPrograms(),this._initBuffers();for(let n of this.fboCache.values())this._freeFBOSet(n);this.fboCache.clear(),this.activeFBOs=null,this.bgTex=null},this.canvas.addEventListener("webglcontextlost",this._onContextLost),this.canvas.addEventListener("webglcontextrestored",this._onContextRestored)}_initPrograms(){this.blitP=this._link(N,He),this.blitU=this._uloc(this.blitP,["u_tex","u_scale","u_offset"]),this.blurP=this._link(N,We),this.blurU=this._uloc(this.blurP,["u_tex","u_dir"]),this.glassP=this._link(ae,ke),this.glassU=this._uloc(this.glassP,["u_bgTex","u_blurTex","u_center","u_size","u_radius","u_res","u_pad","u_refract","u_chroma","u_edgeHL","u_spec","u_fresnel","u_distort","u_alpha","u_sat","u_tint","u_zRadius","u_brightness","u_shadowAlpha","u_shadowSpread","u_shadowOffY","u_bevelMode"])}_initBuffers(){let e=this.gl;this.quadBuf=e.createBuffer(),e.bindBuffer(e.ARRAY_BUFFER,this.quadBuf),e.bufferData(e.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),e.STATIC_DRAW),this.panelBuf=e.createBuffer(),e.bindBuffer(e.ARRAY_BUFFER,this.panelBuf),e.bufferData(e.ARRAY_BUFFER,new Float32Array([-.5,-.5,.5,-.5,-.5,.5,.5,.5]),e.STATIC_DRAW)}resize(e,n){this.width=e,this.height=n;for(let t of this.fboCache.values())this._freeFBOSet(t);this.fboCache.clear(),this.activeFBOs=null,this.canvas.width=0,this.canvas.height=0}uploadAndBlur(e,n,t,s,i,o){if(this.contextLost)return;let a=this.gl;if(!this._setActiveSize(s,i))return;let l=this.width,f=this.height,c=this.activeFBOs,d=e;(n!==0||t!==0||e.width!==l||e.height!==f)&&((this.cropCanvas.width!==l||this.cropCanvas.height!==f)&&(this.cropCanvas.width=l,this.cropCanvas.height=f),this.cropCtx.clearRect(0,0,l,f),this.cropCtx.drawImage(e,-n,-t),d=this.cropCanvas),this.bgTex||(this.bgTex=a.createTexture()),a.activeTexture(a.TEXTURE0),a.bindTexture(a.TEXTURE_2D,this.bgTex),a.pixelStorei(a.UNPACK_FLIP_Y_WEBGL,!0),a.texImage2D(a.TEXTURE_2D,0,a.RGBA,a.RGBA,a.UNSIGNED_BYTE,d),a.texParameteri(a.TEXTURE_2D,a.TEXTURE_MIN_FILTER,a.LINEAR),a.texParameteri(a.TEXTURE_2D,a.TEXTURE_MAG_FILTER,a.LINEAR),a.texParameteri(a.TEXTURE_2D,a.TEXTURE_WRAP_S,a.CLAMP_TO_EDGE),a.texParameteri(a.TEXTURE_2D,a.TEXTURE_WRAP_T,a.CLAMP_TO_EDGE),a.pixelStorei(a.UNPACK_FLIP_Y_WEBGL,!1),a.bindFramebuffer(a.FRAMEBUFFER,c.bg.fbo),a.viewport(0,0,l,f),a.useProgram(this.blitP),a.activeTexture(a.TEXTURE0),a.activeTexture(a.TEXTURE0),a.bindTexture(a.TEXTURE_2D,this.bgTex),a.uniform1i(this.blitU.u_tex,0),a.uniform2f(this.blitU.u_scale,1,1),a.uniform2f(this.blitU.u_offset,0,0),this._drawQuad(this.blitP,this.quadBuf);let g=c.blurA.w,x=c.blurA.h;if(a.bindFramebuffer(a.FRAMEBUFFER,c.blurA.fbo),a.viewport(0,0,g,x),a.bindTexture(a.TEXTURE_2D,c.bg.tex),this._drawQuad(this.blitP,this.quadBuf),o>0){let E=o*2.5;a.useProgram(this.blurP),a.uniform1i(this.blurU.u_tex,0);for(let m=0;m<oe;m++)a.bindFramebuffer(a.FRAMEBUFFER,c.blurB.fbo),a.viewport(0,0,g,x),a.bindTexture(a.TEXTURE_2D,c.blurA.tex),a.uniform2f(this.blurU.u_dir,E/g,0),this._drawQuad(this.blurP,this.quadBuf),a.bindFramebuffer(a.FRAMEBUFFER,c.blurA.fbo),a.bindTexture(a.TEXTURE_2D,c.blurB.tex),a.uniform2f(this.blurU.u_dir,0,E/x),this._drawQuad(this.blurP,this.quadBuf)}}renderGlassPanel(e,n,t,s){if(this.contextLost)return;let i=this.gl,o=this.width,a=this.height,l=this.activeFBOs;i.enable(i.BLEND),i.blendFunc(i.SRC_ALPHA,i.ONE_MINUS_SRC_ALPHA),i.useProgram(this.glassP),i.activeTexture(i.TEXTURE0),i.bindTexture(i.TEXTURE_2D,l.bg.tex),i.uniform1i(this.glassU.u_bgTex,0),i.activeTexture(i.TEXTURE1),i.bindTexture(i.TEXTURE_2D,l.blurA.tex),i.uniform1i(this.glassU.u_blurTex,1),i.bindFramebuffer(i.FRAMEBUFFER,null),i.viewport(0,this.canvas.height-a,o,a),i.uniform2f(this.glassU.u_res,o,a),i.uniform2f(this.glassU.u_center,o*.5,a*.5),i.uniform2f(this.glassU.u_size,n*s,t*s),i.uniform1f(this.glassU.u_radius,e.cornerRadius*s),i.uniform1f(this.glassU.u_pad,T*s),i.uniform1f(this.glassU.u_refract,e.refraction),i.uniform1f(this.glassU.u_chroma,e.chromAberration),i.uniform1f(this.glassU.u_edgeHL,e.edgeHighlight),i.uniform1f(this.glassU.u_spec,e.specular),i.uniform1f(this.glassU.u_fresnel,e.fresnel),i.uniform1f(this.glassU.u_distort,e.distortion),i.uniform1f(this.glassU.u_alpha,e.opacity),i.uniform1f(this.glassU.u_sat,e.saturation),i.uniform1f(this.glassU.u_tint,e.tintStrength),i.uniform1f(this.glassU.u_zRadius,e.zRadius*s),i.uniform1f(this.glassU.u_brightness,e.brightness),i.uniform1f(this.glassU.u_shadowAlpha,e.shadowOpacity),i.uniform1f(this.glassU.u_shadowSpread,e.shadowSpread*s),i.uniform1f(this.glassU.u_shadowOffY,e.shadowOffsetY*s),i.uniform1f(this.glassU.u_bevelMode,e.bevelMode),this._drawQuad(this.glassP,this.panelBuf),i.disable(i.BLEND)}clear(){let e=this.gl;e.bindFramebuffer(e.FRAMEBUFFER,null),e.viewport(0,this.canvas.height-this.height,this.width,this.height),e.enable(e.SCISSOR_TEST),e.scissor(0,this.canvas.height-this.height,this.width,this.height),e.clearColor(0,0,0,0),e.clear(e.COLOR_BUFFER_BIT),e.disable(e.SCISSOR_TEST)}destroy(){if(this.canvas.removeEventListener("webglcontextlost",this._onContextLost),this.canvas.removeEventListener("webglcontextrestored",this._onContextRestored),!this.contextLost){let e=this.gl;for(let n of this.fboCache.values())this._freeFBOSet(n);this.fboCache.clear(),this.bgTex&&e.deleteTexture(this.bgTex),e.deleteBuffer(this.quadBuf),e.deleteBuffer(this.panelBuf),e.deleteProgram(this.blitP),e.deleteProgram(this.blurP),e.deleteProgram(this.glassP)}this.canvas.remove()}_setActiveSize(e,n){if(e<=0||n<=0)return!1;this.width=e,this.height=n,(this.canvas.width!==e||this.canvas.height!==n)&&(this.canvas.width=e,this.canvas.height=n);let t=`${e}x${n}`,s=this.fboCache.get(t);if(!s){for(let i of this.fboCache.values())this._freeFBOSet(i);this.fboCache.clear(),s={bg:this._makeFBO(e,n),blurA:this._makeFBO(Math.ceil(e/2),Math.ceil(n/2)),blurB:this._makeFBO(Math.ceil(e/2),Math.ceil(n/2))},this.fboCache.set(t,s)}return this.activeFBOs=s,!0}_makeFBO(e,n){let t=this.gl,s=t.createTexture();t.bindTexture(t.TEXTURE_2D,s),t.texImage2D(t.TEXTURE_2D,0,t.RGBA,e,n,0,t.RGBA,t.UNSIGNED_BYTE,null),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MIN_FILTER,t.LINEAR),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MAG_FILTER,t.LINEAR),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_S,t.CLAMP_TO_EDGE),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_T,t.CLAMP_TO_EDGE);let i=t.createFramebuffer();return t.bindFramebuffer(t.FRAMEBUFFER,i),t.framebufferTexture2D(t.FRAMEBUFFER,t.COLOR_ATTACHMENT0,t.TEXTURE_2D,s,0),t.bindFramebuffer(t.FRAMEBUFFER,null),{fbo:i,tex:s,w:e,h:n}}_freeFBO(e){if(!e)return;let n=this.gl;n.deleteFramebuffer(e.fbo),n.deleteTexture(e.tex)}_freeFBOSet(e){this._freeFBO(e.bg),this._freeFBO(e.blurA),this._freeFBO(e.blurB)}_compile(e,n){let t=this.gl,s=t.createShader(n);return t.shaderSource(s,e),t.compileShader(s),t.getShaderParameter(s,t.COMPILE_STATUS)?s:(console.error("LiquidGlass shader compile error:",t.getShaderInfoLog(s),e),null)}_link(e,n){let t=this.gl,s=t.createProgram();return t.attachShader(s,this._compile(e,t.VERTEX_SHADER)),t.attachShader(s,this._compile(n,t.FRAGMENT_SHADER)),t.linkProgram(s),t.getProgramParameter(s,t.LINK_STATUS)||console.error("LiquidGlass program link error:",t.getProgramInfoLog(s)),s}_uloc(e,n){let t=this.gl,s={};for(let i of n)s[i]=t.getUniformLocation(e,i);return s}_drawQuad(e,n){let t=this.gl,s=t.getAttribLocation(e,"a_pos");t.bindBuffer(t.ARRAY_BUFFER,n),t.enableVertexAttribArray(s),t.vertexAttribPointer(s,2,t.FLOAT,!1,0,0),t.drawArrays(t.TRIANGLE_STRIP,0,4)}};function $e(r,e,n=()=>e.getBoundingClientRect()){let t=r.renderer,s=t.gl,i,o=null,a=null,l={},f=s.getParameter(s.MAX_TEXTURE_SIZE),c=t.uploadAndBlur.bind(t),d,g=()=>{i=void 0,o=null,a=null};t.canvas.addEventListener("webglcontextrestored",g);let x=()=>{t.canvas.removeEventListener("webglcontextrestored",g),o&&s.deleteTexture(o),a&&s.deleteProgram(a)},E=r.destroy.bind(r);return r.destroy=()=>{x(),E()},t.uploadAndBlur=(m,v,h,p,U,A)=>{if(!d)return c(m,v,h,p,U,A);if(t.contextLost||!t._setActiveSize(p,U))return;let b=t.activeFBOs;if(a||(a=t._link(N,`precision highp float;
        uniform sampler2D u_tex; uniform vec2 u_scale; uniform vec2 u_offset; varying vec2 v_uv;
        void main() { vec2 uv = v_uv * u_scale + u_offset;
          gl_FragColor = texture2D(u_tex, clamp(uv, vec2(0.0), vec2(1.0))); }`),l=t._uloc(a,["u_tex","u_scale","u_offset"])),s.bindFramebuffer(s.FRAMEBUFFER,b.bg.fbo),s.viewport(0,0,p,U),s.useProgram(a),s.activeTexture(s.TEXTURE0),s.bindTexture(s.TEXTURE_2D,o),s.uniform1i(l.u_tex,0),s.uniform2f(l.u_scale,d.w,d.h),s.uniform2f(l.u_offset,d.x,d.y),t._drawQuad(a,t.quadBuf),s.bindFramebuffer(s.FRAMEBUFFER,b.blurA.fbo),s.viewport(0,0,b.blurA.w,b.blurA.h),s.useProgram(t.blitP),s.bindTexture(s.TEXTURE_2D,b.bg.tex),s.uniform1i(t.blitU.u_tex,0),s.uniform2f(t.blitU.u_scale,1,1),s.uniform2f(t.blitU.u_offset,0,0),t._drawQuad(t.blitP,t.quadBuf),A>0){let D=A*2.5;s.useProgram(t.blurP),s.uniform1i(t.blurU.u_tex,0);for(let X=0;X<oe;X++)s.bindFramebuffer(s.FRAMEBUFFER,b.blurB.fbo),s.bindTexture(s.TEXTURE_2D,b.blurA.tex),s.uniform2f(t.blurU.u_dir,D/b.blurA.w,0),t._drawQuad(t.blurP,t.quadBuf),s.bindFramebuffer(s.FRAMEBUFFER,b.blurA.fbo),s.bindTexture(s.TEXTURE_2D,b.blurB.tex),s.uniform2f(t.blurU.u_dir,0,D/b.blurA.h),t._drawQuad(t.blurP,t.quadBuf)}},(m,v)=>{if(d=void 0,!m)return!1;let h=r.capture.cache.get(e)?.canvas;if(!h||h.width>f||h.height>f||h.width*h.height*4>64*1024*1024||t.contextLost)return!1;h!==i&&(o||(o=s.createTexture()),s.activeTexture(s.TEXTURE0),s.bindTexture(s.TEXTURE_2D,o),s.pixelStorei(s.UNPACK_FLIP_Y_WEBGL,1),s.texImage2D(s.TEXTURE_2D,0,s.RGBA,s.RGBA,s.UNSIGNED_BYTE,h),s.pixelStorei(s.UNPACK_FLIP_Y_WEBGL,0),s.texParameteri(s.TEXTURE_2D,s.TEXTURE_MIN_FILTER,s.LINEAR),s.texParameteri(s.TEXTURE_2D,s.TEXTURE_MAG_FILTER,s.LINEAR),s.texParameteri(s.TEXTURE_2D,s.TEXTURE_WRAP_S,s.CLAMP_TO_EDGE),s.texParameteri(s.TEXTURE_2D,s.TEXTURE_WRAP_T,s.CLAMP_TO_EDGE),i=h);let p=n();return d={x:(m.left-v-p.left)/p.width,y:1-(m.bottom+v-p.top)/p.height,w:(m.width+v*2)/p.width,h:(m.height+v*2)/p.height},!0}}var qe=.22,Er=Math.sqrt(Math.PI);var vt=`precision highp float;
uniform sampler2D u_bgTex, u_blurTex, u_lensMap;
uniform vec2 u_size, u_res;
uniform float u_radius, u_alpha, u_mapScale, u_mapDispersion, u_mapSpecular, u_classic, u_saturation, u_additive, u_neutral;
uniform float u_shadowAlpha, u_shadowSpread, u_shadowOffY;
varying vec2 v_localPx, v_screenUV;
float sdf(vec2 p, vec2 b, float r) {vec2 q=abs(p)-b+vec2(r);return min(max(q.x,q.y),0.0)+length(max(q,0.0))-r;}
void main(){
 float d=sdf(v_localPx,u_size*.5,min(u_radius,min(u_size.x,u_size.y)*.5));
 if(d>0.0){float s=max(sdf(v_localPx-vec2(0.0,u_shadowOffY),u_size*.5,u_radius)-1.0,0.0);
 gl_FragColor=vec4(0.0,0.0,0.0,exp(-s*s/max(1.0,u_shadowSpread*u_shadowSpread))*u_shadowAlpha);return;}
 vec2 mapUV=v_localPx/u_size+.5;
 vec3 m=texture2D(u_lensMap,mapUV).rgb;
 vec2 delta=(mix(m.rg,m.rb,u_classic)-u_neutral)*vec2(1.0,-1.0)/u_res;
 float red=mix(u_mapScale*(1.0+u_mapDispersion),u_mapScale+u_mapDispersion,u_additive);
 float green=mix(u_mapScale*(1.0+u_mapDispersion*.5),u_mapScale,u_additive);
 float blue=mix(u_mapScale,u_mapScale-u_mapDispersion,u_additive);
 if(u_additive>.5 && u_classic<.5) blue=max(0.0,blue);
 vec4 rSample=texture2D(u_blurTex,v_screenUV+delta*red);
 vec4 gSample=texture2D(u_blurTex,v_screenUV+delta*green);
 vec4 bSample=texture2D(u_blurTex,v_screenUV+delta*blue);
 vec3 col=vec3(rSample.r,gSample.g,bSample.b);
 float sourceAlpha=max(rSample.a,max(gSample.a,bSample.a));
 col=mix(vec3(dot(col,vec3(.2126,.7152,.0722))),col,u_saturation);
 col+=max(0.0,m.b-128.0/255.0)*u_mapSpecular;
 gl_FragColor=vec4(clamp(col,0.0,1.0),u_alpha*sourceAlpha*(1.0-smoothstep(-1.5,.5,d)));
}`;function ze(r,e){let n=r.renderer,t=n.gl,s=n.renderGlassPanel.bind(n),i=null,o=null,a="",l=0,f={},c={ready:!1,failed:!1,mapUploads:0,mapUrl:"",scale:0},d=()=>{i=null,o=null,a="",l++,c.ready=!1};n.canvas.addEventListener("webglcontextrestored",d);let g=r.destroy.bind(r);return r.destroy=()=>{l++,n.canvas.removeEventListener("webglcontextrestored",d),o&&t.deleteTexture(o),g()},n.renderGlassPanel=(x,E,m,v)=>{let h=e(),p=h.map;if(p!==a){a=p,c.failed=!1;let U=++l,A=new Image;A.onload=()=>{U!==l||n.contextLost||(o||(o=t.createTexture()),t.activeTexture(t.TEXTURE2),t.bindTexture(t.TEXTURE_2D,o),t.pixelStorei(t.UNPACK_FLIP_Y_WEBGL,0),t.pixelStorei(t.UNPACK_COLORSPACE_CONVERSION_WEBGL,t.NONE),t.texImage2D(t.TEXTURE_2D,0,t.RGBA,t.RGBA,t.UNSIGNED_BYTE,A),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MIN_FILTER,t.LINEAR),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MAG_FILTER,t.LINEAR),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_S,t.CLAMP_TO_EDGE),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_T,t.CLAMP_TO_EDGE),c.ready=!0,c.mapUploads++,c.mapUrl=p,r.markChanged())},A.onerror=()=>{U===l&&(c.failed=!0,r.markChanged())},A.src=p}o&&(i||(i=n._link(ae,vt),t.deleteProgram(n.glassP),n.glassP=i,n.glassU=n._uloc(i,Object.keys(n.glassU)),f=n._uloc(i,["u_lensMap","u_mapScale","u_mapDispersion","u_mapSpecular","u_classic","u_saturation","u_additive","u_neutral"])),c.scale=h.scale,t.useProgram(i),t.activeTexture(t.TEXTURE2),t.bindTexture(t.TEXTURE_2D,o),t.uniform1i(f.u_lensMap,2),t.uniform1f(f.u_mapScale,c.scale*v),t.uniform1f(f.u_mapDispersion,(h.additiveDispersion??h.classic?v:qe)*h.dispersion),t.uniform1f(f.u_mapSpecular,h.specular),t.uniform1f(f.u_classic,h.classic?1:0),t.uniform1f(f.u_saturation,h.saturation/100),t.uniform1f(f.u_additive,h.additiveDispersion??h.classic?1:0),t.uniform1f(f.u_neutral,h.neutralPoint??.5),s(x,E,m,v))},c}function Ve(r,e){if(r.match(/^[a-z]+:\/\//i))return r;if(r.match(/^\/\//))return window.location.protocol+r;if(r.match(/^[a-z]+:/i))return r;let n=document.implementation.createHTMLDocument(),t=n.createElement("base"),s=n.createElement("a");return n.head.appendChild(t),n.body.appendChild(s),e&&(t.href=e),s.href=r,s.href}var Ne=(()=>{let r=0,e=()=>`0000${(Math.random()*36**4<<0).toString(36)}`.slice(-4);return()=>(r+=1,`u${e()}${r}`)})();function y(r){let e=[];for(let n=0,t=r.length;n<t;n++)e.push(r[n]);return e}function ce(r,e){let t=(r.ownerDocument.defaultView||window).getComputedStyle(r).getPropertyValue(e);return t?parseFloat(t.replace("px","")):0}function Et(r){let e=ce(r,"border-left-width"),n=ce(r,"border-right-width");return r.clientWidth+e+n}function wt(r){let e=ce(r,"border-top-width"),n=ce(r,"border-bottom-width");return r.clientHeight+e+n}function be(r,e={}){let n=e.width||Et(r),t=e.height||wt(r);return{width:n,height:t}}function Ye(){let r,e;try{e=process}catch{}let n=e&&e.env?e.env.devicePixelRatio:null;return n&&(r=parseInt(n,10),Number.isNaN(r)&&(r=1)),r||window.devicePixelRatio||1}var R=16384;function je(r){(r.width>R||r.height>R)&&(r.width>R&&r.height>R?r.width>r.height?(r.height*=R/r.width,r.width=R):(r.width*=R/r.height,r.height=R):r.width>R?(r.height*=R/r.width,r.width=R):(r.width*=R/r.height,r.height=R))}function H(r){return new Promise((e,n)=>{let t=new Image;t.decode=()=>e(t),t.onload=()=>e(t),t.onerror=n,t.crossOrigin="anonymous",t.decoding="async",t.src=r})}async function Tt(r){return Promise.resolve().then(()=>new XMLSerializer().serializeToString(r)).then(encodeURIComponent).then(e=>`data:image/svg+xml;charset=utf-8,${e}`)}async function Qe(r,e,n){let t="http://www.w3.org/2000/svg",s=document.createElementNS(t,"svg"),i=document.createElementNS(t,"foreignObject");return s.setAttribute("width",`${e}`),s.setAttribute("height",`${n}`),s.setAttribute("viewBox",`0 0 ${e} ${n}`),i.setAttribute("width","100%"),i.setAttribute("height","100%"),i.setAttribute("x","0"),i.setAttribute("y","0"),i.setAttribute("externalResourcesRequired","true"),s.appendChild(i),i.appendChild(r),Tt(s)}var _=(r,e)=>{if(r instanceof e)return!0;let n=Object.getPrototypeOf(r);return n===null?!1:n.constructor.name===e.name||_(n,e)};function Rt(r){let e=r.getPropertyValue("content");return`${r.cssText} content: '${e.replace(/'|"/g,"")}';`}function yt(r){return y(r).map(e=>{let n=r.getPropertyValue(e),t=r.getPropertyPriority(e);return`${e}: ${n}${t?" !important":""};`}).join(" ")}function St(r,e,n){let t=`.${r}:${e}`,s=n.cssText?Rt(n):yt(n);return document.createTextNode(`${t}{${s}}`)}function Ke(r,e,n){let t=window.getComputedStyle(r,n),s=t.getPropertyValue("content");if(s===""||s==="none")return;let i=Ne();try{e.className=`${e.className} ${i}`}catch{return}let o=document.createElement("style");o.appendChild(St(i,n,t)),e.appendChild(o)}function Je(r,e){Ke(r,e,":before"),Ke(r,e,":after")}var Ze="application/font-woff",et="image/jpeg",Lt={woff:Ze,woff2:Ze,ttf:"application/font-truetype",eot:"application/vnd.ms-fontobject",png:"image/png",jpg:et,jpeg:et,gif:"image/gif",tiff:"image/tiff",svg:"image/svg+xml",webp:"image/webp"};function At(r){let e=/\.([^./]*?)$/g.exec(r);return e?e[1]:""}function W(r){let e=At(r).toLowerCase();return Lt[e]||""}function Mt(r){return r.split(/,/)[1]}function Y(r){return r.search(/^(data:)/)!==-1}function xe(r,e){return`data:${e};base64,${r}`}async function ve(r,e,n){let t=await fetch(r,e);if(t.status===404)throw new Error(`Resource "${t.url}" not found`);let s=await t.blob();return new Promise((i,o)=>{let a=new FileReader;a.onerror=o,a.onloadend=()=>{try{i(n({res:t,result:a.result}))}catch(l){o(l)}},a.readAsDataURL(s)})}var _e={};function Ct(r,e,n){let t=r.replace(/\?.*/,"");return n&&(t=r),/ttf|otf|eot|woff2?/i.test(t)&&(t=t.replace(/.*\//,"")),e?`[${e}]${t}`:t}async function k(r,e,n){let t=Ct(r,e,n.includeQueryParams);if(_e[t]!=null)return _e[t];n.cacheBust&&(r+=(/\?/.test(r)?"&":"?")+new Date().getTime());let s;try{let i=await ve(r,n.fetchRequestInit,({res:o,result:a})=>(e||(e=o.headers.get("Content-Type")||""),Mt(a)));s=xe(i,e)}catch(i){s=n.imagePlaceholder||"";let o=`Failed to fetch resource: ${r}`;i&&(o=typeof i=="string"?i:i.message),o&&console.warn(o)}return _e[t]=s,s}async function Ut(r){let e=r.toDataURL();return e==="data:,"?r.cloneNode(!1):H(e)}async function Ft(r,e){if(r.currentSrc){let i=document.createElement("canvas"),o=i.getContext("2d");i.width=r.clientWidth,i.height=r.clientHeight,o?.drawImage(r,0,0,i.width,i.height);let a=i.toDataURL();return H(a)}let n=r.poster,t=W(n),s=await k(n,t,e);return H(s)}async function Pt(r){var e;try{if(!((e=r?.contentDocument)===null||e===void 0)&&e.body)return await j(r.contentDocument.body,{},!0)}catch{}return r.cloneNode(!1)}async function Dt(r,e){return _(r,HTMLCanvasElement)?Ut(r):_(r,HTMLVideoElement)?Ft(r,e):_(r,HTMLIFrameElement)?Pt(r):r.cloneNode(!1)}var Bt=r=>r.tagName!=null&&r.tagName.toUpperCase()==="SLOT";async function Gt(r,e,n){var t,s;let i=[];return Bt(r)&&r.assignedNodes?i=y(r.assignedNodes()):_(r,HTMLIFrameElement)&&(!((t=r.contentDocument)===null||t===void 0)&&t.body)?i=y(r.contentDocument.body.childNodes):i=y(((s=r.shadowRoot)!==null&&s!==void 0?s:r).childNodes),i.length===0||_(r,HTMLVideoElement)||await i.reduce((o,a)=>o.then(()=>j(a,n)).then(l=>{l&&e.appendChild(l)}),Promise.resolve()),e}function It(r,e){let n=e.style;if(!n)return;let t=window.getComputedStyle(r);t.cssText?(n.cssText=t.cssText,n.transformOrigin=t.transformOrigin):y(t).forEach(s=>{let i=t.getPropertyValue(s);s==="font-size"&&i.endsWith("px")&&(i=`${Math.floor(parseFloat(i.substring(0,i.length-2)))-.1}px`),_(r,HTMLIFrameElement)&&s==="display"&&i==="inline"&&(i="block"),s==="d"&&e.getAttribute("d")&&(i=`path(${e.getAttribute("d")})`),n.setProperty(s,i,t.getPropertyPriority(s))})}function Ot(r,e){_(r,HTMLTextAreaElement)&&(e.innerHTML=r.value),_(r,HTMLInputElement)&&e.setAttribute("value",r.value)}function Ht(r,e){if(_(r,HTMLSelectElement)){let t=Array.from(e.children).find(s=>r.value===s.getAttribute("value"));t&&t.setAttribute("selected","")}}function Wt(r,e){return _(e,Element)&&(It(r,e),Je(r,e),Ot(r,e),Ht(r,e)),e}async function kt(r,e){let n=r.querySelectorAll?r.querySelectorAll("use"):[];if(n.length===0)return r;let t={};for(let i=0;i<n.length;i++){let a=n[i].getAttribute("xlink:href");if(a){let l=r.querySelector(a),f=document.querySelector(a);!l&&f&&!t[a]&&(t[a]=await j(f,e,!0))}}let s=Object.values(t);if(s.length){let i="http://www.w3.org/1999/xhtml",o=document.createElementNS(i,"svg");o.setAttribute("xmlns",i),o.style.position="absolute",o.style.width="0",o.style.height="0",o.style.overflow="hidden",o.style.display="none";let a=document.createElementNS(i,"defs");o.appendChild(a);for(let l=0;l<s.length;l++)a.appendChild(s[l]);r.appendChild(o)}return r}async function j(r,e,n){return!n&&e.filter&&!e.filter(r)?null:Promise.resolve(r).then(t=>Dt(t,e)).then(t=>Gt(r,t,e)).then(t=>Wt(r,t)).then(t=>kt(t,e))}var tt=/url\((['"]?)([^'"]+?)\1\)/g,Xt=/url\([^)]+\)\s*format\((["']?)([^"']+)\1\)/g,$t=/src:\s*(?:url\([^)]+\)\s*format\([^)]+\)[,;]\s*)+/g;function qt(r){let e=r.replace(/([.*+?^${}()|\[\]\/\\])/g,"\\$1");return new RegExp(`(url\\(['"]?)(${e})(['"]?\\))`,"g")}function zt(r){let e=[];return r.replace(tt,(n,t,s)=>(e.push(s),n)),e.filter(n=>!Y(n))}async function Vt(r,e,n,t,s){try{let i=n?Ve(e,n):e,o=W(e),a;if(s){let l=await s(i);a=xe(l,o)}else a=await k(i,o,t);return r.replace(qt(e),`$1${a}$3`)}catch{}return r}function Nt(r,{preferredFontFormat:e}){return e?r.replace($t,n=>{for(;;){let[t,,s]=Xt.exec(n)||[];if(!s)return"";if(s===e)return`src: ${t};`}}):r}function Ee(r){return r.search(tt)!==-1}async function ue(r,e,n){if(!Ee(r))return r;let t=Nt(r,n);return zt(t).reduce((i,o)=>i.then(a=>Vt(a,o,e,n)),Promise.resolve(t))}async function fe(r,e,n){var t;let s=(t=e.style)===null||t===void 0?void 0:t.getPropertyValue(r);if(s){let i=await ue(s,null,n);return e.style.setProperty(r,i,e.style.getPropertyPriority(r)),!0}return!1}async function Yt(r,e){await fe("background",r,e)||await fe("background-image",r,e),await fe("mask",r,e)||await fe("mask-image",r,e)}async function jt(r,e){let n=_(r,HTMLImageElement);if(!(n&&!Y(r.src))&&!(_(r,SVGImageElement)&&!Y(r.href.baseVal)))return;let t=n?r.src:r.href.baseVal,s=await k(t,W(t),e);await new Promise((i,o)=>{r.onload=i,r.onerror=o;let a=r;a.decode&&(a.decode=i),a.loading==="lazy"&&(a.loading="eager"),n?(r.srcset="",r.src=s):r.href.baseVal=s})}async function Qt(r,e){let t=y(r.childNodes).map(s=>we(s,e));await Promise.all(t).then(()=>r)}async function we(r,e){_(r,Element)&&(await Yt(r,e),await jt(r,e),await Qt(r,e))}function rt(r,e){let{style:n}=r;e.backgroundColor&&(n.backgroundColor=e.backgroundColor),e.width&&(n.width=`${e.width}px`),e.height&&(n.height=`${e.height}px`);let t=e.style;return t!=null&&Object.keys(t).forEach(s=>{n[s]=t[s]}),r}var nt={};async function st(r){let e=nt[r];if(e!=null)return e;let t=await(await fetch(r)).text();return e={url:r,cssText:t},nt[r]=e,e}async function it(r,e){let n=r.cssText,t=/url\(["']?([^"')]+)["']?\)/g,i=(n.match(/url\([^)]+\)/g)||[]).map(async o=>{let a=o.replace(t,"$1");return a.startsWith("https://")||(a=new URL(a,r.url).href),ve(a,e.fetchRequestInit,({result:l})=>(n=n.replace(o,`url(${l})`),[o,l]))});return Promise.all(i).then(()=>n)}function at(r){if(r==null)return[];let e=[],n=/(\/\*[\s\S]*?\*\/)/gi,t=r.replace(n,""),s=new RegExp("((@.*?keyframes [\\s\\S]*?){([\\s\\S]*?}\\s*?)})","gi");for(;;){let l=s.exec(t);if(l===null)break;e.push(l[0])}t=t.replace(s,"");let i=/@import[\s\S]*?url\([^)]*\)[\s\S]*?;/gi,o="((\\s*?(?:\\/\\*[\\s\\S]*?\\*\\/)?\\s*?@media[\\s\\S]*?){([\\s\\S]*?)}\\s*?})|(([\\s\\S]*?){([\\s\\S]*?)})",a=new RegExp(o,"gi");for(;;){let l=i.exec(t);if(l===null){if(l=a.exec(t),l===null)break;i.lastIndex=a.lastIndex}else a.lastIndex=i.lastIndex;e.push(l[0])}return e}async function Kt(r,e){let n=[],t=[];return r.forEach(s=>{if("cssRules"in s)try{y(s.cssRules||[]).forEach((i,o)=>{if(i.type===CSSRule.IMPORT_RULE){let a=o+1,l=i.href,f=st(l).then(c=>it(c,e)).then(c=>at(c).forEach(d=>{try{s.insertRule(d,d.startsWith("@import")?a+=1:s.cssRules.length)}catch(g){console.error("Error inserting rule from remote css",{rule:d,error:g})}})).catch(c=>{console.error("Error loading remote css",c.toString())});t.push(f)}})}catch(i){let o=r.find(a=>a.href==null)||document.styleSheets[0];s.href!=null&&t.push(st(s.href).then(a=>it(a,e)).then(a=>at(a).forEach(l=>{o.insertRule(l,s.cssRules.length)})).catch(a=>{console.error("Error loading remote stylesheet",a)})),console.error("Error inlining remote css file",i)}}),Promise.all(t).then(()=>(r.forEach(s=>{if("cssRules"in s)try{y(s.cssRules||[]).forEach(i=>{n.push(i)})}catch(i){console.error(`Error while reading CSS rules from ${s.href}`,i)}}),n))}function Jt(r){return r.filter(e=>e.type===CSSRule.FONT_FACE_RULE).filter(e=>Ee(e.style.getPropertyValue("src")))}async function Zt(r,e){if(r.ownerDocument==null)throw new Error("Provided element is not within a Document");let n=y(r.ownerDocument.styleSheets),t=await Kt(n,e);return Jt(t)}async function ot(r,e){let n=await Zt(r,e);return(await Promise.all(n.map(s=>{let i=s.parentStyleSheet?s.parentStyleSheet.href:null;return ue(s.cssText,i,e)}))).join(`
`)}async function lt(r,e){let n=e.fontEmbedCSS!=null?e.fontEmbedCSS:e.skipFonts?null:await ot(r,e);if(n){let t=document.createElement("style"),s=document.createTextNode(n);t.appendChild(s),r.firstChild?r.insertBefore(t,r.firstChild):r.appendChild(t)}}async function er(r,e={}){let{width:n,height:t}=be(r,e),s=await j(r,e,!0);return await lt(s,e),await we(s,e),rt(s,e),await Qe(s,n,t)}async function Te(r,e={}){let{width:n,height:t}=be(r,e),s=await er(r,e),i=await H(s),o=document.createElement("canvas"),a=o.getContext("2d"),l=e.pixelRatio||Ye(),f=e.canvasWidth||n,c=e.canvasHeight||t;return o.width=f*l,o.height=c*l,e.skipAutoScale||je(o),o.style.width=`${f}`,o.style.height=`${c}`,e.backgroundColor&&(a.fillStyle=e.backgroundColor,a.fillRect(0,0,o.width,o.height)),a.drawImage(i,0,0,o.width,o.height),o}var Re=null;function ct(r){let e=r.match(/font-family\s*:\s*(['"]?)([^;'"]+)\1/i);return e?e[2].trim():""}function tr(r){let e=r.match(/font-weight\s*:\s*([^;]+)/i);return e?e[1].trim():"400"}function rr(r){let e=r.match(/font-style\s*:\s*([^;]+)/i);return e?e[1].trim():"normal"}function nr(r){let e=r.match(/unicode-range\s*:\s*([^;]+)/i);if(!e)return null;let n=[];for(let t of e[1].split(",")){let i=t.trim().match(/U\+([0-9A-Fa-f]+)(?:-([0-9A-Fa-f]+))?/);if(!i)continue;let o=parseInt(i[1],16),a=i[2]?parseInt(i[2],16):o;n.push([o,a])}return n.length>0?n:null}function sr(r,e){let n=r.split(/\s+/).map(Number),t=Number(e)||400;return n.length>=2?t>=n[0]&&t<=n[1]:n[0]===t}function ir(r,e){for(let n=0;n<r.length;n++){let t=r.codePointAt(n);for(let[s,i]of e)if(t>=s&&t<=i)return!0;t>65535&&n++}return!1}function ar(r){let e=new Map,n=[];function t(s){if(s.nodeType===3){let i=s.textContent||"";if(i.trim()==="")return;let o=s.parentElement;if(!o)return;let a=getComputedStyle(o),l=a.fontWeight,f=a.fontStyle;for(let c of a.fontFamily.split(",")){let d=c.replace(/['"]/g,"").trim().toLowerCase(),g=`${d}|${l}|${f}`,x=e.get(g);x!==void 0?n[x].text+=i:(e.set(g,n.length),n.push({family:d,weight:l,style:f,text:i}))}}else if(s.nodeType===1){let i=s;for(let o=0;o<i.childNodes.length;o++)t(i.childNodes[o])}}return t(r),n}function or(r,e){let n=ar(e);return n.length===0?[]:r.filter(t=>{let s=n.filter(i=>i.family!==t.family?!1:(t.style===i.style||t.style==="normal"&&i.style==="normal")&&sr(t.weight,i.weight));return!(s.length===0||t.unicodeRanges&&!s.some(o=>o.text.length>0&&ir(o.text,t.unicodeRanges)))})}async function lr(r){try{let e=await fetch(r);if(!e.ok)return null;let n=await e.blob();return new Promise((t,s)=>{let i=new FileReader;i.onload=()=>t(i.result),i.onerror=s,i.readAsDataURL(n)})}catch{return null}}async function cr(){let r=[],e=Array.from(document.querySelectorAll('link[rel="stylesheet"]'));for(let i of e)if(i.href)try{let o=await fetch(i.href,{cache:"force-cache"});if(!o.ok)continue;let a=await o.text(),l=new CSSStyleSheet;await l.replace(a);for(let f of l.cssRules)f.type===CSSRule.FONT_FACE_RULE&&r.push(f.cssText)}catch{}for(let i of Array.from(document.styleSheets))if(!i.href)try{for(let o of Array.from(i.cssRules||[]))o.type===CSSRule.FONT_FACE_RULE&&r.push(o.cssText)}catch{}let n=new Set;if(document.fonts)for(let i of document.fonts)i.status==="loaded"&&n.add(i.family.replace(/['"]/g,"").trim().toLowerCase());let t=n.size>0?r.filter(i=>n.has(ct(i).toLowerCase())):r;return await Promise.all(t.map(async i=>{let o=/url\(\s*['"]?([^'")\s]+)['"]?\s*\)/g,a=Array.from(i.matchAll(o)),l=i;for(let f of a){let c=f[1];if(c.startsWith("data:"))continue;let d=await lr(c);d&&(l=l.replace(f[0],`url(${d})`))}return{css:l,family:ct(i).toLowerCase(),weight:tr(i),style:rr(i),unicodeRanges:nr(i)}}))}var he=class{constructor(e){u(this,"disposed",!1);u(this,"root");u(this,"cache");u(this,"dpr");u(this,"_capturing",new Set);u(this,"onCacheUpdate",null);u(this,"_fontBlocks",[]);this.root=e,this.cache=new Map,this.dpr=1}async prefetchFontEmbedCSS(){Re||(Re=cr()),this._fontBlocks=await Re}fontEmbedCSSForElement(e){return this._fontBlocks.length===0?"":or(this._fontBlocks,e).map(t=>t.css).join(`
`)}resize(e=1){this.dpr=e,this.cache.clear()}async captureElement(e,n=!1){let t=e.offsetWidth,s=e.offsetHeight,i=Math.round(t*this.dpr),o=Math.round(s*this.dpr);if(i<=0||o<=0){this.cache.delete(e);return}let a=this.cache.get(e),l=!!a&&a.canvas.width>0&&a.canvas.height>0&&Math.abs(a.w-i)<.5&&Math.abs(a.h-o)<.5;if(!(!n&&l)&&!this._capturing.has(e)&&e.tagName!=="CANVAS"){this._capturing.add(e);try{await this._captureWithHtmlToImage(e,i,o,t,s)}finally{this._capturing.delete(e)}}}drawCachedElement(e,n,t,s,i,o){let a=this.cache.get(e);return a?a.canvas.width<=0||a.canvas.height<=0?(this.cache.delete(e),!1):(n.drawImage(a.canvas,t,s,i,o),!0):!1}async captureToCanvas(e,n,t,s=null){if(n<=0||t<=0)return null;let i=s&&s.length?new Set(s):null;try{return await Te(e,{width:n,height:t,pixelRatio:this.dpr,backgroundColor:void 0,fontEmbedCSS:this.fontEmbedCSSForElement(e),filter:i?a=>!i.has(a):void 0,style:{position:"static",top:"auto",left:"auto",right:"auto",bottom:"auto",transform:"none",margin:"0"}})}catch(o){return console.warn("LiquidGlass: captureToCanvas failed for element:",e,o),null}}invalidateCache(e){this.cache.delete(e)}destroy(){this.disposed=!0,this.onCacheUpdate=null,this.cache.clear()}async _captureWithHtmlToImage(e,n,t,s,i){if(!(s<=0||i<=0||n<=0||t<=0))try{let o=await Te(e,{width:s,height:i,pixelRatio:this.dpr,style:{transform:"none",translate:"none",position:"static",margin:"0"},fontEmbedCSS:this.fontEmbedCSSForElement(e)});if(this.disposed)return;this.cache.set(e,{canvas:o,w:n,h:t}),this.onCacheUpdate?.(e)}catch(o){throw o}}};var ye=new WeakMap,Se=class{constructor(e){this.element=e;u(this,"capture");u(this,"listeners",new Set);u(this,"observer");u(this,"resize");u(this,"timer");u(this,"pending");u(this,"queued",!1);u(this,"disposed",!1);u(this,"geometry","");u(this,"onResize",()=>{let e=`${this.element.offsetWidth}:${this.element.offsetHeight}:${devicePixelRatio}`;e!==this.geometry&&(this.geometry=e,this.schedule())});u(this,"schedule",()=>{this.disposed||this.timer||(this.timer=setTimeout(()=>{this.timer=void 0,this.refresh().catch(()=>{})},120))});u(this,"refresh",()=>(this.queued=!0,this.pending?this.pending:(this.pending=(async()=>{for(await this.capture.prefetchFontEmbedCSS();this.queued&&!this.disposed;){this.queued=!1;let e=Math.max(1,this.element.offsetWidth),n=Math.max(1,this.element.offsetHeight);this.capture.dpr=Math.min(devicePixelRatio||1,2,16384/e,16384/n,Math.sqrt(16*1024*1024/(e*n))),await this.capture.captureElement(this.element,!0),this.disposed||this.listeners.forEach(t=>t())}})().catch(e=>{throw this.disposed||this.listeners.forEach(n=>n(e)),e}).finally(()=>{this.pending=void 0}),this.pending)));this.capture=new he(e),this.observer=new MutationObserver(this.schedule),this.observer.observe(e,{subtree:!0,childList:!0,characterData:!0,attributes:!0}),typeof ResizeObserver<"u"&&(this.resize=new ResizeObserver(()=>{let n=`${e.offsetWidth}:${e.offsetHeight}:${devicePixelRatio}`;n!==this.geometry&&(this.geometry=n,this.schedule())}),this.resize.observe(e)),e.addEventListener("load",this.schedule,!0),e.addEventListener("input",this.schedule,!0),e.addEventListener("change",this.schedule,!0),window.addEventListener("resize",this.onResize)}dispose(){this.disposed=!0,this.timer&&clearTimeout(this.timer),this.observer.disconnect(),this.resize?.disconnect(),this.element.removeEventListener("load",this.schedule,!0),this.element.removeEventListener("input",this.schedule,!0),this.element.removeEventListener("change",this.schedule,!0),window.removeEventListener("resize",this.onResize),this.capture.destroy()}};function ut(r,e){let n=ye.get(r);n||(n=new Se(r),ye.set(r,n)),n.listeners.add(e);let t=n;return{capture:t.capture,refresh:t.refresh,release(){t.listeners.delete(e),t.listeners.size||(t.dispose(),ye.delete(r))}}}function ft(r){let e=!1;for(let n=r;n;n=n.parentElement){let t=getComputedStyle(n);if(e&&(t.transform!=="none"||t.perspective!=="none"||t.filter!=="none"))return!1;t.position==="fixed"&&(e=!0)}return e}function ht(r,e,n,t,s){let i=new le,o=t,a=!0,l=!1,f=0,c=n instanceof HTMLVideoElement?n:void 0,d=c??(n instanceof HTMLCanvasElement?n:void 0),g=!1,x=!1,E=L=>{l||s(L)},m=d?void 0:ut(n,L=>{a=!0,L&&!m?.capture.cache.has(n)&&E("capture-failed")}),v={renderer:i,capture:m?.capture??{cache:new Map},markChanged:()=>{a=!0},destroy:()=>{i.destroy(),i.gl.getExtension("WEBGL_lose_context")?.loseContext()}},h=n.getBoundingClientRect(),p=h.top+scrollY,U=ft(n),A=ft(r),b=document.createElement("div");b.style.cssText="position:fixed;top:0;left:0;width:0;height:0;visibility:hidden;pointer-events:none",b.setAttribute("aria-hidden","true"),document.body.append(b);let D=d?void 0:$e(v,n,()=>h),X=ze(v,()=>o),M=i.canvas;M.setAttribute("aria-hidden","true"),M.dataset.liquidGlassWebgl="",M.style.cssText=`display:block;position:absolute;left:-${T}px;top:-${T}px;pointer-events:none`,e.append(M);let F=document.createElement("canvas"),C=F.getContext("2d"),Le="",Ae=-1,Me=()=>{g=!1,E("webgl-unavailable")},Ce=()=>{a=!0,E("pending")};M.addEventListener("webglcontextlost",Me),M.addEventListener("webglcontextrestored",Ce);let Q=()=>{a=!0};c?.addEventListener("seeked",Q),c?.addEventListener("loadeddata",Q);let Ue=0,$,Fe=()=>{Ue++,l||($=c.requestVideoFrameCallback(Fe))};c?.requestVideoFrameCallback&&($=c.requestVideoFrameCallback(Fe));let Pe=()=>{if(!l&&(f=requestAnimationFrame(Pe),!(document.hidden||i.contextLost||x&&!a))){x=!1;try{let L=n.getBoundingClientRect(),K=r.getBoundingClientRect(),J=scrollY,mt=Math.max(0,document.documentElement.scrollHeight-innerHeight),de=J<0||J>mt;de||(p=L.top+J),h=new DOMRect(L.left,de&&!U?p-J:L.top,L.width,L.height);let gt=de&&A?b.getBoundingClientRect().top:0,S=new DOMRect(K.left,K.top-gt,K.width,K.height),B=r.offsetWidth,G=r.offsetHeight;if(!B||!G||!h.width||!h.height)return;let w=Math.min(devicePixelRatio||1,3),De=[S.left-h.left,S.top-h.top,h.width,h.height,B,G,S.width,S.height,w].join(":"),me=d instanceof HTMLCanvasElement?d.dataset.liquidGlassRevision:void 0,Be=me!==void 0?Number(me):$!==void 0?Ue:c?.currentTime??0;if(!a&&De===Le&&Be===Ae&&(!(d instanceof HTMLCanvasElement)||me!==void 0)||c&&c.readyState<2)return;let q=d??m?.capture.cache.get(n)?.canvas;if(!q)return;let Z=Math.round((B+T*2)*w),z=Math.round((G+T*2)*w);M.style.width=`${B+T*2}px`,M.style.height=`${G+T*2}px`;let ee=S.width/B,te=S.height/G,pt=new DOMRect(S.left,S.top,S.width,S.height),Ge=ee===1&&te===1&&D?.(pt,T);if(!Ge&&D&&(ee!==1||te!==1)&&D(void 0,T),!Ge){F.width!==Z||F.height!==z?(F.width=Z,F.height=z):C.clearRect(0,0,Z,z);let re=(h.left-S.left)/ee*w+T*w,ne=(h.top-S.top)/te*w+T*w,P=h.width/ee*w,I=h.height/te*w;if(d){let se=c?.videoWidth??d.width,ie=c?.videoHeight??d.height;if(!se||!ie)return;let V=getComputedStyle(n),ge=P,pe=I;if(V.objectFit!=="fill"){let O=V.objectFit==="cover"?Math.max(P/se,I/ie):V.objectFit==="none"?w:Math.min(P/se,I/ie,V.objectFit==="scale-down"?w:1/0);ge=se*O,pe=ie*O}let Ie=V.objectPosition.split(" "),Oe=(O,bt)=>O.endsWith("%")?parseFloat(O)/100*bt:parseFloat(O)*w||0;C.save(),C.beginPath(),C.rect(re,ne,P,I),C.clip(),C.drawImage(d,re+Oe(Ie[0],P-ge),ne+Oe(Ie[1]??"50%",I-pe),ge,pe),C.restore()}else C.drawImage(q,0,ne>0?0:q.height-1,q.width,1,re,0,P,z),C.drawImage(q,re,ne,P,I)}i.uploadAndBlur(F,0,0,Z,z,Math.max(0,o.blur)/5),i.clear(),i.renderGlassPanel({...Xe,cornerRadius:o.radius,shadowOpacity:0},B,G,w),a=!1,Le=De,Ae=Be,X.failed?(E("capture-failed"),g=!1):X.ready&&!g&&(g=!0,E("active"))}catch{x=!0,a=!1,g=!1,E("capture-failed")}}};return m&&!m.capture.cache.has(n)&&m.refresh().catch(()=>{}),f=requestAnimationFrame(Pe),{update(L){o=L,a=!0},async refresh(){await m?.refresh(),a=!0},destroy(){l=!0,cancelAnimationFrame(f),M.removeEventListener("webglcontextlost",Me),M.removeEventListener("webglcontextrestored",Ce),c?.removeEventListener("seeked",Q),c?.removeEventListener("loadeddata",Q),$!==void 0&&c?.cancelVideoFrameCallback($),b.remove(),m?.release(),v.destroy(),F.width=0,F.height=0}}}function dt(r,e){return!/Android/i.test(r)&&(/iPhone|iPad|iPod/i.test(r)||/Macintosh/i.test(r)&&e>1)}function ur(r,e){return dt(r,e)||/firefox|fxios/i.test(r)?!1:/(chrome|chromium|edg|opr)\//i.test(r)}function _n(r,e,n,t,s=()=>{}){if(n.contains(r)||r.contains(n)||n.contains(e))throw new Error("WebGL backdrop must be a sibling/background, not an ancestor of the surface.");return ht(r,e,n,t,s)}export{_n as createWebGLSurface,dt as isIOSDevice,ur as supportsSvgBackdrop};
/*! Copyright (c) 2026 Sam Asante. MIT; see THIRD_PARTY_NOTICES.md. */
