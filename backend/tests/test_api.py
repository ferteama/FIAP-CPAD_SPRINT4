"""Testes da API. Rodar dentro de backend/:  pytest -q"""

import io
import sys
from pathlib import Path

import cv2
import numpy as np
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import main  # noqa: E402

client = TestClient(main.app)


def imagem_jpg(verde_pct: int) -> bytes:
    """Imagem 100x100 com `verde_pct`% das linhas em verde e o resto em marrom."""
    img = np.zeros((100, 100, 3), dtype=np.uint8)
    img[:] = (30, 60, 110)  # marrom (BGR)
    linhas_verdes = verde_pct
    img[:linhas_verdes, :] = (40, 170, 60)  # verde (BGR)
    ok, buf = cv2.imencode(".jpg", img)
    assert ok
    return buf.tobytes()


def enviar(conteudo: bytes, **extras):
    return client.post(
        "/analisar",
        files={"foto": ("v.jpg", io.BytesIO(conteudo), "image/jpeg")},
        data={"local": "KM 42 — Norte", **extras},
    )


def test_status_informa_modelo():
    r = client.get("/")
    assert r.status_code == 200
    assert r.json()["modelo"] in ("xgboost", "regra")


def test_cobertura_proxima_do_real():
    r = enviar(imagem_jpg(60))
    assert r.status_code == 200
    assert 55 <= r.json()["cobertura_percentual"] <= 65


def test_mais_vegetacao_gera_altura_maior_e_risco_pior():
    pouca = enviar(imagem_jpg(5)).json()
    muita = enviar(imagem_jpg(90)).json()
    assert muita["altura_cm"] > pouca["altura_cm"]
    assert pouca["risco"] == "baixo"
    assert muita["risco"] == "alto"


def test_clima_quente_e_chuvoso_aumenta_a_altura_prevista():
    if main.MODELO_ALTURA is None:
        return  # regra fixa não usa clima
    seco = enviar(imagem_jpg(50), temperatura_c="16", chuva_mm="0").json()
    umido = enviar(imagem_jpg(50), temperatura_c="35", chuva_mm="100").json()
    assert umido["altura_cm"] > seco["altura_cm"]


def test_resposta_tem_o_contrato_esperado_pelo_app():
    r = enviar(imagem_jpg(40)).json()
    for campo in ("altura_cm", "cobertura_percentual", "risco", "previsao_dias_proximo_corte", "local", "modelo"):
        assert campo in r
    assert r["risco"] in ("baixo", "medio", "alto")
    assert r["previsao_dias_proximo_corte"] >= 0


def test_arquivo_que_nao_e_imagem_retorna_422_e_nao_zeros():
    r = enviar(b"isto nao e uma imagem")
    assert r.status_code == 422


def test_local_ausente_retorna_422():
    r = client.post("/analisar", files={"foto": ("v.jpg", io.BytesIO(imagem_jpg(40)), "image/jpeg")})
    assert r.status_code == 422
