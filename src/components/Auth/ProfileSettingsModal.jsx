import React, { useState } from 'react';
import { X, Check, RefreshCw } from 'lucide-react';
import { cn } from '../../lib/utils';
import { AVATAR_ICONS, UserAvatar } from '../UserAvatar';
import { supabase } from '../../lib/supabase';
import { generateRandomName } from '../../lib/nameGenerator';

export function ProfileSettingsModal({ isOpen, onClose, currentUser, onUpdate }) {
    const [selectedIcon, setSelectedIcon] = useState(null);
    const [name, setName] = useState(currentUser.name);
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const currentAvatar = selectedIcon ? `icon:${selectedIcon}` : currentUser.avatar;

    const handleIconSelect = (iconName) => {
        setSelectedIcon(iconName);
    };

    const handleRandomName = () => {
        setName(generateRandomName());
    };

    const handleSave = async () => {
        setIsSubmitting(true);
        try {
            const updates = {};

            if (selectedIcon) {
                updates.avatar_url = `icon:${selectedIcon}`;
            }

            if (name !== currentUser.name) {
                updates.full_name = name;
            }

            if (Object.keys(updates).length === 0) {
                onClose();
                return;
            }

            // Update in Supabase
            const { error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', currentUser.id);

            if (error) throw error;

            // Update local state
            onUpdate({
                ...currentUser,
                name: updates.full_name || currentUser.name,
                avatar: updates.avatar_url || currentUser.avatar
            });

            onClose();
        } catch (error) {
            console.error("Failed to update profile:", error);
            alert("Failed to update profile. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-800">Edit Profile</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Current Preview */}
                    <div className="flex flex-col items-center gap-3">
                        <UserAvatar
                            avatar={currentAvatar}
                            name={name}
                            size="xl"
                        />

                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="text-center font-bold text-gray-800 border-b border-transparent hover:border-gray-300 focus:border-primary focus:outline-none bg-transparent transition-colors"
                            />
                            <button
                                onClick={handleRandomName}
                                className="p-1.5 text-gray-400 hover:text-primary hover:bg-indigo-50 rounded-lg transition-colors"
                                title="Generate Random Nickname"
                            >
                                <RefreshCw size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Icon Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">Choose an Icon</label>
                        <div className="grid grid-cols-4 gap-3">
                            {Object.keys(AVATAR_ICONS).map((iconName) => {
                                const isSelected = (selectedIcon === iconName) || (!selectedIcon && currentUser.avatar === `icon:${iconName}`);
                                const Icon = AVATAR_ICONS[iconName];

                                return (
                                    <button
                                        key={iconName}
                                        onClick={() => handleIconSelect(iconName)}
                                        className={cn(
                                            "aspect-square rounded-xl flex items-center justify-center transition-all border-2",
                                            isSelected
                                                ? "border-primary bg-primary/5 text-primary"
                                                : "border-transparent bg-gray-50 text-gray-500 hover:bg-gray-100"
                                        )}
                                    >
                                        <Icon size={24} />
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={isSubmitting}
                        className="w-full bg-primary hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-primary/30 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
}
