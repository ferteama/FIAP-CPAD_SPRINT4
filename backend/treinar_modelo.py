"""
Treina os modelos XGBoost e salva em backend/modelos/.

    python treinar_modelo.py

Imprime as métricas em um conjunto de teste separado (20%).
"""

import json

import numpy as np
import xgboost as xgb
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.model_selection import train_test_split

from modelo import ARQ_ALTURA, ARQ_DIAS, FEATURES, PASTA_MODELOS, gerar_dataset


def treinar(X_tr, y_tr):
    modelo = xgb.XGBRegressor(
        n_estimators=250,
        max_depth=4,
        learning_rate=0.08,
        subsample=0.9,
        colsample_bytree=0.9,
        random_state=42,
    )
    modelo.fit(X_tr, y_tr)
    return modelo


def main():
    PASTA_MODELOS.mkdir(exist_ok=True)
    X, y_altura, y_dias = gerar_dataset()
    X_tr, X_te, ya_tr, ya_te, yd_tr, yd_te = train_test_split(
        X, y_altura, y_dias, test_size=0.2, random_state=42
    )

    m_altura = treinar(X_tr, ya_tr)
    m_dias = treinar(X_tr, yd_tr)
    m_altura.save_model(str(ARQ_ALTURA))
    m_dias.save_model(str(ARQ_DIAS))

    metricas = {
        "dataset": "sintético (6000 amostras, 80/20)",
        "features": FEATURES,
        "altura_cm": {
            "MAE": round(float(mean_absolute_error(ya_te, m_altura.predict(X_te))), 3),
            "R2": round(float(r2_score(ya_te, m_altura.predict(X_te))), 3),
        },
        "dias_ate_limite": {
            "MAE": round(float(mean_absolute_error(yd_te, m_dias.predict(X_te))), 3),
            "R2": round(float(r2_score(yd_te, m_dias.predict(X_te))), 3),
        },
    }
    (PASTA_MODELOS / "metricas.json").write_text(json.dumps(metricas, indent=2, ensure_ascii=False))
    print(json.dumps(metricas, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
