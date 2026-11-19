// ============================================================
// database.ts — ObraCalculada type definitions
// ============================================================
// Interfaces marked [BACKEND] map 1-to-1 to Supabase tables.
// Interfaces marked [FRONTEND] are managed locally (localStorage)
// and have no corresponding backend table.
// ============================================================

// ----------------------------------------------------------------
// [BACKEND] projects
// ----------------------------------------------------------------
export interface Project {
  id: string;
  owner_id: string;
  name: string;
  description?: string;
  status: 'planejamento' | 'em_andamento' | 'pausado' | 'concluido';
  initial_budget: number;
  start_date?: string;
  address?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string;
}

// ----------------------------------------------------------------
// [BACKEND] tasks
// ----------------------------------------------------------------
export interface Task {
  id: string;
  user_id: string;
  project_id: string;
  title: string;
  due_date?: string;
  created_at?: string;
}

// ----------------------------------------------------------------
// [BACKEND] price_records
// ----------------------------------------------------------------
export interface PriceRecord {
  id: string;
  user_id: string;
  product_name: string;
  brand?: string;
  store_name?: string;
  price: number;
  quantity: number;
  unit: string;
  created_at?: string;
}

// ----------------------------------------------------------------
// [BACKEND] floor_plans
// ----------------------------------------------------------------
export interface FloorPlan {
  id: string;
  user_id: string;
  project_id: string;
  name: string;
  created_at?: string;
}

// ----------------------------------------------------------------
// [BACKEND] ai_conversations
// ----------------------------------------------------------------
export interface AIConversation {
  id: string;
  user_id: string;
  title: string;
  project_id?: string;
  created_at?: string;
}

// ----------------------------------------------------------------
// [BACKEND] ai_messages
// ----------------------------------------------------------------
export interface AIMessage {
  id: string;
  conversation_id: string;
  user_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at?: string;
}

// ----------------------------------------------------------------
// [FRONTEND] Expense — stored in localStorage per project
// ----------------------------------------------------------------
export interface Expense {
  id: string;
  user_id: string;
  project_id: string;
  description: string;
  amount: number;
  category: string;
  expense_date: string;
  created_at?: string;
}

// ----------------------------------------------------------------
// [FRONTEND] ShoppingListItem — stored in localStorage per project
// ----------------------------------------------------------------
export interface ShoppingListItem {
  id: string;
  user_id: string;
  project_id: string;
  name: string;
  quantity: number;
  unit: string;
  unit_price: number;
  category?: string;
  is_purchased: boolean;
  created_at?: string;
}

// ----------------------------------------------------------------
// [FRONTEND] CalculationRecord — stored in localStorage per project
// ----------------------------------------------------------------
export interface CalculationRecord {
  id: string;
  user_id: string;
  project_id: string;
  calculator_type: string;
  title: string;
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown>;
  created_at?: string;
}

// ----------------------------------------------------------------
// [FRONTEND] Checklist / ChecklistItem — stored in localStorage
// ----------------------------------------------------------------
export interface ChecklistItem {
  id: string;
  checklist_id: string;
  text: string;
  is_done: boolean;
  created_at?: string;
}

export interface Checklist {
  id: string;
  user_id: string;
  project_id: string;
  title: string;
  items: ChecklistItem[];
  created_at?: string;
  updated_at?: string;
}

// ----------------------------------------------------------------
// [FRONTEND] Stage — project stage/phase, stored in localStorage
// ----------------------------------------------------------------
export interface Stage {
  id: string;
  project_id: string;
  name: string;
  description?: string;
  order: number;
  status: 'pendente' | 'em_andamento' | 'concluido';
  start_date?: string;
  end_date?: string;
  created_at?: string;
  updated_at?: string;
}

// ----------------------------------------------------------------
// [FRONTEND] PriceComparison — derived from PriceRecord entries
// ----------------------------------------------------------------
export interface PriceComparison {
  id: string;
  user_id: string;
  product_name: string;
  records: PriceRecord[];
  best_price?: number;
  best_store?: string;
  created_at?: string;
}
