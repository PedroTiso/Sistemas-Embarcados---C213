def simular_temperatura(
    T_inicial=22.0,
    PCRAC=50.0,
    Qest=70.0,
    Text=30.0,
    minutos=60
):
    """
    Simula a evolução da temperatura por 'minutos' passos,
    usando a equação:
    T[n+1] = 0.9*T[n] - 0.08*PCRAC + 0.05*Qest + 0.02*Text + 3.5
    """

    T_atual = T_inicial

    print("=== SIMULAÇÃO BÁSICA DO MODELO TÉRMICO ===")
    print(f"Temperatura inicial: {T_atual:.2f} °C")
    print(f"PCRAC (potência do ar-condicionado): {PCRAC:.1f}")
    print(f"Qest (carga térmica): {Qest:.1f}")
    print(f"Text (temperatura externa): {Text:.1f}")
    print(f"Duração da simulação: {minutos} minutos")
    print("==========================================\n")


    for minuto in range(1, minutos + 1):
        
        T_prox = 0.9 * T_atual - 0.08 * PCRAC + 0.05 * Qest + 0.02 * Text + 3.5

       
        T_atual = T_prox

        print(f"Minuto {minuto:3d} -> Temperatura: {T_atual:6.2f} °C")

    print("\nSimulação concluída.")


if __name__ == "__main__":
    
    simular_temperatura(
        T_inicial=22.0,
        PCRAC=50.0,
        Qest=70.0,      
        Text=30.0,       
        minutos=60       
    )
