import React, { useState, useEffect } from 'react';
import { X, Users, Check, Trash2, AlertTriangle, Search, Plus } from 'lucide-react';
import { cn } from '../../lib/utils';
import { expenseService } from '../../services/expenseService';
import { UserAvatar } from '../UserAvatar';

export function EditAccountModal({ isOpen, onClose, onUpdate, onDelete, account, currentUser }) {
    const [name, setName] = useState('');
    const [inviteEmail, setInviteEmail] = useState('');
    const [invitedUsers, setInvitedUsers] = useState([]); // New users to be added
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [searchMessage, setSearchMessage] = useState(null);

    useEffect(() => {
        if (isOpen && account) {
            console.log("EditAccountModal Open:", {
                accountId: account.id,
                ownerId: account.owner_id,
                currentUserId: currentUser?.id,
                isOwner: account.owner_id === currentUser?.id
            });
            setName(account.name);
            setInvitedUsers([]);
            setInviteEmail('');
            setSearchMessage(null);
            setShowDeleteConfirm(false);
        }
    }, [isOpen, account, currentUser]);

    if (!isOpen || !account) return null;

    const handleInviteUser = async (e) => {
        e.preventDefault();
        if (!inviteEmail.trim()) return;

        // Prevent adding self
        if (currentUser.email && inviteEmail.trim().toLowerCase() === currentUser.email.toLowerCase()) {
            setSearchMessage({ type: 'error', text: "You cannot invite yourself." });
            return;
        }

        // Check if already a member
        const isMember = account.members.some(m => m.id === currentUser.id ? false : m.email?.toLowerCase() === inviteEmail.trim().toLowerCase()); // Need email in members? accounts query might not return email
        // Actually, we might not have email in member list unless we fetch it. 
        // For now let's rely on ID check after search, OR just search first.

        // Prevent duplicates in pending list
        if (invitedUsers.find(u => u.email?.toLowerCase() === inviteEmail.trim().toLowerCase())) {
            setSearchMessage({ type: 'error', text: "User already in invite list." });
            return;
        }

        setIsSearching(true);
        setSearchMessage(null);

        try {
            const user = await expenseService.getProfileByEmail(inviteEmail.trim());
            if (user) {
                // Check if already a member by ID
                if (account.members.find(m => m.id === user.id)) {
                    setSearchMessage({ type: 'error', text: "User is already a member of this account." });
                    return;
                }

                setInvitedUsers(prev => [...prev, user]);
                setInviteEmail('');
                setSearchMessage({ type: 'success', text: "User added to invite list." });
            } else {
                setSearchMessage({ type: 'error', text: "User not found." });
            }
        } catch (error) {
            console.error("Search error", error);
            setSearchMessage({ type: 'error', text: "Error searching for user." });
        } finally {
            setIsSearching(false);
        }
    };

    const removeInvitedUser = (userId) => {
        setInvitedUsers(prev => prev.filter(u => u.id !== userId));
    };

    const handleRemoveMember = (memberId) => {
        alert("Removing members is not allowed in this version.");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) return;

        setIsSubmitting(true);

        // Merge existing members + new invites
        const currentMemberIds = account.members.map(m => m.id);
        const newMemberIds = invitedUsers.map(u => u.id);
        const allMemberIds = [...new Set([...currentMemberIds, ...newMemberIds])];

        await onUpdate(account.id, {
            name,
            member_ids: allMemberIds
        });

        setIsSubmitting(false);
        onClose();
    };

    const handleDelete = async () => {
        if (!showDeleteConfirm) {
            setShowDeleteConfirm(true);
            return;
        }

        setIsSubmitting(true);
        try {
            await onDelete(account.id);
        } catch (error) {
            console.error("Failed to delete", error);
            setIsSubmitting(false);
        }
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

                <div className="p-6 space-y-6">
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
                                        {member.status === 'PENDING' && (
                                            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Pending</span>
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

                        <label className="block text-sm font-medium text-gray-700 mb-2">Invite New Members by Email</label>
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
                                        onClick={() => removeInvitedUser(user.id)}
                                        className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="w-full bg-primary hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-primary/30 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? 'Save Changes' : 'Update Account'}
                    </button>

                    {/* Delete Account Section */}
                    {account.owner_id === currentUser?.id && (
                        <div className="pt-6 border-t border-gray-100">
                            {showDeleteConfirm ? (
                                <div className="bg-red-50 p-4 rounded-xl border border-red-100 animate-in fade-in zoom-in-95 duration-200">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-red-100 rounded-full text-red-600">
                                            <AlertTriangle size={20} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-red-700">Delete Account?</h4>
                                            <p className="text-sm text-red-600 mt-1">
                                                This action cannot be undone. All expenses and data will be permanently lost.
                                            </p>
                                            <div className="flex gap-3 mt-4">
                                                <button
                                                    type="button"
                                                    onClick={() => setShowDeleteConfirm(false)}
                                                    className="px-4 py-2 bg-white text-gray-700 font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={handleDelete}
                                                    disabled={isSubmitting}
                                                    className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20"
                                                >
                                                    {isSubmitting ? 'Deleting...' : 'Yes, Delete Account'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="w-full flex items-center justify-center gap-2 text-red-500 hover:text-red-700 p-3 hover:bg-red-50 rounded-xl transition-all"
                                >
                                    <Trash2 size={20} />
                                    <span className="font-medium">Delete Account</span>
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
