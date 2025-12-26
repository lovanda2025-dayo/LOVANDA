import { useState, useEffect } from 'react'
import { motion, useMotionValue, useTransform, MotionValue, PanInfo, AnimatePresence } from 'framer-motion'
import { Yeseva_One } from 'next/font/google'
import { Maximize2 } from 'lucide-react'
import { Profile } from '@/hooks/useProfileNavigator'
import PhotoGallery from './PhotoGallery'

const yesevaOne = Yeseva_One({
    weight: '400',
    subsets: ['latin'],
    display: 'swap',
})

interface ProfileCardProps {
    profile: Profile
    isFront: boolean
    onSwipe?: (direction: 'left' | 'right') => void
    style?: any
    variants?: any
    initial?: any
    animate?: any
    exit?: any
}

export default function ProfileCard({ profile, isFront, style, variants, initial, animate, exit, onSwipe }: ProfileCardProps) {
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
    const [showGallery, setShowGallery] = useState(false)

    // Internal Motion Values for isolated state
    const x = useMotionValue(0)
    const rotate = useTransform(x, [-200, 200], [-25, 25])

    // Internal Drag Handler
    const handleDragEnd = (e: any, info: PanInfo) => {
        const swipe = info.offset.x
        const velocity = info.velocity.x

        if (swipe > 100 || (swipe > 50 && velocity > 500)) {
            onSwipe?.('right')
        } else if (swipe < -100 || (swipe < -50 && velocity < -500)) {
            onSwipe?.('left')
        }

    }

    // Reset photo index when profile changes (handled by key prop in parent usually, but safety check)
    useEffect(() => {
        setCurrentPhotoIndex(0)
    }, [profile.id])

    // Resolve photos
    const profilePhotos = Array.from(new Set([profile.avatar_url, ...(profile.photos || [])].filter(p => typeof p === 'string' && p.trim() !== '')))
    const activePhoto = profilePhotos.length > 0 ? profilePhotos[currentPhotoIndex] : (profile.avatar_url || '/default-avatar.png')
    const totalPhotos = profilePhotos.length

    const handlePhotoNavigation = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isFront) return // Only front card creates interaction

        // Prevent click if we were dragging or if gallery button was clicked
        // Note: Gallery button has its own click handler with stopPropagation

        // Simple logic: Left/Right tap
        const target = e.currentTarget as HTMLDivElement
        const rect = target.getBoundingClientRect()
        const clientX = 'touches' in e ? (e as React.TouchEvent).touches[0].clientX : (e as React.MouseEvent).clientX
        const xPos = clientX - rect.left

        if (xPos > rect.width / 2) {
            if (currentPhotoIndex < totalPhotos - 1) {
                setCurrentPhotoIndex(prev => prev + 1)
            }
        } else {
            if (currentPhotoIndex > 0) {
                setCurrentPhotoIndex(prev => prev - 1)
            }
        }
    }

    return (
        <>
            <motion.div
                style={{ ...style, x, rotate }}
                variants={variants}
                initial={initial}
                animate={animate || "animate"}
                exit={exit || "exit"}
                drag={isFront ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.5}
                onDragEnd={handleDragEnd}
                whileDrag={isFront ? { cursor: 'grabbing' } : undefined}
                onClick={handlePhotoNavigation}
                className={`absolute inset-0 w-full h-full overflow-hidden bg-[#1a1a1a] shadow-2xl ${isFront ? 'cursor-grab active:cursor-grabbing z-20' : 'z-0'}`}
            >
                {/* Photo Progress Bar */}
                {totalPhotos > 1 && (
                    <div className="absolute top-4 left-4 right-4 flex gap-1.5 z-30 pointer-events-none">
                        {profilePhotos.map((_, idx) => (
                            <div
                                key={idx}
                                className={`h-1 flex-1 rounded-full transition-all duration-300 ${idx === currentPhotoIndex
                                    ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.6)]'
                                    : idx < currentPhotoIndex
                                        ? 'bg-white/50'
                                        : 'bg-white/20'
                                    }`}
                            />
                        ))}
                    </div>
                )}

                {/* Gallery Button */}
                {isFront && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            setShowGallery(true)
                        }}
                        className="absolute top-10 right-4 p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white z-40 active:scale-90 transition-all"
                    >
                        <Maximize2 size={22} />
                    </button>
                )}

                {/* Profile Image */}
                <img
                    src={activePhoto}
                    alt={profile.first_name}
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
                    draggable={false}
                />

                {/* Overlay Gradients */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

                {/* Swipe Indicators (LIKE / NOPE) */}
                {/* Note: We use the internal 'x' motion value */}
                <TimeStamp x={x} type="like" />
                <TimeStamp x={x} type="nope" />

                {/* Profile Info Overlay - Adjusted to sit above the elevated action buttons */}
                <div className="absolute bottom-52 left-0 right-0 px-8 pointer-events-none z-10">
                    <div className="flex items-end justify-between gap-4 mb-2">
                        <div className="flex-1">
                            <h1 className={`${yesevaOne.className} text-[38px] text-white leading-[1.1] mb-2 font-bold drop-shadow-lg`}>
                                {profile.first_name} {profile.last_name}
                            </h1>
                            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20">
                                <span className="text-white text-[13px] font-bold tracking-wide shadow-black">{profile.relationship_goal || 'Relacionamento Sério'}</span>
                            </div>
                        </div>
                        <div className={`${yesevaOne.className} text-white text-[42px] font-bold leading-none mb-4 drop-shadow-lg`}>
                            {profile.age}
                        </div>
                    </div>
                </div>
            </motion.div>

            <AnimatePresence>
                {showGallery && (
                    <PhotoGallery
                        photos={profilePhotos}
                        initialIndex={currentPhotoIndex}
                        onClose={() => setShowGallery(false)}
                    />
                )}
            </AnimatePresence>
        </>
    )
}

function TimeStamp({ x, type }: { x: MotionValue<number>; type: 'like' | 'nope' }) {
    const isLike = type === 'like'
    const opacity = useTransform(x, isLike ? [50, 150] : [-50, -150], [0, 1])
    const scale = useTransform(x, isLike ? [0, 150] : [0, -150], [0.5, 1.2])
    const rotation = isLike ? -12 : 12
    const color = isLike ? 'text-green-500' : 'text-red-500'
    const borderColor = isLike ? 'border-green-500' : 'border-red-500'
    const shadowColor = isLike ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'
    const bg = isLike ? 'bg-green-500/20' : 'bg-red-500/20'

    return (
        <motion.div
            style={{ opacity, scale, rotate: rotation }}
            className={`absolute top-24 ${isLike ? 'left-10' : 'right-10'} py-3 px-8 border-[6px] ${borderColor} rounded-3xl pointer-events-none z-10 ${bg} backdrop-blur-xl shadow-[0_0_30px_${shadowColor}]`}
        >
            <span className={`${color} text-6xl font-black uppercase tracking-[0.2em] drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]`}>
                {isLike ? 'BOA' : 'OPPS'}
            </span>
        </motion.div>
    )
}
