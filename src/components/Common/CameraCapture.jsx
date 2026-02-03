import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, RefreshCw, Smartphone } from 'lucide-react';
import { useAlert } from './Alert'; // Assuming you have an Alert context or similar

const CameraCapture = ({ onCapture, onClose }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [stream, setStream] = useState(null);
    const [error, setError] = useState(null);
    const [facingMode, setFacingMode] = useState('environment'); // 'user' or 'environment'
    const [hasMultipleCameras, setHasMultipleCameras] = useState(false);

    // Initialize camera
    useEffect(() => {
        let currentStream = null;

        const startCamera = async () => {
            try {
                // Stop any existing stream
                if (stream) {
                    stream.getTracks().forEach(track => track.stop());
                }

                const constraints = {
                    video: {
                        facingMode: facingMode,
                        width: { ideal: 1920 },
                        height: { ideal: 1080 }
                    }
                };

                const newStream = await navigator.mediaDevices.getUserMedia(constraints);
                currentStream = newStream;
                setStream(newStream);

                if (videoRef.current) {
                    videoRef.current.srcObject = newStream;
                }

                // Check for multiple cameras
                const devices = await navigator.mediaDevices.enumerateDevices();
                const videoDevices = devices.filter(device => device.kind === 'videoinput');
                setHasMultipleCameras(videoDevices.length > 1);

            } catch (err) {
                console.error("Camera Error:", err);
                setError("Could not access camera. Please ensure you have granted permissions.");
            }
        };

        startCamera();

        return () => {
            if (currentStream) {
                currentStream.getTracks().forEach(track => track.stop());
            }
        };
    }, [facingMode]);

    const handleCapture = () => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;

        // Set canvas dimensions to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert to blob/file
        canvas.toBlob((blob) => {
            if (blob) {
                const file = new File([blob], `camera_capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
                onCapture(file);

                // Stop stream before closing
                if (stream) {
                    stream.getTracks().forEach(track => track.stop());
                }
            }
        }, 'image/jpeg', 0.95);
    };

    const toggleCamera = () => {
        setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
    };

    if (error) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
                <div className="bg-white rounded-xl p-6 max-w-sm w-full text-center">
                    <Camera size={48} className="mx-auto text-red-500 mb-4" />
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Camera Error</h3>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <button onClick={onClose} className="btn btn-primary w-full">
                        Close
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-black/50 absolute top-0 left-0 right-0 z-10">
                <span className="text-white font-medium">Take Photo</span>
                <button onClick={onClose} className="p-2 bg-white/20 rounded-full text-white hover:bg-white/30 transition-colors">
                    <X size={24} />
                </button>
            </div>

            {/* Video Preview */}
            <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-black">
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                />
                <canvas ref={canvasRef} className="hidden" />
            </div>

            {/* Controls */}
            <div className="p-8 pb-12 bg-black/50 absolute bottom-0 left-0 right-0 z-10 flex justify-around items-center">

                {/* Switch Camera (only if multiple) */}
                <div className="w-12">
                    {hasMultipleCameras && (
                        <button
                            onClick={toggleCamera}
                            className="p-3 bg-white/20 rounded-full text-white hover:bg-white/30 transition-colors"
                        >
                            <RefreshCw size={24} />
                        </button>
                    )}
                </div>

                {/* Capture Button */}
                <button
                    onClick={handleCapture}
                    className="w-20 h-20 bg-white rounded-full border-4 border-gray-300 hover:scale-105 transition-transform flex items-center justify-center shadow-lg"
                >
                    <div className="w-16 h-16 bg-white rounded-full border-2 border-black" />
                </button>

                {/* Spacer to center capture button */}
                <div className="w-12"></div>
            </div>
        </div>
    );
};

export default CameraCapture;
