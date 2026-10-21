"""
API de análise de vegetação — Equipe 11 / Challenge Motiva
─────────────────────────────────────────────────────────────
Pipeline:
  1. App envia a foto (multipart/form-data) + trecho (+ clima opcional)
  2. OpenCV segmenta o verde (HSV) e calcula a COBERTURA de vegetação
  3. Modelos XGBoost (modelo.py) estimam a ALTURA e os DIAS até o limite
     regulatório a partir de (cobertura, temperatura, chuva)
  4. A API devolve altura, risco e previsão de corte

Se os arquivos de modelo não existirem (backend/modelos/), a API cai
automaticamente na regra fixa antiga — campo `modelo` indica qual foi usado.

Rodar localmente:
    pip install -r requirements.txt
    python treinar_modelo.py          # opcional: já há modelos versionados
    uvicorn main:app --reload --host 0.0.0.0 --port 8000
"""

from datetime import datetime
from typing import Optional

import cv2
import numpy as np
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from modelo import FEATURES, carregar_modelos, classificar_risco

app = FastAPI(title="API de Análise de Vegetação — Equipe 11")

# Em produção, restrinja para o domínio/app real em vez de "*"
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

MODELO_ALTURA, MODELO_DIAS = carregar_modelos()

# Clima padrão quando o app não envia (média da região no verão)
TEMPERATURA_PADRAO_C = 27.0
CHUVA_PADRAO_MM = 20.0

TAMANHO_MAXIMO_BYTES = 10 * 1024 * 1024  # 10 MB


class ResultadoAnalise(BaseModel):
    altura_cm: float
    cobertura_percentual: int
    risco: str
    previsao_dias_proximo_corte: int
    local: str
    analisado_em: str
    modelo: str


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
    return round((pixels_verdes / total_pixels) * 100)


def mapear_cobertura_para_altura(cobertura: int) -> tuple[float, str, int]:
    """Regra fixa — usada apenas como plano B quando os modelos XGBoost não existem."""
    if cobertura >= 55:
        return round(16 + (cobertura - 55) * 0.2, 1), "alto", 0
    if cobertura >= 30:
        return round(8 + (cobertura - 30) * 0.36, 1), "medio", 4
    return round(2 + cobertura * 0.2, 1), "baixo", 12


def prever(cobertura: int, temperatura_c: float, chuva_mm: float) -> tuple[float, str, int, str]:
    """Devolve (altura_cm, risco, dias_ate_corte, nome_do_modelo)."""
    if MODELO_ALTURA is None or MODELO_DIAS is None:
        altura, risco, dias = mapear_cobertura_para_altura(cobertura)
        return altura, risco, dias, "regra"

    entrada = np.array([[cobertura, temperatura_c, chuva_mm]], dtype=np.float32)
    assert entrada.shape[1] == len(FEATURES)
    altura = float(np.clip(MODELO_ALTURA.predict(entrada)[0], 0.5, 40))
    dias = int(round(float(np.clip(MODELO_DIAS.predict(entrada)[0], 0, 30))))
    altura = round(altura, 1)
    return altura, classificar_risco(altura), dias, "xgboost"


@app.get("/")
def status():
    return {
        "status": "ok",
        "servico": "API de Análise de Vegetação — Equipe 11",
        "modelo": "xgboost" if MODELO_ALTURA is not None else "regra",
    }


@app.post("/analisar", response_model=ResultadoAnalise)
async def analisar(
    foto: UploadFile = File(...),
    local: str = Form(...),
    temperatura_c: Optional[float] = Form(None),
    chuva_mm: Optional[float] = Form(None),
):
    conteudo = await foto.read(TAMANHO_MAXIMO_BYTES + 1)
    if len(conteudo) > TAMANHO_MAXIMO_BYTES:
        raise HTTPException(status_code=413, detail="Imagem acima de 10 MB.")

    imagem = cv2.imdecode(np.frombuffer(conteudo, dtype=np.uint8), cv2.IMREAD_COLOR)
    if imagem is None:
        # Antes devolvia zeros com HTTP 200, o que gravava uma ocorrência falsa.
        # Com 422 o app percebe a falha e usa o fallback.
        raise HTTPException(status_code=422, detail="Arquivo não é uma imagem válida.")

    cobertura = estimar_cobertura_verde(imagem)
    altura, risco, dias, modelo = prever(
        cobertura,
        temperatura_c if temperatura_c is not None else TEMPERATURA_PADRAO_C,
        chuva_mm if chuva_mm is not None else CHUVA_PADRAO_MM,
    )

    return {
        "altura_cm": altura,
        "cobertura_percentual": cobertura,
        "risco": risco,
        "previsao_dias_proximo_corte": dias,
        "local": local,
        "analisado_em": datetime.now().isoformat(),
        "modelo": modelo,
    }
