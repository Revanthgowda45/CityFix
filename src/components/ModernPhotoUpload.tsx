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

const ModernPhotoUpload = ({
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
  }, [images.length, maxImages, maxSizeMB, isReadOnly]);
  
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
    
    // Update the image array
    setImages(newImages);
    
    // Also update the validation state to remove the deleted index
    const newValidState = {...isValidImage};
    delete newValidState[index];
    
    // Shift all the remaining indexes down
    const adjustedValidState = Object.entries(newValidState).reduce((acc, [key, value]) => {
      const numKey = parseInt(key);
      const newKey = numKey > index ? numKey - 1 : numKey;
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

  return (
    <FormItem>
      <FormLabel>{label}</FormLabel>
      <FormControl>
        <div className="space-y-4">
          {/* Hidden file inputs */}
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            ref={fileInputRef}
            onChange={handleFileUpload}
            disabled={isReadOnly}
          />
          <input 
            type="file" 
            accept="image/*" 
            capture="environment"
            className="hidden" 
            ref={cameraInputRef}
            onChange={handleFileUpload}
            disabled={isReadOnly}
          />
          
          {/* Image preview dialog */}
          {previewImage && (
            <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
              <DialogContent className="sm:max-w-md max-h-[90vh] overflow-hidden flex flex-col">
                <div className="relative flex-1 overflow-hidden rounded-lg">
                  <img 
                    src={previewImage.url} 
                    alt={`Preview image ${previewImage.index + 1}`}
                    className="w-full h-full object-contain max-h-[70vh]"
                  />
                </div>
                <div className="flex justify-between items-center mt-2">
                  <div className="text-sm text-muted-foreground">
                    Image {previewImage.index + 1} of {images.length}
                  </div>
                  <div className="flex gap-2">
                    <DialogClose asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex items-center gap-1"
                      >
                        <X className="h-3.5 w-3.5" />
                        <span>Close</span>
                      </Button>
                    </DialogClose>
                    {!isReadOnly && (
                      <Button 
                        variant="destructive" 
                        size="sm"
                        className="flex items-center gap-1"
                        onClick={() => {
                          removeImage(previewImage.index);
                          setPreviewImage(null);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Remove</span>
                      </Button>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
          
          {/* Modern Upload Area */}
          <div className="space-y-4">
            {/* Image grid when images are present */}
            {images.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                {images.map((image, index) => (
                  <div key={index} className="relative group">
                    <div 
                      className={cn(
                        "relative w-full h-44 sm:h-32 bg-muted/30 dark:bg-muted/10 rounded-lg overflow-hidden transition-all duration-200 cursor-pointer shadow-sm",
                        !isValidImage[index] && image ? "opacity-30" : "opacity-100",
                        "hover:ring-2 hover:ring-primary/50 hover:shadow-md"
                      )}
                      onClick={() => openPreview(image, index)}
                    >
                      <img
                        src={image}
                        alt={`Issue image ${index + 1}`}
                        className="w-full h-full object-cover"
                        onLoad={() => handleImageLoad(index)}
                        onError={() => handleImageError(index)}
                      />
                      
                      {/* Overlay for invalid images */}
                      {!isValidImage[index] && image && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-background/60 backdrop-blur-sm">
                          <AlertCircle className="h-6 w-6 text-destructive mb-1" />
                          <p className="text-xs text-muted-foreground text-center">
                            Invalid image
                          </p>
                        </div>
                      )}
                      
                      {/* View indicator on hover */}
                      <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                        <ZoomIn className="h-8 w-8 text-white drop-shadow-md" />
                      </div>
                      
                      {/* Image number badge */}
                      <div className="absolute bottom-2 left-2 bg-background/80 backdrop-blur-sm text-xs font-medium py-1 px-2 rounded-md shadow-sm">
                        {index + 1}/{images.length}
                      </div>
                    </div>
                    
                    {/* Controls for each image */}
                    {!isReadOnly && (
                      <div className="absolute top-2 right-2 flex gap-1">
                        <Button 
                          variant="secondary" 
                          size="icon" 
                          className="h-7 w-7 bg-background/80 backdrop-blur-sm hover:bg-destructive hover:text-white shadow-sm transition-colors duration-200"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeImage(index);
                          }}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Upload zone with drag and drop */}
            <div
              ref={dropZoneRef}
              className={cn(
                "transition-all duration-200 relative rounded-lg overflow-hidden",
                isDragging ? "ring-2 ring-primary scale-[1.01] shadow-lg" : "ring-0"
              )}
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {/* Tabs interface */}
              <Tabs defaultValue="upload" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3 h-auto">
                  <TabsTrigger value="upload" className="flex items-center gap-2 py-2.5" disabled={isReadOnly}>
                    <Upload className="h-4 w-4" />
                    <span>Upload</span>
                  </TabsTrigger>
                  <TabsTrigger value="camera" className="flex items-center gap-2 py-2.5" disabled={isReadOnly}>
                    <Camera className="h-4 w-4" />
                    <span>Camera</span>
                  </TabsTrigger>
                  <TabsTrigger value="url" className="flex items-center gap-2 py-2.5" disabled={isReadOnly}>
                    <LinkIcon className="h-4 w-4" />
                    <span>URL</span>
                  </TabsTrigger>
                </TabsList>
                
                <div className="mt-2">
                  {/* File upload tab */}
                  <TabsContent value="upload" className="mt-0">
                    <Button 
                      variant="outline" 
                      type="button" 
                      className={cn(
                        "w-full border-dashed flex flex-col gap-2",
                        images.length > 0 ? "h-32" : "h-40",
                        isDragging && "bg-primary/5 border-primary"
                      )}
                      onClick={triggerFileUpload}
                      disabled={images.length >= maxImages || isReadOnly}
                    >
                      <Upload className={cn(
                        "text-muted-foreground",
                        images.length > 0 ? "h-5 w-5" : "h-8 w-8"
                      )} />
                      <span className="text-muted-foreground">
                        {images.length >= maxImages 
                          ? "Maximum images reached"
                          : isDragging 
                            ? "Drop your image here"
                            : "Click or drag to upload an image"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Max size: {maxSizeMB}MB
                      </span>
                    </Button>
                  </TabsContent>
                  
                  {/* Camera tab */}
                  <TabsContent value="camera" className="mt-0">
                    <Button 
                      variant="outline" 
                      type="button" 
                      className={cn(
                        "w-full border-dashed flex flex-col gap-2",
                        images.length > 0 ? "h-32" : "h-40"
                      )}
                      onClick={triggerCameraCapture}
                      disabled={images.length >= maxImages || isReadOnly}
                    >
                      <Camera className={cn(
                        "text-muted-foreground",
                        images.length > 0 ? "h-5 w-5" : "h-8 w-8"
                      )} />
                      <span className="text-muted-foreground">
                        {images.length >= maxImages 
                          ? "Maximum images reached"
                          : "Take a photo with your camera"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Max size: {maxSizeMB}MB
                      </span>
                    </Button>
                  </TabsContent>
                  
                  {/* URL tab */}
                  <TabsContent value="url" className="mt-0">
                    <div className="space-y-2">
                      <div className="relative">
                        <Input 
                          placeholder="https://example.com/image.jpg" 
                          onChange={handleImageUrlChange}
                          className="pr-9"
                          disabled={images.length >= maxImages || isReadOnly}
                        />
                        <LinkIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {images.length >= maxImages 
                          ? "Maximum images reached"
                          : "Enter a URL to an image of the issue"}
                      </div>
                    </div>
                  </TabsContent>
                </div>
              </Tabs>

              {/* Drag overlay */}
              {isDragging && (
                <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-10 pointer-events-none">
                  <div className="bg-background p-4 rounded-lg shadow-lg flex flex-col items-center">
                    <Upload className="h-8 w-8 text-primary mb-2" />
                    <p className="font-medium">Drop your image here</p>
                  </div>
                </div>
              )}
            </div>

            {/* Upload progress indicator */}
            {isUploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Uploading image...</span>
                  <span>{Math.round(uploadProgress)}%</span>
                </div>
                <Progress value={uploadProgress} className="h-1.5" />
              </div>
            )}
          </div>
        </div>
      </FormControl>
      <FormDescription>{description}</FormDescription>
      <FormMessage />
    </FormItem>
  );
};

export default ModernPhotoUpload;
