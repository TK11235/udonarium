export namespace MimeType {
  const types = {
    gif: 'image/gif',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    jpe: 'image/jpeg',
    png: 'image/png',
    apng: 'image/apng',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    svgz: 'image/svg+xml',
    ico: 'image/x-icon',
    cur: 'image/x-icon',
    bmp: 'image/bmp',
    html: 'text/html',
    htm: 'text/html',
    shtml: 'text/html',
    xml: 'text/xml',
    yml: 'text/yaml',
    yaml: 'text/yaml',
    json: 'application/json',
    map: 'application/json',
    zip: 'application/zip',
    mp3: 'audio/mp3',
    wav: 'audio/wav',
    m4a: 'audio/aac',
    ogg: 'audio/ogg',
    mpg: 'video/mpeg',
    mpeg: 'video/mpeg',
    mp4: 'video/mp4',
    webm: 'video/webm'
  };

  export function type(fileName: string): string {
    let ext = fileName.replace(/.*[\.\/\\]/, '').toLowerCase();
    return types[ext] ? types[ext] : '';
  }

  export function extension(mimeType: string): string {
    for (let key in types) {
      if (types[key] === mimeType) {
        return key;
      }
    }
    return mimeType.split('/')[1];
  }
}