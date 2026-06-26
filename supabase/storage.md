# Introo OS Storage Setup

## Buckets to Create

1. **avatars** (User profile pictures)
   - Public: Yes
   - Size limit: 5MB
   - Allowed MIME types: image/*

2. **documents** (General documents)
   - Public: No
   - Size limit: 50MB
   - Allowed MIME types: application/*, text/*, image/*

3. **invoices** (Invoice files)
   - Public: No
   - Size limit: 20MB
   - Allowed MIME types: application/pdf, image/*

4. **project-files** (Project attachments)
   - Public: No
   - Size limit: 100MB
   - Allowed MIME types: application/*, text/*, image/*, video/*

5. **company-assets** (Company logos, branding, etc.)
   - Public: Yes
   - Size limit: 10MB
   - Allowed MIME types: image/*

## Storage RLS Policies

### For avatars bucket
```sql
-- Allow users to upload their own avatars
CREATE POLICY "Users can upload their own avatars"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  (auth.uid()::text = (storage.foldername(name))[1])
);

-- Allow users to update their own avatars
CREATE POLICY "Users can update their own avatars"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'avatars' AND
  (auth.uid()::text = (storage.foldername(name))[1])
);

-- Allow users to delete their own avatars
CREATE POLICY "Users can delete their own avatars"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'avatars' AND
  (auth.uid()::text = (storage.foldername(name))[1])
);

-- Allow public viewing of avatars
CREATE POLICY "Public can view avatars"
ON storage.objects
FOR SELECT
USING (bucket_id = 'avatars');
```

### For documents bucket
```sql
-- Allow users in organization to upload documents
CREATE POLICY "Users can upload documents to their org"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'documents' AND
  auth.role() = 'authenticated'
);

-- Allow users to view documents from their org
CREATE POLICY "Users can view documents from their org"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'documents' AND
  auth.role() = 'authenticated'
);

-- Allow users to update documents
CREATE POLICY "Users can update documents"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'documents' AND
  auth.role() = 'authenticated'
);

-- Allow admins to delete documents
CREATE POLICY "Admins can delete documents"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'documents' AND
  auth.role() = 'authenticated'
);
```

### For invoices bucket
```sql
CREATE POLICY "Users can upload invoices"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'invoices' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can view invoices"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'invoices' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can update invoices"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'invoices' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Admins can delete invoices"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'invoices' AND
  auth.role() = 'authenticated'
);
```

### For project-files bucket
```sql
CREATE POLICY "Users can upload project files"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'project-files' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can view project files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'project-files' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can update project files"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'project-files' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Admins can delete project files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'project-files' AND
  auth.role() = 'authenticated'
);
```

### For company-assets bucket
```sql
CREATE POLICY "Public can view company assets"
ON storage.objects
FOR SELECT
USING (bucket_id = 'company-assets');

CREATE POLICY "Admins can upload company assets"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'company-assets' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Admins can update company assets"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'company-assets' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Admins can delete company assets"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'company-assets' AND
  auth.role() = 'authenticated'
);
```
