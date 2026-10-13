# Aplicativo de estilo de vida

## Objetivo
Criar uma aplicação web em português, adaptada a celulares e computadores, que una nutrição, musculação, rotina e notas com gamificação. Seguir o prompt enviado e incluir o armazenamento de perfil confirmado por você.

**Limite da plataforma:** esta entrega será web, não React Native ou Flutter. Recursos de vibração, gravação e caneta dependerão do navegador e do aparelho; não serão apresentados como integrações nativas garantidas.

## Visual e navegação
- Fundo preto e cinza-escuro, amarelo vibrante para ações e progresso, texto branco e cinza-claro e tipografia sem serifa com títulos fortes.
- Tela principal com resumo do dia, nível, XP, ofensiva, calorias, próximo treino e hábitos. Navegação inferior no celular e lateral no computador.
- Páginas próprias para Nutrição, Treinos, Rotina, Notas e Perfil, sem página de marketing.
- Animações de recompensa com partículas amarelas, respeitando a preferência por movimento reduzido; som e vibração quando autorizados e suportados.

## Conta e perfil
- Ativar Lovable Cloud para contas, dados persistentes e arquivos privados.
- Cadastro e entrada por e-mail e senha, confirmação por e-mail, recuperação de senha e saída da conta.
- Perfil vinculado à conta e criado automaticamente no cadastro, com acesso restrito ao proprietário.
- Onboarding com nome, e-mail, telefone, idade, sexo biológico, altura e peso; gordura corporal e objetivo opcionais, além do nível de atividade necessário ao cálculo.
- Calcular TMB por Mifflin-St Jeor com as fórmulas do prompt e multiplicadores 1,2 / 1,375 / 1,55 / 1,725 / 1,9.
- Sugerir inicialmente proteínas de 2 g/kg e gorduras de 0,8 g/kg, preenchendo as calorias restantes com carboidratos; permitir ajustes e evitar resultados negativos. Não aplicar déficits ou superávits não especificados silenciosamente.

## Nutrição e cardio
- Catálogo inicial de alimentos de exemplo, identificado como demonstrativo, e alimentos criados pelo usuário com porção, kcal, proteínas, carboidratos, gorduras e fibras. Não atribuir selo de validação profissional aos exemplos.
- Diário com Café da Manhã, Almoço, Jantar, Pré-Treino e Pós-Treino; adicionar, editar e remover alimentos, recalculando quantidades e totais.
- Progresso circular de macros em amarelo, azul e vermelho, com metas ajustáveis.
- Registrar minutos e intensidade de cardio: baixa 100, moderada 120 e alta 150 passos/minuto. Assim, 30 minutos em alta intensidade geram 4.500 passos estimados.
- Usar a conversão ilustrativa `passos × 0,04 × (peso / 70)` como estimativa identificada, não como medição científica precisa. Somar o crédito calórico uma única vez ao limite diário e recalcular ao editar ou excluir o registro.

## Musculação e recuperação
- Biblioteca de exercícios por músculo e equipamento, descrição e campo de vídeo tutorial, sem inventar links.
- Criar treinos e registrar séries com carga, repetições, tipo e RIR entre 0 e 5.
- Ao concluir uma série, iniciar descanso configurável; mostrar tempo restante e permitir pausar, retomar ou encerrar.
- Exibir carga e repetições anteriores e destacar progressão com troféu.
- Finalizar treino com PSE entre 1 e 10 e duração, calculando tonelagem a partir das séries concluídas.
- Check-in de recuperação com sono, DOMS e cansaço entre 1 e 5.
- Aplicar a regra explícita: DOMS igual a 5 em três dias consecutivos gera o alerta para considerar redução de 20% das séries. Guardar tonelagem e demais respostas para contextualização, sem inventar limiares adicionais de fadiga.
- Mostrar lembrete de check-in às 21h enquanto o aplicativo estiver aberto. Push com aplicativo fechado ficará fora desta entrega; exige infraestrutura e permissões próprias.

## Rotina e notas
- Hábitos e checklists diários com conclusão e reordenação por arrastar, incluindo alternativa acessível sem arraste.
- Notas com subpáginas e blocos de texto, títulos H1/H2/H3, checklist, imagem e áudio.
- Gravação de áudio mediante permissão, reprodução e representação visual do áudio.
- Modo caneta sobre a nota, com rolagem suspensa durante o desenho, salvar e apagar traços. Capturar pressão quando disponível por Pointer Events; rejeição de palma será limitada ao suporte do navegador, sem garantia equivalente a aplicativos nativos.

## Gamificação
- XP por conclusão de hábitos, treinos e metas nutricionais, nível geral e dias consecutivos de atividade.
- Definir e documentar valores iniciais de XP e progressão como parâmetros ajustáveis, pois o prompt não determina valores.
- Evitar XP duplicado ao repetir ações, desfazer conclusões ou reenviar registros.

## Detalhes técnicos e entregáveis
- Manter React e TanStack Start do projeto; adaptar o componente solicitado `WorkoutLogger.tsx` para React web e a lógica de backend para o ambiente de execução suportado, não Node.js exclusivo.
- Migrações SQL com perfis, resumos nutricionais diários, alimentos, refeições e itens, cardio, treinos, exercícios, séries, fadiga, hábitos, conclusões, páginas, blocos e eventos de XP. Documentar relações 1:N e N:N.
- Permissões explícitas e políticas de acesso por proprietário, inclusive para imagens e áudios. Catálogos compartilhados terão leitura controlada e edição restrita.
- Funções autenticadas para cálculos e operações privadas; funções puras para metabolismo, `calculateCardioMetrics.ts` e `requiresDeload`.
- Dados iniciais dos catálogos incluídos nas migrações. Registros pessoais reais começam vazios; exemplos demonstrativos ficam separados dos dados da conta.
- Testes para fórmulas metabólicas, multiplicadores, conversão de passos, crédito calórico, limites de RIR/PSE/fadiga, três dias consecutivos de DOMS e prevenção de XP duplicado.
- Documentação da arquitetura, relações e limitações; títulos e descrições próprios em cada página.

## Validação
Verificar no celular e no computador: cadastro e entrada, preenchimento do perfil, registro e leitura de refeição/cardio, execução e conclusão de treino com descanso, alerta de recuperação, hábito concluído e nota salva. Confirmar que os dados continuam disponíveis após recarregar e que outra conta não acessa informações privadas.