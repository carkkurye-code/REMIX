export const adminTheme = {
  // Backgrounds
  pageBg: 'bg-background',
  cardBg: 'bg-card',
  sidebarBg: 'bg-card',
  modalBg: 'bg-card',
  inputBg: 'bg-card',
  hoverBg: 'hover:bg-accent/40',
  activeBg: 'bg-accent/50',
  tableHeaderBg: 'bg-accent/30',
  badgeBg: 'bg-accent/30',

  // Borders
  border: 'border-border',
  inputBorder: 'border-border',
  inputFocus: 'focus:border-primary focus:ring-1 focus:ring-primary',
  
  // Text Colors
  textPrimary: 'text-foreground',
  textNormal: 'text-foreground/90',
  textSecondary: 'text-muted-foreground',
  textHelper: 'text-muted-foreground/70',

  // Headings & Labels
  title: 'text-foreground font-black tracking-tight',
  subtitle: 'text-xs sm:text-sm text-muted-foreground font-medium',
  label: 'text-[10px] font-bold text-muted-foreground uppercase tracking-wider',

  // Buttons
  btnPrimary: 'px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground border-0 font-bold text-xs rounded-xl transition-all cursor-pointer active:scale-95 shadow-sm flex items-center justify-center gap-1.5',
  btnSecondary: 'px-3.5 py-2 bg-card hover:bg-accent/40 text-foreground border border-border font-semibold text-xs rounded-xl transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1.5',
  btnDanger: 'px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer border-0 active:scale-95 flex items-center justify-center gap-1.5',
  btnSuccess: 'px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer border-0 active:scale-95 flex items-center justify-center gap-1.5',

  // Button Aliases
  buttonPrimary: 'px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground border-0 font-bold text-xs rounded-xl transition-all cursor-pointer active:scale-95 shadow-sm flex items-center justify-center gap-1.5',
  buttonSecondary: 'px-3.5 py-2 bg-card hover:bg-accent/40 text-foreground border border-border font-semibold text-xs rounded-xl transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1.5',

  // Status Badges
  badgeSuccess: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 font-semibold px-2.5 py-1 rounded-full text-[11px]',
  badgeDanger: 'bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/20 font-semibold px-2.5 py-1 rounded-full text-[11px]',
  badgeWarning: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 font-semibold px-2.5 py-1 rounded-full text-[11px]',
  badgeNeutral: 'bg-accent/30 text-foreground border border-border font-medium px-2.5 py-1 rounded-full text-[11px]',
  badgeActive: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 font-bold px-2.5 py-1 rounded-full text-[11px]',
  badgeInactive: 'bg-accent/30 text-muted-foreground border border-border font-bold px-2.5 py-1 rounded-full text-[11px]',

  // Inputs & Selects
  input: 'w-full h-10 bg-card border border-border text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-xs font-medium transition-all px-3',
  select: 'h-10 bg-card border border-border text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-xs font-medium transition-all px-3',
  inputDisabled: 'w-full h-10 bg-background/50 border border-border text-muted-foreground rounded-xl px-3 text-xs font-medium cursor-not-allowed',

  // Pre-styled Containers
  card: 'bg-card border border-border rounded-2xl p-5 shadow-[0_12px_28px_hsl(256_24%_17%_/_0.04)]',
  tableHeader: 'bg-accent/30 border-b border-border text-xs font-bold text-muted-foreground uppercase tracking-wider',
  tableRow: 'hover:bg-accent/20 transition-colors border-b border-border/60',

  // Modal Overlay & Card
  modalOverlay: 'fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm flex items-center justify-center p-4',
  modalCard: 'bg-card rounded-[1.65rem] sm:rounded-2xl w-full p-6 space-y-4 shadow-xl border border-border text-foreground',
  modalCloseButton: 'w-8 h-8 rounded-lg hover:bg-accent/40 flex items-center justify-center border-0 cursor-pointer text-muted-foreground hover:text-foreground transition-colors'
};

