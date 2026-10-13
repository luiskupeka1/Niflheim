# NIFLHEIM — Lifestyle OS

Plataforma unificada de alta performance para gestão de estilo de vida, integrando:
- **Nutrição & Diário de Macros:** Rastreamento por refeição, anel de macros circular e farm de passos e cardio.
- **Musculação Avançada:** Baseada na ciência moderna do treinamento (MEV, MAV, MRV), taxonomia de séries (Warmup, Feeder, Working, Backoff), técnicas de intensidade (Myo-Reps com micro-timer de 15s, Cluster Sets, Drop Sets acoplados e Supersets), e alerta de Deload por fadiga sistêmica.
- **Rotinas & Hábitos:** Checklists diários, cálculo de streaks (ofensivas 🔥) e motor de gamificação por XP.
- **Notion-Like Workspace:** Notas dinâmicas em blocos aninhados, áudio com waveform visual e modo caneta (Stylus / Apple Pencil) sobre canvas transparente.
- **Perfil & Motor Metabólico:** Fórmula dinâmica de Mifflin-St Jeor (TMB/TDEE) com sliders de macronutrientes.

---

## 🚀 Como Rodar Localmente

1. Clone o repositório:
```bash
git clone git@github.com:luiskupeka1/Niflheim.git
cd Niflheim
```

2. Instale as dependências:
```bash
npm install
```

3. Configure o arquivo `.env`:
```env
VITE_SUPABASE_URL="https://udryrrohrskqcaseiuhh.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="sb_publishable_2pZ_X8TuSbMyoDzyd2RFUA_XliNi4fE"
VITE_SUPABASE_PROJECT_ID="udryrrohrskqcaseiuhh"
SUPABASE_URL="https://udryrrohrskqcaseiuhh.supabase.co"
SUPABASE_PUBLISHABLE_KEY="sb_publishable_2pZ_X8TuSbMyoDzyd2RFUA_XliNi4fE"
SUPABASE_PROJECT_ID="udryrrohrskqcaseiuhh"
```

4. Execute o servidor de desenvolvimento:
```bash
npm run dev
```

Abra [http://localhost:8080](http://localhost:8080) no seu navegador.

---

## 🧪 Testes

Para rodar a suíte de testes unitários:
```bash
npm test
```

## 🌐 Deploy na Vercel

O projeto está otimizado para deploy instantâneo na **Vercel** através da integração nativa com o GitHub.
Basta configurar as variáveis de ambiente do Supabase nas configurações do projeto na Vercel.
