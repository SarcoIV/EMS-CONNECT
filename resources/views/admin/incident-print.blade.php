<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Incident Report #{{ str_pad($incident['id'], 4, '0', STR_PAD_LEFT) }} — EMS Connect</title>
    <style>
        /* ── Reset & Base ─────────────────────────────────────────── */
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
            font-family: 'Segoe UI', Arial, sans-serif;
            font-size: 11pt;
            color: #1e293b;
            background: #fff;
            padding: 0;
        }

        /* ── Print Media ──────────────────────────────────────────── */
        @media print {
            body { padding: 0; }
            .no-print { display: none !important; }
            .page-break { page-break-before: always; }
            .section { page-break-inside: avoid; }
            @page {
                size: A4 portrait;
                margin: 15mm 15mm 20mm 15mm;
            }
        }

        @media screen {
            body { background: #e5e7eb; padding: 24px; }
            .paper {
                background: #fff;
                max-width: 794px;
                margin: 0 auto;
                padding: 40px 48px;
                box-shadow: 0 4px 24px rgba(0,0,0,.12);
                border-radius: 8px;
            }
        }

        /* ── Header ──────────────────────────────────────────────── */
        .report-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 3px solid #dc2626;
            padding-bottom: 16px;
            margin-bottom: 20px;
        }

        .org-name {
            font-size: 20pt;
            font-weight: 800;
            color: #dc2626;
            letter-spacing: -0.5px;
        }

        .org-sub {
            font-size: 9pt;
            color: #64748b;
            margin-top: 2px;
        }

        .report-meta {
            text-align: right;
        }

        .report-title {
            font-size: 13pt;
            font-weight: 700;
            color: #0f172a;
        }

        .report-id {
            font-size: 10pt;
            color: #64748b;
            margin-top: 2px;
        }

        .print-date {
            font-size: 8.5pt;
            color: #94a3b8;
            margin-top: 4px;
        }

        /* ── Status Banner ───────────────────────────────────────── */
        .status-banner {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 16px;
            border-radius: 8px;
            margin-bottom: 20px;
            border-left: 5px solid;
        }

        .status-banner.pending    { background: #fffbeb; border-color: #f59e0b; }
        .status-banner.dispatched { background: #eff6ff; border-color: #3b82f6; }
        .status-banner.in_progress { background: #f5f3ff; border-color: #8b5cf6; }
        .status-banner.completed  { background: #ecfdf5; border-color: #10b981; }
        .status-banner.cancelled  { background: #f8fafc; border-color: #94a3b8; }

        .status-icon { font-size: 22pt; }

        .status-info-type {
            font-size: 14pt;
            font-weight: 700;
            text-transform: capitalize;
        }

        .status-badge {
            display: inline-block;
            padding: 2px 10px;
            border-radius: 999px;
            font-size: 8.5pt;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: .5px;
        }

        .badge-pending    { background: #fef3c7; color: #b45309; }
        .badge-dispatched { background: #dbeafe; color: #1d4ed8; }
        .badge-in_progress { background: #ede9fe; color: #7c3aed; }
        .badge-completed  { background: #d1fae5; color: #065f46; }
        .badge-cancelled  { background: #f1f5f9; color: #475569; }

        /* ── Section Styles ──────────────────────────────────────── */
        .section {
            margin-bottom: 20px;
        }

        .section-title {
            font-size: 9pt;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: .8px;
            color: #dc2626;
            border-bottom: 1px solid #fecaca;
            padding-bottom: 4px;
            margin-bottom: 12px;
        }

        /* ── Grid Fields ──────────────────────────────────────────── */
        .field-grid {
            display: grid;
            gap: 10px 20px;
        }

        .field-grid-2 { grid-template-columns: 1fr 1fr; }
        .field-grid-3 { grid-template-columns: 1fr 1fr 1fr; }

        .field-label {
            font-size: 7.5pt;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: .5px;
            color: #94a3b8;
            margin-bottom: 2px;
        }

        .field-value {
            font-size: 10.5pt;
            color: #1e293b;
            font-weight: 500;
        }

        .field-value.mono {
            font-family: 'Courier New', monospace;
            font-size: 9.5pt;
        }

        .field-value.muted { color: #94a3b8; font-style: italic; }

        /* ── Description Box ─────────────────────────────────────── */
        .description-box {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 12px 14px;
            font-size: 10.5pt;
            line-height: 1.6;
            color: #334155;
            white-space: pre-wrap;
        }

        /* ── Timeline ────────────────────────────────────────────── */
        .timeline {
            list-style: none;
            border-left: 2px solid #e2e8f0;
            padding-left: 18px;
            margin-left: 4px;
        }

        .timeline-item {
            position: relative;
            padding-bottom: 12px;
        }

        .timeline-item:last-child { padding-bottom: 0; }

        .timeline-item::before {
            content: '';
            position: absolute;
            left: -23px;
            top: 4px;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #dc2626;
            border: 2px solid #fff;
            outline: 2px solid #dc2626;
        }

        .timeline-item.completed::before { background: #10b981; outline-color: #10b981; }
        .timeline-item.cancelled::before { background: #94a3b8; outline-color: #94a3b8; }
        .timeline-item.pending::before   { background: #f59e0b; outline-color: #f59e0b; }

        .timeline-label {
            font-size: 8pt;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: .4px;
            color: #64748b;
        }

        .timeline-value {
            font-size: 10pt;
            font-weight: 500;
            color: #1e293b;
        }

        /* ── Responder Cards ─────────────────────────────────────── */
        .responder-card {
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 14px;
            margin-bottom: 10px;
        }

        .responder-card:last-child { margin-bottom: 0; }

        .responder-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
        }

        .responder-name {
            font-size: 11pt;
            font-weight: 700;
            color: #0f172a;
        }

        .responder-contact {
            font-size: 9pt;
            color: #64748b;
            margin-top: 1px;
        }

        .dispatch-timeline {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 6px;
            margin-top: 10px;
            border-top: 1px solid #f1f5f9;
            padding-top: 10px;
        }

        .dt-step { text-align: center; }

        .dt-dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            margin: 0 auto 3px;
            background: #e2e8f0;
        }

        .dt-dot.done { background: #10b981; }
        .dt-dot.active { background: #3b82f6; }
        .dt-dot.cancelled { background: #ef4444; }

        .dt-label {
            font-size: 7pt;
            color: #94a3b8;
            text-transform: uppercase;
            letter-spacing: .3px;
        }

        .dt-time {
            font-size: 7.5pt;
            color: #475569;
            font-weight: 600;
        }

        /* ── Pre-arrival Form ────────────────────────────────────── */
        .paf-box {
            background: #f0fdf4;
            border: 1px solid #bbf7d0;
            border-radius: 6px;
            padding: 12px 14px;
            margin-top: 8px;
        }

        .paf-title {
            font-size: 8.5pt;
            font-weight: 700;
            color: #16a34a;
            text-transform: uppercase;
            letter-spacing: .5px;
            margin-bottom: 8px;
        }

        /* ── Calls ───────────────────────────────────────────────── */
        .call-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 12px;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            margin-bottom: 6px;
        }

        .call-row:last-child { margin-bottom: 0; }

        /* ── Footer ──────────────────────────────────────────────── */
        .report-footer {
            margin-top: 28px;
            padding-top: 12px;
            border-top: 1px solid #e2e8f0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .footer-text {
            font-size: 8pt;
            color: #94a3b8;
        }

        .signature-line {
            text-align: center;
        }

        .sig-line {
            border-top: 1px solid #94a3b8;
            width: 180px;
            margin: 0 auto 4px;
            margin-top: 36px;
        }

        .sig-label {
            font-size: 8pt;
            color: #64748b;
        }

        /* ── Print Button (screen only) ──────────────────────────── */
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

        .print-bar .label {
            font-size: 13px;
            font-weight: 600;
        }

        .print-bar .actions { display: flex; gap: 8px; }

        .btn-print {
            background: #dc2626;
            color: #fff;
            border: none;
            padding: 7px 18px;
            border-radius: 6px;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .btn-print:hover { background: #b91c1c; }

        .btn-close {
            background: transparent;
            color: #94a3b8;
            border: 1px solid #334155;
            padding: 7px 18px;
            border-radius: 6px;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
        }

        .btn-close:hover { background: #334155; color: #fff; }

        @media screen {
            body { padding-top: 56px; }
        }
    </style>
</head>
<body>

    {{-- Print/Close Bar (screen only) --}}
    <div class="print-bar no-print">
        <span class="label">
            🖨️ Incident Report #{{ str_pad($incident['id'], 4, '0', STR_PAD_LEFT) }}
        </span>
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

        {{-- ── HEADER ─────────────────────────────────────────── --}}
        <div class="report-header">
            <div>
                <div class="org-name">EMS Connect</div>
                <div class="org-sub">Emergency Management System</div>
            </div>
            <div class="report-meta">
                <div class="report-title">Incident Report</div>
                <div class="report-id">#{{ str_pad($incident['id'], 4, '0', STR_PAD_LEFT) }}</div>
                <div class="print-date">Printed: {{ now()->format('F j, Y g:i A') }}</div>
            </div>
        </div>

        {{-- ── STATUS BANNER ──────────────────────────────────── --}}
        @php
            $typeIcons = [
                'medical'          => '🏥',
                'fire'             => '🔥',
                'accident'         => '🚗',
                'crime'            => '🚨',
                'natural_disaster' => '🌊',
                'other'            => '⚠️',
            ];
            $icon   = $typeIcons[$incident['type']] ?? '⚠️';
            $status = $incident['status'];
        @endphp
        <div class="status-banner {{ $status }}">
            <span class="status-icon">{{ $icon }}</span>
            <div>
                <div class="status-info-type">{{ str_replace('_', ' ', $incident['type'] ?? 'Unknown') }}</div>
                <span class="status-badge badge-{{ $status }}">{{ str_replace('_', ' ', $status) }}</span>
            </div>
        </div>

        {{-- ── INCIDENT INFORMATION ────────────────────────────── --}}
        <div class="section">
            <div class="section-title">📋 Incident Information</div>
            <div class="field-grid field-grid-3">
                <div>
                    <div class="field-label">Incident ID</div>
                    <div class="field-value mono">#{{ str_pad($incident['id'], 4, '0', STR_PAD_LEFT) }}</div>
                </div>
                <div>
                    <div class="field-label">Type</div>
                    <div class="field-value" style="text-transform:capitalize">{{ str_replace('_', ' ', $incident['type'] ?? 'Unknown') }}</div>
                </div>
                <div>
                    <div class="field-label">Status</div>
                    <div class="field-value" style="text-transform:capitalize">{{ str_replace('_', ' ', $status) }}</div>
                </div>
                <div>
                    <div class="field-label">Date Reported</div>
                    <div class="field-value">{{ isset($incident['created_at']) ? \Carbon\Carbon::parse($incident['created_at'])->format('M j, Y g:i A') : 'N/A' }}</div>
                </div>
                <div>
                    <div class="field-label">Date Dispatched</div>
                    <div class="field-value">{{ isset($incident['dispatched_at']) ? \Carbon\Carbon::parse($incident['dispatched_at'])->format('M j, Y g:i A') : '—' }}</div>
                </div>
                <div>
                    <div class="field-label">Date Completed</div>
                    <div class="field-value">{{ isset($incident['completed_at']) ? \Carbon\Carbon::parse($incident['completed_at'])->format('M j, Y g:i A') : '—' }}</div>
                </div>
            </div>
        </div>

        {{-- ── LOCATION ─────────────────────────────────────────── --}}
        <div class="section">
            <div class="section-title">📍 Location</div>
            <div class="field-grid field-grid-2">
                <div>
                    <div class="field-label">Address</div>
                    <div class="field-value">{{ $incident['address'] ?? 'No address recorded' }}</div>
                </div>
                <div>
                    <div class="field-label">GPS Coordinates</div>
                    @if(!empty($incident['latitude']) && !empty($incident['longitude']))
                        <div class="field-value mono">{{ number_format($incident['latitude'], 6) }}, {{ number_format($incident['longitude'], 6) }}</div>
                    @else
                        <div class="field-value muted">No GPS data</div>
                    @endif
                </div>
            </div>
        </div>

        {{-- ── DESCRIPTION ──────────────────────────────────────── --}}
        @if(!empty($incident['description']))
        <div class="section">
            <div class="section-title">📝 Description</div>
            <div class="description-box">{{ $incident['description'] }}</div>
        </div>
        @endif

        {{-- ── REPORTER ─────────────────────────────────────────── --}}
        <div class="section">
            <div class="section-title">👤 Reporter Information</div>
            <div class="field-grid field-grid-3">
                <div>
                    <div class="field-label">Full Name</div>
                    <div class="field-value">{{ $incident['reporter']['name'] ?? 'Unknown' }}</div>
                </div>
                <div>
                    <div class="field-label">Email Address</div>
                    <div class="field-value">{{ $incident['reporter']['email'] ?? '—' }}</div>
                </div>
                <div>
                    <div class="field-label">Phone Number</div>
                    <div class="field-value">{{ $incident['reporter']['phone_number'] ?? '—' }}</div>
                </div>
            </div>
        </div>

        {{-- ── DISPATCH & RESPONDERS ────────────────────────────── --}}
        @if(!empty($incident['dispatches']) && count($incident['dispatches']) > 0)
        <div class="section">
            <div class="section-title">🚑 Dispatched Responders</div>

            @foreach($incident['dispatches'] as $dispatch)
            <div class="responder-card">
                <div class="responder-header">
                    <div>
                        <div class="responder-name">{{ $dispatch['responder']['name'] ?? 'Unknown Responder' }}</div>
                        <div class="responder-contact">
                            {{ $dispatch['responder']['email'] ?? '' }}
                            @if(!empty($dispatch['responder']['phone_number']))
                                · {{ $dispatch['responder']['phone_number'] }}
                            @endif
                        </div>
                    </div>
                    <span class="status-badge badge-{{ $dispatch['status'] }}">{{ str_replace('_', ' ', $dispatch['status']) }}</span>
                </div>

                {{-- Distance / ETA --}}
                @if(!empty($dispatch['distance_text']) || !empty($dispatch['duration_text']))
                <div class="field-grid field-grid-2" style="margin-bottom:10px">
                    @if(!empty($dispatch['distance_text']))
                    <div>
                        <div class="field-label">Distance</div>
                        <div class="field-value">{{ $dispatch['distance_text'] }}</div>
                    </div>
                    @endif
                    @if(!empty($dispatch['duration_text']))
                    <div>
                        <div class="field-label">ETA</div>
                        <div class="field-value">{{ $dispatch['duration_text'] }}</div>
                    </div>
                    @endif
                </div>
                @endif

                {{-- Dispatch Timeline --}}
                <div class="dispatch-timeline">
                    @php
                        $steps = [
                            'Assigned'    => $dispatch['assigned_at']   ?? null,
                            'Accepted'    => $dispatch['accepted_at']   ?? null,
                            'En Route'    => $dispatch['en_route_at']   ?? null,
                            'Arrived'     => $dispatch['arrived_at']    ?? null,
                            'Completed'   => $dispatch['completed_at']  ?? null,
                        ];
                    @endphp
                    @foreach($steps as $label => $timestamp)
                    <div class="dt-step">
                        <div class="dt-dot {{ $timestamp ? 'done' : '' }} {{ ($label === 'Completed' && !empty($dispatch['cancelled_at'])) ? 'cancelled' : '' }}"></div>
                        <div class="dt-label">{{ $label }}</div>
                        <div class="dt-time">{{ $timestamp ? \Carbon\Carbon::parse($timestamp)->format('g:i A') : '—' }}</div>
                    </div>
                    @endforeach
                </div>

                {{-- Cancellation --}}
                @if(!empty($dispatch['cancelled_at']))
                <div style="margin-top:8px;padding:6px 10px;background:#fef2f2;border-radius:5px;font-size:9pt;color:#991b1b;">
                    ❌ Cancelled at {{ \Carbon\Carbon::parse($dispatch['cancelled_at'])->format('g:i A, M j') }}
                    @if(!empty($dispatch['cancellation_reason'])) — {{ $dispatch['cancellation_reason'] }} @endif
                </div>
                @endif

                {{-- Pre-arrival forms --}}
                @if(!empty($dispatch['pre_arrival_forms']) && count($dispatch['pre_arrival_forms']) > 0)
                    @foreach($dispatch['pre_arrival_forms'] as $form)
                    <div class="paf-box">
                        <div class="paf-title">✅ Pre-Arrival Form Submitted</div>
                        <div class="field-grid field-grid-3">
                            <div>
                                <div class="field-label">Patient Name</div>
                                <div class="field-value">{{ $form['patient_name'] ?? '—' }}</div>
                            </div>
                            <div>
                                <div class="field-label">Age / Sex</div>
                                <div class="field-value">{{ $form['age'] ?? '—' }} / {{ $form['sex'] ?? '—' }}</div>
                            </div>
                            <div>
                                <div class="field-label">Incident Type</div>
                                <div class="field-value" style="text-transform:capitalize">{{ $form['incident_type'] ?? '—' }}</div>
                            </div>
                            <div>
                                <div class="field-label">Caller Name</div>
                                <div class="field-value">{{ $form['caller_name'] ?? '—' }}</div>
                            </div>
                            <div>
                                <div class="field-label">Est. Arrival</div>
                                <div class="field-value">{{ isset($form['estimated_arrival']) ? \Carbon\Carbon::parse($form['estimated_arrival'])->format('g:i A') : '—' }}</div>
                            </div>
                            <div>
                                <div class="field-label">Submitted At</div>
                                <div class="field-value">{{ isset($form['submitted_at']) ? \Carbon\Carbon::parse($form['submitted_at'])->format('g:i A, M j') : '—' }}</div>
                            </div>
                        </div>
                    </div>
                    @endforeach
                @endif
            </div>
            @endforeach
        </div>
        @endif

        {{-- ── CALL LOG ─────────────────────────────────────────── --}}
        @if(!empty($incident['calls']) && count($incident['calls']) > 0)
        <div class="section">
            <div class="section-title">📞 Call Log</div>
            @foreach($incident['calls'] as $call)
            <div class="call-row">
                <div>
                    <div style="font-weight:600;font-size:10pt">
                        {{ $call['caller']['name'] ?? 'Unknown' }}
                        <span style="font-weight:400;color:#64748b;font-size:9pt">→ {{ $call['receiver']['name'] ?? 'Admin' }}</span>
                    </div>
                    <div style="font-size:8.5pt;color:#94a3b8;margin-top:2px">
                        Channel: {{ $call['channel_name'] ?? '—' }}
                        @if(!empty($call['initiator_type'])) · Initiator: {{ $call['initiator_type'] }} @endif
                    </div>
                </div>
                <div style="text-align:right">
                    <span class="status-badge {{ $call['status'] === 'ended' ? 'badge-completed' : 'badge-dispatched' }}">{{ $call['status'] }}</span>
                    <div style="font-size:8pt;color:#94a3b8;margin-top:3px">
                        @if(!empty($call['started_at'])) Started: {{ \Carbon\Carbon::parse($call['started_at'])->format('g:i A') }} @endif
                        @if(!empty($call['ended_at'])) · Ended: {{ \Carbon\Carbon::parse($call['ended_at'])->format('g:i A') }} @endif
                    </div>
                </div>
            </div>
            @endforeach
        </div>
        @endif

        {{-- ── FOOTER ───────────────────────────────────────────── --}}
        <div class="report-footer">
            <div class="footer-text">
                EMS Connect — Emergency Management System<br>
                Report generated: {{ now()->format('F j, Y \a\t g:i A') }}<br>
                This is an official incident report document.
            </div>
            <div class="signature-line">
                <div class="sig-line"></div>
                <div class="sig-label">Authorized Signature</div>
            </div>
        </div>

    </div>{{-- .paper --}}
</body>
</html>