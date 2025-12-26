'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'

interface PhotoGalleryProps {
    photos: string[]
    initialIndex: number
    onClose: () => void
}

export default function PhotoGallery({ photos, initialIndex, onClose }: PhotoGalleryProps) {
    const [[page, direction], setPage] = useState([initialIndex, 0])
    const [isZoomed, setIsZoomed] = useState(false)

    // Sync state if initialIndex changes changes
    const currentIndex = page

    const paginate = (newDirection: number) => {
        const newIndex = page + newDirection
        if (newIndex >= 0 && newIndex < photos.length) {
            setPage([newIndex, newDirection])
        }
    }

    const variants = {
        enter: (direction: number) => {
            return {
                x: direction > 0 ? '100%' : '-100%',
                opacity: 1
            }
        },
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1
        },
        exit: (direction: number) => {
            return {
                zIndex: 0,
                x: direction < 0 ? '100%' : '-100%',
                opacity: 1
            }
        }
    }

    const swipeConfidenceThreshold = 10000
    const swipePower = (offset: number, velocity: number) => {
        return Math.abs(offset) * velocity
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center overflow-hidden"
        >
            {/* Header / Controls */}
            <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between z-[110] bg-gradient-to-b from-black/80 to-transparent">
                <div className="text-white font-medium">
                    {currentIndex + 1} / {photos.length}
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={onClose}
                        className="p-3 rounded-full bg-white/10 backdrop-blur-md text-white border border-white/10 active:scale-90 transition-all pointer-events-auto"
                    >
                        <X size={24} />
                    </button>
                </div>
            </div>

            {/* Main Interactive Area */}
            <div className="relative w-full h-full flex items-center justify-center overflow-hidden touch-none">
                <AnimatePresence initial={false} custom={direction} mode="popLayout">
                    <motion.div
                        key={page}
                        custom={direction}
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{
                            x: { type: "spring", stiffness: 300, damping: 30 },
                            opacity: { duration: 0.2 }
                        }}
                        drag={!isZoomed ? "x" : false}
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={1}
                        onDragEnd={(_, { offset, velocity }) => {
                            if (isZoomed) return
                            const swipe = swipePower(offset.x, velocity.x)

                            if (swipe < -swipeConfidenceThreshold) {
                                paginate(1)
                            } else if (swipe > swipeConfidenceThreshold) {
                                paginate(-1)
                            }
                        }}
                        className="absolute w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing"
                    >
                        <TransformWrapper
                            initialScale={1}
                            minScale={1}
                            maxScale={5}
                            onTransformed={(r) => setIsZoomed(r.state.scale > 1.01)}
                            doubleClick={{ disabled: true }}
                            pinch={{ disabled: false }}
                            centerOnInit
                        >
                            <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }} contentStyle={{ width: "100%", height: "100%" }}>
                                <img
                                    src={photos[currentIndex]}
                                    className="w-full h-full object-contain pointer-events-auto"
                                    draggable={false}
                                    style={{ width: '100vw', height: '100dvh' }}
                                />
                            </TransformComponent>
                        </TransformWrapper>
                    </motion.div>
                </AnimatePresence>

                {/* Desktop Navigation Arrows */}
                {currentIndex > 0 && !isZoomed && (
                    <button
                        onClick={() => paginate(-1)}
                        className="absolute left-6 p-4 rounded-full bg-black/30 text-white border border-white/10 hidden md:block z-[120] hover:bg-black/50 transition-colors"
                    >
                        <ChevronLeft size={32} />
                    </button>
                )}
                {currentIndex < photos.length - 1 && !isZoomed && (
                    <button
                        onClick={() => paginate(1)}
                        className="absolute right-6 p-4 rounded-full bg-black/30 text-white border border-white/10 hidden md:block z-[120] hover:bg-black/50 transition-colors"
                    >
                        <ChevronRight size={32} />
                    </button>
                )}

                {/* Mobile Swipe Indicators (Bottom area) */}
                <div className="absolute bottom-10 flex gap-2 z-[110]">
                    {photos.map((_, i) => (
                        <div
                            key={i}
                            className={`h-1 rounded-full transition-all duration-300 ${i === currentIndex ? 'w-8 bg-white' : 'w-2 bg-white/30'}`}
                        />
                    ))}
                </div>
            </div>
        </motion.div>
    )
}
