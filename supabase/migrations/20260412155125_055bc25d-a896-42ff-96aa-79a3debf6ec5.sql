-- Backfill about_global image_url
UPDATE presentation_sections ps
SET content = COALESCE(ps.content, '{}'::jsonb) || jsonb_build_object('image_url', ap.about_global_image_url)
FROM presentations p
JOIN agency_profiles ap ON ap.tenant_id = p.tenant_id
WHERE ps.presentation_id = p.id
  AND ps.section_key = 'about_global'
  AND ap.about_global_image_url IS NOT NULL
  AND (ps.content->>'image_url') IS NULL;

-- Backfill about_national image_url
UPDATE presentation_sections ps
SET content = COALESCE(ps.content, '{}'::jsonb) || jsonb_build_object('image_url', ap.about_national_image_url)
FROM presentations p
JOIN agency_profiles ap ON ap.tenant_id = p.tenant_id
WHERE ps.presentation_id = p.id
  AND ps.section_key = 'about_national'
  AND ap.about_national_image_url IS NOT NULL
  AND (ps.content->>'image_url') IS NULL;

-- Backfill about_regional image_url
UPDATE presentation_sections ps
SET content = COALESCE(ps.content, '{}'::jsonb) || jsonb_build_object('image_url', ap.about_regional_image_url)
FROM presentations p
JOIN agency_profiles ap ON ap.tenant_id = p.tenant_id
WHERE ps.presentation_id = p.id
  AND ps.section_key = 'about_regional'
  AND ap.about_regional_image_url IS NOT NULL
  AND (ps.content->>'image_url') IS NULL;

-- Backfill about_regional regional_numbers
UPDATE presentation_sections ps
SET content = COALESCE(ps.content, '{}'::jsonb) || jsonb_build_object('regional_numbers', ap.regional_numbers)
FROM presentations p
JOIN agency_profiles ap ON ap.tenant_id = p.tenant_id
WHERE ps.presentation_id = p.id
  AND ps.section_key = 'about_regional'
  AND ap.regional_numbers IS NOT NULL
  AND (ps.content->>'regional_numbers') IS NULL;