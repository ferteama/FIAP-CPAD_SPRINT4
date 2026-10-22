"""
Modelo de previsão de crescimento — Equipe 11 / Challenge Motiva
─────────────────────────────────────────────────────────────
Dois regressores XGBoost:
  • altura_cm      : altura estimada da vegetação
  • dias_ate_limite: dias até a vegetação atingir o limite regulatório (10 cm)

Entradas: cobertura de vegetação (% da imagem, via OpenCV), temperatura (°C)
e chuva acumulada nos últimos 7 dias (mm).

ATENÇÃO — dados sintéticos: O dataset usa do treino (treinar_modelo.py) que é gerado a partir de
uma dinâmica de crescimento plausível (mais calor e chuva = crescimento mais
rápido). Quando houver dados reais, basta trocar a função `gerar_dataset`
pelo carregamento do CSV e re-treinar — o restante do pipeline não muda.
"""

from pathlib import Path

import numpy as np

LIMITE_CM = 10.0
PASTA_MODELOS = Path(__file__).parent / "modelos"
ARQ_ALTURA = PASTA_MODELOS / "altura.json"
ARQ_DIAS = PASTA_MODELOS / "dias_ate_limite.json"

FEATURES = ["cobertura_pct", "temperatura_c", "chuva_mm_7d"]


def taxa_crescimento_cm_dia(temperatura_c, chuva_mm):
    """Dinâmica usada para gerar o dataset sintético (cm/dia)."""
    return np.clip(0.10 + 0.012 * (temperatura_c - 15) + 0.004 * chuva_mm, 0.05, 1.2)


def gerar_dataset(n=6000, semente=42):
    rng = np.random.default_rng(semente)
    cobertura = rng.uniform(0, 100, n)
    temperatura = rng.uniform(15, 38, n)
    chuva = rng.gamma(shape=1.6, scale=14, size=n).clip(0, 140)

    taxa = taxa_crescimento_cm_dia(temperatura, chuva)
    # Quanto mais cobertura, mais alta a vegetação; clima acelera o crescimento
    altura = 0.8 + 0.24 * cobertura + 3.0 * (taxa - 0.3) + rng.normal(0, 0.8, n)
    altura = np.clip(altura, 1.0, 35.0)
    dias = np.where(altura >= LIMITE_CM, 0.0, (LIMITE_CM - altura) / taxa)
    dias = np.clip(dias + rng.normal(0, 0.6, n), 0, 30)

    X = np.column_stack([cobertura, temperatura, chuva])
    return X, altura, dias


def carregar_modelos():
    """Carrega os modelos treinados; devolve (None, None) se ainda não existirem."""
    if not (ARQ_ALTURA.exists() and ARQ_DIAS.exists()):
        return None, None
    import xgboost as xgb

    m_altura = xgb.XGBRegressor()
    m_altura.load_model(str(ARQ_ALTURA))
    m_dias = xgb.XGBRegressor()
    m_dias.load_model(str(ARQ_DIAS))
    return m_altura, m_dias


def classificar_risco(altura_cm: float) -> str:
    if altura_cm >= 14:
        return "alto"
    if altura_cm >= 8:
        return "medio"
    return "baixo"
