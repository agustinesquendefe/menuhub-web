#!/bin/bash

# Script para iniciar ngrok y actualizar .env automáticamente
# Uso: ./start-ngrok.sh

echo "🚀 Iniciando ngrok en puerto 3000..."
echo ""
echo "IMPORTANTE: Mantén esta terminal abierta"
echo "Abre otra terminal y corre: pnpm dev"
echo ""

# Inicia ngrok y captura la salida
ngrok http 3000 --log=stdout |
while IFS= read -r line; do
    echo "$line"
    
    # Busca la URL de ngrok en la salida
    if [[ $line =~ Forwarding.*https://([a-z0-9]+\.ngrok\.io) ]]; then
        NGROK_URL="https://${BASH_REMATCH[1]}"
        echo ""
        echo "✅ ngrok URL: $NGROK_URL"
        echo ""
        echo "📝 Actualizando .env..."
        
        # Actualiza el .env
        if grep -q "^BASE_URL=" .env; then
            sed -i.bak "s|^BASE_URL=.*|BASE_URL=$NGROK_URL|" .env
            echo "✅ .env actualizado con: BASE_URL=$NGROK_URL"
        else
            echo "BASE_URL=$NGROK_URL" >> .env
            echo "✅ BASE_URL añadido al .env"
        fi
        
        echo ""
        echo "🎉 Listo! Usa: $NGROK_URL en tu navegador"
    fi
done
