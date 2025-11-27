import React, { useState, useEffect } from 'react';
import { X, Users, Check } from 'lucide-react';
import { cn } from '../../lib/utils';
import { expenseService } from '../../services/expenseService';
import { UserAvatar } from '../UserAvatar';

export function CreateAccountModal({ isOpen, onClose, onCreate, currentUser }) {
    const [name, setName] = useState('');
    const [availableUsers, setAvailableUsers] = useState([]);
    const [selectedUserIds, setSelectedUserIds] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            // Load users to invite (excluding current user)
            expenseService.getUsers().then(users => {
                setAvailableUsers(users.filter(u => u.id !== currentUser.id));
            });
        }
    }, [isOpen, currentUser]);

    if (!isOpen) return null;

    const toggleUser = (userId) => {
        setSelectedUserIds(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) return;

        setIsSubmitting(true);
        try {
            await onCreate(name, selectedUserIds);
            onClose();
            setName('');
            setSelectedUserIds([]);
        } catch (error) {
            console.error("Failed to create account:", error);
            alert("Failed to create account. See console for details.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-800">Create New Account</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Account Name</label>
                        <input
                            required
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Summer Trip"
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Invite Members</label>
                        <div className="space-y-2">
                            {availableUsers.map(user => {
                                const isSelected = selectedUserIds.includes(user.id);
                                return (
                                    <button
                                        key={user.id}
                                        type="button"
                                        onClick={() => toggleUser(user.id)}
                                        className={cn(
                                            "w-full flex items-center justify-between p-3 rounded-xl border transition-all",
                                            isSelected
                                                ? "border-primary bg-primary/5 ring-1 ring-primary"
                                                : "border-gray-200 hover:bg-gray-50"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <UserAvatar avatar={user.avatar} name={user.name} size="sm" className="w-8 h-8" />
                                            <span className={cn("font-medium", isSelected ? "text-primary" : "text-gray-700")}>
                                                {user.name}
                                            </span>
                                        </div>
                                        {isSelected && <Check size={18} className="text-primary" />}
                                    </button>
                                );
                            })}
                            {availableUsers.length === 0 && (
                                <p className="text-sm text-gray-400 italic">No other users available to invite.</p>
                            )}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-primary hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-primary/30 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? 'Creating...' : 'Create Account'}
                    </button>
                </form>
            </div>
        </div>
    );
}
