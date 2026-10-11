export interface TblRead {
  client: string;
  section: 'Media' | 'Creative' | 'Consumer' | 'Competition';
  period: string;
  order: number;
  bullet: string;
  linkedCard: string;
  author: string;
  dateWritten: string;
  sourceFile: string;
  sourceSheet: 'Reads';
}

export interface TblReadsResponse {
  client: string;
  section: TblRead['section'];
  period: string;
  reads: TblRead[];
  pending: boolean;
  sourceFile: string;
}
