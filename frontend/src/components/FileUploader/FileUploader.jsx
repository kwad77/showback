import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import * as XLSX from 'xlsx'
import { ArrowUpTrayIcon, DocumentIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'
import { upload as uploadApi } from '../../services/api.js'
import { useApp } from '../../context/AppContext.jsx'
import ColumnMapper from './ColumnMapper.jsx'
import clsx from 'clsx'

const TABS = ['Cost Objects', 'Employees']

export default function FileUploader() {
  const { refresh } = useApp()
  const [tab, setTab]             = useState('Cost Objects')
  const [file, setFile]           = useState(null)
  const [headers, setHeaders]     = useState([])
  const [mapping, setMapping]     = useState({})
  const [uploading, setUploading] = useState(false)
  const [result, setResult]       = useState(null)
  const [error, setError]         = useState(null)

  const reset = () => {
    setFile(null); setHeaders([]); setMapping({})
    setResult(null); setError(null)
  }

  // Parse first row of file to extract column headers
  const extractHeaders = useCallback(async (f) => {
    const buf = await f.arrayBuffer()
    const wb  = XLSX.read(buf, { type: 'array' })
    const ws  = wb.Sheets[wb.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1 })
    if (rows.length > 0) setHeaders(rows[0].map(String))
  }, [])

  const onDrop = useCallback(async (accepted) => {
    const f = accepted[0]
    if (!f) return
    reset()
    setFile(f)
    if (tab === 'Cost Objects') {
      await extractHeaders(f)
      // Auto-map obvious column names
      const autoMap = {}
      const lower = (s) => s.toLowerCase().replace(/[^a-z]/g, '')
      headers.forEach((h) => {
        const k = lower(h)
        if (k.includes('asset') || k.includes('name')) autoMap.asset_name ??= h
        if (k === 'category' || k === 'cat')           autoMap.category   ??= h
        if (k === 'cost' || k === 'price')             autoMap.cost       ??= h
        if (k === 'frequency' || k === 'freq')         autoMap.frequency  ??= h
        if (k === 'vendor' || k === 'supplier')        autoMap.vendor     ??= h
        if (k.includes('desc'))                        autoMap.description??= h
      })
      setMapping(autoMap)
    }
  }, [tab, extractHeaders, headers])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    maxFiles: 1,
  })

  const handleUpload = async () => {
    setUploading(true)
    setError(null)
    setResult(null)
    try {
      let res
      if (tab === 'Cost Objects') {
        const required = ['asset_name', 'category', 'cost', 'frequency']
        const missing = required.filter((k) => !mapping[k])
        if (missing.length) throw new Error(`Map the required fields first: ${missing.join(', ')}`)
        res = await uploadApi.costObjects(file, mapping)
      } else {
        res = await uploadApi.employees(file)
      }
      setResult(res)
      refresh()
    } catch (err) {
      setError(err.response?.data?.detail ?? err.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); reset() }}
            className={clsx(
              'px-5 py-2.5 text-sm font-medium border-b-2 transition-colors',
              tab === t
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-gray-500 hover:text-gray-700',
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Template hint */}
      <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-800">
        {tab === 'Cost Objects' ? (
          <>
            Required columns: <code>asset_name, category, cost, frequency</code>.
            Category values: <code>HW | SW | Network | Mobile</code>.
            Frequency values: <code>Monthly | Annual | One-time</code>.
          </>
        ) : (
          <>
            Required column: <code>name</code>.
            Optional: <code>email, department, location, persona</code> (must match an existing persona name).
          </>
        )}
      </div>

      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={clsx(
          'border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors',
          isDragActive
            ? 'border-brand-400 bg-brand-50'
            : 'border-gray-300 hover:border-brand-300 hover:bg-gray-50',
        )}
      >
        <input {...getInputProps()} />
        <ArrowUpTrayIcon className="w-10 h-10 mx-auto text-gray-300 mb-3" />
        {file ? (
          <div className="flex items-center justify-center gap-2 text-sm text-gray-700">
            <DocumentIcon className="w-5 h-5 text-brand-500" />
            <span className="font-medium">{file.name}</span>
            <span className="text-gray-400">({(file.size / 1024).toFixed(0)} KB)</span>
          </div>
        ) : (
          <>
            <p className="text-sm font-medium text-gray-700">
              {isDragActive ? 'Drop it here' : 'Drag & drop a CSV or Excel file'}
            </p>
            <p className="text-xs text-gray-400 mt-1">or click to browse</p>
          </>
        )}
      </div>

      {/* Column mapper (cost objects only) */}
      {tab === 'Cost Objects' && headers.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Map Columns</h3>
          <ColumnMapper
            headers={headers}
            mapping={mapping}
            onChange={(key, val) => setMapping((prev) => ({ ...prev, [key]: val }))}
          />
        </div>
      )}

      {/* Upload button */}
      {file && (
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="btn-primary w-full justify-center py-2.5"
        >
          {uploading ? 'Uploading…' : `Import ${tab}`}
        </button>
      )}

      {/* Result */}
      {result && (
        <div className="card border-emerald-200 bg-emerald-50">
          <div className="flex items-start gap-3">
            <CheckCircleIcon className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-sm text-emerald-800">
              <p className="font-semibold">Import complete</p>
              <p>{result.imported} imported · {result.skipped} skipped (duplicates)</p>
              {result.errors.length > 0 && (
                <ul className="mt-2 space-y-1 list-disc list-inside text-red-700">
                  {result.errors.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="card border-red-200 bg-red-50">
          <div className="flex items-start gap-3">
            <XCircleIcon className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}
    </div>
  )
}
