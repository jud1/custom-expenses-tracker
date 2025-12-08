import React, { useState } from 'react';
import { X, Users, Check, Trash2, Search, Plus } from 'lucide-react';
import { cn } from '../../lib/utils';
import { expenseService } from '../../services/expenseService';
import { UserAvatar } from '../UserAvatar';

export function CreateAccountModal({ isOpen, onClose, onCreate, currentUser }) {
    const [name, setName] = useState('');
    const [inviteEmail, setInviteEmail] = useState('');
    const [invitedUsers, setInvitedUsers] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [searchMessage, setSearchMessage] = useState(null); // { type: 'error' | 'success', text: string }

    const resetForm = () => {
        setName('');
        setInviteEmail('');
        setInvitedUsers([]);
        setSearchMessage(null);
    };

    if (!isOpen) return null;

    const handleInviteUser = async (e) => {
        e.preventDefault();
        if (!inviteEmail.trim()) return;

        // Prevent adding self
        if (currentUser.email && inviteEmail.trim().toLowerCase() === currentUser.email.toLowerCase()) {
            setSearchMessage({ type: 'error', text: "You cannot invite yourself." });
            return;
        }

        // Prevent duplicates
        if (invitedUsers.find(u => u.email?.toLowerCase() === inviteEmail.trim().toLowerCase())) {
            setSearchMessage({ type: 'error', text: "User already invited." });
            return;
        }

        setIsSearching(true);
        setSearchMessage(null);

        try {
            const user = await expenseService.getProfileByEmail(inviteEmail.trim());
            if (user) {
                setInvitedUsers(prev => [...prev, user]);
                setInviteEmail('');
                setSearchMessage({ type: 'success', text: "User added to invite list." });
            } else {
                setSearchMessage({ type: 'error', text: "User not found. Check the email address." });
            }
        } catch (error) {
            console.error("Search error", error);
            setSearchMessage({ type: 'error', text: "Error searching for user." });
        } finally {
            setIsSearching(false);
        }
    };

    const removeUser = (userId) => {
        setInvitedUsers(prev => prev.filter(u => u.id !== userId));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) return;

        setIsSubmitting(true);
        try {
            const memberIds = invitedUsers.map(u => u.id);
            await onCreate(name, memberIds);
            onClose();
            resetForm();
        } catch (error) {
            console.error("Failed to create account:", error);
            alert("Failed to create account.");
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

                <div className="p-6 space-y-6">
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
                        <label className="block text-sm font-medium text-gray-700 mb-2">Invite Members by Email</label>
                        <div className="flex gap-2 mb-2">
                            <input
                                type="email"
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                                placeholder="friend@example.com"
                                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleInviteUser(e);
                                    }
                                }}
                            />
                            <button
                                type="button"
                                onClick={handleInviteUser}
                                disabled={isSearching || !inviteEmail.trim()}
                                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors disabled:opacity-50"
                            >
                                {isSearching ? <div className="animate-spin w-5 h-5 border-2 border-gray-500 border-t-transparent rounded-full" /> : <Plus size={20} />}
                            </button>
                        </div>

                        {searchMessage && (
                            <p className={cn("text-sm mb-3", searchMessage.type === 'error' ? "text-red-500" : "text-green-600")}>
                                {searchMessage.text}
                            </p>
                        )}

                        <div className="space-y-2">
                            {invitedUsers.map(user => (
                                <div key={user.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <UserAvatar avatar={user.avatar} name={user.name} size="sm" className="w-8 h-8" />
                                        <div className="flex flex-col">
                                            <span className="font-medium text-gray-700">{user.name}</span>
                                            <span className="text-xs text-gray-500">{user.email}</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => removeUser(user.id)}
                                        className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            ))}
                            {invitedUsers.length === 0 && (
                                <p className="text-sm text-gray-400 italic">No users invited yet.</p>
                            )}
                        </div>
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !name.trim()}
                        className="w-full bg-primary hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-primary/30 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? 'Creating...' : 'Create Account'}
                    </button>
                </div>
            </div>
        </div>
    );
}
