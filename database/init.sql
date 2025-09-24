-- Database initialization script for Client Proofing System
-- Run this after creating the database and running 'npx prisma db push'

-- Create admin user (password: admin123)
-- Note: In production, use a strong password and hash it properly
INSERT INTO users (id, email, password, name, role, createdAt, updatedAt) VALUES 
('admin-1', 'admin@newstatebranding.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin User', 'ADMIN', NOW(), NOW());

-- Create sample project for testing
INSERT INTO projects (id, name, clientName, clientEmail, description, status, allowDownloads, userId, shareLink, createdAt, updatedAt) VALUES 
('project-1', 'Sample Project', 'Test Client', 'client@example.com', 'This is a sample project for testing the system', 'ACTIVE', true, 'admin-1', 'sample-share-link-123', NOW(), NOW());

-- Create sample review
INSERT INTO reviews (id, name, description, status, projectId, createdAt, updatedAt) VALUES 
('review-1', 'Initial Design Review', 'First round of design elements', 'PENDING', 'project-1', NOW(), NOW());

-- Create sample elements
INSERT INTO elements (id, name, description, status, reviewId, createdAt, updatedAt) VALUES 
('element-1', 'Logo Design', 'Main company logo', 'PENDING', 'review-1', NOW(), NOW()),
('element-2', 'Business Card', 'Front and back design', 'PENDING', 'review-1', NOW(), NOW()),
('element-3', 'Letterhead', 'Official letterhead design', 'PENDING', 'review-1', NOW(), NOW());

-- Create sample comments
INSERT INTO comments (id, content, type, status, elementId, createdAt, updatedAt) VALUES 
('comment-1', 'Great work! Please make the logo slightly larger.', 'GENERAL', 'ACTIVE', 'element-1', NOW(), NOW()),
('comment-2', 'The colors look perfect.', 'GENERAL', 'ACTIVE', 'element-2', NOW(), NOW());

-- Note: Element versions will be created when files are uploaded through the interface
