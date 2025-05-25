import React, { useState, useRef, useCallback } from 'react';
import { FormControl, FormDescription, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Upload, Camera, Trash2, User, Pencil, ImageIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/components/ui/use-toast';

interface AvatarUploadFieldProps {
  value: string;
  onChange: (value: string) => void;
  description?: string;
  label?: string;
  maxSizeMB?: number;
  fallbackText?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showRemoveButton?: boolean;
  rounded?: 'full' | 'lg' | 'md';
  border?: boolean;
  borderColor?: string;
}

const AvatarUploadField = ({
  value,
  onChange,
  description = "Upload a profile photo",
  label = "Profile Photo",
  maxSizeMB = 2,
  fallbackText = "?",
  size = 'lg',
  className = '',
  showRemoveButton = true,
  rounded = 'full',
  border = true,
  borderColor = 'border-primary/10'
}: AvatarUploadFieldProps) => {
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isImageValid, setIsImageValid] = useState<boolean>(!!value);
  const [showUploadDialog, setShowUploadDialog] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("upload");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection from device
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Get the file for processing
    const file = files[0];
    
    // Validate file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      toast({
        title: "File too large",
        description: `Maximum file size is ${maxSizeMB}MB. Your file is ${fileSizeMB.toFixed(2)}MB.`,
        variant: "destructive"
      });
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
    
    // Create a preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPreviewImage(result);
      setIsUploading(false);
    };
    
    reader.onerror = () => {
      toast({
        title: "Error reading file",
        description: "There was a problem processing your image. Please try again.",
        variant: "destructive"
      });
      setIsUploading(false);
    };
    
    reader.readAsDataURL(file);
  };

  // Trigger file input click
  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  // Trigger camera input click
  const triggerCameraCapture = () => {
    cameraInputRef.current?.click();
  };

  // Handle image load success
  const handleImageLoad = () => {
    setIsImageValid(true);
  };

  // Handle image load error
  const handleImageError = () => {
    setIsImageValid(false);
    toast({
      title: "Image could not be loaded",
      description: "The image URL provided is invalid or inaccessible.",
      variant: "destructive"
    });
  };

  // Remove the current image
  const removeImage = () => {
    onChange('');
    setIsImageValid(false);
    setPreviewImage(null);
  };

  // Save the preview image as the actual avatar
  const saveAvatar = () => {
    if (previewImage) {
      onChange(previewImage);
      setIsImageValid(true);
      setShowUploadDialog(false);
      setPreviewImage(null);
    }
  };

  // Cancel the current upload
  const cancelUpload = () => {
    setPreviewImage(null);
    setShowUploadDialog(false);
  };

  // Get initials from a name for the avatar fallback
  const getInitials = useCallback((name: string) => {
    if (!name) return fallbackText;
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }, [fallbackText]);

  return (
    <FormItem className="space-y-3">
      {label && <FormLabel className="text-base">{label}</FormLabel>}
      <FormControl>
        <div className="space-y-2">
          <div className="flex flex-col items-center gap-4">
            <div 
              className={`relative group cursor-pointer ${rounded === 'full' ? 'rounded-full' : rounded === 'lg' ? 'rounded-lg' : rounded === 'md' ? 'rounded-md' : 'rounded-full'} ${className}`}
              onClick={() => setShowUploadDialog(true)}
            >
              <Avatar 
                className={`
                  ${size === 'sm' ? 'h-16 w-16' : 
                    size === 'md' ? 'h-20 w-20' : 
                    size === 'lg' ? 'h-24 w-24' : 
                    size === 'xl' ? 'h-32 w-32' : 'h-24 w-24'} 
                  ${border ? `border-2 ${borderColor}` : ''} 
                  ${rounded === 'full' ? 'rounded-full' : rounded === 'lg' ? 'rounded-lg' : rounded === 'md' ? 'rounded-md' : 'rounded-full'}
                `}
              >
                <AvatarImage 
                  src={value} 
                  alt="Profile avatar" 
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                  className="object-cover"
                />
                <AvatarFallback 
                  className={`
                    ${size === 'sm' ? 'text-lg' : 
                      size === 'md' ? 'text-xl' : 
                      size === 'lg' ? 'text-2xl' : 
                      size === 'xl' ? 'text-3xl' : 'text-2xl'} 
                    bg-primary/10 text-primary
                  `}
                >
                  {fallbackText}
                </AvatarFallback>
              </Avatar>
              
              <div className={`
                absolute inset-0 
                ${rounded === 'full' ? 'rounded-full' : rounded === 'lg' ? 'rounded-lg' : rounded === 'md' ? 'rounded-md' : 'rounded-full'} 
                flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 
                transition-all duration-200 backdrop-blur-[1px]
              `}>
                <div className="flex flex-col items-center text-white">
                  <Pencil className={`${size === 'sm' ? 'h-4 w-4' : size === 'xl' ? 'h-6 w-6' : 'h-5 w-5'}`} />
                  <span className={`${size === 'sm' ? 'text-[10px]' : 'text-xs'} mt-1 font-medium`}>Edit</span>
                </div>
              </div>
            </div>
            
            {value && isImageValid && showRemoveButton && (
              <Button 
                variant="outline" 
                size="sm"
                className="text-xs flex items-center gap-1 mt-2"
                onClick={removeImage}
              >
                <Trash2 className="h-3 w-3" />
                Remove Photo
              </Button>
            )}
          </div>
          
          {/* Hidden input for file upload */}
          <input 
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            className="hidden"
          />
          
          {/* Hidden input for camera */}
          <input 
            type="file"
            ref={cameraInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            capture="user"
            className="hidden"
          />
          
          {/* Upload Dialog */}
          <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Upload Profile Photo</DialogTitle>
              </DialogHeader>
              
              {previewImage ? (
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <Avatar className={`
                      ${size === 'sm' ? 'h-24 w-24' : 
                       size === 'md' ? 'h-28 w-28' : 
                       size === 'lg' ? 'h-32 w-32' : 
                       size === 'xl' ? 'h-40 w-40' : 'h-32 w-32'} 
                      border-2 ${borderColor} 
                      ${rounded === 'full' ? 'rounded-full' : rounded === 'lg' ? 'rounded-lg' : rounded === 'md' ? 'rounded-md' : 'rounded-full'}
                    `}>
                      <AvatarImage 
                        src={previewImage} 
                        alt="Preview" 
                        className="object-cover"
                      />
                    </Avatar>
                  </div>
                  
                  <DialogFooter className="flex flex-row sm:justify-between gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={cancelUpload}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={saveAvatar}
                    >
                      Save Avatar
                    </Button>
                  </DialogFooter>
                </div>
              ) : (
                <Tabs defaultValue="upload" value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="upload" className="flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      <span>Upload</span>
                    </TabsTrigger>
                    <TabsTrigger value="camera" className="flex items-center gap-2">
                      <Camera className="h-4 w-4" />
                      <span>Camera</span>
                    </TabsTrigger>
                  </TabsList>
                  
                  <div className="mt-4">
                    {/* File upload tab */}
                    <TabsContent value="upload" className="mt-0 space-y-4">
                      <Button 
                        variant="outline" 
                        type="button" 
                        className="w-full h-32 border-2 border-dashed flex flex-col gap-2"
                        onClick={triggerFileUpload}
                      >
                        <Upload className="h-8 w-8 text-primary/70" />
                        <span className="text-sm text-muted-foreground">
                          Click to select from device
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Max size: {maxSizeMB}MB
                        </span>
                      </Button>
                    </TabsContent>
                    
                    {/* Camera tab */}
                    <TabsContent value="camera" className="mt-0 space-y-4">
                      <Button 
                        variant="outline" 
                        type="button" 
                        className="w-full h-32 border-2 border-dashed flex flex-col gap-2"
                        onClick={triggerCameraCapture}
                      >
                        <Camera className="h-8 w-8 text-primary/70" />
                        <span className="text-sm text-muted-foreground">
                          Take a photo with your camera
                        </span>
                        <span className="text-xs text-muted-foreground">
                          For best results, use good lighting
                        </span>
                      </Button>
                    </TabsContent>
                  </div>
                </Tabs>
              )}
              
              {isUploading && (
                <div className="fixed inset-0 bg-background/30 backdrop-blur-sm flex items-center justify-center z-50">
                  <div className="bg-background p-4 rounded-lg shadow-lg flex flex-col items-center">
                    <div className="h-8 w-8 rounded-full border-2 border-current border-t-transparent text-primary animate-spin"/>
                    <p className="mt-2 text-sm">Processing image...</p>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </FormControl>
      {description && <FormDescription>{description}</FormDescription>}
      <FormMessage />
    </FormItem>
  );
};

export default AvatarUploadField;
