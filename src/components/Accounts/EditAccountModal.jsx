import React, { useState, useEffect } from 'react';
import { X, Users, Check, Trash2, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { expenseService } from '../../services/expenseService';
import { UserAvatar } from '../UserAvatar';

export function EditAccountModal({ isOpen, onClose, onUpdate, account, currentUser }) {
    const [name, setName] = useState('');
    const [availableUsers, setAvailableUsers] = useState([]);
    const [selectedUserIds, setSelectedUserIds] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen && account) {
            setName(account.name);
            // Pre-select current members
            setSelectedUserIds(account.member_ids || account.members.map(m => m.id));

            // Load users to invite (excluding current members)
            expenseService.getUsers().then(users => {
                const currentMemberIds = account.members.map(m => m.id);
                setAvailableUsers(users.filter(u => !currentMemberIds.includes(u.id)));
            });
        }
    }, [isOpen, account]);

    if (!isOpen || !account) return null;

    const toggleUser = (userId) => {
        setSelectedUserIds(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const handleRemoveMember = (memberId) => {
        alert("Removing members is not allowed in this version.");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) return;

        setIsSubmitting(true);

        // Combine existing members with new invites
        // Note: We only pass the full list of IDs to the update function
        // The service layer handles merging, but here we just need to ensure we don't lose anyone
        // Actually, since we can't remove, we just need to make sure the final list includes everyone

        await onUpdate(account.id, {
            name,
            member_ids: selectedUserIds
        });

        setIsSubmitting(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-800">Edit Account</h2>
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
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Current Members</label>
                        <div className="space-y-2 mb-4">
                            {account.members.map(member => (
                                <div key={member.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <UserAvatar avatar={member.avatar} name={member.name} size="sm" className="w-8 h-8" />
                                        <span className="font-medium text-gray-700">{member.name}</span>
                                        {member.id === account.owner_id && (
                                            <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">Owner</span>
                                        )}
                                    </div>
                                    {member.id !== account.owner_id && (
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveMember(member.id)}
                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Remove Member"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        <label className="block text-sm font-medium text-gray-700 mb-2">Invite New Members</label>
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
                                <p className="text-sm text-gray-400 italic">No new users available to invite.</p>
                            )}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-primary hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-primary/30 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? 'Save Changes' : 'Update Account'}
                    </button>
                </form>
            </div>
        </div>
    );
}
