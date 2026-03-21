/**
 * Mock dataset for demo mode — 53 employees across 7 departments.
 * All monetary figures are annual USD unless noted.
 */

// ── Birthright items (all 53 employees) ────────────────────────────────────
const BIRTHRIGHT_ANNUAL = 912 // 432 + 180 + 180 + 120

const BIRTHRIGHT_ITEMS = [
  { name: 'Microsoft 365 E3', vendor: 'Microsoft',  category: 'SW',      annual_cost: 432 },
  { name: 'Okta SSO',         vendor: 'Okta',        category: 'SW',      annual_cost: 180 },
  { name: 'CrowdStrike Falcon',vendor: 'CrowdStrike', category: 'SW',      annual_cost: 180 },
  { name: 'Zscaler ZIA',      vendor: 'Zscaler',     category: 'Network', annual_cost: 120 },
]

// ── Persona ID map (matches MOCK_PERSONAS ids below) ────────────────────────
const PERSONA_IDS = {
  'Software Engineer': 1,
  'Sales Rep':         2,
  'Marketing':         3,
  'Finance Analyst':   4,
  'HR Generalist':     5,
  'Executive':         6,
  'IT Operations':     7,
}

const PERSONA_DESCRIPTIONS = {
  'Software Engineer': 'Developer tools: IDE, cloud sandbox, version control, and project management.',
  'Sales Rep':         'Full sales stack: CRM, intelligence, call coaching, and contract management.',
  'Marketing':         'Marketing automation, design, SEO, and content creation tools.',
  'Finance Analyst':   'Reporting, expense management, and financial planning tools.',
  'HR Generalist':     'HRIS, payroll, and recruiting tools for people operations.',
  'Executive':         'Leadership-tier tools including board reporting and executive communication.',
  'IT Operations':     'Infrastructure monitoring, automation, and ITSM tools.',
}

// ── Persona definitions ─────────────────────────────────────────────────────
const PERSONAS = {
  'Software Engineer': {
    annual: 1190,
    color: '#6366f1',
    icon: 'code',
    items: [
      { name: 'GitHub Enterprise',  vendor: 'GitHub',     category: 'SW', cost: 19,   frequency: 'monthly', annual_cost: 228  },
      { name: 'JetBrains IDE',      vendor: 'JetBrains',  category: 'SW', cost: 22,   frequency: 'monthly', annual_cost: 264  },
      { name: 'AWS Dev Sandbox',    vendor: 'AWS',        category: 'Cloud', cost: 50, frequency: 'monthly', annual_cost: 600  },
      { name: 'Jira/Confluence',    vendor: 'Atlassian',  category: 'SW', cost: 8.17, frequency: 'monthly', annual_cost: 98   },
    ],
  },
  'Sales Rep': {
    annual: 4260,
    color: '#10b981',
    icon: 'chart-bar',
    items: [
      { name: 'Salesforce CRM',          vendor: 'Salesforce',  category: 'SW',  cost: 150,  frequency: 'monthly', annual_cost: 1800 },
      { name: 'LinkedIn Sales Navigator', vendor: 'LinkedIn',    category: 'SW',  cost: 80,   frequency: 'monthly', annual_cost: 960  },
      { name: 'Gong',                     vendor: 'Gong',        category: 'SW',  cost: 100,  frequency: 'monthly', annual_cost: 1200 },
      { name: 'DocuSign',                 vendor: 'DocuSign',    category: 'SW',  cost: 25,   frequency: 'monthly', annual_cost: 300  },
    ],
  },
  'Marketing': {
    annual: 2316,
    color: '#f59e0b',
    icon: 'megaphone',
    items: [
      { name: 'HubSpot',              vendor: 'HubSpot',  category: 'SW', cost: 100,  frequency: 'monthly', annual_cost: 1200 },
      { name: 'Adobe Creative Cloud', vendor: 'Adobe',    category: 'SW', cost: 55,   frequency: 'monthly', annual_cost: 660  },
      { name: 'Canva Pro',            vendor: 'Canva',    category: 'SW', cost: 13,   frequency: 'monthly', annual_cost: 156  },
      { name: 'Semrush',              vendor: 'Semrush',  category: 'SW', cost: 25,   frequency: 'monthly', annual_cost: 300  },
    ],
  },
  'Finance Analyst': {
    annual: 2520,
    color: '#8b5cf6',
    icon: 'currency-dollar',
    items: [
      { name: 'Tableau',        vendor: 'Salesforce', category: 'SW', cost: 70,  frequency: 'monthly', annual_cost: 840  },
      { name: 'Concur Expense', vendor: 'SAP',        category: 'SW', cost: 40,  frequency: 'monthly', annual_cost: 480  },
      { name: 'Workiva',        vendor: 'Workiva',    category: 'SW', cost: 100, frequency: 'monthly', annual_cost: 1200 },
    ],
  },
  'HR Generalist': {
    annual: 3240,
    color: '#ec4899',
    icon: 'user-group',
    items: [
      { name: 'Workday Premium',         vendor: 'Workday',   category: 'SW', cost: 100,  frequency: 'monthly', annual_cost: 1200 },
      { name: 'LinkedIn Recruiter Lite', vendor: 'LinkedIn',  category: 'SW', cost: 170,  frequency: 'monthly', annual_cost: 2040 },
    ],
  },
  'Executive': {
    annual: 6700,
    color: '#0ea5e9',
    icon: 'briefcase',
    items: [
      { name: 'Salesforce Exec',          vendor: 'Salesforce', category: 'SW',      cost: 150,  frequency: 'monthly',   annual_cost: 1800 },
      { name: 'Board Reporting Tool',     vendor: 'Diligent',   category: 'SW',      cost: 200,  frequency: 'monthly',   annual_cost: 2400 },
      { name: 'Premium Device Allowance', vendor: 'Internal',   category: 'Hardware',cost: 2500, frequency: 'one-time',  annual_cost: 2500 },
    ],
  },
  'IT Operations': {
    annual: 1440,
    color: '#06b6d4',
    icon: 'server',
    items: [
      { name: 'ServiceNow',    vendor: 'ServiceNow', category: 'SW',      cost: 50,  frequency: 'monthly', annual_cost: 600 },
      { name: 'Ansible Tower', vendor: 'Red Hat',    category: 'SW',      cost: 30,  frequency: 'monthly', annual_cost: 360 },
      { name: 'Datadog Infra', vendor: 'Datadog',    category: 'Monitoring', cost: 40, frequency: 'monthly', annual_cost: 480 },
    ],
  },
}

// ── Employee roster ─────────────────────────────────────────────────────────
// Format: [id, name, department, persona_name, outlier_items_or_null]

const RAW_EMPLOYEES = [
  // Engineering (16) — 3 senior engineers have Datadog APM outlier ($480/yr each)
  [1,  'Arjun Mehta',       'Engineering', 'Software Engineer', [{ name: 'Datadog APM', vendor: 'Datadog', category: 'Monitoring', annual_cost: 480, reason: 'Senior engineer observability stack' }]],
  [2,  'Sofia Reyes',       'Engineering', 'Software Engineer', [{ name: 'Datadog APM', vendor: 'Datadog', category: 'Monitoring', annual_cost: 480, reason: 'Senior engineer observability stack' }]],
  [3,  'Marcus Johnson',    'Engineering', 'Software Engineer', [{ name: 'Datadog APM', vendor: 'Datadog', category: 'Monitoring', annual_cost: 480, reason: 'Senior engineer observability stack' }]],
  [4,  'Priya Nair',        'Engineering', 'Software Engineer', null],
  [5,  'Liam O\'Brien',     'Engineering', 'Software Engineer', null],
  [6,  'Yuki Tanaka',       'Engineering', 'Software Engineer', null],
  [7,  'Fatima Al-Hassan',  'Engineering', 'Software Engineer', null],
  [8,  'Daniel Kim',        'Engineering', 'Software Engineer', null],
  [9,  'Chioma Obi',        'Engineering', 'Software Engineer', null],
  [10, 'Ethan Goldberg',    'Engineering', 'Software Engineer', null],
  [11, 'Aisha Diallo',      'Engineering', 'Software Engineer', null],
  [12, 'Ryan Kowalski',     'Engineering', 'Software Engineer', null],
  [13, 'Mei-Ling Chen',     'Engineering', 'Software Engineer', null],
  [14, 'Tariq Osman',       'Engineering', 'Software Engineer', null],
  [15, 'Elena Vasquez',     'Engineering', 'Software Engineer', null],
  [16, 'Noah Williams',     'Engineering', 'Software Engineer', null],

  // Sales (12) — 3 reps have Outreach.io outlier ($1,200/yr each)
  [17, 'Brandon Carter',    'Sales', 'Sales Rep', [{ name: 'Outreach.io', vendor: 'Outreach', category: 'SW', annual_cost: 1200, reason: 'Enterprise outbound sequences license' }]],
  [18, 'Isabella Torres',   'Sales', 'Sales Rep', [{ name: 'Outreach.io', vendor: 'Outreach', category: 'SW', annual_cost: 1200, reason: 'Enterprise outbound sequences license' }]],
  [19, 'Kwame Asante',      'Sales', 'Sales Rep', [{ name: 'Outreach.io', vendor: 'Outreach', category: 'SW', annual_cost: 1200, reason: 'Enterprise outbound sequences license' }]],
  [20, 'Natalie Dubois',    'Sales', 'Sales Rep', null],
  [21, 'James Nguyen',      'Sales', 'Sales Rep', null],
  [22, 'Valentina Cruz',    'Sales', 'Sales Rep', null],
  [23, 'Derek Washington',  'Sales', 'Sales Rep', null],
  [24, 'Seo-Yeon Park',     'Sales', 'Sales Rep', null],
  [25, 'Mohammed Al-Rashid','Sales', 'Sales Rep', null],
  [26, 'Chloe Bergstrom',   'Sales', 'Sales Rep', null],
  [27, 'Andre Fontaine',    'Sales', 'Sales Rep', null],
  [28, 'Deepa Krishnan',    'Sales', 'Sales Rep', null],

  // Marketing (7) — 2 have Figma Pro outlier ($180/yr each)
  [29, 'Olivia Bennett',    'Marketing', 'Marketing', [{ name: 'Figma Pro', vendor: 'Figma', category: 'Design', annual_cost: 180, reason: 'UX design collaboration license' }]],
  [30, 'Jamal Robinson',    'Marketing', 'Marketing', [{ name: 'Figma Pro', vendor: 'Figma', category: 'Design', annual_cost: 180, reason: 'UX design collaboration license' }]],
  [31, 'Hana Suzuki',       'Marketing', 'Marketing', null],
  [32, 'Lucas Petrov',      'Marketing', 'Marketing', null],
  [33, 'Amara Nwosu',       'Marketing', 'Marketing', null],
  [34, 'Sara Lindqvist',    'Marketing', 'Marketing', null],
  [35, 'Carlos Delgado',    'Marketing', 'Marketing', null],

  // Finance (5) — 1 has Bloomberg Terminal outlier ($24,000/yr)
  [36, 'Victoria Chen',     'Finance', 'Finance Analyst', [{ name: 'Bloomberg Terminal', vendor: 'Bloomberg', category: 'Research', annual_cost: 24000, reason: 'Regulatory research access' }]],
  [37, 'Samuel Okafor',     'Finance', 'Finance Analyst', null],
  [38, 'Ingrid Halvorsen',  'Finance', 'Finance Analyst', null],
  [39, 'Ravi Shankar',      'Finance', 'Finance Analyst', null],
  [40, 'Monique Laurent',   'Finance', 'Finance Analyst', null],

  // Human Resources (4) — all regular
  [41, 'Tanya Ivanova',     'Human Resources', 'HR Generalist', null],
  [42, 'Jerome Campbell',   'Human Resources', 'HR Generalist', null],
  [43, 'Nadia El-Amin',     'Human Resources', 'HR Generalist', null],
  [44, 'Patrick Owusu',     'Human Resources', 'HR Generalist', null],

  // Executive (3) — 1 has Custom Laptop outlier ($3,500 one-time)
  [45, 'Richard Nakamura',  'Executive', 'Executive', [{ name: 'Custom Laptop', vendor: 'Apple', category: 'Hardware', annual_cost: 3500, reason: 'Video production studio setup' }]],
  [46, 'Cassandra Mills',   'Executive', 'Executive', null],
  [47, 'William Osei',      'Executive', 'Executive', null],

  // IT Operations (6) — 2 have PagerDuty Pro outlier ($348/yr each)
  [48, 'Aleksei Sorokin',   'IT Operations', 'IT Operations', [{ name: 'PagerDuty Pro', vendor: 'PagerDuty', category: 'Monitoring', annual_cost: 348, reason: 'On-call incident management' }]],
  [49, 'Zinnia Chakraborty', 'IT Operations', 'IT Operations', [{ name: 'PagerDuty Pro', vendor: 'PagerDuty', category: 'Monitoring', annual_cost: 348, reason: 'On-call incident management' }]],
  [50, 'Tobias Richter',    'IT Operations', 'IT Operations', null],
  [51, 'Amina Bah',         'IT Operations', 'IT Operations', null],
  [52, 'Glen Morales',      'IT Operations', 'IT Operations', null],
  [53, 'Yewande Adeyemi',   'IT Operations', 'IT Operations', null],
]

// ── Computed employee_details ───────────────────────────────────────────────
const employee_details = RAW_EMPLOYEES.map(([id, name, dept, persona, outliers]) => {
  const persona_annual   = PERSONAS[persona].annual
  const outlier_annual   = outliers ? outliers.reduce((s, o) => s + o.annual_cost, 0) : 0
  const total_annual     = BIRTHRIGHT_ANNUAL + persona_annual + outlier_annual
  return {
    employee_id:      id,
    employee_name:    name,
    department:       dept,
    persona_name:     persona,
    birthright_annual: BIRTHRIGHT_ANNUAL,
    persona_annual,
    outlier_annual,
    total_annual,
  }
})

// ── Aggregate helpers ───────────────────────────────────────────────────────
const total_annual_tco = employee_details.reduce((s, e) => s + e.total_annual, 0)
const birthright_total = employee_details.reduce((s, e) => s + e.birthright_annual, 0)
const persona_total    = employee_details.reduce((s, e) => s + e.persona_annual, 0)
const outlier_total    = employee_details.reduce((s, e) => s + e.outlier_annual, 0)

// by_domain (department rollup)
const deptMap = {}
for (const e of employee_details) {
  if (!deptMap[e.department]) deptMap[e.department] = { department: e.department, total_annual: 0, employee_count: 0 }
  deptMap[e.department].total_annual   += e.total_annual
  deptMap[e.department].employee_count += 1
}
const by_domain = Object.values(deptMap).map(d => ({
  ...d,
  avg_per_employee: Math.round(d.total_annual / d.employee_count),
}))

// by_persona
const personaMap = {}
for (const e of employee_details) {
  if (!personaMap[e.persona_name]) personaMap[e.persona_name] = { persona_name: e.persona_name, total_annual: 0, employee_count: 0 }
  personaMap[e.persona_name].total_annual   += e.total_annual
  personaMap[e.persona_name].employee_count += 1
}
const by_persona = Object.values(personaMap).map(p => ({
  ...p,
  persona_id:       PERSONA_IDS[p.persona_name] ?? null,
  avg_per_employee: Math.round(p.total_annual / p.employee_count),
}))

// by_category — sum SW, Cloud, Network, Hardware, Monitoring, etc.
const catMap = {}
const allCostItems = [
  ...BIRTHRIGHT_ITEMS.map(i => ({ ...i, count: 53 })),
  ...RAW_EMPLOYEES.flatMap(([, , , persona, outliers]) => {
    const personaItems = PERSONAS[persona].items.map(i => ({ ...i, count: 1 }))
    const outlierItems = outliers ? outliers.map(i => ({ category: i.category, annual_cost: i.annual_cost, count: 1 })) : []
    return [...personaItems, ...outlierItems]
  }),
]
for (const item of allCostItems) {
  const cat = item.category ?? 'Other'
  if (!catMap[cat]) catMap[cat] = 0
  catMap[cat] += item.annual_cost * (item.count ?? 1)
}
const by_category = Object.entries(catMap).map(([category, total_annual]) => ({
  category,
  total_annual,
  percentage: Math.round(total_annual / total_annual_tco * 100),
}))

// ── MOCK_TCO_SUMMARY ────────────────────────────────────────────────────────
export const MOCK_TCO_SUMMARY = {
  total_employees:      53,
  total_annual_tco,
  avg_tco_per_employee: Math.round(total_annual_tco / 53),
  birthright_total,
  persona_total,
  outlier_total,
  by_domain,
  by_persona,
  by_category,
  employee_details,
}

// ── MOCK_EMPLOYEE_LINE_ITEMS ────────────────────────────────────────────────
export const MOCK_EMPLOYEE_LINE_ITEMS = Object.fromEntries(
  RAW_EMPLOYEES.map(([id, , , persona, outliers]) => [
    id,
    {
      birthright_items: BIRTHRIGHT_ITEMS.map(i => ({ name: i.name, vendor: i.vendor, category: i.category, annual_cost: i.annual_cost })),
      persona_items:    PERSONAS[persona].items.map(i => ({ name: i.name, vendor: i.vendor, category: i.category, annual_cost: i.annual_cost })),
      outlier_items:    outliers ? outliers.map(o => ({ name: o.name, vendor: o.vendor, category: o.category, annual_cost: o.annual_cost, reason: o.reason })) : [],
    },
  ])
)

// ── MOCK_PERSONA_DETAILS ────────────────────────────────────────────────────
const personaEmployeeMap = {}
for (const [id, name, dept, persona, outliers] of RAW_EMPLOYEES) {
  if (!personaEmployeeMap[persona]) personaEmployeeMap[persona] = []
  const persona_annual  = PERSONAS[persona].annual
  const outlier_annual  = outliers ? outliers.reduce((s, o) => s + o.annual_cost, 0) : 0
  const total_annual    = BIRTHRIGHT_ANNUAL + persona_annual + outlier_annual
  personaEmployeeMap[persona].push({
    employee_id:   id,
    employee_name: name,
    department:    dept,
    total_annual,
    outlier_annual,
    has_outliers:  !!outliers,
  })
}

export const MOCK_PERSONA_DETAILS = Object.fromEntries(
  Object.entries(PERSONAS).map(([persona_name, def]) => {
    const emps         = personaEmployeeMap[persona_name] ?? []
    const outlierEmps  = emps.filter(e => e.has_outliers)
    const outlier_avg  = outlierEmps.length
      ? Math.round(outlierEmps.reduce((s, e) => s + e.outlier_annual, 0) / outlierEmps.length)
      : 0

    return [
      persona_name,
      {
        color:        def.color,
        icon:         def.icon,
        cost_objects: def.items.map(i => ({
          name:        i.name,
          vendor:      i.vendor,
          category:    i.category,
          cost:        i.cost,
          frequency:   i.frequency,
          annual_cost: i.annual_cost,
        })),
        employees:     emps,
        outlier_count: outlierEmps.length,
        outlier_avg,
      },
    ]
  })
)

// ── MOCK_PERSONAS — full PersonaRead API shape ───────────────────────────────
// Used to populate the Personas page in demo mode.
let _coIdCounter = 100
export const MOCK_PERSONAS = Object.entries(PERSONAS).map(([name, def]) => {
  const id = PERSONA_IDS[name]
  return {
    id,
    name,
    color:       def.color,
    icon:        def.icon,
    description: PERSONA_DESCRIPTIONS[name] ?? '',
    cost_objects: def.items.map(item => ({
      id:        ++_coIdCounter,
      name:      item.name,
      vendor:    item.vendor,
      category:  item.category,
      cost:      item.cost,
      frequency: item.frequency === 'monthly' ? 'Monthly' : item.frequency === 'one-time' ? 'One-time' : 'Annual',
    })),
    created_at: '2024-01-15T00:00:00Z',
  }
})

// ── MOCK_EMPLOYEES — full EmployeeRead API shape ─────────────────────────────
// Used to populate the Employees page in demo mode.
export const MOCK_EMPLOYEES = RAW_EMPLOYEES.map(([id, name, dept, persona]) => {
  const slug  = name.toLowerCase().replace(/[^a-z\s]/g, '').replace(/\s+/g, '.')
  const pDef  = PERSONAS[persona]
  const pid   = PERSONA_IDS[persona]
  return {
    id,
    name,
    email:      `${slug}@demo.company.com`,
    department: dept,
    location:   null,
    persona_id: pid,
    persona:    pDef ? { id: pid, name: persona, color: pDef.color } : null,
  }
})

// ── MOCK_BIRTHRIGHT — full BirthrightRead API shape ──────────────────────────
// Used to populate the Birthright page in demo mode.
export const MOCK_BIRTHRIGHT = BIRTHRIGHT_ITEMS.map((item, i) => ({
  id:             i + 1,
  cost_object_id: i + 1,
  is_active:      true,
  cost_object: {
    id:        i + 1,
    name:      item.name,
    vendor:    item.vendor,
    category:  item.category,
    cost:      Math.round(item.annual_cost / 12),
    frequency: 'Monthly',
  },
}))
