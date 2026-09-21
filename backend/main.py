"""
API de análise de vegetação — Equipe 11 / Challenge Motiva
─────────────────────────────────────────────────────────────
Recebe uma foto (multipart/form-data) do app, roda uma segmentação
de cor com OpenCV para estimar a cobertura de vegetação, e devolve
uma altura estimada + classificação de risco.

Este é o ponto de partida: a segmentação de cor aqui é um substituto
razoável e explicável para o vídeo de demonstração. A evolução natural
é treinar o modelo XGBoost citado no desafio com um dataset real de
(cobertura, chuva, temperatura) -> altura, e plugar a previsão aqui.

Rodar localmente:
    pip install -r requirements.txt
    uvicorn main:app --reload --host 0.0.0.0 --port 8000

O app (Expo) deve apontar EXPO_PUBLIC_API_URL para o IP da sua
máquina na rede local (não "localhost"), por exemplo:
    EXPO_PUBLIC_API_URL=http://192.168.0.10:8000
"""

from datetime import datetime

import cv2
import numpy as np
from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="API de Análise de Vegetação — Equipe 11")

# Em produção, restrinja para o domínio/app real em vez de "*"
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class ResultadoAnalise(BaseModel):
    altura_cm: float
    cobertura_percentual: int
    risco: str
    previsao_dias_proximo_corte: int
    local: str
    analisado_em: str


def estimar_cobertura_verde(imagem_bgr: np.ndarray) -> int:
    """
    Segmentação por cor em HSV: isola pixels de vegetação (tons de verde)
    e calcula a porcentagem da imagem coberta por eles.
    """
    hsv = cv2.cvtColor(imagem_bgr, cv2.COLOR_BGR2HSV)

    # Faixa de matiz do verde em HSV (OpenCV usa H de 0-179)
    verde_baixo = np.array([35, 40, 40])
    verde_alto = np.array([85, 255, 255])
    mascara = cv2.inRange(hsv, verde_baixo, verde_alto)

    total_pixels = mascara.shape[0] * mascara.shape[1]
    pixels_verdes = int(np.count_nonzero(mascara))
    cobertura = round((pixels_verdes / total_pixels) * 100)
    return cobertura


def mapear_cobertura_para_altura(cobertura: int) -> tuple[float, str, int]:
    """
    Regra de mapeamento cobertura -> altura/risco.
    Provisório: no pipeline final, isso vira uma chamada ao XGBoost
    treinado com dados reais de altura x cobertura x clima.
    """
    if cobertura >= 55:
        altura = round(16 + (cobertura - 55) * 0.2, 1)
        return altura, "alto", 0
    elif cobertura >= 30:
        altura = round(8 + (cobertura - 30) * 0.36, 1)
        return altura, "medio", 4
    else:
        altura = round(2 + cobertura * 0.2, 1)
        return altura, "baixo", 12


@app.get("/")
def status():
    return {"status": "ok", "servico": "API de Análise de Vegetação — Equipe 11"}


@app.post("/analisar", response_model=ResultadoAnalise)
async def analisar(foto: UploadFile = File(...), local: str = Form(...)):
    conteudo = await foto.read()
    array_np = np.frombuffer(conteudo, dtype=np.uint8)
    imagem = cv2.imdecode(array_np, cv2.IMREAD_COLOR)

    if imagem is None:
        return {
            "altura_cm": 0,
            "cobertura_percentual": 0,
            "risco": "baixo",
            "previsao_dias_proximo_corte": 0,
            "local": local,
            "analisado_em": datetime.now().isoformat(),
        }

    cobertura = estimar_cobertura_verde(imagem)
    altura, risco, dias = mapear_cobertura_para_altura(cobertura)

    return {
        "altura_cm": altura,
        "cobertura_percentual": cobertura,
        "risco": risco,
        "previsao_dias_proximo_corte": dias,
        "local": local,
        "analisado_em": datetime.now().isoformat(),
    }
