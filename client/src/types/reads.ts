export interface TblRead { order: number; bullet: string; linkedCard: string; author: string; dateWritten: string; }
export interface TblReadsResponse { client: string; section: string; period: string; reads: TblRead[]; pending: boolean; sourceFile: string; }
