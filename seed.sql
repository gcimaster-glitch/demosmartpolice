-- ============================================
-- Smart Police Portal - Seed Data
-- ============================================

-- Insert Plans
INSERT OR IGNORE INTO plans (id, name, catchphrase, description, features, initial_fee, initial_fee_discount_rate, monthly_fee, monthly_fee_discount_rate, permissions, has_dedicated_manager, contract_period, is_public, initial_tickets, monthly_tickets) VALUES
('plan_free', 'フリー', 'まずは無料でお試し', '基本的な機能をお試しいただけるプランです。', '["お知らせの閲覧","セミナーへの申込","運営へのお問い合わせ"]', 0, 0, 0, 0, '[]', 0, '月契約', 1, 1, 0),
('plan_standard', 'スタンダード', '基本的な備えを固める', '中小企業向けの基本的な危機管理とセキュリティ対策を網羅したプランです。', '["オンライン相談（月5回まで）","月次セキュリティレポート","資料室へのアクセス"]', 50000, 0, 55000, 0, '["VIEW_SERVICES","VIEW_MATERIALS","VIEW_BILLING"]', 0, '年契約', 1, 5, 5),
('plan_premium', 'プレミアム', '総合的なサポートで安心を', '専属の危機管理官が貴社を徹底的にサポート。緊急時の対応も万全です。', '["スタンダードプランの全機能","専属危機管理官の割当","オンライン相談 無制限","緊急出動サービス（年1回）"]', 100000, 0.5, 330000, 0, '["VIEW_SERVICES","VIEW_MATERIALS","VIEW_BILLING","VIEW_REPORTS","MANAGE_USERS","EDIT_COMPANY_INFO"]', 1, '年契約', 1, 10, 10),
('plan_enterprise', 'エンタープライズ', '貴社専用に完全カスタマイズ', '大企業や特殊なリスクを抱える企業様向けに、サービス内容を柔軟にカスタマイズします。', '["プレミアムプランの全機能","経営層向けコンサルティング","法的サポート体制の構築","従業員向け大規模研修"]', 0, 0, 0, 0, '["VIEW_SERVICES","VIEW_MATERIALS","VIEW_BILLING","VIEW_REPORTS","MANAGE_USERS","EDIT_COMPANY_INFO"]', 1, '年契約', 0, 99, 99);

-- Insert Demo Staff FIRST (before clients reference them)
-- Password for staff: 'staff123' (bcrypt hash)
INSERT OR IGNORE INTO staff (id, name, real_name, business_name, display_name_type, email, password, role, position, phone, profile, status, approval_status, joined_date) VALUES
(1, '高橋公義', '高橋公義', 'T.K.コンサルティング', 'real', 'takahashi@smartpolis.jp', '$2a$10$rMZvKhXKXKxKxKxKxOqH.aI5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z', 'CrisisManager', '専属危機管理官', '090-1234-5678', '元警視庁公安部出身。サイバーセキュリティと物理セキュリティの両方に精通。', 'active', 'approved', '2020-04-01'),
(2, '佐藤美咲', '佐藤美咲', 'セキュリティアドバイザー佐藤', 'real', 'sato@smartpolis.jp', '$2a$10$rMZvKhXKXKxKxKxKxOqH.aI5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z', 'Consultant', 'コンサルタント', '090-2345-6789', '大手企業での情報セキュリティ責任者を経て参画。CISM、CISSP資格保持。', 'active', 'approved', '2021-06-01');

-- Insert Demo Client (ABC商事) with assigned staff
INSERT OR IGNORE INTO clients (id, company_name, company_name_kana, contact_person, email, phone, postal_code, prefecture, city, address1, address2, corporate_number, website, plan_id, status, remaining_tickets, main_assignee_id, sub_assignee_id) VALUES
(1, 'ABC商事株式会社', 'エービーシーショウジ', '山田太郎', 'yamada@abc-shoji.co.jp', '03-1234-5678', '100-0001', '東京都', '千代田区', '丸の内1-1-1', 'オフィスビル10F', '1234567890123', 'https://abc-shoji.co.jp', 'plan_standard', 'active', 5, 1, 2);

-- Insert Demo Admin User (superadmin@smartpolis.jp / password: admin123)
-- Password hash for 'admin123' using bcrypt
INSERT OR IGNORE INTO users (id, email, password_hash, name, role, is_active) VALUES
(1, 'superadmin@smartpolis.jp', '$2a$10$X577g8YXBOSwvx2oiBTWjOGzmiaxeAxI7Xo859d7vDm8RWRAW2eb6', 'システム管理者', 'SUPERADMIN', 1);

-- Insert Demo Client User (yamada@abc-shoji.co.jp / password: client123)
INSERT OR IGNORE INTO users (id, email, password_hash, name, role, client_id, is_active) VALUES
(2, 'yamada@abc-shoji.co.jp', '$2a$10$fvMVCwEEBF29Xz1FQbCQ4.FHwG3F9VdfLnh0aAsQsxae84W9aQUSy', '山田太郎', 'CLIENTADMIN', 1, 1);

-- Insert Demo Announcements
INSERT OR IGNORE INTO announcements (category, priority, title, content, status, published_at) VALUES
('サービス情報', '重要', 'システムメンテナンスのお知らせ', 'システムメンテナンスを実施します。\n\n日時: 2024年12月1日 2:00-4:00\n対象: 全サービス\n\nご迷惑をおかけしますが、よろしくお願いいたします。', 'published', datetime('now')),
('セキュリティ', '緊急', '新たな脅威への注意喚起', '最近、企業を標的とした新たなサイバー攻撃が確認されています。\n\n【対策】\n・不審なメールは開かない\n・システムを最新状態に保つ\n・社員教育を徹底する\n\n詳細は資料室をご確認ください。', 'published', datetime('now'));

-- Insert Demo Services
INSERT OR IGNORE INTO services (id, name, category, description, long_description, price, price_type, icon, color, status) VALUES
('service_emergency', '24時間緊急対応', 'emergency', '危機発生時に即座に対応します', 'トラブル発生時、専門スタッフが24時間365日体制で迅速に対応。初動対応から解決までトータルサポート。', 100000, 'one-time', 'fa-phone-volume', 'red', 'active'),
('service_security', 'セキュリティ診断', 'security', '貴社のセキュリティを徹底診断', '脆弱性診断、ペネトレーションテスト、セキュリティポリシー策定など、総合的なセキュリティ診断サービス。', 300000, 'one-time', 'fa-shield-halved', 'blue', 'active'),
('service_training', '社員研修プログラム', 'training', '実践的な危機管理研修', '情報セキュリティ、コンプライアンス、ハラスメント対策など、実務に即した研修プログラム。', 50000, 'per-use', 'fa-chalkboard-teacher', 'green', 'active');

-- Insert Demo Seminars
INSERT OR IGNORE INTO seminars (title, description, category, date, location, capacity, status) VALUES
('サイバーセキュリティ基礎講座', 'サイバー攻撃の最新動向と対策の基礎を学びます', 'セキュリティ', '2024-12-15T14:00:00', 'オンライン', 100, '募集中'),
('危機管理マネジメント実践', '実際の事例を基にした危機管理の実践手法', 'マネジメント', '2024-12-20T15:00:00', '東京都千代田区セミナールーム', 50, '募集中');

-- Insert Demo Events
INSERT OR IGNORE INTO events (title, description, category, date, location, capacity, status) VALUES
('企業セキュリティ交流会', '同業他社とのネットワーキングとベストプラクティス共有', '交流会', '2025-01-10T18:00:00', '東京都港区 交流スペース', 30, '募集中'),
('リスクマネジメント勉強会', '最新のリスクマネジメント手法を学ぶ勉強会', '勉強会', '2025-01-15T19:00:00', 'オンライン', 80, '募集中');

-- Insert Demo Materials
INSERT OR IGNORE INTO materials (title, description, category, file_name, file_url, file_size) VALUES
('サービスパンフレット 2024', 'スマートポリスの全サービスを紹介', 'サービスパンフレット', 'service_pamphlet_2024.pdf', '/materials/service_pamphlet_2024.pdf', '2.5 MB'),
('情報セキュリティガイドライン', '企業向け情報セキュリティの基本ガイドライン', '法令資料', 'security_guideline.pdf', '/materials/security_guideline.pdf', '1.8 MB'),
('危機管理チェックリスト', '企業が準備すべき危機管理項目のチェックリスト', '社内研修資料', 'crisis_checklist.pdf', '/materials/crisis_checklist.pdf', '850 KB');

-- Insert Demo Tickets for testing
INSERT OR IGNORE INTO message_tickets (id, client_id, created_by_user_id, subject, category, priority, status, last_update) VALUES
(1, 1, 2, '不審なメールが届きました', 'セキュリティ', '高', '受付中', datetime('now')),
(2, 1, 2, 'SNSでの炎上対策について', '広報・PR', '中', '対応中', datetime('now')),
(3, 1, 2, '社内研修の実施について', '社内研修', '低', '完了', datetime('now'));

-- Insert Demo Messages
INSERT OR IGNORE INTO ticket_messages (ticket_id, user_id, staff_id, message, is_from_client) VALUES
(1, 2, NULL, '社員宛に不審なメールが届いており、フィッシング詐欺の可能性があります。対応方法をご教示ください。', 1),
(2, 2, NULL, '昨日からTwitterで否定的な投稿が増えています。どのように対応すべきでしょうか？', 1),
(2, NULL, 1, 'ご相談ありがとうございます。まず現状の把握を行いましょう。投稿の内容とアカウント情報を共有いただけますか？', 0),
(2, 2, NULL, '承知しました。主なアカウントは3つで、投稿内容のスクリーンショットをお送りします。', 1),
(3, 2, NULL, '来月、全社員向けのセキュリティ研修を実施したいと考えています。プログラムのご提案をお願いします。', 1);

-- Mark some messages as read
UPDATE ticket_messages SET is_read = 1 WHERE id IN (1, 2);
