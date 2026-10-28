# Coopeer

App mobile de descoberta e gestão de times esportivos amadores locais — um "Airbnb de esportes".
Você abre o mapa, vê jogos e clubes perto de você, entra num jogo avulso (~$7) e assina o clube se gostar.
Começando em Bentonville, AR, com futebol e pickleball.

## Rodar o app

**No navegador:** o Vercel publica cada push da branch automaticamente — abra o link do deploy no painel do Vercel.

**No seu iPhone (Expo Go):**

```bash
npm install
npx expo start
```

Instale o app **Expo Go** na App Store e escaneie o QR code que aparece no terminal (computador e celular na mesma rede Wi-Fi; se não conectar, use `npx expo start --tunnel`).

**No navegador local:** `npx expo start --web`.

Dados de teste:
- Login: qualquer telefone de 10 dígitos e qualquer código de 6 dígitos (`000000` simula código errado).
- Códigos de clube: `12355654` (Bentonville Strikers), `33557799` (Crystal Bridges Picklers), `22446688` (Sunday League).
- Deep link: `coopeer://join/22446688`.

## Lugar · Clube · Jogo

| | O que é | Como entra | Visual |
|---|---|---|---|
| **Lugar** | Onde se joga (campo, quadras) | — | Pin no mapa |
| **Jogo** | Acontece **uma vez**, num horário | "I'm in", sem compromisso | Bloco de data (LIVE / TODAY / dia + hora) |
| **Clube** | Grupo que joga **toda semana** | Uma vez: código, QR ou "Join club" | Logo quadrado |

Um clube organiza jogos; um jogo também pode ser aberto, sem clube. Cada pin é um lugar,
então vários clubes podem dividir o mesmo pin.

Detalhes de estrutura, regras de design e de código: veja `CLAUDE.md`.
