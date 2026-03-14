export interface FileItem {
  id: string;
  file: File;
  order: number;
}

export enum SortMethod {
  NAME_ASC = 'NAME_ASC',
  NAME_DESC = 'NAME_DESC',
  SIZE_ASC = 'SIZE_ASC',
  SIZE_DESC = 'SIZE_DESC',
  LAST_MODIFIED = 'LAST_MODIFIED',
  CUSTOM_REGEX = 'CUSTOM_REGEX' // New custom sort
}

export interface MergeResult {
  blob: Blob;
  url: string;
  filename: string;
}
