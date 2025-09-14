import { useState, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { t } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Upload, File, X, CloudUpload, FileText, Check } from "lucide-react";
import { ClaimFormData } from "@/types/claim";
import { apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";

interface DocumentUploadProps {
  claimData: ClaimFormData;
  onComplete: () => void;
  onBack: () => void;
}

interface UploadedFile {
  file: File;
  type: 'BOARDING_PASS' | 'RECEIPT' | 'OTHER';
  preview?: string;
}

export function DocumentUpload({ claimData, onComplete, onBack }: DocumentUploadProps) {
  const { language, isRTL } = useLanguage();
  const { toast } = useToast();
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [assistanceReceived, setAssistanceReceived] = useState(false);
  const boardingPassRef = useRef<HTMLInputElement>(null);
  const receiptsRef = useRef<HTMLInputElement>(null);

  // Create claim mutation
  const createClaimMutation = useMutation({
    mutationFn: async (claimData: ClaimFormData) => {
      const response = await apiRequest('POST', '/api/claims', claimData);
      return response.json();
    },
    onSuccess: (claim) => {
      // Upload documents if any
      if (uploadedFiles.length > 0) {
        uploadDocuments(claim.id);
      } else {
        onComplete();
      }
    },
    onError: (error) => {
      console.error('Claim creation error:', error);
      toast({
        title: "Error",
        description: "Failed to create claim. Please try again.",
        variant: "destructive",
      });
    },
  });

  const uploadDocuments = async (claimId: string) => {
    const uploadPromises = uploadedFiles.map(async (uploadedFile) => {
      const formData = new FormData();
      formData.append('file', uploadedFile.file);
      formData.append('type', uploadedFile.type);

      try {
        await apiRequest('POST', `/api/claims/${claimId}/documents`, formData);
      } catch (error) {
        console.error('Document upload error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        toast({
          title: "Upload Warning", 
          description: `Failed to upload ${uploadedFile.file.name}: ${errorMessage}`,
          variant: "destructive",
        });
      }
    });

    await Promise.allSettled(uploadPromises);
    queryClient.invalidateQueries({ queryKey: ['/api/claims'] });
    onComplete();
  };

  const handleSubmit = () => {
    const finalClaimData = {
      ...claimData,
      incidentDescription: additionalInfo || claimData.incidentDescription,
      assistanceReceived: assistanceReceived,
    };

    createClaimMutation.mutate(finalClaimData);
  };

  const handleFileSelect = (files: FileList | null, type: 'BOARDING_PASS' | 'RECEIPT' | 'OTHER') => {
    if (!files) return;

    Array.from(files).forEach(file => {
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: `${file.name} is too large. Maximum size is 10MB.`,
          variant: "destructive",
        });
        return;
      }

      // Check file type
      const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: `${file.name} is not supported. Please use JPEG, PNG, or PDF files.`,
          variant: "destructive",
        });
        return;
      }

      // Create preview for images
      let preview: string | undefined;
      if (file.type.startsWith('image/')) {
        preview = URL.createObjectURL(file);
      }

      setUploadedFiles(prev => [...prev, { file, type, preview }]);
    });
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => {
      const file = prev[index];
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleDragOver = (e: React.DragEvent, type: string) => {
    e.preventDefault();
    setDragOver(type);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(null);
  };

  const handleDrop = (e: React.DragEvent, type: 'BOARDING_PASS' | 'RECEIPT' | 'OTHER') => {
    e.preventDefault();
    setDragOver(null);
    handleFileSelect(e.dataTransfer.files, type);
  };

  return (
    <div className="space-y-8">
      {/* Boarding Pass Upload */}
      <Card className="shadow-sm">
        <CardContent className="p-6">
          <div className={`flex items-center mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <FileText className="text-primary w-6 h-6 mr-3" />
            <h3 className="text-lg font-semibold text-card-foreground">
              {t('documents.boardingPass.title', language)}
            </h3>
            <Badge className="ml-2 bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium">
              Required
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            {t('documents.boardingPass.description', language)}
          </p>
          
          <div 
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
              dragOver === 'boarding' ? 'drag-over border-primary bg-primary/5' : 'border-border hover:border-primary'
            }`}
            onDragOver={(e) => handleDragOver(e, 'boarding')}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 'BOARDING_PASS')}
            onClick={() => boardingPassRef.current?.click()}
            data-testid="dropzone-boarding-pass"
          >
            <CloudUpload className="w-12 h-12 text-muted-foreground mb-4 mx-auto" />
            <p className="text-lg font-medium text-foreground mb-2">
              {t('documents.dragDrop', language)}
            </p>
            <p className="text-sm text-muted-foreground mb-4">or click to browse files</p>
            <Button 
              type="button"
              className="bg-primary text-primary-foreground px-6 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
              data-testid="button-choose-boarding-pass"
            >
              {t('documents.chooseFile', language)}
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              {t('documents.supportedFormats', language)}
            </p>
          </div>
          
          <input
            ref={boardingPassRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            multiple={false}
            onChange={(e) => handleFileSelect(e.target.files, 'BOARDING_PASS')}
            className="hidden"
          />
        </CardContent>
      </Card>
      
      {/* Receipts Upload */}
      <Card className="shadow-sm">
        <CardContent className="p-6">
          <div className={`flex items-center mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Upload className="text-primary w-6 h-6 mr-3" />
            <h3 className="text-lg font-semibold text-card-foreground">
              {t('documents.receipts.title', language)}
            </h3>
            <Badge className="ml-2 bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-medium">
              Optional
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            {t('documents.receipts.description', language)}
          </p>
          
          <div 
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
              dragOver === 'receipts' ? 'drag-over border-primary bg-primary/5' : 'border-border hover:border-primary'
            }`}
            onDragOver={(e) => handleDragOver(e, 'receipts')}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 'RECEIPT')}
            onClick={() => receiptsRef.current?.click()}
            data-testid="dropzone-receipts"
          >
            <Upload className="w-12 h-12 text-muted-foreground mb-4 mx-auto" />
            <p className="text-lg font-medium text-foreground mb-2">Upload expense receipts</p>
            <p className="text-sm text-muted-foreground mb-4">Multiple files allowed</p>
            <Button 
              type="button"
              variant="secondary"
              className="px-6 py-2 rounded-lg text-sm font-medium"
              data-testid="button-choose-receipts"
            >
              Add Files
            </Button>
          </div>
          
          <input
            ref={receiptsRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            multiple={true}
            onChange={(e) => handleFileSelect(e.target.files, 'RECEIPT')}
            className="hidden"
          />
        </CardContent>
      </Card>

      {/* Uploaded Files Preview */}
      {uploadedFiles.length > 0 && (
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <h4 className="font-semibold text-foreground mb-4">Uploaded Files</h4>
            <div className="space-y-2">
              {uploadedFiles.map((uploadedFile, index) => (
                <div key={index} className="flex items-center justify-between bg-muted rounded-lg p-3" data-testid={`uploaded-file-${index}`}>
                  <div className={`flex items-center space-x-3 ${isRTL ? 'space-x-reverse' : ''}`}>
                    <File className="w-5 h-5 text-blue-500" />
                    <span className="text-sm font-medium">{uploadedFile.file.name}</span>
                    <span className="text-xs text-muted-foreground">
                      ({Math.round(uploadedFile.file.size / 1024)} KB)
                    </span>
                    <Badge className="text-xs">
                      {uploadedFile.type.replace('_', ' ')}
                    </Badge>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    className="text-destructive hover:bg-destructive/10 p-1 rounded"
                    data-testid={`button-remove-file-${index}`}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Additional Information */}
      <Card className="shadow-sm">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-card-foreground mb-4">Additional Information</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="description" className="block text-sm font-medium text-muted-foreground mb-2">
                Describe what happened during your journey
              </Label>
              <Textarea
                id="description"
                placeholder="Please describe the delay/cancellation, any assistance received, and how it affected you..."
                rows={4}
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
                className="w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                data-testid="textarea-additional-info"
              />
            </div>
            <div className={`flex items-start space-x-3 ${isRTL ? 'space-x-reverse' : ''}`}>
              <input
                type="checkbox"
                id="assistance"
                checked={assistanceReceived}
                onChange={(e) => setAssistanceReceived(e.target.checked)}
                className="mt-1"
                data-testid="checkbox-assistance"
              />
              <Label htmlFor="assistance" className="text-sm text-muted-foreground">
                I received assistance from the airline (meals, accommodation, etc.)
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className={`flex justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
        <Button 
          type="button" 
          variant="outline"
          onClick={onBack}
          disabled={createClaimMutation.isPending}
          className="px-6 py-3 border border-border rounded-lg text-muted-foreground hover:bg-muted transition-colors"
          data-testid="button-back"
        >
          <ArrowLeft className={`w-5 h-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
          {t('claim.back', language)}
        </Button>
        
        <Button 
          type="button"
          onClick={handleSubmit}
          disabled={createClaimMutation.isPending}
          className="bg-primary text-primary-foreground px-8 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
          data-testid="button-submit-claim"
        >
          {createClaimMutation.isPending ? (
            <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
              Submitting...
            </div>
          ) : (
            <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
              {t('documents.submit', language)}
              <Check className={`w-5 h-5 ${isRTL ? 'mr-2' : 'ml-2'}`} />
            </div>
          )}
        </Button>
      </div>
    </div>
  );
}
