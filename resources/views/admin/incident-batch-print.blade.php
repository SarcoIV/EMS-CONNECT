<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Incident Batch Report — EMS Connect</title>
    <style>
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
            font-family: 'Segoe UI', Arial, sans-serif;
            font-size: 10.5pt;
            color: #1e293b;
            background: #fff;
        }

        /* ── Print ───────────────────────────────────────────────── */
        @media print {
            .no-print { display: none !important; }
            .page-break { page-break-before: always; }
            .avoid-break { page-break-inside: avoid; }
            @page {
                size: A4 landscape;
                margin: 12mm 14mm 16mm 14mm;
            }
        }

        @media screen {
            body { background: #e5e7eb; padding: 24px; }
            .paper {
                background: #fff;
                max-width: 1060px;
                margin: 0 auto;
                padding: 36px 44px;
                box-shadow: 0 4px 24px rgba(0,0,0,.12);
                border-radius: 8px;
            }
        }

        /* ── Print Bar ───────────────────────────────────────────── */
        .print-bar {
            position: fixed;
            top: 0; left: 0; right: 0;
            background: #1e293b;
            color: #fff;
            padding: 10px 24px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            z-index: 100;
            box-shadow: 0 2px 8px rgba(0,0,0,.3);
        }

        .print-bar .label { font-size: 13px; font-weight: 600; }
        .print-bar .actions { display: flex; gap: 8px; }

        .btn-print {
            background: #dc2626; color: #fff; border: none;
            padding: 7px 18px; border-radius: 6px;
            font-size: 13px; font-weight: 600; cursor: pointer;
        }
        .btn-print:hover { background: #b91c1c; }

        .btn-close {
            background: transparent; color: #94a3b8;
            border: 1px solid #334155; padding: 7px 18px;
            border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer;
        }
        .btn-close:hover { background: #334155; color: #fff; }

        @media screen { body { padding-top: 56px; } }

        /* ── Report Header ───────────────────────────────────────── */
        .report-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 3px solid #dc2626;
            padding-bottom: 14px;
            margin-bottom: 18px;
        }

        .org-name { font-size: 18pt; font-weight: 800; color: #dc2626; }
        .org-sub  { font-size: 8.5pt; color: #64748b; margin-top: 2px; }

        .report-meta { text-align: right; }
        .report-title { font-size: 13pt; font-weight: 700; color: #0f172a; }
        .report-sub   { font-size: 9pt; color: #64748b; margin-top: 2px; }
        .print-date   { font-size: 8pt; color: #94a3b8; margin-top: 4px; }

        /* ── Filter Summary Bar ──────────────────────────────────── */
        .filter-bar {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            padding: 10px 14px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            margin-bottom: 18px;
            font-size: 8.5pt;
            color: #475569;
        }

        .filter-bar strong { color: #0f172a; }

        .filter-tag {
            background: #e0f2fe;
            color: #0369a1;
            padding: 2px 8px;
            border-radius: 999px;
            font-weight: 600;
            font-size: 8pt;
        }

        /* ── Stats Row ───────────────────────────────────────────── */
        .stats-row {
            display: grid;
            grid-template-columns: repeat(6, 1fr);
            gap: 8px;
            margin-bottom: 18px;
        }

        .stat-card {
            text-align: center;
            padding: 10px 6px;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
        }

        .stat-label { font-size: 7.5pt; text-transform: uppercase; letter-spacing: .5px; color: #94a3b8; font-weight: 600; }
        .stat-value { font-size: 18pt; font-weight: 800; margin-top: 2px; }

        .stat-total    .stat-value { color: #1e293b; }
        .stat-pending  .stat-value { color: #d97706; }
        .stat-dispatched .stat-value { color: #2563eb; }
        .stat-progress .stat-value { color: #7c3aed; }
        .stat-completed .stat-value { color: #059669; }
        .stat-cancelled .stat-value { color: #94a3b8; }

        /* ── Table ───────────────────────────────────────────────── */
        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9pt;
        }

        thead tr {
            background: #f8fafc;
            border-bottom: 2px solid #e2e8f0;
        }

        th {
            padding: 8px 10px;
            text-align: left;
            font-size: 7.5pt;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: .5px;
            color: #64748b;
            white-space: nowrap;
        }

        tbody tr { border-bottom: 1px solid #f1f5f9; }
        tbody tr:last-child { border-bottom: none; }
        tbody tr:nth-child(even) { background: #fafafa; }

        td {
            padding: 8px 10px;
            vertical-align: top;
            color: #334155;
        }

        .id-cell {
            font-family: 'Courier New', monospace;
            font-weight: 700;
            color: #dc2626;
            white-space: nowrap;
        }

        .type-cell { white-space: nowrap; }

        /* Status badges */
        .badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 999px;
            font-size: 7.5pt;
            font-weight: 600;
            text-transform: capitalize;
            white-space: nowrap;
        }

        .badge-pending    { background: #fef3c7; color: #b45309; }
        .badge-dispatched { background: #dbeafe; color: #1d4ed8; }
        .badge-in_progress { background: #ede9fe; color: #7c3aed; }
        .badge-completed  { background: #d1fae5; color: #065f46; }
        .badge-cancelled  { background: #f1f5f9; color: #475569; }

        .desc-cell {
            max-width: 200px;
            color: #64748b;
            font-size: 8.5pt;
            line-height: 1.4;
        }

        .addr-cell {
            max-width: 180px;
            font-size: 8.5pt;
            color: #475569;
        }

        .date-cell {
            white-space: nowrap;
            font-size: 8.5pt;
            color: #64748b;
        }

        .reporter-cell { white-space: nowrap; }
        .reporter-name { font-weight: 600; color: #1e293b; }
        .reporter-sub  { font-size: 8pt; color: #94a3b8; margin-top: 1px; }

        /* ── Footer ──────────────────────────────────────────────── */
        .report-footer {
            margin-top: 24px;
            padding-top: 10px;
            border-top: 1px solid #e2e8f0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .footer-text { font-size: 7.5pt; color: #94a3b8; line-height: 1.5; }

        .sig-block { text-align: center; }
        .sig-line  { border-top: 1px solid #94a3b8; width: 160px; margin: 32px auto 4px; }
        .sig-label { font-size: 7.5pt; color: #64748b; }

        /* ── Empty State ─────────────────────────────────────────── */
        .empty-state {
            text-align: center;
            padding: 48px 24px;
            color: #94a3b8;
            font-size: 11pt;
        }
    </style>
</head>
<body>

    {{-- Print Bar --}}
    <div class="print-bar no-print">
        <span class="label">🖨️ Incident Batch Report — {{ $total }} incident(s)</span>
        <div class="actions">
            <button class="btn-close" onclick="
                if (window.opener) {
                    window.close();
                } else if (window.history.length > 1) {
                    window.history.back();
                } else {
                    window.location.href = '/admin/incident-reports';
                }
            ">✕ Close</button>
            <button class="btn-print" onclick="window.print()">🖨️ Print / Save PDF</button>
        </div>
    </div>

    <div class="paper">

        {{-- Header --}}
        <div class="report-header">
            <div>
                <div class="org-name">EMS Connect</div>
                <div class="org-sub">Emergency Management System</div>
            </div>
            <div class="report-meta">
                <div class="report-title">Incident Batch Report</div>
                <div class="report-sub">{{ $total }} incident(s) · Generated by {{ $generatedBy }}</div>
                <div class="print-date">{{ now()->format('F j, Y \a\t g:i A') }}</div>
            </div>
        </div>

        {{-- Active Filters Summary --}}
        <div class="filter-bar">
            <strong>Filters applied:</strong>
            @if($filters['status'] && $filters['status'] !== 'all')
                <span class="filter-tag">Status: {{ $filters['status'] }}</span>
            @endif
            @if($filters['type'] && $filters['type'] !== 'all')
                <span class="filter-tag">Type: {{ str_replace('_', ' ', $filters['type']) }}</span>
            @endif
            @if(!empty($filters['date_from']))
                <span class="filter-tag">From: {{ $filters['date_from'] }}</span>
            @endif
            @if(!empty($filters['date_to']))
                <span class="filter-tag">To: {{ $filters['date_to'] }}</span>
            @endif
            @if(!empty($filters['search']))
                <span class="filter-tag">Search: "{{ $filters['search'] }}"</span>
            @endif
            @if(($filters['status'] ?? 'all') === 'all' && ($filters['type'] ?? 'all') === 'all' && empty($filters['date_from']) && empty($filters['date_to']) && empty($filters['search']))
                <span style="color:#94a3b8;font-style:italic">None — showing all incidents</span>
            @endif
        </div>

        {{-- Stats Row --}}
        <div class="stats-row">
            <div class="stat-card stat-total">
                <div class="stat-label">Total</div>
                <div class="stat-value">{{ $stats['total'] }}</div>
            </div>
            <div class="stat-card stat-pending">
                <div class="stat-label">Pending</div>
                <div class="stat-value">{{ $stats['pending'] }}</div>
            </div>
            <div class="stat-card stat-dispatched">
                <div class="stat-label">Dispatched</div>
                <div class="stat-value">{{ $stats['dispatched'] }}</div>
            </div>
            <div class="stat-card stat-progress">
                <div class="stat-label">In Progress</div>
                <div class="stat-value">{{ $stats['in_progress'] }}</div>
            </div>
            <div class="stat-card stat-completed">
                <div class="stat-label">Completed</div>
                <div class="stat-value">{{ $stats['completed'] }}</div>
            </div>
            <div class="stat-card stat-cancelled">
                <div class="stat-label">Cancelled</div>
                <div class="stat-value">{{ $stats['cancelled'] }}</div>
            </div>
        </div>

        {{-- Incidents Table --}}
        @if(count($incidents) > 0)
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Reporter</th>
                    <th>Location</th>
                    <th>Description</th>
                    <th>Reported</th>
                    <th>Dispatched</th>
                    <th>Completed</th>
                </tr>
            </thead>
            <tbody>
                @php
                    $typeIcons = [
                        'medical'          => '🏥',
                        'fire'             => '🔥',
                        'accident'         => '🚗',
                        'crime'            => '🚨',
                        'natural_disaster' => '🌊',
                        'other'            => '⚠️',
                    ];
                @endphp
                @foreach($incidents as $incident)
                <tr class="avoid-break">
                    <td class="id-cell">#{{ str_pad($incident['id'], 4, '0', STR_PAD_LEFT) }}</td>
                    <td class="type-cell">
                        {{ $typeIcons[$incident['type']] ?? '⚠️' }}
                        {{ str_replace('_', ' ', $incident['type'] ?? 'Unknown') }}
                    </td>
                    <td>
                        <span class="badge badge-{{ $incident['status'] }}">
                            {{ str_replace('_', ' ', $incident['status']) }}
                        </span>
                    </td>
                    <td class="reporter-cell">
                        <div class="reporter-name">{{ $incident['user']['name'] ?? 'Unknown' }}</div>
                        <div class="reporter-sub">{{ $incident['user']['phone_number'] ?? $incident['user']['email'] ?? '—' }}</div>
                    </td>
                    <td class="addr-cell">{{ $incident['address'] ?? '—' }}</td>
                    <td class="desc-cell">
                        {{ $incident['description'] ? \Illuminate\Support\Str::limit($incident['description'], 80) : '—' }}
                    </td>
                    <td class="date-cell">
                        {{ isset($incident['created_at']) ? \Carbon\Carbon::parse($incident['created_at'])->format('M j, Y') : '—' }}<br>
                        <span style="color:#94a3b8">{{ isset($incident['created_at']) ? \Carbon\Carbon::parse($incident['created_at'])->format('g:i A') : '' }}</span>
                    </td>
                    <td class="date-cell">
                        {{ isset($incident['dispatched_at']) ? \Carbon\Carbon::parse($incident['dispatched_at'])->format('M j, Y') : '—' }}<br>
                        <span style="color:#94a3b8">{{ isset($incident['dispatched_at']) ? \Carbon\Carbon::parse($incident['dispatched_at'])->format('g:i A') : '' }}</span>
                    </td>
                    <td class="date-cell">
                        {{ isset($incident['completed_at']) ? \Carbon\Carbon::parse($incident['completed_at'])->format('M j, Y') : '—' }}<br>
                        <span style="color:#94a3b8">{{ isset($incident['completed_at']) ? \Carbon\Carbon::parse($incident['completed_at'])->format('g:i A') : '' }}</span>
                    </td>
                </tr>
                @endforeach
            </tbody>
        </table>
        @else
        <div class="empty-state">
            No incidents match the selected filters.
        </div>
        @endif

        {{-- Footer --}}
        <div class="report-footer">
            <div class="footer-text">
                EMS Connect — Emergency Management System<br>
                Report generated: {{ now()->format('F j, Y \a\t g:i A') }} by {{ $generatedBy }}<br>
                This document contains {{ $total }} incident record(s). Confidential — for authorized personnel only.
            </div>
            <div class="sig-block">
                <div class="sig-line"></div>
                <div class="sig-label">Authorized Signature</div>
            </div>
        </div>

    </div>
</body>
</html>