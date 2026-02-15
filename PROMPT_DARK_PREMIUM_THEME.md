# 🎨 Dark Premium SaaS Theme - Azul/Roxo

> Prompt completo para replicar o estilo de design dark mode premium com paleta azul e roxo.

---

## 📌 Descrição do Estilo

Criar um tema **dark mode premium** para aplicação SaaS com paleta de cores **azul e roxo**. O design deve ser moderno, elegante e profissional, com elementos visuais como:
- Glassmorphism (blur + transparência)
- Gradientes sutis
- Animações suaves
- Sombras coloridas

---

## 🎨 Paleta de Cores

### Backgrounds (Tons escuros de azul)
```css
--background: hsl(222, 47%, 6%);         /* #0a0e17 - Fundo principal */
--surface: hsl(222, 47%, 8%);            /* #0d1321 - Cards/Sidebar */
--surface-elevated: hsl(222, 47%, 11%);  /* #131b2e - Elementos elevados */
```

### Primary - Azul
```css
--primary: hsl(217.2, 91.2%, 59.8%);     /* #3b82f6 */
--primary-hover: hsl(217.2, 91.2%, 65%);
--primary-glow: rgba(59, 130, 246, 0.3);
```

### Accent - Roxo/Violeta
```css
--accent: hsl(262.1, 83.3%, 57.8%);      /* #8b5cf6 */
--accent-hover: hsl(262.1, 83.3%, 65%);
--accent-glow: rgba(139, 92, 246, 0.3);
```

### Cores Semânticas
```css
--success: hsl(142, 71%, 45%);    /* #22c55e - Emerald */
--warning: hsl(38, 92%, 50%);     /* #f59e0b - Amber */
--danger: hsl(0, 84%, 60%);       /* #ef4444 - Rose */
--info: hsl(187, 85%, 53%);       /* #06b6d4 - Cyan */
```

### Textos
```css
--text-primary: hsl(210, 40%, 98%);   /* Branco suave */
--text-secondary: hsl(215, 20%, 65%); /* Slate 400 */
--text-muted: hsl(215, 16%, 47%);     /* Slate 500 */
```

### Bordas
```css
--border: hsl(217, 33%, 17%);             /* Slate 800 */
--border-subtle: rgba(255, 255, 255, 0.1);
```

---

## 🧩 Classes Utilitárias CSS

### Glassmorphism
```css
.glass-card {
  background: rgba(30, 41, 59, 0.7);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
```

### Gradientes
```css
.gradient-blue-purple {
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
}

.text-gradient-blue-purple {
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
```

### Efeitos de Glow
```css
.glow-blue {
  box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
}

.glow-purple {
  box-shadow: 0 0 20px rgba(139, 92, 246, 0.3);
}

/* Sombra para ícones */
.shadow-blue { box-shadow: 0 10px 25px -5px rgba(59, 130, 246, 0.25); }
.shadow-purple { box-shadow: 0 10px 25px -5px rgba(139, 92, 246, 0.25); }
```

### Scrollbar Customizado
```css
::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-track { background: hsl(222, 47%, 8%); }
::-webkit-scrollbar-thumb { 
  background: hsl(217, 33%, 25%); 
  border-radius: 4px; 
}
::-webkit-scrollbar-thumb:hover { background: hsl(217, 33%, 35%); }
```

---

## 🧱 Padrões de Componentes

### 1. Cards (Glass Effect)
```jsx
<div className="glass-card p-5 rounded-xl border border-slate-700/50 hover:border-slate-600/50 transition-all hover:-translate-y-1">
  {/* Conteúdo */}
</div>

// Alternativa com Tailwind puro
<div className="bg-slate-900/50 backdrop-blur-sm p-5 rounded-xl border border-slate-700/50">
  {/* Conteúdo */}
</div>
```

### 2. Botões com Gradiente
```jsx
// Primário
<button className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-medium transition-all shadow-lg shadow-blue-500/25">
  Ação Principal
</button>

// Outline
<button className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 transition-all">
  Ação Secundária
</button>

// Ghost
<button className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all">
  Ação Terciária
</button>
```

### 3. Ícones com Background Gradiente
```jsx
// Azul
<div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/25">
  <Icon className="h-6 w-6 text-white" />
</div>

// Roxo
<div className="h-12 w-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
  <Icon className="h-6 w-6 text-white" />
</div>

// Verde
<div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
  <Icon className="h-6 w-6 text-white" />
</div>
```

### 4. Status Badges
```jsx
// Sucesso
<span className="text-emerald-400 bg-emerald-500/20 px-3 py-1 rounded-full text-xs font-semibold border border-emerald-500/30">
  Concluído
</span>

// Alerta
<span className="text-amber-400 bg-amber-500/20 px-3 py-1 rounded-full text-xs font-semibold border border-amber-500/30">
  Pendente
</span>

// Info
<span className="text-blue-400 bg-blue-500/20 px-3 py-1 rounded-full text-xs font-semibold border border-blue-500/30">
  Em Andamento
</span>

// Erro
<span className="text-rose-400 bg-rose-500/20 px-3 py-1 rounded-full text-xs font-semibold border border-rose-500/30">
  Erro
</span>
```

### 5. Inputs Dark
```jsx
<input 
  className="w-full h-10 px-4 rounded-xl bg-slate-800/50 border border-slate-700/50 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all" 
  placeholder="Digite algo..."
/>

// Com ícone
<div className="relative">
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
  <input className="w-full h-10 pl-10 pr-4 rounded-xl bg-slate-800/50 border border-slate-700/50 text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500/50" />
</div>
```

### 6. Tabelas
```jsx
<div className="glass-card rounded-xl overflow-hidden border border-slate-700/50">
  <table className="w-full">
    <thead className="bg-slate-800/50 border-b border-slate-700/50">
      <tr>
        <th className="px-6 py-4 text-left text-sm font-medium text-slate-400">Coluna</th>
      </tr>
    </thead>
    <tbody className="divide-y divide-slate-700/50">
      <tr className="hover:bg-slate-800/30 transition-colors">
        <td className="px-6 py-4 text-white">Conteúdo</td>
      </tr>
    </tbody>
  </table>
</div>
```

### 7. Cards de Estatísticas
```jsx
<div className="glass-card p-5 rounded-xl border border-slate-700/50">
  <div className="flex items-start justify-between">
    <div className="space-y-2">
      <p className="text-sm font-medium text-slate-400">Título</p>
      <p className="text-2xl font-bold text-white">R$ 45.231</p>
      <div className="flex items-center gap-1">
        <TrendingUp className="h-3 w-3 text-emerald-400" />
        <span className="text-xs font-medium text-emerald-400">+12.5%</span>
        <span className="text-xs text-slate-500">vs mês anterior</span>
      </div>
    </div>
    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
      <DollarSign className="h-6 w-6 text-white" />
    </div>
  </div>
</div>
```

### 8. Modais
```jsx
<div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
  <div className="glass-card w-full max-w-md rounded-xl border border-slate-700/50">
    <div className="p-6 border-b border-slate-700/50">
      <h2 className="text-xl font-bold text-white">Título do Modal</h2>
    </div>
    <div className="p-6">
      {/* Conteúdo */}
    </div>
    <div className="p-6 border-t border-slate-700/50 flex gap-3">
      <button className="flex-1 px-4 py-2 rounded-xl border border-slate-700 text-slate-300">Cancelar</button>
      <button className="flex-1 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-white">Confirmar</button>
    </div>
  </div>
</div>
```

---

## 📐 Estrutura de Layout

```
┌─────────────────────────────────────────────────────────────┐
│ SIDEBAR (w-64, fixed, bg-slate-900/80)                      │
│ ├── Logo + Nome da App                                      │
│ ├── Perfil do Usuário (avatar gradient + status online)    │
│ ├── Navegação (ícones gradient + labels)                   │
│ └── Footer (Configurações + Logout)                        │
├─────────────────────────────────────────────────────────────┤
│ MAIN (ml-64)                                                │
│ ├── HEADER (h-16, sticky, backdrop-blur)                   │
│ │   ├── Campo de Busca                                     │
│ │   ├── Notificações (badge com contador)                  │
│ │   └── Perfil Compacto                                    │
│ ├── CONTENT (p-6, overflow-auto)                           │
│ │   ├── Título da Página + Botão de Ação                   │
│ │   ├── Cards de Estatísticas (grid 4 cols)                │
│ │   ├── Gráficos (ChartArea, ChartPie, ChartBar)           │
│ │   └── Tabelas / Conteúdo Específico                      │
│ └──────────────────────────────────────────────────────────│
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Dependências Recomendadas

```json
{
  "dependencies": {
    "recharts": "^2.x",        // Gráficos (área, barra, pizza)
    "lucide-react": "^0.x",    // Ícones modernos
    "tailwindcss": "^4.x",     // Estilização
    "@hello-pangea/dnd": "^16.x" // Drag & drop (opcional, para kanban)
  }
}
```

---

## ✅ Dicas de Implementação

| Regra | Exemplo |
|-------|---------|
| Bordas sutis | `border-slate-700/50` |
| Backgrounds semi-transparentes | `bg-slate-900/50` |
| Gradientes nos ícones | `bg-gradient-to-br from-blue-500 to-violet-600` |
| Sombras coloridas | `shadow-lg shadow-blue-500/25` |
| Hover states suaves | `hover:border-slate-600/50 transition-all` |
| Evite branco puro | Use `text-white` ou `text-slate-100` |
| Texto secundário | `text-slate-400` |
| Texto muted | `text-slate-500` |

---

## 🔧 Prompt Resumido para IA

```
Crie uma interface dark mode premium com:
- Background: hsl(222, 47%, 6%) a hsl(222, 47%, 11%)
- Primary: Azul #3b82f6 com gradiente para roxo #8b5cf6
- Cards com glassmorphism (backdrop-blur + transparência)
- Bordas sutis: border-slate-700/50
- Sombras coloridas nos elementos de destaque
- Ícones em containers com gradiente e shadow
- Status badges coloridos com fundo transparente
- Tabelas com hover state e divisores sutis
- Inputs com focus ring em azul
- Animações suaves (transition-all)
```

---

**Criado com ❤️ para projetos SaaS premium**
