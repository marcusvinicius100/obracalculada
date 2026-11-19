import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Plus,
  Save,
  Trash2,
  Edit2,
  DoorOpen,
  Square,
  AlertTriangle,
  LayoutGrid,
  X,
  Check,
  Move,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

type ElementKind = 'door' | 'window';
type Side = 'top' | 'right' | 'bottom' | 'left';

interface RoomElement {
  id: string;
  kind: ElementKind;
  roomId: string;
  side: Side;
  /** position along the side, 0–1 (normalized) */
  position: number;
}

interface Room {
  id: string;
  name: string;
  /** SVG canvas units (1 unit = 1 m) */
  x: number;
  y: number;
  width: number;   // metres
  height: number;  // metres
  color: string;
}

interface FloorPlanData {
  id: string;
  name: string;
  rooms: Room[];
  elements: RoomElement[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SCALE = 60; // px per metre
const GRID  = 1;  // 1 m grid snap

const ROOM_COLORS = [
  '#E8F5ED', '#D1FAE5', '#A7F3D0', '#6EE7B7',
  '#FEF3C7', '#FDE68A', '#FECACA', '#E0E7FF',
];

const DEFAULT_PLAN: FloorPlanData = {
  id: `fp_${Date.now()}`,
  name: 'Nova Planta',
  rooms: [],
  elements: [],
};

function genId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function snap(v: number, g: number = GRID) {
  return Math.round(v / g) * g;
}

function localKey(id: string) {
  return `obracalculada_floorplan_${id}`;
}

// ─── Room Edit Modal ──────────────────────────────────────────────────────────

interface RoomModalProps {
  room: Room;
  onSave: (r: Room) => void;
  onClose: () => void;
  onDelete: (id: string) => void;
}

function RoomModal({ room, onSave, onClose, onDelete }: RoomModalProps) {
  const [name, setName]     = useState(room.name);
  const [width, setWidth]   = useState(room.width.toString());
  const [height, setHeight] = useState(room.height.toString());

  const handleSave = () => {
    const w = parseFloat(width);
    const h = parseFloat(height);
    if (!name.trim() || isNaN(w) || isNaN(h) || w <= 0 || h <= 0) return;
    onSave({ ...room, name: name.trim(), width: w, height: h });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold" style={{ color: '#145C3B' }}>
            Editar Cômodo
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
              style={{ '--tw-ring-color': '#198754' } as React.CSSProperties}
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex: Sala, Quarto, Cozinha..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Largura (m)
              </label>
              <input
                type="number"
                min="0.5"
                step="0.1"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none"
                value={width}
                onChange={e => setWidth(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Comprimento (m)
              </label>
              <input
                type="number"
                min="0.5"
                step="0.1"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none"
                value={height}
                onChange={e => setHeight(e.target.value)}
              />
            </div>
          </div>

          <p className="text-xs text-gray-500">
            Área: <strong>{(parseFloat(width || '0') * parseFloat(height || '0')).toFixed(2)} m²</strong>
          </p>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <button
            onClick={() => { onDelete(room.id); onClose(); }}
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 border border-red-200"
          >
            <Trash2 size={14} /> Excluir
          </button>
          <div className="flex-1" />
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 border"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm text-white"
            style={{ background: '#198754' }}
          >
            <Check size={14} /> Salvar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function FloorPlanPage() {
  const [plan, setPlan]             = useState<FloorPlanData>(DEFAULT_PLAN);
  const [planName, setPlanName]     = useState(DEFAULT_PLAN.name);
  const [editingName, setEditingName] = useState(false);

  const [tool, setTool]             = useState<'select' | 'room' | 'door' | 'window'>('select');
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [editRoom, setEditRoom]     = useState<Room | null>(null);

  // drawing state
  const [drawing, setDrawing]       = useState(false);
  const [drawStart, setDrawStart]   = useState({ x: 0, y: 0 });
  const [drawCurrent, setDrawCurrent] = useState({ x: 0, y: 0 });

  // drag state
  const [dragging, setDragging]     = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const svgRef = useRef<SVGSVGElement>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(localKey(plan.id));
    if (saved) {
      try {
        const loaded: FloorPlanData = JSON.parse(saved);
        setPlan(loaded);
        setPlanName(loaded.name);
      } catch { /* ignore */ }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── SVG coords helper ──────────────────────────────────────────────────────
  const svgPoint = useCallback((e: React.MouseEvent): { x: number; y: number } => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const transformed = pt.matrixTransform(svg.getScreenCTM()!.inverse());
    return {
      x: snap(transformed.x / SCALE),
      y: snap(transformed.y / SCALE),
    };
  }, []);

  // ─── Computed ───────────────────────────────────────────────────────────────
  const totalArea = plan.rooms.reduce((acc, r) => acc + r.width * r.height, 0);

  // ─── Save ───────────────────────────────────────────────────────────────────
  const handleSave = () => {
    const updated = { ...plan, name: planName };
    setPlan(updated);
    localStorage.setItem(localKey(updated.id), JSON.stringify(updated));
    alert('Planta salva com sucesso no armazenamento local!');
  };

  // ─── Mouse handlers (room drawing) ─────────────────────────────────────────
  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (e.button !== 0) return;
    if (tool === 'room') {
      const pt = svgPoint(e);
      setDrawStart(pt);
      setDrawCurrent(pt);
      setDrawing(true);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (tool === 'room' && drawing) {
      setDrawCurrent(svgPoint(e));
    }
    if (dragging) {
      const pt = svgPoint(e);
      setPlan(prev => ({
        ...prev,
        rooms: prev.rooms.map(r =>
          r.id === dragging
            ? { ...r, x: snap(pt.x - dragOffset.x), y: snap(pt.y - dragOffset.y) }
            : r
        ),
      }));
    }
  };

  const handleMouseUp = (e: React.MouseEvent<SVGSVGElement>) => {
    if (tool === 'room' && drawing) {
      setDrawing(false);
      const pt = svgPoint(e);
      const rawW = pt.x - drawStart.x;
      const rawH = pt.y - drawStart.y;
      const w = Math.abs(rawW);
      const h = Math.abs(rawH);
      if (w >= 0.5 && h >= 0.5) {
        const newRoom: Room = {
          id:     genId(),
          name:   `Cômodo ${plan.rooms.length + 1}`,
          x:      rawW >= 0 ? drawStart.x : pt.x,
          y:      rawH >= 0 ? drawStart.y : pt.y,
          width:  w,
          height: h,
          color:  ROOM_COLORS[plan.rooms.length % ROOM_COLORS.length],
        };
        setPlan(prev => ({ ...prev, rooms: [...prev.rooms, newRoom] }));
        setSelectedRoom(newRoom.id);
        setEditRoom(newRoom);
      }
    }
    if (dragging) setDragging(null);
  };

  // ─── Room click (select / add element) ─────────────────────────────────────
  const handleRoomClick = (e: React.MouseEvent, room: Room) => {
    e.stopPropagation();
    if (tool === 'select') {
      setSelectedRoom(room.id);
    }
    if (tool === 'door' || tool === 'window') {
      // determine nearest side
      const svg = svgRef.current!;
      const pt  = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const local = pt.matrixTransform(svg.getScreenCTM()!.inverse());
      const rx = room.x * SCALE;
      const ry = room.y * SCALE;
      const rw = room.width  * SCALE;
      const rh = room.height * SCALE;
      const mx = local.x;
      const my = local.y;

      const dists: { side: Side; d: number; pos: number }[] = [
        { side: 'top',    d: Math.abs(my - ry),       pos: (mx - rx) / rw },
        { side: 'bottom', d: Math.abs(my - (ry + rh)), pos: (mx - rx) / rw },
        { side: 'left',   d: Math.abs(mx - rx),        pos: (my - ry) / rh },
        { side: 'right',  d: Math.abs(mx - (rx + rw)), pos: (my - ry) / rh },
      ];
      const nearest = dists.sort((a, b) => a.d - b.d)[0];
      const el: RoomElement = {
        id:       genId(),
        kind:     tool === 'door' ? 'door' : 'window',
        roomId:   room.id,
        side:     nearest.side,
        position: Math.max(0.1, Math.min(0.9, nearest.pos)),
      };
      setPlan(prev => ({ ...prev, elements: [...prev.elements, el] }));
    }
  };

  const handleRoomDoubleClick = (e: React.MouseEvent, room: Room) => {
    e.stopPropagation();
    setEditRoom(room);
  };

  const handleRoomMouseDown = (e: React.MouseEvent, room: Room) => {
    if (tool !== 'select') return;
    e.stopPropagation();
    const pt = svgPoint(e);
    setDragging(room.id);
    setDragOffset({ x: pt.x - room.x, y: pt.y - room.y });
  };

  // ─── Background click — deselect ────────────────────────────────────────────
  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (tool === 'select') setSelectedRoom(null);
  };

  // ─── Render element (door / window) ────────────────────────────────────────
  const renderElement = (el: RoomElement, room: Room) => {
    const rx = room.x * SCALE;
    const ry = room.y * SCALE;
    const rw = room.width  * SCALE;
    const rh = room.height * SCALE;
    const size = 24; // px symbol size

    let x1 = 0, y1 = 0, x2 = 0, y2 = 0;
    let x3 = 0, y3 = 0, x4 = 0, y4 = 0; // second line for window

    switch (el.side) {
      case 'top':
        x1 = rx + el.position * rw - size / 2; y1 = ry;
        x2 = x1 + size;                        y2 = ry;
        x3 = x1; y3 = ry - 4; x4 = x2; y4 = ry - 4;
        break;
      case 'bottom':
        x1 = rx + el.position * rw - size / 2; y1 = ry + rh;
        x2 = x1 + size;                        y2 = ry + rh;
        x3 = x1; y3 = ry + rh + 4; x4 = x2; y4 = ry + rh + 4;
        break;
      case 'left':
        x1 = rx; y1 = ry + el.position * rh - size / 2;
        x2 = rx; y2 = y1 + size;
        x3 = rx - 4; y3 = y1; x4 = rx - 4; y4 = y2;
        break;
      case 'right':
        x1 = rx + rw; y1 = ry + el.position * rh - size / 2;
        x2 = rx + rw; y2 = y1 + size;
        x3 = rx + rw + 4; y3 = y1; x4 = rx + rw + 4; y4 = y2;
        break;
    }

    if (el.kind === 'door') {
      return (
        <g key={el.id} className="cursor-pointer" onClick={e => {
          e.stopPropagation();
          setPlan(prev => ({ ...prev, elements: prev.elements.filter(x => x.id !== el.id) }));
        }}>
          <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#F28C28" strokeWidth={4} strokeLinecap="round" />
        </g>
      );
    }
    // window — double line
    return (
      <g key={el.id} className="cursor-pointer" onClick={e => {
        e.stopPropagation();
        setPlan(prev => ({ ...prev, elements: prev.elements.filter(x => x.id !== el.id) }));
      }}>
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#198754" strokeWidth={3} strokeLinecap="round" />
        <line x1={x3} y1={y3} x2={x4} y2={y4} stroke="#198754" strokeWidth={3} strokeLinecap="round" />
      </g>
    );
  };

  // ─── Render preview rect while drawing ─────────────────────────────────────
  const previewRect = drawing ? (() => {
    const x = Math.min(drawStart.x, drawCurrent.x) * SCALE;
    const y = Math.min(drawStart.y, drawCurrent.y) * SCALE;
    const w = Math.abs(drawCurrent.x - drawStart.x) * SCALE;
    const h = Math.abs(drawCurrent.y - drawStart.y) * SCALE;
    return <rect x={x} y={y} width={w} height={h} fill="#E8F5ED" stroke="#198754" strokeWidth={2} strokeDasharray="6 3" rx={2} />;
  })() : null;

  // ─── Grid lines ────────────────────────────────────────────────────────────
  const SVG_W = 1200;
  const SVG_H = 700;
  const gridLines: React.ReactNode[] = [];
  for (let x = 0; x <= SVG_W; x += SCALE) {
    gridLines.push(<line key={`vg${x}`} x1={x} y1={0} x2={x} y2={SVG_H} stroke="#e5e7eb" strokeWidth={0.5} />);
  }
  for (let y = 0; y <= SVG_H; y += SCALE) {
    gridLines.push(<line key={`hg${y}`} x1={0} y1={y} x2={SVG_W} y2={y} stroke="#e5e7eb" strokeWidth={0.5} />);
  }

  // ─── Toolbar button helper ──────────────────────────────────────────────────
  const ToolBtn = ({
    id, label, icon, active,
  }: { id: typeof tool; label: string; icon: React.ReactNode; active: boolean }) => (
    <button
      onClick={() => { setTool(id); setSelectedRoom(null); }}
      title={label}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
        active
          ? 'text-white border-transparent shadow'
          : 'text-gray-700 border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50'
      }`}
      style={active ? { background: '#198754', borderColor: '#198754' } : {}}
    >
      {icon} {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b shadow-sm px-6 py-4">
        <div className="max-w-screen-xl mx-auto flex flex-col gap-4">
          {/* Title row */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ background: '#E8F5ED' }}>
                <LayoutGrid size={22} style={{ color: '#145C3B' }} />
              </div>
              {editingName ? (
                <input
                  autoFocus
                  className="text-xl font-bold border-b-2 outline-none px-1"
                  style={{ color: '#145C3B', borderColor: '#198754' }}
                  value={planName}
                  onChange={e => setPlanName(e.target.value)}
                  onBlur={() => setEditingName(false)}
                  onKeyDown={e => { if (e.key === 'Enter') setEditingName(false); }}
                />
              ) : (
                <button
                  className="flex items-center gap-2 group"
                  onClick={() => setEditingName(true)}
                >
                  <h1 className="text-xl font-bold" style={{ color: '#145C3B' }}>{planName}</h1>
                  <Edit2 size={14} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg">
                Área total: <strong>{totalArea.toFixed(2)} m²</strong>
                {' '}| Cômodos: <strong>{plan.rooms.length}</strong>
              </div>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white shadow-sm hover:opacity-90 transition"
                style={{ background: '#145C3B' }}
              >
                <Save size={15} /> Salvar
              </button>
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-500 uppercase tracking-wide mr-1">Ferramenta:</span>
            <ToolBtn id="select" label="Selecionar / Mover" icon={<Move size={15} />} active={tool === 'select'} />
            <ToolBtn id="room"   label="Novo Cômodo"        icon={<Plus size={15} />}  active={tool === 'room'} />
            <ToolBtn id="door"   label="Porta"              icon={<DoorOpen size={15} />} active={tool === 'door'} />
            <ToolBtn id="window" label="Janela"             icon={<Square size={15} />}  active={tool === 'window'} />

            {selectedRoom && tool === 'select' && (
              <>
                <div className="w-px h-6 bg-gray-200 mx-1" />
                <button
                  onClick={() => {
                    const r = plan.rooms.find(r => r.id === selectedRoom);
                    if (r) setEditRoom(r);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-gray-200 bg-white hover:bg-gray-50"
                >
                  <Edit2 size={14} /> Editar cômodo
                </button>
                <button
                  onClick={() => {
                    setPlan(prev => ({
                      ...prev,
                      rooms:    prev.rooms.filter(r => r.id !== selectedRoom),
                      elements: prev.elements.filter(e => e.roomId !== selectedRoom),
                    }));
                    setSelectedRoom(null);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-red-200 text-red-600 hover:bg-red-50"
                >
                  <Trash2 size={14} /> Excluir
                </button>
              </>
            )}

            {(tool === 'door' || tool === 'window') && (
              <span className="text-xs text-gray-500 ml-2 italic">
                Clique na borda de um cômodo para adicionar. Clique no elemento para remover.
              </span>
            )}
            {tool === 'room' && (
              <span className="text-xs text-gray-500 ml-2 italic">
                Clique e arraste no canvas para desenhar um cômodo.
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Warning banner */}
      <div className="px-6 pt-3 max-w-screen-xl mx-auto w-full">
        <div className="flex items-start gap-3 p-3 rounded-lg border text-sm"
          style={{ background: '#FFF7ED', borderColor: '#F28C28' }}>
          <AlertTriangle size={18} className="mt-0.5 shrink-0" style={{ color: '#F28C28' }} />
          <p style={{ color: '#7C3D04' }}>
            <strong>Aviso:</strong> Esta ferramenta é apenas para <strong>visualização e estimativa de áreas</strong>.
            NÃO substitui projeto arquitetônico ou estrutural assinado por profissional habilitado (CAU/CREA).
          </p>
        </div>
      </div>

      {/* Canvas area */}
      <div className="flex-1 overflow-auto px-6 py-4 max-w-screen-xl mx-auto w-full">
        <div className="bg-white rounded-xl border shadow-sm overflow-auto"
          style={{ cursor: tool === 'room' ? 'crosshair' : tool === 'select' ? 'default' : 'cell' }}>
          <svg
            ref={svgRef}
            width={SVG_W}
            height={SVG_H}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onClick={handleSvgClick}
            style={{ display: 'block', userSelect: 'none' }}
          >
            {/* Grid */}
            {gridLines}

            {/* Rooms */}
            {plan.rooms.map(room => {
              const isSelected = room.id === selectedRoom;
              return (
                <g key={room.id}>
                  <rect
                    x={room.x * SCALE}
                    y={room.y * SCALE}
                    width={room.width  * SCALE}
                    height={room.height * SCALE}
                    fill={room.color}
                    stroke={isSelected ? '#145C3B' : '#198754'}
                    strokeWidth={isSelected ? 3 : 2}
                    rx={3}
                    className="cursor-pointer"
                    onMouseDown={e => handleRoomMouseDown(e, room)}
                    onClick={e => handleRoomClick(e, room)}
                    onDoubleClick={e => handleRoomDoubleClick(e, room)}
                  />
                  {/* Room label */}
                  <text
                    x={(room.x + room.width / 2) * SCALE}
                    y={(room.y + room.height / 2) * SCALE - 8}
                    textAnchor="middle"
                    fontSize={12}
                    fontWeight="600"
                    fill="#145C3B"
                    style={{ pointerEvents: 'none' }}
                  >
                    {room.name}
                  </text>
                  <text
                    x={(room.x + room.width / 2) * SCALE}
                    y={(room.y + room.height / 2) * SCALE + 10}
                    textAnchor="middle"
                    fontSize={10}
                    fill="#198754"
                    style={{ pointerEvents: 'none' }}
                  >
                    {room.width.toFixed(1)}m × {room.height.toFixed(1)}m = {(room.width * room.height).toFixed(2)}m²
                  </text>

                  {/* Selection handles */}
                  {isSelected && [
                    [room.x * SCALE,                           room.y * SCALE],
                    [(room.x + room.width) * SCALE,            room.y * SCALE],
                    [room.x * SCALE,                           (room.y + room.height) * SCALE],
                    [(room.x + room.width) * SCALE,            (room.y + room.height) * SCALE],
                  ].map(([cx, cy], i) => (
                    <circle key={i} cx={cx} cy={cy} r={5} fill="#145C3B" stroke="white" strokeWidth={2} style={{ pointerEvents: 'none' }} />
                  ))}
                </g>
              );
            })}

            {/* Elements (doors/windows) */}
            {plan.elements.map(el => {
              const room = plan.rooms.find(r => r.id === el.roomId);
              if (!room) return null;
              return renderElement(el, room);
            })}

            {/* Drawing preview */}
            {previewRect}
          </svg>

          {/* Empty state overlay */}
          {plan.rooms.length === 0 && !drawing && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
              style={{ top: 0, left: 0, right: 0, bottom: 0, position: 'relative', marginTop: -SVG_H }}>
              <div className="bg-white/90 rounded-2xl p-8 flex flex-col items-center gap-3 shadow-sm border border-dashed"
                style={{ borderColor: '#198754' }}>
                <LayoutGrid size={40} style={{ color: '#198754', opacity: 0.5 }} />
                <p className="text-gray-500 font-medium text-center">
                  Nenhum cômodo ainda
                </p>
                <p className="text-sm text-gray-400 text-center max-w-xs">
                  Selecione a ferramenta <strong>Novo Cômodo</strong>, depois clique e arraste no canvas para começar a planta.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="mt-3 flex items-center gap-6 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <div className="w-5 h-1 rounded" style={{ background: '#F28C28' }} />
            <span>Porta (clique na borda)</span>
          </div>
          <div className="flex items-center gap-2 flex-col">
            <div className="flex gap-0.5">
              <div className="w-5 h-0.5 rounded" style={{ background: '#198754' }} />
            </div>
            <div className="flex gap-0.5">
              <div className="w-5 h-0.5 rounded" style={{ background: '#198754' }} />
            </div>
          </div>
          <span>Janela (linha dupla)</span>
          <div className="flex items-center gap-2 ml-4">
            <span>1 quadrado = 1 m</span>
          </div>
          <div className="ml-auto text-gray-400 italic">
            Duplo-clique em um cômodo para editar | Clique em porta/janela para remover
          </div>
        </div>
      </div>

      {/* Edit modal */}
      {editRoom && (
        <RoomModal
          room={editRoom}
          onSave={updated => {
            setPlan(prev => ({
              ...prev,
              rooms: prev.rooms.map(r => r.id === updated.id ? updated : r),
            }));
            setEditRoom(null);
          }}
          onClose={() => setEditRoom(null)}
          onDelete={id => {
            setPlan(prev => ({
              ...prev,
              rooms:    prev.rooms.filter(r => r.id !== id),
              elements: prev.elements.filter(e => e.roomId !== id),
            }));
            setSelectedRoom(null);
          }}
        />
      )}
    </div>
  );
}
