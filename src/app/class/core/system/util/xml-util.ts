export namespace XmlUtil {
  export function xml2element(xml: string) {
    let domParser: DOMParser = new DOMParser();
    let xmlDocument: Document = null;
    try {
      xmlDocument = domParser.parseFromString(xml, 'application/xml');
      let parsererror = xmlDocument.getElementsByTagName('parsererror');
      if (parsererror.length) {
        console.error('XMLのパースに失敗しました', xmlDocument.documentElement);
        xmlDocument = null;
      }
    } catch (error) {
      console.error(error);
    }
    return xmlDocument ? xmlDocument.documentElement : null;
  }

  export function encodeEntityReference(string: string): string {
    return string.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  export function decodeEntityReference(string: string): string {
    return string.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '\"').replace(/&amp;/g, '&');
  }
}