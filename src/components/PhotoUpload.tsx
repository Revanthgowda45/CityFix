import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Camera, Upload, X, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface PhotoUploadProps {
  onPhotoSelect: (photo: File) => void;
  maxSize?: number; // in MB
  allowedTypes?: string[];
}

const PhotoUpload: React.FC<PhotoUploadProps> = ({
  onPhotoSelect,
  maxSize = 5, // 5MB default
  allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
}) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a valid image file (JPEG, PNG, or WebP).",
        variant: "destructive",
      });
      return;
    }

    if (file.size > maxSize * 1024 * 1024) {
      toast({
        title: "File too large",
        description: `Please upload an image smaller than ${maxSize}MB.`,
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      onPhotoSelect(file);
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to process the image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    return () => {
      // Clean up camera resources when component unmounts
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      // First make sure any existing stream is stopped
      if (streamRef.current) {
        stopCamera();
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },  // Reduced from 1920 for better performance
          height: { ideal: 720 }   // Reduced from 1080 for better performance
        } 
      });
      
      streamRef.current = stream;
      
      // Set up video element with error handling
      if (videoRef.current) {
        // Add event listeners for better error handling
        const videoElement = videoRef.current;
        
        // Handle play errors
        const playPromise = new Promise((resolve) => {
          videoElement.onloadedmetadata = () => {
            // Only try to play after metadata is loaded
            try {
              const playAttempt = videoElement.play();
              if (playAttempt !== undefined) {
                playAttempt
                  .then(resolve)
                  .catch(e => {
                    console.warn('Error playing video:', e);
                    // Don't throw, just log and continue
                    resolve(null);
                  });
              } else {
                resolve(null);
              }
            } catch (e) {
              console.warn('Exception during play():', e);
              resolve(null);
            }
          };
        });
        
        videoElement.srcObject = stream;
        await playPromise;
        setIsCapturing(true);
      } else {
        // No video element, clean up stream
        stream.getTracks().forEach(track => track.stop());
        throw new Error('Video element not available');
      }
    } catch (error) {
      console.error('Camera start error:', error);
      toast({
        title: "Camera access denied",
        description: "Please allow camera access to take photos.",
        variant: "destructive",
      });
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCapturing(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
          onPhotoSelect(file);
          setPreview(URL.createObjectURL(blob));
          stopCamera();
        }
      }, 'image/jpeg', 0.8);
    }
  };

  const removePhoto = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {preview ? (
        <div className="relative">
          <img 
            src={preview} 
            alt="Preview" 
            className="w-full h-48 sm:h-56 object-cover rounded-lg"
          />
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8 sm:h-9 sm:w-9"
            onClick={removePhoto}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : isCapturing ? (
        <Card className="relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-48 sm:h-56 object-cover rounded-lg"
          />
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
            <Button
              variant="secondary"
              onClick={stopCamera}
              className="h-9 sm:h-10"
            >
              Cancel
            </Button>
            <Button
              onClick={capturePhoto}
              className="h-9 sm:h-10"
            >
              Take Photo
            </Button>
          </div>
        </Card>
      ) : (
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <Button
            variant="outline"
            className="flex-1 h-10 sm:h-11"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            Upload Photo
          </Button>
          <Button
            variant="outline"
            className="flex-1 h-10 sm:h-11"
            onClick={startCamera}
          >
            <Camera className="h-4 w-4 mr-2" />
            Take Photo
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept={allowedTypes.join(',')}
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      )}
    </div>
  );
};

export default PhotoUpload; 