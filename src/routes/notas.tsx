import { createFileRoute } from '@tanstack/react-router';
import { useState, useRef, useEffect } from 'react';
import { 
  FileText, 
  Heading1, 
  Heading2, 
  CheckSquare, 
  Mic, 
  PenTool, 
  Trash2, 
  FolderPlus, 
  Play, 
  Sparkles,
  ChevronRight,
  ListTodo,
  BookOpen,
  Palette,
  Eraser,
  Save,
  CheckCircle2,
  Circle,
  Plus,
  Maximize2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLifestyle } from '@/components/lifestyle-provider';

export const Route = createFileRoute('/notas')({
  head: () => ({
    meta: [
      { title: 'NIFLHEIM — Workspace & Notas em Blocos' },
      { name: 'description', content: 'Workspace lateral estilo Notion/Obsidian com modo página, checklists de rotina e caneta stylus.' },
    ],
  }),
  component: NotasPage,
});

export type NoteType = 'page' | 'checklist' | 'stylus' | 'blocks';

export interface NoteItem {
  id: string;
  title: string;
  category: 'Geral' | 'Rotina' | 'Estudos' | 'Projetos';
  type: NoteType;
  updatedAt: string;
  // Conteúdo para tipo 'page'
  pageText?: string;
  // Conteúdo para tipo 'checklist'
  checklistItems?: { id: string; text: string; done: boolean }[];
  // Conteúdo para tipo 'blocks'
  blocks?: { id: string; type: 'text' | 'h1' | 'h2' | 'check' | 'audio'; content: string; checked?: boolean }[];
  // Conteúdo para tipo 'stylus' (data URL da imagem do canvas)
  drawingDataUrl?: string;
}

const STORAGE_KEY = 'niflheim_workspace_notes_v2';

const INITIAL_NOTES: NoteItem[] = [
  {
    id: 'n1',
    title: 'Checklist Diário de Rotina Matinal',
    category: 'Rotina',
    type: 'checklist',
    updatedAt: new Date().toISOString(),
    checklistItems: [
      { id: 'c1', text: '500ml de água com eletrólitos ao acordar', done: true },
      { id: 'c2', text: '15 min de luz solar direta / caminhada rápida', done: true },
      { id: 'c3', text: 'Revisão das 3 prioridades do dia no OS', done: false },
      { id: 'c4', text: 'Treino de Hipertrofia com sobrecarga programada', done: false },
      { id: 'c5', text: 'Shake hiperproteico pós-treino (40g proteína)', done: false },
    ],
  },
  {
    id: 'n2',
    title: 'Documentação Técnica & Princípios de Hipertrofia',
    category: 'Estudos',
    type: 'page',
    updatedAt: new Date().toISOString(),
    pageText: `# Princípios de Treinamento Baseado em Evidências

1. Volume Semanal por Músculo (MEV, MAV, MRV):
   - Mínimo Volume Efetivo (MEV): ~6 a 8 séries/semana.
   - Volume Adaptativo Máximo (MAV): ~12 a 20 séries/semana.
   - Volume Máximo Recuperável (MRV): ~22+ séries (risco de Junk Volume).

2. PAP (Potenciação Pós-Ativação):
   - Contração quase máxima (90-95% 1RM) de 1 a 2 reps antes da série de trabalho.
   - Efeito: Aumenta a sensibilidade das proteínas contráteis e ativação neural sem fadiga metabólica.

3. Técnicas de Intensidade Efetivas:
   - Cluster Sets: quebra em micro-blocos com 15-20s de descanso intra-série.
   - Myo-Reps: série de ativação até perto da falha + 3-5 micro-séries com 10-15s de intervalo.
   - Back-off Sets: redução de carga para acumular volume limpo com boa técnica.`,
  },
  {
    id: 'n3',
    title: 'Quadro de Esboço & Desenho Livre',
    category: 'Projetos',
    type: 'stylus',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'n4',
    title: 'Notas Rápidas em Blocos Dinâmicos',
    category: 'Geral',
    type: 'blocks',
    updatedAt: new Date().toISOString(),
    blocks: [
      { id: 'b1', type: 'h1', content: 'Metas e Execução da Semana' },
      { id: 'b2', type: 'text', content: 'Manter a constância no déficit calórico e progressão contínua de carga.' },
      { id: 'b3', type: 'check', content: 'Ajustar cálculo não-linear de cardio no app', checked: true },
      { id: 'b4', type: 'audio', content: 'Áudio gravado: Análise do descanso pós-treino' },
    ],
  },
];

function NotasPage() {
  const { reward } = useLifestyle();

  // Carregar notas do localStorage ou iniciais
  const [notes, setNotes] = useState<NoteItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_NOTES;
  });

  const [activeNoteId, setActiveNoteId] = useState<string>(notes[0]?.id ?? 'n1');
  const [filterCategory, setFilterCategory] = useState<string>('Todas');

  // Modal / Criação rápida de nota
  const [isCreatingNote, setIsCreatingNote] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteCategory, setNewNoteCategory] = useState<'Geral' | 'Rotina' | 'Estudos' | 'Projetos'>('Rotina');
  const [newNoteType, setNewNoteType] = useState<NoteType>('checklist');

  // Input de novo item de checklist
  const [newChecklistText, setNewChecklistText] = useState('');

  // Estados do Canvas Stylus (Modo Caneta)
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [penColor, setPenColor] = useState<string>('#FFD700');
  const [penSize, setPenSize] = useState<number>(3);
  const [isEraser, setIsEraser] = useState(false);

  // Sincronizar com localStorage sempre que notas mudarem
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    } catch (e) {}
  }, [notes]);

  const activeNote = notes.find((n) => n.id === activeNoteId) || notes[0];

  // Configuração do Canvas quando nota stylus estiver ativa
  useEffect(() => {
    if (activeNote?.type === 'stylus' && canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.width = canvas.parentElement?.clientWidth || 800;
      canvas.height = 550;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#18181b';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Se houver desenho prévio salvo
        if (activeNote.drawingDataUrl) {
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, 0, 0);
          };
          img.src = activeNote.drawingDataUrl;
        }
      }
    }
  }, [activeNoteId, activeNote?.type]);

  // Funções do Canvas Stylus
  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.strokeStyle = isEraser ? '#18181b' : penColor;
    ctx.lineWidth = isEraser ? penSize * 4 : penSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    setIsDrawing(true);
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing || !canvasRef.current) return;
    setIsDrawing(false);
    // Salvar estado atual do desenho na nota
    const dataUrl = canvasRef.current.toDataURL('image/png');
    setNotes((prev) =>
      prev.map((n) => (n.id === activeNoteId ? { ...n, drawingDataUrl: dataUrl, updatedAt: new Date().toISOString() } : n))
    );
  };

  const clearStylusCanvas = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#18181b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      setNotes((prev) =>
        prev.map((n) => (n.id === activeNoteId ? { ...n, drawingDataUrl: undefined, updatedAt: new Date().toISOString() } : n))
      );
    }
  };

  // Handlers para criação e exclusão de notas
  const handleCreateNote = () => {
    if (!newNoteTitle.trim()) return;
    const created: NoteItem = {
      id: crypto.randomUUID(),
      title: newNoteTitle.trim(),
      category: newNoteCategory,
      type: newNoteType,
      updatedAt: new Date().toISOString(),
      pageText: newNoteType === 'page' ? '# ' + newNoteTitle.trim() + '\n\nEscreva livremente aqui...' : undefined,
      checklistItems: newNoteType === 'checklist' ? [
        { id: crypto.randomUUID(), text: 'Primeira tarefa da rotina', done: false }
      ] : undefined,
      blocks: newNoteType === 'blocks' ? [
        { id: crypto.randomUUID(), type: 'h1', content: newNoteTitle.trim() },
        { id: crypto.randomUUID(), type: 'text', content: 'Novo bloco de anotação...' }
      ] : undefined,
    };

    setNotes((prev) => [created, ...prev]);
    setActiveNoteId(created.id);
    setNewNoteTitle('');
    setIsCreatingNote(false);
    reward(10);
  };

  const handleDeleteNote = (noteId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (notes.length <= 1) {
      alert('Mantenha ao menos uma nota no seu workspace.');
      return;
    }
    const toDelete = notes.find((n) => n.id === noteId);
    if (!window.confirm(`Deseja realmente excluir "${toDelete?.title}"?`)) return;
    const remaining = notes.filter((n) => n.id !== noteId);
    setNotes(remaining);
    if (activeNoteId === noteId) {
      setActiveNoteId(remaining[0].id);
    }
  };

  // Handlers de Checklist
  const handleToggleChecklistItem = (itemId: string) => {
    setNotes((prev) =>
      prev.map((n) => {
        if (n.id !== activeNoteId || !n.checklistItems) return n;
        return {
          ...n,
          updatedAt: new Date().toISOString(),
          checklistItems: n.checklistItems.map((item) =>
            item.id === itemId ? { ...item, done: !item.done } : item
          ),
        };
      })
    );
  };

  const handleAddChecklistItem = () => {
    if (!newChecklistText.trim()) return;
    setNotes((prev) =>
      prev.map((n) => {
        if (n.id !== activeNoteId) return n;
        const currentItems = n.checklistItems || [];
        return {
          ...n,
          updatedAt: new Date().toISOString(),
          checklistItems: [
            ...currentItems,
            { id: crypto.randomUUID(), text: newChecklistText.trim(), done: false },
          ],
        };
      })
    );
    setNewChecklistText('');
  };

  const handleDeleteChecklistItem = (itemId: string) => {
    setNotes((prev) =>
      prev.map((n) => {
        if (n.id !== activeNoteId || !n.checklistItems) return n;
        return {
          ...n,
          updatedAt: new Date().toISOString(),
          checklistItems: n.checklistItems.filter((item) => item.id !== itemId),
        };
      })
    );
  };

  // Handlers de Página Contínua
  const handleUpdatePageText = (text: string) => {
    setNotes((prev) =>
      prev.map((n) =>
        n.id === activeNoteId ? { ...n, pageText: text, updatedAt: new Date().toISOString() } : n
      )
    );
  };

  // Handlers de Blocos Mistos
  const handleUpdateBlock = (blockId: string, content: string) => {
    setNotes((prev) =>
      prev.map((n) => {
        if (n.id !== activeNoteId || !n.blocks) return n;
        return {
          ...n,
          updatedAt: new Date().toISOString(),
          blocks: n.blocks.map((b) => (b.id === blockId ? { ...b, content } : b)),
        };
      })
    );
  };

  const handleToggleBlockCheck = (blockId: string) => {
    setNotes((prev) =>
      prev.map((n) => {
        if (n.id !== activeNoteId || !n.blocks) return n;
        return {
          ...n,
          updatedAt: new Date().toISOString(),
          blocks: n.blocks.map((b) => (b.id === blockId ? { ...b, checked: !b.checked } : b)),
        };
      })
    );
  };

  const handleAddBlock = (type: 'text' | 'h1' | 'h2' | 'check' | 'audio') => {
    setNotes((prev) =>
      prev.map((n) => {
        if (n.id !== activeNoteId) return n;
        const currentBlocks = n.blocks || [];
        return {
          ...n,
          updatedAt: new Date().toISOString(),
          blocks: [
            ...currentBlocks,
            {
              id: crypto.randomUUID(),
              type,
              content: type === 'audio' ? 'Nota de áudio gravada' : '',
              checked: false,
            },
          ],
        };
      })
    );
  };

  const handleDeleteBlock = (blockId: string) => {
    setNotes((prev) =>
      prev.map((n) => {
        if (n.id !== activeNoteId || !n.blocks) return n;
        return {
          ...n,
          updatedAt: new Date().toISOString(),
          blocks: n.blocks.filter((b) => b.id !== blockId),
        };
      })
    );
  };

  // Filtragem de notas por categoria
  const filteredNotes = notes.filter((n) =>
    filterCategory === 'Todas' ? true : n.category === filterCategory
  );

  // Cálculo de progresso de checklist
  const checklistProgress = activeNote?.checklistItems?.length
    ? Math.round(
        (activeNote.checklistItems.filter((i) => i.done).length / activeNote.checklistItems.length) * 100
      )
    : 0;

  return (
    <div className="space-y-6">
      {/* Header do Módulo */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
            <BookOpen size={13} /> Notion & Obsidian Workspace
          </span>
          <h1 className="text-3xl font-extrabold md:text-4xl text-foreground">
            Caderno, Rotina & Stylus<span className="text-primary">.</span>
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Escolha facilmente entre checklists de rotina, editor de página livre, blocos dinâmicos ou caneta stylus.
          </p>
        </div>

        <Button
          onClick={() => setIsCreatingNote(true)}
          className="bg-primary text-primary-foreground font-black hover:bg-primary/90 text-xs flex items-center gap-1.5"
        >
          <Plus size={15} /> + Nova Nota / Checklist
        </Button>
      </div>

      {/* MODAL CRIAÇÃO DE NOTA / ESCOLHA DE ESTILO */}
      {isCreatingNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="panel max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-black flex items-center gap-2 text-foreground">
                <Sparkles size={16} className="text-primary" /> Criar Novo Item no Workspace
              </h3>
              <button
                onClick={() => setIsCreatingNote(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">
                  Título da Nota ou Rotina:
                </label>
                <input
                  type="text"
                  placeholder="Ex: Checklist da Noite, Resumo Biomecânico..."
                  value={newNoteTitle}
                  onChange={(e) => setNewNoteTitle(e.target.value)}
                  className="w-full text-xs"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-muted-foreground block mb-1">
                    Categoria:
                  </label>
                  <select
                    value={newNoteCategory}
                    onChange={(e) => setNewNoteCategory(e.target.value as any)}
                    className="w-full text-xs rounded border border-border bg-background p-2"
                  >
                    <option value="Rotina">Rotina & Hábitos</option>
                    <option value="Estudos">Estudos & Ciência</option>
                    <option value="Projetos">Projetos Manuais</option>
                    <option value="Geral">Geral & Rascunho</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-muted-foreground block mb-1">
                    Estilo de Nota:
                  </label>
                  <select
                    value={newNoteType}
                    onChange={(e) => setNewNoteType(e.target.value as NoteType)}
                    className="w-full text-xs rounded border border-border bg-background p-2"
                  >
                    <option value="checklist">✅ Checklist de Rotina</option>
                    <option value="page">📄 Página Contínua (Documento)</option>
                    <option value="stylus">🎨 Modo Caneta (Stylus / Desenho)</option>
                    <option value="blocks">🧱 Blocos Dinâmicos</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button variant="ghost" size="sm" onClick={() => setIsCreatingNote(false)} className="text-xs">
                Cancelar
              </Button>
              <Button onClick={handleCreateNote} size="sm" className="bg-primary text-primary-foreground font-bold text-xs">
                Criar Agora
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ESTRUTURA PRINCIPAL: SIDEBAR LATERAL NOTION-LIKE + ÁREA DE CONTEÚDO */}
      <div className="grid gap-6 md:grid-cols-[280px_1fr] items-start">
        {/* SIDEBAR LATERAL */}
        <div className="panel p-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
              <FolderPlus size={13} className="text-primary" /> Painel de Itens
            </span>
            <span className="text-[10px] text-muted-foreground font-mono">
              {filteredNotes.length} notas
            </span>
          </div>

          {/* Filtro por Categoria */}
          <div className="flex flex-wrap gap-1 border-b border-border/60 pb-3">
            {['Todas', 'Rotina', 'Estudos', 'Projetos', 'Geral'].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`rounded-md px-2 py-1 text-[10px] font-bold transition-all ${
                  filterCategory === cat
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Lista de Notas na Lateral */}
          <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1">
            {filteredNotes.map((note) => {
              const isActive = note.id === activeNoteId;
              let Icon = FileText;
              if (note.type === 'checklist') Icon = ListTodo;
              if (note.type === 'stylus') Icon = PenTool;
              if (note.type === 'blocks') Icon = CheckSquare;

              return (
                <div
                  key={note.id}
                  onClick={() => setActiveNoteId(note.id)}
                  className={`group flex cursor-pointer items-center justify-between rounded-xl p-2.5 text-xs transition-all ${
                    isActive
                      ? 'bg-primary/15 text-primary border border-primary/40 font-bold shadow-sm'
                      : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate min-w-0">
                    <Icon size={14} className={isActive ? 'text-primary' : 'text-muted-foreground'} />
                    <div className="truncate">
                      <div className="truncate font-semibold">{note.title}</div>
                      <span className="text-[9px] text-muted-foreground/80 block uppercase">
                        {note.category} • {note.type}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Botão de Excluir */}
                    <button
                      onClick={(e) => handleDeleteNote(note.id, e)}
                      title="Excluir nota"
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/20 hover:text-destructive text-muted-foreground transition-all"
                    >
                      <Trash2 size={12} />
                    </button>
                    {isActive && <ChevronRight size={13} className="text-primary" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ÁREA DE EDIÇÃO CENTRAL CONFORME O TIPO ESCOLHIDO */}
        <div className="panel p-6 min-h-[550px] space-y-5">
          {/* Header da Nota Ativa */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded bg-primary/20 text-primary text-[10px] font-bold px-2 py-0.5 uppercase">
                  {activeNote?.category}
                </span>
                <span className="text-xs text-muted-foreground font-mono">
                  {activeNote?.type === 'checklist' && '✅ Modo Checklist de Rotina'}
                  {activeNote?.type === 'page' && '📄 Modo Página Contínua'}
                  {activeNote?.type === 'stylus' && '🎨 Modo Caneta / Stylus'}
                  {activeNote?.type === 'blocks' && '🧱 Modo Blocos Dinâmicos'}
                </span>
              </div>
              <h2 className="text-xl md:text-2xl font-black text-foreground mt-1">
                {activeNote?.title}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground font-mono">
                Salvo localmente
              </span>
            </div>
          </div>

          {/* RENDERIZADOR 1: MODO CHECKLIST DE ROTINA */}
          {activeNote?.type === 'checklist' && (
            <div className="space-y-4">
              {/* Barra de Progresso do Checklist */}
              <div className="space-y-1.5 rounded-xl border border-primary/30 bg-primary/5 p-3">
                <div className="flex justify-between text-xs font-mono">
                  <span className="font-bold text-primary">Progresso da Rotina:</span>
                  <span className="font-black text-primary">{checklistProgress}% concluído</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${checklistProgress}%` }}
                  />
                </div>
              </div>

              {/* Input Rápido para Novo Item */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Digitar nova tarefa ou hábito e pressionar Enter..."
                  value={newChecklistText}
                  onChange={(e) => setNewChecklistText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddChecklistItem();
                  }}
                  className="flex-1 text-xs"
                />
                <Button
                  onClick={handleAddChecklistItem}
                  size="sm"
                  className="bg-primary text-primary-foreground font-bold text-xs"
                >
                  <Plus size={13} /> Adicionar
                </Button>
              </div>

              {/* Lista de Itens do Checklist */}
              <div className="space-y-2 pt-2">
                {activeNote.checklistItems?.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between rounded-xl border p-3 transition-all ${
                      item.done
                        ? 'border-emerald-500/30 bg-emerald-500/5 text-muted-foreground'
                        : 'border-border/80 bg-background hover:border-primary/50'
                    }`}
                  >
                    <div
                      onClick={() => handleToggleChecklistItem(item.id)}
                      className="flex cursor-pointer items-center gap-3 flex-1 select-none"
                    >
                      {item.done ? (
                        <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                      ) : (
                        <Circle size={18} className="text-muted-foreground shrink-0 hover:text-primary" />
                      )}
                      <span className={`text-xs ${item.done ? 'line-through opacity-70' : 'font-medium text-foreground'}`}>
                        {item.text}
                      </span>
                    </div>

                    <button
                      onClick={() => handleDeleteChecklistItem(item.id)}
                      title="Remover item"
                      className="text-muted-foreground hover:text-destructive p-1 rounded"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* RENDERIZADOR 2: MODO PÁGINA CONTÍNUA (ESTILO LIVRO / NOTION DOC) */}
          {activeNote?.type === 'page' && (
            <div className="space-y-3">
              <p className="text-[11px] text-muted-foreground">
                Escreva livremente sem quebras em blocos. Suporta Markdown, notas de rodapé e textos extensos.
              </p>
              <textarea
                value={activeNote.pageText || ''}
                onChange={(e) => handleUpdatePageText(e.target.value)}
                placeholder="Comece a redigir sua página livremente..."
                className="w-full min-h-[420px] rounded-xl border border-border/80 bg-background/60 p-4 font-sans text-xs leading-relaxed text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-y"
              />
            </div>
          )}

          {/* RENDERIZADOR 3: MODO CANETA (STYLUS / DESENHO LIVRE) */}
          {activeNote?.type === 'stylus' && (
            <div className="space-y-3">
              {/* Barra de Ferramentas da Caneta */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/80 bg-background/80 p-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
                    <Palette size={13} /> Cores:
                  </span>
                  {[
                    { color: '#FFD700', label: 'Amarelo' },
                    { color: '#FFFFFF', label: 'Branco' },
                    { color: '#38BDF8', label: 'Ciano' },
                    { color: '#F43F5E', label: 'Vermelho' },
                    { color: '#4ADE80', label: 'Verde' },
                  ].map((c) => (
                    <button
                      key={c.color}
                      onClick={() => { setPenColor(c.color); setIsEraser(false); }}
                      style={{ backgroundColor: c.color }}
                      title={c.label}
                      className={`size-5 rounded-full border border-black/40 transition-transform ${
                        penColor === c.color && !isEraser ? 'scale-125 ring-2 ring-primary ring-offset-1 ring-offset-background' : ''
                      }`}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-muted-foreground">Espessura:</span>
                  {[2, 4, 8].map((size) => (
                    <button
                      key={size}
                      onClick={() => { setPenSize(size); setIsEraser(false); }}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        penSize === size && !isEraser
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted/40 text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      {size}px
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant={isEraser ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setIsEraser(!isEraser)}
                    className="text-xs h-7"
                  >
                    <Eraser size={13} className="mr-1" /> Borracha
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearStylusCanvas}
                    className="text-xs h-7 text-destructive hover:bg-destructive/10"
                  >
                    Limpar Tela
                  </Button>
                </div>
              </div>

              {/* Canvas Interativo com Pointer Events */}
              <div className="relative rounded-2xl border border-primary/40 bg-zinc-900 overflow-hidden shadow-inner">
                <canvas
                  ref={canvasRef}
                  onPointerDown={startDrawing}
                  onPointerMove={draw}
                  onPointerUp={stopDrawing}
                  onPointerLeave={stopDrawing}
                  className="w-full h-[550px] cursor-crosshair touch-none"
                />
              </div>
            </div>
          )}

          {/* RENDERIZADOR 4: MODO BLOCOS DINÂMICOS NOTION */}
          {activeNote?.type === 'blocks' && (
            <div className="space-y-4">
              {/* Barra para Inserir Novos Blocos */}
              <div className="flex flex-wrap items-center gap-1.5 border-b border-border pb-3 text-xs">
                <span className="text-[11px] text-muted-foreground mr-1">+ Inserir:</span>
                <Button variant="ghost" size="sm" onClick={() => handleAddBlock('text')} className="text-xs h-7">
                  <FileText size={13} className="mr-1" /> Texto
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleAddBlock('h1')} className="text-xs h-7">
                  <Heading1 size={13} className="mr-1" /> Título H1
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleAddBlock('h2')} className="text-xs h-7">
                  <Heading2 size={13} className="mr-1" /> Subtítulo H2
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleAddBlock('check')} className="text-xs h-7">
                  <CheckSquare size={13} className="mr-1" /> Check
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleAddBlock('audio')} className="text-xs h-7 text-primary">
                  <Mic size={13} className="mr-1" /> Áudio
                </Button>
              </div>

              {/* Blocos Ativos */}
              <div className="space-y-3">
                {activeNote.blocks?.map((b) => {
                  if (b.type === 'h1') {
                    return (
                      <div key={b.id} className="group flex items-center gap-2">
                        <input
                          type="text"
                          value={b.content}
                          onChange={(e) => handleUpdateBlock(b.id, e.target.value)}
                          placeholder="Título H1..."
                          className="border-0 bg-transparent text-xl font-black text-foreground focus:ring-0 p-1 flex-1"
                        />
                        <button
                          onClick={() => handleDeleteBlock(b.id)}
                          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    );
                  }

                  if (b.type === 'h2') {
                    return (
                      <div key={b.id} className="group flex items-center gap-2">
                        <input
                          type="text"
                          value={b.content}
                          onChange={(e) => handleUpdateBlock(b.id, e.target.value)}
                          placeholder="Subtítulo H2..."
                          className="border-0 bg-transparent text-lg font-bold text-foreground focus:ring-0 p-1 flex-1"
                        />
                        <button
                          onClick={() => handleDeleteBlock(b.id)}
                          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    );
                  }

                  if (b.type === 'check') {
                    return (
                      <div key={b.id} className="group flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={b.checked}
                          onChange={() => handleToggleBlockCheck(b.id)}
                          className="size-4 rounded border-border"
                        />
                        <input
                          type="text"
                          value={b.content}
                          onChange={(e) => handleUpdateBlock(b.id, e.target.value)}
                          placeholder="Item de checklist..."
                          className={`border-0 bg-transparent text-xs text-foreground focus:ring-0 p-1 flex-1 ${
                            b.checked ? 'line-through text-muted-foreground' : ''
                          }`}
                        />
                        <button
                          onClick={() => handleDeleteBlock(b.id)}
                          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    );
                  }

                  if (b.type === 'audio') {
                    return (
                      <div
                        key={b.id}
                        className="group flex items-center justify-between rounded-xl border border-primary/30 bg-primary/5 p-3.5"
                      >
                        <div className="flex items-center gap-3">
                          <button className="grid size-9 place-items-center rounded-full bg-primary text-primary-foreground">
                            <Play size={15} fill="currentColor" />
                          </button>
                          <div>
                            <div className="text-xs font-bold text-foreground">
                              {b.content}
                            </div>
                            <div className="flex items-center gap-1 mt-1.5 h-3">
                              {[40, 70, 30, 90, 60, 100, 45, 80, 20, 50, 75, 40].map((h, i) => (
                                <span key={i} style={{ height: `${h}%` }} className="w-1 rounded-full bg-primary/70" />
                              ))}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteBlock(b.id)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div key={b.id} className="group flex items-start gap-2">
                      <textarea
                        rows={2}
                        value={b.content}
                        onChange={(e) => handleUpdateBlock(b.id, e.target.value)}
                        placeholder="Texto em bloco..."
                        className="border-0 bg-transparent text-xs text-foreground focus:ring-0 p-1 flex-1 resize-none"
                      />
                      <button
                        onClick={() => handleDeleteBlock(b.id)}
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive mt-1"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
