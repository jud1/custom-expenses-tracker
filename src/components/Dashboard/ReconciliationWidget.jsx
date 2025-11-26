import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { cn } from '../../lib/utils';

export function ReconciliationWidget({ totalPending }) {
    const [bankQuota, setBankQuota] = useState('');
    const [status, setStatus] = useState('IDLE'); // IDLE, MATCH, MISMATCH

    const formatCLP = (amount) => {
        return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount);
    };

    useEffect(() => {
        if (!bankQuota) {
            setStatus('IDLE');
            return;
        }
        const quotaValue = parseFloat(bankQuota);
        if (isNaN(quotaValue)) return;

        if (Math.abs(quotaValue - totalPending) < 100) { // Allow small margin for CLP rounding
            setStatus('MATCH');
        } else {
            setStatus('MISMATCH');
        }
    }, [bankQuota, totalPending]);

    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-gray-800 text-lg">Bank Reconciliation</h3>
                <div className={cn(
                    "px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5",
                    status === 'MATCH' ? "bg-emerald-100 text-emerald-700" :
                        status === 'MISMATCH' ? "bg-red-100 text-red-700" :
                            "bg-gray-100 text-gray-600"
                )}>
                    {status === 'MATCH' && <><CheckCircle2 size={14} /> CONCILIATED</>}
                    {status === 'MISMATCH' && <><AlertTriangle size={14} /> ALERT</>}
                    {status === 'IDLE' && <><RefreshCw size={14} /> WAITING INPUT</>}
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="flex-1 w-full">
                    <label className="block text-sm font-medium text-gray-500 mb-1.5">Bank Used Quota</label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
                        <input
                            type="number"
                            value={bankQuota}
                            onChange={(e) => setBankQuota(e.target.value)}
                            className={cn(
                                "w-full pl-8 pr-4 py-2.5 rounded-xl border focus:ring-2 focus:outline-none transition-all font-medium text-gray-800",
                                status === 'MISMATCH'
                                    ? "border-red-200 focus:border-red-500 focus:ring-red-500/20 bg-red-50"
                                    : "border-gray-200 focus:border-primary focus:ring-primary/20 bg-gray-50 focus:bg-white"
                            )}
                            placeholder="0"
                        />
                    </div>
                </div>

                <div className="flex-1 w-full">
                    <label className="block text-sm font-medium text-gray-500 mb-1.5">System Total</label>
                    <div className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 font-medium cursor-not-allowed">
                        {formatCLP(totalPending)}
                    </div>
                </div>
            </div>

            {status === 'MISMATCH' && (
                <div className="mt-4 p-3 bg-red-50 rounded-lg text-sm text-red-600 flex items-start gap-2">
                    <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                    <p>
                        There is a difference of <span className="font-bold">{formatCLP(Math.abs(parseFloat(bankQuota || 0) - totalPending))}</span> between the bank and the system. Please check for missing expenses.
                    </p>
                </div>
            )}
        </div>
    );
}
