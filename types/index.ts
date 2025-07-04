export interface Photo {
  id: string;
  filename: string;
  originalName: string;
  size: number;
  uploadedAt: string;
  url: string;
}

export interface User {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  bio?: string;
  createdAt: string;
} 