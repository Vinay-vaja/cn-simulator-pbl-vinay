# PBL-8: Web Performance Optimization Simulator
### College Admission Portal High-Throughput Scalability Engine

An interactive, single-page web simulation platform demonstrating performance optimization techniques for high-concurrency college admission websites.

## 🚀 Live Demo
- **URL**: `https://cn-simulator-pbl-vinay.vercel.app`

## 📚 PBL-8 Core Learning Pillars
1. **Persistent HTTP**: HTTP/1.0 non-persistent handshake cost vs HTTP/2 single-connection multiplexing.
2. **Web Caching**: Multi-tier browser caching (`Cache-Control: immutable`), Edge CDN offloading, and conditional validation (`ETag` / `304 Not Modified`).
3. **Reverse Proxy Servers**: Nginx load balancing, SSL/TLS offloading, and worker connection pools.
4. **Cookies & Session Security**: Static cookie-free asset domains (`static.college-cdn.com`) and secure lightweight JWT state management.
5. **Efficient Client-Server Communication**: Dynamic Brotli/Gzip compression, JavaScript bundling, and asset minification.

## 🛠️ Tech Stack
- Pure HTML5, Modern CSS3 (Dark Glassmorphism with Pitch-Black & Gold Theme)
- Vanilla ES6+ JavaScript
- Chart.js for real-time stress testing response curves
- Canvas API for animated network packet flow

## 📦 Local Run
```bash
python -m http.server 8080
# Open http://localhost:8080
```

## 🚢 Deploy to Vercel
```bash
npx vercel --prod
```
