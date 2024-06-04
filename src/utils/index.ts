export function makeID(length: number) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() *
            charactersLength));
    }
    return result;
}

export function getFileExtension(file_name: string) {
    const fileNameChunks = file_name.split(".")
    return fileNameChunks[fileNameChunks.length - 1]
}