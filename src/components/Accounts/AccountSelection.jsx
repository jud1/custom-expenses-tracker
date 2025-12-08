import React, { useState } from 'react';
import { Plus, ChevronRight, Users, LogOut } from 'lucide-react';
import { CreateAccountModal } from './CreateAccountModal';
import { useAccounts } from '../../hooks/useExpenses';

export function AccountSelection({ onSelect, currentUser, onLogout, onOpenProfile }) {
    const { accounts, invitations, loading, createAccount, respondToInvitation } = useAccounts(currentUser.id);
    const [isModalOpen, setIsModalOpen] = useState(false);

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Hello, {currentUser.name}</h1>
                        <div className="flex items-center gap-2 mt-1">
                            <p className="text-gray-500">Select an account to continue</p>
                            <button
                                onClick={onOpenProfile}
                                className="text-primary text-sm font-medium hover:underline"
                            >
                                Edit Profile
                            </button>
                        </div>
                    </div>
                    <button
                        onClick={onLogout}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                        title="Logout"
                    >
                        <LogOut size={20} />
                    </button>
                </div>

                <div className="space-y-4">
                    <div className="space-y-6">
                        {/* Invitations Section */}
                        {invitations && invitations.length > 0 && (
                            <div className="space-y-3">
                                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider px-1">Invitations</h2>
                                {invitations.map(account => (
                                    <div
                                        key={account.id}
                                        className="w-full bg-white p-4 rounded-xl shadow-sm border border-indigo-100 flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-primary font-bold text-xl">
                                                {account.name.charAt(0)}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900">{account.name}</h3>
                                                <div className="flex items-center gap-1 text-sm text-gray-500">
                                                    <Users size={14} />
                                                    <span>Invited by {account.owner.full_name}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => respondToInvitation(account.id, false)}
                                                className="flex-1 py-2 bg-gray-50 text-gray-600 font-medium rounded-lg hover:bg-gray-100 transition-colors text-sm"
                                            >
                                                Reject
                                            </button>
                                            <button
                                                onClick={() => respondToInvitation(account.id, true)}
                                                className="flex-1 py-2 bg-primary text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors text-sm shadow-md shadow-primary/20"
                                            >
                                                Accept
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Active Accounts Section */}
                        <div className="space-y-3">
                            {invitations?.length > 0 && (
                                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider px-1">Your Accounts</h2>
                            )}
                            {accounts.map(account => (
                                <button
                                    key={account.id}
                                    onClick={() => onSelect(account)}
                                    className="w-full bg-white p-4 rounded-2xl shadow-sm border border-gray-200 hover:border-primary hover:shadow-md transition-all group flex items-center justify-between text-left"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-primary font-bold text-xl">
                                            {account.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 group-hover:text-primary transition-colors">{account.name}</h3>
                                            <div className="flex items-center gap-1 text-sm text-gray-500">
                                                <Users size={14} />
                                                <span>{account.members.length} members</span>
                                            </div>
                                        </div>
                                    </div>
                                    <ChevronRight className="text-gray-300 group-hover:text-primary transition-colors" />
                                </button>
                            ))}
                            {accounts.length === 0 && (
                                <p className="text-center text-gray-500 py-4">No active accounts found.</p>
                            )}
                        </div>

                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="w-full p-4 rounded-2xl border-2 border-dashed border-gray-300 hover:border-primary hover:bg-indigo-50/50 text-gray-500 hover:text-primary transition-all flex items-center justify-center gap-2 font-medium"
                        >
                            <Plus size={20} />
                            Create New Account
                        </button>
                    </div>
                </div>

                <CreateAccountModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onCreate={createAccount}
                    currentUser={currentUser}
                />
            </div>
        </div>
    );
}
