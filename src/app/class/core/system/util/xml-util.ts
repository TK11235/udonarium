export namespace XmlUtil {
  export function xml2element(xml: string) {
    let domParser: DOMParser = new DOMParser();
    let xmlDocument: Document = null;
    try {
      xmlDocument = domParser.parseFromString(xml, 'application/xml');
      if (xmlDocument.getElementsByTagName('parsererror').length) {
        xmlDocument = null;
      }
    } catch (error) {
      console.error(error);
    }
    if (!xmlDocument) {
      console.error('XMLのパースに失敗しました');
      return null;
    }
    return xmlDocument.documentElement;
  }

  export function encodeEntityReference(string: string): string {
    return string.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  export function decodeEntityReference(string: string): string {
    return string.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '\"').replace(/&amp;/g, '&');
  }
}