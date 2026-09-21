# API de Análise de Vegetação

Backend em Python (FastAPI) que recebe uma foto do app e devolve a altura
estimada da vegetação, usando segmentação de cor com OpenCV.

## Rodar localmente

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Teste rápido:

```bash
curl http://localhost:8000/
```

## Testar o endpoint de análise

```bash
curl -X POST http://localhost:8000/analisar \
  -F "foto=@caminho/para/imagem.jpg" \
  -F "local=KM 42"
```

## Conectar o app Expo a este servidor

1. Descubra o IP da sua máquina na rede local (`ipconfig` no Windows, `ifconfig`
   ou `ip a` no Mac/Linux) — algo como `192.168.0.10`.
2. No app, copie `.env.example` para `.env` e defina:
   ```
   EXPO_PUBLIC_API_URL=http://192.168.0.10:8000
   ```
3. **`localhost` não funciona** do celular/emulador para o seu PC — sempre use
   o IP da rede local em desenvolvimento.

## Deploy (para não depender do seu Wi-Fi na gravação/entrega)

Qualquer serviço que rode um Dockerfile ou detecte `requirements.txt` funciona.
Duas opções gratuitas simples:

- **Render** (render.com): New → Web Service → aponte para a pasta `backend/`,
  build command `pip install -r requirements.txt`, start command
  `uvicorn main:app --host 0.0.0.0 --port $PORT`.
- **Railway** (railway.app): New Project → Deploy from GitHub → aponte para
  este repositório, ele detecta o `requirements.txt` automaticamente.

Depois do deploy, troque `EXPO_PUBLIC_API_URL` no `.env` do app pela URL pública
gerada (ex: `https://sua-api.onrender.com`).

## Próximo passo (pós-Sprint)

A função `mapear_cobertura_para_altura` em `main.py` usa uma regra fixa.
O passo seguinte é treinar o modelo XGBoost citado no desafio com dados reais
de (cobertura de imagem, chuva, temperatura) → altura real medida, e substituir
essa função por `modelo.predict(...)`.
