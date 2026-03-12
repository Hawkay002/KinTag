import React, { useState } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

const cn = (...classes) => classes.filter(Boolean).join(" ");

export const avatars = [
    {
        id: 1,
        alt: "Crimson Blaze",
        svg: (
            <svg viewBox="0 0 36 36" fill="none" role="img" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                <mask id="mask-av1" maskUnits="userSpaceOnUse" x="0" y="0" width="36" height="36">
                    <rect width="36" height="36" rx="72" fill="#FFFFFF" />
                </mask>
                <g mask="url(#mask-av1)">
                    <rect width="36" height="36" fill="#ff005b" />
                    <rect x="0" y="0" width="36" height="36" transform="translate(9 -5) rotate(219 18 18) scale(1)" fill="#ffb238" rx="6" />
                    <g transform="translate(4.5 -4) rotate(9 18 18)">
                        <path d="M15 19c2 1 4 1 6 0" stroke="#000000" fill="none" strokeLinecap="round" strokeWidth="1.5" />
                        <rect x="10" y="14" width="1.5" height="2" rx="1" stroke="none" fill="#000000" />
                        <rect x="24" y="14" width="1.5" height="2" rx="1" stroke="none" fill="#000000" />
                    </g>
                </g>
            </svg>
        ),
    },
    {
        id: 2,
        alt: "Midnight Flare",
        svg: (
            <svg viewBox="0 0 36 36" fill="none" role="img" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                <mask id="mask-av2" maskUnits="userSpaceOnUse" x="0" y="0" width="36" height="36">
                    <rect width="36" height="36" rx="72" fill="#FFFFFF" />
                </mask>
                <g mask="url(#mask-av2)">
                    <rect width="36" height="36" fill="#ff7d10" />
                    <rect x="0" y="0" width="36" height="36" transform="translate(5 -1) rotate(55 18 18) scale(1.1)" fill="#0a0310" rx="6" />
                    <g transform="translate(7 -6) rotate(-5 18 18)">
                        <path d="M15 20c2 1 4 1 6 0" stroke="#FFFFFF" fill="none" strokeLinecap="round" strokeWidth="1.5" />
                        <rect x="14" y="14" width="1.5" height="2" rx="1" stroke="none" fill="#FFFFFF" />
                        <rect x="20" y="14" width="1.5" height="2" rx="1" stroke="none" fill="#FFFFFF" />
                    </g>
                </g>
            </svg>
        ),
    },
    {
        id: 3,
        alt: "Neon Void",
        svg: (
            <svg viewBox="0 0 36 36" fill="none" role="img" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                <mask id="mask-av3" maskUnits="userSpaceOnUse" x="0" y="0" width="36" height="36">
                    <rect width="36" height="36" rx="72" fill="#FFFFFF" />
                </mask>
                <g mask="url(#mask-av3)">
                    <rect width="36" height="36" fill="#0a0310" />
                    <rect x="0" y="0" width="36" height="36" transform="translate(-3 7) rotate(227 18 18) scale(1.2)" fill="#ff005b" rx="36" />
                    <g transform="translate(-3 3.5) rotate(7 18 18)">
                        <path d="M13,21 a1,0.75 0 0,0 10,0" fill="#FFFFFF" />
                        <rect x="12" y="14" width="1.5" height="2" rx="1" stroke="none" fill="#FFFFFF" />
                        <rect x="22" y="14" width="1.5" height="2" rx="1" stroke="none" fill="#FFFFFF" />
                    </g>
                </g>
            </svg>
        ),
    },
    {
        id: 4,
        alt: "Mint Fresh",
        svg: (
            <svg viewBox="0 0 36 36" fill="none" role="img" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                <mask id="mask-av4" maskUnits="userSpaceOnUse" x="0" y="0" width="36" height="36">
                    <rect width="36" height="36" rx="72" fill="#FFFFFF" />
                </mask>
                <g mask="url(#mask-av4)">
                    <rect width="36" height="36" fill="#d8fcb3" />
                    <rect x="0" y="0" width="36" height="36" transform="translate(9 -5) rotate(219 18 18) scale(1)" fill="#89fcb3" rx="6" />
                    <g transform="translate(4.5 -4) rotate(9 18 18)">
                        <path d="M15 19c2 1 4 1 6 0" stroke="#000000" fill="none" strokeLinecap="round" strokeWidth="1.5" />
                        <rect x="10" y="14" width="1.5" height="2" rx="1" stroke="none" fill="#000000" />
                        <rect x="24" y="14" width="1.5" height="2" rx="1" stroke="none" fill="#000000" />
                    </g>
                </g>
            </svg>
        ),
    },
    {
        id: 5,
        alt: "Ocean Deep",
        svg: (
            <svg viewBox="0 0 36 36" fill="none" role="img" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                <mask id="mask-av5" maskUnits="userSpaceOnUse" x="0" y="0" width="36" height="36">
                    <rect width="36" height="36" rx="72" fill="#FFFFFF" />
                </mask>
                <g mask="url(#mask-av5)">
                    <rect width="36" height="36" fill="#005bff" />
                    <rect x="0" y="0" width="36" height="36" transform="translate(6 -2) rotate(140 18 18) scale(1.1)" fill="#00e5ff" rx="6" />
                    <g transform="translate(4 -4) rotate(15 18 18)">
                        <path d="M15 19c2 1 4 1 6 0" stroke="#FFFFFF" fill="none" strokeLinecap="round" strokeWidth="1.5" />
                        <rect x="12" y="14" width="1.5" height="2" rx="1" fill="#FFFFFF" />
                        <rect x="22" y="14" width="1.5" height="2" rx="1" fill="#FFFFFF" />
                    </g>
                </g>
            </svg>
        ),
    },
    {
        id: 6,
        alt: "Amethyst Pink",
        svg: (
            <svg viewBox="0 0 36 36" fill="none" role="img" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                <mask id="mask-av6" maskUnits="userSpaceOnUse" x="0" y="0" width="36" height="36">
                    <rect width="36" height="36" rx="72" fill="#FFFFFF" />
                </mask>
                <g mask="url(#mask-av6)">
                    <rect width="36" height="36" fill="#8a2be2" />
                    <rect x="0" y="0" width="36" height="36" transform="translate(3 -4) rotate(45 18 18) scale(1.2)" fill="#ff69b4" rx="36" />
                    <g transform="translate(5 -2) rotate(-5 18 18)">
                        <path d="M13,21 a1,0.75 0 0,0 10,0" fill="#FFFFFF" />
                        <rect x="13" y="14" width="1.5" height="2" rx="1" fill="#FFFFFF" />
                        <rect x="23" y="14" width="1.5" height="2" rx="1" fill="#FFFFFF" />
                    </g>
                </g>
            </svg>
        ),
    },
    {
        id: 7,
        alt: "Golden Rose",
        svg: (
            <svg viewBox="0 0 36 36" fill="none" role="img" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                <mask id="mask-av7" maskUnits="userSpaceOnUse" x="0" y="0" width="36" height="36">
                    <rect width="36" height="36" rx="72" fill="#FFFFFF" />
                </mask>
                <g mask="url(#mask-av7)">
                    <rect width="36" height="36" fill="#ffd700" />
                    <rect x="0" y="0" width="36" height="36" transform="translate(-2 6) rotate(110 18 18) scale(1)" fill="#ff007f" rx="6" />
                    <g transform="translate(3 0) rotate(5 18 18)">
                        <path d="M15 20c2 1 4 1 6 0" stroke="#000000" fill="none" strokeLinecap="round" strokeWidth="1.5" />
                        <rect x="14" y="14" width="1.5" height="2" rx="1" fill="#000000" />
                        <rect x="20" y="14" width="1.5" height="2" rx="1" fill="#000000" />
                    </g>
                </g>
            </svg>
        ),
    },
];

const mainAvatarVariants = {
    initial: { y: 20, opacity: 0 },
    animate: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 200, damping: 20 } },
    exit: { y: -20, opacity: 0, transition: { duration: 0.2 } },
};

const pickerVariants = {
    container: {
        initial: { opacity: 0 },
        animate: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
    },
    item: {
        initial: { y: 20, opacity: 0 },
        animate: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 20 } },
    },
};

const selectedVariants = {
    initial: { opacity: 0, rotate: -180 },
    animate: { opacity: 1, rotate: 0, transition: { type: "spring", stiffness: 200, damping: 15 } },
    exit: { opacity: 0, rotate: 180, transition: { duration: 0.2 } },
};

export function AvatarPicker({ currentAvatarId, onSave, onCancel, isSaving }) {
    const [selectedAvatar, setSelectedAvatar] = useState(
        avatars.find(a => a.id === currentAvatarId) || avatars[0]
    );
    const [rotationCount, setRotationCount] = useState(0);

    const handleAvatarSelect = (avatar) => {
        if (selectedAvatar.id === avatar.id) return;
        setRotationCount((prev) => prev + 1080); // 3 rotations
        setSelectedAvatar(avatar);
    };

    return (
        <motion.div initial="initial" animate="animate" className="w-full max-w-sm mx-auto relative z-50">
            <div className="bg-white/95 backdrop-blur-2xl rounded-[3rem] overflow-hidden border border-white/20 shadow-2xl relative">
                
                {/* Animated Background Header */}
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{
                        opacity: 1,
                        height: "8rem",
                        transition: { height: { type: "spring", stiffness: 100, damping: 20 } },
                    }}
                    className="bg-gradient-to-r from-brandGold/20 via-emerald-400/10 to-brandDark/10 w-full"
                />

                <div className="px-6 pb-8 -mt-16 flex flex-col items-center">
                    
                    {/* Main Rotating Avatar Display */}
                    <motion.div
                        className="relative w-32 h-32 mx-auto rounded-[2rem] overflow-hidden border-[6px] border-white bg-zinc-50 flex items-center justify-center shadow-lg"
                        variants={mainAvatarVariants}
                    >
                        <motion.div
                            className="w-full h-full flex items-center justify-center p-2"
                            animate={{ rotate: rotationCount }}
                            transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                        >
                            {selectedAvatar.svg}
                        </motion.div>
                    </motion.div>

                    <motion.div className="text-center mt-5 mb-6" variants={pickerVariants.item}>
                        <h2 className="text-2xl font-extrabold text-brandDark tracking-tight">Choose Avatar</h2>
                        <p className="text-zinc-500 text-sm font-medium">Select a unique profile picture.</p>
                    </motion.div>

                    {/* Avatar Grid Selection */}
                    <motion.div className="w-full" variants={pickerVariants.container}>
                        <motion.div className="flex flex-wrap justify-center gap-3" variants={pickerVariants.container}>
                            {avatars.map((avatar) => (
                                <motion.button
                                    key={avatar.id}
                                    onClick={() => handleAvatarSelect(avatar)}
                                    className={cn(
                                        "relative w-12 h-12 rounded-2xl overflow-hidden border-2 bg-zinc-50",
                                        "transition-all duration-300 shadow-sm",
                                        selectedAvatar.id === avatar.id ? "border-transparent" : "border-zinc-200 hover:border-zinc-300"
                                    )}
                                    variants={pickerVariants.item}
                                    whileHover={{ y: -2, transition: { duration: 0.2 } }}
                                    whileTap={{ y: 0, transition: { duration: 0.2 } }}
                                    aria-label={`Select ${avatar.alt}`}
                                >
                                    <div className="w-full h-full flex items-center justify-center p-1">
                                        {avatar.svg}
                                    </div>
                                    {selectedAvatar.id === avatar.id && (
                                        <motion.div
                                            className="absolute inset-0 bg-brandDark/10 border-2 border-brandDark rounded-2xl"
                                            variants={selectedVariants}
                                            initial="initial"
                                            animate="animate"
                                            exit="exit"
                                        />
                                    )}
                                </motion.button>
                            ))}
                        </motion.div>
                    </motion.div>

                    {/* Controls */}
                    <div className="flex w-full gap-3 mt-8">
                        <button 
                            onClick={onCancel} 
                            disabled={isSaving}
                            className="flex-1 bg-zinc-100 text-zinc-600 py-3.5 rounded-full font-bold hover:bg-zinc-200 transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={() => onSave(selectedAvatar.id)} 
                            disabled={isSaving}
                            className="flex-1 bg-brandDark text-white py-3.5 rounded-full font-bold shadow-md hover:bg-brandAccent active:scale-95 transition-all flex justify-center items-center gap-2 disabled:opacity-50"
                        >
                            {isSaving ? <Loader2 size={18} className="animate-spin" /> : 'Save Avatar'}
                        </button>
                    </div>

                </div>
            </div>
        </motion.div>
    );
}
