import math

# ============================================================
# fase2.py - Controle de temperatura com controlador Fuzzy PD
# ============================================================
#
# Esta fase estende a "fase1.py":
#  - modelo térmico discreto do data center
#  - controlador fuzzy PD (entradas: erro e derivada do erro)
#  - simulação de 24h com perfis de Text e Qest
#  - cálculo de métricas básicas de desempenho
#
# O objetivo é manter a temperatura em torno de 22 °C (setpoint)
# atuando sobre a variável de controle PCRAC (% da capacidade do ar-condicionado).
# ------------------------------------------------------------


# ---------------------------
# Funções de pertinência
# ---------------------------

def trimf(x, a, b, c):
    """Função de pertinência triangular."""
    if x <= a or x >= c:
        return 0.0
    if x == b:
        return 1.0
    if a < x < b:
        return (x - a) / float(b - a)
    if b < x < c:
        return (c - x) / float(c - b)
    return 0.0


def trapmf(x, a, b, c, d):
    """Função de pertinência trapezoidal."""
    if x <= a or x >= d:
        return 0.0
    if b <= x <= c:
        return 1.0
    if a < x < b:
        return (x - a) / float(b - a)
    if c < x < d:
        return (d - x) / float(d - c)
    return 0.0


# ---------------------------
# Universo e conjuntos fuzzy
# ---------------------------

# Universo das variáveis (apenas para referência/documentação)
RANGES = {
    "e": (-15.0, 15.0),        # erro (°C)
    "de": (-10.0, 10.0),       # derivada do erro (°C/min)
    "Text": (10.0, 35.0),      # temperatura externa (°C)
    "Qest": (0.0, 100.0),      # carga térmica estimada (%)
    "PCRAC": (0.0, 100.0)      # saída: potência do ar-condicionado (%)
}

# Termos linguísticos para erro e derivada:
E_TERMS = ["NG", "NP", "ZO", "PP", "PG"]  # Negativo Grande / Pequeno / Zero / Positivo Pequeno / Grande

# Termos linguísticos para a saída PCRAC:
OUT_TERMS = ["MUITO_BAIXA", "BAIXA", "MEDIA", "ALTA", "MUITO_ALTA"]


def fuzzify_e(e):
    """Calcula μ para cada termo linguístico do erro e."""
    return {
        "NG": trimf(e, -15.0, -15.0, -5.0),
        "NP": trimf(e, -10.0, -5.0, 0.0),
        "ZO": trimf(e, -2.0, 0.0, 2.0),
        "PP": trimf(e, 0.0, 5.0, 10.0),
        "PG": trimf(e, 5.0, 15.0, 15.0),
    }


def fuzzify_de(de):
    """Calcula μ para cada termo linguístico da derivada do erro de."""
    return {
        "NG": trimf(de, -10.0, -10.0, -4.0),
        "NP": trimf(de, -6.0, -3.0, 0.0),
        "ZO": trimf(de, -1.0, 0.0, 1.0),
        "PP": trimf(de, 0.0, 3.0, 6.0),
        "PG": trimf(de, 4.0, 10.0, 10.0),
    }


def mu_out(term, p):
    """Função de pertinência dos termos de saída (PCRAC)."""
    if term == "MUITO_BAIXA":
        return trapmf(p, 0.0, 0.0, 10.0, 25.0)
    if term == "BAIXA":
        return trimf(p, 10.0, 25.0, 40.0)
    if term == "MEDIA":
        return trimf(p, 30.0, 50.0, 70.0)
    if term == "ALTA":
        return trimf(p, 60.0, 75.0, 90.0)
    if term == "MUITO_ALTA":
        return trapmf(p, 80.0, 90.0, 100.0, 100.0)
    return 0.0


# ---------------------------
# Base de regras PD (e, de)
# ---------------------------
#
# Matriz 5x5: linhas = e (NG..PG), colunas = de (NG..PG)
# Cada célula indica o termo linguístico da saída PCRAC.

RULE_TABLE = [
    # de:      NG           NP          ZO          PP          PG
    ["MUITO_BAIXA", "MUITO_BAIXA", "BAIXA",      "MEDIA",      "ALTA"],        # e = NG (sala muito fria)
    ["MUITO_BAIXA", "BAIXA",       "BAIXA",      "MEDIA",      "ALTA"],        # e = NP
    ["BAIXA",       "BAIXA",       "MEDIA",      "ALTA",       "ALTA"],        # e = ZO
    ["BAIXA",       "MEDIA",       "ALTA",       "MUITO_ALTA", "MUITO_ALTA"],  # e = PP
    ["MEDIA",       "ALTA",        "ALTA",       "MUITO_ALTA", "MUITO_ALTA"],  # e = PG (sala muito quente)
]

DE_TERMS = E_TERMS  # mesma ordenação


def controlador_fuzzy_pd(e, de, passos_saida=101):
    """
    Controlador fuzzy PD:
      entradas: erro (e) e derivada do erro (de)
      saída   : PCRAC (%) via defuzzificação (método do centroide)
    """
    # Fuzzificação
    mu_e = fuzzify_e(e)
    mu_de = fuzzify_de(de)

    # Agregação das regras (Mamdani - max/min)
    out_agg = {term: 0.0 for term in OUT_TERMS}

    for i, e_term in enumerate(E_TERMS):
        for j, de_term in enumerate(DE_TERMS):
            w = min(mu_e[e_term], mu_de[de_term])
            if w <= 0.0:
                continue
            out_term = RULE_TABLE[i][j]
            if w > out_agg[out_term]:
                out_agg[out_term] = w

    # Defuzzificação: centroide no universo [0, 100] %
    num = 0.0
    den = 0.0
    p_min, p_max = RANGES["PCRAC"]
    step = (p_max - p_min) / float(passos_saida - 1)

    for k in range(passos_saida):
        p = p_min + k * step
        # μ agregado na saída: max(min(μ_out, μ_regra))
        mu_p = 0.0
        for term, alpha in out_agg.items():
            if alpha <= 0.0:
                continue
            mu_term = mu_out(term, p)
            mu_p = max(mu_p, min(alpha, mu_term))
        num += p * mu_p
        den += mu_p

    if den == 0.0:
        return 50.0  # neutro se não houver ativação
    return num / den


# ---------------------------
# Modelo térmico discreto
# ---------------------------

def perfil_temperatura_externa(minuto):
    """
    Perfil simples de temperatura externa ao longo de 24h.
    Retorna Text em °C.
    """
    hora = (minuto / 60.0) % 24.0

    if 0 <= hora < 6:
        return 20.0
    elif 6 <= hora < 12:
        # manhã esquentando
        return 20.0 + (hora - 6.0) * 2.0   # de 20 -> 32
    elif 12 <= hora < 18:
        # tarde quente
        return 32.0
    elif 18 <= hora < 22:
        # começo da noite esfriando
        return 32.0 - (hora - 18.0) * 3.0  # 32 -> 20
    else:
        # madrugada mais fresca
        return 20.0


def perfil_carga_termica(minuto):
    """
    Perfil simplificado de carga térmica Qest (%) ao longo do dia.
    """
    hora = (minuto / 60.0) % 24.0

    if 0 <= hora < 8:
        return 20.0   # madrugada
    elif 8 <= hora < 18:
        return 80.0   # horário de pico de uso
    elif 18 <= hora < 22:
        return 50.0   # início da noite
    else:
        return 30.0   # noite mais tranquila


def proxima_temperatura(T_atual, PCRAC, Text, Qest):
    """
    Modelo térmico discreto baseado no enunciado / fase1.
    T[n+1] = 0.9*T[n] - 0.08*PCRAC + 0.05*Qest + 0.02*Text + 3.5
    """
    return (
        0.9 * T_atual
        - 0.08 * PCRAC
        + 0.05 * Qest
        + 0.02 * Text
        + 3.5
    )


# ---------------------------
# Simulação completa
# ---------------------------

def simular_24h(
    T_inicial=22.0,
    setpoint=22.0,
    minutos=24 * 60
):
    """
    Simula 24h de operação do controlador fuzzy PD.
    Retorna um dicionário com as métricas e o histórico.
    """
    T = T_inicial
    e_prev = 0.0

    historico = []

    soma_erro2 = 0.0
    tempo_faixa_conforto = 0
    consumo_total = 0.0
    violacoes = 0

    for minuto in range(minutos):
        Text = perfil_temperatura_externa(minuto)
        Qest = perfil_carga_termica(minuto)

        e = T - setpoint
        de = e - e_prev

        PCRAC = controlador_fuzzy_pd(e, de)

        T_prox = proxima_temperatura(T, PCRAC, Text, Qest)

        # Atualiza métricas
        soma_erro2 += (T - setpoint) ** 2
        if 20.0 <= T <= 24.0:
            tempo_faixa_conforto += 1
        if T < 18.0 or T > 26.0:
            violacoes += 1
        consumo_total += PCRAC

        historico.append({
            "minuto": minuto,
            "T": T,
            "Text": Text,
            "Qest": Qest,
            "e": e,
            "de": de,
            "PCRAC": PCRAC,
        })

        T = T_prox
        e_prev = e

        # Logs de hora em hora para não poluir a saída
        if minuto % 60 == 0:
            hora = minuto // 60
            print(
                f"[h={hora:02d}] T={T:.2f} °C, Text={Text:.1f} °C, "
                f"Qest={Qest:.1f} %, PCRAC={PCRAC:.1f} %"
            )

    rmse = math.sqrt(soma_erro2 / minutos)
    perc_tempo_conforto = 100.0 * tempo_faixa_conforto / minutos

    metricas = {
        "rmse": rmse,
        "tempo_faixa_conforto_percent": perc_tempo_conforto,
        "consumo_total": consumo_total,
        "violacoes": violacoes,
    }

    return {
        "historico": historico,
        "metricas": metricas,
    }


if __name__ == "__main__":
    print("==== FASE 2 - Controle Fuzzy PD do Data Center ====")
    resultado = simular_24h()

    m = resultado["metricas"]
    print("\n=== Métricas da Simulação 24h ===")
    print(f"RMSE em relação ao setpoint: {m['rmse']:.3f} °C")
    print(f"Tempo na faixa 20–24 °C : {m['tempo_faixa_conforto_percent']:.1f} %")
    print(f"Consumo total (soma PCRAC): {m['consumo_total']:.1f} unid. relativas")
    print(f"Número de violações (<18 ou >26 °C): {m['violacoes']}")
