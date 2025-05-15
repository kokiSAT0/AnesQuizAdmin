// types/firestore.ts
export interface Question {
  id: string;
  type: 'single_choice' | 'multiple_choice';
  categories: string[];
  tags: string[];
  difficulty: { level: '初級' | '中級' | '上級'; correct_rate: number };
  question: string;
  options: string[];
  correct_answers: number[];
  explanation: string;
  media_urls: string[];
  references: { title: string; url: string }[];
  metadata: {
    created_at: string;
    updated_at: string;
    created_by: 'koki';
    reviewed: boolean;
  };
  statistics: { attempts: number; correct: number };
}
