import { Readable } from "stream";
import LocalFile from "../entities/localfile.entity";

export abstract class S3Storage {
    client: any
    public async downloadFile(localfile: LocalFile): Promise<Readable> { return }
    public uploadFile(localfile: LocalFile, dataBuffer: Buffer) { }
    public async deleteFile(localfile: LocalFile) { }
    public createBucketIfNotExists(name: string) { }
}