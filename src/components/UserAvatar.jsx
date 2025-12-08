import React from 'react';
import {
    User, Smile, Star, Zap, Heart, Crown,
    Music, Camera, Gamepad2, Ghost, Cat, Dog
} from 'lucide-react';
import { cn } from '../lib/utils';

// Map of icon names to Lucide components
export const AVATAR_ICONS = {
    'User': User,
    'Smile': Smile,
    'Star': Star,
    'Zap': Zap,
    'Heart': Heart,
    'Crown': Crown,
    'Music': Music,
    'Camera': Camera,
    'Gamepad': Gamepad2,
    'Ghost': Ghost,
    'Cat': Cat,
    'Dog': Dog
};

export function UserAvatar({ avatar, name, className, size = "md" }) {
    const [imgError, setImgError] = React.useState(false);

    // Size classes
    const sizeClasses = {
        sm: "w-6 h-6 text-xs",
        md: "w-10 h-10 text-base",
        lg: "w-16 h-16 text-xl",
        xl: "w-24 h-24 text-3xl"
    };

    const iconSize = {
        sm: 14,
        md: 20,
        lg: 32,
        xl: 48
    };

    // Check if avatar is an icon identifier
    const isIcon = avatar?.startsWith('icon:');

    if (isIcon) {
        const iconName = avatar.split(':')[1];
        const IconComponent = AVATAR_ICONS[iconName] || User;

        return (
            <div
                title={name}
                className={cn(
                    "rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 cursor-default",
                    sizeClasses[size],
                    className
                )}>
                <IconComponent size={iconSize[size]} />
            </div>
        );
    }

    // If it's a URL (or fallback to initials if URL is empty/invalid)
    if (avatar && !imgError) {
        return (
            <img
                src={avatar}
                alt={name}
                title={name}
                className={cn(
                    "rounded-full object-cover bg-gray-100 cursor-default",
                    sizeClasses[size],
                    className
                )}
                onError={() => setImgError(true)}
            />
        );
    }

    // Fallback to initials
    return (
        <div
            title={name}
            className={cn(
                "rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-medium cursor-default",
                sizeClasses[size],
                className
            )}>
            {name?.charAt(0).toUpperCase()}
        </div>
    );
}
