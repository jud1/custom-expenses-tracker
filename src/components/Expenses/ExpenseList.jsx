import React from 'react';
import { Calendar, Check, Clock, Pencil } from 'lucide-react';
import { cn } from '../../lib/utils';

export function ExpenseList({ expenses, users, onToggleShare, onEdit }) {
    const formatCLP = (amount) => {
        return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount);
    };

    return (
        <div className="space-y-4">
            <h3 className="font-bold text-gray-800 text-lg">Recent Activity</h3>

            <div className="space-y-3">
                {expenses.map((expense) => (
                    <div key={expense.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

                            {/* Expense Info */}
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0 text-primary font-bold text-lg">
                                    {expense.title.charAt(0)}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-bold text-gray-900">{expense.title}</h4>
                                        <button
                                            onClick={() => onEdit(expense)}
                                            className="p-1 text-gray-300 hover:text-primary hover:bg-indigo-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                                            title="Edit Expense"
                                        >
                                            <Pencil size={14} />
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                                        <Calendar size={14} />
                                        <span>{expense.date}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Amount & Shares */}
                            <div className="flex flex-col items-end gap-3">
                                <span className="text-xl font-bold text-gray-900">{formatCLP(expense.amount)}</span>

                                <div className="flex items-center gap-2">
                                    {expense.shares.map((share) => {
                                        const user = users.find(u => u.id === share.user_id);
                                        if (!user) return null;

                                        const isPaid = share.status === 'PAID';

                                        return (
                                            <button
                                                key={share.id || `${expense.id}-${user.id}`}
                                                onClick={() => onToggleShare(expense.id, user.id, share.status)}
                                                className={cn(
                                                    "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
                                                    isPaid
                                                        ? "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100"
                                                        : "bg-orange-50 text-orange-700 border-orange-100 hover:bg-orange-100"
                                                )}
                                                title={`Click to mark as ${isPaid ? 'Pending' : 'Paid'}`}
                                            >
                                                <img src={user.avatar} className="w-4 h-4 rounded-full" alt="" />
                                                <span>{formatCLP(share.amount)}</span>
                                                {isPaid ? <Check size={12} /> : <Clock size={12} />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                        </div>
                    </div>
                ))}

                {/* Infinite Scroll Placeholder */}
                <div className="py-8 text-center text-gray-400 text-sm">
                    No more expenses to load
                </div>
            </div>
        </div>
    );
}
