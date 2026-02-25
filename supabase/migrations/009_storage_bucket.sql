-- Create storage bucket for report photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('report-photos', 'report-photos', true);

-- Anyone can view photos
CREATE POLICY "Public read access for report photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'report-photos');

-- Authenticated users can upload
CREATE POLICY "Authenticated users can upload photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'report-photos'
    AND auth.role() = 'authenticated'
  );
