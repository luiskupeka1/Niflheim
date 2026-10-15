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
  ArrowDown,
  GripVertical,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLifestyle } from '@/components/lifestyle-provider';

export const Route = createFileRoute('/notas')({
  head: () => ({
    meta: [
      { title: 'NIFLHEIM — Workspace & Notas com Checklist' },
      { name: 'description', content: 'Crie notas completas com texto livre, checklists interativos de tarefas, títulos e modo caneta stylus.' },
    ],
  }),
  component: NotasPage,
});

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export type ContentBlockType = 'text' | 'h1' | 'h2' | 'checklist' | 'audio';

export interface NoteBlock {
  id: string;
  type: ContentBlockType;
  content: string; // Para texto corrido, títulos ou notas de áudio
  items?: ChecklistItem[]; // Para blocos de checklist com múltiplos itens
}

export interface NoteDocument {
  id: string;
  title: string;
  category: 'Geral' | 'Rotina' | 'Estudos' | 'Projetos';
  updatedAt: string;
  blocks: NoteBlock[];
  drawingDataUrl?: string;
}

const STORAGE_KEY = 'niflheim_workspace_notes_v3';

const INITIAL_NOTES: NoteDocument[] = [
  {
    id: 'n-3d',
    title: 'Calibração Impressora 3D',
    category: 'Projetos',
    updatedAt: new Date().toISOString(),
    blocks: [
      {
        id: 'b-intro',
        type: 'text',
        content: 'Checklist de calibração para filamento PLA e PETG na mesa aquecida.',
      },
      {
        id: 'b-chk-3d',
        type: 'checklist',
        content: 'Etapas de Calibração da Mesa & Extrusor',
        items: [
          { id: 'c-1', text: 'Nivelar os 4 cantos da mesa aquecida a 60°C com folha de papel', done: true },
          { id: 'c-2', text: 'Ajustar o Z-offset para primeira camada perfeita (sem ranhuras)', done: true },
          { id: 'c-3', text: 'Limpar bico extrusor 0.4mm com agulha de acupuntura', done: false },
          { id: 'c-4', text: 'Imprimir torre de temperatura de 190°C a 220°C para checar stringing', done: false },
          { id: 'c-5', text: 'Calibrar fluxo de extrusão (E-steps no firmware Klipper/Marlin)', done: false },
        ],
      },
      {
        id: 'b-obs',
        type: 'text',
        content: 'Dica: Se houver empenamento (warping) nos cantos, usar spray adesivo ou aba brim de 5mm no fatiador.',
      },
    ],
  },
  {
    id: 'n-rotina',
    title: 'Rotina Matinal & Hipertrofia',
    category: 'Rotina',
    updatedAt: new Date().toISOString(),
    blocks: [
      {
        id: 'b-h1',
        type: 'h1',
        content: 'Protocolo de Início de Dia',
      },
      {
        id: 'b-chk-matinal',
        type: 'checklist',
        content: 'Checklist de Ação Imediata',
        items: [
          { id: 'cm-1', text: 'Tomar 500ml de água com sal integral e limão ao acordar', done: true },
          { id: 'cm-2', text: '15 minutos de exposição à luz solar matinal (sincronizar ciclo circadiano)', done: true },
          { id: 'cm-3', text: 'Revisar metas de sobrecarga progressiva para o treino de hoje', done: false },
          { id: 'cm-4', text: 'Preparar shake hiperproteico pré-treino com aveia e banana', done: false },
        ],
      },
      {
        id: 'b-txt-2',
        type: 'text',
        content: 'Foco do treino hoje: Séries de trabalho efetivas com proximidade da falha (RIR 1-2) e série PAP no primeiro exercício composto.',
      },
    ],
  },
  {
    id: 'n-estudos',
    title: 'Biomecânica & Princípios Científicos',
    category: 'Estudos',
    updatedAt: new Date().toISOString(),
    blocks: [
      {
        id: 'b-est-1',
        type: 'h1',
        content: 'Potenciação Pós-Ativação (PAP)',
      },
      {
        id: 'b-est-2',
        type: 'text',
        content: 'A PAP recruta unidades motoras de alto limiar através de uma contração quase máxima (1-2 reps com ~90% de 1RM), aumentando a produção de força nas séries de trabalho seguintes sem gerar fadiga metabólica.',
      },
      {
        id: 'b-chk-estudos',
        type: 'checklist',
        content: 'Pontos Críticos para Aplicação Prática',
        items: [
          { id: 'pe-1', text: 'Aplicar somente no primeiro exercício composto do treino (ex: Supino, Agachamento)', done: true },
          { id: 'pe-2', text: 'Descansar de 2 a 3 minutos entre a PAP e a primeira série de trabalho', done: false },
          { id: 'pe-3', text: 'Nunca ir até a falha concêntrica na série de PAP', done: false },
        ],
      },
    ],
  },
];

function NotasPage() {
  const { reward } = useLifestyle();

  // Estado das Notas
  const [notes, setNotes] = useState<NoteDocument[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_NOTES;
  });

  const [activeNoteId, setActiveNoteId] = useState<string>(notes[0]?.id ?? 'n-3d');
  const [filterCategory, setFilterCategory] = useState<string>('Todas');
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileTab, setMobileTab] = useState<'list' | 'editor'>('editor');

  // Modal para criar nova nota
  const [isCreatingNote, setIsCreatingNote] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteCategory, setNewNoteCategory] = useState<'Geral' | 'Rotina' | 'Estudos' | 'Projetos'>('Projetos');

  // Modo Caneta / Stylus na Nota
  const [isPenActive, setIsPenActive] = useState(false);
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

  // Configuração do Canvas Stylus quando ativado
  useEffect(() => {
    if (isPenActive && canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.width = canvas.parentElement?.clientWidth || 800;
      canvas.height = 400;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#18181b';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        if (activeNote?.drawingDataUrl) {
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, 0, 0);
          };
          img.src = activeNote.drawingDataUrl;
        }
      }
    }
  }, [isPenActive, activeNoteId]);

  // Stylus Event Handlers
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

  // HANDLERS DE NOTA
  const handleCreateNote = () => {
    if (!newNoteTitle.trim()) return;
    const created: NoteDocument = {
      id: crypto.randomUUID(),
      title: newNoteTitle.trim(),
      category: newNoteCategory,
      updatedAt: new Date().toISOString(),
      blocks: [
        {
          id: crypto.randomUUID(),
          type: 'text',
          content: '',
        },
        {
          id: crypto.randomUUID(),
          type: 'checklist',
          content: 'Itens de Verificação',
          items: [
            { id: crypto.randomUUID(), text: 'Primeiro item do checklist', done: false },
          ],
        },
      ],
    };
    setNotes((prev) => [created, ...prev]);
    setActiveNoteId(created.id);
    setNewNoteTitle('');
    setIsCreatingNote(false);
    reward(10);
  };

  const handleDeleteNote = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (notes.length <= 1) {
      alert('Você deve manter pelo menos uma nota no seu workspace.');
      return;
    }
    const toDelete = notes.find((n) => n.id === id);
    if (!window.confirm(`Excluir a nota "${toDelete?.title}"?`)) return;
    const remaining = notes.filter((n) => n.id !== id);
    setNotes(remaining);
    if (activeNoteId === id) {
      setActiveNoteId(remaining[0].id);
    }
  };

  const handleUpdateTitle = (newTitle: string) => {
    setNotes((prev) =>
      prev.map((n) =>
        n.id === activeNoteId ? { ...n, title: newTitle, updatedAt: new Date().toISOString() } : n
      )
    );
  };

  // HANDLERS DE BLOCOS DENTRO DA NOTA
  const handleAddBlock = (type: ContentBlockType) => {
    if (!activeNote) return;
    let newBlock: NoteBlock;

    if (type === 'checklist') {
      newBlock = {
        id: crypto.randomUUID(),
        type: 'checklist',
        content: 'Novo Checklist',
        items: [
          { id: crypto.randomUUID(), text: '', done: false },
        ],
      };
    } else {
      newBlock = {
        id: crypto.randomUUID(),
        type,
        content: type === 'audio' ? 'Nota de áudio gravada' : '',
      };
    }

    setNotes((prev) =>
      prev.map((n) => {
        if (n.id !== activeNoteId) return n;
        return {
          ...n,
          updatedAt: new Date().toISOString(),
          blocks: [...n.blocks, newBlock],
        };
      })
    );
  };

  const handleUpdateBlockContent = (blockId: string, content: string) => {
    setNotes((prev) =>
      prev.map((n) => {
        if (n.id !== activeNoteId) return n;
        return {
          ...n,
          updatedAt: new Date().toISOString(),
          blocks: n.blocks.map((b) => (b.id === blockId ? { ...b, content } : b)),
        };
      })
    );
  };

  const handleDeleteBlock = (blockId: string) => {
    setNotes((prev) =>
      prev.map((n) => {
        if (n.id !== activeNoteId) return n;
        return {
          ...n,
          updatedAt: new Date().toISOString(),
          blocks: n.blocks.filter((b) => b.id !== blockId),
        };
      })
    );
  };

  // HANDLERS DO CHECKLIST DENTRO DA NOTA
  const handleToggleChecklistItem = (blockId: string, itemId: string) => {
    setNotes((prev) =>
      prev.map((n) => {
        if (n.id !== activeNoteId) return n;
        return {
          ...n,
          updatedAt: new Date().toISOString(),
          blocks: n.blocks.map((b) => {
            if (b.id !== blockId || !b.items) return b;
            return {
              ...b,
              items: b.items.map((it) => (it.id === itemId ? { ...it, done: !it.done } : it)),
            };
          }),
        };
      })
    );
  };

  const handleUpdateChecklistItemText = (blockId: string, itemId: string, text: string) => {
    setNotes((prev) =>
      prev.map((n) => {
        if (n.id !== activeNoteId) return n;
        return {
          ...n,
          updatedAt: new Date().toISOString(),
          blocks: n.blocks.map((b) => {
            if (b.id !== blockId || !b.items) return b;
            return {
              ...b,
              items: b.items.map((it) => (it.id === itemId ? { ...it, text } : it)),
            };
          }),
        };
      })
    );
  };

  const handleAddChecklistItemToBlock = (blockId: string, afterItemId?: string) => {
    setNotes((prev) =>
      prev.map((n) => {
        if (n.id !== activeNoteId) return n;
        return {
          ...n,
          updatedAt: new Date().toISOString(),
          blocks: n.blocks.map((b) => {
            if (b.id !== blockId) return b;
            const currentItems = b.items || [];
            const newItem: ChecklistItem = { id: crypto.randomUUID(), text: '', done: false };

            if (!afterItemId) {
              return { ...b, items: [...currentItems, newItem] };
            }

            const idx = currentItems.findIndex((it) => it.id === afterItemId);
            if (idx === -1) return { ...b, items: [...currentItems, newItem] };

            const updated = [...currentItems];
            updated.splice(idx + 1, 0, newItem);
            return { ...b, items: updated };
          }),
        };
      })
    );
  };

  const handleDeleteChecklistItemFromBlock = (blockId: string, itemId: string) => {
    setNotes((prev) =>
      prev.map((n) => {
        if (n.id !== activeNoteId) return n;
        return {
          ...n,
          updatedAt: new Date().toISOString(),
          blocks: n.blocks.map((b) => {
            if (b.id !== blockId || !b.items) return b;
            return {
              ...b,
              items: b.items.filter((it) => it.id !== itemId),
            };
          }),
        };
      })
    );
  };

  // Filtragem de notas para a Sidebar
  const filteredNotes = notes.filter((n) => {
    const matchCategory = filterCategory === 'Todas' ? true : n.category === filterCategory;
    const matchQuery = n.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchQuery;
  });

  // Estatísticas de Checklists na nota ativa
  const totalChecklistItemsInNote = activeNote?.blocks.reduce(
    (sum, b) => (b.type === 'checklist' && b.items ? sum + b.items.length : sum),
    0
  ) ?? 0;

  const completedChecklistItemsInNote = activeNote?.blocks.reduce(
    (sum, b) =>
      b.type === 'checklist' && b.items
        ? sum + b.items.filter((i) => i.done).length
        : sum,
    0
  ) ?? 0;

  const checklistPct =
    totalChecklistItemsInNote > 0
      ? Math.round((completedChecklistItemsInNote / totalChecklistItemsInNote) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
            <BookOpen size={13} /> Notion-Like Document Workspace
          </span>
          <h1 className="text-3xl font-extrabold md:text-4xl text-foreground">
            Notas & Checklists Integrados<span className="text-primary">.</span>
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Adicione texto contínuo, listas de tarefas com checkbox e esboços à mão livre dentro da mesma nota.
          </p>
        </div>

        <Button
          onClick={() => setIsCreatingNote(true)}
          className="bg-primary text-primary-foreground font-black hover:bg-primary/90 text-xs flex items-center gap-1.5"
        >
          <Plus size={15} /> + Nova Nota
        </Button>
      </div>

      {/* MODAL CRIAR NOVA NOTA */}
      {isCreatingNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="panel max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-black flex items-center gap-2 text-foreground">
                <Sparkles size={16} className="text-primary" /> Criar Nova Nota
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
                  Título da Nota:
                </label>
                <input
                  type="text"
                  placeholder="Ex: Calibração Impressora 3D, Rotina Noturna..."
                  value={newNoteTitle}
                  onChange={(e) => setNewNoteTitle(e.target.value)}
                  className="w-full text-xs"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">
                  Categoria / Pasta:
                </label>
                <select
                  value={newNoteCategory}
                  onChange={(e) => setNewNoteCategory(e.target.value as any)}
                  className="w-full text-xs rounded border border-border bg-background p-2"
                >
                  <option value="Projetos">Projetos & Engenharia</option>
                  <option value="Rotina">Rotina & Hábitos</option>
                  <option value="Estudos">Estudos & Ciência</option>
                  <option value="Geral">Geral & Ideias</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button variant="ghost" size="sm" onClick={() => setIsCreatingNote(false)} className="text-xs">
                Cancelar
              </Button>
              <Button onClick={handleCreateNote} size="sm" className="bg-primary text-primary-foreground font-bold text-xs">
                Criar Nota
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* SELETOR MOBILE ENTRE LISTA DE NOTAS E EDITOR */}
      <div className="flex md:hidden items-center gap-1.5 p-1 rounded-2xl bg-card border border-border/80 mb-4 shadow-sm">
        <button
          type="button"
          onClick={() => setMobileTab('list')}
          className={`flex-1 py-2 px-3 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            mobileTab === 'list'
              ? 'bg-primary text-primary-foreground shadow-md'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <FolderPlus size={13} />
          <span>Minhas Notas ({filteredNotes.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('editor')}
          className={`flex-1 py-2 px-3 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            mobileTab === 'editor'
              ? 'bg-primary text-primary-foreground shadow-md'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <FileText size={13} />
          <span>Editor da Nota</span>
        </button>
      </div>

      {/* GRID: SIDEBAR LATERAL + EDITOR COMPLETO NOTION-LIKE */}
      <div className="grid gap-6 md:grid-cols-[280px_1fr] items-start">
        {/* SIDEBAR LATERAL COM PÁGINAS E CATEGORIAS */}
        <div className={`panel p-4 space-y-4 ${mobileTab === 'editor' ? 'hidden md:block' : 'block'}`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
              <FolderPlus size={13} className="text-primary" /> Minhas Notas
            </span>
            <span className="text-[10px] text-muted-foreground font-mono">
              {filteredNotes.length} páginas
            </span>
          </div>

          {/* Busca Rápida */}
          <input
            type="text"
            placeholder="Filtrar notas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-[11px] py-1.5"
          />

          {/* Filtros de Categoria */}
          <div className="flex flex-wrap gap-1 border-b border-border/60 pb-3">
            {['Todas', 'Projetos', 'Rotina', 'Estudos', 'Geral'].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`rounded-md px-2 py-0.5 text-[10px] font-bold transition-all ${
                  filterCategory === cat
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Lista de Notas */}
          <div className="space-y-1 max-h-[550px] overflow-y-auto pr-1">
            {filteredNotes.map((note) => {
              const isActive = note.id === activeNoteId;
              const chkCount = note.blocks.reduce(
                (acc, b) => (b.type === 'checklist' && b.items ? acc + b.items.length : acc),
                0
              );

              return (
                <div
                  key={note.id}
                  onClick={() => {
                    setActiveNoteId(note.id);
                    setMobileTab('editor');
                  }}
                  className={`group flex cursor-pointer items-center justify-between rounded-xl p-2.5 text-xs transition-all ${
                    isActive
                      ? 'bg-primary/15 text-primary border border-primary/40 font-bold shadow-sm'
                      : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate min-w-0">
                    <FileText size={14} className={isActive ? 'text-primary' : 'text-muted-foreground'} />
                    <div className="truncate">
                      <div className="truncate font-semibold">{note.title}</div>
                      <span className="text-[9px] text-muted-foreground/80 block uppercase">
                        {note.category} {chkCount > 0 && `• ${chkCount} tarefas`}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
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

        {/* EDITOR CENTRAL: DOCUMENTO UNIFICADO (TEXTO + CHECKLISTS + TÍTULOS + CANETA) */}
        <div className={`panel p-4 sm:p-6 min-h-[500px] sm:min-h-[600px] space-y-6 ${mobileTab === 'list' ? 'hidden md:block' : 'block'}`}>
          {/* BOTÃO MOBILE: VOLTAR PARA LISTA DE NOTAS */}
          <div className="md:hidden flex items-center justify-between pb-2 border-b border-border/50">
            <button
              type="button"
              onClick={() => setMobileTab('list')}
              className="text-xs font-black text-primary flex items-center gap-1 cursor-pointer"
            >
              ← Ver todas as notas ({filteredNotes.length})
            </button>
            <span className="text-[10px] text-muted-foreground font-mono">
              {activeNote?.blocks.length} blocos
            </span>
          </div>

          {/* HEADER DA NOTA: TÍTULO EDITÁVEL + TAGS + BOTÃO MODO CANETA */}
          <div className="space-y-3 border-b border-border/70 pb-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="rounded bg-primary/20 text-primary text-[10px] font-bold px-2 py-0.5 uppercase">
                  {activeNote?.category}
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">
                  {activeNote?.blocks.length} blocos no documento
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Botão Modo Caneta / Stylus */}
                <Button
                  variant={isPenActive ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setIsPenActive(!isPenActive)}
                  className={`text-xs h-7 flex items-center gap-1.5 ${
                    isPenActive ? 'bg-primary text-primary-foreground font-bold' : ''
                  }`}
                >
                  <PenTool size={13} /> {isPenActive ? 'Ocultar Caneta' : 'Rabiscar / Stylus'}
                </Button>
              </div>
            </div>

            {/* Input de Título Principal da Nota */}
            <input
              type="text"
              value={activeNote?.title || ''}
              onChange={(e) => handleUpdateTitle(e.target.value)}
              placeholder="Título da Página..."
              className="w-full border-0 bg-transparent text-2xl md:text-3xl font-black text-foreground focus:ring-0 p-0 tracking-tight"
            />

            {/* Resumo de Progresso se houver itens de checklist na nota */}
            {totalChecklistItemsInNote > 0 && (
              <div className="flex items-center justify-between rounded-lg bg-primary/5 border border-primary/20 px-3 py-1.5 text-[11px] font-mono">
                <span className="text-muted-foreground flex items-center gap-1.5 font-bold">
                  <CheckSquare size={13} className="text-primary" /> Checklist da Nota:
                </span>
                <span className="text-primary font-bold">
                  {completedChecklistItemsInNote} de {totalChecklistItemsInNote} itens concluídos ({checklistPct}%)
                </span>
              </div>
            )}
          </div>

          {/* BARRA DE AÇÕES: INSERIR BLOCOS DENTRO DA NOTA */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/80 bg-background/80 p-2.5">
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-[11px] font-bold text-muted-foreground mr-1.5">+ Inserir na Nota:</span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddBlock('checklist')}
                className="text-xs h-7 font-bold border-primary/40 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all"
              >
                <CheckSquare size={13} className="mr-1 text-primary" /> + Checklist / Tarefas
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleAddBlock('text')}
                className="text-xs h-7 text-foreground hover:bg-muted"
              >
                <FileText size={13} className="mr-1 text-muted-foreground" /> Parágrafo
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleAddBlock('h1')}
                className="text-xs h-7 text-foreground hover:bg-muted"
              >
                <Heading1 size={13} className="mr-1 text-muted-foreground" /> Título H1
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleAddBlock('h2')}
                className="text-xs h-7 text-foreground hover:bg-muted"
              >
                <Heading2 size={13} className="mr-1 text-muted-foreground" /> Subtítulo H2
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleAddBlock('audio')}
                className="text-xs h-7 text-foreground hover:bg-muted"
              >
                <Mic size={13} className="mr-1 text-muted-foreground" /> Áudio
              </Button>
            </div>
          </div>

          {/* SE O MODO CANETA (STYLUS) ESTIVER ATIVO NESTA NOTA */}
          {isPenActive && (
            <div className="space-y-3 rounded-2xl border border-primary/40 bg-zinc-950 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
                    <Palette size={13} /> Cor:
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
                        penColor === c.color && !isEraser ? 'scale-125 ring-2 ring-primary' : ''
                      }`}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-muted-foreground">Traço:</span>
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
                    className="text-xs h-6"
                  >
                    <Eraser size={12} className="mr-1" /> Borracha
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearStylusCanvas}
                    className="text-xs h-6 text-destructive hover:bg-destructive/10"
                  >
                    Limpar
                  </Button>
                </div>
              </div>

              <canvas
                ref={canvasRef}
                onPointerDown={startDrawing}
                onPointerMove={draw}
                onPointerUp={stopDrawing}
                onPointerLeave={stopDrawing}
                className="w-full h-80 cursor-crosshair rounded-xl touch-none bg-zinc-900 border border-zinc-800"
              />
            </div>
          )}

          {/* RENDERIZADOR DE BLOCOS MISTOS DA NOTA (TEXTO + CHECKLISTS + ETC.) */}
          <div className="space-y-4 pt-2">
            {activeNote?.blocks.map((block) => {
              // 1. BLOCO DE CHECKLIST INTERATIVO DENTRO DA NOTA
              if (block.type === 'checklist') {
                return (
                  <div
                    key={block.id}
                    className="group rounded-2xl border border-primary/30 bg-primary/5 p-4 space-y-3 transition-all hover:border-primary/50"
                  >
                    <div className="flex items-center justify-between border-b border-primary/20 pb-2">
                      <div className="flex items-center gap-2 flex-1">
                        <CheckSquare size={16} className="text-primary shrink-0" />
                        <input
                          type="text"
                          value={block.content}
                          onChange={(e) => handleUpdateBlockContent(block.id, e.target.value)}
                          placeholder="Título do Checklist (ex: Etapas de Verificação)..."
                          className="border-0 bg-transparent text-sm font-black text-foreground focus:ring-0 p-0 flex-1"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleAddChecklistItemToBlock(block.id)}
                          className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1"
                        >
                          <Plus size={12} /> Item
                        </button>
                        <button
                          onClick={() => handleDeleteBlock(block.id)}
                          title="Remover checklist"
                          className="opacity-60 hover:opacity-100 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* ITENS DO CHECKLIST */}
                    <div className="space-y-2 pt-1">
                      {block.items?.map((item) => (
                        <div
                          key={item.id}
                          className={`flex items-center gap-2.5 rounded-xl border p-2.5 transition-all ${
                            item.done
                              ? 'border-emerald-500/30 bg-emerald-500/10 text-muted-foreground'
                              : 'border-border/70 bg-background/90 hover:border-primary/50'
                          }`}
                        >
                          {/* Checkbox Clicável */}
                          <button
                            type="button"
                            onClick={() => handleToggleChecklistItem(block.id, item.id)}
                            className="shrink-0 transition-transform active:scale-90"
                          >
                            {item.done ? (
                              <CheckCircle2 size={18} className="text-emerald-400" />
                            ) : (
                              <Circle size={18} className="text-muted-foreground hover:text-primary" />
                            )}
                          </button>

                          {/* Input de Texto do Item (Apertar Enter cria nova linha automaticamente!) */}
                          <input
                            type="text"
                            value={item.text}
                            onChange={(e) => handleUpdateChecklistItemText(block.id, item.id, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddChecklistItemToBlock(block.id, item.id);
                              } else if (e.key === 'Backspace' && item.text === '' && (block.items?.length || 0) > 1) {
                                e.preventDefault();
                                handleDeleteChecklistItemFromBlock(block.id, item.id);
                              }
                            }}
                            placeholder="Digite a tarefa e pressione [Enter]..."
                            className={`border-0 bg-transparent text-xs text-foreground focus:ring-0 p-0 flex-1 ${
                              item.done ? 'line-through text-muted-foreground/80' : 'font-medium'
                            }`}
                          />

                          <button
                            onClick={() => handleDeleteChecklistItemFromBlock(block.id, item.id)}
                            title="Remover item"
                            className="opacity-40 hover:opacity-100 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => handleAddChecklistItemToBlock(block.id)}
                      className="text-[11px] font-semibold text-muted-foreground hover:text-primary flex items-center gap-1.5 pt-1"
                    >
                      <Plus size={13} /> + Adicionar nova tarefa a este checklist
                    </button>
                  </div>
                );
              }

              // 2. BLOCO DE TÍTULO H1
              if (block.type === 'h1') {
                return (
                  <div key={block.id} className="group relative flex items-center gap-2 border-b border-border/40 pb-1">
                    <input
                      type="text"
                      value={block.content}
                      onChange={(e) => handleUpdateBlockContent(block.id, e.target.value)}
                      placeholder="Título H1..."
                      className="border-0 bg-transparent text-xl md:text-2xl font-black text-foreground focus:ring-0 p-0 flex-1"
                    />
                    <button
                      onClick={() => handleDeleteBlock(block.id)}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive text-xs"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              }

              // 3. BLOCO DE SUBTÍTULO H2
              if (block.type === 'h2') {
                return (
                  <div key={block.id} className="group relative flex items-center gap-2 pt-2">
                    <input
                      type="text"
                      value={block.content}
                      onChange={(e) => handleUpdateBlockContent(block.id, e.target.value)}
                      placeholder="Subtítulo H2..."
                      className="border-0 bg-transparent text-lg font-bold text-foreground focus:ring-0 p-0 flex-1"
                    />
                    <button
                      onClick={() => handleDeleteBlock(block.id)}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive text-xs"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              }

              // 4. BLOCO DE ÁUDIO
              if (block.type === 'audio') {
                return (
                  <div
                    key={block.id}
                    className="group relative flex items-center justify-between rounded-xl border border-primary/30 bg-primary/5 p-3.5"
                  >
                    <div className="flex items-center gap-3">
                      <button className="grid size-9 place-items-center rounded-full bg-primary text-primary-foreground">
                        <Play size={15} fill="currentColor" />
                      </button>
                      <div>
                        <div className="text-xs font-bold text-foreground">
                          {block.content}
                        </div>
                        <div className="flex items-center gap-1 mt-1.5 h-3">
                          {[40, 70, 30, 90, 60, 100, 45, 80, 20, 50, 75, 40].map((h, i) => (
                            <span key={i} style={{ height: `${h}%` }} className="w-1 rounded-full bg-primary/70" />
                          ))}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteBlock(block.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              }

              // 5. BLOCO DE TEXTO / PARÁGRAFO
              return (
                <div key={block.id} className="group relative flex items-start gap-2">
                  <textarea
                    rows={2}
                    value={block.content}
                    onChange={(e) => handleUpdateBlockContent(block.id, e.target.value)}
                    placeholder="Digite seu texto, notas de projeto ou use formatação rápida..."
                    className="w-full rounded-xl border border-border/80 bg-background/60 p-3 font-sans text-xs leading-relaxed text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-y"
                  />
                  <button
                    onClick={() => handleDeleteBlock(block.id)}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive text-xs mt-2"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Dica de usabilidade */}
          <div className="pt-6 border-t border-border/40 text-[11px] text-muted-foreground flex items-center justify-between">
            <span>💡 Dica: Pressione <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-[10px] text-foreground">Enter</kbd> dentro de um item de checklist para criar a próxima tarefa automaticamente.</span>
            <span className="font-mono text-[10px] text-emerald-400">Salvo automaticamente</span>
          </div>
        </div>
      </div>
    </div>
  );
}
