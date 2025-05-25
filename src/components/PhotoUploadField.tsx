import React, { useState, useRef, useCallback } from 'react';
import { FormControl, FormDescription, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, Image as ImageIcon, Camera, Trash2, Link as LinkIcon, X, ZoomIn, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog';

interface PhotoUploadFieldProps {
  value: string | string[];
  onChange: (value: string | string[]) => void;
  description?: string;
  label?: string;
  maxSizeMB?: number;
  maxImages?: number;
  aspectRatio?: number;
  multiple?: boolean;
  isReadOnly?: boolean;
}

const PhotoUploadField = ({
  value,
  onChange,
  description = "Upload images of the issue (up to 4)",
  label = "Photos",
  maxSizeMB = 5,
  maxImages = 4,
  aspectRatio,
  multiple = true,
  isReadOnly = false
}: PhotoUploadFieldProps) => {
  // Convert single string value to array for consistent handling
  const initialImages = Array.isArray(value) ? value : (value ? [value] : []);
  
  const [images, setImages] = useState<string[]>(initialImages);
  const [isValidImage, setIsValidImage] = useState<Record<number, boolean>>({
    ...initialImages.reduce((acc, _, index) => ({ ...acc, [index]: true }), {})
  });
  const [activeTab, setActiveTab] = useState<string>("upload");
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [previewImage, setPreviewImage] = useState<{url: string, index: number} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Handle URL input change
  const handleImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    if (!url) return;
    
    if (images.length >= maxImages) {
      toast({
        title: "Maximum images reached",
        description: `You can only upload up to ${maxImages} images.`,
        variant: "destructive"
      });
      return;
    }
    
    // Add the URL to our images array
    const newImages = [...images, url];
    setImages(newImages);
    onChange(multiple ? newImages : newImages[newImages.length - 1]);
    
    // Set as not validated yet
    setIsValidImage({...isValidImage, [newImages.length - 1]: false});
    e.target.value = ''; // Clear the input
  };

  // Handle file selection from device
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Check if we can add more images
    if (images.length >= maxImages) {
      toast({
        title: "Maximum images reached",
        description: `You can only upload up to ${maxImages} images.`,
        variant: "destructive"
      });
      return;
    }

    // Get the first file for processing
    const file = files[0];
    
    // Validate file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      // Enhanced error message for file size exceeded
      toast({
        title: "Image too large",
        description: `Your image (${fileSizeMB.toFixed(1)}MB) exceeds the maximum size limit of ${maxSizeMB}MB. Please resize your image or select a smaller one.`,
        variant: "destructive",
        duration: 5000 // Show for longer so user can read the message
      });
      // Clear the input for future uploads
      e.target.value = '';
      return;
    }

    // Process the file
    processFile(file);
    
    // Clear the input for future uploads
    e.target.value = '';
  };

  // Process file (from either upload or camera)
  const processFile = (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);
    
    // Simulate progress for better UX (real upload would track actual progress)
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        const newProgress = prev + Math.random() * 15;
        return newProgress < 90 ? newProgress : prev;
      });
    }, 200);
    
    // Create a preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Small delay to show 100% completion
      setTimeout(() => {
        const result = e.target?.result as string;
        const newImageIndex = images.length;
        const newImages = [...images, result];
        
        setImages(newImages);
        onChange(multiple ? newImages : newImages[newImages.length - 1]); // Set the base64 image data
        setIsValidImage({...isValidImage, [newImageIndex]: true});
        
        // Success toast with thumbnail
        toast({
          title: "Image uploaded",
          description: "Your image has been successfully added.",
          variant: "default",
        });
        
        setIsUploading(false);
        setUploadProgress(0);
      }, 500);
    };
    
    reader.onerror = () => {
      clearInterval(progressInterval);
      toast({
        title: "Error processing image",
        description: "There was a problem processing your image. Please try again.",
        variant: "destructive"
      });
      setIsUploading(false);
      setUploadProgress(0);
    };
    
    reader.readAsDataURL(file);
  };

  // Trigger file input click
  const triggerFileUpload = () => {
    if (images.length >= maxImages || isReadOnly) return;
    fileInputRef.current?.click();
  };

  // Trigger camera input click
  const triggerCameraCapture = () => {
    if (images.length >= maxImages || isReadOnly) return;
    cameraInputRef.current?.click();
  };
  
  // Handle drag events for the drop zone
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (images.length >= maxImages || isReadOnly) return;
    setIsDragging(true);
  }, [images.length, maxImages, isReadOnly]);
  
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);
  
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (images.length >= maxImages || isReadOnly) return;
    setIsDragging(true);
  }, [images.length, maxImages, isReadOnly]);
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (images.length >= maxImages || isReadOnly) return;
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      
      // Check if it's an image
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please upload only image files (jpg, png, etc).",
          variant: "destructive"
        });
        return;
      }
      
      // Validate file size
      const fileSizeMB = file.size / (1024 * 1024);
      if (fileSizeMB > maxSizeMB) {
        toast({
          title: "Image too large",
          description: `Your image (${fileSizeMB.toFixed(1)}MB) exceeds the maximum size limit of ${maxSizeMB}MB. Please resize your image or select a smaller one.`,
          variant: "destructive",
          duration: 5000
        });
        return;
      }
      
      processFile(file);
    }
  }, [images.length, maxImages, maxSizeMB, processFile, isReadOnly]);
  
  // Open image preview in dialog
  const openPreview = (url: string, index: number) => {
    setPreviewImage({ url, index });
  };

  // Handle image load success
  const handleImageLoad = (index: number) => {
    setIsValidImage({...isValidImage, [index]: true});
  };

  // Handle image load error
  const handleImageError = (index: number) => {
    setIsValidImage({...isValidImage, [index]: false});
  };

  // Remove a specific image by index
  const removeImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
    
    // Update validity state
    const newValidState = {...isValidImage};
    delete newValidState[index];
    const adjustedValidState = Object.entries(newValidState).reduce((acc, [key, value]) => {
      const keyNum = parseInt(key);
      const newKey = keyNum > index ? keyNum - 1 : keyNum;
      return {...acc, [newKey]: value};
    }, {});
    
    setIsValidImage(adjustedValidState);
    onChange(multiple ? newImages : (newImages.length > 0 ? newImages[0] : ''));
  };
  
  // Clear all images
  const clearAllImages = () => {
    setImages([]);
    setIsValidImage({});
    onChange(multiple ? [] : '');
    // Reset file inputs
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

}
export default PhotoUploadField;
