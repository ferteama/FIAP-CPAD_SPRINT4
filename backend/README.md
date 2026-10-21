# API de Análise de Vegetação

Backend em Python (FastAPI) que recebe uma foto do app e devolve a altura
estimada da vegetação, o risco e a previsão de corte:

1. **OpenCV** segmenta o verde (HSV) e mede a cobertura de vegetação.
2. **XGBoost** (`modelo.py`) estima a altura e os dias até o limite de 10 cm a
   partir de (cobertura, temperatura, chuva dos últimos 7 dias).

A resposta inclui o campo `modelo` (`"xgboost"` ou `"regra"`, se os arquivos de
modelo não existirem). Imagem inválida devolve **HTTP 422** (o app então usa o
*fallback* offline em vez de gravar um registro zerado).

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

## Modelo XGBoost

Os modelos treinados ficam em `modelos/` (`altura.json`, `dias_ate_limite.json`,
`metricas.json`) e são carregados na inicialização.

```bash
python treinar_modelo.py   # re-treina e imprime as métricas
```

> **Dados sintéticos.** Não há histórico real de medições da Motiva. `gerar_dataset()`
> (em `modelo.py`) simula uma dinâmica plausível de crescimento. As métricas medem o ajuste
> a esse gerador — **não** a precisão em campo. Para usar dados reais, troque `gerar_dataset()`
> pelo carregamento de um CSV com as colunas `cobertura_pct, temperatura_c, chuva_mm_7d` e as
> alturas medidas, e rode `python treinar_modelo.py`.

Parâmetros opcionais do `POST /analisar`: `temperatura_c` e `chuva_mm`
(padrões: 27 °C e 20 mm).

## Testes

```bash
pip install pytest httpx
pytest -q
```
