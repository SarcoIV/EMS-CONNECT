import { Dispatch } from './types';
import { formatDateTime } from './utils';

interface PreArrivalInfoProps {
    dispatches: Dispatch[];
}

export default function PreArrivalInfo({ dispatches }: PreArrivalInfoProps) {
    // Filter dispatches that have pre-arrival forms
    const formsWithResponder = dispatches
        .filter((dispatch) => dispatch.pre_arrival_forms.length > 0)
        .flatMap((dispatch) =>
            dispatch.pre_arrival_forms.map((form) => ({
                responder: dispatch.responder,
                form,
            }))
        );

    if (formsWithResponder.length === 0) {
        return (
            <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Pre-Arrival Information</h3>
                <div className="text-center py-8">
                    <div className="text-4xl mb-2">📋</div>
                    <p className="text-sm text-slate-500">No pre-arrival information submitted yet</p>
                    <p className="text-xs text-slate-400 mt-1">
                        Responders can submit this form before arriving at the scene
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">
                Pre-Arrival Information ({formsWithResponder.length})
            </h3>
            <p className="text-xs text-slate-500 mb-4">
                Patient information collected by responders before arrival
            </p>

            <div className="space-y-4">
                {formsWithResponder.map(({ responder, form }, index) => (
                    <div
                        key={index}
                        className="border border-slate-200 rounded-lg p-4"
                    >
                        {/* Form header - who submitted */}
                        <div className="mb-3 pb-3 border-b border-slate-100">
                            <p className="text-sm font-semibold text-slate-800">
                                Submitted by: {responder.name}
                            </p>
                            <p className="text-xs text-slate-500">
                                {formatDateTime(form.submitted_at)}
                            </p>
                        </div>

                        {/* Form data grid */}
                        <div className="grid gap-3 sm:grid-cols-2">
                            {/* Caller name */}
                            {form.caller_name && (
                                <div>
                                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                                        Caller Name
                                    </p>
                                    <p className="text-sm text-slate-800">{form.caller_name}</p>
                                </div>
                            )}

                            {/* Patient name */}
                            <div>
                                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                                    Patient Name
                                </p>
                                <p className="text-sm text-slate-800">{form.patient_name}</p>
                            </div>

                            {/* Sex */}
                            <div>
                                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                                    Sex
                                </p>
                                <p className="text-sm text-slate-800">{form.sex}</p>
                            </div>

                            {/* Age */}
                            <div>
                                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                                    Age
                                </p>
                                <p className="text-sm text-slate-800">{form.age} years old</p>
                            </div>

                            {/* Incident type (from form) */}
                            <div>
                                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                                    Incident Type
                                </p>
                                <p className="text-sm text-slate-800 capitalize">{form.incident_type}</p>
                            </div>

                            {/* Estimated arrival */}
                            {form.estimated_arrival && (
                                <div>
                                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                                        Estimated Arrival
                                    </p>
                                    <p className="text-sm text-slate-800">
                                        {formatDateTime(form.estimated_arrival)}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
