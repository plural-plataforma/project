import {
  Button,
  Callout,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Grid,
  H1,
  H2,
  H3,
  Row,
  Stack,
  Stat,
  Table,
  Text,
  useHostTheme,
} from 'cursor/canvas';
import { useState } from 'react';

type Tab = 'fluxo' | 'schema' | 'dominio' | 'migracao' | 'arquitetura' | 'infra';

const TABS: { id: Tab; label: string }[] = [
  { id: 'fluxo', label: 'Fluxo Pedagógico' },
  { id: 'schema', label: 'Schema Prisma' },
  { id: 'dominio', label: 'Entidades & Decisões' },
  { id: 'migracao', label: 'Migração & Stack' },
  { id: 'arquitetura', label: 'Arquitetura Node' },
  { id: 'infra', label: 'Infraestrutura' },
];

function FlowStep({
  num,
  title,
  description,
  items,
  tone,
  tokens,
  badge,
}: {
  num: string;
  title: string;
  description: string;
  items: string[];
  tone?: 'accent' | 'success' | 'warning';
  tokens: ReturnType<typeof useHostTheme>['tokens'];
  badge?: string;
}) {
  const borderColor =
    tone === 'accent' ? tokens.accent
    : tone === 'success' ? tokens.success
    : tone === 'warning' ? tokens.warning
    : tokens.borderSubtle;

  return (
    <div style={{ borderLeft: `3px solid ${borderColor}`, paddingLeft: 16, paddingTop: 8, paddingBottom: 8 }}>
      <Row gap={8} align="center">
        <div style={{
          width: 24, height: 24, borderRadius: 12, background: borderColor,
          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 700, flexShrink: 0,
        }}>{num}</div>
        <Text weight="semibold">{title}</Text>
        {badge && (
          <div style={{
            fontSize: 10, fontWeight: 600, padding: '2px 6px',
            borderRadius: 4, background: tone === 'warning' ? tokens.warning : tokens.success,
            color: '#fff', flexShrink: 0,
          }}>{badge}</div>
        )}
      </Row>
      <Text tone="secondary" size="small" style={{ marginTop: 4 }}>{description}</Text>
      <Stack gap={2} style={{ marginTop: 8 }}>
        {items.map((item, i) => (
          <Row key={i} gap={6} align="center">
            <div style={{ width: 4, height: 4, borderRadius: 2, background: borderColor, flexShrink: 0 }} />
            <Text size="small">{item}</Text>
          </Row>
        ))}
      </Stack>
    </div>
  );
}

function FluxoTab({ tokens }: { tokens: ReturnType<typeof useHostTheme>['tokens'] }) {
  return (
    <Stack gap={24}>
      <div>
        <H2>Fluxo pedagógico completo — validado com a cliente</H2>
        <Text tone="secondary">
          Sequência definitiva baseada nas 40 respostas do Q&A. Cada etapa alimenta a próxima de forma automática.
        </Text>
      </div>

      <Callout tone="info">
        Premissa central: a professora é dona dos seus dados. Multi-tenancy por professora, não por escola.
        Escola é obrigatória, mas os dados pertencem a quem paga — não à instituição.
      </Callout>

      <Grid columns={2} gap={16}>
        <Stack gap={16}>
          <FlowStep num="1" title="Cadastro da Escola" description="Pré-requisito para qualquer coisa. Professora cadastra antes dos alunos." tone="accent" tokens={tokens}
            items={[
              'Nome, tipo, endereço completo',
              'Logo da escola (URL) — aparece nos documentos gerados',
              'Professora só cadastra alunos após ter ao menos uma escola',
            ]}
          />
          <FlowStep num="2" title="Cadastro do Aluno" description="Vinculado obrigatoriamente a uma escola da professora." tone="accent" tokens={tokens}
            items={[
              'Dados gerais: nome completo, data de nascimento (obrigatória — idade cronológica), sexo, turno, ano/série',
              'Escola vinculada (NOT NULL)',
              'Um responsável: nome, contato, e-mail (LGPD — dado sensível)',
              'Laudos/CID: código CID, nome do médico, descrição',
              'Frequência AEE: dias da semana, horário, tipo (individual/grupo)',
              'Perfil pedagógico: potencialidades e necessidades (atualização anual)',
            ]}
          />
          <FlowStep num="3" title="Avaliação Diagnóstica" description="Aplicada individualmente. Mesma estrutura pode ser reutilizada para múltiplos alunos ou reaplicada ao longo do ano." tone="accent" tokens={tokens}
            items={[
              'Seleção de blocos e atividades do catálogo (gerenciado pelo admin)',
              'Associação de múltiplos alunos com necessidades parecidas',
              'Registro de desempenho: AUTONOMOUS / WITH_HELP / NOT_ACHIEVED',
              'Observações por aluno e por atividade',
              'Diagnóstico final = lista de habilidades com status (não percentual)',
              'Habilidades "não atingidas" são sugeridas automaticamente no próximo PAEE',
              'Exportação em PDF (tem imagens — mantém PDF)',
            ]}
          />
        </Stack>
        <Stack gap={16}>
          <FlowStep num="4" title="Estudo de Caso" description="Por lei deve preceder o PAEE, mas o sistema permite criar PAEE sem ele (com aviso)." tone="warning" tokens={tokens} badge="NOVO"
            items={[
              'Eixos fixos: contexto familiar, aprendizagem, comunicação, comportamento, autonomia, barreiras + campo de observações livres',
              'Sistema sugere texto por eixo com base no cadastro e avaliação',
              'Professora revisa e edita (IA para melhorar texto — fase futura)',
              'Revisão anual recomendada — versionamento por ano',
              'Cabeçalho: nome do aluno, data de nascimento, nome da professora, logo da escola',
              'Exportação em DOCX (professora edita antes de entregar à escola)',
            ]}
          />
          <FlowStep num="5" title="PAEE" description="Plano completo por período. Um único PAEE por aluno por período, cobrindo todos os blocos." tone="success" tokens={tokens} badge="REFATORAR"
            items={[
              'Pode ser atribuído a múltiplos alunos (grupo com necessidades parecidas)',
              'Um aluno só tem um PAEE ativo por período — cobre todos os blocos (cognitivo, motor, comunicação)',
              'Habilidades sugeridas a partir do diagnóstico anterior',
              'Quando seleciona habilidade: sistema mostra sugestões de atividade (não atividade pronta)',
              'Sessões geradas automaticamente pela frequência do aluno',
              'Por sessão: campo "planejado" + campo "o que aconteceu"',
              'Presença/ausência obrigatória: PRESENT / ABSENT / CANCELLED / RESCHEDULED',
              'Habilidades trabalhadas na sessão devem vir do PAEE (validação)',
              'Exportação em DOCX com espaço para assinatura (física na maioria, digital futuramente)',
            ]}
          />
          <FlowStep num="6" title="Relatório Consolidado" description="Exportação sob demanda dos relatos de um período selecionável pela professora." tone="success" tokens={tokens} badge="NOVO"
            items={[
              'Período selecionável (mensal, trimestral, semestral — cada rede pede diferente)',
              'Consolida todas as sessões com status de presença e o que aconteceu',
              'Pais têm acesso apenas à versão final (futuramente)',
              'Exportação em DOCX',
            ]}
          />
        </Stack>
      </Grid>

      <Divider />

      <H3>Dependências entre módulos — confirmadas</H3>
      <Table
        headers={['Módulo', 'Depende de', 'Alimenta', 'Export', 'Status']}
        rows={[
          ['Escola', '—', 'Aluno', '—', 'Existe (ajustar: + logo_url)'],
          ['Aluno', 'Escola', 'Avaliação, Estudo de Caso, PAEE', '—', 'Existe (+ date_of_birth, frequência)'],
          ['Avaliação Diagnóstica', 'Aluno + Catálogo', 'PAEE (sugestão de habilidades)', 'PDF', 'Existe (ajustar diagnóstico final)'],
          ['Estudo de Caso', 'Aluno + Avaliação', 'PAEE (FK nullable)', 'DOCX', 'Novo'],
          ['PAEE + Sessões', 'Aluno + Avaliação + Estudo de Caso', 'Relatório', 'DOCX', 'Refatorar (PDI→PAEE)'],
          ['Relatório Consolidado', 'Sessões do PAEE', '—', 'DOCX', 'Novo (query, não entidade)'],
          ['Admin', 'Usuários', 'Todos', '—', 'Existe (reimplementar Hotmart)'],
        ]}
        rowTone={[undefined, undefined, undefined, 'warning', 'warning', 'warning', undefined]}
      />

      <Divider />

      <H3>Regras de negócio críticas</H3>
      <Grid columns={2} gap={12}>
        {[
          { rule: 'Escola obrigatória', detail: 'Aluno sem escola = erro de validação. Professora cadastra escola primeiro.' },
          { rule: 'Dados pertencem à professora', detail: 'Multi-tenancy por teacher_id. Se muda de escola, cadastra novos alunos.' },
          { rule: 'PAEE único por período', detail: 'Um aluno não pode ter dois PAEEs ativos no mesmo período.' },
          { rule: 'Habilidades na sessão = PAEE', detail: 'Habilidades trabalhadas em uma sessão devem pertencer ao PAEE daquele aluno.' },
          { rule: 'Diagnóstico → PAEE', detail: 'Habilidades "não atingidas" na avaliação são sugeridas automaticamente no próximo PAEE.' },
          { rule: 'Dados somem ao cancelar', detail: 'Quando assinatura vence, dados ficam pelo ano vigente. Após isso, soft delete em cascata.' },
          { rule: 'Reset de senha em massa', detail: 'Na virada .NET → Node, todas as usuárias fazem reset. Sem migração de hash PBKDF2.' },
          { rule: 'Catálogo é do admin', detail: 'Blocos, atividades e habilidades base são gerenciados pelo admin. Professora lê e pode criar personalizadas.' },
        ].map((item, i) => (
          <div key={i} style={{ borderLeft: `3px solid ${tokens.borderSubtle}`, paddingLeft: 12, paddingTop: 6, paddingBottom: 6 }}>
            <Text weight="semibold" size="small">{item.rule}</Text>
            <Text size="small" tone="secondary">{item.detail}</Text>
          </div>
        ))}
      </Grid>
    </Stack>
  );
}

function SchemaTab({ tokens }: { tokens: ReturnType<typeof useHostTheme>['tokens'] }) {
  const [group, setGroup] = useState<'auth' | 'catalog' | 'pedagogic' | 'plan'>('auth');

  const groups = [
    { id: 'auth' as const, label: 'Auth & Usuários' },
    { id: 'catalog' as const, label: 'Catálogo (Admin)' },
    { id: 'pedagogic' as const, label: 'Pedagógico (Cadastro)' },
    { id: 'plan' as const, label: 'PAEE & Sessões' },
  ];

  const schemas: Record<typeof group, { title: string; models: { name: string; table: string; fields: string[]; relations?: string[] }[] }> = {
    auth: {
      title: 'Autenticação e usuários',
      models: [
        {
          name: 'User', table: 'users',
          fields: [
            'id          String   @id @default(uuid())',
            'email       String   @unique',
            'password    String   // bcrypt',
            'role        Role     // TEACHER | ADMIN',
            'isActive    Boolean  @default(true)',
            'isAmbassador Boolean @default(false)',
            'mustResetPassword Boolean @default(false)',
            'expirationDate DateTime?',
            'createdAt   DateTime @default(now())',
            'updatedAt   DateTime @updatedAt',
          ],
          relations: ['teacher  Teacher?  // 1:1'],
        },
        {
          name: 'Teacher', table: 'teachers',
          fields: [
            'id          String   @id @default(uuid())',
            'userId      String   @unique',
            'fullName    String',
            'photoUrl    String?  // URL, não byte[]',
            'disciplines String?',
            'teachingLevel String?',
            'about       String?',
            'phone       String?',
            '// endereço: cep, street, number, complement, district, city, state',
          ],
          relations: [
            'user        User',
            'schools     SchoolTeacher[]',
            'students    Student[]',
            'plans       Plan[]',
          ],
        },
        {
          name: 'PasswordResetToken', table: 'password_reset_tokens',
          fields: [
            'id          String   @id @default(uuid())',
            'userId      String',
            'token       String   @unique',
            'expiresAt   DateTime',
            'usedAt      DateTime?',
          ],
        },
      ],
    },
    catalog: {
      title: 'Catálogo global — gerenciado pelo api-admin',
      models: [
        {
          name: 'TeachingLevel', table: 'teaching_levels',
          fields: [
            'id     Int    @id @default(autoincrement())',
            'code   String @unique // EI, EF1, EF2, EM',
            'label  String',
            'order  Int',
          ],
        },
        {
          name: 'Block', table: 'blocks',
          fields: [
            'id          Int      @id @default(autoincrement())',
            'title       String',
            'order       Int',
            'observation String?',
            'icon        String?',
            'isActive    Boolean  @default(true)',
            'createdAt   DateTime @default(now())',
            'updatedAt   DateTime @updatedAt',
          ],
          relations: ['activities Activity[]'],
        },
        {
          name: 'Activity', table: 'activities',
          fields: [
            'id          Int            @id @default(autoincrement())',
            'blockId     Int',
            'title       String',
            'statement   String?        @db.Text',
            'level       ActivityLevel  // EASY | MEDIUM | HARD',
            'minStage    String         // EI, EF1, EF2, EM',
            'maxStage    String?',
            'imageUrl    String?',
            'isActive    Boolean        @default(true)',
            'createdAt   DateTime       @default(now())',
            'updatedAt   DateTime       @updatedAt',
          ],
          relations: ['block Block', 'skills Skill[] (M:N)'],
        },
        {
          name: 'Skill', table: 'skills',
          fields: [
            'id              Int    @id @default(autoincrement())',
            'teachingLevelId Int',
            'type            String',
            'description     String',
            'summary         String?',
            'isActive        Boolean @default(true)',
          ],
          relations: [
            'teachingLevel   TeachingLevel',
            'activities      Activity[] (M:N)',
            'suggestedActivities ActivitySuggestion[]',
          ],
        },
        {
          name: 'ActivitySuggestion', table: 'activity_suggestions',
          fields: [
            'id          Int    @id @default(autoincrement())',
            'skillId     Int',
            'description String @db.Text // sugestão de atividade (não estruturada)',
            'order       Int',
          ],
        },
        {
          name: 'AssessmentCriteria', table: 'assessment_criteria',
          fields: [
            'id          Int     @id @default(autoincrement())',
            'description String',
            'summary     String',
            'isActive    Boolean @default(true)',
          ],
        },
        {
          name: 'Strategy', table: 'strategies',
          fields: [
            'id          Int     @id @default(autoincrement())',
            'description String',
            'summary     String',
            'isActive    Boolean @default(true)',
          ],
        },
      ],
    },
    pedagogic: {
      title: 'Entidades pedagógicas — pertencentes à professora',
      models: [
        {
          name: 'School', table: 'schools',
          fields: [
            'id              String @id @default(uuid())',
            'teacherId       String',
            'name            String',
            'type            String',
            'logoUrl         String? // cabeçalho dos documentos',
            '// endereço: cep, street, number, complement, district, city, state',
          ],
          relations: ['teacher Teacher', 'students Student[]'],
        },
        {
          name: 'Student', table: 'students',
          fields: [
            'id              String  @id @default(uuid())',
            'teacherId       String',
            'schoolId        String  // NOT NULL — escola obrigatória',
            'guardianId      String?',
            'fullName        String',
            'dateOfBirth     DateTime // NOT NULL — idade cronológica',
            'gender          String?',
            'shift           String?',
            'grade           String?',
            '// endereço: cep, street, number, complement, district, city, state',
            'phone           String?',
            'createdAt       DateTime @default(now())',
          ],
          relations: [
            'teacher Teacher',
            'school  School',
            'guardian Guardian?',
            'medicalReports MedicalReport[]',
            'profile StudentProfile?',
            'plans   PlanStudent[]',
          ],
        },
        {
          name: 'StudentProfile', table: 'student_profiles',
          fields: [
            'id              String   @id @default(uuid())',
            'studentId       String   @unique',
            'potentialities  String?  @db.Text',
            'needs           String?  @db.Text',
            'weeklyFrequency Int?',
            'attendanceDays  String[] // ["MON","WED","FRI"]',
            'serviceType     ServiceType? // INDIVIDUAL | GROUP | COUNTERSHIFT',
            'attendanceTime  String?',
            'year            Int      @default(current year) // versionamento anual',
            'updatedAt       DateTime @updatedAt',
          ],
          relations: ['student Student'],
        },
        {
          name: 'Guardian', table: 'guardians',
          fields: [
            'id          String @id @default(uuid())',
            'fullName    String',
            'relationship String? // mãe, pai, avó, tutor...',
            'phone       String',
            'email       String',
            '// LGPD: dado sensível, acesso restrito',
          ],
          relations: ['students Student[]'],
        },
        {
          name: 'MedicalReport', table: 'medical_reports',
          fields: [
            'id          String  @id @default(uuid())',
            'studentId   String',
            'cidCode     String?',
            'doctorName  String?',
            'description String? @db.Text',
          ],
          relations: ['student Student'],
        },
        {
          name: 'DiagnosticAssessment', table: 'diagnostic_assessments',
          fields: [
            'id              String   @id @default(uuid())',
            'teacherId       String',
            'schoolId        String?',
            'title           String',
            'objective       String?  @db.Text',
            'appliedAt       DateTime',
            'isCompleted     Boolean  @default(false)',
            'createdAt       DateTime @default(now())',
            'updatedAt       DateTime @updatedAt',
          ],
          relations: [
            'teacher     Teacher',
            'blocks      DiagnosticBlock[]',
            'activities  DiagnosticActivity[]',
            'students    DiagnosticStudent[]',
            'performances ActivityPerformance[]',
            'skillResults SkillResult[]',
          ],
        },
        {
          name: 'SkillResult', table: 'skill_results',
          fields: [
            'id                    String           @id @default(uuid())',
            'diagnosticAssessmentId String',
            'studentId             String',
            'skillId               Int',
            'status                SkillStatus      // ACHIEVED | PARTIAL | NOT_ACHIEVED',
            '// Status PARTIAL e NOT_ACHIEVED são sugeridos no próximo PAEE',
          ],
          relations: ['diagnostic DiagnosticAssessment', 'student Student', 'skill Skill'],
        },
        {
          name: 'ActivityPerformance', table: 'activity_performances',
          fields: [
            'id                    String              @id @default(uuid())',
            'diagnosticAssessmentId String',
            'activityId            Int',
            'studentId             String',
            'performanceLevel      PerformanceLevel    // AUTONOMOUS | WITH_HELP | NOT_ACHIEVED | NOT_EVALUATED',
            'observation           String?             @db.Text',
            'recordedAt            DateTime            @default(now())',
          ],
        },
        {
          name: 'CaseStudy', table: 'case_studies',
          fields: [
            'id              String   @id @default(uuid())',
            'studentId       String',
            'teacherId       String',
            'year            Int      // versionamento anual',
            'docxUrl         String?  // gerado sob demanda',
            'createdAt       DateTime @default(now())',
            'updatedAt       DateTime @updatedAt',
          ],
          relations: ['student Student', 'teacher Teacher', 'axes CaseStudyAxis[]'],
        },
        {
          name: 'CaseStudyAxis', table: 'case_study_axes',
          fields: [
            'id              String        @id @default(uuid())',
            'caseStudyId     String',
            'axisType        CaseStudyAxisType // FAMILY_CONTEXT | LEARNING | COMMUNICATION | BEHAVIOR | AUTONOMY | BARRIERS | OBSERVATIONS',
            'generatedText   String?       @db.Text // sugerido pelo sistema',
            'teacherContent  String?       @db.Text // editado pela professora',
          ],
        },
      ],
    },
    plan: {
      title: 'PAEE, Sessões e Habilidades personalizadas',
      models: [
        {
          name: 'Plan (PAEE)', table: 'plans',
          fields: [
            'id              String   @id @default(uuid())',
            'teacherId       String',
            'caseStudyId     String?  // nullable — FK opcional por lei é obrigatório mas sistema permite',
            'title           String',
            'description     String?  @db.Text',
            'startDate       DateTime',
            'endDate         DateTime',
            'status          PlanStatus // ACTIVE | COMPLETED | ARCHIVED',
            'createdAt       DateTime @default(now())',
            'updatedAt       DateTime @updatedAt',
          ],
          relations: [
            'teacher      Teacher',
            'caseStudy    CaseStudy?',
            'students     PlanStudent[]',
            'skills       PlanSkill[]',
            'strategies   PlanStrategy[]',
            'criteria     PlanCriteria[]',
            'sessions     PlanSession[]',
          ],
        },
        {
          name: 'PlanStudent (pivot)', table: 'plan_students',
          fields: [
            'planId     String',
            'studentId  String',
            '@@id([planId, studentId])',
          ],
        },
        {
          name: 'PlanSession', table: 'plan_sessions',
          fields: [
            'id                String           @id @default(uuid())',
            'planId            String',
            'studentId         String?          // null = sessão de grupo',
            'sessionDate       DateTime         // gerada automaticamente',
            'attendanceStatus  AttendanceStatus // PRESENT | ABSENT | CANCELLED | RESCHEDULED',
            'occurrenceNotes   String?          // detalhe de cancelamento/reagendamento',
            'plannedContent    String?          @db.Text // o que a prof planejou',
            'actualContent     String?          @db.Text // o que realmente aconteceu',
            'createdAt         DateTime         @default(now())',
            'updatedAt         DateTime         @updatedAt',
          ],
          relations: ['plan Plan', 'student Student?', 'skills PlanSessionSkill[]'],
        },
        {
          name: 'PlanSessionSkill (pivot)', table: 'plan_session_skills',
          fields: [
            'sessionId  String',
            'skillId    Int    // deve pertencer aos PlanSkills do plano — validação no service',
            '@@id([sessionId, skillId])',
          ],
        },
        {
          name: 'CustomSkill', table: 'custom_skills',
          fields: [
            'id              Int    @id @default(autoincrement())',
            'teacherId       String',
            'teachingLevelId Int',
            'type            String',
            'description     String',
            'summary         String?',
          ],
          relations: ['teacher Teacher'],
        },
      ],
    },
  };

  const current = schemas[group];

  return (
    <Stack gap={24}>
      <div>
        <H2>Schema Prisma — estrutura definitiva</H2>
        <Text tone="secondary">
          Todas as decisões do Q&A já incorporadas. Banco permanece PostgreSQL (Supabase).
        </Text>
      </div>

      <Grid columns={4} gap={8}>
        {groups.map(g => (
          <Button key={g.id} variant={group === g.id ? 'primary' : 'secondary'} onClick={() => setGroup(g.id)}>
            {g.label}
          </Button>
        ))}
      </Grid>

      <Divider />
      <H3>{current.title}</H3>

      <Grid columns={2} gap={12}>
        {current.models.map((model, i) => (
          <Card key={i}>
            <CardHeader>
              <Row gap={8} align="center">
                <Text weight="semibold">{model.name}</Text>
                <Text size="small" tone="secondary">→ {model.table}</Text>
              </Row>
            </CardHeader>
            <CardBody>
              <Stack gap={2}>
                {model.fields.map((f, j) => (
                  <Text key={j} size="small" style={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>{f}</Text>
                ))}
                {model.relations && model.relations.length > 0 && (
                  <>
                    <div style={{ height: 8 }} />
                    {model.relations.map((r, j) => (
                      <Text key={j} size="small" tone="secondary" style={{ fontFamily: 'monospace' }}>// {r}</Text>
                    ))}
                  </>
                )}
              </Stack>
            </CardBody>
          </Card>
        ))}
      </Grid>

      <Divider />
      <H3>Enums Prisma</H3>
      <Grid columns={3} gap={12}>
        {[
          { name: 'Role', values: ['TEACHER', 'ADMIN'] },
          { name: 'ServiceType', values: ['INDIVIDUAL', 'GROUP', 'COUNTERSHIFT'] },
          { name: 'PerformanceLevel', values: ['AUTONOMOUS', 'WITH_HELP', 'NOT_ACHIEVED', 'NOT_EVALUATED'] },
          { name: 'SkillStatus', values: ['ACHIEVED', 'PARTIAL', 'NOT_ACHIEVED'] },
          { name: 'AttendanceStatus', values: ['PRESENT', 'ABSENT', 'CANCELLED', 'RESCHEDULED'] },
          { name: 'PlanStatus', values: ['ACTIVE', 'COMPLETED', 'ARCHIVED'] },
          { name: 'ActivityLevel', values: ['EASY', 'MEDIUM', 'HARD'] },
          { name: 'CaseStudyAxisType', values: ['FAMILY_CONTEXT', 'LEARNING', 'COMMUNICATION', 'BEHAVIOR', 'AUTONOMY', 'BARRIERS', 'OBSERVATIONS'] },
        ].map((e, i) => (
          <Card key={i}>
            <CardHeader>{e.name}</CardHeader>
            <CardBody>
              <Stack gap={2}>
                {e.values.map((v, j) => (
                  <Text key={j} size="small" style={{ fontFamily: 'monospace' }}>{v}</Text>
                ))}
              </Stack>
            </CardBody>
          </Card>
        ))}
      </Grid>
    </Stack>
  );
}

function DominioTab() {
  return (
    <Stack gap={24}>
      <div>
        <H2>Decisões de domínio — todas fechadas</H2>
        <Text tone="secondary">Consolidado das 40 respostas. Sem ambiguidades pendentes.</Text>
      </div>

      <Grid columns={3} gap={12}>
        <Stat value="40/40" label="Perguntas respondidas" tone="success" />
        <Stat value="8" label="Novas entidades" tone="warning" />
        <Stat value="0" label="Pendências abertas" tone="success" />
      </Grid>

      <Divider />
      <H3>Decisões de alto impacto no schema</H3>
      <Table
        headers={['Decisão', 'Resposta da cliente', 'Impacto no schema']}
        rows={[
          ['Escola obrigatória?', 'Sempre. Ambiente educacional apenas.', 'schoolId NOT NULL em students'],
          ['Dados da professora ou da escola?', 'Da professora. Ela paga.', 'teacherId em todas as entidades. Multi-tenancy por teacher.'],
          ['PAEE individual ou grupo?', 'Pode ser atribuído a múltiplos alunos.', 'Tabela plan_students (N:N) — confirmada'],
          ['Múltiplos PAEEs simultâneos?', 'Não. Um único por período, cobre todos os blocos.', 'Constraint: um PAEE ativo por aluno por período'],
          ['Diagnóstico final = percentual?', 'Não. Lista de habilidades com status.', 'Remove percentual. Cria skill_results com SkillStatus enum'],
          ['Avaliação alimenta PAEE?', 'Sim. Habilidades não atingidas viram sugestões.', 'Service: ao criar PAEE, busca skill_results PARTIAL/NOT_ACHIEVED'],
          ['Formato dos documentos?', 'DOCX (PAEE, Estudo de Caso, Relatório). PDF apenas para Avaliação Diagnóstica (tem imagens).', 'Lib docx para Node. @react-pdf apenas para avaliação.'],
          ['Estudo de caso obrigatório antes do PAEE?', 'Por lei sim, na prática não. Sistema permite com aviso.', 'plans.case_study_id nullable + warning na UI'],
          ['Eixos do estudo de caso são fixos?', 'Sim + campo de observações livres.', 'Enum CaseStudyAxisType com 7 valores fixos'],
          ['Conteúdo dos eixos?', 'Sistema sugere, professora edita.', 'Dois campos por eixo: generated_text + teacher_content'],
          ['Habilidades no relato = PAEE?', 'Devem estar em consonância com o PAEE.', 'Validação no service: skill pertence ao plan_skills do plano'],
          ['Presença/ausência obrigatória?', 'Sempre registrar. Incluindo canceladas e reagendadas.', 'attendanceStatus NOT NULL. Enum com 4 valores.'],
          ['Planejamento por encontro?', 'Agenda futura + registro do que aconteceu. Datas geradas pela frequência.', 'plan_sessions com planned_content + actual_content'],
          ['Relatório consolidado?', 'Sim, com período selecionável (cada rede pede diferente).', 'Não é entidade — é query sobre plan_sessions por date range'],
          ['Habilidades personalizadas?', 'Sim. Além do catálogo, professora pode criar as suas.', 'Tabela custom_skills com teacherId'],
          ['Sugestão de atividade ao selecionar habilidade?', 'Sim. Sugestão, não atividade pronta (boa prática pedagógica).', 'Tabela activity_suggestions vinculada à skill'],
          ['Dados ao cancelar assinatura?', 'Ficam pelo ano vigente, depois somem.', 'Campo expirationDate em users + job de cleanup anual'],
          ['Senha na migração?', 'Reset em massa — professoras redefinem.', 'mustResetPassword = true ao migrar. Sem PBKDF2.'],
          ['Webhook Hotmart?', 'Perdeu. Cadastrando manual. Precisa reimplementar.', 'Reimplementar webhook + email de ativação automática'],
          ['Assinatura digital no PAEE?', 'Maioria física. Alguns casos digital (futuro).', 'MVP: espaço no DOCX para assinatura física'],
        ]}
        rowTone={[undefined,undefined,undefined,'warning','warning','warning','warning',undefined,undefined,undefined,'warning','warning',undefined,undefined,'warning','warning',undefined,'warning','warning',undefined]}
      />

      <Divider />
      <H3>Funcionalidades futuras (fora do MVP)</H3>
      <Table
        headers={['Funcionalidade', 'Gatilho']}
        rows={[
          ['Perfis adicionais: psicopedagogo, coordenador, professor regente', 'Quando o produto amadurecer e houver demanda clara'],
          ['Acesso da coordenadora/diretora à plataforma', 'Criação de roles adicionais — fase futura'],
          ['Comunicação com responsáveis pela plataforma', 'Depende de análise de LGPD — dado sensível'],
          ['Assinatura digital nos documentos', 'Após MVP estável'],
          ['IA para melhorar texto dos eixos do Estudo de Caso', 'Após Estudo de Caso funcional'],
          ['Modelo de acesso por número de alunos (freemium)', 'Decisão de negócio — campo plan_tier reservado no schema'],
          ['Integração com redes municipais/estaduais', 'Depende de parcerias institucionais'],
        ]}
      />
    </Stack>
  );
}

function MigracaoTab({ tokens }: { tokens: ReturnType<typeof useHostTheme>['tokens'] }) {
  return (
    <Stack gap={24}>
      <div>
        <H2>Migração .NET → Node.js — plano definitivo</H2>
        <Text tone="secondary">
          Banco permanece no Supabase. .NET no MonsterASP (free) é desligado após a virada. Node vai para Railway (~$5/mês).
        </Text>
      </div>

      <Callout tone="success">
        Decisão tomada: reset de senha em massa na virada. Todas as professoras recebem e-mail para redefinir.
        Sem migração de hash PBKDF2. Auth começa limpa com bcrypt.
      </Callout>

      <H3>Fases de migração</H3>
      <Table
        headers={['Fase', 'Escopo', 'Risco', 'Critério de conclusão']}
        rows={[
          ['1 — Setup', 'Estrutura do monorepo: apps/api (plataforma) + apps/api-admin. packages/db (Prisma), packages/schemas (Zod). Conectar Supabase. CI no Railway.', 'Baixo', 'Deploy automático funcionando. Health check respondendo. prisma db pull executado.'],
          ['2 — Auth', 'Login, JWT, refresh token, logout. Fluxo completo de reset de senha (email + token + nova senha). mustResetPassword para todas as usuárias existentes.', 'Médio', 'Auth 100% coberta por testes. Fluxo de reset testado end-to-end.'],
          ['3 — Catálogo (api-admin)', 'CRUD de blocks, activities, skills, activity_suggestions, teaching_levels, strategies, assessment_criteria. Seed dos dados existentes.', 'Baixo', 'Todos os dados do .NET migrados para o catálogo novo. Admin consegue gerenciar pelo painel.'],
          ['4 — Cadastros base', 'Schools (+ logo_url), Students (+ date_of_birth), StudentProfiles, Guardians, MedicalReports. Migrations de renomeação.', 'Médio', 'CRUD completo com testes. Validação de ownership por teacherId em todos os endpoints.'],
          ['5 — Avaliação Diagnóstica', 'DiagnosticAssessments, DiagnosticBlocks/Activities/Students, ActivityPerformances, SkillResults. Export PDF. Remoção do percentual de autonomia.', 'Médio', 'Paridade funcional com .NET. Diagnóstico final mostra habilidades com status correto.'],
          ['6 — PAEE', 'Plans, PlanStudents, PlanSkills, PlanStrategies, PlanCriteria, PlanSessions (planned + actual + attendance). CustomSkills. Sessões geradas pela frequência. Export DOCX.', 'Alto', 'Dados legados (PDIs) acessíveis. PAEE novo com sessões e relato integrado funcionando.'],
          ['7 — Estudo de Caso', 'CaseStudies, CaseStudyAxes. Geração de texto sugerido. Export DOCX com cabeçalho (nome, DN, logo da escola).', 'Baixo (novo)', 'Testes unitários e de integração. Geração de DOCX testada.'],
          ['8 — Relatório & Admin', 'Relatório consolidado (query por período). Admin endpoints. Reimplementar Hotmart webhook + email de ativação automática.', 'Médio', 'Webhook testado com payload real. Relatório gerado corretamente por qualquer período.'],
          ['9 — Virada de chave', 'Node-api sobe em URL paralela. Testes com dados reais. Atualiza frontend (web-app + mobile) para nova URL. Reset de senha em massa. DNS atualizado.', 'Alto', 'Monitoramento 24h sem regressão. MonsterASP cancelado.'],
        ]}
        rowTone={[undefined,undefined,undefined,undefined,undefined,'warning',undefined,undefined,'warning']}
      />

      <Divider />

      <H3>Stack final — sem alternativas</H3>
      <Grid columns={3} gap={12}>
        {[
          { title: 'Framework', main: 'Fastify', detail: 'Performance, schema validation nativa, plugins ecosystem maduro' },
          { title: 'ORM', main: 'Prisma', detail: 'Type-safety end-to-end, migrations declarativas, introspect do banco atual' },
          { title: 'Validação', main: 'Zod', detail: 'Schemas compartilhados entre api, api-admin e web-app via packages/schemas' },
          { title: 'Testes', main: 'Vitest + fastify.inject()', detail: 'Consistente com web-app. Sem Jest separado — mesmo toolchain Turbo.' },
          { title: 'Auth', main: '@fastify/jwt + bcrypt', detail: 'JWT com refresh token. bcrypt para hashes novos. Reset em massa na virada.' },
          { title: 'PDF', main: '@react-pdf/renderer', detail: 'Apenas para Avaliação Diagnóstica (tem imagens). Reutiliza componentes React.' },
          { title: 'DOCX', main: 'docx (npm)', detail: 'PAEE, Estudo de Caso, Relatório. Professora edita antes de entregar à escola.' },
          { title: 'Email', main: 'Resend ou Nodemailer', detail: 'Reset de senha, ativação por Hotmart, notificações.' },
          { title: 'Hotmart', main: 'Webhook nativo', detail: 'Reimplementar. Payload → ativar usuário automaticamente + disparar email.' },
        ].map((item, i) => (
          <Card key={i}>
            <CardHeader>{item.title}: {item.main}</CardHeader>
            <CardBody><Text size="small" tone="secondary">{item.detail}</Text></CardBody>
          </Card>
        ))}
      </Grid>
    </Stack>
  );
}

function ArquiteturaTab({ tokens }: { tokens: ReturnType<typeof useHostTheme>['tokens'] }) {
  return (
    <Stack gap={24}>
      <div>
        <H2>Arquitetura Node.js — dois apps, banco único</H2>
        <Text tone="secondary">
          Opção A confirmada: apps/api (plataforma) + apps/api-admin (admin). packages/db Prisma compartilhado.
        </Text>
      </div>

      <Grid columns={2} gap={16}>
        <Stack gap={12}>
          <H3>Estrutura do monorepo</H3>
          <Card>
            <CardBody>
              <Stack gap={2}>
                {[
                  'apps/',
                  '  api/              ← plataforma (professoras)',
                  '    src/',
                  '      modules/',
                  '        auth/',
                  '        schools/',
                  '        students/',
                  '        diagnostic-assessments/',
                  '        case-studies/',
                  '        plans/',
                  '        plan-sessions/',
                  '        reports/',
                  '      lib/',
                  '        prisma.ts',
                  '        jwt.ts',
                  '        email.ts',
                  '        pdf.ts       ← avaliação diagnóstica',
                  '        docx.ts      ← PAEE, estudo de caso, relatório',
                  '        errors.ts',
                  '      plugins/',
                  '        auth.plugin.ts',
                  '        ownership.plugin.ts',
                  '      app.ts / server.ts',
                  '',
                  '  api-admin/        ← gestão da empresa',
                  '    src/',
                  '      modules/',
                  '        auth/',
                  '        users/',
                  '        catalog/',
                  '          blocks/',
                  '          activities/',
                  '          skills/',
                  '          strategies/',
                  '        webhooks/    ← Hotmart',
                  '',
                  'packages/',
                  '  db/               ← Prisma client único',
                  '    prisma/',
                  '      schema.prisma',
                  '      migrations/',
                  '      seed.ts',
                  '  schemas/          ← Zod (api + api-admin + web-app)',
                  '    src/',
                  '      student.schema.ts',
                  '      plan.schema.ts',
                  '      auth.schema.ts',
                  '      ...',
                ].map((line, i) => (
                  <Text key={i} size="small" style={{ fontFamily: 'monospace', whiteSpace: 'pre' }}>{line}</Text>
                ))}
              </Stack>
            </CardBody>
          </Card>
        </Stack>

        <Stack gap={12}>
          <H3>Responsabilidades por app</H3>
          <Table
            headers={['apps/api (plataforma)', 'apps/api-admin (admin)']}
            rows={[
              ['Auth de professora (JWT)', 'Auth de administrador (JWT separado)'],
              ['CRUD de escola, aluno, responsável, laudo', 'CRUD de blocks, activities, skills, strategies'],
              ['Avaliação diagnóstica + resultados', 'Gestão de usuários (ativar, desativar, expirar)'],
              ['Estudo de caso + geração de texto', 'Reimplementar webhook Hotmart'],
              ['PAEE + sessões + relatos', 'Email de ativação automática'],
              ['Relatório consolidado (DOCX)', 'Redefinição de senha pelo admin'],
              ['Perfil pedagógico do aluno', 'Catálogo: teaching_levels, activity_suggestions'],
            ]}
          />

          <Divider />

          <H3>Middleware de ownership</H3>
          <div style={{ borderLeft: `3px solid ${tokens.accent}`, paddingLeft: 12, paddingTop: 8, paddingBottom: 8 }}>
            <Text weight="semibold" size="small">Regra central de segurança</Text>
            <Text size="small" tone="secondary" style={{ marginTop: 4 }}>
              Todo endpoint de apps/api valida que o recurso acessado pertence ao teacherId extraído do JWT.
              Implementado como plugin Fastify que injeta o check antes do handler:
            </Text>
            <Stack gap={2} style={{ marginTop: 8 }}>
              {[
                '// GET /students/:id',
                '// Plugin verifica: student.teacherId === req.user.id',
                '// Se não: 403 Forbidden',
                '',
                '// Aplicado em: schools, students, plans,',
                '// diagnostic-assessments, case-studies,',
                '// plan-sessions',
              ].map((line, i) => (
                <Text key={i} size="small" style={{ fontFamily: 'monospace', whiteSpace: 'pre' }}>{line}</Text>
              ))}
            </Stack>
          </div>

          <H3>Padrão de teste por camada</H3>
          <Stack gap={8}>
            {[
              { layer: 'Service (unit)', detail: 'Prisma mockado com vitest.mock(). Testa regras de negócio puras.', color: tokens.success },
              { layer: 'Route (integration)', detail: 'fastify.inject() com banco real (Supabase test DB ou SQLite). Testa HTTP + ownership.', color: tokens.accent },
              { layer: 'DOCX/PDF (unit)', detail: 'Testa que os campos corretos aparecem no documento gerado. Não compara bytes.', color: tokens.borderSubtle },
              { layer: 'Webhook (integration)', detail: 'Payload real do Hotmart (staging). Testa ativação de usuário end-to-end.', color: tokens.warning },
            ].map((item, i) => (
              <div key={i} style={{ borderLeft: `3px solid ${item.color}`, paddingLeft: 12, paddingTop: 4, paddingBottom: 4 }}>
                <Text weight="semibold" size="small">{item.layer}</Text>
                <Text size="small" tone="secondary">{item.detail}</Text>
              </div>
            ))}
          </Stack>
        </Stack>
      </Grid>
    </Stack>
  );
}

function InfraTab({ tokens }: { tokens: ReturnType<typeof useHostTheme>['tokens'] }) {
  return (
    <Stack gap={24}>
      <div>
        <H2>Infraestrutura de produção</H2>
        <Text tone="secondary">Cada serviço no lugar onde é melhor. Custo total: ~$5-10/mês.</Text>
      </div>

      <Grid columns={4} gap={12}>
        <Stat value="Vercel" label="Frontend (free)" tone="success" />
        <Stat value="Railway" label="Backend Node (~$5-10/mês)" />
        <Stat value="Supabase" label="PostgreSQL (free tier)" tone="success" />
        <Stat value="Expo EAS" label="Mobile (app nativo)" />
      </Grid>

      <Divider />

      <H3>Mapa de URLs de produção</H3>
      <Table
        headers={['URL', 'Serviço', 'Hospedagem', 'Deploy']}
        rows={[
          ['app.pluralplataforma.com', 'web-app (professoras)', 'Vercel', 'git push → deploy automático'],
          ['adm.pluralplataforma.com', 'web admin', 'Vercel', 'git push → deploy automático'],
          ['api.pluralplataforma.com', 'apps/api (Node — plataforma)', 'Railway', 'git push → deploy automático'],
          ['admin-api.pluralplataforma.com', 'apps/api-admin (Node — admin)', 'Railway', 'git push → deploy automático'],
          ['(banco)', 'PostgreSQL', 'Supabase', 'Gerenciado — sem deploy'],
          ['(mobile)', 'Expo app nativo', 'EAS Build', 'eas build + eas submit'],
        ]}
      />

      <Divider />

      <H3>Estratégia de virada de chave</H3>
      <Stack gap={12}>
        {[
          {
            step: '1 — Node sobe em paralelo',
            detail: 'Railway com URL temporária (node-api.pluralplataforma.com). Conectado ao mesmo Supabase. .NET continua no MonsterASP.',
            tone: tokens.accent,
          },
          {
            step: '2 — Testes com dados reais',
            detail: 'Testar todos os endpoints com dados do banco de produção (somente leitura inicialmente). Validar paridade funcional.',
            tone: tokens.accent,
          },
          {
            step: '3 — Reset de senha em massa',
            detail: 'Disparar e-mail para todas as professoras ativas com link de redefinição. mustResetPassword = true. Prazo de 7 dias.',
            tone: tokens.warning,
          },
          {
            step: '4 — Atualizar frontends',
            detail: 'web-app e mobile apontam para api.pluralplataforma.com (Railway). Novo DNS. Deploy simultâneo nos dois.',
            tone: tokens.warning,
          },
          {
            step: '5 — Monitoramento',
            detail: '24-48h de observação. Logs no Railway em tempo real. .NET ainda responde como fallback.',
            tone: tokens.success,
          },
          {
            step: '6 — Cancelar MonsterASP',
            detail: 'Zero custo, era free. Confirmar que nenhum serviço ainda aponta para runasp.net.',
            tone: tokens.success,
          },
        ].map((item, i) => (
          <div key={i} style={{ borderLeft: `3px solid ${item.tone}`, paddingLeft: 16, paddingTop: 8, paddingBottom: 8 }}>
            <Text weight="semibold">{item.step}</Text>
            <Text size="small" tone="secondary" style={{ marginTop: 4 }}>{item.detail}</Text>
          </div>
        ))}
      </Stack>

      <Divider />

      <H3>Configuração Railway + Supabase</H3>
      <Grid columns={2} gap={12}>
        <Card>
          <CardHeader>Variáveis de ambiente (Railway)</CardHeader>
          <CardBody>
            <Stack gap={2}>
              {[
                '# Compartilhadas entre api e api-admin:',
                'DATABASE_URL=     # Supabase pooler (pgBouncer)',
                'DIRECT_URL=       # Supabase direct (migrations)',
                '',
                '# apps/api:',
                'JWT_SECRET=',
                'JWT_REFRESH_SECRET=',
                'SMTP_HOST=',
                'SMTP_USER=',
                'SMTP_PASS=',
                '',
                '# apps/api-admin:',
                'ADMIN_JWT_SECRET=',
                'HOTMART_HOTTOK=',
                'HOTMART_CLIENT_ID=',
                'HOTMART_CLIENT_SECRET=',
                'HOTMART_PRODUCT_ID=',
              ].map((line, i) => (
                <Text key={i} size="small" style={{ fontFamily: 'monospace', whiteSpace: 'pre' }}>{line}</Text>
              ))}
            </Stack>
          </CardBody>
        </Card>
        <Card>
          <CardHeader>schema.prisma — datasource</CardHeader>
          <CardBody>
            <Stack gap={2}>
              {[
                'datasource db {',
                '  provider  = "postgresql"',
                '  url       = env("DATABASE_URL")',
                '  directUrl = env("DIRECT_URL")',
                '}',
                '',
                '// DATABASE_URL  = pooler URL do Supabase',
                '//   ?pgbouncer=true&connection_limit=1',
                '// DIRECT_URL    = direct URL do Supabase',
                '//   (usado pelo prisma migrate deploy)',
                '',
                'generator client {',
                '  provider = "prisma-client-js"',
                '  output   = "../../packages/db/client"',
                '}',
              ].map((line, i) => (
                <Text key={i} size="small" style={{ fontFamily: 'monospace', whiteSpace: 'pre' }}>{line}</Text>
              ))}
            </Stack>
          </CardBody>
        </Card>
      </Grid>

      <Callout tone="info">
        Primeiro comando após criar os apps: rodar prisma db pull no Supabase para gerar o schema atual como ponto de partida.
        Depois ajustar nomes e tipos conforme o schema definitivo acima. As migrations de renomeação ficam versionadas.
      </Callout>
    </Stack>
  );
}

export default function PluralPlatformPlan() {
  const { tokens } = useHostTheme();
  const [activeTab, setActiveTab] = useState<Tab>('fluxo');

  return (
    <Stack gap={0} style={{ padding: 24, minHeight: '100vh', background: tokens.background }}>
      <Stack gap={4} style={{ marginBottom: 24 }}>
        <H1>Plural — Plano técnico completo</H1>
        <Text tone="secondary">
          Fluxo pedagógico validado com a cliente (40/40 respostas) · Schema Prisma definitivo ·
          Migração .NET → Node.js · Arquitetura e infraestrutura. Abril 2026.
        </Text>
      </Stack>

      <Row gap={8} style={{ marginBottom: 24, flexWrap: 'wrap' }}>
        {TABS.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? 'primary' : 'secondary'}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </Button>
        ))}
      </Row>

      <Divider />
      <div style={{ marginTop: 24 }}>
        {activeTab === 'fluxo' && <FluxoTab tokens={tokens} />}
        {activeTab === 'schema' && <SchemaTab tokens={tokens} />}
        {activeTab === 'dominio' && <DominioTab />}
        {activeTab === 'migracao' && <MigracaoTab tokens={tokens} />}
        {activeTab === 'arquitetura' && <ArquiteturaTab tokens={tokens} />}
        {activeTab === 'infra' && <InfraTab tokens={tokens} />}
      </div>
    </Stack>
  );
}
