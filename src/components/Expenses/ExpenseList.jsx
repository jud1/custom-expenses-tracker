import React, { useState } from 'react';
import { Calendar, User, Edit2, Trash2, Archive } from 'lucide-react';
import { UserAvatar } from '../UserAvatar';
import { cn } from '../../lib/utils';
import { ConfirmationModal } from '../UI/ConfirmationModal';

export function ExpenseList({ expenses, onEdit, onToggleShare, onDelete, onDeleteMultiple, onArchive, onArchiveMultiple }) {
    const [selectedExpenses, setSelectedExpenses] = useState([]);
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        type: null, // 'single' | 'multiple' | 'archive'
        id: null,
        count: 0
    });

    const formatCLP = (amount) => {
        return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount);
    };

    const formatDate = (dateString) => {
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}`;
    };

    const toggleSelection = (id) => {
        setSelectedExpenses(prev =>
            prev.includes(id) ? prev.filter(eid => eid !== id) : [...prev, id]
        );
    };

    const toggleAll = () => {
        if (selectedExpenses.length === expenses.length) {
            setSelectedExpenses([]);
        } else {
            setSelectedExpenses(expenses.map(e => e.id));
        }
    };

    const handleDeleteClick = (id) => {
        setConfirmModal({
            isOpen: true,
            type: 'single',
            id: id,
            count: 1
        });
    };

    const handleArchiveSelectedClick = () => {
        setConfirmModal({
            isOpen: true,
            type: 'archive-multiple',
            id: null,
            count: selectedExpenses.length
        });
    };

    const handleArchiveClick = (id) => {
        setConfirmModal({
            isOpen: true,
            type: 'archive',
            id: id,
            count: 1
        });
    };

    const handleDeleteSelectedClick = () => {
        setConfirmModal({
            isOpen: true,
            type: 'multiple',
            id: null,
            count: selectedExpenses.length
        });
    };

    const handleConfirmDelete = () => {
        if (confirmModal.type === 'single' && confirmModal.id) {
            onDelete(confirmModal.id);
        } else if (confirmModal.type === 'multiple') {
            onDeleteMultiple(selectedExpenses);
            setSelectedExpenses([]);
        } else if (confirmModal.type === 'archive' && confirmModal.id) {
            onArchive(confirmModal.id);
        } else if (confirmModal.type === 'archive-multiple') {
            onArchiveMultiple(selectedExpenses);
            setSelectedExpenses([]);
        }
        setConfirmModal({ isOpen: false, type: null, id: null, count: 0 });
    };

    if (expenses.length === 0) {
        return (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="text-gray-400" size={24} />
                </div>
                <h3 className="text-lg font-medium text-gray-900">No expenses yet</h3>
                <p className="text-gray-500 mt-1">Add your first expense to get started</p>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-4">
                {/* Bulk Actions Header */}
                {selectedExpenses.length > 0 && (
                    <div className="bg-red-50 border border-red-100 rounded-xl p-3 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                        <span className="text-red-700 font-medium text-sm pl-2">
                            {selectedExpenses.length} selected
                        </span>
                        <button
                            onClick={handleArchiveSelectedClick}
                            className="flex items-center gap-2 bg-white text-amber-600 px-3 py-1.5 rounded-lg text-sm font-medium shadow-sm hover:bg-amber-50 border border-amber-100 transition-colors"
                        >
                            <Archive size={14} />
                            Archive Selected
                        </button>
                        <button
                            onClick={handleDeleteSelectedClick}
                            className="flex items-center gap-2 bg-white text-red-600 px-3 py-1.5 rounded-lg text-sm font-medium shadow-sm hover:bg-red-50 border border-red-100 transition-colors"
                        >
                            <Trash2 size={14} />
                            Delete Selected
                        </button>
                    </div>
                )}

                {/* Desktop Header */}
                <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="col-span-1 flex items-center">
                        <input
                            type="checkbox"
                            checked={expenses.length > 0 && selectedExpenses.length === expenses.length}
                            onChange={toggleAll}
                            className="rounded border-gray-300 text-primary focus:ring-primary"
                        />
                    </div>
                    <div className="col-span-4">Description</div>
                    <div className="col-span-2 text-right">Amount</div>
                    <div className="col-span-4">Shares</div>
                    <div className="col-span-1 text-right">Actions</div>
                </div>

                <div className="space-y-3">
                    {expenses.map((expense) => (
                        <div
                            key={expense.id}
                            className={cn(
                                "bg-white rounded-xl p-4 shadow-sm border border-transparent hover:border-gray-100 transition-all group",
                                selectedExpenses.includes(expense.id) && "border-primary/30 bg-indigo-50/30"
                            )}
                        >
                            {/* Desktop Layout */}
                            <div className="hidden md:grid grid-cols-12 gap-4 items-center">
                                <div className="col-span-1">
                                    <input
                                        type="checkbox"
                                        checked={selectedExpenses.includes(expense.id)}
                                        onChange={() => toggleSelection(expense.id)}
                                        className="rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                </div>
                                <div className="col-span-4">
                                    <div className="font-medium text-gray-900 truncate" title={expense.title}>
                                        {expense.title}
                                    </div>
                                    <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                        <Calendar size={10} />
                                        {formatDate(expense.date)}
                                    </div>
                                </div>

                                <div className="col-span-2 text-right font-bold text-gray-900">
                                    {formatCLP(expense.amount)}
                                </div>

                                <div className="col-span-4 flex items-center gap-1 flex-wrap">
                                    {expense.shares.map((share) => (
                                        <button
                                            key={share.id}
                                            onClick={() => onToggleShare(expense.id, share.user_id, share.status)}
                                            className={`
                      relative group/share flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all
                      ${share.status === 'PAID'
                                                    ? 'border-green-500 bg-green-50 opacity-100'
                                                    : 'border-gray-200 bg-gray-50 opacity-60 hover:opacity-100 hover:border-gray-300'}
                    `}
                                            title={`${share.user?.full_name || 'Unknown'}: ${share.status === 'PAID' ? 'Paid' : 'Pending'} - ${formatCLP(share.amount)}`}
                                        >
                                            <UserAvatar
                                                avatar={share.user?.avatar_url || share.user?.avatar}
                                                name={share.user?.full_name || 'User'}
                                                size="xs"
                                            />
                                        </button>
                                    ))}
                                </div>

                                <div className="col-span-1 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => onEdit(expense)}
                                        className="p-1.5 text-gray-400 hover:text-primary hover:bg-indigo-50 rounded-lg transition-colors"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteClick(expense.id)}
                                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleArchiveClick(expense.id)}
                                        className="p-1.5 text-gray-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"
                                        title="Archive"
                                    >
                                        <Archive size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Mobile Layout */}
                            <div className="flex md:hidden flex-col gap-3">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-start gap-3">
                                        <input
                                            type="checkbox"
                                            checked={selectedExpenses.includes(expense.id)}
                                            onChange={() => toggleSelection(expense.id)}
                                            className="mt-1 rounded border-gray-300 text-primary focus:ring-primary"
                                        />
                                        <div>
                                            <h4 className="font-medium text-gray-900 line-clamp-1">{expense.title}</h4>
                                            <span className="text-xs text-gray-500">{formatDate(expense.date)}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold text-gray-900">{formatCLP(expense.amount)}</div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                                    <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar max-w-[70%]">
                                        {expense.shares.map((share) => (
                                            <button
                                                key={share.id}
                                                onClick={() => onToggleShare(expense.id, share.user_id, share.status)}
                                                className={`
                        flex-shrink-0 w-7 h-7 rounded-full border-2 transition-all
                        ${share.status === 'PAID'
                                                        ? 'border-green-500 bg-green-50'
                                                        : 'border-gray-200 bg-gray-50 opacity-60'}
                      `}
                                                title={`${share.user?.full_name || 'Unknown'}: ${share.status === 'PAID' ? 'Paid' : 'Pending'} - ${formatCLP(share.amount)}`}
                                            >
                                                <UserAvatar
                                                    avatar={share.user?.avatar_url || share.user?.avatar}
                                                    name={share.user?.full_name || 'User'}
                                                    size="xs"
                                                />
                                            </button>
                                        ))}
                                    </div>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => onEdit(expense)}
                                            className="p-2 text-gray-400 hover:text-primary hover:bg-indigo-50 rounded-lg transition-colors"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteClick(expense.id)}
                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleArchiveClick(expense.id)}
                                            className="p-2 text-gray-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"
                                        >
                                            <Archive size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                onConfirm={handleConfirmDelete}
                title={confirmModal.type === 'single' ? 'Delete Expense' : 'Delete Expenses'}
                message={confirmModal.type === 'single'
                    ? 'Are you sure you want to delete this expense? This action cannot be undone.'
                    : confirmModal.type === 'archive'
                        ? 'Are you sure you want to archive this expense?'
                        : confirmModal.type === 'archive-multiple'
                            ? `Are you sure you want to archive ${confirmModal.count} expenses?`
                            : `Are you sure you want to delete ${confirmModal.count} expenses? This action cannot be undone.`}
                confirmText={confirmModal.type === 'archive' || confirmModal.type === 'archive-multiple' ? 'Archive' : 'Delete'}
                isDestructive={confirmModal.type !== 'archive' && confirmModal.type !== 'archive-multiple'}
            />
        </>
    );
}
