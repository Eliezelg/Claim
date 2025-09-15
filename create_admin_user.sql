
-- Script pour créer un utilisateur admin
INSERT INTO users (id, email, first_name, last_name, role, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'eliezelg@gmail.com',
  'Eliezer',
  'G',
  'ADMIN',
  NOW(),
  NOW()
)
ON CONFLICT (email) 
DO UPDATE SET 
  role = 'ADMIN',
  updated_at = NOW();

-- Mise à jour pour faire admin@webpro200.com SUPERADMIN
UPDATE users 
SET role = 'SUPERADMIN', updated_at = NOW() 
WHERE email = 'admin@webpro200.com';
