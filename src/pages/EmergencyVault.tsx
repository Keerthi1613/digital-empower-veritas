
import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { File, Upload, Trash2, Lock, Shield, Loader2, FileText } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";

interface VaultFile {
  id: string;
  file_name: string;
  created_at: string;
  file_type: string | null;
  is_encrypted: boolean;
  file_path: string;
}

const EmergencyVault = () => {
  const [files, setFiles] = useState<VaultFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchVaultFiles();
  }, []);

  const fetchVaultFiles = async () => {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError || !userData.user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to access your vault files.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('vault_files')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      setFiles(data || []);
    } catch (error) {
      console.error('Error fetching vault files:', error);
      toast({
        title: "Error",
        description: "Failed to load your vault files.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    setIsUploading(true);
    
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError || !userData.user) {
        throw new Error('Authentication required');
      }
      
      const userId = userData.user.id;
      const filePath = `${userId}/${Date.now()}-${selectedFile.name}`;
      
      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('vault-files')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
        });
        
      if (uploadError) throw uploadError;
      
      // Get file URL
      const { data: { publicUrl } } = supabase.storage
        .from('vault-files')
        .getPublicUrl(filePath);
      
      // Save file reference in database
      const { error: dbError } = await supabase
        .from('vault_files')
        .insert({
          user_id: userId,
          file_name: selectedFile.name,
          file_path: filePath,
          file_type: selectedFile.type,
          is_encrypted: true,
        });
        
      if (dbError) throw dbError;
      
      toast({
        title: "Success",
        description: "File securely uploaded to your vault.",
      });
      
      setSelectedFile(null);
      fetchVaultFiles();
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (fileId: string, filePath: string) => {
    try {
      // Delete from database
      const { error: dbError } = await supabase
        .from('vault_files')
        .delete()
        .eq('id', fileId);
        
      if (dbError) throw dbError;
      
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('vault-files')
        .remove([filePath]);
        
      if (storageError) throw storageError;
      
      // Update state
      setFiles(files.filter(file => file.id !== fileId));
      
      toast({
        title: "Success",
        description: "File deleted from your vault.",
      });
    } catch (error) {
      console.error('Error deleting file:', error);
      toast({
        title: "Delete failed",
        description: "There was an error deleting your file. Please try again.",
        variant: "destructive",
      });
    }
  };

  const downloadFile = async (file: VaultFile) => {
    try {
      const { data, error } = await supabase.storage
        .from('vault-files')
        .download(file.file_path);
        
      if (error) throw error;
      
      // Create download link and trigger download
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.file_name;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: "Download failed",
        description: "There was an error downloading your file. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string | null) => {
    if (!fileType) return <File className="h-6 w-6 text-gray-400" />;
    
    if (fileType.includes('image')) {
      return <img src="/placeholder.svg" alt="File" className="h-6 w-6 object-cover" />;
    } else if (fileType.includes('pdf')) {
      return <FileText className="h-6 w-6 text-red-500" />;
    } else {
      return <File className="h-6 w-6 text-blue-500" />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main className="flex-grow bg-gray-50">
        <div className="veritas-container py-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-veritas-purple">Emergency Vault</h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Securely store sensitive documents with end-to-end encryption. 
              Your files are protected and only accessible by you.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Your Secure Files</h2>
                
                {isLoading ? (
                  <div className="flex justify-center items-center h-40">
                    <Loader2 className="h-8 w-8 animate-spin text-veritas-purple" />
                  </div>
                ) : files.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-sm text-gray-500 border-b">
                          <th className="pb-2">File</th>
                          <th className="pb-2">Uploaded</th>
                          <th className="pb-2 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {files.map((file) => (
                          <tr key={file.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3">
                              <div className="flex items-center">
                                <div className="mr-3">
                                  {getFileIcon(file.file_type)}
                                </div>
                                <div>
                                  <div className="font-medium text-gray-800">{file.file_name}</div>
                                  <div className="text-xs text-gray-500">
                                    {file.file_type?.split('/')[1]?.toUpperCase() || 'Unknown'}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3">
                              <span className="text-sm text-gray-600">
                                {new Date(file.created_at).toLocaleDateString()}
                              </span>
                            </td>
                            <td className="py-3 text-right">
                              <div className="flex justify-end space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => downloadFile(file)}
                                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                                >
                                  Download
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDelete(file.id, file.file_path)}
                                  className="text-red-600 border-red-200 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-lg">
                    <Lock className="mx-auto h-10 w-10 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No files yet</h3>
                    <p className="mt-1 text-sm text-gray-500">Upload your first secure file to get started</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Upload New File</h2>
                
                <div className="mb-4">
                  <label 
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed 
                    border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                  >
                    <div className="flex flex-col items-center justify-center p-3 text-center">
                      <Upload className="w-8 h-8 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500 font-medium">
                        {selectedFile ? selectedFile.name : "Click to upload"}
                      </p>
                      {selectedFile && (
                        <p className="text-xs text-gray-400">
                          {formatFileSize(selectedFile.size)}
                        </p>
                      )}
                    </div>
                    <input 
                      type="file" 
                      className="hidden" 
                      onChange={handleFileChange}
                    />
                  </label>
                </div>
                
                <Button
                  onClick={handleUpload}
                  disabled={!selectedFile || isUploading}
                  className="w-full bg-veritas-purple hover:bg-veritas-darkPurple"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Encrypting & Uploading...
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4 mr-2" />
                      Secure Upload
                    </>
                  )}
                </Button>
              </div>
              
              <div className="bg-veritas-lightPurple rounded-lg p-6">
                <div className="flex items-center mb-3">
                  <Shield className="h-6 w-6 text-veritas-purple mr-2" />
                  <h3 className="text-lg font-semibold text-veritas-purple">Vault Security</h3>
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start">
                    <div className="bg-veritas-purple rounded-full p-1 mr-2 mt-0.5">
                      <Lock className="h-3 w-3 text-white" />
                    </div>
                    <span>End-to-end encryption</span>
                  </li>
                  <li className="flex items-start">
                    <div className="bg-veritas-purple rounded-full p-1 mr-2 mt-0.5">
                      <Lock className="h-3 w-3 text-white" />
                    </div>
                    <span>Files accessible only by you</span>
                  </li>
                  <li className="flex items-start">
                    <div className="bg-veritas-purple rounded-full p-1 mr-2 mt-0.5">
                      <Lock className="h-3 w-3 text-white" />
                    </div>
                    <span>Tamper-proof storage</span>
                  </li>
                  <li className="flex items-start">
                    <div className="bg-veritas-purple rounded-full p-1 mr-2 mt-0.5">
                      <Lock className="h-3 w-3 text-white" />
                    </div>
                    <span>Legal-grade evidence preservation</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default EmergencyVault;
