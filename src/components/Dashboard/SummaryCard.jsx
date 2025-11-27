import React from 'react';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { cn } from '../../lib/utils';
import { UserAvatar } from '../UserAvatar';

export function SummaryCard({ totalPending, userBalances }) {
    const formatCLP = (amount) => {
        return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount);
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Total Pending Card */}
            <div className="bg-gradient-to-br from-primary to-indigo-600 rounded-2xl p-6 text-white shadow-xl shadow-primary/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-indigo-100 font-medium">Total Pending</h3>
                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                            <DollarSign size={20} className="text-white" />
                        </div>
                    </div>
                    <div className="text-4xl font-bold mb-2">
                        {formatCLP(totalPending)}
                    </div>
                    <div className="flex items-center text-sm text-indigo-200">
                        <span className="bg-white/20 px-2 py-0.5 rounded text-xs mr-2">Due</span>
                        <span>Total shared debt</span>
                    </div>
                </div>
            </div>

            {/* User Balances */}
            {userBalances.map((user, index) => (
                <div key={user.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <UserAvatar avatar={user.avatar} name={user.name} size="md" />
                            <div>
                                <h3 className="font-bold text-gray-800">{user.name}</h3>
                                <p className="text-xs text-gray-500">Member</p>
                            </div>
                        </div>
                        {index === 0 ? (
                            <TrendingUp className="text-orange-500" size={20} />
                        ) : (
                            <TrendingDown className="text-emerald-500" size={20} />
                        )}
                    </div>

                    <div>
                        <p className="text-sm text-gray-500 mb-1">Pending Share</p>
                        <div className="text-2xl font-bold text-gray-900">
                            {formatCLP(user.pendingAmount)}
                        </div>
                        <div className="w-full bg-gray-100 h-1.5 rounded-full mt-3 overflow-hidden">
                            <div
                                className={cn("h-full rounded-full", index === 0 ? "bg-orange-400" : "bg-emerald-400")}
                                style={{ width: `${(user.pendingAmount / (totalPending || 1)) * 100}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
