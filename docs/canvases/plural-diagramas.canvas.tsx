import {
  Button,
  Callout,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Grid,
  H2,
  H3,
  H1,
  Row,
  Stack,
  Table,
  Text,
  computeDAGLayout,
  useHostTheme,
} from 'cursor/canvas';
import { useState } from 'react';

type Tab = 'fluxo' | 'erd' | 'auth' | 'multitenancy' | 'infra';

const TABS: { id: Tab; label: string }[] = [
  { id: 'fluxo', label: 'Fluxo Pedagógico' },
  { id: 'erd', label: 'Relacionamento de Entidades' },
  { id: 'auth', label: 'Auth & Reset de Senha' },
  { id: 'multitenancy', label: 'Multi-tenancy' },
  { id: 'infra', label: 'Infraestrutura' },
];

// Fixed semantic colors (success/warning not in SDK tokens)
const C = {
  success: '#1F8A65',
  successBg: '#1F8A6522',
  warning: '#B87820',
  warningBg: '#B8782022',
};

type NodeDef = {
  id: string;
  label: string;
  sublabel?: string;
  bg?: string;
  shape?: 'rect' | 'diamond' | 'pill';
};

type EdgeDef = {
  from: string;
  to: string;
  label?: string;
  dashed?: boolean;
  color?: string; // 'accent' | 'success' | 'warning' | default
};

function DAGDiagram({
  nodes,
  edges,
  direction = 'vertical',
  nodeWidth = 160,
  nodeHeight = 48,
  rankGap = 80,
  nodeGap = 40,
}: {
  nodes: NodeDef[];
  edges: EdgeDef[];
  direction?: 'vertical' | 'horizontal';
  nodeWidth?: number;
  nodeHeight?: number;
  rankGap?: number;
  nodeGap?: number;
}) {
  const theme = useHostTheme();
  const textColor = theme.text.primary;
  const textSecondary = theme.text.secondary;
  const nodeBg = theme.bg.elevated;
  const nodeBorder = theme.stroke.secondary;
  const accentColor = theme.accent.primary;
  const defaultEdgeColor = theme.stroke.primary;

  const layout = computeDAGLayout({
    nodes: nodes.map((n) => ({ id: n.id })),
    edges: edges.map((e) => ({ from: e.from, to: e.to })),
    direction,
    nodeWidth,
    nodeHeight,
    rankGap,
    nodeGap,
    padding: 24,
  });

  const nodeMap = Object.fromEntries(nodes.map((n) => [n.id, n]));
  const edgeDefMap: Record<string, EdgeDef> = {};
  edges.forEach((e) => { edgeDefMap[`${e.from}→${e.to}`] = e; });

  function edgeColor(e: EdgeDef): string {
    if (e.color === 'accent') return accentColor;
    if (e.color === 'success') return C.success;
    if (e.color === 'warning') return C.warning;
    return defaultEdgeColor;
  }

  return (
    <div style={{ overflowX: 'auto', overflowY: 'auto' }}>
      <svg width={layout.width} height={layout.height} style={{ display: 'block' }}>
        <defs>
          {(['default', 'accent', 'success', 'warning'] as const).map((id) => {
            const color = id === 'accent' ? accentColor : id === 'success' ? C.success : id === 'warning' ? C.warning : defaultEdgeColor;
            return (
              <marker key={id} id={`arr-${id}`} markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill={color} />
              </marker>
            );
          })}
        </defs>

        {/* Edges */}
        {layout.edges.map((le, i) => {
          const eDef = edgeDefMap[`${le.from}→${le.to}`] ?? {};
          const col = edgeColor(eDef as EdgeDef);
          const markerId = eDef.color === 'accent' ? 'arr-accent'
            : eDef.color === 'success' ? 'arr-success'
            : eDef.color === 'warning' ? 'arr-warning'
            : 'arr-default';
          const mx = (le.sourceX + le.targetX) / 2;
          const my = (le.sourceY + le.targetY) / 2;
          return (
            <g key={i}>
              <line
                x1={le.sourceX} y1={le.sourceY}
                x2={le.targetX} y2={le.targetY}
                stroke={col}
                strokeWidth={1.5}
                strokeDasharray={(eDef as EdgeDef).dashed ? '5,4' : undefined}
                markerEnd={`url(#${markerId})`}
                opacity={0.85}
              />
              {(eDef as EdgeDef).label && (
                <text x={mx} y={my - 5} textAnchor="middle" fontSize={9} fill={col} fontFamily="system-ui,sans-serif">
                  {(eDef as EdgeDef).label}
                </text>
              )}
            </g>
          );
        })}

        {/* Nodes */}
        {layout.nodes.map((ln) => {
          const def = nodeMap[ln.id];
          const bg = def.bg ?? nodeBg;
          const cx = ln.x + nodeWidth / 2;
          const cy = ln.y + nodeHeight / 2;

          if (def.shape === 'diamond') {
            const hw = nodeWidth / 2 - 4;
            const hh = nodeHeight / 2 - 2;
            return (
              <g key={ln.id}>
                <polygon
                  points={`${cx},${cy - hh} ${cx + hw},${cy} ${cx},${cy + hh} ${cx - hw},${cy}`}
                  fill={bg}
                  stroke={nodeBorder}
                  strokeWidth={1}
                />
                <text x={cx} y={cy + 4} textAnchor="middle" fontSize={10} fontWeight="600" fill={textColor} fontFamily="system-ui,sans-serif">
                  {def.label}
                </text>
              </g>
            );
          }

          const rx = def.shape === 'pill' ? nodeHeight / 2 : 6;
          const hasSubLabel = Boolean(def.sublabel);

          return (
            <g key={ln.id}>
              <rect x={ln.x} y={ln.y} width={nodeWidth} height={nodeHeight} rx={rx} fill={bg} stroke={nodeBorder} strokeWidth={1} />
              <text
                x={cx}
                y={hasSubLabel ? cy - 4 : cy + 4}
                textAnchor="middle"
                fontSize={11}
                fontWeight="600"
                fill={textColor}
                fontFamily="system-ui,sans-serif"
              >
                {def.label}
              </text>
              {hasSubLabel && (
                <text x={cx} y={cy + 10} textAnchor="middle" fontSize={9} fill={textSecondary} fontFamily="system-ui,sans-serif">
                  {def.sublabel}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function Legend({ items }: { items: { color: string; label: string }[] }) {
  const theme = useHostTheme();
  return (
    <Row gap={16} wrap>
      {items.map((item, i) => (
        <Row key={i} gap={6} align="center">
          <div style={{ width: 18, height: 3, background: item.color, borderRadius: 2 }} />
          <Text size="small" tone="secondary">{item.label}</Text>
        </Row>
      ))}
    </Row>
  );
}

// ─── Fluxo Pedagógico ────────────────────────────────────────────────────────

function FluxoTab() {
  const theme = useHostTheme();
  const accent = theme.accent.primary;

  const nodes: NodeDef[] = [
    { id: 'professora', label: 'Professora', sublabel: 'Usuária autenticada', bg: accent + '44', shape: 'pill' },
    { id: 'escola', label: 'Escola', sublabel: 'Obrigatória — logo_url', bg: accent + '22' },
    { id: 'aluno', label: 'Aluno', sublabel: '+ date_of_birth (NOT NULL)', bg: accent + '22' },
    { id: 'complementar', label: 'Dados complementares', sublabel: 'Responsável · Laudo · Perfil pedagógico' },
    { id: 'avaliacao', label: 'Avaliação Diagnóstica', sublabel: 'Export PDF — reutilizável', bg: accent + '22' },
    { id: 'resultado', label: 'Resultado por Habilidade', sublabel: 'ACHIEVED / PARTIAL / NOT_ACHIEVED' },
    { id: 'estudo', label: 'Estudo de Caso', sublabel: 'DOCX — revisão anual', bg: C.warningBg },
    { id: 'paee', label: 'PAEE', sublabel: 'DOCX — um por período', bg: C.successBg },
    { id: 'sessoes', label: 'Sessões do PAEE', sublabel: 'planned + actual + presença', bg: C.successBg },
    { id: 'relatorio', label: 'Relatório Consolidado', sublabel: 'DOCX — período selecionável', bg: C.successBg },
  ];

  const edges: EdgeDef[] = [
    { from: 'professora', to: 'escola', color: 'accent' },
    { from: 'escola', to: 'aluno', color: 'accent' },
    { from: 'aluno', to: 'complementar' },
    { from: 'aluno', to: 'avaliacao', color: 'accent' },
    { from: 'avaliacao', to: 'resultado', color: 'accent' },
    { from: 'resultado', to: 'estudo', label: 'sugere', color: 'warning' },
    { from: 'resultado', to: 'paee', label: 'sugere habilidades', color: 'success' },
    { from: 'aluno', to: 'estudo', color: 'warning' },
    { from: 'estudo', to: 'paee', label: 'opcional (lei)', dashed: true, color: 'warning' },
    { from: 'paee', to: 'sessoes', color: 'success' },
    { from: 'sessoes', to: 'relatorio', color: 'success' },
  ];

  return (
    <Stack gap={24}>
      <div>
        <H2>Fluxo pedagógico completo</H2>
        <Text tone="secondary">Da autenticação da professora ao relatório consolidado. Cada seta representa uma dependência de dados.</Text>
      </div>

      <Legend items={[
        { color: accent, label: 'Cadastro base (obrigatório)' },
        { color: C.warning, label: 'Estudo de Caso (seta tracejada = opcional na prática)' },
        { color: C.success, label: 'PAEE e sessões' },
        { color: theme.stroke.primary, label: 'Dados complementares' },
      ]} />

      <Callout tone="info">
        A avaliação diagnóstica alimenta tanto o Estudo de Caso quanto o PAEE — habilidades com status PARTIAL
        ou NOT_ACHIEVED são sugeridas automaticamente para o próximo plano.
      </Callout>

      <DAGDiagram nodes={nodes} edges={edges} direction="vertical" nodeWidth={200} nodeHeight={50} rankGap={84} nodeGap={48} />

      <Divider />
      <H3>Regras de sequência</H3>
      <Grid columns={2} gap={12}>
        {[
          { step: '1. Escola antes de tudo', rule: 'Não é possível cadastrar aluno sem ter ao menos uma escola cadastrada.' },
          { step: '2. Aluno antes de avaliação', rule: 'A avaliação diagnóstica exige ao menos um aluno vinculado.' },
          { step: '3. Avaliação → PAEE', rule: 'O sistema sugere habilidades no PAEE com base nos resultados. Não é obrigatório ter avaliação, mas é recomendado.' },
          { step: '4. Estudo de Caso → PAEE', rule: 'Por lei deve preceder o PAEE. O sistema permite criar sem ele, mas exibe aviso.' },
          { step: '5. PAEE → Sessões', rule: 'As sessões são geradas automaticamente a partir de data início/fim e frequência do aluno.' },
          { step: '6. Sessões → Relatório', rule: 'O relatório consolidado é uma query sobre as sessões de um período selecionável.' },
        ].map((item, i) => (
          <div key={i} style={{ borderLeft: `3px solid ${theme.stroke.secondary}`, paddingLeft: 12, paddingTop: 6, paddingBottom: 6 }}>
            <Text weight="semibold" size="small">{item.step}</Text>
            <Text size="small" tone="secondary">{item.rule}</Text>
          </div>
        ))}
      </Grid>
    </Stack>
  );
}

// ─── ERD ─────────────────────────────────────────────────────────────────────

function ErdTab() {
  const theme = useHostTheme();
  const accent = theme.accent.primary;
  const [group, setGroup] = useState<'core' | 'assessment' | 'plan'>('core');

  const groups = [
    { id: 'core' as const, label: 'Usuários & Cadastro' },
    { id: 'assessment' as const, label: 'Avaliação & Estudo de Caso' },
    { id: 'plan' as const, label: 'PAEE & Sessões' },
  ];

  const diagrams = {
    core: {
      nodes: [
        { id: 'user', label: 'users', sublabel: 'email · role · bcrypt', bg: accent + '44', shape: 'pill' as const },
        { id: 'teacher', label: 'teachers', sublabel: '1:1 com users', bg: accent + '22' },
        { id: 'school', label: 'schools', sublabel: '+ logo_url' },
        { id: 'student', label: 'students', sublabel: '+ date_of_birth (NOT NULL)', bg: accent + '22' },
        { id: 'profile', label: 'student_profiles', sublabel: 'perfil anual' },
        { id: 'guardian', label: 'guardians', sublabel: '1 por aluno' },
        { id: 'medical', label: 'medical_reports', sublabel: 'CID, médico' },
        { id: 'reset', label: 'password_reset_tokens', sublabel: 'expiresAt · usedAt' },
      ],
      edges: [
        { from: 'user', to: 'teacher', label: '1:1', color: 'accent' as const },
        { from: 'teacher', to: 'school', label: '1:N', color: 'accent' as const },
        { from: 'teacher', to: 'student', label: '1:N', color: 'accent' as const },
        { from: 'school', to: 'student', label: '1:N', color: 'accent' as const },
        { from: 'student', to: 'profile', label: '1:1' },
        { from: 'student', to: 'guardian', label: 'N:1' },
        { from: 'student', to: 'medical', label: '1:N' },
        { from: 'user', to: 'reset', label: '1:N' },
      ],
    },
    assessment: {
      nodes: [
        { id: 'teacher', label: 'teachers', bg: accent + '22' },
        { id: 'block', label: 'blocks', sublabel: 'catálogo (admin)' },
        { id: 'activity', label: 'activities', sublabel: 'catálogo (admin)' },
        { id: 'skill', label: 'skills', sublabel: 'catálogo (admin)' },
        { id: 'suggestion', label: 'activity_suggestions', sublabel: 'por habilidade' },
        { id: 'diag', label: 'diagnostic_assessments', sublabel: 'título · data', bg: C.warningBg },
        { id: 'perf', label: 'activity_performances', sublabel: 'AUTONOMOUS / WITH_HELP / ...' },
        { id: 'skillresult', label: 'skill_results', sublabel: 'ACHIEVED / PARTIAL / NOT_ACHIEVED', bg: C.warningBg },
        { id: 'casestudy', label: 'case_studies', sublabel: 'anual + docxUrl', bg: C.warningBg },
        { id: 'axis', label: 'case_study_axes', sublabel: '7 eixos fixos + observações' },
      ],
      edges: [
        { from: 'teacher', to: 'diag', label: '1:N', color: 'warning' as const },
        { from: 'block', to: 'activity', label: '1:N' },
        { from: 'activity', to: 'skill', label: 'N:N' },
        { from: 'skill', to: 'suggestion', label: '1:N' },
        { from: 'diag', to: 'perf', label: '1:N', color: 'warning' as const },
        { from: 'diag', to: 'skillresult', label: '1:N', color: 'warning' as const },
        { from: 'skillresult', to: 'casestudy', label: 'sugere', dashed: true },
        { from: 'teacher', to: 'casestudy', label: '1:N', color: 'warning' as const },
        { from: 'casestudy', to: 'axis', label: '1:7', color: 'warning' as const },
      ],
    },
    plan: {
      nodes: [
        { id: 'teacher', label: 'teachers', bg: accent + '22' },
        { id: 'casestudy', label: 'case_studies', sublabel: 'FK nullable', bg: C.warningBg },
        { id: 'skill', label: 'skills', sublabel: 'catálogo' },
        { id: 'customskill', label: 'custom_skills', sublabel: 'por professora' },
        { id: 'strategy', label: 'strategies', sublabel: 'catálogo' },
        { id: 'plan', label: 'plans (PAEE)', sublabel: 'startDate · endDate · status', bg: C.successBg },
        { id: 'planstudent', label: 'plan_students', sublabel: 'pivot N:N' },
        { id: 'planskill', label: 'plan_skills', sublabel: 'pivot N:N' },
        { id: 'session', label: 'plan_sessions', sublabel: 'planned + actual + attendance', bg: C.successBg },
        { id: 'sessionskill', label: 'plan_session_skills', sublabel: 'validado no service' },
      ],
      edges: [
        { from: 'teacher', to: 'plan', label: '1:N', color: 'success' as const },
        { from: 'casestudy', to: 'plan', label: 'FK?', dashed: true },
        { from: 'plan', to: 'planstudent', color: 'success' as const },
        { from: 'plan', to: 'planskill', color: 'success' as const },
        { from: 'skill', to: 'planskill' },
        { from: 'teacher', to: 'customskill', label: '1:N' },
        { from: 'strategy', to: 'plan', label: 'N:N' },
        { from: 'plan', to: 'session', label: '1:N', color: 'success' as const },
        { from: 'session', to: 'sessionskill', color: 'success' as const },
        { from: 'planskill', to: 'sessionskill', label: 'valida', dashed: true },
      ],
    },
  };

  const current = diagrams[group];

  return (
    <Stack gap={24}>
      <div>
        <H2>Diagrama de relacionamento de entidades (ERD)</H2>
        <Text tone="secondary">Navegue pelos grupos. Setas tracejadas = relação opcional ou validação no service layer.</Text>
      </div>

      <Row gap={8}>
        {groups.map(g => (
          <Button key={g.id} variant={group === g.id ? 'primary' : 'secondary'} onClick={() => setGroup(g.id)}>
            {g.label}
          </Button>
        ))}
      </Row>

      <Legend items={[
        { color: accent, label: 'Cadastro base' },
        { color: C.warning, label: 'Avaliação & Estudo de Caso' },
        { color: C.success, label: 'PAEE & Sessões' },
        { color: theme.stroke.primary, label: 'Catálogo (admin) / complementar' },
      ]} />

      <DAGDiagram nodes={current.nodes} edges={current.edges as EdgeDef[]} direction="vertical" nodeWidth={180} nodeHeight={50} rankGap={88} nodeGap={40} />

      <Divider />
      <H3>Convenções</H3>
      <Grid columns={3} gap={12}>
        {[
          { term: '1:1', desc: 'Um para um — ex: users ↔ teachers' },
          { term: '1:N', desc: 'Um para muitos — ex: teacher → students' },
          { term: 'N:N', desc: 'Muitos para muitos via tabela pivot' },
          { term: 'FK?', desc: 'Foreign key nullable — relação opcional' },
          { term: 'dashed', desc: 'Validação no service ou relação opcional' },
          { term: 'catálogo', desc: 'Gerenciado pelo api-admin, read-only no api' },
        ].map((item, i) => (
          <div key={i} style={{ borderLeft: `3px solid ${theme.stroke.secondary}`, paddingLeft: 10, paddingTop: 4, paddingBottom: 4 }}>
            <Text weight="semibold" size="small">{item.term}</Text>
            <Text size="small" tone="secondary">{item.desc}</Text>
          </div>
        ))}
      </Grid>
    </Stack>
  );
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

function AuthTab() {
  const theme = useHostTheme();
  const accent = theme.accent.primary;

  const loginNodes: NodeDef[] = [
    { id: 'start', label: 'POST /auth/login', sublabel: 'email + senha', bg: accent + '44', shape: 'pill' },
    { id: 'finduser', label: 'Buscar usuário por email' },
    { id: 'exists', label: 'Existe?', shape: 'diamond' },
    { id: 'active', label: 'isActive?', shape: 'diamond' },
    { id: 'expired', label: 'Expirou?', shape: 'diamond' },
    { id: 'mustreset', label: 'mustReset?', shape: 'diamond' },
    { id: 'verifypass', label: 'bcrypt.compare()' },
    { id: 'valid', label: 'Válida?', shape: 'diamond' },
    { id: 'jwt', label: 'Gerar JWT + refresh', sublabel: 'userId · role · teacherId', bg: C.successBg },
    { id: 'resetflow', label: '401 mustResetPassword', sublabel: 'Frontend redireciona', bg: C.warningBg },
    { id: 'err401', label: '401 Unauthorized' },
    { id: 'err403', label: '403 Forbidden', sublabel: 'inativa / expirada' },
  ];

  const loginEdges: EdgeDef[] = [
    { from: 'start', to: 'finduser', color: 'accent' },
    { from: 'finduser', to: 'exists', color: 'accent' },
    { from: 'exists', to: 'active', label: 'sim', color: 'accent' },
    { from: 'exists', to: 'err401', label: 'não' },
    { from: 'active', to: 'expired', label: 'sim', color: 'accent' },
    { from: 'active', to: 'err403', label: 'não' },
    { from: 'expired', to: 'mustreset', label: 'não expirou', color: 'accent' },
    { from: 'expired', to: 'err403', label: 'expirou' },
    { from: 'mustreset', to: 'verifypass', label: 'não', color: 'accent' },
    { from: 'mustreset', to: 'resetflow', label: 'sim', color: 'warning' },
    { from: 'verifypass', to: 'valid', color: 'accent' },
    { from: 'valid', to: 'jwt', label: 'sim', color: 'success' },
    { from: 'valid', to: 'err401', label: 'não' },
  ];

  const resetNodes: NodeDef[] = [
    { id: 'req', label: 'POST /auth/forgot-password', sublabel: 'email', bg: accent + '44', shape: 'pill' },
    { id: 'finduser', label: 'Buscar usuário por email' },
    { id: 'token', label: 'Gerar token UUID', sublabel: 'expiresAt = now + 1h' },
    { id: 'save', label: 'Salvar reset token no BD' },
    { id: 'email', label: 'Enviar e-mail', sublabel: '/reset-password?token=...' },
    { id: 'click', label: 'POST /auth/reset-password', sublabel: 'token + newPassword', bg: accent + '44', shape: 'pill' },
    { id: 'validate', label: 'Válido e não expirado?', shape: 'diamond' },
    { id: 'hash', label: 'bcrypt.hash(newPassword)' },
    { id: 'update', label: 'Atualizar users.password', sublabel: 'mustResetPassword = false' },
    { id: 'markused', label: 'token.usedAt = now' },
    { id: 'ok', label: '200 OK — senha redefinida', bg: C.successBg, shape: 'pill' },
    { id: 'err', label: '400 Token inválido/expirado' },
  ];

  const resetEdges: EdgeDef[] = [
    { from: 'req', to: 'finduser', color: 'accent' },
    { from: 'finduser', to: 'token', color: 'accent' },
    { from: 'token', to: 'save', color: 'accent' },
    { from: 'save', to: 'email', color: 'accent' },
    { from: 'click', to: 'validate', color: 'accent' },
    { from: 'validate', to: 'hash', label: 'válido', color: 'success' },
    { from: 'validate', to: 'err', label: 'não' },
    { from: 'hash', to: 'update', color: 'success' },
    { from: 'update', to: 'markused', color: 'success' },
    { from: 'markused', to: 'ok', color: 'success' },
  ];

  return (
    <Stack gap={24}>
      <div>
        <H2>Fluxo de autenticação e reset de senha</H2>
        <Text tone="secondary">bcrypt desde o dia 1. Reset em massa na virada .NET → Node.</Text>
      </div>

      <Callout tone="warning" title="Reset em massa na migração">
        Todas as professoras existentes terão mustResetPassword = true ao migrar. Receberão e-mail
        explicando a atualização. Após redefinir a senha, o acesso é liberado normalmente.
      </Callout>

      <Grid columns={2} gap={24}>
        <Stack gap={12}>
          <H3>Login</H3>
          <Legend items={[
            { color: accent, label: 'Caminho principal' },
            { color: C.success, label: 'Sucesso — JWT gerado' },
            { color: C.warning, label: 'Deve resetar senha' },
            { color: theme.stroke.primary, label: 'Erro' },
          ]} />
          <DAGDiagram nodes={loginNodes} edges={loginEdges} direction="vertical" nodeWidth={184} nodeHeight={50} rankGap={72} nodeGap={28} />
        </Stack>

        <Stack gap={12}>
          <H3>Reset de senha</H3>
          <Legend items={[
            { color: accent, label: 'Solicitação' },
            { color: C.success, label: 'Redefinição bem-sucedida' },
            { color: theme.stroke.primary, label: 'Erro' },
          ]} />
          <DAGDiagram nodes={resetNodes} edges={resetEdges} direction="vertical" nodeWidth={184} nodeHeight={50} rankGap={72} nodeGap={28} />
        </Stack>
      </Grid>

      <Divider />
      <H3>Payload do JWT</H3>
      <Grid columns={2} gap={12}>
        <Card>
          <CardHeader>apps/api — professora</CardHeader>
          <CardBody>
            <Stack gap={1}>
              {['{ "sub": "uuid", "role": "TEACHER",', '  "teacherId": "uuid",', '  "iat": ..., "exp": now+1h }'].map((l, i) => (
                <Text key={i} size="small" style={{ fontFamily: 'monospace', whiteSpace: 'pre' }}>{l}</Text>
              ))}
            </Stack>
          </CardBody>
        </Card>
        <Card>
          <CardHeader>apps/api-admin — administrador</CardHeader>
          <CardBody>
            <Stack gap={1}>
              {['{ "sub": "uuid", "role": "ADMIN",', '  "iat": ..., "exp": now+2h }', '', '// JWT_SECRET diferente — middleware', '// rejeita token de admin no api'].map((l, i) => (
                <Text key={i} size="small" style={{ fontFamily: 'monospace', whiteSpace: 'pre' }}>{l}</Text>
              ))}
            </Stack>
          </CardBody>
        </Card>
      </Grid>
    </Stack>
  );
}

// ─── Multi-tenancy ────────────────────────────────────────────────────────────

function MultitenancyTab() {
  const theme = useHostTheme();
  const accent = theme.accent.primary;

  const nodes: NodeDef[] = [
    { id: 'req', label: 'Request HTTP', sublabel: 'Authorization: Bearer ...', bg: accent + '44', shape: 'pill' },
    { id: 'jwtmw', label: 'JWT Middleware', sublabel: 'verifica assinatura + expiração' },
    { id: 'valid', label: 'Token válido?', shape: 'diamond' },
    { id: 'ownership', label: 'Ownership Middleware', sublabel: 'injeta teacherId no request', bg: accent + '22' },
    { id: 'handler', label: 'Route Handler', sublabel: 'chama service com teacherId' },
    { id: 'service', label: 'Service Layer', sublabel: 'toda query filtra por teacherId', bg: accent + '22' },
    { id: 'prisma', label: 'Prisma Client', sublabel: 'WHERE teacher_id = ?', bg: C.successBg },
    { id: 'db', label: 'PostgreSQL (Supabase)', sublabel: 'dados isolados por professora', bg: C.successBg },
    { id: 'err401', label: '401 Unauthorized' },
    { id: 'err403', label: '403 Forbidden', sublabel: 'recurso não pertence a esta prof.' },
  ];

  const edges: EdgeDef[] = [
    { from: 'req', to: 'jwtmw', color: 'accent' },
    { from: 'jwtmw', to: 'valid' },
    { from: 'valid', to: 'ownership', label: 'sim', color: 'accent' },
    { from: 'valid', to: 'err401', label: 'não' },
    { from: 'ownership', to: 'handler', color: 'accent' },
    { from: 'handler', to: 'service', color: 'accent' },
    { from: 'service', to: 'prisma', color: 'success' },
    { from: 'service', to: 'err403', label: 'não é dono', color: 'warning' },
    { from: 'prisma', to: 'db', color: 'success' },
  ];

  return (
    <Stack gap={24}>
      <div>
        <H2>Modelo de multi-tenancy — por professora</H2>
        <Text tone="secondary">Cada professora enxerga apenas os dados que ela criou. Isolamento em duas camadas: middleware e queries.</Text>
      </div>

      <Grid columns={2} gap={16}>
        <Stack gap={12}>
          <H3>Fluxo de isolamento</H3>
          <DAGDiagram nodes={nodes} edges={edges} direction="vertical" nodeWidth={200} nodeHeight={50} rankGap={72} nodeGap={32} />
        </Stack>

        <Stack gap={16}>
          <H3>As duas camadas de proteção</H3>
          <Stack gap={12}>
            <div style={{ borderLeft: `3px solid ${accent}`, paddingLeft: 12, paddingTop: 8, paddingBottom: 8 }}>
              <Text weight="semibold">Camada 1 — Ownership Middleware</Text>
              <Text size="small" tone="secondary" style={{ marginTop: 4 }}>
                Para endpoints com ID de recurso, o middleware verifica se o recurso pertence ao teacherId do JWT. Se não, 403 antes do handler.
              </Text>
              <Stack gap={1} style={{ marginTop: 8 }}>
                {[
                  "fastify.addHook('preHandler', async (req) => {",
                  "  const res = await getResource(req.params.id)",
                  "  if (res.teacherId !== req.user.teacherId)",
                  "    throw new AppError(403, 'FORBIDDEN')",
                  "})",
                ].map((line, i) => (
                  <Text key={i} size="small" style={{ fontFamily: 'monospace', whiteSpace: 'pre', color: theme.text.secondary }}>{line}</Text>
                ))}
              </Stack>
            </div>

            <div style={{ borderLeft: `3px solid ${C.success}`, paddingLeft: 12, paddingTop: 8, paddingBottom: 8 }}>
              <Text weight="semibold">Camada 2 — Queries sempre filtradas</Text>
              <Text size="small" tone="secondary" style={{ marginTop: 4 }}>
                Todo findMany recebe teacherId como filtro obrigatório. Mesmo que o middleware falhe, o banco nunca retorna dados de outra professora.
              </Text>
              <Stack gap={1} style={{ marginTop: 8 }}>
                {[
                  "async listStudents(teacherId: string) {",
                  "  return prisma.student.findMany({",
                  "    where: { teacherId }",
                  "  })",
                  "}",
                ].map((line, i) => (
                  <Text key={i} size="small" style={{ fontFamily: 'monospace', whiteSpace: 'pre', color: theme.text.secondary }}>{line}</Text>
                ))}
              </Stack>
            </div>
          </Stack>

          <Divider />
          <H3>Isolamento por entidade</H3>
          <Table
            headers={['Entidade', 'Filtro']}
            rows={[
              ['schools', 'WHERE teacher_id = ?'],
              ['students', 'WHERE teacher_id = ?'],
              ['diagnostic_assessments', 'WHERE teacher_id = ?'],
              ['case_studies', 'WHERE teacher_id = ?'],
              ['plans', 'WHERE teacher_id = ?'],
              ['plan_sessions', 'JOIN plans WHERE teacher_id = ?'],
              ['custom_skills', 'WHERE teacher_id = ?'],
            ]}
          />
        </Stack>
      </Grid>
    </Stack>
  );
}

// ─── Infra ────────────────────────────────────────────────────────────────────

function InfraTab() {
  const theme = useHostTheme();
  const accent = theme.accent.primary;

  const nodes: NodeDef[] = [
    { id: 'browser', label: 'Navegador', sublabel: 'app / adm.pluralplataforma.com', bg: accent + '44', shape: 'pill' },
    { id: 'mobile', label: 'App Mobile', sublabel: 'Expo (iOS / Android)', bg: accent + '33', shape: 'pill' },
    { id: 'vercel', label: 'Vercel', sublabel: 'web-app + web-admin · React/Vite', bg: accent + '22' },
    { id: 'api', label: 'Railway — api', sublabel: 'apps/api · Fastify · Node', bg: C.successBg },
    { id: 'apiadmin', label: 'Railway — api-admin', sublabel: 'apps/api-admin · Fastify · Node', bg: C.successBg },
    { id: 'supabase', label: 'Supabase', sublabel: 'PostgreSQL — banco único', bg: C.successBg },
    { id: 'hotmart', label: 'Hotmart', sublabel: 'Webhooks de venda' },
    { id: 'email', label: 'Email (Resend)', sublabel: 'ativação · reset de senha' },
    { id: 'eas', label: 'Expo EAS', sublabel: 'Build + Submit mobile' },
  ];

  const edges: EdgeDef[] = [
    { from: 'browser', to: 'vercel', color: 'accent' },
    { from: 'mobile', to: 'api', color: 'accent' },
    { from: 'vercel', to: 'api', label: 'api.pluralplataforma.com', color: 'accent' },
    { from: 'vercel', to: 'apiadmin', label: 'admin-api...', color: 'accent' },
    { from: 'api', to: 'supabase', color: 'success' },
    { from: 'apiadmin', to: 'supabase', color: 'success' },
    { from: 'hotmart', to: 'apiadmin', label: 'POST /webhooks' },
    { from: 'apiadmin', to: 'email', label: 'ativar + notificar' },
    { from: 'api', to: 'email', label: 'reset de senha' },
    { from: 'eas', to: 'mobile', label: 'build + OTA' },
  ];

  return (
    <Stack gap={24}>
      <div>
        <H2>Diagrama de infraestrutura</H2>
        <Text tone="secondary">Cada serviço no lugar onde é melhor. Custo adicional: ~$5-10/mês (Railway). Resto no free tier.</Text>
      </div>

      <Grid columns={4} gap={12}>
        {[
          { label: 'Vercel', detail: 'Frontend — free', color: accent },
          { label: 'Railway', detail: '~$5-10/mês', color: C.success },
          { label: 'Supabase', detail: 'PostgreSQL — free tier', color: C.success },
          { label: 'MonsterASP', detail: 'CANCELAR após virada', color: theme.stroke.primary },
        ].map((item, i) => (
          <div key={i} style={{ borderLeft: `3px solid ${item.color}`, paddingLeft: 12, paddingTop: 8, paddingBottom: 8 }}>
            <Text weight="semibold" size="small">{item.label}</Text>
            <Text size="small" tone="secondary">{item.detail}</Text>
          </div>
        ))}
      </Grid>

      <DAGDiagram nodes={nodes} edges={edges} direction="vertical" nodeWidth={200} nodeHeight={52} rankGap={80} nodeGap={40} />

      <Divider />
      <H3>Virada de chave — 6 passos</H3>
      <Table
        headers={['Passo', 'Ação', 'Risco', 'Rollback']}
        rows={[
          ['1', 'Node sobe no Railway (URL paralela). Conecta ao mesmo Supabase.', 'Baixo', 'Desligar Railway'],
          ['2', 'Testes com dados reais (leitura). Validar paridade de respostas.', 'Baixo', 'Continuar no .NET'],
          ['3', 'mustResetPassword = true para todas. E-mail para todas as usuárias ativas.', 'Médio', 'Reverter flag no banco'],
          ['4', 'DNS: api.pluralplataforma.com → Railway. Deploy do frontend com nova URL.', 'Alto', 'Reverter DNS (TTL baixo)'],
          ['5', '24-48h de monitoramento. Logs no Railway em tempo real.', 'Baixo', 'Reverter DNS rapidamente'],
          ['6', 'Cancelar MonsterASP. Confirmar que nenhum serviço aponta para runasp.net.', 'Nenhum', '—'],
        ]}
        rowTone={[undefined, undefined, undefined, 'warning', undefined, 'success']}
      />
    </Stack>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function PluralDiagramas() {
  const theme = useHostTheme();
  const [activeTab, setActiveTab] = useState<Tab>('fluxo');

  return (
    <Stack gap={0} style={{ padding: 24, minHeight: '100vh', background: theme.bg.editor }}>
      <Stack gap={4} style={{ marginBottom: 24 }}>
        <H1>Plural — Diagramas e Fluxogramas</H1>
        <Text tone="secondary">
          Documentação visual: fluxo pedagógico · ERD · auth · multi-tenancy · infraestrutura. Abril 2026.
        </Text>
      </Stack>

      <Row gap={8} style={{ marginBottom: 24, flexWrap: 'wrap' }}>
        {TABS.map((tab) => (
          <Button key={tab.id} variant={activeTab === tab.id ? 'primary' : 'secondary'} onClick={() => setActiveTab(tab.id)}>
            {tab.label}
          </Button>
        ))}
      </Row>

      <Divider />
      <div style={{ marginTop: 24 }}>
        {activeTab === 'fluxo' && <FluxoTab />}
        {activeTab === 'erd' && <ErdTab />}
        {activeTab === 'auth' && <AuthTab />}
        {activeTab === 'multitenancy' && <MultitenancyTab />}
        {activeTab === 'infra' && <InfraTab />}
      </div>
    </Stack>
  );
}
