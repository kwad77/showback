/**
 * API service layer — all HTTP calls go through here.
 * Swap the baseURL or add an interceptor to wire in ServiceNow or any other backend.
 */

import axios from 'axios'

const client = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// ── Cost Objects ──────────────────────────────────────────────────────────────

export const costObjects = {
  list:   ()           => client.get('/reports/cost-objects').then(r => r.data),
  create: (data)       => client.post('/reports/cost-objects', data).then(r => r.data),
  update: (id, data)   => client.patch(`/reports/cost-objects/${id}`, data).then(r => r.data),
  remove: (id)         => client.delete(`/reports/cost-objects/${id}`),
}

// ── Personas ──────────────────────────────────────────────────────────────────

export const personas = {
  list:   ()           => client.get('/personas').then(r => r.data),
  create: (data)       => client.post('/personas', data).then(r => r.data),
  get:    (id)         => client.get(`/personas/${id}`).then(r => r.data),
  update: (id, data)   => client.patch(`/personas/${id}`, data).then(r => r.data),
  remove: (id)         => client.delete(`/personas/${id}`),
}

// ── Birthright ────────────────────────────────────────────────────────────────

export const birthright = {
  list:   ()           => client.get('/birthright').then(r => r.data),
  add:    (data)       => client.post('/birthright', data).then(r => r.data),
  toggle: (id, active) => client.patch(`/birthright/${id}`, { is_active: active }).then(r => r.data),
  remove: (id)         => client.delete(`/birthright/${id}`),
}

// ── Employees ─────────────────────────────────────────────────────────────────

export const employees = {
  list:       (params) => client.get('/employees', { params }).then(r => r.data),
  create:     (data)   => client.post('/employees', data).then(r => r.data),
  get:        (id)     => client.get(`/employees/${id}`).then(r => r.data),
  update:     (id, d)  => client.patch(`/employees/${id}`, d).then(r => r.data),
  remove:     (id)     => client.delete(`/employees/${id}`),
  departments:()       => client.get('/employees/departments/list').then(r => r.data),
}

// ── Outliers ──────────────────────────────────────────────────────────────────

export const outliers = {
  list:   (employeeId) => client.get('/outliers', { params: { employee_id: employeeId } }).then(r => r.data),
  create: (data)       => client.post('/outliers', data).then(r => r.data),
  update: (id, data)   => client.patch(`/outliers/${id}`, data).then(r => r.data),
  remove: (id)         => client.delete(`/outliers/${id}`),
}

// ── Reports / TCO ─────────────────────────────────────────────────────────────

export const reports = {
  tcoSummary: () => client.get('/reports/tco-summary').then(r => r.data),
}

// ── Upload ────────────────────────────────────────────────────────────────────

export const upload = {
  costObjects: (file, mapping) => {
    const form = new FormData()
    form.append('file', file)
    form.append('mapping', JSON.stringify(mapping))
    return client.post('/upload/cost-objects', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data)
  },
  employees: (file) => {
    const form = new FormData()
    form.append('file', file)
    return client.post('/upload/employees', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data)
  },
  template: () => client.get('/upload/template/cost-objects').then(r => r.data),
}
