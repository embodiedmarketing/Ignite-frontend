export type BonusTrainingThemeColor = "purple" | "blue" | "green" | "orange";

export interface BonusTrainingVideo {
  id: string;
  seriesId: string;
  title: string;
  vimeoId: string;
  order: number;
  stepNumber?: number;
}

export interface BonusTrainingSeries {
  id: string;
  categoryId: string;
  title: string;
  description: string;
  themeColor: BonusTrainingThemeColor;
  order: number;
  stepNumberBase?: number;
  videoCount?: number;
}

export interface BonusTrainingCategory {
  id: string;
  title: string;
  description: string;
  order: number;
  series: BonusTrainingSeries[];
}

export interface BonusTrainingCategoryFormData {
  title: string;
  description: string;
}

export interface BonusTrainingSeriesFormData {
  title: string;
  description: string;
  themeColor: BonusTrainingThemeColor;
}

export interface BonusTrainingVideoFormData {
  title: string;
  vimeoId: string;
}
