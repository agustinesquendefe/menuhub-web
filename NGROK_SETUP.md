# Setup ngrok para Desarrollo Local con Stripe Connect

## El Problema
Stripe Connect requiere URLs públicas válidas. `localhost:3000` no funciona porque no es una URL válida en internet.

## Solución: Usar ngrok

ngrok expone tu servidor local a través de una URL pública segura.

### Pasos:

#### 1. Crea una cuenta ngrok (una sola vez)
```bash
# Ve a https://ngrok.com y crea una cuenta gratuita
# Luego autoriza en tu máquina:
ngrok config add-authtoken <TU_TOKEN_AQUI>
```

#### 2. Inicia ngrok (antes de correr tu app Next.js)
```bash
ngrok http 3000
```

Verás algo como:
```
Forwarding   https://abc123def456.ngrok.io -> http://localhost:3000
```

#### 3. Actualiza tu `.env` con la URL de ngrok
```env
BASE_URL=https://abc123def456.ngrok.io
```

#### 4. Inicia tu servidor Next.js en otra terminal
```bash
npm run dev
# o
pnpm dev
```

#### 5. Usa la app normalmente
- Ve a `https://abc123def456.ngrok.io/sign-up`
- Completa el checkout
- Stripe Connect ahora funcionará correctamente

### Notas Importantes:

- **ngrok genera una URL diferente cada vez** que la reinicialices
- Necesitas actualizar `BASE_URL` en `.env` cada vez que reinicies ngrok
- Para desarrollo rápido, mantén ngrok corriendo en una terminal separada
- Los webhooks de Stripe funcionarán correctamente con la URL de ngrok

### Para producción:
En producción (cuando tengas un dominio), simplemente actualiza `BASE_URL` a tu dominio real.

## Alternativa: Usar un túnel permanente
Si quieres mantener la misma URL:

```bash
# Necesita cuenta pro, pero puedes usar un custom domain
ngrok http --domain=tu-dominio-personalizado.ngrok.io 3000
```

---

## Flujo de desarrollo recomendado:

**Terminal 1: ngrok**
```bash
ngrok http 3000
```

**Terminal 2: Servidor Next.js**
```bash
pnpm dev
```

**Luego:**
1. Copia la URL que genera ngrok
2. Actualiza `.env` (si cambió)
3. Usa la app en `https://tu-url-ngrok.io`
