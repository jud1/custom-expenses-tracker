import React, { useState, useEffect } from 'react';
import { X, Calendar, DollarSign, Tag, Users } from 'lucide-react';
import { cn } from '../../lib/utils';
import { UserAvatar } from '../UserAvatar';

export function AddExpenseModal({ isOpen, onClose, onAdd, onUpdate, users, expenseToEdit }) {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [participants, setParticipants] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (expenseToEdit) {
        setTitle(expenseToEdit.title);
        setAmount(expenseToEdit.amount.toString());
        setDate(expenseToEdit.date);
        setParticipants(expenseToEdit.shares.map(s => s.user_id));
      } else {
        // Reset for new expense
        setTitle('');
        setAmount('');
        setDate(new Date().toISOString().split('T')[0]);
        setParticipants(users.map(u => u.id));
      }
    }
  }, [isOpen, expenseToEdit, users]);

  if (!isOpen) return null;

  const toggleParticipant = (userId) => {
    setParticipants(prev => {
      if (prev.includes(userId)) {
        // Don't allow removing the last participant
        if (prev.length === 1) return prev;
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const numericAmount = parseFloat(amount);
    const shareAmount = Math.round(numericAmount / participants.length);

    const expenseData = {
      title,
      amount: numericAmount,
      date,
      shares: participants.map(userId => {
        // Preserve existing status if editing
        const existingShare = expenseToEdit?.shares.find(s => s.user_id === userId);
        return {
          user_id: userId,
          amount: shareAmount,
          status: existingShare ? existingShare.status : 'PENDING'
        };
      })
    };

    if (expenseToEdit) {
      await onUpdate(expenseToEdit.id, expenseData);
    } else {
      await onAdd({
        ...expenseData,
        created_by: 'system', // Should be current user, but handled by service/context usually
      });
    }

    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">{expenseToEdit ? 'Edit Expense' : 'New Expense'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                required
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Pizza Night"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Amount (CLP)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  required
                  type="number"
                  step="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="20000"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  required
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Participants</label>
            <div className="flex gap-3">
              {users.map(user => {
                const isSelected = participants.includes(user.id);
                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => toggleParticipant(user.id)}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border transition-all",
                      isSelected
                        ? "border-primary bg-primary/5 text-primary font-medium ring-1 ring-primary"
                        : "border-gray-200 hover:bg-gray-50 text-gray-400 opacity-70"
                    )}
                  >
                    <UserAvatar
                      avatar={user.avatar}
                      name={user.name}
                      size="sm"
                      className={cn("w-6 h-6 text-xs transition-opacity", !isSelected && "opacity-50")}
                    />
                    {user.name}
                    {isSelected && <Users size={14} className="ml-1" />}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">
              Split: ${participants.length > 0 ? Math.round((parseFloat(amount) || 0) / participants.length).toLocaleString('es-CL') : 0} each
            </p>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-primary/30 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Saving...' : (expenseToEdit ? 'Update Expense' : 'Add Expense')}
          </button>
        </form>
      </div>
    </div>
  );
}
