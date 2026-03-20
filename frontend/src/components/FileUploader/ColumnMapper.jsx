/**
 * ColumnMapper — lets the user tell us which column in their file
 * maps to each required schema field before we POST to the API.
 */
export default function ColumnMapper({ headers, mapping, onChange }) {
  const FIELDS = [
    { key: 'asset_name', label: 'Asset Name', required: true },
    { key: 'category',   label: 'Category (HW/SW/Network/Mobile)', required: true },
    { key: 'cost',       label: 'Cost',       required: true },
    { key: 'frequency',  label: 'Frequency (Monthly/Annual/One-time)', required: true },
    { key: 'vendor',     label: 'Vendor',     required: false },
    { key: 'description',label: 'Description',required: false },
  ]

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600">
        Map your file's columns to the required schema fields:
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {FIELDS.map(({ key, label, required }) => (
          <div key={key}>
            <label className="label">
              {label}
              {required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <select
              className="input"
              value={mapping[key] ?? ''}
              onChange={(e) => onChange(key, e.target.value)}
            >
              <option value="">— select column —</option>
              {headers.map((h) => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  )
}
